// frontend/src/api/axiosConfig.js (БҮРЭН ЗАСВАРЛАСАН)

import axios from 'axios';
import authService from '../services/authService';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  //baseURL: 'https://api.mathminds.club',
  headers: {
    'X-CSRFToken': getCookie('csrftoken'),
  },
});

/**
 * Request Interceptor (Замаас баригч)
 * Хүсэлт бүрийн ӨМНӨ ажиллана.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // (!!!) FormData үед Content-Type-г огт тохируулахгүй
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      // Бусад үед (JSON) 'application/json' гэж тохируулж болно
      config.headers['Content-Type'] = 'application/json';
    }

    // AI endpoint-уудад урт timeout (120 сек)
    const AI_ENDPOINTS = [
      'generate_ai_solution',
      'generate-ai-solution',
      'generate_solution_note',
      'generate-ai-content',
      'convert_to_mc',
      'improve',
      'generate_weekly_article',
    ];
    if (AI_ENDPOINTS.some((ep) => config.url?.includes(ep))) {
      config.timeout = 120_000;
    } else if (!config.timeout) {
      config.timeout = 30_000;
    }

    // --- Console лог ---
    const method = (config.method || 'GET').toUpperCase()
    const url = (config.baseURL || '') + (config.url || '')
    const isPoll = config.url?.includes('/poll')
    if (isPoll) {
      console.debug(`[API poll] ${method} ${url}`)
    } else {
      console.log(`[API] ${method} ${url}`, config.data || '')
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * (!!!) ШИНЭ ХЭСЭГ: Response Interceptor (Хариуг баригч)
 * API-аас хариу ирсний ДАРАА ажиллана.
 */
apiClient.interceptors.response.use(
  // 1. Амжилттай хариу (2xx status)
  (response) => {
    const method = (response.config.method || 'GET').toUpperCase()
    const url = response.config.url || ''
    const isPoll = url.includes('/poll')
    if (isPoll) {
      console.debug(`[API poll] ← ${response.status} ${url}`, response.data)
    } else {
      console.log(`[API] ← ${response.status} ${method} ${url}`)
    }
    return response;
  },
  // 2. Алдаатай хариу (4xx, 5xx status)
  async (error) => {
    if (error?.config) {
      const method = (error.config.method || 'GET').toUpperCase()
      const url = error.config.url || ''
      const status = error.response?.status || 'network error'
      console.warn(`[API] ✗ ${status} ${method} ${url}`, error.response?.data || error.message)
    }
    const originalRequest = error.config;

    // 401 (Unauthorized) алдаа гарсан,
    // Энэ нь анхны оролдлого (retry хийгдээгүй) бол
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Дахин оролдлого гэдгийг тэмдэглэнэ

      // Хэрэв токен сэргээх хүсэлт өөрөө 401-р буцвал (refresh token хугацаа дууссан)
      // шууд logout хийнэ.
      if (originalRequest.url === '/users/api/token/refresh/') {
        console.error('Refresh token is invalid, logging out.');
        authService.logout();
        // Хуудсыг дахин ачаалж, нэвтрэх хуудас руу шилжүүлнэ
        window.location.replace('/login');
        return Promise.reject(error);
      }

      try {
        // (!!!) Шинэ access token авахыг оролдоно
        const newAccessToken = await authService.refreshToken();

        // Шинэ токеноо localStorage-д хадгалсан (authService дотор)
        // Одоо бүтэлгүйтсэн анхны хүсэлтийн толгойг шинэчилнэ
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

        // (!!!) Анхны хүсэлтийг шинэ токентойгоор ДАХИН ДУУДНА
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh хийх үед алдаа гарвал (authService.refreshToken дотор logout хийгдсэн)
        // хэрэглэгчийг нэвтрэх хуудас руу шилжүүлнэ.
        console.error('Token refresh failed:', refreshError);
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    // 401-с бусад алдааг шууд буцаана
    return Promise.reject(error);
  }
);

export default apiClient;
