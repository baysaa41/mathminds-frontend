// AssignmentLeaderboardPage — бодлого бүрийн оноотой дэлгэрэнгүй дүнгийн хүснэгт
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Form from 'react-bootstrap/Form';
import { MathJax } from 'better-react-mathjax';
import { Trophy, Search, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../api/axiosConfig';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import { useAuth } from '../context/AuthContext.jsx';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const STATUS_CONFIG = {
  not_started: { label: 'Эхлээгүй',      bg: 'secondary' },
  in_progress:  { label: 'Явагдаж байна', bg: 'warning'   },
  submitted:    { label: 'Илгээсэн',      bg: 'info'      },
  graded:       { label: 'Үнэлэгдсэн',   bg: 'success'   },
};

const Avatar = ({ student, size = 26 }) => {
  const init = (student.first_name?.[0] || student.username?.[0] || '?').toUpperCase();
  if (student.picture_url) {
    return (
      <img src={student.picture_url} alt=""
        className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover' }} />
    );
  }
  return (
    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {init}
    </div>
  );
};

const displayName = (s) =>
  s.last_name ? `${s.last_name} ${s.first_name}`.trim() : s.first_name || s.username;

// Нэг бодлогын оноог харуулах өнгийн тооцоолол
const pointColor = (pt, maxPt) => {
  if (pt == null) return { bg: '#f8f9fa', color: '#adb5bd' };
  if (maxPt == null || maxPt === 0) return { bg: '#e9ecef', color: '#212529' };
  const pct = pt / maxPt;
  if (pct >= 0.8) return { bg: '#d1e7dd', color: '#0a3622' };
  if (pct >= 0.5) return { bg: '#fff3cd', color: '#664d03' };
  if (pct > 0)    return { bg: '#ffe5d9', color: '#6d1a0f' };
  return { bg: '#f8d7da', color: '#58151c' };
};

// Нийт оноог хэмжээст онооруу хөрвүүлнэ
const getScaledScore = (score, scoreTable) => {
  if (!scoreTable || score == null) return null;
  const idx = Math.round(score);
  return idx >= 0 && idx < scoreTable.length ? scoreTable[idx] : null;
};

// Normal distribution helpers for scaled score histogram
const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
  return x < 0 ? -y : y;
};
const normalCDF = (x, mu = 500, sigma = 100) =>
  0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));

