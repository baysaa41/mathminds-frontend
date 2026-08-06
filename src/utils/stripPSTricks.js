// frontend/src/utils/stripPSTricks.js
/**
 * PSTricks блокыг арилгаад энгийн текст буцаах
 * Жагсаалтын хуудсууд дээр ашиглах (хурд сайжруулах)
 *
 * @param {string} content - Анхны агуулга
 * @param {number} maxLength - Хамгийн их урт (default: 200)
 * @returns {string} - PSTricks-гүй агуулга
 */
export function stripPSTricks(content, maxLength = 200) {
  if (!content) return '';

  // [pst]...[/pst] болон [psti]...[/psti] блокыг арилгах
  let stripped = content.replace(/\[pst(i)?\][\s\S]*?\[\/pst\1\]/g, '[PSTricks зураг]');

  // Хэт урт бол богиносгох
  if (stripped.length > maxLength) {
    stripped = stripped.substring(0, maxLength) + '...';
  }

  return stripped;
}
