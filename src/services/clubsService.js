// src/services/clubsService.js
// ✅ ШИНЭЧИЛСЭН: getMyClubs функц нэмэгдсэн.

import apiClient from '../api/axiosConfig';

/**
 * Бүх клубуудын жагсаалт авах (ClubsList.jsx-д зориулагдсан)
 * GET /api/clubs/
 */
export const getClubs = async (params = {}) => {
    try {
        console.log('📥 Fetching ALL clubs from /api/clubs/', { params });
        const response = await apiClient.get('/api/clubs/', { params });
        console.log('✅ All clubs fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching all clubs:', error);
        throw error;
    }
};

// -----------------------------------------------------------------
// ✅ ШИНЭЭР НЭМСЭН ФУНКЦ
// -----------------------------------------------------------------
/**
 * Зөвхөн хэрэглэгчийн клубуудыг авах (ClubsMine.jsx-д зориулагдсан)
 * GET /api/clubs/my_clubs/
 */
export const getMyClubs = async (params = {}) => {
    try {
        console.log('📥 Fetching MY clubs from /api/clubs/my_clubs/', { params });
        const response = await apiClient.get('/api/clubs/my_clubs/', { params });
        console.log('✅ My clubs fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching my clubs:', error);
        throw error;
    }
};


/**
 * Клубын дэлгэрэнгүй мэдээлэл авах
 * GET /api/clubs/:id/
 */
export const getClubDetail = async (clubId) => {
    try {
        console.log(`📥 Fetching club detail: ${clubId}`);
        const response = await apiClient.get(`/api/clubs/${clubId}/`);
        console.log('✅ Club detail fetched:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching club detail:', error);
        throw error;
    }
};

/**
 * Шинэ клуб үүсгэх
 * POST /api/clubs/
 */
export const createClub = async (clubData) => {
    try {
        console.log('📤 Creating club:', clubData);
        const response = await apiClient.post('/api/clubs/', clubData);
        console.log('✅ Club created:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error creating club:', error);
        throw error;
    }
};

/**
 * Клуб засварлах
 * PATCH /api/clubs/:id/
 */
export const updateClub = async (clubId, clubData) => {
    try {
        console.log(`📤 Updating club ${clubId}:`, clubData);
        const response = await apiClient.patch(`/api/clubs/${clubId}/`, clubData);
        console.log('✅ Club updated:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error updating club:', error);
        throw error;
    }
};

/**
 * Бүртгэлийн кодоор клубт элсэх
 * POST /api/clubs/join/
 */
export const joinClub = async (regCode) => {
    try {
        console.log('📤 Joining club with code:', regCode);
        const response = await apiClient.post('/api/clubs/join/', {
            reg_code: regCode
        });
        console.log('✅ Joined club:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error joining club:', error);
        throw error;
    }
};

/**
 * Клубээс гарах
 * DELETE /api/clubs/:id/leave/
 */
export const leaveClub = async (clubId) => {
    try {
        console.log(`📤 Leaving club: ${clubId}`);
        const response = await apiClient.delete(`/api/clubs/${clubId}/leave/`);
        console.log('✅ Left club:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error leaving club:', error);
        throw error;
    }
};

/**
 * Алдааны мессежийг форматлах helper функц
 */
export const formatErrorMessage = (error) => {
    console.error('Error details:', error);

    // HTML буцаж ирсэн тохиолдол
    if (error.response?.data && typeof error.response.data === 'string') {
        if (error.response.data.includes('<!DOCTYPE') || error.response.data.includes('<html')) {
            return 'Backend-с буруу хариу ирлээ. Django server ажиллаж байгаа эсэхийг шалгана уу.';
        }
    }

    // Django REST Framework error format
    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    if (error.response?.data?.detail) {
        return error.response.data.detail;
    }

    // Field validation errors
    if (error.response?.data) {
        const errors = error.response.data;
        const errorMessages = [];

        for (const field in errors) {
            if (Array.isArray(errors[field])) {
                errorMessages.push(`${field}: ${errors[field].join(', ')}`);
            } else if (typeof errors[field] === 'string') {
                errorMessages.push(`${field}: ${errors[field]}`);
            }
        }

        if (errorMessages.length > 0) {
            return errorMessages.join('\n');
        }
    }

    // Network алдаа
    if (error.message === 'Network Error') {
        return 'Сүлжээний алдаа. Backend server ажиллаж байгаа эсэхийг шалгана уу (http://127.0.0.1:8000)';
    }

    if (error.message) {
        return error.message;
    }

    return 'Алдаа гарлаа. Дахин оролдоно уу.';
};

// Default export
const clubsService = {
    getClubs,
    getMyClubs, // <-- Нэмэгдсэн
    getClubDetail,
    createClub,
    updateClub,
    joinClub,
    leaveClub,
    formatErrorMessage
};

export default clubsService;