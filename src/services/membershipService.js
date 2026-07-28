// src/services/membershipService.js
// Гишүүнчлэл, endowment-ийн API үйлчилгээ (users app: /users/api/membership/...)
// `productsService.js`-ээс энд шилжүүлсэн — өөр backend app руу заадаг тул тусад нь.

import apiClient from '../api/axiosConfig';

/**
 * Гишүүнчлэлийн дэлгэрэнгүй мэдээлэл
 */
export const getMembershipSummary = async () => {
  try {
    const response = await apiClient.get('/users/api/membership/summary/');
    return response.data;
  } catch (error) {
    console.error('Гишүүнчлэлийн мэдээлэл татахад алдаа:', error);
    throw error;
  }
};

/**
 * Гишүүнчлэлийн худалдаж авалтын түүх
 */
export const getMembershipPurchases = async () => {
  try {
    const response = await apiClient.get('/users/api/membership/purchases/');
    return response.data;
  } catch (error) {
    console.error('Гишүүнчлэлийн худалдаж авалт татахад алдаа:', error);
    throw error;
  }
};

/**
 * Гишүүнчлэлийн худалдаж авалт он сараар
 */
export const getMembershipPurchasesByMonth = async () => {
  try {
    const response = await apiClient.get('/users/api/membership/purchases/by-month/');
    return response.data;
  } catch (error) {
    console.error('Он сараар бүлэглэсэн худалдаж авалт татахад алдаа:', error);
    throw error;
  }
};

/**
 * Гишүүнчлэлийн үлдэгдэл мэдээлэл
 */
export const getMembershipRemaining = async () => {
  try {
    const response = await apiClient.get('/users/api/membership/remaining/');
    return response.data;
  } catch (error) {
    console.error('Үлдэгдэл мэдээлэл татахад алдаа:', error);
    throw error;
  }
};

/**
 * Хамгийн өндөр гишүүнчлэлийг идэвхжүүлэх
 */
export const applyHighestMembership = async () => {
  try {
    const response = await apiClient.post('/users/api/membership/apply-highest/');
    return response.data;
  } catch (error) {
    console.error('Хамгийн өндөр эрх идэвхжүүлэхэд алдаа:', error);
    throw error;
  }
};

/**
 * Ганц бүтээгдэхүүн (жишээ нь гишүүнчлэл) QPay-аар шууд худалдаж авах нэхэмжлэх үүсгэх
 * (Cart биш — MembershipPlansPage-ийн "Худалдаж авах" товч үүнийг дуудна)
 */
export const createMembershipInvoice = async (productId) => {
  try {
    const response = await apiClient.post('/api/v1/payments/create-invoice/', {
      product_id: productId,
    });
    return response.data;
  } catch (error) {
    console.error('Нэхэмжлэх үүсгэхэд алдаа:', error);
    throw error;
  }
};

/**
 * Хэрэглэгчийн endowment ("360 гишүүнчлэл") төлөв
 */
export const getEndowmentStatus = async () => {
  try {
    const response = await apiClient.get('/users/api/membership/endowment/');
    return response.data;
  } catch (error) {
    console.error('Endowment мэдээлэл татахад алдаа:', error);
    throw error;
  }
};

/**
 * Endowment цуцлах хүсэлт гаргах (зөвхөн дуусахаас 30 хоногийн өмнөх цонход)
 */
export const requestEndowmentCancellation = async () => {
  try {
    const response = await apiClient.post('/users/api/membership/endowment/request-cancellation/');
    return response.data;
  } catch (error) {
    console.error('Endowment цуцлах хүсэлт гаргахад алдаа:', error);
    throw error;
  }
};

/**
 * Endowment-ийг бүрмөсөн хандив болгож хугацаагүй VIP эрх авах
 */
export const convertEndowmentToVip = async () => {
  try {
    const response = await apiClient.post('/users/api/membership/endowment/convert-to-vip/');
    return response.data;
  } catch (error) {
    console.error('VIP болгож хөрвүүлэхэд алдаа:', error);
    throw error;
  }
};
