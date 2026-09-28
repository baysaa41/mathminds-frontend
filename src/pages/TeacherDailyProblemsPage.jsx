// Багш: сурагчдынхаа "Өдрийн 5 бодлого"-ыг бүлгээр (клуб / дэд бүлэг) болон тус бүрээр нь харах.
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle, Flame } from 'lucide-react';
import { getTeacherDailyProblems } from '../services/clubService';
import MathText from '../components/MathText';

const toISO = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const shiftDate = (iso, days) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISO(d);
};
const pct = (done, total) => (total ? Math.round((100 * done) / total) : 0);

const StatTile = ({ value, label }) => (
  <div className="col-6 col-md-3">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body py-2 px-3">
        <div className="fw-bold" style={{ fontSize: '1.25rem' }}>{value}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{label}</div>
      </div>
    </div>
  </div>
);

const ItemStatusIcon = ({ status }) => (status === 'done'
  ? <CheckCircle2 size={15} className="text-success flex-shrink-0" />
  : <Circle size={15} className="text-muted flex-shrink-0" />);

const StudentRow = ({ s }) => {
  const [open, setOpen] = useState(false);
  const variant = s.done === s.total ? 'success' : s.done === 0 ? 'secondary' : 'primary';
  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setOpen((v) => !v)}>
        <td>
          <ChevronDown size={14} className="me-1 text-muted"
            style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }} />
          <Link to={`/teacher-dashboard/students/${encodeURIComponent(s.username)}`}
            className="fw-medium text-decoration-none" onClick={(e) => e.stopPropagation()}>
            {s.name}
          </Link>
        </td>
        <td style={{ minWidth: 140 }}>
          <div className="d-flex align-items-center gap-2">
            <ProgressBar now={pct(s.done, s.total)} variant={variant} style={{ height: 6, flex: 1 }} />
            <span className="text-muted" style={{ fontSize: '0.75rem', minWidth: 28 }}>{s.done}/{s.total}</span>
          </div>
        </td>
        <td>
          <div className="d-flex gap-1">
            {s.items.map((it) => (
              <span key={it.problem_id} title={it.title}><ItemStatusIcon status={it.status} /></span>
            ))}
          </div>
        </td>
        <td className="text-end">
          {s.streak > 0 && (
            <span className="text-warning-emphasis" style={{ fontSize: '0.78rem' }} title="Өдрийн бодлогоо бүрэн бодсон дараалсан өдөр">
              <Flame size={13} /> {s.streak}
            </span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="table-light">
          <td colSpan={4} className="py-2">
            <div className="list-group list-group-flush">
              {s.items.map((it) => (
                <Link key={it.problem_id} to={`/problem/${it.problem_uuid}`}
                  className="list-group-item list-group-item-action bg-transparent border-0 py-1 d-flex align-items-center gap-2">
                  <ItemStatusIcon status={it.status} />
                  <MathText style={{ fontSize: '0.82rem' }}>{it.title}</MathText>
                  {it.category_mn && <span className="badge bg-light text-dark border ms-auto" style={{ fontSize: '0.65rem' }}>{it.category_mn}</span>}
                </Link>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const TeacherDailyProblemsPage = () => {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const club = params.get('club') || '';
  const subgroup = params.get('subgroup') || '';
  // Огноо өгөөгүй бол серверийн "өнөөдөр"-ийг ашиглана — өдрийн зөвлөмж серверийн цагийн
  // бүсээр огноологддог тул browser-ийн огноо (жиш. УБ шөнө дунд) зөрж болно
  const dateParam = params.get('date') || '';

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTeacherDailyProblems({ club: club || undefined, subgroup: subgroup || undefined, date: dateParam || undefined })
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [club, subgroup, dateParam]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const currentClub = data?.clubs?.find((c) => c.id === data?.club?.id);
  const [withRec, withoutRec] = useMemo(() => {
    const rows = data?.students || [];
    return [rows.filter((s) => s.total > 0), rows.filter((s) => s.total === 0)];
  }, [data]);
  const serverToday = data?.today || toISO(new Date());
  const date = dateParam || data?.date || serverToday;
  const isToday = date >= serverToday;

  return (
    <div className="py-3" style={{ maxWidth: 960 }}>
      <Link to="/teacher-dashboard" className="small text-decoration-none">
        <ArrowLeft size={14} /> Багшийн самбар
      </Link>
      <h5 className="fw-bold mt-2 mb-3">Сурагчдын өдрийн бодлого</h5>

      {/* Шүүлтүүр: клуб · дэд бүлэг · огноо */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select form-select-sm" style={{ maxWidth: 260 }}
          value={data?.club?.id ?? club} onChange={(e) => update({ club: e.target.value, subgroup: '' })}
          aria-label="Клуб">
          {(data?.clubs || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select form-select-sm" style={{ maxWidth: 220 }}
          value={subgroup} onChange={(e) => update({ subgroup: e.target.value })}
          disabled={!currentClub?.subgroups?.length} aria-label="Дэд бүлэг">
          <option value="">Бүх сурагч</option>
          {(currentClub?.subgroups || []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="input-group input-group-sm" style={{ maxWidth: 230 }}>
          <button type="button" className="btn btn-outline-secondary" title="Өмнөх өдөр"
            onClick={() => update({ date: shiftDate(date, -1) })}><ChevronLeft size={14} /></button>
          <input type="date" className="form-control" value={date} aria-label="Огноо"
            onChange={(e) => update({ date: e.target.value })} />
          <button type="button" className="btn btn-outline-secondary" title="Дараагийн өдөр" disabled={isToday}
            onClick={() => update({ date: shiftDate(date, 1) })}><ChevronRight size={14} /></button>
        </div>
      </div>

      {loading && <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>}
      {!loading && error && <div className="text-danger small">{error}</div>}
      {!loading && !error && data && !data.club && (
        <div className="text-muted small">Таны удирдаж буй клуб алга.</div>
      )}

      {!loading && !error && data?.club && (
        <>
          <div className="row g-2 mb-3">
            <StatTile value={`${data.summary.with_recommendation} / ${data.summary.students}`} label="Өдрийн бодлоготой сурагч" />
            <StatTile value={data.summary.fully_done} label="Бүгдийг бодож дуусгасан" />
            <StatTile value={data.summary.not_started} label="Нэгийг ч бодоогүй" />
            <StatTile
              value={data.summary.completion_pct == null ? '—' : `${data.summary.completion_pct}%`}
              label={`Бодсон (${data.summary.items_done}/${data.summary.items_total} бодлого)`}
            />
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>
              Сурагч тус бүрээр
              <span className="text-muted fw-normal ms-2" style={{ fontSize: '0.75rem' }}>мөр дээр дарж бодлогуудыг харна</span>
            </div>
            {withRec.length === 0 ? (
              <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
                Энэ өдөр өдрийн бодлоготой сурагч алга
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead className="text-muted">
                    <tr><th>Сурагч</th><th>Гүйцэтгэл</th><th>Бодлого</th><th className="text-end">Streak</th></tr>
                  </thead>
                  <tbody>
                    {withRec.map((s) => <StudentRow key={s.username} s={s} />)}
                  </tbody>
                </table>
              </div>
            )}
            {withoutRec.length > 0 && (
              <details className="border-top px-3 py-2" style={{ fontSize: '0.78rem' }}>
                <summary className="text-muted">Өдрийн бодлого үүсээгүй {withoutRec.length} сурагч</summary>
                <div className="mt-1 text-muted">
                  {withoutRec.map((s, i) => (
                    <span key={s.username}>
                      {i > 0 && ', '}
                      <Link to={`/teacher-dashboard/students/${encodeURIComponent(s.username)}`} className="text-decoration-none">{s.name}</Link>
                    </span>
                  ))}
                </div>
                <div className="mt-1 fst-italic">
                  Өдрийн бодлого нь сурагч «Миний өдөр»-өө нээх, эсвэл клубын даалгавар нь шалгагдсан үед үүснэ.
                </div>
              </details>
            )}
          </div>

          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>Бодлого бүрээр</div>
            {data.problems.length === 0 ? (
              <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>Бодлого алга</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead className="text-muted">
                    <tr><th>Бодлого</th><th>Ангилал</th><th className="text-end">Санал болгосон</th><th className="text-end">Бодсон</th></tr>
                  </thead>
                  <tbody>
                    {data.problems.map((p) => (
                      <tr key={p.problem_id}>
                        <td>
                          <Link to={`/problem/${p.problem_uuid}`} className="text-decoration-none">
                            <MathText>{p.title}</MathText>
                          </Link>
                        </td>
                        <td className="text-muted">{p.category_mn || '—'}</td>
                        <td className="text-end">{p.assigned}</td>
                        <td className="text-end">{p.done} <span className="text-muted">({pct(p.done, p.assigned)}%)</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherDailyProblemsPage;
