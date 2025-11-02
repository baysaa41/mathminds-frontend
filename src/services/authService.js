// src/services/authService.js (БҮРЭN ЗАСВАРЛАСАН)

// (!!!) ШИНЭЭР НЭМЭХ: axiosConfig-г импортлоно
import apiClient from '../api/axiosConfig.js';

const MMO_CONFIG = {
    // ... (Энэ хэсэг хэвээрээ)
    clientId: 'nzkWGrkfUnGyeyerGo3XkZlRKlhmSTnVmGcYJWC9',
    authorizationUrl: 'https://www.mmo.mn/o/authorize/',
    tokenUrl: 'https://www.mmo.mn/o/token/',
    redirectUri: 'http://localhost:5173/callback',
    scope: 'profile',
};

// const BACKEND_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = 'https://api.mathminds.club';

// (!!!) ШИНЭ ХЭСЭГ: Token сэргээх үеийн "цоож"
// Олон хүсэлт зэрэг 401 буцаах үед бүгд refresh хийхээс сэргийлнэ
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
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
            console.log('🔐 Starting login...');
            const { codeVerifier, codeChallenge } = await this.generatePKCE();
            const state = this.generateState();
            sessionStorage.setItem('code_verifier', codeVerifier);
            sessionStorage.setItem('oauth_state', state);
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
            console.log('🔗 Redirecting to:', authUrl);
            window.location.href = authUrl;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    // ... (Callback шийдэх хэвээрээ) ...
    async handleCallback(code, state) {
        const savedState = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('code_verifier');
        console.log('  Saved state:', savedState);
        console.log('  Saved verifier:', codeVerifier ? codeVerifier.slice(0, 20) + '...' : 'null');
        console.log('='.repeat(60));
        if (!savedState) {
            console.error('❌ No saved state in sessionStorage!');
            throw new Error('Session expired. Please log in again.');
        }
        if (state !== savedState) {
            console.error('❌ State mismatch!');
            console.error('  Expected:', savedState);
            console.error('  Received:', state);
            throw new Error('Invalid state parameter. Please try logging in again.');
        }
        console.log('✅ State verified!');
        if (!codeVerifier) {
            console.error('❌ No code verifier!');
            throw new Error('Missing code verifier. Please try logging in again.');
        }
        try {
            const response = await fetch(`${BACKEND_URL}/users/api/exchange-code/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    code_verifier: codeVerifier,
                    redirect_uri: MMO_CONFIG.redirectUri
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to exchange code');
            }
            const data = await response.json();
            console.log('✅ Backend response received:');
            console.log('  Token:', data.token ? data.token.slice(0, 20) + '...' : 'null');
            console.log('  User data:', data.user);
            localStorage.setItem('access_token', data.token);
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('oauth_state');
            console.log('✅ Login successful!');
            return { user: data.user, token: data.token };
        } catch (error) {
            console.error('❌ Callback error:', error);
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('oauth_state');
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
            console.log("No refresh token available, logging out.");
            this.logout();
            isRefreshing = false;
            return Promise.reject(new Error("No refresh token"));
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
            console.error("Refresh token failed or expired", error);
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
            console.log('ℹ️ No access token found');
            return null;
        }

        try {
            console.log('👤 Verifying token with backend...');

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
            console.error('❌ Get user error (after refresh attempt):', error);

            // (!!!) `this.logout()`-г эндээс хасна.
            // Logout-г `refreshToken` функц эсвэл `interceptor` өөрөө хариуцна.
            // Сүлжээний алдаа гарсан ч logout хийхгүй байх нь дээр.

            return null;
        }
    }

    // Logout
    logout() {
        console.log('🚪 Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('code_verifier');
        sessionStorage.removeItem('oauth_state');
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