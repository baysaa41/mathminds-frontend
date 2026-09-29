// frontend/src/components/UnpaidOlympiadBanner.jsx
// Нэвтэрсэн хэрэглэгчийн (өөрийн болон бүртгүүлсэн сурагчдынх) төлөгдөөгүй олимпиадын бүртгэлийн сануулга —
// зөвхөн олимпиадын хуудсууд (/olympiads...) дээр. Төлбөр төлөгдсөн бүртгэл л баталгаажна.

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { transferUnderReview } from '../services/olympiadService';

// Дансаар шилжүүлээд шалгагдаж буйг, эхэлсэн олимпиадынхыг тооцохгүй
const unpaid = (r) => r.status === 'PENDING' && Number(r.fee) > 0 && !transferUnderReview(r)
  && new Date(r.exam_start).getTime() > Date.now();

function UnpaidOlympiadBanner() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [regs, setRegs] = useState([]);
  const [dismissed, setDismissed] = useState(false);  // хуудсыг дахин ачаалах хүртэл нуух (React state)
  const onOlympiadPage = pathname === '/olympiads' || pathname.startsWith('/olympiads/');

  // Хуудас солигдох бүрт шинэчилнэ — төлсний дараа сануулга алга болно
  useEffect(() => {
    if (!user || !onOlympiadPage) { setRegs([]); return; }
    apiClient.get('/api/olympiads/my-registrations/', { skipCache: true })
      .then((res) => setRegs(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user, pathname, onOlympiadPage]);

  const groups = useMemo(() => {
    const by = new Map();
    regs.filter(unpaid).forEach((r) => {
      const g = by.get(r.olympiad_slug) || { slug: r.olympiad_slug, title: r.olympiad_title, count: 0, total: 0 };
      g.count += 1;
      g.total += Number(r.fee);
      by.set(r.olympiad_slug, g);
    });
    // Тухайн олимпиадын хуудсанд «Бүртгэлийн дэвтэр» өөрөө харуулдаг тул давхар гаргахгүй
    return [...by.values()].filter((g) => pathname !== `/olympiads/${g.slug}`);
  }, [regs, pathname]);

  if (!user || !onOlympiadPage || dismissed || groups.length === 0) return null;

  return (
    <div className="d-flex align-items-start justify-content-center gap-2 px-3 py-2 small"
         style={{ background: '#fff3cd', color: '#664d03' }} role="status">
      <AlertCircle size={16} className="flex-shrink-0 mt-1" />
      <div>
        {groups.map((g, i) => (
          <div key={g.slug}>
            {i === 0 && 'Төлбөр төлөгдөөгүй бүртгэл байна: '}
            <strong>{g.title}</strong> — {g.count} бүртгэл, {g.total.toLocaleString()}₮.{' '}
            <Link to={`/olympiads/${g.slug}`} className="fw-semibold">Төлөх</Link>
          </div>
        ))}
        <div className="text-muted">Төлбөр төлөгдсөн бүртгэл л баталгаажна.</div>
      </div>
      <button type="button" className="btn btn-sm p-0 border-0 ms-2" aria-label="Хаах" onClick={() => setDismissed(true)}>
        <X size={16} />
      </button>
    </div>
  );
}

export default UnpaidOlympiadBanner;
