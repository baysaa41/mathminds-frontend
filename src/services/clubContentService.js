// src/services/clubContentService.js
// Клубын контент удирдлага: видео, уулзалт, шалгалт, тест, файл
// (endpoint namespace: /api/club-videos|meetings|exams|quizzes|files/).
// `clubsService.js`-ээс энд шилжсэн.

import apiClient from '../api/axiosConfig';

// -----------------------------------------------------------------
// Video Management Functions
// -----------------------------------------------------------------

/**
 * Шинэ видео нэмэх
 * POST /api/club-videos/
 */
export const createVideoItem = async (clubId, data) => {
  const response = await apiClient.post('/api/club-videos/', {
    ...data,
    club: clubId,
  });
  return response.data;
};

/**
 * Видео засах
 * PATCH /api/club-videos/:id/
 */
export const updateVideoItem = async (id, data) => {
  const response = await apiClient.patch(`/api/club-videos/${id}/`, data);
  return response.data;
};

/**
 * Видео устгах
 * DELETE /api/club-videos/:id/
 */
export const deleteVideoItem = async (id) => {
  const response = await apiClient.delete(`/api/club-videos/${id}/`);
  return response.data;
};

/**
 * Видеог дээш шилжүүлэх
 * POST /api/club-videos/:id/move_up/
 */
export const moveVideoUp = async (id) => {
  const response = await apiClient.post(`/api/club-videos/${id}/move_up/`);
  return response.data;
};

/**
 * Видеог доош шилжүүлэх
 * POST /api/club-videos/:id/move_down/
 */
export const moveVideoDown = async (id) => {
  const response = await apiClient.post(`/api/club-videos/${id}/move_down/`);
  return response.data;
};

// -----------------------------------------------------------------
// Meeting Management Functions
// -----------------------------------------------------------------

export const createMeetingItem = async (clubId, data) => {
  const response = await apiClient.post('/api/club-meetings/', { ...data, club: clubId });
  return response.data;
};

export const updateMeetingItem = async (id, data) => {
  const response = await apiClient.patch(`/api/club-meetings/${id}/`, data);
  return response.data;
};

export const deleteMeetingItem = async (id) => {
  const response = await apiClient.delete(`/api/club-meetings/${id}/`);
  return response.data;
};

// -----------------------------------------------------------------
// Exam Management Functions
// -----------------------------------------------------------------

export const createExamItem = async (clubId, data) => {
  return apiClient.post('/api/club-exams/', { ...data, club: clubId }).then(r => r.data);
};

export const updateExamItem = async (id, data) => {
  return apiClient.patch(`/api/club-exams/${id}/`, data).then(r => r.data);
};

export const deleteExamItem = async (id) => {
  return apiClient.delete(`/api/club-exams/${id}/`).then(r => r.data);
};

// -----------------------------------------------------------------
// Quiz Management Functions
// -----------------------------------------------------------------

export const createQuizItem = async (clubId, data) => {
  return apiClient.post('/api/club-quizzes/', { ...data, club: clubId }).then(r => r.data);
};

export const updateQuizItem = async (id, data) => {
  return apiClient.patch(`/api/club-quizzes/${id}/`, data).then(r => r.data);
};

export const deleteQuizItem = async (id) => {
  return apiClient.delete(`/api/club-quizzes/${id}/`).then(r => r.data);
};

export const moveQuizUp = async (id) => {
  return apiClient.post(`/api/club-quizzes/${id}/move_up/`).then(r => r.data);
};

export const moveQuizDown = async (id) => {
  return apiClient.post(`/api/club-quizzes/${id}/move_down/`).then(r => r.data);
};

// ─── Club Files ───────────────────────────────────────────────────────────────

export const createFileItem = async (formData) => {
  return apiClient.post('/api/club-files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const updateFileItem = async (id, formData) => {
  return apiClient.patch(`/api/club-files/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const deleteFileItem = async (id) => {
  return apiClient.delete(`/api/club-files/${id}/`).then(r => r.data);
};
