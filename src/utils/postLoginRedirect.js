// Нэвтэрсний (эсвэл account үүсгэсний) дараа буцах зам — жишээ нь имэйлийн link-ийн claim хуудас.
// sessionStorage: OAuth (Google/MMO) redirect-ийг даван үлдэх ёстой, гэхдээ tab хаагдвал устана.
const KEY = 'post_login_redirect';

// Нэвтрэх/бүртгүүлэх хуудас руу буцвал давталт үүснэ — тэдгээрийг хадгалахгүй
const AUTH_PATHS = ['/login', '/register', '/callback', '/password-reset', '/reset-password'];
const isAuthPath = (path) => AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));

export const setPostLoginRedirect = (path) => {
  if (!path || isAuthPath(path)) return;
  try { sessionStorage.setItem(KEY, path); } catch { /* private mode */ }
};

// Одоогийн хуудсыг (path + query + hash) хадгална — нэвтрэлт шаардсан үед
export const rememberCurrentPage = () => {
  const { pathname, search, hash } = window.location;
  setPostLoginRedirect(pathname + search + hash);
};

// Зөвхөн сайт доторх зам (`/...`) — open redirect-ээс сэргийлнэ
export const consumePostLoginRedirect = (fallback = '/') => {
  let path = null;
  try {
    path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch { /* private mode */ }
  return path && path.startsWith('/') && !path.startsWith('//') && !isAuthPath(path) ? path : fallback;
};
