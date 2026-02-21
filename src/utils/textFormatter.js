// frontend/src/utils/textFormatter.js

/**
 * Текстийг форматлах utility функцууд
 */

/**octagon
 * Текстийг товчлох (truncate)
 */
export const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + ellipsis;
};

/**
 * HTML тагуудыг устгах
 */
export const stripHtmlTags = (html) => {
  if (!html) return '';

  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Текстээс LaTeX код устгах (preview-д ашиглах)
 */
export const stripLatex = (text) => {
  if (!text) return '';

  // $...$ болон $$...$$ кодыг устгах
  return text.replace(/\$\$[^$]+\$\$/g, '[томъёо]').replace(/\$[^$]+\$/g, '[томъёо]');
};

/**
 * URL-ээс domain авах
 */
export const extractDomain = (url) => {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

/**
 * Файлын өргөтгөл авах
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';

  return filename.substring(lastDot + 1).toLowerCase();
};

/**
 * Файлын хэмжээг хүний уншихад тохиромжтой болгох
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Үгийн олон тоо үүсгэх (pluralize)
 */
export const pluralize = (count, singular, plural) => {
  return count === 1 ? singular : plural;
};

/**
 * Slug үүсгэх (URL-friendly string)
 */
export const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Эхний үсгийг томруулах
 */
export const capitalize = (text) => {
  if (!text) return '';

  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Үгийн тоог тоолох
 */
export const countWords = (text) => {
  if (!text) return 0;

  const stripped = stripHtmlTags(text);
  return stripped.trim().split(/\s+/).length;
};

/**
 * Уншихад зарцуулагдах хугацаа тооцоолох (минут)
 */
export const estimateReadingTime = (text, wordsPerMinute = 200) => {
  const wordCount = countWords(text);
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  return minutes === 1 ? '1 минут' : `${minutes} минут`;
};

export default {
  truncateText,
  stripHtmlTags,
  stripLatex,
  extractDomain,
  getFileExtension,
  formatFileSize,
  pluralize,
  slugify,
  capitalize,
  countWords,
  estimateReadingTime,
};
