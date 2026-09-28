// src/services/authService.js (БҮРЭN ЗАСВАРЛАСАН)

import apiClient from '../api/axiosConfig.js';
import apiCache from '../api/apiCache.js';
import {
  getToken,
  getUser,
  isAuthenticated,
  setAccessToken,
  setRefreshToken,
  setUser,
} from '../api/tokenStore.js';
import { hardLogout, refreshAccessToken } from '../api/tokenRefresh.js';

const MMO_CONFIG = {
  clientId: import.meta.env.VITE_MMO_CLIENT_ID || 'REDACTED_MMO_CLIENT_ID',
  authorizationUrl: import.meta.env.VITE_MMO_AUTH_URL || 'https://www.mmo.mn/o/authorize/',
  tokenUrl: import.meta.env.VITE_MMO_TOKEN_URL || 'https://www.mmo.mn/o/token/',
  redirectUri: import.meta.env.VITE_MMO_REDIRECT_URI || 'http://localhost:5173/callback',
  scope: import.meta.env.VITE_MMO_SCOPE || 'profile',
};

const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  // MMO-той адил /callback хуудсыг ашиглана (provider-ийг localStorage-д тэмдэглэнэ)
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/callback`,
  scope: 'openid email profile',
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

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
      localStorage.setItem('oauth_provider', 'mmo');

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

  isGoogleConfigured() {
    return !!GOOGLE_CONFIG.clientId;
  }

  // Google нэвтрэх / бүртгүүлэх (хэрэглэгч байхгүй бол backend шинээр үүсгэнэ)
  async loginWithGoogle() {
    const { codeVerifier, codeChallenge } = await this.generatePKCE();
    const state = this.generateState();
    localStorage.setItem('code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_provider', 'google');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      scope: GOOGLE_CONFIG.scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      prompt: 'select_account',
    });
    window.location.href = `${GOOGLE_CONFIG.authorizationUrl}?${params.toString()}`;
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

    const isGoogle = localStorage.getItem('oauth_provider') === 'google';
    const exchangeUrl = isGoogle ? 'exchange-google-code' : 'exchange-code';
    const redirectUri = isGoogle ? GOOGLE_CONFIG.redirectUri : MMO_CONFIG.redirectUri;

    try {
      // ✅ code_verifier буцааж илгээх (PKCE шаардлагатай)
      const response = await fetch(`${BACKEND_URL}/users/api/${exchangeUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
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
      setAccessToken(data.token);
      if (data.refresh) {
        setRefreshToken(data.refresh);
      }
      setUser(data.user);
      localStorage.setItem('oauth_last_code', code);
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_provider');
      return { user: data.user, token: data.token };
    } catch (error) {
      console.error('Callback error:', error);
      localStorage.removeItem('code_verifier');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_provider');
      throw error;
    }
  }

  // Бодит логик нь `api/tokenRefresh.js`-д — тэр модуль нь `apiClient`-г
  // импортлохгүй тул 401 → refresh → retry давталт үүсэхгүй.
  async refreshToken() {
    return refreshAccessToken();
  }

  async getCurrentUser() {
    const token = getToken();
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
      setUser(data);
      return data;
    } catch (error) {
      console.error('Get user error (after refresh attempt):', error);

      // (!!!) `this.logout()`-г эндээс хасна.
      // Logout-г `refreshToken` функц эсвэл `interceptor` өөрөө хариуцна.
      // Сүлжээний алдаа гарсан ч logout хийхгүй байх нь дээр.

      return null;
    }
  }

  // Logout — кэш нь хэрэглэгчийн өгөгдлийг localStorage-д хадгалдаг тул
  // заавал хамт устгана (tokenRefresh.hardLogout дотор).
  // code_verifier / oauth_state-ийг энд устгахгүй: тэдгээр нь яг одоо
  // явагдаж буй MMO нэвтрэлтийн гарааны мэдээлэл бөгөөд хуучин
  // session-ий logout-оос болж устаж болохгүй.
  logout() {
    hardLogout();
  }

  isAuthenticated() {
    return isAuthenticated();
  }

  getToken() {
    return getToken();
  }

  getUser() {
    return getUser();
  }

  /**
   * Хэрэглэгчийн мэдээллийг localStorage-д шинэчлэх.
   * (Профайл зассаны дараа AuthContext-с дуудагдана)
   * @param {object} newUserData - Шинэчлэгдсэн хэрэглэгчийн объект
   */
  updateUser(newUserData) {
    setUser(newUserData);
  }
}

export default new AuthService();
