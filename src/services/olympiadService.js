// src/services/olympiadService.js
// Олимпиад: мэдээлэл, бүртгэл, төлбөр, жагсаалт, админ upload/хэвлэх

import apiClient from '../api/axiosConfig';

const BASE = '/api/olympiads';

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('mn-MN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

export const getOlympiads = async () => (await apiClient.get(`${BASE}/`)).data;
export const getOlympiad = async (slug) => (await apiClient.get(`${BASE}/${slug}/`)).data;
export const getRoster = async (slug) => (await apiClient.get(`${BASE}/${slug}/roster/`)).data;
export const getMyRegistrations = async () => (await apiClient.get(`${BASE}/my-registrations/`)).data;

export const registerForOlympiad = async (slug, payload) =>
  (await apiClient.post(`${BASE}/${slug}/register/`, payload)).data;

// QPay нэхэмжлэх үүсгэнэ -> { qpay_data, local_invoice_id } (PaymentModal-д дамжуулна)
export const payRegistration = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/pay/`)).data;

// ── Админ ────────────────────────────────────────────────────────────────────
export const generateSheets = async (slug) =>
  (await apiClient.post(`${BASE}/${slug}/admin/generate-sheets/`)).data;

export const getPrintSheets = async (slug, markPrinted = false) =>
  (await apiClient.get(`${BASE}/${slug}/admin/sheets/`, {
    params: markPrinted ? { mark_printed: 1 } : {},
  })).data;

export const uploadSheetImages = async (slug, files, onProgress) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return (await apiClient.post(`${BASE}/${slug}/admin/upload/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded * 100) / e.total)),
  })).data;
};

export const getUploadedImages = async (slug, unmatchedOnly = false) =>
  (await apiClient.get(`${BASE}/${slug}/admin/uploads/`, {
    params: unmatchedOnly ? { unmatched: 1 } : {},
  })).data;
