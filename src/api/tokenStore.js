// src/api/tokenStore.js
//
// Токен болон хэрэглэгчийн мэдээллийг localStorage-д хадгалах энгийн үйлдлүүд.
//
// Энэ модуль нь `axiosConfig` болон `authService`-д хамт хэрэгтэй байдаг тул
// тусад нь гаргасан: `axiosConfig` → `authService` → `axiosConfig` гэсэн
// дугуй хамаарал үүсэхээс сэргийлнэ. Ямар ч модулийг импортлохгүй.

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
}

export function setUser(user) {
  if (!user) {
    console.warn('tokenStore.setUser: null эсвэл undefined мэдээлэл хүлээн авлаа.');
    return;
  }
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to store user in localStorage:', error);
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('oauth_last_code');
}
