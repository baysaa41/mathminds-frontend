// src/services/clubAssignmentService.js
// Клубын даалгавар, хариу, дүн (endpoint namespace: /api/club-assignments/).
// `clubsService.js`-ээс энд шилжсэн.

import apiClient from '../api/axiosConfig';

export const getAssignments = async (clubId) => {
  const response = await apiClient.get('/api/club-assignments/', { params: { club: clubId } });
  return response.data;
};

export const createAssignment = async (clubId, data) => {
  return apiClient.post('/api/club-assignments/', { ...data, club: clubId }).then(r => r.data);
};

export const updateAssignment = async (id, data) => {
  return apiClient.patch(`/api/club-assignments/${id}/`, data).then(r => r.data);
};

export const deleteAssignment = async (id) => {
  return apiClient.delete(`/api/club-assignments/${id}/`).then(r => r.data);
};

export const startAssignment = async (assignmentId) => {
  return apiClient.post(`/api/club-assignments/${assignmentId}/start/`).then(r => r.data);
};

export const getMySubmission = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/my_submission/`).then(r => r.data);
};

export const getSubmissions = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/submissions/`).then(r => r.data);
};

export const getAssignmentProgress = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/progress/`).then(r => r.data);
};

export const gradeSubmission = async (assignmentId, data) => {
  return apiClient.post(`/api/club-assignments/${assignmentId}/grade_submission/`, data).then(r => r.data);
};
