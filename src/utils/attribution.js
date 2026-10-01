// UTM attribution — Facebook-ийн хуудсуудаас (fb_integral, fb_nomads) ирсэн
// зочдыг хэмжинэ. Анхны хандалтыг localStorage-д хадгалж VISIT илгээнэ;
// тэр browser-ээс нэвтрэх/бүртгүүлэх үед AUTH илгээж backend нь
// signup/login гэж ангилна (backend/marketing).
import apiClient from '../api/axiosConfig';

const KEY = 'mm_attribution';
const VISITOR_KEY = 'mm_visitor_id';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 хоногийн дотор бүртгүүлбэл тооцно
const ENDPOINT = '/api/marketing/touch/';
const FIELDS = ['source', 'medium', 'campaign', 'content', 'landing_path', 'referrer'];
const payloadOf = (data) => Object.fromEntries(FIELDS.map((f) => [f, data[f] || '']));

const read = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
};

const visitorId = () => {
  let id = read(VISITOR_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    write(VISITOR_KEY, id);
  }
  return id;
};

// Апп ачаалах бүрд нэг удаа (main.jsx) — URL-д utm_* эсвэл fbclid байвал хадгална
export const captureAttribution = () => {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source') || (params.get('fbclid') ? 'facebook' : '');
  if (!source) return;

  const data = {
    source,
    medium: params.get('utm_medium') || (params.get('fbclid') ? 'social' : ''),
    campaign: params.get('utm_campaign') || '',
    content: params.get('utm_content') || '',
    landing_path: window.location.pathname,
    referrer: document.referrer || '',
    ts: Date.now(),
    authSent: false,
  };
  write(KEY, JSON.stringify(data));

  // Нэвтрэлтгүй хүсэлт — хуучирсан токены refresh/logout урсгалд орохгүйн тулд fetch
  const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  fetch(base + ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payloadOf(data), kind: 'visit', visitor_id: visitorId() }),
    keepalive: true,
  }).catch(() => {});
};

// Хэрэглэгч тодорхой болсны дараа (AuthContext) — нэг attribution-д нэг л удаа
export const reportAuthAttribution = () => {
  let data;
  try { data = JSON.parse(read(KEY) || 'null'); } catch { data = null; }
  if (!data || data.authSent || Date.now() - data.ts > MAX_AGE_MS) return;

  write(KEY, JSON.stringify({ ...data, authSent: true }));
  apiClient
    .post(ENDPOINT, { ...payloadOf(data), kind: 'auth', visitor_id: visitorId() })
    .catch(() => {});
};
