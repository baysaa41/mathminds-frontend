// src/services/productsService.js
// Бүтээгдэхүүн, сагс, сэтгэгдлийн API үйлчилгээ

import apiClient from '../api/axiosConfig';

/**
 * Бүтээгдэхүүнүүдийг авах
 */
export const getProducts = async () => {
  try {
    const response = await apiClient.get('/api/v1/products/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Бүтээгдэхүүн татахад алдаа:', error);
    throw error;
  }
};

/**
 * Бүтээгдэхүүний дэлгэрэнгүй мэдээлэл
 */
export const getProductDetail = async (productId) => {
  try {
    const response = await apiClient.get(`/api/v1/products/${productId}/`);
    return response.data;
  } catch (error) {
    console.error('Бүтээгдэхүүний дэлгэрэнгүй татахад алдаа:', error);
    throw error;
  }
};

/**
 * Сагсанд бүтээгдэхүүн нэмэх
 */
export const addToCart = async (productId, quantity = 1) => {
  try {
    const response = await apiClient.post('/api/v1/cart/add/', {
      product_id: productId,
      quantity: quantity,
    });
    return response.data;
  } catch (error) {
    console.error('Сагсанд нэмэхэд алдаа:', error);
    throw error;
  }
};

/**
 * Хэрэглэгчийн сагс авах
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get('/api/v1/cart/');
    return response.data;
  } catch (error) {
    console.error('Сагс татахад алдаа:', error);
    throw error;
  }
};

/**
 * Сагсны зүйлийн тоо ширхэг өөрчлөх
 */
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await apiClient.patch(`/api/v1/cart/items/${itemId}/`, {
      quantity: quantity,
    });
    return response.data;
  } catch (error) {
    console.error('Сагсны зүйл шинэчлэхэд алдаа:', error);
    throw error;
  }
};

/**
 * Сагснаас зүйл устгах
 */
export const removeCartItem = async (itemId) => {
  try {
    const response = await apiClient.delete(`/api/v1/cart/items/${itemId}/`);
    return response.data;
  } catch (error) {
    console.error('Сагснаас устгахад алдаа:', error);
    throw error;
  }
};

/**
 * Бүтээгдэхүүний сэтгэгдлүүд
 */
export const getProductReviews = async (productId) => {
  try {
    const response = await apiClient.get(`/api/v1/products/${productId}/reviews/`);
    return response.data.results || response.data;
  } catch (error) {
    console.error('Сэтгэгдэл татахад алдаа:', error);
    throw error;
  }
};

/**
 * Сэтгэгдэл үүсгэх
 */
export const createReview = async (productId, rating, comment) => {
  try {
    const response = await apiClient.post('/api/v1/reviews/', {
      product: productId,
      rating: rating,
      comment: comment,
    });
    return response.data;
  } catch (error) {
    console.error('Сэтгэгдэл үүсгэхэд алдаа:', error);
    throw error;
  }
};

/**
 * Checkout
 */
export const checkout = async (paymentMethod) => {
  try {
    const response = await apiClient.post('/api/v1/purchases/checkout/', {
      payment_method: paymentMethod,
    });
    return response.data;
  } catch (error) {
    console.error('Төлбөр төлөхөд алдаа:', error);
    throw error;
  }
};

/**
 * Худалдан авалтын түүх
 */
export const getPurchases = async () => {
  try {
    const response = await apiClient.get('/api/v1/purchases/');
    return response.data.results || response.data;
  } catch (error) {
    console.error('Худалдан авалтын түүх татахад алдаа:', error);
    throw error;
  }
};

/**
 * ===== ГИШҮҮНЧЛЭЛИЙН API ФУНКЦҮҮД =====
 */

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
