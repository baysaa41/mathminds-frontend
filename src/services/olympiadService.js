// src/services/olympiadService.js
// Олимпиад: мэдээлэл, бүртгэл, төлбөр, жагсаалт, админ upload/хэвлэх

import apiClient from '../api/axiosConfig';
import { formatDateTime, formatTime } from '../utils/dateFormatter';

const BASE = '/api/olympiads';

// Browser-уудад 'mn-MN' locale байхгүй тул англиар гардаг — гараар форматлана: 2026-09-28 22:00
export const fmtDate = (iso) => formatDateTime(iso);

// Одооноос хүртэлх хугацаа: "15 хоног 4 цаг", "5 цаг", "20 минут"
export const timeUntil = (iso, now = Date.now()) => {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return '';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} минут`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} хоног ${restHours} цаг` : `${days} хоног`;
};

// Хугацааны үргэлжлэл: "2 цаг 30 минут" — эхлэх/дуусах хоёулаа байвал
export const fmtDuration = (start, end) => {
  if (!start || !end) return '';
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours) parts.push(`${hours} цаг`);
  if (rest) parts.push(`${rest} минут`);
  return parts.join(' ');
};

// Ангилалын шошго: ангийн хязгаар нь нэрээс өөр бол хаалтанд хавсаргана («Ахлах (9–12-р анги)»)
export const categoryLabel = (cat) => {
  if (!cat) return '';
  if (cat.grade_from === null || cat.grade_to === null) return cat.name;
  const auto = cat.grade_from === cat.grade_to
    ? `${cat.grade_from}-р анги` : `${cat.grade_from}–${cat.grade_to}-р анги`;
  return cat.name === auto ? cat.name : `${cat.name} (${auto})`;
};

// Бүртгэлийн төлөв: {text, variant} — "Бүртгэл дуусахад 15 хоног үлдлээ" гэх мэт
export const registrationCountdown = (start, end, now = Date.now()) => {
  if (now < new Date(start).getTime()) {
    return { text: `Бүртгэл эхлээгүй · эхлэхэд ${timeUntil(start, now)}`, variant: 'info', state: 'not_started' };
  }
  if (now <= new Date(end).getTime()) {
    const left = timeUntil(end, now);
    const soon = new Date(end).getTime() - now < 3 * 24 * 3600 * 1000;  // 3 хоногоос бага — анхааруулна
    return { text: `Бүртгэл дуусахад ${left} үлдлээ`, variant: soon ? 'danger' : 'success', state: 'open' };
  }
  return { text: 'Бүртгэл дууссан', variant: 'secondary', state: 'ended' };
};

