// src/services/olympiadService.js
// Олимпиад: мэдээлэл, бүртгэл, төлбөр, жагсаалт, админ upload/хэвлэх

import apiClient from '../api/axiosConfig';

const BASE = '/api/olympiads';

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('mn-MN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

// Олимпиадын хугацаа: "эхлэх – дуусах"; нэг өдөр бол дуусах цагийг л
export const fmtRange = (start, end) => {
  if (!start) return '';
  if (!end) return fmtDate(start);
  const sameDay = new Date(start).toDateString() === new Date(end).toDateString();
  return `${fmtDate(start)} – ${sameDay
    ? new Date(end).toLocaleTimeString('mn-MN', { timeStyle: 'short' }) : fmtDate(end)}`;
};

// Ангилал ангиасаа хамаарна: анги хязгааргүй (1–12), ангилал нь анги ≤ дээд хязгаар (өгсөж орж болно),
// эсвэл ангийн хязгааргүй (багш, чөлөөт) ангилал.
export const categoryFitsGrade = (cat, grade) =>
  !cat || cat.grade_from === null || !/^\d+$/.test(String(grade ?? '')) || Number(grade) <= cat.grade_to;

// Ангид хамгийн тохирох ангилал: яг багтах, эс бөгөөс өгсөж орох хамгийн ойрын
export const bestCategoryForGrade = (cats, grade) => {
  if (!cats?.length || !/^\d+$/.test(String(grade ?? ''))) return null;
  const g = Number(grade);
  const graded = cats.filter((c) => c.grade_from !== null);
  return graded.find((c) => g >= c.grade_from && g <= c.grade_to)
    || [...graded].sort((a, b) => a.grade_to - b.grade_to).find((c) => g <= c.grade_to) || null;
};

// API-ийн алдааны хариуг хүнд уншигдах текст болгоно: {error}, {detail}, эсвэл {field: ['...']} → зөвхөн мессежүүд
export const apiErrorText = (data, fallback = 'Алдаа гарлаа') => {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const flat = (v) => (Array.isArray(v) ? v.flatMap(flat) : v && typeof v === 'object' ? Object.values(v).flatMap(flat) : [v]);
  const msgs = flat(data).filter((m) => typeof m === 'string' && m.trim());
  return msgs.length ? msgs.join(' ') : fallback;
};

// Бүртгэлийн төлөв → [Badge өнгө, шошго]
export const REG_STATUS = {
  PENDING: ['warning', 'Төлбөр хүлээгдэж буй'],
  PAID: ['success', 'Баталгаажсан'],
  CANCELED: ['secondary', 'Цуцлагдсан'],
};

export const getOlympiads = async () => (await apiClient.get(`${BASE}/`)).data;
// skipCache: my_registration/төлбөрийн төлөв үйлдлийн дараа шууд шинэчлэгдэх ёстой
export const getOlympiad = async (slug) => (await apiClient.get(`${BASE}/${slug}/`, { skipCache: true })).data;
export const getRoster = async (slug) => (await apiClient.get(`${BASE}/${slug}/roster/`)).data;
// Тухайн олимпиадад өөрийгөө болон өөрийн бүртгүүлсэн хүмүүсийн бүртгэл
export const getOlympiadMyRegistrations = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/my-registrations/`)).data;
export const getMyRegistrations = async () => (await apiClient.get(`${BASE}/my-registrations/`)).data;

export const registerForOlympiad = async (slug, payload) =>
  (await apiClient.post(`${BASE}/${slug}/register/`, payload)).data;

// ── Сурагчид (StudentProfile) ───────────────────────────────────────────────
// Имэйл эсвэл MMO ID-аар сурагч хайх — нэр далдлагдсан:
// [{id (MMO-оос бол null), source: 'profile'|'mmo', mmo_id, masked_name, grade, school, phone_tail, already_registered}]
export const lookupStudents = async (slug, query) =>
  (await apiClient.post(`${BASE}/${slug}/students/lookup/`, { query }, { skipCache: true })).data;
export const getMyStudents = async () => (await apiClient.get(`${BASE}/my-students/`, { skipCache: true })).data;
export const getStudent = async (id) => (await apiClient.get(`${BASE}/students/${id}/`, { skipCache: true })).data;
export const updateStudent = async (id, payload) => (await apiClient.patch(`${BASE}/students/${id}/`, payload)).data;
// Шинэ link илгээнэ (өмнөх link-үүд хүчингүй болно)
export const resendRegistrationLink = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/resend-link/`)).data;