const ScaledScoreHistogram = ({ results, scoreTable }) => {
  const scores = results.map(r => getScaledScore(r.score, scoreTable)).filter(v => v != null);
  if (!scores.length) return null;

  const n = scores.length;
  // Truncated to [200, 800]: renormalize so probabilities sum to 1
  const totalP = normalCDF(800) - normalCDF(200);

  const bins = Array.from({ length: 12 }, (_, i) => {
    const lo = 200 + i * 50;
    const hi = lo + 50;
    const p = (normalCDF(hi) - normalCDF(lo)) / totalP;
    const actual = scores.filter(s => s >= lo && (i === 11 ? s <= 800 : s < hi)).length;
    return { lo, expected: n * p, actual };
  });

  const maxVal = Math.max(...bins.flatMap(b => [b.expected, b.actual]), 1);
  const H = 90; // max bar height in px

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body py-3">
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
            Хэмжээст оноогоор тархалт
          </span>
          <div className="d-flex gap-3" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
            <span className="d-flex align-items-center gap-1">
              <span style={{ width: 10, height: 10, background: '#ced4da', borderRadius: 2, display: 'inline-block' }} />
              Нормаль тархалт (μ=500, σ=100)
            </span>
            <span className="d-flex align-items-center gap-1">
              <span style={{ width: 10, height: 10, background: '#4dabf7', borderRadius: 2, display: 'inline-block' }} />
              Тест (n={n})
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', minWidth: 480, borderBottom: '1px solid #dee2e6' }}>
            {bins.map(({ lo, expected, actual }) => {
              const expH = Math.max(2, (expected / maxVal) * H);
              const actH = actual > 0 ? Math.max(2, (actual / maxVal) * H) : 0;
              return (
                <div key={lo} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: H + 16, width: '100%' }}>
                    {/* Нормаль тархалт */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ fontSize: '0.52rem', color: '#9da5ad', lineHeight: 1.2, height: 14 }}>
                        {expected >= 0.5 ? expected.toFixed(1) : ''}
                      </div>
                      <div style={{ width: '100%', height: expH, background: '#ced4da', borderRadius: '2px 2px 0 0' }}
                        title={`Нормаль тархалт: ${expected.toFixed(2)}`} />
                    </div>
                    {/* Тестийн дүн */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ fontSize: '0.58rem', color: '#0d6efd', fontWeight: 600, lineHeight: 1.2, height: 14 }}>
                        {actual > 0 ? actual : ''}
                      </div>
                      <div style={{ width: '100%', height: actH, background: '#4dabf7', borderRadius: '2px 2px 0 0' }}
                        title={`Тест: ${actual}`} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#868e96', paddingTop: 3, textAlign: 'center' }}>
                    {lo}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const fmtTime = (s) => {
  if (s == null) return '';
  if (s < 60) return `${s}с`;
  return `${Math.floor(s / 60)}м ${s % 60}с`;
};

// Excel export
const exportXLSX = (assignment, problems, results, scoreTable) => {
  const wb = XLSX.utils.book_new();

  // ── 1-р sheet: дүнгийн жагсаалт ──
  const probHeaders = problems.map(p =>
    p.max_point != null ? `Б${p.order} (/${p.max_point})` : `Б${p.order}`
  );
  const hasScaled = !!scoreTable;
  const header = ['Зэрэг', 'Нэр', 'Username', 'Төлөв', ...probHeaders, 'Нийт оноо', ...(hasScaled ? ['Хэмжээст оноо'] : []), 'Хугацаа (сек)'];
  const rows = results.map(r => [
    r.rank ?? '',
    displayName(r.student),
    r.student.username,
    STATUS_CONFIG[r.status]?.label ?? r.status,
    ...(r.problem_points ?? []).map(pt => pt ?? ''),
    r.score ?? '',
    ...(hasScaled ? [getScaledScore(r.score, scoreTable) ?? ''] : []),
    r.time_spent ?? '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Баганы өргөн
  ws['!cols'] = [
    { wch: 6 },   // Зэрэг
    { wch: 22 },  // Нэр
    { wch: 18 },  // Username
    { wch: 14 },  // Төлөв
    ...problems.map(() => ({ wch: 7 })),
    { wch: 10 },  // Нийт
    ...(hasScaled ? [{ wch: 12 }] : []),  // Хэмжээст
    { wch: 12 },  // Хугацаа
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Дүн');

  // ── 2-р sheet: статистик ──
  const scored = results.filter(r => r.score != null);
  const submitted = results.filter(r => ['submitted', 'graded'].includes(r.status));
  const avg = scored.length
    ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1) : '';
  const maxScore = scored.length ? Math.max(...scored.map(r => r.score)) : '';

  // Хэмжээст оноогоор тархалт (scoreTable байвал)
  const scaledHistRows = (() => {
    if (!scoreTable) return [];
    const scaledScores = results.map(r => getScaledScore(r.score, scoreTable)).filter(v => v != null);
    if (!scaledScores.length) return [];
    const n = scaledScores.length;
    const totalP = normalCDF(800) - normalCDF(200);
    const scaledAvg = (scaledScores.reduce((a, b) => a + b, 0) / n).toFixed(1);
    const scaledMax = Math.max(...scaledScores);
    const scaledMin = Math.min(...scaledScores);
    const binRows = Array.from({ length: 12 }, (_, i) => {
      const lo = 200 + i * 50;
      const hi = lo + 50;
      const p = (normalCDF(hi) - normalCDF(lo)) / totalP;
      const actual = scaledScores.filter(s => s >= lo && (i === 11 ? s <= 800 : s < hi)).length;
      return [`${lo}–${i === 11 ? 800 : hi - 1}`, parseFloat((n * p).toFixed(2)), actual];
    });
    return [
      [],
      ['Хэмжээст оноогоор тархалт (μ=500, σ=100)'],
      ['Дундаж хэмжээст оноо', scaledAvg],
      ['Хамгийн өндөр', scaledMax],
      ['Хамгийн бага', scaledMin],
      [],
      ['Завсар', 'Нормаль тархалт', 'Тестийн дүн'],
      ...binRows,
    ];
  })();

  const statsData = [
    ['Даалгавар', assignment?.title ?? ''],
    ['Нийт гишүүн', results.length],
    ['Илгээсэн', submitted.length],
    ['Дундаж оноо', avg],
    ['Хамгийн өндөр оноо', maxScore],
    [],
    ['Бодлого', 'Дундаж оноо', 'Хамгийн өндөр'],
    ...problems.map((p, ci) => {
      const vals = results.map(r => r.problem_points?.[ci]).filter(v => v != null);
      const pAvg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '';
      const pMax = vals.length ? Math.max(...vals) : '';
      return [`Б${p.order}${p.max_point != null ? ` (/${p.max_point})` : ''}`, pAvg, pMax];
    }),
    ...scaledHistRows,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(statsData);
  ws2['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Статистик');

  const title = (assignment?.title ?? 'leaderboard').replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `${title}.xlsx`);
};

const AssignmentLeaderboardPage = () => {
  const { assignmentId } = useParams();
  const { clubData, isTeacherOrAdmin } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.is_staff;

  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [data, setData]     = useState(null);
  const [search, setSearch] = useState('');
  const [subgroups, setSubgroups] = useState([]);
  const [subgroupFilter, setSubgroupFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { submission_id, name }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/club-assignments/${assignmentId}/leaderboard/`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    })();
  }, [assignmentId]);

  useEffect(() => {
    if (!clubData?.id) return;
    apiClient.get('/api/club-subgroups/', { params: { club: clubData.id } })
      .then(res => setSubgroups(res.data.results || res.data || []))
      .catch(() => {});
  }, [clubData?.id]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(
        `/api/club-assignments/${assignmentId}/delete_submission/`,
        { params: { submission_id: deleteTarget.submission_id } }
      );
      // Local state-с устгах
      setData(prev => ({
        ...prev,
        results: prev.results.map(r =>
          r.submission_id === deleteTarget.submission_id
            ? { ...r, submission_id: null, status: 'not_started', score: null, time_spent: null, submitted_at: null, answer_sheet_id: null, source: null }
            : r
        ),
      }));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Устгахад алдаа гарлаа.');
    } finally {
      setDeleting(false);
    }
  };

  // Зэрэг тооцоолол
  const ranked = useMemo(() => {
    if (!data?.results) return [];
    const withScore = data.results.filter(r => r.score != null);
    const noScore   = data.results.filter(r => r.score == null);
    let rank = 1;
    const out = withScore.map((r, idx) => {
      if (idx > 0 && r.score < withScore[idx - 1].score) rank = idx + 1;
      return { ...r, rank };
    });
    return [...out, ...noScore.map(r => ({ ...r, rank: null }))];
  }, [data]);

  // Сонгосон дэд бүлгийн гишүүдийн ID-ын Set
  const subgroupMemberIds = useMemo(() => {
    if (!subgroupFilter) return null;
    const sg = subgroups.find(g => String(g.id) === subgroupFilter);
    return sg ? new Set(sg.member_ids || []) : null;
  }, [subgroups, subgroupFilter]);

  const filtered = useMemo(() => {
    let rows = ranked;
    if (subgroupMemberIds) {
      rows = rows.filter(r => subgroupMemberIds.has(r.student.id));
    }
    if (gradeFilter) {
      rows = rows.filter(r => String(r.student.grade_id) === gradeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        `${r.student.last_name} ${r.student.first_name} ${r.student.username}`.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [ranked, search, subgroupMemberIds, gradeFilter]);

  // Дэд бүлэг/хайлт шүүсний дараа дахин дугаарлах
  const reRanked = useMemo(() => {
    const withScore = filtered.filter(r => r.score != null);
    const noScore   = filtered.filter(r => r.score == null);
    let rank = 1;
    const out = withScore.map((r, idx) => {
      if (idx > 0 && r.score < withScore[idx - 1].score) rank = idx + 1;
      return { ...r, rank };
    });
    return [...out, ...noScore.map(r => ({ ...r, rank: null }))];
  }, [filtered]);

  // Байгаа grade-уудыг жагсаалтаас гаргах
  const gradeOptions = useMemo(() => {
    const seen = new Map();
    for (const r of ranked) {
      const { grade_id, grade_name } = r.student;
      if (grade_id != null && !seen.has(grade_id)) seen.set(grade_id, grade_name);
    }
    return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([id, name]) => ({ id, name }));
  }, [ranked]);

  // Статистик — filtered-аар тооцоолох (дэд бүлэг + хайлт хамаарна)
  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const scored    = filtered.filter(r => r.score != null);
    const submitted = filtered.filter(r => ['submitted', 'graded'].includes(r.status));
    const timed     = filtered.filter(r => r.time_spent != null);
    const avg = scored.length
      ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1) : null;
    const avgTime = timed.length
      ? Math.round(timed.reduce((s, r) => s + r.time_spent, 0) / timed.length) : null;
    return {
      total: filtered.length,
      submitted: submitted.length,
      avg,
      max: scored.length ? Math.max(...scored.map(r => r.score)) : null,
      pct: filtered.length ? Math.round((submitted.length / filtered.length) * 100) : 0,
      avgTime,
    };
  }, [filtered]);

  // Бодлого бүрийн дундаж оноо (filtered-аар)
  const problemAvgs = useMemo(() => {
    const problems = data?.problems ?? [];
    return problems.map((_, ci) => {
      const vals = filtered
        .map(r => r.problem_points?.[ci])
        .filter(v => v != null);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    });
  }, [data, filtered]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;

  if (error) return (
    <div className="py-3">
      <AppBreadcrumb className="mb-2" items={[
        { label: 'Клубууд', to: '/clubs' },
        { label: clubData?.name || 'Клуб', to: `/clubs/${clubData?.id}` },
        { label: 'Даалгаврууд', to: `/clubs/${clubData?.id}/assignments` },
        { label: 'Дүнгийн жагсаалт' },
      ]} />
      <div className="text-danger small">{error}</div>
    </div>
  );

  if (!data) return null;

  const { assignment, problems = [] } = data;
  const maxScore = assignment?.max_score;
  const hasProblems = problems.length > 0;

  // score_table parse: "200,207,..." → [200, 207, ...]
  const scoreTable = assignment?.score_table
    ? assignment.score_table.split(',').map(Number)
    : null;

  return (
    <>
    <div className="container-fluid py-3 px-2 px-md-3">
      {/* ── Толгой ── */}
      <AppBreadcrumb className="mb-3" items={[
        { label: 'Клубууд', to: '/clubs' },
        { label: clubData?.name || 'Клуб', to: `/clubs/${clubData?.id}` },
        { label: 'Даалгаврууд', to: `/clubs/${clubData?.id}/assignments` },
        { label: assignment?.title || '…', to: `/clubs/${clubData?.id}/assignments/${assignmentId}` },
        { label: 'Дүнгийн жагсаалт' },
      ]} />
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <Trophy size={18} className="text-warning" />
          Дүнгийн жагсаалт
        </h5>
        {assignment?.title && <span className="text-muted small">— {assignment.title}</span>}
        <div className="ms-auto d-flex gap-2 align-items-center flex-wrap">
          {subgroups.length > 0 && (
            <Form.Select size="sm" style={{ width: 140 }}
              value={subgroupFilter} onChange={e => setSubgroupFilter(e.target.value)}>
              <option value="">Бүх бүлэг</option>
              {subgroups.map(sg => (
                <option key={sg.id} value={String(sg.id)}>{sg.name}</option>
              ))}
            </Form.Select>
          )}
          {gradeOptions.length > 0 && (
            <Form.Select size="sm" style={{ width: 120 }}
              value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="">Бүх анги</option>
              {gradeOptions.map(g => (
                <option key={g.id} value={String(g.id)}>{g.name}</option>
              ))}
            </Form.Select>
          )}
          <div style={{ width: 190 }} className="input-group input-group-sm">
            <span className="input-group-text"><Search size={12} /></span>
            <input className="form-control" placeholder="Нэрээр хайх..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <Button variant="outline-success" size="sm"
            onClick={() => exportXLSX(assignment, problems, reRanked, scoreTable)} title="Excel татах">
            <Download size={14} className="me-1" />Excel
          </Button>
        </div>
      </div>

      {/* ── Статистик ── */}
      {stats && (
        <div className="card border-warning mb-3">
          <div className="card-body py-2">
            <div className="d-flex gap-4 flex-wrap align-items-center">
              <div className="text-center">
                <div className="fw-bold fs-5 text-primary">{stats.total}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Нийт гишүүн</div>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-success">{stats.submitted}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Илгээсэн</div>
              </div>
              {stats.avg != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-info">{stats.avg}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Дундаж</div>
                </div>
              )}
              {stats.max != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-warning">
                    {stats.max}{maxScore ? `/${maxScore}` : ''}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Өндөр оноо</div>
                </div>
              )}
              {stats.avgTime != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-secondary">{fmtTime(stats.avgTime)}</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Дундаж хугацаа</div>
                </div>
              )}
              <div className="flex-grow-1" style={{ minWidth: 120 }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.72rem' }}>
                  Хамрагдалт {stats.pct}%
                </div>
                <ProgressBar now={stats.pct} variant="success" style={{ height: 5 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Хэмжээст оноогоор тархалт ── */}
      {scoreTable && <ScaledScoreHistogram results={filtered} scoreTable={scoreTable} />}

      {/* ── Дэлгэрэнгүй хүснэгт ── */}
      <div className="card border-0 shadow-sm">
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-bordered table-sm mb-0 align-middle"
            style={{ fontSize: '0.78rem', minWidth: hasProblems ? 600 : 400 }}>
            <thead className="table-light">
              <tr>
                {/* Зэрэг */}
                <th className="text-center" style={{
                  width: 44, minWidth: 44, maxWidth: 44, position: 'sticky', left: 0, zIndex: 3, background: '#f8f9fa',
                }}>#</th>

                {/* Сурагч */}
                <th style={{
                  minWidth: 170, position: 'sticky', left: 44, zIndex: 3, background: '#f8f9fa',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.07)',
                }}>
                  Сурагч ({filtered.length})
                </th>

                {/* Бодлого бүрийн баган */}
                {problems.map((p, ci) => (
                  <th key={ci} className="text-center"
                    style={{ minWidth: 46, maxWidth: 56, whiteSpace: 'nowrap', cursor: p.statement ? 'pointer' : 'default' }}
                    title={p.statement ? p.title : undefined}
                    onClick={() => p.statement && setSelectedProblem(p)}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{p.order}</div>
                  </th>
                ))}

                {/* Нийт */}
                <th className="text-center" style={{ minWidth: 64, background: '#f8f9fa' }}>
                  Нийт{maxScore ? `/${maxScore}` : ''}
                </th>

                {/* Хэмжээст оноо */}
                {scoreTable && (
                  <th className="text-center" style={{ minWidth: 72, background: '#f8f9fa' }}>
                    <div style={{ fontSize: '0.72rem' }}>Хэмжээст</div>
                    <div className="text-muted fw-normal" style={{ fontSize: '0.62rem' }}>оноо</div>
                  </th>
                )}

                {/* Хугацаа */}
                <th className="text-center" style={{ minWidth: 72 }}>Хугацаа</th>

                {/* Төлөв */}
                <th className="text-center" style={{ minWidth: 80 }}>Төлөв</th>

                {/* Харах (багш) / Устгах (staff) */}
                {(isTeacherOrAdmin || isStaff) && <th style={{ width: isStaff ? 72 : 48 }} />}
              </tr>

              {/* Дундаж мөр */}
              {hasProblems && (
                <tr className="table-secondary" style={{ fontSize: '0.72rem' }}>
                  <td className="text-center text-muted" style={{
                    position: 'sticky', left: 0, zIndex: 2, background: '#e9ecef',
                    width: 44, minWidth: 44, maxWidth: 44,
                  }}>∅</td>
                  <td style={{
                    position: 'sticky', left: 44, zIndex: 2, background: '#e9ecef',
                    fontWeight: 600, color: '#495057',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.07)',
                  }}>Дундаж</td>
                  {problemAvgs.map((avg, ci) => (
                    <td key={ci} className="text-center fw-semibold"
                      style={{ color: avg != null ? '#0d6efd' : '#adb5bd' }}>
                      {avg ?? '—'}
                    </td>
                  ))}
                  <td className="text-center fw-semibold" style={{ color: '#0d6efd' }}>
                    {filtered.filter(r => r.score != null).length > 0
                      ? (filtered.filter(r => r.score != null)
                          .reduce((s, r) => s + r.score, 0) /
                          filtered.filter(r => r.score != null).length
                        ).toFixed(1)
                      : '—'}
                  </td>
                  {scoreTable && (() => {
                    const scaledVals = filtered
                      .map(r => getScaledScore(r.score, scoreTable))
                      .filter(v => v != null);
                    const avg = scaledVals.length
                      ? (scaledVals.reduce((a, b) => a + b, 0) / scaledVals.length).toFixed(1)
                      : null;
                    return (
                      <td className="text-center fw-semibold" style={{ color: avg != null ? '#0d6efd' : '#adb5bd' }}>
                        {avg ?? '—'}
                      </td>
                    );
                  })()}
                  <td className="text-center fw-semibold text-muted">
                    {stats?.avgTime != null ? fmtTime(stats.avgTime) : '—'}
                  </td>
                  <td />
                  {(isTeacherOrAdmin || isStaff) && <td />}
                </tr>
              )}
            </thead>

            <tbody>
              {reRanked.length === 0 ? (
                <tr>
                  <td colSpan={4 + problems.length + (scoreTable ? 1 : 0) + (isTeacherOrAdmin ? 1 : 0)}
                    className="text-center text-muted py-3">
                    {search ? `"${search}" хайлтанд тохирох сурагч олдсонгүй` : 'Жагсаалт хоосон байна'}
                  </td>
                </tr>
              ) : reRanked.map((r) => {
                const si = STATUS_CONFIG[r.status] || STATUS_CONFIG.not_started;
                const hasResult = r.answer_sheet_id &&
                  ['submitted', 'graded'].includes(r.status);

                return (
                  <tr key={r.student.id}
                    className={r.rank === 1 ? 'table-warning' : r.rank <= 3 ? 'table-light' : ''}>

                    {/* Зэрэг */}
                    <td className="text-center fw-bold" style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      width: 44, minWidth: 44, maxWidth: 44,
                      background: r.rank === 1 ? '#fff3cd' : r.rank <= 3 ? '#f8f9fa' : '#fff',
                    }}>
                      {r.rank != null
                        ? (MEDAL[r.rank] || <span className="text-muted">{r.rank}</span>)
                        : <span className="text-muted">—</span>}
                    </td>

                    {/* Сурагч */}
                    <td style={{
                      position: 'sticky', left: 44, zIndex: 1,
                      background: r.rank === 1 ? '#fff3cd' : r.rank <= 3 ? '#f8f9fa' : '#fff',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.07)',
                      paddingLeft: '0.75rem',
                    }}>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar student={r.student} size={24} />
                        <div className="overflow-hidden">
                          <div
                            className="fw-medium text-truncate"
                            style={{ maxWidth: 120, cursor: 'pointer', color: '#0d6efd' }}
                            onClick={() => navigate(`/clubs/${clubData?.id}/report/${r.student.username}`)}
                          >
                            {displayName(r.student)}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.65rem' }}>
                            @{r.student.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Бодлого бүрийн оноо */}
                    {problems.map((p, ci) => {
                      const pt = r.problem_points?.[ci];
                      const { bg, color } = pointColor(pt, p.max_point);
                      return (
                        <td key={ci} className="text-center fw-medium"
                          style={{ background: bg, color }}>
                          {pt != null ? pt : <span style={{ opacity: 0.35 }}>—</span>}
                        </td>
                      );
                    })}

                    {/* Нийт */}
                    <td className="text-center fw-bold"
                      style={{ background: '#f8f9fa' }}>
                      {r.score != null
                        ? <span className={r.rank === 1 ? 'text-warning' : 'text-primary'}>
                            {r.score}
                          </span>
                        : <span className="text-muted fw-normal">—</span>}
                    </td>

                    {/* Хэмжээст оноо */}
                    {scoreTable && (() => {
                      const scaled = getScaledScore(r.score, scoreTable);
                      return (
                        <td className="text-center fw-bold" style={{ background: '#f0f4ff' }}>
                          {scaled != null
                            ? <span className="text-primary">{scaled}</span>
                            : <span className="text-muted fw-normal">—</span>}
                        </td>
                      );
                    })()}

                    {/* Хугацаа */}
                    <td className="text-center text-muted" style={{ fontSize: '0.75rem' }}>
                      {r.time_spent != null ? fmtTime(r.time_spent) : <span style={{ opacity: 0.35 }}>—</span>}
                    </td>

                    {/* Төлөв */}
                    <td className="text-center">
                      <Badge bg={si.bg} style={{ fontSize: '0.65rem' }}>{si.label}</Badge>
                      {r.source === 'answer_sheet' && (
                        <div>
                          <Badge bg="light" text="secondary" className="border mt-1"
                            style={{ fontSize: '0.58rem' }}>import</Badge>
                        </div>
                      )}
                    </td>

                    {/* Харах (багш) / Устгах (staff) */}
                    {(isTeacherOrAdmin || isStaff) && (
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          {hasResult && (
                            <Button variant="outline-primary" size="sm" className="py-0 px-1"
                              title="Дэлгэрэнгүй харах"
                              onClick={() => navigate(
                                `/quiz/${encodeURIComponent(data.assignment?.quiz_uuid || '')}/result/${r.answer_sheet_id}`
                              )}>
                              👁
                            </Button>
                          )}
                          {isStaff && r.submission_id && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="py-0 px-1"
                              title="Submission устгах"
                              onClick={() => setDeleteTarget({
                                submission_id: r.submission_id,
                                name: displayName(r.student),
                              })}
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Өнгөний тайлбар */}
        <div className="card-footer bg-white border-top py-2">
          <div className="d-flex gap-3 flex-wrap align-items-center">
            <span className="text-muted small">Оноо:</span>
            {[
              { bg: '#d1e7dd', text: '#0a3622', label: '≥80%' },
              { bg: '#fff3cd', text: '#664d03', label: '50–79%' },
              { bg: '#ffe5d9', text: '#6d1a0f', label: '1–49%' },
              { bg: '#f8d7da', text: '#58151c', label: '0' },
              { bg: '#f8f9fa', text: '#adb5bd', label: 'Өгөөгүй' },
            ].map(({ bg, text, label }) => (
              <span key={label} className="d-flex align-items-center gap-1 small">
                <span style={{
                  width: 12, height: 12, background: bg,
                  border: '1px solid #dee2e6', display: 'inline-block', borderRadius: 2,
                }} />
                <span style={{ color: text }}>{label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>

      {/* Submission устгах баталгаажуулах модаль */}
      <Modal show={!!deleteTarget} onHide={() => !deleting && setDeleteTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 text-danger">
            <Trash2 size={16} className="me-2" />
            Submission устгах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">
            <strong>{deleteTarget?.name}</strong>-ийн submission-г устгах уу?
          </p>
          <p className="text-muted small mb-0">
            Энэ үйлдлийг буцаах боломжгүй. Сурагч дахин даалгавар ажиллах боломжтой болно.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Болих
          </Button>
          <Button variant="danger" size="sm" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? <Spinner animation="border" size="sm" /> : <><Trash2 size={13} className="me-1" />Устгах</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Бодлогын өгүүлбэр модаль */}
      <Modal show={!!selectedProblem} onHide={() => setSelectedProblem(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem' }}>
            {selectedProblem && (
              <MathJax dynamic>{selectedProblem.title}</MathJax>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedProblem && (
            <MathJax dynamic>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {selectedProblem.statement}
              </div>
            </MathJax>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setSelectedProblem(null)}>
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AssignmentLeaderboardPage;
