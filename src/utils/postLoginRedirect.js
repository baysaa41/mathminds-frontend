// Нэвтэрсний (эсвэл account үүсгэсний) дараа буцах зам — жишээ нь имэйлийн link-ийн claim хуудас.
// sessionStorage: OAuth (Google/MMO) redirect-ийг даван үлдэх ёстой, гэхдээ tab хаагдвал устана.
const KEY = 'post_login_redirect';

export const setPostLoginRedirect = (path) => {
  try { sessionStorage.setItem(KEY, path); } catch { /* private mode */ }
};

// Зөвхөн сайт доторх зам (`/...`) — open redirect-ээс сэргийлнэ
export const consumePostLoginRedirect = (fallback = '/') => {
  let path = null;
  try {
    path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch { /* private mode */ }
  return path && path.startsWith('/') && !path.startsWith('//') ? path : fallback;
};