// Олимпиадын хугацаа: "эхлэх – дуусах"; нэг өдөр бол дуусах цагийг л
export const fmtRange = (start, end) => {
  if (!start) return '';
  if (!end) return fmtDate(start);
  const sameDay = new Date(start).toDateString() === new Date(end).toDateString();
  return `${fmtDate(start)} – ${sameDay
    ? formatTime(end) : fmtDate(end)}`;
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
// Имэйл эсвэл MMO ID-аар сурагч хайх — бүтэн нэр, латин нэртэй (бүртгэгч латин нэрийг баталгаажуулна):
// [{id (MMO-оос бол null), source: 'profile'|'mmo', mmo_id, display_name, last_name, first_name, last_name_latin, first_name_latin, grade, school, phone_tail, already_registered}]
// Сонголтын түлхүүр: profile — id (тоо), account — 'user-<id>', MMO — 'mmo-<id>'
export const candidateKey = (c) => c.id ?? (c.user_id ? `user-${c.user_id}` : `mmo-${c.mmo_id}`);
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

// IBAN-ийг 4 оронгоор бүлэглэж харуулна: MN300005005000123456 → "MN30 0005 0050 0012 3456"
export const formatIban = (iban) => String(iban || '').replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');

// Төлбөрийн хүсэлт (components/RegistrationPayment): нэг эсвэл хэд хэдэн бүртгэл
export const paymentRequestFor = (regs) => {
  const list = Array.isArray(regs) ? regs : [regs];
  const t = list.length === 1 ? list[0].bank_transfer : null;
  return {
    ids: list.map((r) => r.id),
    amount: list.reduce((sum, r) => sum + Number(r.fee || 0), 0),
    // Дансаар зөвхөн нэг олимпиадын, данс тохируулсан бүртгэлүүдийг хамт
    bankAvailable: list.every((r) => r.bank_transfer_available) && new Set(list.map((r) => r.olympiad_slug)).size === 1,
    transferId: t && ['AWAITING', 'REJECTED'].includes(t.status) ? t.id : null,
  };
};
// Дансаар шилжүүлсэн, админ шалгаж буй — дахин төлүүлэхгүй
export const transferUnderReview = (r) => r?.bank_transfer?.status === 'SUBMITTED';

// ── Дансаар төлөх ────────────────────────────────────────────────────────────
// Сонгосон бүртгэлүүдэд гүйлгээний утга (OLY-<id>), нийт дүн, дансны мэдээлэл үүсгэнэ
export const createBankTransfer = async (registrationIds) =>
  (await apiClient.post(`${BASE}/registrations/bank-transfer/`, { registration_ids: registrationIds })).data;
export const getBankTransfer = async (id) => (await apiClient.get(`${BASE}/bank-transfers/${id}/`)).data;
// «Шилжүүлсэн» гэж мэдэгдэх — баримт (зураг/PDF) заавал биш
export const submitBankTransfer = async (id, { receipt, note }) => {
  const form = new FormData();
  if (receipt) form.append('receipt', receipt);
  // Хоосон FormData (баримт, тайлбаргүй) хүсэлт сервер хүртэл хүрэхгүй «Network Error» болдог — талбар үргэлж илгээнэ
  form.append('note', note || '');
  return (await apiClient.post(`${BASE}/bank-transfers/${id}/submit/`, form,
    { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};
// Админ: action = 'confirm' | 'reject'
export const reviewBankTransfer = async (id, action, note = '') =>
  (await apiClient.post(`${BASE}/bank-transfers/${id}/${action}/`, { note })).data;
export const getAdminBankTransfers = async (slug, status) =>
  (await apiClient.get(`${BASE}/${slug}/admin/bank-transfers/`, { params: status ? { status } : {} })).data;

// Админ: бүртгэл засах (ангилалуудын хамт буцаана) / жагсаалтаас хасах (CANCELED)
export const getAdminRegistration = async (id) =>
  (await apiClient.get(`${BASE}/registrations/${id}/admin/`, { skipCache: true })).data;
export const updateAdminRegistration = async (id, payload) =>
  (await apiClient.patch(`${BASE}/registrations/${id}/admin/`, payload)).data;
export const removeAdminRegistration = async (id) => apiClient.delete(`${BASE}/registrations/${id}/admin/`);

// Бүртгэсэн багш / эцэг эх төлөгдөөгүй бүртгэлээ цуцална (төлөгдсөнийг зөвхөн админ)
export const cancelRegistration = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/cancel/`)).data;

// Админ: төлбөр хүлээгдэж буй бүртгэлийг төлбөрөөс чөлөөлж баталгаажуулна
export const approveRegistration = async (registrationId) =>
  (await apiClient.post(`${BASE}/registrations/${registrationId}/approve/`)).data;

// ── Админ ────────────────────────────────────────────────────────────────────
// Хуудасны шүүлтүүр: {category, last_name, first_name} — хоосон утгыг илгээхгүй
export const sheetFilterParams = (filters = {}) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => String(v ?? '').trim() !== ''));

// Бодолтын хуудас үүсгэх ажил (серверт xelatex-гүйгээр PDF угсарна): эхлүүлэх → төлөв шалгах → PDF татах
export const startSheetsJob = async (slug, filters) =>
  (await apiClient.post(`${BASE}/${slug}/admin/generate-sheets/`, sheetFilterParams(filters))).data;

export const getSheetsJob = async (slug, job) =>
  (await apiClient.get(`${BASE}/${slug}/admin/generate-sheets/${job}/`, { skipCache: true })).data;

// Үүсгэсэн PDF-г татаж хадгална
export const downloadSheetsPdf = async (slug, job) => {
  const res = await apiClient.get(`${BASE}/${slug}/admin/sheets.pdf`, {
    params: { job }, responseType: 'blob', skipCache: true, timeout: 5 * 60 * 1000,
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-bodoltyn-khuudas.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const uploadSheetImages = async (slug, files, onProgress) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return (await apiClient.post(`${BASE}/${slug}/admin/upload/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // 0 гэвэл axiosConfig-ийн interceptor «тохируулаагүй» гэж үзээд 30с болгодог — олон хуудастай PDF (хуудас бүрийг
    // зураг болгож, QR уншиж, S3-д хадгална) үүнээс удаан тул тодорхой урт хугацаа өгнө
    timeout: 15 * 60 * 1000,
    onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded * 100) / e.total)),
  })).data;
};

// Upload-ын боловсруулалтын явц: {status: PENDING|PROCESSING|DONE|FAILED, total_pages, processed_pages, duplicates,
// total, matched, unmatched, error}
export const getUploadBatch = async (slug, batchId) =>
  (await apiClient.get(`${BASE}/${slug}/admin/uploads/batches/${batchId}/`, { skipCache: true })).data;

export const getUploadedImages = async (slug, unmatchedOnly = false) =>
  (await apiClient.get(`${BASE}/${slug}/admin/uploads/`, {
    params: unmatchedOnly ? { unmatched: 1 } : {},
  })).data;

