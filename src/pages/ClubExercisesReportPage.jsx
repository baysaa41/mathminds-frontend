// ClubExercisesReportPage — өдөр × сурагч дасгалын гүйцэтгэлийн матриц
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Dumbbell, Clock, Download, ChevronLeft, ChevronRight, CheckCircle, XCircle, Minus, Lightbulb, Sparkles, Users } from 'lucide-react';
import apiClient from '../api/axiosConfig';

async function downloadExcel(clubId, sgFilter) {
  const params = sgFilter ? { subgroup_id: sgFilter } : {};
  const res = await apiClient.get(`/api/clubs/${clubId}/export_exercises_excel/`, {
    params, responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  const cd = res.headers['content-disposition'] || '';
  const match = cd.match(/filename="?([^";\n]+)"?/);
  a.download = match ? match[1] : 'exercises.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

const MONTHS_MN = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}.${MONTHS_MN[d.getMonth()]} ${d.getDate()}`;
}

function fmtTime(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}ц ${m}м`;
  if (m > 0) return `${m}м`;
  return `${secs % 60}с`;
}

function rateColor(rate) {
  if (rate == null) return '#6c757d';
  if (rate >= 80) return '#198754';
  if (rate >= 60) return '#2563eb';
  if (rate >= 40) return '#d97706';
  return '#dc3545';
}

function cellStyle(cell) {
  if (!cell) return { bg: '#f8f9fa', text: '#adb5bd', border: '#dee2e6' };
  const rate = cell.correct_rate ?? 0;
  if (rate >= 80) return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
  if (rate >= 60) return { bg: '#dbeafe', text: '#1e3a5f', border: '#93c5fd' };
  if (rate >= 40) return { bg: '#fef9c3', text: '#713f12', border: '#fde047' };
  return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
}


