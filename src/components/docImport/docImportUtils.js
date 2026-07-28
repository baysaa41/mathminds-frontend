// src/components/docImport/docImportUtils.js
// DocImportPage-ийн тогтмолууд болон туслах функцууд

export const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.xlsx,.xls';
export const ACCEPTED_JSON = '.json';
export const MAX_FILE_MB = 20;

export const PROBLEM_TYPES = [
  { value: 0, label: 'Уламжлалт' },
  { value: 1, label: 'Сонгох тест' },
  { value: 4, label: 'Нөхөх тест' },
];

const FILE_ICONS = {
  pdf: '📄',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', gif: '🖼️',
  docx: '📝', doc: '📝',
  xlsx: '📊', xls: '📊',
};

export function fileExt(name) {
  return name?.split('.').pop().toLowerCase() || '';
}

export function fileIcon(name) {
  return FILE_ICONS[fileExt(name)] || '📎';
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let _keyCounter = 0;
export function nextKey() {
  return ++_keyCounter;
}
