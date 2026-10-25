// Board (board.mathminds.club) SSO-ийн буцах хаягийг шалгана.
// Зөвхөн board-ийн өөрийн origin руу буцаана — open redirect-ээс сэргийлнэ.

export const BOARD_URL = import.meta.env.VITE_BOARD_URL || 'https://board.mathminds.club';

const boardOrigins = () => {
  try {
    const origins = [new URL(BOARD_URL).origin];
    if (import.meta.env.DEV) {
      origins.push('http://localhost:5174', 'http://127.0.0.1:5174');
    }
    return origins;
  } catch {
    return [];
  }
};

/**
 * `?return=` утгыг шалгаж, зөвхөн board-ийн origin бол буцаана.
 * Бусад (эсвэл дутуу) тохиолдолд board-ийн нүүр хуудас.
 */
export function sanitizeBoardReturn(raw) {
  const origins = boardOrigins();
  try {
    const url = new URL(raw || BOARD_URL);
    if (origins.includes(url.origin)) {
      return url.toString();
    }
  } catch {
    /* буруу URL — доорх fallback */
  }
  return BOARD_URL;
}
