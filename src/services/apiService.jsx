// frontend/src/services/apiService.js (ШИНЭ ФАЙЛ)

import authService from './authService'; // authService.js байгаа гэж үзлээ

const BASE_URL = '/'; // Таны Django API-ийн URL (proxy-той бол /)

const getAuthHeaders = () => {
    const token = authService.getAuthToken(); // Эсвэл localStorage-с авдаг бол түүнийг ашиглана
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const handleResponse = async (response) => {
    if (response.ok) {
        return response.json();
    }
    // 401 (Unauthorized) бол logout хийх
    if (response.status === 401) {
        authService.logout();
        window.location.href = '/login';
    }
    const errorData = await response.json();
    throw new Error(errorData.detail || 'API алдаа гарлаа');
};

const apiService = {
    /**
     * Username-ээр нь хэрэглэгчийн мэдээллийг авна
     */
    getUserProfile: async (username) => {
        const response = await fetch(`${BASE_URL}api/profile/${username}/`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // ... (Ирээдүйд бусад API дуудлагууд энд орно) ...
};

export default apiService;