// Код танигдаагүй хуудсыг гараар холбох: гараар бичсэн овог/нэр/ангиар бүртгэл хайж (filters: category, last_name,
// first_name), зургийг бүртгэл + бодлогод онооно
export const findRegistrations = async (slug, filters) =>
  (await apiClient.get(`${BASE}/${slug}/admin/registrations/`, { params: sheetFilterParams(filters), skipCache: true })).data;

// Шүүлтүүрт тохирсон нийт тоо + эхний 30 нь: {total, results}
export const countRegistrations = async (slug, filters) =>
  (await apiClient.get(`${BASE}/${slug}/admin/registrations/`, { params: { ...sheetFilterParams(filters), with_total: 1 }, skipCache: true })).data;

export const assignImage = async (imageId, registration, problem) =>
  (await apiClient.patch(`${BASE}/admin/images/${imageId}/`, { registration, problem })).data;

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

// ── Оноо, дүн, материал, бодолт хамгаалах ───────────────────────────────────
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };
const toForm = (obj) => {
  const form = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((x) => form.append(k, x));
    else if (v !== undefined && v !== null) form.append(k, v);
  });
  return form;
};

// Оноо: 7 → "7", 6.5 → "6.5", null → "–"
export const fmtScore = (v) => (v === null || v === undefined ? '–' : String(v));

export const DEFENSE_STATUS = {
  SUBMITTED: ['primary', 'Илгээсэн'],
  IN_REVIEW: ['info', 'Хянагдаж буй'],
  ACCEPTED: ['success', 'Хүлээн авсан'],
  REJECTED: ['danger', 'Татгалзсан'],
  WITHDRAWN: ['secondary', 'Цуцалсан'],
};

// Сурагч / эцэг эх (claim хийсэн бүртгэл)
export const getMeScores = async (id) =>
  (await apiClient.get(`${BASE}/me/registrations/${id}/scores/`, { skipCache: true })).data;
export const getMeResults = async (id) =>
  (await apiClient.get(`${BASE}/me/registrations/${id}/results/`, { skipCache: true })).data;
export const getMeMaterials = async (id) =>
  (await apiClient.get(`${BASE}/me/registrations/${id}/materials/`, { skipCache: true })).data;
export const getMeDefenseRequests = async (id) =>
  (await apiClient.get(`${BASE}/me/registrations/${id}/defense-requests/`, { skipCache: true })).data;
// {problem_no, reason, images: File[] ≤3}
export const createDefenseRequest = async (id, payload) =>
  (await apiClient.post(`${BASE}/me/registrations/${id}/defense-requests/`, toForm(payload), multipart)).data;
export const withdrawDefenseRequest = async (requestId) =>
  (await apiClient.delete(`${BASE}/me/defense-requests/${requestId}/`)).data;

// Ноорог хуудсыг бодлого руу шилжүүлэх хүсэлт (оролцогч) + админы шийдвэр
export const createSheetMoveRequest = async (registrationId, { image, problem_no, note }) =>
  (await apiClient.post(`${BASE}/me/registrations/${registrationId}/sheet-move-requests/`, { image, problem_no, note })).data;
export const withdrawSheetMoveRequest = async (requestId) =>
  (await apiClient.delete(`${BASE}/me/sheet-move-requests/${requestId}/`)).data;
export const getAdminSheetMoveRequests = async (slug, status = 'PENDING') =>
  (await apiClient.get(`${BASE}/${slug}/admin/sheet-move-requests/`, { params: { status }, skipCache: true })).data;
export const decideSheetMoveRequest = async (requestId, decision, admin_note = '') =>
  (await apiClient.post(`${BASE}/admin/sheet-move-requests/${requestId}/decide/`, { decision, admin_note })).data;

// Нийтэд нээлттэй материал (олимпиадын хуудсанд)
export const getPublicMaterials = async (slug) => (await apiClient.get(`${BASE}/${slug}/materials/`)).data;

// Админ: оноо
export const getAdminScores = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/admin/scores/`, { skipCache: true })).data;
// changes: [{registration_id, problem_no, score}] — score '' бол устгана
export const saveAdminScores = async (slug, changes) =>
  (await apiClient.put(`${BASE}/${slug}/admin/scores/`, { scores: changes })).data;
// Алдаатай үед 400 + {errors: [{line, error}]} — алдааг дуудагч талд харуулна
export const importScoresCsv = async (slug, file, dryRun) =>
  (await apiClient.post(`${BASE}/${slug}/admin/scores/import/`, toForm({ file, dry_run: dryRun ? '1' : '0' }),
    { ...multipart, validateStatus: (s) => s === 200 || s === 400 })).data;
export const publishResults = async (slug, publish, defenseWindowHours) =>
  (await apiClient.post(`${BASE}/${slug}/admin/publish-results/`,
    { publish, defense_window_hours: defenseWindowHours })).data;
// Нэг бодлогын дээд оноо (тавьсан онооноос бага болгохгүй)
export const setMaxScore = async (slug, maxScore) =>
  (await apiClient.post(`${BASE}/${slug}/admin/max-score/`, { max_score: maxScore })).data;
export const getAdminResults = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/admin/results/`, { skipCache: true })).data;

