// src/services/authService.js (БҮРЭN ЗАСВАРЛАСАН)

// (!!!) ШИНЭЭР НЭМЭХ: axiosConfig-г импортлоно
import apiClient from '../api/axiosConfig.js';
import apiCache from '../api/apiCache.js';

const MMO_CONFIG = {
  clientId: import.meta.env.VITE_MMO_CLIENT_ID || 'REDACTED_MMO_CLIENT_ID',
  authorizationUrl: import.meta.env.VITE_MMO_AUTH_URL || 'https://www.mmo.mn/o/authorize/',
  tokenUrl: import.meta.env.VITE_MMO_TOKEN_URL || 'https://www.mmo.mn/o/token/',
  redirectUri: import.meta.env.VITE_MMO_REDIRECT_URI || 'http://localhost:5173/callback',
  scope: import.meta.env.VITE_MMO_SCOPE || 'profile',
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// (!!!) ШИНЭ ХЭСЭГ: Token сэргээх үеийн "цоож"
// Олон хүсэлт зэрэг 401 буцаах үед бүгд refresh хийхээс сэргийлнэ
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

class AuthService {
  // ... (PKCE helper функцууд хэвээрээ) ...
  async generatePKCE() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const codeVerifier = this.base64URLEncode(array);
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = this.base64URLEncode(new Uint8Array(hashBuffer));
    return { codeVerifier, codeChallenge };
  }
  base64URLEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // ... (Login эхлүүлэх хэвээрээ) ...
  async login() {
    try {
      // ✅ MMO.mn PKCE шаарддаг тул БУЦААЖ НЭМСЭН
      const { codeVerifier, codeChallenge } = await this.generatePKCE();
      const state = this.generateState();

      // MMO руу шилжиж буцахдаа in-app browser эсвэл шинэ tab дээр
      // sessionStorage алга болдог тул localStorage-д хадгална.
      localStorage.setItem('code_verifier', codeVerifier);
      localStorage.setItem('oauth_state', state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: MMO_CONFIG.clientId,
        redirect_uri: MMO_CONFIG.redirectUri,
        scope: MMO_CONFIG.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
      });

      const authUrl = `${MMO_CONFIG.authorizationUrl}?${params.toString()}`;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // ... (Callback шийдэх хэвээрээ) ...
  async handleCallback(code, state) {
    // Ижил code-г хоёр дахин солилцохгүй. Компонент дахин mount болох,
    // эсвэл хэрэглэгч буцах/урагшлах товч дарахад энэ функц дахин
    // ажиллаж, аль хэдийн устсан oauth_state-ийг олоогүй "Session expired"
    // гэж алдаа харуулдаг байсан — гэтэл нэвтрэлт амжилттай болсон байсан.
    if (code && localStorage.getItem('oauth_last_code') === code && this.isAuthenticated()) {
      return { user: this.getUser(), token: this.getToken() };
    }

    const savedState = localStorage.getItem('oauth_state');
    const codeVerifier = localStorage.getItem('code_verifier');

    if (!savedState) {
      throw new Error('Session expired. Please log in again.');
    }
    if (state !== savedState) {
      throw new Error('Invalid state parameter. Please try logging in again.');
    }

    if (!codeVerifier) {
      throw new Error('Missing code verifier. Please try logging in again.');
    }

    try {
      // ✅ code_verifier буцааж илгээх (PKCE шаардлагатай)
      const response = await fetch(`${BACKEND_URL}/users/api/exchange-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: MMO_CONFIG.redirectUri,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend exchange-code error:', errorData);
        throw new Error(errorData.error || 'Failed to exchange code');
      }
      const data = await response.json();
      // Шинэ session эхэлж байна — өмнөх хэрэглэгчийн кэшлэгдсэн GET
      // хариу үлдвэл шинэ хэрэглэгчид харагдах эрсдэлтэй.
      apiCache.clearAll();
      localStorage.setItem('access_token', data.token);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('oauth_last_code', code);
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('oauth_state');
      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Callback error:', error);
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('oauth_state');
      throw error;
    }
  }

  // (!!!) ШИНЭ ФУНКЦ: refreshToken
  async refreshToken() {
    // Хэрэв өөр хүсэлт аль хэдийн токен сэргээж байвал
    if (isRefreshing) {
      // Энэ хүсэлтийг "оочерт" оруулж, шинэ токен ирэхийг хүлээнэ
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    isRefreshing = true; // Цоожлох
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      this.logout();
      isRefreshing = false;
      return Promise.reject(new Error('No refresh token'));
    }

    try {
      // (!!!) Энд `apiClient` БИШ, `fetch` (эсвэл шинэ axios instance) ашиглах ёстой.
      // Учир нь `apiClient` нь өөрөө `refreshToken`-г дуудах interceptor-той тул
      // эцэс төгсгөлгүй давталт (infinite loop) үүсгэнэ.
      const response = await fetch(`${BACKEND_URL}/users/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newAccessToken = data.access; // SimpleJWT "access" гэж буцаадаг

      localStorage.setItem('access_token', newAccessToken);

      // Зарим тохиргоо (ROTATE_REFRESH_TOKENS=True) шинэ refresh токен буцаадаг
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      // `apiClient`-н дараагийн хүсэлтүүдэд ашиглагдах default толгойг шинэчлэх
      apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;

      processQueue(null, newAccessToken); // Хүлээлгэнд байсан хүсэлтүүдийг ажиллуулах
      return newAccessToken;
    } catch (error) {
      console.error('Refresh token failed or expired', error);
      this.logout(); // Refresh токен алдаатай тул системээс гаргана
      processQueue(error, null); // Хүлээлгэнд байсан хүсэлтүүдийг цуцлах
      return Promise.reject(error);
    } finally {
      isRefreshing = false; // Цоожийг тайлах
    }
  }

  // (!!!) ЗАСВАРЛАСАН ФУНКЦ: getCurrentUser
  async getCurrentUser() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    try {
      // (!!!) `fetch`-ийн оронд `apiClient`-г ашиглана
      // Ингэснээр 401 алдаа гарвал `axiosConfig.js` дахь interceptor
      // автоматаар токен сэргээхийг оролдоно.
      const response = await apiClient.get('/users/api/current-user/');

      // Interceptor амжилттай болсон бол энд хүрнэ
      const data = response.data;

      // Хэрэглэгчийн мэдээллийг localStorage-д шинэчлэх
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Get user error (after refresh attempt):', error);

      // (!!!) `this.logout()`-г эндээс хасна.
      // Logout-г `refreshToken` функц эсвэл `interceptor` өөрөө хариуцна.
      // Сүлжээний алдаа гарсан ч logout хийхгүй байх нь дээр.

      return null;
    }
  }

  // Logout
  logout() {
    // Кэш нь хэрэглэгчийн өгөгдлийг localStorage-д хадгалдаг тул заавал
    // устгана. 401 → refresh → retry зам болон refreshToken-ийн уналт ч
    // энэ функцээр ордог тул бүх гарах замыг хамарна.
    apiCache.clearAll();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('oauth_last_code');
    // code_verifier / oauth_state-ийг энд устгахгүй: тэдгээр нь яг одоо
    // явагдаж буй MMO нэвтрэлтийн гарааны мэдээлэл бөгөөд хуучин
    // session-ий logout-оос болж устаж болохгүй.
  }

  // Нэвтэрсэн эсэхийг шалгах
  isAuthenticated() {
    const hasToken = !!localStorage.getItem('access_token');
    return hasToken;
  }

  // Token авах
  getToken() {
    return localStorage.getItem('access_token');
  }

  // Хэрэглэгч авах
  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }
    try {
      const user = JSON.parse(userStr);
      return user;
    } catch (error) {
      console.error('❌ Error parsing user:', error);
      return null;
    }
  }

  // (!!!) -----------------------------------------------
  // (!!!) --- ХЭРЭГЛЭГЧИЙН ХҮССЭН ШИНЭ ФУНКЦ ---
  // (!!!) -----------------------------------------------
  /**
   * Хэрэглэгчийн мэдээллийг localStorage-д шинэчлэх.
   * (Профайл зассаны дараа AuthContext-с дуудагдана)
   * @param {object} newUserData - Шинэчлэгдсэн хэрэглэгчийн объект
   */
  updateUser(newUserData) {
    if (!newUserData) {
      console.warn('authService.updateUser: null эсвэл undefined мэдээлэл хүлээн авлаа.');
      return;
    }
    try {
      // localStorage дахь 'user' түлхүүрийг шинэ мэдээллээр дарж бичнэ
      localStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error) {
      console.error('localStorage-д хэрэглэгчийн мэдээллийг шинэчлэхэд алдаа гарлаа:', error);
    }
  }
}

export default new AuthService();
