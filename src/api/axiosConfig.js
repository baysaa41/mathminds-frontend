// frontend/src/api/axiosConfig.js (БҮРЭН ЗАСВАРЛАСАН)

import axios from 'axios';
import authService from '../services/authService';

const apiClient = axios.create({
    baseURL: 'https://api.mathminds.club',
    //baseURL: 'http://127.0.0.1:8000', // API-ийн үндсэн хаяг
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Request Interceptor (Замаас баригч)
 * Хүсэлт бүрийн ӨМНӨ ажиллана.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            // SimpleJWT нь "Bearer" схем ашигладаг
            config.headers['Authorization'] = `Bearer ${token}`;
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
        return response; // Шууд буцаана
    },
    // 2. Алдаатай хариу (4xx, 5xx status)
    async (error) => {
        const originalRequest = error.config;

        // 401 (Unauthorized) алдаа гарсан,
        // Энэ нь анхны оролдлого (retry хийгдээгүй) бол
        if (error.response.status === 401 && !originalRequest._retry) {

            originalRequest._retry = true; // Дахин оролдлого гэдгийг тэмдэглэнэ

            // Хэрэв токен сэргээх хүсэлт өөрөө 401-р буцвал (refresh token хугацаа дууссан)
            // шууд logout хийнэ.
            if (originalRequest.url === '/users/api/token/refresh/') {
                console.error("Refresh token is invalid, logging out.");
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
                console.error("Token refresh failed:", refreshError);
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