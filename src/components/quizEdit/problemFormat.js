// src/components/quizEdit/problemFormat.js
// QuizEditPage-ийн бодлогын төрлийн тогтмол/туслах функцууд (компонент бус)

export const PROBLEM_TYPE_LABELS = { 0: 'Уламжлалт', 1: 'Сонгох', 4: 'Нөхөх' };
export const PROBLEM_TYPE_COLORS = { 0: '#6c757d', 1: '#0d6efd', 4: '#198754' };

// Modal хайлтад plain текст харуулах — $ тэмдэг хасна (MathJax trigger болохоос сэргийлнэ)
export const rawText = (text, maxLen = 160) => {
  if (!text) return '';
  return text
    .replace(/\$\$/g, '').replace(/\$/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
};
