// src/components/postCard/textUtils.js

// LaTeX expression-н дотор тасрахгүйгээр товчлох
export const safeTruncate = (text, maxLen) => {
  if (!text || text.length <= maxLen) return text;
  // maxLen-с өмнөх байрлалаас LaTeX-н хаалтад орсон эсэхийг шалгана
  let inside = false;
  let i = 0;
  while (i < maxLen) {
    if (text[i] === '$') { inside = !inside; }
    else if (text.startsWith('\\(', i)) { inside = true; i++; }
    else if (text.startsWith('\\)', i)) { inside = false; i++; }
    i++;
  }
  // LaTeX дотор байвал хаах тэмдэг хүртэл буцна
  if (inside) {
    const closeIdx = text.indexOf('$', maxLen);
    const closeIdx2 = text.indexOf('\\)', maxLen);
    const end = [closeIdx, closeIdx2].filter(x => x >= 0).sort((a,b) => a-b)[0];
    if (end !== undefined) return text.substring(0, end + (text[end] === '$' ? 1 : 2)) + '...';
  }
  return text.substring(0, maxLen) + '...';
};
