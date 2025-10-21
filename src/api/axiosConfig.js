// frontend/src/api/axiosConfig.js (БҮРЭН ЗАСВАРЛАСАН)

import axios from 'axios';
// (Энэ замын зөв эсэхийг шалгаарай. Ихэвчлэн ../services/authService.js байдаг)
import authService from '../services/authService';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000', // API-ийн үндсэн хаяг
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Request Interceptor (Замаас баригч)
 * Энэ функц `apiClient.get()`, `apiClient.post()` гэх мэт дуудлага
 * БҮРИЙН ӨМНӨ ажиллана.
 */
apiClient.interceptors.request.use(
    (config) => {
        // 1. authService-с одоогийн токеныг авна
        // Энэ нь localStorage-с 'access_token'-г уншина
        const token = authService.getToken();

        if (token) {
            // 2. Хэрэв токен байвал 'Authorization' толгойг тохируулна
            // SimpleJWT нь "Bearer" схем ашигладаг
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 3. Тохируулсан config-г буцаан, хүсэлтийг үргэлжлүүлнэ
        return config;
    },
    (error) => {
        // Хүсэлтийн алдааг буцаах
        return Promise.reject(error);
    }
);

export default apiClient;