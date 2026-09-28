// src/api/apiCache.js
//
// API хариуг browser дээр кэшлэх — stale-while-revalidate (SWR).
//
// Уншилт: кэш байвал ШУУД буцаана (хэрэглэгч хүлээхгүй), зэрэгцээ фон дээр
// дахин татаж, өгөгдөл өөрчлөгдсөн бол subscribe хийсэн компонентуудыг
// шинэчилнэ. Бичилт (POST/PATCH/DELETE) амжилттай болмогц тухайн замын
// "гэр бүл"-ийг stale тэмдэглэнэ — устгахгүй, учир нь устгавал дараагийн
// уншилт дээр spinner эргэж ирнэ.
//
// Хадгалах газар: санах ойн Map (үндсэн) + localStorage (persistence).
// Түлхүүр нь хэрэглэгчийн id-г агуулна — нэг browser дээр хэрэглэгч
// солигдоход өмнөх хэрэглэгчийн өгөгдөл хэзээ ч үйлчлэгдэхгүй.

const PREFIX = 'apicache:v1:';
const SCHEMA = 1;

const MAX_ENTRIES = 300;
const MAX_BYTES = 3_500_000; // localStorage ~5MB — зай үлдээнэ
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // үүнээс хуучин бичлэгийг огт үзэхгүй
const STALE_MS = 30 * 1000; // үүнээс хойш фон дээр дахин татна
const MAX_BODY = 512_000; // үүнээс том хариуг кэшлэхгүй
const VISIBLE_REVALIDATE_MS = 60 * 1000; // таб руу буцаж ирэхэд
const WRITE_DEBOUNCE_MS = 1500;

// Кэшлэхгүй endpoint-ууд. Хэсэг мөрөөр (substring) хайна.
// Эхний хэсэг нь live/тоолуур; үлдсэн нь зөв бусаар хуучирсан өгөгдөл
// асуудал үүсгэдэг газрууд (төлбөр, сагс, коин, quiz attempt, хайлт).
const NO_CACHE = [
  // --- live / тоолуур ---
  '/notifications/',
  '/messages/',
  '/conversations/',
  '/ws/',
  '/review/stats/',
  '/teacher_dashboard/',
  '/student-dashboard/',
  // --- зөв бусаар хуучирвал асуудалтай ---
  '/api/v1/payments/',
  '/api/v1/cart/',
  '/api/coins/',
  '/users/api/membership/',
  'answer-sheets',
  'my-attempts',
  '/poll/',
  'task-status',
  'follow-status',
  'check-username',
  '/search/',
  'keywords/search',
  'hint-solution',
  'page-drawings',
  'current-user',
  // олимпиадын бүртгэл: админы үйлдлээс хойш шууд шинэчлэгдэх ёстой (roster-т id, төлөв, дугаар)
  '/roster/',
  'my-registrations',
  // --- таталт (blob) ---
  'export_',
  'download',
];

let ENABLED = true;

// --- төлөв ---
const mem = new Map(); // key -> { data, ts, hits, size, fam, dirty }
const subs = new Map(); // key -> Set<callback>
const inflight = new Map(); // key -> Promise
const requests = new Map(); // key -> { url, config }  (persist ХИЙХГҮЙ)

let userId = null;
let hydrated = false;
let hydratedFor;
let persistBroken = false;
let writeTimer = null;
let revalidateHandler = null;

// ---------------------------------------------------------------------------
// Түлхүүр ба зам
// ---------------------------------------------------------------------------

/** URL-ийн зөвхөн замын хэсэг (`?query` болон origin-гүй). */
export function pathOf(url) {
  let u = String(url || '');
  if (/^https?:\/\//i.test(u)) {
    try {
      u = new URL(u).pathname;
    } catch {
      /* задлах боломжгүй — түүхий утсыг ашиглана */
    }
  }
  u = u.split('?')[0].split('#')[0];
  if (!u.startsWith('/')) u = '/' + u;
  return u;
}

/** Замын эхний 2 сегмент — мутацийн "гэр бүл". */
function familyOf(path) {
  const segs = path.split('/').filter(Boolean);
  return '/' + segs.slice(0, 2).join('/');
}

/** Параметрыг тогтвортой (түлхүүрээр эрэмбэлсэн) хэлбэрт оруулна. */
function canonicalParams(params) {
  if (!params) return '';
  const keys = Object.keys(params).filter((k) => {
    const v = params[k];
    return v !== undefined && v !== null && v !== '';
  });
  if (!keys.length) return '';
  keys.sort();
  return keys
    .map((k) => {
      const v = params[k];
      if (Array.isArray(v)) return `${k}=${[...v].sort().join(',')}`;
      return `${k}=${v}`;
    })
    .join('&');
}

