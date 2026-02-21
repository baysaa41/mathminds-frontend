// frontend/src/services/apiService.js (БҮРЭН ЗАСВАРЛАСАН)

import apiClient from '../api/axiosConfig.js';

const apiService = {
  // ...
  getUserProfile: async (username) => {
    try {
      // (!!!) ЗАСВАР: 'users/profile/' -> 'users/api/profile/'
      const response = await apiClient.get(`users/api/profile/${username}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
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
      // (!!!) ЗАСВАР: 'users/profile/update/' -> 'users/api/profile/update/'
      const response = await apiClient.put('users/api/profile/update/', profileData);
      console.log('DEBUG: Серверээс 200 OK хариу ирлээ:', response);
      console.log('DEBUG: response.data-г буцааж байна:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile (apiService catch block):', error);
      if (error.response) {
        console.error('DEBUG: Error Response Data:', error.response.data);
        console.error('DEBUG: Error Response Status:', error.response.status);
        throw error.response.data;
      } else if (error.request) {
        console.error('DEBUG: No response received:', error.request);
        throw new Error('Серверээс хариу ирсэнгүй');
      } else {
        console.error('DEBUG: Axios setup error:', error.message);
        throw new Error(error.message || 'Профайл шинэчлэхэд алдаа гарлаа');
      }
    }
  },

  uploadProfilePicture: async (formData) => {
    try {
      const response = await apiClient.post('users/api/profile/upload-picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Зураг upload хийхэд алдаа гарлаа.');
    }
  },

  // ========================================
  // FOLLOW / UNFOLLOW API МЕТОДУУД
  // ========================================

  /**
   * Хэрэглэгчийг дагах
   */
  followUser: async (username) => {
    try {
      // (!!!) ЗАСВАР: '/users/' -> '/users/api/'
      const response = await apiClient.post(`/users/api/${username}/follow/`);
      return response.data;
    } catch (error) {
      console.error('Failed to follow user:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw new Error(error.message || 'Хэрэглэгчийг дагахад алдаа гарлаа');
      }
    }
  },

  /**
   * Хэрэглэгчийг дагахаа болих
   */
  unfollowUser: async (username) => {
    try {
      // (!!!) ЗАСВАР: '/users/' -> '/users/api/'
      const response = await apiClient.post(`/users/api/${username}/unfollow/`);
      return response.data;
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw new Error(error.message || 'Дагахаа болихад алдаа гарлаа');
      }
    }
  },

  /**
   * Дагалтын статус шалгах
   */
  checkFollowStatus: async (username) => {
    try {
      // (!!!) ЗАСВАР: '/users/' -> '/users/api/'
      const response = await apiClient.get(`/users/api/${username}/follow-status/`);
      return response.data;
    } catch (error) {
      console.error('Failed to check follow status:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw new Error(error.message || 'Follow статус шалгахад алдаа гарлаа');
      }
    }
  },

  /**
   * Хэрэглэгчийн дагагчдын жагсаалт татах
   */
  getUserFollowers: async (username) => {
    try {
      // (!!!) ЗАСВАР: '/users/' -> '/users/api/'
      const response = await apiClient.get(`/users/api/${username}/followers/`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user followers:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw new Error(error.message || 'Дагагчдын жагсаалт татахад алдаа гарлаа');
      }
    }
  },

  /**
   * Хэрэглэгчийн дагаж буй хүмүүсийн жагсаалт татах
   */
  getUserFollowing: async (username) => {
    try {
      // (!!!) ЗАСВАР: '/users/' -> '/users/api/'
      const response = await apiClient.get(`/users/api/${username}/following/`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user following:', error);
      if (error.response && error.response.data) {
        throw error.response.data;
      } else {
        throw new Error(error.message || 'Дагаж буй хүмүүсийн жагсаалт татахад алдаа гарлаа');
      }
    }
  },
};

export default apiService;
