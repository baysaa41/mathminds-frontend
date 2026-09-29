// Сайтын бүртгэлийн ангийн сонголтууд (1–12-р анги, Оюутан, Бага/Дунд ангийн багш, Сонирхогч).
// Нэг удаа татаж бүх олимпиадын маягтад хуваалцана. [{ value: '1', label: '1-р анги' }, …]
import { useEffect, useState } from 'react';
import { getSiteGrades } from '../services/olympiadService';

const FALLBACK = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}-р анги` }));
let cache = null;
let pending = null;

export default function useSiteGrades() {
  const [grades, setGrades] = useState(cache || FALLBACK);
  useEffect(() => {
    if (cache) return;
    pending = pending || getSiteGrades()
      .then((rows) => { cache = rows.map((g) => ({ value: String(g.value), label: g.label })); return cache; })
      .catch(() => { pending = null; return FALLBACK; });
    let alive = true;
    pending.then((rows) => { if (alive) setGrades(rows); });
    return () => { alive = false; };
  }, []);
  return grades;
}