function currentUserId() {
  if (userId != null) return userId;
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      userId = u?.id ?? u?.username ?? null;
    }
  } catch {
    /* эвдэрсэн JSON — id тодорхойгүй */
  }
  return userId;
}

/** Хүсэлтийн кэш түлхүүр. `{ url, params }` хэлбэрийн config хүлээнэ. */
export function cacheKey(url, config = {}) {
  const uid = currentUserId();
  const method = (config.method || 'get').toUpperCase();
  const full = String(url || '').split('#')[0];
  return `${uid}|${method}|${full}|${canonicalParams(config.params)}`;
}

// ---------------------------------------------------------------------------
// Кэшлэх эсэх
// ---------------------------------------------------------------------------

export function isCacheable(url, config = {}) {
  if (!ENABLED) return false;
  if ((config.method || 'get').toLowerCase() !== 'get') return false;
  if (config.skipCache) return false;
  if (config.responseType && config.responseType !== 'json') return false;
  const path = pathOf(url);
  return !NO_CACHE.some((token) => path.includes(token));
}

// ---------------------------------------------------------------------------
// Унших
// ---------------------------------------------------------------------------

export function isExpired(entry) {
  return !entry || Date.now() - entry.ts > MAX_AGE_MS;
}

export function isStale(entry) {
  return !entry || entry.dirty === true || Date.now() - entry.ts > STALE_MS;
}

/**
 * Санах ойгоос уншина. `hits`-ийг нэмэгдүүлдэг (LRU-д хэрэгтэй) тул
 * зөвхөн хүсэлт үйлчлэх замд дуудна. Зөвхөн харах бол `peek`-ийг ашигла.
 */
export function get(key) {
  ensureHydrated();
  const entry = mem.get(key);
  if (!entry) return null;
  entry.hits += 1;
  return entry;
}

/** `hits`-ийг хөндөхгүйгээр харах. */
export function peek(key) {
  ensureHydrated();
  return mem.get(key) || null;
}

// ---------------------------------------------------------------------------
// Бичих
// ---------------------------------------------------------------------------

function estimateSize(data) {
  try {
    return JSON.stringify(data)?.length || 0;
  } catch {
    return Infinity; // тойрог хамаарал — кэшлэхгүй
  }
}

/**
 * @param {string} [urlOrPath] - хариу авсан хүсэлтийн URL/зам. Үүнээс
 *   гэр бүлийг тооцно — `markFamilyStale` яг ижил дүрмээр тооцдог.
 */
export function set(key, data, urlOrPath = '') {
  if (typeof data === 'undefined') return;
  const size = estimateSize(data);
  if (!Number.isFinite(size) || size > MAX_BODY) {
    mem.delete(key);
    return;
  }
  const fam = urlOrPath ? familyOf(pathOf(urlOrPath)) : '';
  const prev = mem.get(key);
  mem.set(key, { data, ts: Date.now(), hits: prev?.hits ?? 0, size, fam });
  evictIfNeeded();
  schedulePersist();
}

function evictIfNeeded() {
  let total = 0;
  mem.forEach((e) => {
    total += e.size;
  });
  if (mem.size <= MAX_ENTRIES && total <= MAX_BYTES) return;

  // Хамгийн бага хэрэглэгдсэн + хамгийн хуучин нь эхэндээ
  const ordered = [...mem.entries()].sort(
    (a, b) => a[1].hits - b[1].hits || a[1].ts - b[1].ts
  );
  for (const [k, e] of ordered) {
    if (mem.size <= MAX_ENTRIES && total <= MAX_BYTES) break;
    mem.delete(k);
    total -= e.size;
  }
}

/** Мутаци амжилттай болсны дараа тухайн замын гэр бүлийг stale болгоно. */
export function markFamilyStale(url) {
  ensureHydrated();
  const fam = familyOf(pathOf(url));
  if (!fam || fam === '/') return [];

  const touched = [];
  mem.forEach((e, k) => {
    if (e.fam === fam) {
      e.dirty = true;
      touched.push(k);
    }
  });
  if (touched.length) schedulePersist();
  return touched;
}

// ---------------------------------------------------------------------------
// Subscribe
// ---------------------------------------------------------------------------

export function subscribe(key, cb) {
  let set_ = subs.get(key);
  if (!set_) {
    set_ = new Set();
    subs.set(key, set_);
  }
  set_.add(cb);
  return () => {
    set_.delete(cb);
    if (!set_.size) subs.delete(key);
  };
}

export function emit(key, data) {
  const set_ = subs.get(key);
  if (!set_) return;
  set_.forEach((cb) => {
    try {
      cb(data);
    } catch (err) {
      console.error('[apiCache] subscriber алдаа:', err);
    }
  });
}

/** Кэшлэсэн хүсэлтийн тодорхойлолтыг санана (revalidate-д хэрэгтэй). */
export function remember(key, url, config) {
  // AbortController-ийн signal хуучин болсон байж болзошгүй — дахин
  // ашиглавал хүсэлт шууд цуцлагдана.
  const { signal: _signal, ...rest } = config || {};
  requests.set(key, { url, config: rest });
}

