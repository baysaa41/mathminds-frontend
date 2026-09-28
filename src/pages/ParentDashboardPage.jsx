import React, { useState, useEffect, useCallback } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { UserPlus, Sparkles, ChevronLeft, ChevronRight, Flame, BarChart3, Radar } from 'lucide-react';
import { getChildren, linkChild, getChildReport } from '../services/parentService';
import MonthlyScoreChart from '../components/charts/MonthlyScoreChart';
import { monthLabel } from '../utils/dateFormatter';
import RadarChart from '../components/charts/RadarChart';
import { buildSkillRadarAxes, skillRadarAriaLabel } from '../components/charts/skillRadarAxes';

const cardHeader = { fontSize: '0.85rem' };

// Өдрийн гүйцэтгэлийн 3 түвшин — нэг өнгийн (цэнхэр) ordinal шатлал, цайвар → бараан.
// dataviz validate_palette --ordinal: ALL PASS (цайвар төгсгөл 2.11:1 цагаан дэвсгэр дээр)
const DAY_LEVELS = [
  { min: 100, color: '#1c5cab', label: 'Бүгдийг бодсон' },
  { min: 50, color: '#3987e5', label: 'Талаас дээш' },
  { min: 1, color: '#86b6ef', label: 'Цөөн' },
];
const WEEKDAYS = ['Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя', 'Ня'];

