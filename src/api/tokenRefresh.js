// src/api/tokenRefresh.js
//
// Access token-ийг refresh token-оор сэргээх логик. `axiosConfig`-ийн 401
// interceptor болон `authService.refreshToken()` хоёулаа эндээс дуудна.
//
// `apiClient`-г импортлохгүй — хэрэв импортловол `axiosConfig` → `tokenRefresh`
// → `axiosConfig` гэсэн дугуй хамаарал үүснэ. Тиймээс энд `fetch` ашиглана
// (мөн apiClient-ийн 401 interceptor дахин дуудагдах эрсдэлгүй).

import apiCache from './apiCache.js';
import { clearTokens, getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Олон хүсэлт зэрэг 401 буцаах үед бүгд refresh хийхээс сэргийлэх "цоож".
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Системээс бүрэн гаргах — токен болон кэшийг устгана.
 * `code_verifier`/`oauth_state`-ийг хөндөхгүй: тэдгээр нь яг одоо явагдаж буй
 * MMO нэвтрэлтийн гарааны мэдээлэл тул хуучин session-ий logout-оос болж
 * устах ёсгүй.
 */
export function hardLogout() {
  apiCache.clearAll();
  clearTokens();
}

/**
 * Access token сэргээх. Аль хэдийн refresh явагдаж байвал түүний үр дүнг
 * хүлээнэ (single-flight) — зэрэгцээ хүсэлтүүд нэг л refresh хийнэ.
 * @returns {Promise<string>} шинэ access token
 */
export async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    hardLogout();
    isRefreshing = false;
    return Promise.reject(new Error('No refresh token'));
  }

  try {
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

    setAccessToken(newAccessToken);

    // Зарим тохиргоо (ROTATE_REFRESH_TOKENS=True) шинэ refresh токен буцаадаг
    if (data.refresh) {
      setRefreshToken(data.refresh);
    }

    processQueue(null, newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Refresh token failed or expired', error);
    hardLogout();
    processQueue(error, null);
    return Promise.reject(error);
  } finally {
    isRefreshing = false;
  }
}