// ── Тухайн өдрийн дэлгэрэнгүй Modal ──────────────────────────────
const DayDetailModal = ({ show, date, clubId, sgFilter, _allMembers, onHide, onNavigateReport }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showAbsent, setShowAbsent] = useState(false);

  useEffect(() => {
    if (!show || !date || !clubId) return;
    setLoading(true);
    setDetail(null);
    setError(null);
    setExpandedStudent(null);
    const params = { date };
    if (sgFilter) params.subgroup_id = sgFilter;
    apiClient.get(`/api/clubs/${clubId}/daily_exercise_detail/`, { params })
      .then(res => setDetail(res.data))
      .catch(e => setError(e.response?.data?.detail || 'Алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [show, date, clubId, sgFilter]);

  if (!show) return null;

  const participated = detail?.students?.filter(s => s.summary.answered > 0) || [];
  const absent = detail?.students?.filter(s => s.summary.answered === 0) || [];

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton className="py-2">
        <Modal.Title style={{ fontSize: '1rem' }} className="d-flex align-items-center gap-2">
          <Dumbbell size={16} className="text-primary" />
          {date ? fmtDateFull(date) : ''} — Дасгалын тайлан
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading && (
          <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
        )}
        {error && (
          <div className="text-danger small p-3">{error}</div>
        )}
        {detail && !loading && (
          <>
            {/* Товч статистик */}
            <div className="d-flex gap-4 flex-wrap p-3 border-bottom bg-light">
              <div className="text-center">
                <div className="fw-bold fs-5 text-primary">{detail.participated}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Оролцсон</div>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-secondary">{detail.total_students - detail.participated}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Оролцоогүй</div>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-dark">{detail.total_problems}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Бодлого</div>
              </div>
              {detail.class_correct_rate != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5" style={{ color: rateColor(detail.class_correct_rate) }}>
                    {detail.class_correct_rate}%
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Нийт зөвийн %</div>
                </div>
              )}
              {detail.participated > 0 && detail.total_students > 0 && (
                <div className="align-self-center flex-grow-1" style={{ minWidth: 120 }}>
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.68rem', color: '#6c757d' }}>
                    <span>Хамрагдалт</span>
                    <span>{detail.participated}/{detail.total_students}</span>
                  </div>
                  <ProgressBar
                    now={Math.round(detail.participated / detail.total_students * 100)}
                    variant="success" style={{ height: 6 }} />
                </div>
              )}
            </div>

            {/* Бодлогуудын header */}
            {detail.problems?.length > 0 && (
              <div className="px-3 pt-3 pb-2 border-bottom">
                <div className="small fw-semibold text-muted mb-2">Бодлогуудын жагсаалт</div>
                <div className="d-flex flex-wrap gap-2">
                  {detail.problems.map((p, i) => (
                    <span key={p.item_id}
                      className="badge bg-light text-dark border"
                      style={{ fontSize: '0.72rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={p.title}>
                      #{i + 1} {p.title || `Бодлого ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Оролцсон сурагчид */}
            {participated.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center gap-2">
                  <Users size={14} className="text-success" />
                  <span className="small fw-semibold">Оролцсон сурагчид ({participated.length})</span>
                </div>
                <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: '0.8rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th style={{ minWidth: 160 }}>Нэр</th>
                      <th className="text-center" style={{ width: 110 }}>Хариулт</th>
                      <th className="text-center" style={{ width: 90 }}>Зөвийн %</th>
                      <th className="text-center" style={{ width: 90 }}>
                        {detail.problems.map((_, i) => (
                          <span key={i} style={{ width: 22, display: 'inline-block', textAlign: 'center', fontSize: '0.65rem' }}>
                            #{i + 1}
                          </span>
                        ))}
                      </th>
                      <th className="text-center" style={{ width: 80 }}>Хугацаа</th>
                      <th style={{ width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {participated.map((s, idx) => {
                      const isExpanded = expandedStudent === s.username;
                      return (
                        <React.Fragment key={s.username}>
                          <tr
                            style={{ cursor: 'pointer' }}
                            onClick={() => setExpandedStudent(isExpanded ? null : s.username)}
                          >
                            <td className="text-muted">{idx + 1}</td>
                            <td>
                              <div className="fw-medium">{s.full_name}</div>
                              {s.subgroups?.length > 0 && (
                                <div className="d-flex gap-1 flex-wrap mt-1">
                                  {s.subgroups.map(sg => (
                                    <Badge key={sg} bg="secondary"
                                      style={{ fontSize: '0.58rem', padding: '1px 4px' }}>{sg}</Badge>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="text-center">
                              <span className="text-success fw-semibold">{s.summary.correct}</span>
                              <span className="text-muted">/{s.summary.total}</span>
                            </td>
                            <td className="text-center fw-semibold"
                              style={{ color: rateColor(s.summary.correct_rate) }}>
                              {s.summary.correct_rate != null ? `${s.summary.correct_rate}%` : '—'}
                              {s.summary.correct_rate != null && (
                                <div style={{ height: 3, background: '#e9ecef', borderRadius: 2, marginTop: 2 }}>
                                  <div style={{
                                    width: `${s.summary.correct_rate}%`, height: '100%',
                                    background: rateColor(s.summary.correct_rate), borderRadius: 2,
                                  }} />
                                </div>
                              )}
                            </td>
                            {/* Бодлого тус бүрийн icon */}
                            <td className="text-center">
                              <div className="d-flex justify-content-center gap-1 flex-wrap">
                                {detail.problems.map(p => {
                                  const ans = s.per_item?.find(a => a.item_id === p.item_id);
                                  if (!ans || ans.is_correct === null) {
                                    return <Minus key={p.item_id} size={14} style={{ color: '#dee2e6' }} />;
                                  }
                                  return ans.is_correct
                                    ? <CheckCircle key={p.item_id} size={14} style={{ color: '#198754' }} />
                                    : <XCircle key={p.item_id} size={14} style={{ color: '#dc3545' }} />;
                                })}
                              </div>
                            </td>
                            <td className="text-center text-muted" style={{ fontSize: '0.72rem' }}>
                              {fmtTime(s.summary.time_spent)}
                            </td>
                            <td className="text-center">
                              <Button variant="link" size="sm" className="p-0 text-primary"
                                style={{ fontSize: '0.72rem' }}
                                onClick={e => { e.stopPropagation(); onNavigateReport(s.username); }}>
                                📊
                              </Button>
                            </td>
                          </tr>

                          {/* Дэлгэрэнгүй мөр: бодлого тус бүрийн хариулт */}
                          {isExpanded && s.per_item?.length > 0 && (
                            <tr>
                              <td colSpan={7} style={{ background: '#f8faff', padding: '8px 12px' }}>
                                <div className="d-flex flex-wrap gap-2">
                                  {detail.problems.map((p, i) => {
                                    const ans = s.per_item.find(a => a.item_id === p.item_id);
                                    const isCorrect = ans?.is_correct;
                                    const bg = isCorrect === true ? '#d1fae5'
                                      : isCorrect === false ? '#fee2e2' : '#f3f4f6';
                                    const borderColor = isCorrect === true ? '#6ee7b7'
                                      : isCorrect === false ? '#fca5a5' : '#e5e7eb';
                                    return (
                                      <div key={p.item_id}
                                        style={{
                                          background: bg, border: `1px solid ${borderColor}`,
                                          borderRadius: 6, padding: '6px 10px',
                                          minWidth: 120, maxWidth: 200, fontSize: '0.75rem',
                                        }}>
                                        <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                                          {isCorrect === true && <CheckCircle size={12} style={{ color: '#198754', flexShrink: 0 }} />}
                                          {isCorrect === false && <XCircle size={12} style={{ color: '#dc3545', flexShrink: 0 }} />}
                                          {isCorrect === null && <Minus size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />}
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            title={p.title}>#{i + 1} {p.title || `Бодлого ${i + 1}`}</span>
                                        </div>
                                        {ans?.answer && (
                                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                                            Хариулт: <span className="fw-medium text-dark">{ans.answer}</span>
                                          </div>
                                        )}
                                        {!ans?.answer && isCorrect === null && (
                                          <div className="text-muted" style={{ fontSize: '0.68rem' }}>Хариулаагүй</div>
                                        )}
                                        <div className="d-flex gap-2 mt-1 flex-wrap">
                                          {ans?.time_spent > 0 && (
                                            <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.65rem' }}>
                                              <Clock size={9} />{fmtTime(ans.time_spent)}
                                            </span>
                                          )}
                                          {ans?.hint_used && (
                                            <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.65rem', color: '#d97706' }}>
                                              <Lightbulb size={9} />Заавар
                                            </span>
                                          )}
                                          {ans?.ai_hint_used && (
                                            <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.65rem', color: '#7c3aed' }}>
                                              <Sparkles size={9} />AI
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Оролцоогүй сурагчид */}
            {absent.length > 0 && (
              <div className="border-top">
                <button
                  className="btn btn-link btn-sm text-muted px-3 py-2 d-flex align-items-center gap-1"
                  style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                  onClick={() => setShowAbsent(v => !v)}>
                  {showAbsent ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
                  Оролцоогүй ({absent.length} сурагч)
                </button>
                {showAbsent && (
                  <div className="px-3 pb-2 d-flex flex-wrap gap-2">
                    {absent.map(s => (
                      <span key={s.username}
                        className="badge bg-light text-muted border"
                        style={{ fontSize: '0.72rem', fontWeight: 400 }}>
                        {s.full_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {participated.length === 0 && (
              <div className="text-center text-muted py-5" style={{ fontSize: '0.85rem' }}>
                <Dumbbell size={32} className="mb-2 opacity-25" />
                <div>Энэ өдөр дасгал хийсэн сурагч байхгүй</div>
              </div>
            )}
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="py-2">
        <Button variant="outline-secondary" size="sm" onClick={onHide}>Хаах</Button>
      </Modal.Footer>
    </Modal>
  );
};

// ── Үндсэн хуудас ─────────────────────────────────────────────────
const PAGE_SIZE = 14;

const ClubExercisesReportPage = () => {
  const { clubData } = useOutletContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clubId = clubData?.id;
  const sgFilter = searchParams.get('subgroup_id') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [subgroups, setSubgroups] = useState([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showTeachers, setShowTeachers] = useState(false);
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState('full_name');
  const [sortDir, setSortDir] = useState('asc');

  // Modal state — ?date= URL param-тай синхрон
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // URL-д ?date= байвал modal автоматаар нээх
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
      setShowModal(true);
    }
  }, [searchParams.get('date')]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDay = useCallback((dateStr) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('date', dateStr);
      return next;
    }, { replace: false });
  }, [setSearchParams]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('date');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (!clubId) return;
    apiClient.get('/api/club-subgroups/', { params: { club: clubId } })
      .then(res => setSubgroups(res.data?.results ?? res.data ?? []))
      .catch(() => {});
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    const params = sgFilter ? { subgroup_id: sgFilter } : {};
    apiClient.get(`/api/clubs/${clubId}/exercises_matrix/`, { params })
      .then(res => { setData(res.data); setPage(0); })
      .catch(e => setError(e.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [clubId, sgFilter]);

  const allGrades = useMemo(() => {
    if (!data?.members) return [];
    const set = new Set();
    data.members.forEach(m => { if (m.grade) set.add(m.grade); });
    return [...set].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data?.members) return [];
    let rows = showTeachers ? data.members : data.members.filter(m => !m.is_teacher);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(m =>
        m.full_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q)
      );
    }
    if (gradeFilter) {
      rows = rows.filter(m => m.grade === gradeFilter);
    }
    return rows;
  }, [data, showTeachers, search, gradeFilter]);

  const toggleSort = useCallback((col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  }, [sortBy]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (sortBy === 'full_name') {
        return dir * a.full_name.localeCompare(b.full_name);
      }
      if (sortBy.startsWith('date:')) {
        const d = sortBy.slice(5);
        const ra = a.by_date[d]?.correct_rate ?? -1;
        const rb = b.by_date[d]?.correct_rate ?? -1;
        return dir * (ra - rb);
      }
      if (sortBy === 'total_days') {
        return dir * ((a.total.days ?? 0) - (b.total.days ?? 0));
      }
      if (sortBy === 'total_time') {
        return dir * ((a.total.total_time ?? 0) - (b.total.total_time ?? 0));
      }
      return 0;
    });
    return rows;
  }, [filtered, sortBy, sortDir]);

  const { visibleDates, totalPages } = useMemo(() => {
    if (!data?.dates?.length) return { visibleDates: [], totalPages: 1 };
    const all = [...data.dates];
    const total = Math.ceil(all.length / PAGE_SIZE);
    const pageIdx = total - 1 - page;
    const start = pageIdx * PAGE_SIZE;
    return { visibleDates: all.slice(start, start + PAGE_SIZE), totalPages: total };
  }, [data?.dates, page]);

  const colStats = useMemo(() => {
    const stats = {};
    visibleDates.forEach(d => {
      let answered = 0, correct = 0, participated = 0;
      filtered.forEach(m => {
        const c = m.by_date[d];
        if (c) { answered += c.answered; correct += c.correct; participated++; }
      });
      stats[d] = { answered, correct, participated,
        rate: answered > 0 ? Math.round(correct / answered * 100) : null };
    });
    return stats;
  }, [filtered, visibleDates]);

  const activeMemberCount = useMemo(() =>
    filtered.filter(m => m.total.days > 0).length, [filtered]);

  const sortIcon = (col) => {
    if (sortBy !== col) return <span style={{ opacity: 0.25, marginLeft: 2, fontSize: '0.7em' }}>↕</span>;
    return <span style={{ marginLeft: 2, fontSize: '0.7em', color: '#0d6efd' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  if (error) return <div className="text-danger small py-3">{error}</div>;
  if (!data) return null;

  const { dates, date_totals } = data;

  return (
    <div className="container-fluid px-0">
      {/* Гарчиг */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <Dumbbell size={18} />
          Дасгалын гүйцэтгэлийн матриц
        </h5>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {subgroups.length > 0 && (
            <Form.Select size="sm" style={{ width: 150 }} value={sgFilter}
              onChange={e => setSearchParams(e.target.value ? { subgroup_id: e.target.value } : {})}>
              <option value="">Бүх бүлэг</option>
              {subgroups.map(sg => <option key={sg.id} value={String(sg.id)}>{sg.name}</option>)}
            </Form.Select>
          )}
          {allGrades.length > 1 && (
            <Form.Select size="sm" style={{ width: 130 }}
              value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="">Бүх анги</option>
              {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </Form.Select>
          )}
          <Form.Control size="sm" placeholder="Нэрээр хайх..." style={{ width: 150 }}
            value={search} onChange={e => setSearch(e.target.value)} />
          <Form.Check type="checkbox" id="show-teachers" label="Багш"
            checked={showTeachers} onChange={e => setShowTeachers(e.target.checked)}
            className="mb-0 small" />
          <Button variant="outline-success" size="sm" disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try { await downloadExcel(clubId, sgFilter); }
              finally { setExporting(false); }
            }}>
            {exporting
              ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />Татаж байна...</>
              : <><Download size={14} className="me-1" />Excel татах</>}
          </Button>
        </div>
      </div>

      {/* Товч статистик */}
      <div className="row g-2 mb-3">
        {[
          { label: 'Нийт өдөр', value: dates.length, color: 'text-primary' },
          { label: 'Сурагч', value: filtered.length, color: 'text-dark' },
          { label: 'Идэвхтэй сурагч', value: activeMemberCount, color: 'text-success' },
          {
            label: 'Нийт хамрагдалт',
            value: filtered.length > 0 ? `${Math.round(activeMemberCount / filtered.length * 100)}%` : '—',
            style: { color: rateColor(activeMemberCount / (filtered.length || 1) * 100) },
          },
        ].map(({ label, value, color = '', style }) => (
          <div key={label} className="col-6 col-sm-3">
            <div className="card border-0 shadow-sm text-center py-2 px-3">
              <div className={`fw-bold fs-5 ${color}`} style={style}>{value}</div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {dates.length === 0 ? (
        <div className="text-center text-muted py-5">
          <Dumbbell size={36} className="mb-2 opacity-25" />
          <div>Дасгал бүртгэгдээгүй байна</div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          {/* Хуудас солих */}
          {totalPages > 1 && (
            <div className="card-header bg-white py-2 d-flex align-items-center gap-3">
              <Button variant="outline-secondary" size="sm" disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}>
                <ChevronLeft size={14} />
              </Button>
              <span className="small text-muted">
                {page === 0
                  ? `Сүүлийн ${visibleDates.length} өдөр`
                  : `${fmtDateFull(visibleDates[0])} — ${fmtDateFull(visibleDates[visibleDates.length - 1])}`}
              </span>
              <Button variant="outline-secondary" size="sm" disabled={page <= 0}
                onClick={() => setPage(p => p - 1)}>
                <ChevronRight size={14} />
              </Button>
              <span className="ms-auto small text-muted">{totalPages - page}/{totalPages} хуудас</span>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered table-sm mb-0 align-middle"
              style={{ fontSize: '0.78rem', minWidth: 300 + visibleDates.length * 64 }}>
              <thead>
                {/* Огнооны гарчиг */}
                <tr className="table-light">
                  <th
                    style={{
                      minWidth: 160, position: 'sticky', left: 0, zIndex: 3,
                      background: '#f8f9fa', boxShadow: '2px 0 4px rgba(0,0,0,.06)',
                      cursor: 'pointer', userSelect: 'none',
                    }}
                    title="Нэрээр эрэмбэлэх"
                    onClick={() => toggleSort('full_name')}
                  >
                    Сурагч ({filtered.length}){sortIcon('full_name')}
                  </th>
                  {visibleDates.map(d => (
                    <th key={d} className="text-center"
                      style={{ minWidth: 60, maxWidth: 72, cursor: 'pointer', userSelect: 'none' }}
                      title="Эрэмбэлэх"
                      onClick={() => toggleSort(`date:${d}`)}>
                      <div className="d-flex flex-column align-items-center">
                        <div className="d-flex align-items-center gap-1">
                          <span
                            className="fw-semibold text-primary"
                            style={{ textDecoration: 'underline dotted', fontSize: '0.78rem' }}
                            title="Дэлгэрэнгүй харах"
                            onClick={e => { e.stopPropagation(); openDay(d); }}>
                            {fmtDate(d)}
                          </span>
                          {sortIcon(`date:${d}`)}
                        </div>
                        {date_totals[d] > 0 && (
                          <div className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>
                            /{date_totals[d]}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-center"
                    style={{ minWidth: 70, background: '#f0f4ff', cursor: 'pointer', userSelect: 'none' }}
                    title="Нийт идэвхт өдрөөр эрэмбэлэх"
                    onClick={() => toggleSort('total_days')}>
                    Нийт{sortIcon('total_days')}
                  </th>
                  <th className="text-center"
                    style={{ minWidth: 70, background: '#f0f4ff', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    title="Нийт хугацаагаар эрэмбэлэх"
                    onClick={() => toggleSort('total_time')}>
                    <Clock size={11} className="me-1" />Хугацаа{sortIcon('total_time')}
                  </th>
                </tr>
                {/* Оролцсон тоо мөр */}
                <tr style={{ fontSize: '0.72rem', background: '#e9ecef' }}>
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 2, background: '#e9ecef',
                    boxShadow: '2px 0 4px rgba(0,0,0,.06)', fontWeight: 600,
                  }}>
                    Оролцсон сурагч
                  </td>
                  {visibleDates.map(d => {
                    const s = colStats[d] || {};
                    return (
                      <td key={d} className="text-center" style={{ cursor: 'pointer' }}
                        onClick={() => openDay(d)}>
                        <span style={{ color: '#0d6efd', fontWeight: 600 }}>{s.participated ?? 0}</span>
                        <span className="text-muted">/{filtered.length}</span>
                        {s.rate != null && (
                          <div style={{ fontSize: '0.65rem', color: rateColor(s.rate) }}>{s.rate}%</div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ background: '#f0f4ff' }} />
                  <td style={{ background: '#f0f4ff' }} />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={visibleDates.length + 3} className="text-center text-muted py-4">
                      Сурагч олдсонгүй
                    </td>
                  </tr>
                ) : sorted.map(member => {
                  const tot = member.total;
                  return (
                    <tr key={member.username}>
                      {/* Нэр (sticky) */}
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 1,
                        background: '#fff', boxShadow: '2px 0 4px rgba(0,0,0,.06)',
                      }}>
                        <div className="overflow-hidden">
                          <div
                            className="fw-medium text-primary"
                            style={{ cursor: 'pointer', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/clubs/${clubId}/report/${member.username}`)}
                          >
                            {member.full_name}
                          </div>
                          {member.subgroups?.length > 0 && (
                            <div className="d-flex gap-1 flex-wrap mt-1">
                              {member.subgroups.map(sg => (
                                <Badge key={sg} bg="secondary" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                                  {sg}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Нүд тус бүр */}
                      {visibleDates.map(d => {
                        const cell = member.by_date[d];
                        const { bg, text, border } = cellStyle(cell);
                        if (!cell) {
                          return (
                            <td key={d} className="text-center"
                              style={{ background: '#f8f9fa', color: '#dee2e6', cursor: 'pointer' }}
                              onClick={() => openDay(d)}>
                              —
                            </td>
                          );
                        }
                        return (
                          <OverlayTrigger key={d} placement="top" overlay={
                            <Tooltip>
                              <div className="text-start" style={{ fontSize: '0.78rem' }}>
                                <div><strong>{fmtDateFull(d)}</strong></div>
                                <div>Хариулт: {cell.answered}/{cell.total_items || date_totals[d] || cell.answered}</div>
                                <div>Зөв: {cell.correct} ({cell.correct_rate}%)</div>
                                {cell.time_spent > 0 && <div>Хугацаа: {fmtTime(cell.time_spent)}</div>}
                                <div className="mt-1 text-info" style={{ fontSize: '0.7rem' }}>Дарж дэлгэрэнгүй харах</div>
                              </div>
                            </Tooltip>
                          }>
                            <td className="text-center fw-semibold"
                              style={{ background: bg, color: text, borderColor: border, cursor: 'pointer' }}
                              onClick={() => openDay(d)}>
                              <div>{cell.correct}<span className="fw-normal" style={{ opacity: 0.6 }}>/{cell.answered}</span></div>
                              <div style={{ fontSize: '0.65rem', opacity: 0.85 }}>{cell.correct_rate}%</div>
                            </td>
                          </OverlayTrigger>
                        );
                      })}

                      {/* Нийт */}
                      <td className="text-center" style={{ background: '#f0f4ff' }}>
                        {tot.days > 0 ? (
                          <>
                            <div className="fw-semibold text-primary">{tot.days}өдөр</div>
                            <div style={{ fontSize: '0.68rem', color: rateColor(tot.correct_rate) }}>
                              {tot.correct_rate != null ? `${tot.correct_rate}%` : '—'}
                            </div>
                          </>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      {/* Нийт хугацаа */}
                      <td className="text-center text-muted" style={{ background: '#f0f4ff', fontSize: '0.78rem' }}>
                        {tot.total_time > 0 ? (
                          <span className="d-flex align-items-center justify-content-center gap-1">
                            <Clock size={11} />{fmtTime(tot.total_time)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Тайлбар */}
          <div className="card-footer bg-white border-top py-2">
            <div className="d-flex gap-4 flex-wrap align-items-center">
              <span className="text-muted small">Зөв хариултын %:</span>
              {[
                { bg: '#d1fae5', text: '#065f46', label: '≥80%' },
                { bg: '#dbeafe', text: '#1e3a5f', label: '60–79%' },
                { bg: '#fef9c3', text: '#713f12', label: '40–59%' },
                { bg: '#fee2e2', text: '#991b1b', label: '<40%' },
                { bg: '#f8f9fa', text: '#adb5bd', label: 'Оролцоогүй' },
              ].map(({ bg, text, label }) => (
                <span key={label} className="d-flex align-items-center gap-1 small">
                  <span style={{ width: 14, height: 14, background: bg, border: '1px solid #dee2e6', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: text }}>{label}</span>
                </span>
              ))}
              <span className="text-muted small ms-2">Огноо дарж дэлгэрэнгүй · Баганын гарчиг дарж эрэмбэлэх</span>
            </div>
          </div>
        </div>
      )}

      {/* Өдрийн дэлгэрэнгүй Modal */}
      <DayDetailModal
        show={showModal}
        date={selectedDate}
        clubId={clubId}
        sgFilter={sgFilter}
        allMembers={filtered}
        onHide={closeModal}
        onNavigateReport={username => navigate(`/clubs/${clubId}/report/${username}`)}
      />
    </div>
  );
};

export default ClubExercisesReportPage;