export function forget(key) {
  requests.delete(key);
}

/** In-flight хүсэлтийг хуваалцах (StrictMode-ийн 2× эффект, олон компонент). */
export function shareInflight(key, factory) {
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = factory().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function isInflight(key) {
  return inflight.has(key);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function schedulePersist() {
  if (persistBroken || writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    persistNow();
  }, WRITE_DEBOUNCE_MS);
}

function serialize() {
  const entries = {};
  mem.forEach((e, k) => {
    entries[k] = { data: e.data, ts: e.ts, hits: e.hits, size: e.size, fam: e.fam, dirty: e.dirty };
  });
  return JSON.stringify({ schema: SCHEMA, entries });
}

export function persistNow() {
  if (persistBroken || typeof localStorage === 'undefined') return;
  const uid = currentUserId();
  if (uid == null || !mem.size) return;
  try {
    localStorage.setItem(PREFIX + uid, serialize());
  } catch {
    // Quota хэтэрсэн — хагасыг хасаад нэг удаа дахин оролдоно
    try {
      const keep = Math.floor(mem.size / 2);
      const ordered = [...mem.entries()].sort(
        (a, b) => a[1].hits - b[1].hits || a[1].ts - b[1].ts
      );
      ordered.slice(0, mem.size - keep).forEach(([k]) => mem.delete(k));
      localStorage.setItem(PREFIX + uid, serialize());
    } catch {
      // Дахин унавал энэ session-д зөвхөн санах ойгоор ажиллана
      persistBroken = true;
    }
  }
}

function ensureHydrated() {
  const uid = currentUserId();
  if (hydrated && hydratedFor === uid) return;
  hydrated = true;
  hydratedFor = uid;
  mem.clear();

  if (uid == null || typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(PREFIX + uid);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== SCHEMA || !parsed.entries) return;
    const now = Date.now();
    Object.entries(parsed.entries).forEach(([k, e]) => {
      if (!e || typeof e.ts !== 'number') return;
      if (now - e.ts > MAX_AGE_MS) return;
      mem.set(k, {
        data: e.data,
        ts: e.ts,
        hits: e.hits || 0,
        size: e.size || 0,
        fam: e.fam || '',
        dirty: e.dirty === true,
      });
    });
  } catch {
    /* эвдэрсэн blob — алгасна */
  }
}

// ---------------------------------------------------------------------------
// Хэрэглэгч солигдох
// ---------------------------------------------------------------------------

export function setUser(id) {
  const next = id ?? null;
  if (next === userId && hydrated) return;
  userId = next;
  hydratedFor = undefined; // дараагийн хандалтад шинэ хэрэглэгчээр уншина
  hydrated = false;
  ensureHydrated();
}

/** Кэшийг бүрэн устгана — logout / нэвтрэлт солих үед. */
export function clearAll() {
  mem.clear();
  inflight.clear();
  requests.clear();
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) doomed.push(k);
      }
      doomed.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* localStorage хориотой — санах ой цэвэрлэгдсэн нь хангалттай */
    }
  }
  userId = null;
  hydrated = false;
  hydratedFor = undefined;
}

// ---------------------------------------------------------------------------
// Фон дээр шинэчлэх
// ---------------------------------------------------------------------------

/** axiosConfig энэ handler-ийг бүртгэнэ: (url, config, key) => void */
export function setRevalidateHandler(fn) {
  revalidateHandler = fn;
}

/**
 * Идэвхтэй subscribe-тай, хуучирсан түлхүүрүүдийг фон дээр шинэчилнэ.
 * Зөвхөн харагдаж байгаа компонентуудын өгөгдөл л сүлжээ рүү явна.
 */
export function revalidateSubscribed() {
  if (!revalidateHandler) return;
  const now = Date.now();
  requests.forEach(({ url, config }, key) => {
    if (!subs.get(key)?.size) return;
    const entry = mem.get(key);
    if (!entry) return;
    if (entry.dirty || now - entry.ts > VISIBLE_REVALIDATE_MS) {
      revalidateHandler(url, config, key);
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') revalidateSubscribed();
  });
  window.addEventListener('pagehide', () => persistNow());
}

// ---------------------------------------------------------------------------

export function setEnabled(on) {
  ENABLED = !!on;
}

export default {
  cacheKey,
  pathOf,
  isCacheable,
  isExpired,
  isStale,
  get,
  peek,
  set,
  markFamilyStale,
  subscribe,
  emit,
  remember,
  forget,
  shareInflight,
  isInflight,
  setUser,
  clearAll,
  setRevalidateHandler,
  revalidateSubscribed,
  persistNow,
  setEnabled,
};
