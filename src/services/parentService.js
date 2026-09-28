// frontend/src/services/parentService.js
import apiClient from '../api/axiosConfig';

/**
 * Сурагчийн эцэг эхтэй холбогдох урилгын код авах (шаардлагатай бол шинээр үүсгэнэ)
 */
export const getParentLinkCode = async () => {
  const response = await apiClient.get('/users/api/parent/link-code/');
  return response.data;
};

/**
 * Эцэг эх сурагчийн кодоор холбогдох
 */
export const linkChild = async (code) => {
  const response = await apiClient.post('/users/api/parent/link/', { code });
  return response.data;
};

/**
 * Эцэг эхтэй холбогдсон хүүхдүүдийн жагсаалт
 */
export const getChildren = async () => {
  const response = await apiClient.get('/users/api/parent/children/');
  return response.data;
};

/**
 * Хүүхэдтэй холбоосыг цуцлах
 */
export const unlinkChild = async (username) => {
  await apiClient.delete(`/users/api/parent/children/${username}/`);
};

/**
 * Холбогдсон хүүхдийн "Миний өдөр" датаг зөвхөн уншиж харах
 */
export const getChildDashboard = async (username, subject = 'math') => {
  const response = await apiClient.get(
    `/api/integral/parent/child-dashboard/${username}/`,
    { params: { subject } },
  );
  return response.data;
};

/**
 * Хүүхдийн явцын тайлан: сонгосон сарын өдрийн бодлого, клубын даалгаврын (сорилго)
 * сар бүрийн дүн, сэдвийн чадварын радар
 * @param {string} month - 'YYYY-MM' (хоосон бол энэ сар)
 */
export const getChildReport = async (username, { subject = 'math', month } = {}) => {
  const response = await apiClient.get(`/api/integral/parent/child-report/${username}/`, {
    params: { subject, month },
  });
  return response.data;
};
