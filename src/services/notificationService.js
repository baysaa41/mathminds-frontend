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
export const getNotifications = async (page = 1, type = null) => {
  const params = { page };
  if (type) params.type = type;
  const response = await apiClient.get('/api/minds/notifications/', { params });
  return response.data;
};

/**
 * Badge-үүдийн тоог нэг хүсэлтээр авах.
 * Урьд нь unread_count + private-messages-count гэсэн хоёр тусдаа
 * 30 секундын poll байсан.
 * @returns {Promise<{unread: number, private_messages: number}>}
 */
export const getNotificationSummary = async () => {
  const response = await apiClient.get('/api/minds/notifications/summary/');
  return response.data;
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

/**
 * Олон мэдэгдлийг (grouped) нэгэн зэрэг уншсан болгох
 * @param {number[]} notificationIds - Мэдэгдлийн ID-үүд
 */
export const markGroupAsRead = async (notificationIds) => {
  if (!notificationIds?.length) return;
  await apiClient.post('/api/minds/notifications/mark_many_as_read/', {
    ids: notificationIds,
  });
};

export default {
  getNotifications,
  getNotificationSummary,
  markAllAsRead,
  markAsRead,
  markGroupAsRead,
};