const dayColor = (d) => {
  if (!d.total) return null;
  const pct = (100 * d.done) / d.total;
  return DAY_LEVELS.find((l) => pct >= l.min)?.color || null;
};
const fullMonthLabel = (key) => `${key.slice(0, 4)} оны ${monthLabel(key)}`;
const shiftMonth = (key, n) => {
  let y = Number(key.slice(0, 4));
  let m = Number(key.slice(5)) + n;
  while (m < 1) { m += 12; y -= 1; }
  while (m > 12) { m -= 12; y += 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
};

const StatTile = ({ value, label }) => (
  <div className="col-6 col-md-3">
    <div className="border rounded-3 h-100 py-2 px-3">
      <div className="fw-bold" style={{ fontSize: '1.2rem' }}>{value}</div>
      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</div>
    </div>
  </div>
);

const DailyMonthCard = ({ daily, onMonthChange }) => {
  const { summary: s, days } = daily;
  const newest = daily.available_months[0];
  const oldest = daily.available_months[daily.available_months.length - 1];
  // Даваа гарагаас эхлэх 7 баганат календарь (JS: 0=Ням)
  const lead = (new Date(`${days[0].date}T00:00:00`).getDay() + 6) % 7;
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2 flex-wrap" style={cardHeader}>
        <Sparkles size={15} />
        <span className="me-auto">Өдрийн 5 бодлого</span>
        <div className="input-group input-group-sm" style={{ width: 'auto' }}>
          <button type="button" className="btn btn-outline-secondary" title="Өмнөх сар"
            disabled={daily.month <= oldest} onClick={() => onMonthChange(shiftMonth(daily.month, -1))}>
            <ChevronLeft size={14} />
          </button>
          <select className="form-select form-select-sm" value={daily.month} aria-label="Сар"
            onChange={(e) => onMonthChange(e.target.value)}>
            {daily.available_months.map((m) => <option key={m} value={m}>{fullMonthLabel(m)}</option>)}
          </select>
          <button type="button" className="btn btn-outline-secondary" title="Дараагийн сар"
            disabled={daily.month >= newest} onClick={() => onMonthChange(shiftMonth(daily.month, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="card-body py-3">
        <div className="row g-2 mb-3">
          <StatTile value={s.days_with_problems} label="Бодлоготой өдөр" />
          <StatTile value={s.full_days} label="Бүгдийг бодсон өдөр" />
          <StatTile
            value={s.completion_pct == null ? '—' : `${s.completion_pct}%`}
            label={`Бодсон (${s.items_done}/${s.items_total} бодлого)`}
          />
          <StatTile
            value={<span className="d-inline-flex align-items-center gap-1"><Flame size={16} className="text-warning" />{s.current_streak}</span>}
            label={`Одоогийн дараалал · сарын дээд ${s.best_streak}`}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, maxWidth: 420 }}
          role="table" aria-label={`${fullMonthLabel(daily.month)}-ын өдөр бүрийн гүйцэтгэл`}>
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-muted text-center" style={{ fontSize: '0.7rem' }} role="columnheader">{w}</div>
          ))}
          {Array.from({ length: lead }).map((_, i) => <div key={`lead-${i}`} />)}
          {days.map((d) => {
            const bg = dayColor(d);
            const day = Number(d.date.slice(8));
            const text = d.total ? `${day}: ${d.done}/${d.total} бодсон` : `${day}: бодлого байгаагүй`;
            return (
              <div key={d.date} title={text} aria-label={text} role="cell"
                style={{
                  aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 600,
                  background: bg || 'transparent',
                  border: bg ? 'none' : `1px ${d.total ? 'solid' : 'dashed'} var(--bs-border-color, #dee2e6)`,
                  color: bg && bg !== '#86b6ef' ? '#fff' : 'var(--bs-body-color, #212529)',
                }}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="d-flex flex-wrap gap-3 mt-2 text-muted" style={{ fontSize: '0.72rem' }}>
          {DAY_LEVELS.map((l) => (
            <span key={l.label} className="d-inline-flex align-items-center gap-1">
              <i style={{ width: 12, height: 12, borderRadius: 3, background: l.color, display: 'inline-block' }} />{l.label}
            </span>
          ))}
          <span className="d-inline-flex align-items-center gap-1">
            <i style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--bs-border-color, #dee2e6)', display: 'inline-block' }} />Нэгийг ч бодоогүй
          </span>
        </div>
      </div>
    </div>
  );
};

const AssignmentScoresCard = ({ months }) => {
  const withData = months.filter((m) => m.count);
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={cardHeader}>
        <BarChart3 size={15} />
        <span>Сорилгын дүн — сар бүрийн дундаж</span>
      </div>
      <div className="card-body py-3">
        {withData.length === 0 ? (
          <div className="text-muted text-center py-2" style={{ fontSize: '0.82rem' }}>
            Сүүлийн 12 сард шалгагдсан клубын даалгавар алга
          </div>
        ) : (
          <>
            <MonthlyScoreChart
              data={months}
              ariaLabel={`Клубын даалгаврын сар бүрийн дундаж оноо: ${withData
                .map((m) => `${monthLabel(m.month)} ${m.avg_pct}%`).join(', ')}`}
            />
            <details className="mt-2" style={{ fontSize: '0.78rem' }}>
              <summary className="text-muted">Хүснэгтээр харах</summary>
              <table className="table table-sm mb-0 mt-1">
                <thead className="text-muted"><tr><th>Сар</th><th>Даалгавар</th><th className="text-end">Оноо</th></tr></thead>
                <tbody>
                  {withData.flatMap((m) => m.items.map((it) => (
                    <tr key={`${m.month}-${it.title}-${it.graded_at}`}>
                      <td>{monthLabel(m.month)}</td>
                      <td>{it.title}<span className="text-muted"> · {it.club}</span></td>
                      <td className="text-end">{it.score}/{it.max_score} ({Math.round(it.pct)}%)</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </div>
    </div>
  );
};

const SkillRadarCard = ({ skill, childName }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={cardHeader}>
      <Radar size={15} />
      <span>Сэдэв тус бүрийн чадвар</span>
    </div>
    <div className="card-body">
      {skill.totals.attempted === 0 ? (
        <div className="text-muted text-center py-2" style={{ fontSize: '0.82rem' }}>Хариулт бүртгэгдээгүй байна</div>
      ) : (
        <>
          <RadarChart
            axes={buildSkillRadarAxes(skill.axes, skill.min_reliable)}
            ariaLabel={skillRadarAriaLabel(skill.axes)}
            seriesName={childName}
            peerName="Клубын үе тэнгийн дундаж"
          />
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
            Тэнхлэг бүр 0–100% — тухайн сэдвийн бодлогыг зөв бодсон хувь. Хоосон тойрог бол {skill.min_reliable}-аас
            цөөн бодлогоос тооцсон тул хэлбэрт итгэж болохгүй.
          </p>
        </>
      )}
    </div>
  </div>
);

const LinkChildForm = ({ onLinked }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    linkChild(code.trim().toUpperCase())
      .then(onLinked)
      .catch((err) => setError(err.response?.data?.detail || 'Код буруу байна.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <UserPlus size={15} />
        <span>Хүүхэдтэй холбогдох</span>
      </div>
      <div className="card-body py-3">
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Хүүхдийнхээ "Миний өдөр" хуудаснаас авсан кодыг оруулна уу.
        </p>
        <Form onSubmit={submit} className="d-flex gap-2">
          <Form.Control
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Жишээ: Y6MKO25Z"
            style={{ maxWidth: 220, textTransform: 'uppercase' }}
          />
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? <Spinner animation="border" size="sm" /> : 'Холбох'}
          </Button>
        </Form>
        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </div>
  );
};

const ParentDashboardPage = () => {
  const [children, setChildren] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  // Одоогоор зөвхөн математик (Физик/Хими/Биологийн таб хасагдсан — "Миний өдөр"-тэй адил)
  const subject = 'math';
  const [month, setMonth] = useState(''); // '' = энэ сар (сервер шийднэ)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [childrenError, setChildrenError] = useState(null);

  const loadChildren = useCallback(() => {
    getChildren()
      .then((list) => {
        setChildren(list);
        if (list.length > 0) setActiveChild((prev) => prev || list[0].username);
      })
      .catch((err) => {
        setChildrenError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
        setChildren([]);
      });
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  useEffect(() => {
    if (!activeChild) return;
    setLoading(true);
    setError(null);
    getChildReport(activeChild, { subject, month: month || undefined })
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [activeChild, subject, month]);

  if (children === null) {
    return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  }

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      <h5 className="fw-bold mb-3">Хүүхдийн явц</h5>

      {childrenError ? (
        <div className="text-danger small">{childrenError}</div>
      ) : children.length === 0 ? (
        <>
          <Alert variant="light" className="border" style={{ fontSize: '0.85rem' }}>
            Одоогоор хүүхэдтэй холбогдоогүй байна.
          </Alert>
          <LinkChildForm onLinked={loadChildren} />
        </>
      ) : (
        <>
          {children.length > 1 && (
            <Nav variant="pills" className="mb-3 gap-2" activeKey={activeChild} onSelect={setActiveChild}>
              {children.map((c) => (
                <Nav.Item key={c.username}>
                  <Nav.Link eventKey={c.username} style={{ fontSize: '0.82rem' }}>{c.name}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          )}

          {loading && (
            <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
          )}

          {!loading && error && (
            <div className="text-danger small">{error}</div>
          )}

          {!loading && !error && data && (
            <>
              <DailyMonthCard daily={data.daily} onMonthChange={setMonth} />
              <AssignmentScoresCard months={data.assignments} />
              <SkillRadarCard skill={data.skill} childName={data.child.name} />
            </>
          )}

          <LinkChildForm onLinked={loadChildren} />
        </>
      )}
    </div>
  );
};

export default ParentDashboardPage;
