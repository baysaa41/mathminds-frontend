// frontend/src/services/notificationService.js
import apiClient from '../api/axiosConfig';

/**
 * Notification API Service
 * Мэдэгдлийн системтэй ажиллах функцууд
 */

/**
 * Хэрэглэгчийн бүх мэдэгдлүүдийг авах
 * @param {number} page - Хуудасны дугаар
 * @returns {Promise} Мэдэгдлүүдийн жагсаалт
 */
export const getNotifications = async (page = 1) => {
  const response = await apiClient.get(`/api/minds/notifications/?page=${page}`);
  return response.data;
};

/**
 * Уншаагүй мэдэгдлийн тоог авах
 * @returns {Promise<number>} Уншаагүй мэдэгдлийн тоо
 */
export const getUnreadCount = async () => {
  const response = await apiClient.get('/api/minds/notifications/unread_count/');
  return response.data.count;
};

/**
 * Бүх мэдэгдлийг уншсан болгох
 * @returns {Promise} Response
 */
export const markAllAsRead = async () => {
  const response = await apiClient.post('/api/minds/notifications/mark_all_as_read/');
  return response.data;
};

/**
 * Нэг мэдэгдлийг уншсан болгох
 * @param {number} notificationId - Мэдэгдлийн ID
 * @returns {Promise} Response
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.post(`/api/minds/notifications/${notificationId}/mark_as_read/`);
  return response.data;
};

export const getPrivateMessagesCount = async () => {
  const response = await apiClient.get('/api/minds/notifications/private-messages-count/');
  return response.data.count;
};

export default {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  getPrivateMessagesCount,
};
