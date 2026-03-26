// src/services/emailService.js
import apiClient from '../api/axiosConfig';

/**
 * Бүх кампанит ажлуудын жагсаалт авах
 * GET /api/emails/campaigns/
 */
export const getCampaigns = async (params = {}) => {
  const response = await apiClient.get('/api/emails/campaigns/', { params });
  return response.data;
};

/**
 * Шинэ кампанит ажил үүсгэх
 * POST /api/emails/campaigns/
 */
export const createCampaign = async (data) => {
  const response = await apiClient.post('/api/emails/campaigns/', data);
  return response.data;
};

/**
 * Кампанит ажлын дэлгэрэнгүй мэдээлэл авах
 * GET /api/emails/campaigns/{id}/
 */
export const getCampaign = async (id) => {
  const response = await apiClient.get(`/api/emails/campaigns/${id}/`);
  return response.data;
};

/**
 * Кампанит ажил шинэчлэх
 * PATCH /api/emails/campaigns/{id}/
 */
export const updateCampaign = async (id, data) => {
  const response = await apiClient.patch(`/api/emails/campaigns/${id}/`, data);
  return response.data;
};

/**
 * Кампанит ажил устгах
 * DELETE /api/emails/campaigns/{id}/
 */
export const deleteCampaign = async (id) => {
  const response = await apiClient.delete(`/api/emails/campaigns/${id}/`);
  return response.data;
};

/**
 * Туршилтын имэйл илгээх
 * POST /api/emails/campaigns/{id}/send_test/
 */
export const sendTestEmail = async (id, email) => {
  const response = await apiClient.post(`/api/emails/campaigns/${id}/send_test/`, { email });
  return response.data;
};

/**
 * Кампанит ажил илгээх
 * POST /api/emails/campaigns/{id}/send/
 */
export const sendCampaign = async (id) => {
  const response = await apiClient.post(`/api/emails/campaigns/${id}/send/`);
  return response.data;
};

/**
 * Кампанит ажлын хүлээн авагчдын жагсаалт
 * GET /api/emails/campaigns/{id}/recipients/
 */
export const getCampaignRecipients = async (id, status = null) => {
  const params = status ? { status } : {};
  const response = await apiClient.get(`/api/emails/campaigns/${id}/recipients/`, { params });
  return response.data;
};

/**
 * Хүлээн авагчдын урьдчилсан тоо
 * GET /api/emails/campaigns/{id}/preview_recipients/
 */
export const previewRecipients = async (id) => {
  const response = await apiClient.get(`/api/emails/campaigns/${id}/preview_recipients/`);
  return response.data;
};

/**
 * Имэйл шүүлтүүрт ашиглах клубуудын жагсаалт
 * GET /api/emails/clubs/
 */
export const getClubsForEmail = async () => {
  const response = await apiClient.get('/api/emails/clubs/');
  return response.data;
};
