// Монгол кирилл нэрийг паспортын хэв маягаар латин болгоно (ө, ү → u, х → kh).
// backend/users/transliteration.py-тэй ижил хүснэгт — нэгийг өөрчилбөл нөгөөг нь дагуулж засна.

const CYR_TO_LAT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'ye', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'sh', ъ: 'i', ы: 'y', ь: 'i', э: 'e', ю: 'yu', я: 'ya',
};

export const LATIN_NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

// 'Мөнх-Эрдэнэ' → 'Munkh-Erdene'. Латин үсэг хэвээр; үг бүрийн эхний үсэг том.
export const toLatin = (text) => [...(text || '').trim().toLowerCase()]
  .map((ch) => CYR_TO_LAT[ch] ?? ch)
  .join('')
  .replace(/\s+/g, ' ')
  .replace(/(^|[ '-])([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