// Админ: материал
export const getAdminMaterials = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/admin/materials/`, { skipCache: true })).data;
export const createAdminMaterial = async (slug, payload) =>
  (await apiClient.post(`${BASE}/${slug}/admin/materials/`, toForm(payload), multipart)).data;
export const updateAdminMaterial = async (id, payload) =>
  (await apiClient.patch(`${BASE}/admin/materials/${id}/`, toForm(payload), multipart)).data;
export const deleteAdminMaterial = async (id) => apiClient.delete(`${BASE}/admin/materials/${id}/`);

// Админ: бодолт хамгаалах хүсэлт. status: 'open' (шийдээгүй) | '' (бүгд) | SUBMITTED…
export const getAdminDefenseRequests = async (slug, status = 'open') =>
  (await apiClient.get(`${BASE}/${slug}/admin/defense-requests/`, { params: { status }, skipCache: true })).data;
// {status: 'IN_REVIEW'|'ACCEPTED'|'REJECTED', response, new_score}
export const decideDefenseRequest = async (requestId, payload) =>
  (await apiClient.post(`${BASE}/admin/defense-requests/${requestId}/decide/`, payload)).data;

// Координатор: бодолтыг онлайнаар үзэж оноо тавих (staff эсвэл олимпиадын координатор)
export const getGradingOverview = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/grading/`, { skipCache: true })).data;
// Ангилал бүр өөр бодлоготой тул бодлого бүр ангилалтай (category — ангилалын id, 0 — ангилалгүй)
export const getGradingProblem = async (slug, n, category) =>
  (await apiClient.get(`${BASE}/${slug}/grading/problems/${n}/`, { params: { category }, skipCache: true })).data;
// score '' бол устгана; comment өгөөгүй бол хуучин тайлбар хэвээр
export const saveGradingScore = async (slug, payload) =>
  (await apiClient.put(`${BASE}/${slug}/grading/score/`, payload)).data;
export const getGradingDefenses = async (slug, status = 'open') =>
  (await apiClient.get(`${BASE}/${slug}/grading/defense-requests/`, { params: { status }, skipCache: true })).data;
export const decideGradingDefense = async (slug, id, payload) =>
  (await apiClient.post(`${BASE}/${slug}/grading/defense-requests/${id}/decide/`, payload)).data;

// Засалтын схем (marking scheme) — координаторт; сурагчид дүнтэй хамт нийтлэгдэнэ
export const getGradingMaterials = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/grading/materials/`, { skipCache: true })).data;
// Бодлого бүрийн координацийн хуудас (ахлагч / гол координатор)
export const getGradingCoordination = async (slug, n, category) =>
  (await apiClient.get(`${BASE}/${slug}/grading/problems/${n}/coordination/`, { params: { category }, skipCache: true })).data;
// confirm=false бол баталгаажуулалтыг буцаана; force=true бол оноо дутуу байсан ч баталгаажуулна
export const confirmGradingProblem = async (slug, n, { category, confirm = true, force = false } = {}) =>
  (await apiClient.post(`${BASE}/${slug}/grading/problems/${n}/confirm/`, { category, confirm, force })).data;
// Гол координатор: бүх бодлогыг (category өгвөл тэр ангилалын) нэг товчоор
export const confirmAllGrading = async (slug, { category, confirm = true, force = false } = {}) =>
  (await apiClient.post(`${BASE}/${slug}/grading/confirm-all/`, { category, confirm, force })).data;
// Баг: {categories: [{id, name, problem_count}], graders: [{id, user_id, name, is_head,
//   problems: {ангилал: [№]}, lead_problems: {ангилал: [№]}, scored, total_scored, last_at}]}
export const getGradingTeam = async (slug) =>
  (await apiClient.get(`${BASE}/${slug}/grading/team/`, { skipCache: true })).data;
export const searchGradingUsers = async (slug, q) =>
  (await apiClient.get(`${BASE}/${slug}/grading/users/`, { params: { q }, skipCache: true })).data;
export const addGrader = async (slug, payload) =>
  (await apiClient.post(`${BASE}/${slug}/grading/team/`, payload)).data;
export const updateGrader = async (slug, graderId, payload) =>
  (await apiClient.patch(`${BASE}/${slug}/grading/team/${graderId}/`, payload)).data;
export const removeGrader = async (slug, graderId) =>
  (await apiClient.delete(`${BASE}/${slug}/grading/team/${graderId}/`)).data;
