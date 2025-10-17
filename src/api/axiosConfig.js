// frontend/src/api/axiosConfig.js

import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000', // API-ийн үндсэн хаяг
});

// Request Interceptor
// Энэ функц API дуудахаас ӨМНӨ ажиллана
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken'); // localStorage-аас токеноо авна
        if (token) {
            // Хэрэв токен байвал Authorization header-т нэмнэ
            config.headers['Authorization'] = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;