// ── Имэйлийн link (token) ба «Миний олимпиадууд» ────────────────────────────
// Token-ийг URL-д биш body-д илгээнэ (сервер лог-д үлдэхгүй)
export const getRegistrationAccess = async (token) => (await apiClient.post(`${BASE}/access/`, { token })).data;
export const claimRegistrationAccess = async (token) =>
  (await apiClient.post(`${BASE}/access/claim/`, { token })).data;
export const getMeRegistrations = async () =>
  (await apiClient.get(`${BASE}/me/registrations/`, { skipCache: true })).data;
export const getMeRegistration = async (id) =>
  (await apiClient.get(`${BASE}/me/registrations/${id}/`, { skipCache: true })).data;
// Бүртгэлийн хугацаанд зөвхөн анги, ангилалыг засна: {grade, olympiad_category}
export const updateMeRegistration = async (id, payload) =>
  (await apiClient.patch(`${BASE}/me/registrations/${id}/`, payload)).data;

// QPay нэхэмжлэх үүсгэнэ -> { qpay_data, local_invoice_id } (PaymentModal-д дамжуулна)
export const payRegistration = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/pay/`)).data;

// Сонгосон бүртгэлүүдийн төлбөрийг нэг нэхэмжлэхээр → { qpay_data, local_invoice_id, amount, count }
export const payRegistrationsBulk = async (registrationIds) =>
  (await apiClient.post(`${BASE}/registrations/pay-bulk/`, { registration_ids: registrationIds })).data;

// Админ: бүртгэл засах (ангилалуудын хамт буцаана) / жагсаалтаас хасах (CANCELED)
export const getAdminRegistration = async (id) =>
  (await apiClient.get(`${BASE}/registrations/${id}/admin/`, { skipCache: true })).data;
export const updateAdminRegistration = async (id, payload) =>
  (await apiClient.patch(`${BASE}/registrations/${id}/admin/`, payload)).data;
export const removeAdminRegistration = async (id) => apiClient.delete(`${BASE}/registrations/${id}/admin/`);

// Админ: төлбөр хүлээгдэж буй бүртгэлийг төлбөрөөс чөлөөлж баталгаажуулна
export const approveRegistration = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/approve/`)).data;

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

export const createOlympiad = async (payload) => (await apiClient.post(`${BASE}/`, payload)).data;
export const updateOlympiad = async (slug, payload) =>
  (await apiClient.patch(`${BASE}/${slug}/`, payload)).data;

// Бүртгэлтэй бол нуух ({deleted:false, hidden:true}), үгүй бол устгана ({deleted:true})
export const deleteOlympiad = async (slug) => (await apiClient.delete(`${BASE}/${slug}/`)).data;

// Маягтыг бөглөх өгөгдөл. mmo_id өгөөгүй бол өөрийн профайл (энгийн хэрэглэгч зөвхөн өөрийнхийг авна)
export const getPrefill = async (mmoId) =>
  (await apiClient.get(`${BASE}/prefill/`, { params: mmoId ? { mmo_id: mmoId } : {} })).data;

// Сайтын ангийн сонголтууд [{value, label}] — hooks/useSiteGrades-ээр ашиглана
export const getSiteGrades = async () => (await apiClient.get(`${BASE}/grades/`)).data;

// MMO-ийн аймаг/дүүргийн нэрсийн жагсаалт (хоосон бол MMO-той холбогдож чадаагүй)
export const getProvinces = async () => (await apiClient.get(`${BASE}/provinces/`)).data;
