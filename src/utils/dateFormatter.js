// utils/dateFormatter.js
// Он сарыг стандарт форматтай харуулах

/**
 * Он сарыг YYYY-MM-DD форматаар харуулах
 * @param {string|Date} date - Он сар
 * @returns {string} - 2025-12-02 форматтай
 */
export function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Он сар + цагийг харуулах
 * @param {string|Date} date - Он сар
 * @returns {string} - 2025-12-02 14:30 форматтай
 */
export function formatDateTime(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const datePart = formatDate(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${datePart} ${hours}:${minutes}`;
}

/**
 * Зөвхөн цагийг харуулах
 * @param {string|Date} date - Он сар
 * @returns {string} - 14:30 форматтай
 */
export function formatTime(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Харьцангуй он сар (3 хоногийн өмнө гэх мэт)
 * @param {string|Date} date - Он сар
 * @returns {string}
 */
export function formatRelativeDate(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Саяхан
  if (diffSeconds < 10) return 'Саяхан';
  if (diffSeconds < 60) return `${diffSeconds} секундын өмнө`;

  // Минут
  if (diffMinutes === 1) return '1 минутын өмнө';
  if (diffMinutes < 60) return `${diffMinutes} минутын өмнө`;

  // Цаг
  if (diffHours === 1) return '1 цагийн өмнө';
  if (diffHours < 24) return `${diffHours} цагийн өмнө`;

  // Хоног
  if (diffDays === 1) return 'Өчигдөр';
  if (diffDays === 2) return 'Уржигдар';
  if (diffDays < 7) return `${diffDays} хоногийн өмнө`;

  // Долоо хоног
  if (diffWeeks === 1) return '1 долоо хоногийн өмнө';
  if (diffWeeks < 4) return `${diffWeeks} долоо хоногийн өмнө`;

  // Сар
  if (diffMonths === 1) return '1 сарын өмнө';
  if (diffMonths < 12) return `${diffMonths} сарын өмнө`;

  // Жил
  if (diffYears === 1) return '1 жилийн өмнө';
  if (diffYears < 5) return `${diffYears} жилийн өмнө`;

  // Хэт эртний пост - огноог харуулах
  return formatDate(date);
}
