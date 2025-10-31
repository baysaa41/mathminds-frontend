// frontend/src/services/apiService.js (ТҮР ЗАСВАРЛАСАН)

import apiClient from '../api/axiosConfig.js';

const apiService = {
    // ... (getUserProfile функц хэвээрээ) ...
    getUserProfile: async (username) => {
        try {
            const response = await apiClient.get(`/users/api/profile/${username}/`);
            return response.data;
        } catch (error) {
            console.error("Failed to get user profile:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Профайл ачаалахад алдаа гарлаа');
            }
        }
    },

    /**
     * Хэрэглэгчийн профайлыг шинэчлэх.
     */
    updateUserProfile: async (profileData) => {

        console.log('DEBUG: Шинэчлэх хүсэлт илгээж байна...', profileData);

        try {
            const response = await apiClient.put('/users/api/profile/update/', profileData);

            // (!!!) Хэрэв энд хүрвэл 200 OK ирсэн гэсэн үг
            console.log('DEBUG: Серверээс 200 OK хариу ирлээ:', response);

            // (!!!) Яг энд алдаа гарч магадгүй (interceptor-с болж)
            console.log('DEBUG: response.data-г буцааж байна:', response.data);

            return response.data; // Шинэчлэгдсэн user object-г буцаана

        } catch (error) {

            // (!!!) АЛДАА ЭНД БАРЬЖ АВЧ БАЙНА
            console.error("Failed to update user profile (apiService catch block):", error);

            // Алдааны талаар илүү дэлгэрэнгүй мэдээлэл хэвлэх
            if (error.response) {
                // Сервер 4xx, 5xx алдаа буцаасан
                console.error('DEBUG: Error Response Data:', error.response.data);
                console.error('DEBUG: Error Response Status:', error.response.status);
                throw error.response.data;
            } else if (error.request) {
                // Хүсэлт илгээгдсэн ч хариу ирээгүй
                console.error('DEBUG: No response received:', error.request);
                throw new Error('Серверээс хариу ирсэнгүй');
            } else {
                // Хүсэлтийг тохируулах үед алдаа гарсан
                console.error('DEBUG: Axios setup error:', error.message);
                throw new Error(error.message || 'Профайл шинэчлэхэд алдаа гарлаа');
            }
        }
    },

    // ========================================
    // FOLLOW / UNFOLLOW API МЕТОДУУД
    // ========================================

    /**
     * Хэрэглэгчийг дагах
     * @param {string} username - Дагах хэрэглэгчийн username
     * @returns {Promise<Object>} - {detail: string, is_following: boolean}
     */
    followUser: async (username) => {
        try {
            const response = await apiClient.post(`/users/api/users/${username}/follow/`);
            return response.data;
        } catch (error) {
            console.error("Failed to follow user:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Хэрэглэгчийг дагахад алдаа гарлаа');
            }
        }
    },

    /**
     * Хэрэглэгчийг дагахаа болих
     * @param {string} username - Дагахаа болих хэрэглэгчийн username
     * @returns {Promise<Object>} - {detail: string, is_following: boolean}
     */
    unfollowUser: async (username) => {
        try {
            const response = await apiClient.post(`/users/api/users/${username}/unfollow/`);
            return response.data;
        } catch (error) {
            console.error("Failed to unfollow user:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Дагахаа болихад алдаа гарлаа');
            }
        }
    },

    /**
     * Дагалтын статус шалгах
     * @param {string} username - Шалгах хэрэглэгчийн username
     * @returns {Promise<Object>} - {is_following, is_followed_by, followers_count, following_count}
     */
    checkFollowStatus: async (username) => {
        try {
            const response = await apiClient.get(`/users/api/users/${username}/follow-status/`);
            return response.data;
        } catch (error) {
            console.error("Failed to check follow status:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Follow статус шалгахад алдаа гарлаа');
            }
        }
    },

    /**
     * Хэрэглэгчийн дагагчдын жагсаалт татах
     * @param {string} username - Username
     * @returns {Promise<Array>} - Дагагчдын жагсаалт
     */
    getUserFollowers: async (username) => {
        try {
            const response = await apiClient.get(`/users/api/users/${username}/followers/`);
            return response.data;
        } catch (error) {
            console.error("Failed to get user followers:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Дагагчдын жагсаалт татахад алдаа гарлаа');
            }
        }
    },

    /**
     * Хэрэглэгчийн дагаж буй хүмүүсийн жагсаалт татах
     * @param {string} username - Username
     * @returns {Promise<Array>} - Дагаж буй хүмүүсийн жагсаалт
     */
    getUserFollowing: async (username) => {
        try {
            const response = await apiClient.get(`/users/api/users/${username}/following/`);
            return response.data;
        } catch (error) {
            console.error("Failed to get user following:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            } else {
                throw new Error(error.message || 'Дагаж буй хүмүүсийн жагсаалт татахад алдаа гарлаа');
            }
        }
    },
};

export default apiService;