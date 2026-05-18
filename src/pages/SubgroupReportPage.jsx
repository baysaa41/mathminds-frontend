import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Badge from 'react-bootstrap/Badge';
import { Download, BarChart2, Clock, Dumbbell } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

const CategoryStatsPanel = ({ stats, title }) => {
  if (!stats?.length) return null;
  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>
        {title || 'Категори тус бүрийн амжилт'}
      </div>
      <div className="card-body py-2 px-3">
        {stats.map(cs => {
          const pct = cs.total > 0 ? Math.round(cs.correct / cs.total * 100) : 0;
          const barColor = pct >= 70 ? '#198754' : pct >= 50 ? '#fd7e14' : '#dc3545';
          return (
            <div key={cs.id} className="mb-2">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: cs.color, display: 'inline-block', flexShrink: 0 }} />
                  <span className="fw-medium" style={{ fontSize: '0.82rem' }}>{cs.name_mn || cs.name}</span>
                </div>
                <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.78rem' }}>
                  <span className="text-muted">{cs.correct}/{cs.total} бодлого</span>
                  <span className="fw-bold" style={{ color: barColor, minWidth: 38, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 6, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function fmtTime(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}ц ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

const rateColor = (rate) => {
  if (rate == null) return {};
  if (rate >= 70) return { color: '#0a3622', background: '#d1fae5', borderRadius: 4, padding: '1px 5px' };
  if (rate >= 50) return { color: '#664d03', background: '#fef9c3', borderRadius: 4, padding: '1px 5px' };
  return { color: '#991b1b', background: '#fee2e2', borderRadius: 4, padding: '1px 5px' };
};


const SubgroupReportPage = () => {
  const { id: clubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const subgroupId = searchParams.get('subgroup_id') || '';
  const { clubData } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [sortField, setSortField] = useState('full_name');
  const [sortDir, setSortDir] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [subgroups, setSubgroups] = useState([]);
  const [showTeachers, setShowTeachers] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('');
  const [activeTab, setActiveTab] = useState('combined');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  useEffect(() => {
    apiClient.get('/api/club-subgroups/', { params: { club: clubId } })
      .then(res => setSubgroups(res.data?.results ?? res.data ?? []))
      .catch(() => {});
  }, [clubId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const params = subgroupId ? { subgroup_id: subgroupId } : {};
        const res = await apiClient.get(`/api/clubs/${clubId}/web_report/`, { params });
        setData(res.data);
        if (res.data?.assignments?.length) {
          setSelectedAssignmentId(res.data.assignments[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    })();
  }, [clubId, subgroupId]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d * -1);
    } else {
      setSortField(field);
      setSortDir(field === 'full_name' ? 1 : -1);
    }
  };

  const allGrades = useMemo(() => {
    if (!data?.members) return [];
    const set = new Set();
    data.members.forEach(m => { if (m.grade) set.add(m.grade); });
    return [...set].sort();
  }, [data]);

  const sorted = useMemo(() => {
    if (!data?.members) return [];
    let filtered = showTeachers ? data.members : data.members.filter(m => !m.is_teacher);
    if (gradeFilter) filtered = filtered.filter(m => m.grade === gradeFilter);
    return [...filtered].sort((a, b) => {
      const av = a[sortField] ?? (sortField === 'full_name' ? '' : -Infinity);
      const bv = b[sortField] ?? (sortField === 'full_name' ? '' : -Infinity);
      if (av < bv) return -sortDir;
      if (av > bv) return sortDir;
      return 0;
    });
  }, [data, sortField, sortDir, showTeachers, gradeFilter]);

  const summary = useMemo(() => {
    if (!sorted.length) return null;
    const withSuccess = sorted.filter(m => m.success_rate != null);
    const withProb = sorted.filter(m => m.prob_rate != null);
    const avgSuccess = withSuccess.length
      ? (withSuccess.reduce((s, m) => s + m.success_rate, 0) / withSuccess.length).toFixed(1)
      : null;
    const avgProb = withProb.length
      ? (withProb.reduce((s, m) => s + m.prob_rate, 0) / withProb.length).toFixed(1)
      : null;
    return { total: sorted.length, avgSuccess, avgProb };
  }, [sorted]);

  const assignmentRanking = useMemo(() => {
    const selA = data?.assignments?.find(a => a.id === selectedAssignmentId);
    if (!selA) return [];
    return [...sorted]
      .map(m => ({ ...m, _r: m.results.find(r => r.assignment_id === selA.id) }))
      .sort((a, b) => (b._r?.score ?? -1) - (a._r?.score ?? -1));
  }, [sorted, selectedAssignmentId, data]);

  const handleExcelDownload = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = subgroupId ? { subgroup_id: subgroupId } : {};
      const response = await apiClient.get(`/api/clubs/${clubId}/export_report/`, {
        params,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      const subName = data?.subgroup_name ? `_${data.subgroup_name}` : '';
      a.download = `${data?.club_name || 'club'}${subName}_report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-3">
        <AppBreadcrumb className="mb-2" items={[
          { label: 'Клубууд', to: '/clubs' },
          { label: clubData?.name || 'Клуб', to: `/clubs/${clubId}` },
          { label: 'Гишүүд', to: `/clubs/${clubId}/members` },
          { label: 'Тайлан' },
        ]} />
        <div className="text-danger small">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { club_name, subgroup_name, assignments, overall_category_stats } = data;
  const selAssignment = assignments.find(a => a.id === selectedAssignmentId);

  const breadcrumbItems = [
    { label: 'Клубууд', to: '/clubs' },
    { label: club_name || clubData?.name || 'Клуб', to: `/clubs/${clubId}` },
    { label: 'Гишүүд', to: `/clubs/${clubId}/members` },
    { label: subgroup_name ? `${subgroup_name} Тайлан` : 'Тайлан' },
  ];

  const MemberNameCell = ({ member, sticky = false }) => (
    <td style={sticky ? {
      position: 'sticky', left: 0, zIndex: 1, background: '#fff',
      boxShadow: '2px 0 4px rgba(0,0,0,0.07)', paddingLeft: '0.75rem',
    } : { paddingLeft: '0.75rem' }}>
      <div className="d-flex align-items-center gap-1">
        <span className="fw-medium" style={{ cursor: 'pointer', color: '#0d6efd' }}
          onClick={() => navigate(`/clubs/${clubId}/report/${member.username}`)}>
          {member.full_name}
        </span>
        {member.is_teacher && (
          <span style={{ fontSize: '0.6rem', fontWeight: 600, lineHeight: 1, padding: '1px 4px', borderRadius: 3, background: '#d1fae5', color: '#065f46' }}>Багш</span>
        )}
      </div>
      <div className="text-muted" style={{ fontSize: '0.65rem' }}>@{member.username}</div>
      {member.subgroups.length > 0 && (
        <div style={{ fontSize: '0.62rem', color: '#6c757d' }}>{member.subgroups.join(', ')}</div>
      )}
    </td>
  );

  return (
    <div className="py-3">
      <AppBreadcrumb className="mb-3" items={breadcrumbItems} />

      <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <BarChart2 size={18} className="text-primary" />
          {subgroup_name ? `${subgroup_name} — Тайлан` : 'Клубын тайлан'}
        </h5>
        {subgroups.length > 0 && (
          <Form.Select size="sm" style={{ width: 'auto', minWidth: 160 }} value={subgroupId}
            onChange={e => { const val = e.target.value; setSearchParams(val ? { subgroup_id: val } : {}); }}>
            <option value="">Бүх гишүүд</option>
            {subgroups.map(sg => <option key={sg.id} value={sg.id}>{sg.name}</option>)}
          </Form.Select>
        )}
        {allGrades.length > 1 && (
          <Form.Select size="sm" style={{ width: 'auto', minWidth: 120 }} value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}>
            <option value="">Бүх анги</option>
            {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </Form.Select>
        )}
        <Form.Check type="checkbox" id="show-teachers" label="Багш нар"
          checked={showTeachers} onChange={e => setShowTeachers(e.target.checked)} className="mb-0 small" />
        <Button variant="outline-primary" size="sm" className="ms-auto"
          onClick={() => navigate(`/clubs/${clubId}/exercises-report${subgroupId ? `?subgroup_id=${subgroupId}` : ''}`)}>
          <Dumbbell size={14} className="me-1" />Дасгалын матриц
        </Button>
      </div>

      {summary && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="d-flex gap-4 flex-wrap align-items-center">
              <div className="text-center">
                <div className="fw-bold fs-5 text-primary">{summary.total}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Гишүүн</div>
              </div>
              {summary.avgSuccess != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-success">{summary.avgSuccess}%</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Дундаж амжилт</div>
                </div>
              )}
              {summary.avgProb != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-info">{summary.avgProb}%</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Бодлогын амжилт</div>
                </div>
              )}
              <div className="ms-auto">
                <Button variant="outline-success" size="sm" onClick={handleExcelDownload} disabled={exporting}>
                  {exporting ? <Spinner animation="border" size="sm" className="me-1" /> : <Download size={14} className="me-1" />}
                  Excel татах
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Табууд ── */}
      <Nav variant="tabs" className="mb-0" activeKey={activeTab} onSelect={setActiveTab}>
        <Nav.Item>
          <Nav.Link eventKey="combined" style={{ fontSize: '0.85rem' }}>
            Нэгдсэн тайлан
            <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>{sorted.length}</Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="assignment" style={{ fontSize: '0.85rem' }}>
            Сорилго тус бүр
            <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>{assignments.length}</Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="exercises" style={{ fontSize: '0.85rem' }}>
            <Dumbbell size={13} className="me-1" />Дасгал
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* ── Таб 1: Нэгдсэн тайлан ── */}
      {activeTab === 'combined' && (
        <>
        <div className="card border-0 shadow-sm border-top-0 rounded-top-0">
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered table-sm mb-0 align-middle"
              style={{ fontSize: '0.78rem', minWidth: 600 + assignments.length * 120 }}>
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: 36, minWidth: 36 }}>#</th>
                  <th style={{ minWidth: 160, position: 'sticky', left: 0, zIndex: 3, background: '#f8f9fa', boxShadow: '2px 0 4px rgba(0,0,0,0.07)', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('full_name')}>
                    Нэр {sortField === 'full_name' ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                  </th>
                  <th className="text-center" style={{ minWidth: 70 }}>Анги</th>
                  <th className="text-center" style={{ minWidth: 72, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('completed')}>
                    Гүйцэтгэл {sortField === 'completed' ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                  </th>
                  <th className="text-center" style={{ minWidth: 80, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('success_rate')}>
                    Амжилт% {sortField === 'success_rate' ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                  </th>
                  <th className="text-center" style={{ minWidth: 72 }}>Бодлого</th>
                  <th className="text-center" style={{ minWidth: 84, cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('prob_rate')}>
                    Бодлогын% {sortField === 'prob_rate' ? (sortDir === 1 ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
                  </th>
                  {assignments.map(a => (
                    <th key={a.id} className="text-center" colSpan={2}
                      style={{ minWidth: 110 }} title={a.title}>
                      <div style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                      <div className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>/{a.max_score ?? '?'}</div>
                    </th>
                  ))}
                </tr>
                <tr className="table-secondary" style={{ fontSize: '0.7rem' }}>
                  <td /><td style={{ position: 'sticky', left: 0, zIndex: 2, background: '#e9ecef', boxShadow: '2px 0 4px rgba(0,0,0,0.07)' }} />
                  <td /><td /><td /><td /><td />
                  {assignments.map(a => (
                    <React.Fragment key={a.id}>
                      <td className="text-center fw-semibold" style={{ color: '#0d6efd' }}>
                        {(() => {
                          const vals = sorted.map(m => m.results.find(r => r.assignment_id === a.id)?.score).filter(v => v != null);
                          return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '—';
                        })()}
                      </td>
                      <td className="text-center text-muted" style={{ fontSize: '0.65rem' }}>Зөв/Буруу</td>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={7 + assignments.length * 2} className="text-center text-muted py-3">Гишүүн олдсонгүй</td></tr>
                ) : sorted.map((member, idx) => (
                  <tr key={member.username}>
                    <td className="text-center text-muted">{idx + 1}</td>
                    <MemberNameCell member={member} sticky />
                    <td className="text-center">{member.grade ?? '—'}</td>
                    <td className="text-center">{member.completed}/{member.total_assignments}</td>
                    <td className="text-center fw-semibold">
                      {member.success_rate != null ? <span style={rateColor(member.success_rate)}>{member.success_rate}%</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="text-center">{member.answered_problems}/{member.total_problems}</td>
                    <td className="text-center fw-semibold">
                      {member.prob_rate != null ? <span style={rateColor(member.prob_rate)}>{member.prob_rate}%</span> : <span className="text-muted">—</span>}
                    </td>
                    {assignments.map(a => {
                      const result = member.results.find(r => r.assignment_id === a.id);
                      const score = result?.score ?? null;
                      const maxS = result?.max_score ?? null;
                      const done = result?.done ?? false;
                      const timeStr = result?.time_spent ? fmtTime(result.time_spent) : null;
                      let scoreBg = '#f8f9fa', scoreColor = '#adb5bd';
                      if (score != null) {
                        if (done && maxS && score >= maxS * 0.7) { scoreBg = '#d1fae5'; scoreColor = '#065f46'; }
                        else if (done) { scoreBg = '#fef9c3'; scoreColor = '#713f12'; }
                        else { scoreBg = '#fee2e2'; scoreColor = '#991b1b'; }
                      }
                      return (
                        <React.Fragment key={a.id}>
                          <td className="text-center fw-semibold" style={{ background: scoreBg, color: scoreColor }}>
                            {score != null ? score : <span style={{ opacity: 0.4 }}>—</span>}
                            {timeStr && (
                              <div className="d-flex align-items-center justify-content-center gap-1 fw-normal"
                                style={{ fontSize: '0.62rem', color: '#6c757d', marginTop: 1 }}>
                                <Clock size={9} />{timeStr}
                              </div>
                            )}
                          </td>
                          <td className="text-center" style={{ fontSize: '0.72rem' }}>
                            {result ? (
                              <><span style={{ color: '#065f46' }}>{result.correct}</span><span className="text-muted mx-1">/</span><span style={{ color: '#991b1b' }}>{result.wrong}</span></>
                            ) : <span className="text-muted">—</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white border-top py-2">
            <div className="d-flex gap-3 flex-wrap align-items-center">
              <span className="text-muted small">Амжилт%:</span>
              {[{ bg: '#d1fae5', color: '#065f46', label: '≥70%' }, { bg: '#fef9c3', color: '#713f12', label: '50–69%' }, { bg: '#fee2e2', color: '#991b1b', label: '<50%' }].map(({ bg, color, label }) => (
                <span key={label} className="d-flex align-items-center gap-1 small">
                  <span style={{ width: 12, height: 12, background: bg, border: '1px solid #dee2e6', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color }}>{label}</span>
                </span>
              ))}
              <span className="text-muted small ms-3">Зөв/Буруу = даалгавар дахь зөв/буруу бодлогын тоо</span>
            </div>
          </div>
        </div>
        {overall_category_stats?.length > 0 && (
          <div className="mt-3">
            <CategoryStatsPanel
              stats={overall_category_stats}
              title="Бүх сорилгын нэгдсэн — категори тус бүрийн амжилт"
            />
          </div>
        )}
        </>
      )}

      {/* ── Таб 2: Сорилго тус бүрийн тайлан ── */}
      {activeTab === 'assignment' && (
        <div className="card border-0 shadow-sm border-top-0 rounded-top-0">
          <div className="card-body py-2 border-bottom">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-muted small fw-semibold">Сорилго:</span>
              <Form.Select size="sm" style={{ width: 'auto', minWidth: 200 }}
                value={selectedAssignmentId ?? ''}
                onChange={e => setSelectedAssignmentId(Number(e.target.value))}>
                {assignments.map(a => (
                  <option key={a.id} value={a.id}>{a.title} {a.max_score ? `(/${a.max_score})` : ''}</option>
                ))}
              </Form.Select>
            </div>
          </div>
          {selAssignment ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="text-center" style={{ width: 40 }}>#</th>
                    <th style={{ minWidth: 180 }}>Нэр</th>
                    <th className="text-center" style={{ width: 70 }}>Анги</th>
                    <th className="text-center" style={{ minWidth: 110 }}>Оноо</th>
                    <th className="text-center" style={{ width: 80 }}>Зөв/Буруу</th>
                    <th className="text-center" style={{ width: 90 }}>Хугацаа</th>
                    <th className="text-center" style={{ width: 100 }}>Төлөв</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentRanking.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted py-3">Гишүүн олдсонгүй</td></tr>
                  ) : assignmentRanking.map((member, idx) => {
                    const r = member._r;
                    const score = r?.score ?? null;
                    const maxS = r?.max_score ?? selAssignment.max_score ?? null;
                    const pct = score != null && maxS ? Math.round(score / maxS * 100) : null;
                    const timeStr = r?.time_spent ? fmtTime(r.time_spent) : null;
                    const STATUS_LABEL = { not_started: 'Өгөөгүй', in_progress: 'Явагдаж байна', submitted: 'Илгээсэн', graded: 'Үнэлэгдсэн' };
                    const STATUS_BG = { not_started: 'secondary', in_progress: 'warning', submitted: 'info', graded: 'success' };
                    const st = r?.status || 'not_started';
                    return (
                      <tr key={member.username}>
                        <td className="text-center text-muted">{idx + 1}</td>
                        <MemberNameCell member={member} />
                        <td className="text-center">{member.grade ?? '—'}</td>
                        <td className="text-center fw-semibold" style={score != null ? rateColor(pct) : {}}>
                          {score != null ? (
                            <>{score}{maxS ? <span className="fw-normal text-muted">/{maxS}</span> : null}{pct != null ? <span className="ms-1 fw-normal" style={{ fontSize: '0.72rem' }}>({pct}%)</span> : null}</>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center" style={{ fontSize: '0.78rem' }}>
                          {r ? <><span style={{ color: '#065f46' }}>{r.correct}</span><span className="text-muted mx-1">/</span><span style={{ color: '#991b1b' }}>{r.wrong}</span></> : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center text-muted" style={{ fontSize: '0.78rem' }}>
                          {timeStr ? <span className="d-flex align-items-center justify-content-center gap-1"><Clock size={11} />{timeStr}</span> : '—'}
                        </td>
                        <td className="text-center">
                          <Badge bg={STATUS_BG[st]} style={{ fontSize: '0.68rem' }}>{STATUS_LABEL[st]}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted py-4">Сорилго сонгоно уу</div>
          )}
          {selAssignment?.category_stats?.length > 0 && (
            <div className="p-3 border-top">
              <CategoryStatsPanel
                stats={selAssignment.category_stats}
                title={`"${selAssignment.title}" — категори тус бүрийн амжилт`}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Таб 3: Дасгалын тайлан ── */}
      {activeTab === 'exercises' && (
        <div className="card border-0 shadow-sm border-top-0 rounded-top-0">
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered table-sm mb-0 align-middle" style={{ fontSize: '0.82rem' }}>
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: 40 }}>#</th>
                  <th style={{ minWidth: 180 }}>Нэр</th>
                  <th className="text-center" style={{ width: 70 }}>Анги</th>
                  <th className="text-center" style={{ minWidth: 80 }}>Оролцсон өдөр</th>
                  <th className="text-center" style={{ minWidth: 80 }}>Нийт хариулт</th>
                  <th className="text-center" style={{ minWidth: 80 }}>Зөв%</th>
                  <th className="text-center" style={{ minWidth: 90 }}>Нийт хугацаа</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-3">Гишүүн олдсонгүй</td></tr>
                ) : [...sorted]
                  .sort((a, b) => (b.exercises?.answered ?? 0) - (a.exercises?.answered ?? 0))
                  .map((member, idx) => {
                    const ex = member.exercises || {};
                    const timeStr = ex.total_time ? fmtTime(ex.total_time) : null;
                    return (
                      <tr key={member.username}>
                        <td className="text-center text-muted">{idx + 1}</td>
                        <MemberNameCell member={member} />
                        <td className="text-center">{member.grade ?? '—'}</td>
                        <td className="text-center fw-semibold text-primary">{ex.days ?? 0}</td>
                        <td className="text-center">{ex.answered ?? 0}</td>
                        <td className="text-center fw-semibold">
                          {ex.correct_rate != null
                            ? <span style={rateColor(ex.correct_rate)}>{ex.correct_rate}%</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="text-center text-muted">
                          {timeStr ? <span className="d-flex align-items-center justify-content-center gap-1"><Clock size={11} />{timeStr}</span> : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubgroupReportPage;
