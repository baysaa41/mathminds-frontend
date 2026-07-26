// frontend/src/services/integralService.js
import apiClient from '../api/axiosConfig';

/**
 * "Миний өдөр" — сурагчийн нэгдсэн dashboard мэдээлэл
 * @param {string} subject - math|physics|chemistry|biology
 */
export const getStudentDashboard = async (subject = 'math') => {
  const response = await apiClient.get('/api/integral/student-dashboard/', {
    params: { subject },
  });
  return response.data;
};

/**
 * Давталтын статистик (due_today/due_week/total)
 */
export const getReviewStats = async () => {
  const response = await apiClient.get('/api/integral/review/stats/');
  return response.data;
};
