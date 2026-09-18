// frontend/src/api/axiosConfig.js (БҮРЭН ЗАСВАРЛАСАН)

import axios from 'axios';
import authService from '../services/authService';
import * as cache from './apiCache';

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
      'convert-to-mc-in-place',
      'regenerate-eesh-solution',
      'improve',
      'generate_weekly_article',
      'explain-wrong-choice',
      'hint-solution',
    ];
    const LONG_AI_ENDPOINTS = [
      'solver/turn',
      'solver/collab',
    ];
    if (LONG_AI_ENDPOINTS.some((ep) => config.url?.includes(ep))) {
      config.timeout = 180_000;
    } else if (AI_ENDPOINTS.some((ep) => config.url?.includes(ep))) {
      config.timeout = 120_000;
    } else if (!config.timeout) {
      config.timeout = 30_000;
    }

    // --- Console лог (зөвхөн dev) ---
    // Production дээр хүсэлт бүрийг лог хийвэл 30с poll × олон таб үед
    // тасралтгүй I/O болж, консол дүүрдэг.
    if (import.meta.env.DEV) {
      const method = (config.method || 'GET').toUpperCase()
      const url = (config.baseURL || '') + (config.url || '')
      const isPoll = config.url?.includes('/poll')
      if (isPoll) {
        console.debug(`[API poll] ${method} ${url}`)
      } else {
        console.log(`[API] ${method} ${url}`, config.data || '')
      }
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
    // Бичилт (POST/PATCH/DELETE) амжилттай болмогц холбогдох GET кэшийг
    // stale тэмдэглэж, харагдаж байгаа компонентуудыг фон дээр шинэчилнэ.
    if ((response.config?.method || 'get').toLowerCase() !== 'get') {
      cache.markFamilyStale(response.config?.url);
      cache.revalidateSubscribed();
    }

    if (import.meta.env.DEV) {
      const method = (response.config.method || 'GET').toUpperCase()
      const url = response.config.url || ''
      const isPoll = url.includes('/poll')
      if (isPoll) {
        console.debug(`[API poll] ← ${response.status} ${url}`, response.data)
      } else {
        console.log(`[API] ← ${response.status} ${method} ${url}`)
      }
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
        // Хуудсыг дахин ачаалж, нэвтрэх хуудас руу шилжүүлнэ.
        // '/callback'-с шилжүүлэхгүй — тэнд MMO-гийн code солилцож байгаа.
        if (window.location.pathname !== '/callback') {
          window.location.replace('/login');
        }
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
        if (window.location.pathname !== '/login' && window.location.pathname !== '/callback') {
          window.location.replace('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    // 401-с бусад алдааг шууд буцаана
    return Promise.reject(error);
  }
);

/**
 * Кэш давхарга — GET хариуг browser дээр хадгалж, stale-while-revalidate.
 *
 * Interceptor биш, `apiClient.get`-ийг шууд дарж бичсэн нь санаатай:
 * axios v1-д request interceptor-оос response буцааж хүсэлтийг
 * богиносгох боломжгүй (`dispatchRequest` дахин ажиллана). `rawGet` нь
 * хэвийн замыг (timeout, 401 → refresh → retry) бүрэн хэвээр үлдээнэ.
 */
const rawGet = apiClient.get.bind(apiClient);

function sameJSON(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Жинхэнэ axios хариуны дуураймал — хэрэглэгчид зөвхөн `.data` хэрэгтэй. */
function syntheticResponse(entry, config) {
  return {
    data: entry.data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    request: null,
    fromCache: true,
  };
}

/**
 * Сүлжээнээс татаж кэшэд бичнэ. Нэгэн зэрэг ижил хүсэлт явбал (StrictMode-ийн
 * 2× эффект, олон компонент) нэг л хүсэлт хуваалцана.
 */
function fetchAndCache(url, config, key) {
  return cache.shareInflight(key, () =>
    rawGet(url, config).then((res) => {
      const prev = cache.peek(key);
      cache.set(key, res.data, cache.pathOf(url));
      cache.remember(key, url, config);
      // Зөвхөн өөрчлөгдсөн бол — дэмий re-render хийхгүй
      if (prev && !sameJSON(prev.data, res.data)) cache.emit(key, res.data);
      return res;
    })
  );
}

/** Фон дээрх шинэчлэлт — алдааг залгина (401-ийг interceptor шийднэ). */
function revalidate(url, config, key) {
  fetchAndCache(url, config, key).catch(() => {});
}

cache.setRevalidateHandler(revalidate);

apiClient.get = (url, config = {}) => {
  if (!cache.isCacheable(url, config)) return rawGet(url, config);

  const key = cache.cacheKey(url, config);
  const hit = cache.get(key);

  if (hit && !cache.isExpired(hit)) {
    cache.remember(key, url, config);
    // Хуучирсан бол хариуг хүлээлгүй фон дээр шинэчилнэ
    if (cache.isStale(hit)) revalidate(url, config, key);
    return Promise.resolve(syntheticResponse(hit, config));
  }

  return fetchAndCache(url, config, key);
};

export default apiClient;
