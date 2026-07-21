// ClubScoresPage — клубын даалгаврын дүнгийн матриц
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import { BarChart2, Download } from 'lucide-react';
import apiClient from '../api/axiosConfig';

const Avatar = ({ student, size = 26 }) => {
  const init = (student.first_name?.[0] || student.username?.[0] || '?').toUpperCase();
  if (student.picture_url) {
    return (
      <img src={student.picture_url} alt="" className="rounded-circle flex-shrink-0"
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

// Оноог хувиар тооцон өнгө буцаана
const scoreColor = (score, maxScore) => {
  if (score == null) return { bg: '#f8f9fa', text: '#adb5bd' };
  const pct = maxScore ? (score / maxScore) * 100 : null;
  if (pct == null) return { bg: '#e9ecef', text: '#495057' };
  if (pct >= 80) return { bg: '#d1e7dd', text: '#0a3622' };
  if (pct >= 60) return { bg: '#fff3cd', text: '#664d03' };
  if (pct >= 40) return { bg: '#ffe5d9', text: '#6d1a0f' };
  return { bg: '#f8d7da', text: '#58151c' };
};

// CSV export
const exportCSV = (assignments, members) => {
  const header = ['Нэр', 'Username', ...assignments.map(a => a.title), 'Нийт', 'ЭЕШ (Х.Оноо)'];
  const rows = members.map(m => [
    displayName(m.student),
    m.student.username,
    ...m.scores.map(s => (s != null ? s : '')),
    m.total,
    m.student.eec_result?.weighted_score ?? '',
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'scores.csv'; a.click();
  URL.revokeObjectURL(url);
};

const ClubScoresPage = () => {
  const { clubData } = useOutletContext();
  const clubId = clubData?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { assignments, members }
  const [search, setSearch] = useState('');
  const [subgroupFilter, setSubgroupFilter] = useState('');
  const [eecUnmatchedOnly, setEecUnmatchedOnly] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/clubs/${clubId}/scores_matrix/`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  // Unique subgroups for filter
  const subgroups = useMemo(() => {
    if (!data) return [];
    const map = {};
    data.members.forEach(m => {
      (m.subgroups || []).forEach(sg => { map[sg.id] = sg; });
    });
    return Object.values(map);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.members;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(m => {
        const name = `${m.student.last_name} ${m.student.first_name} ${m.student.username}`.toLowerCase();
        return name.includes(q);
      });
    }
    if (subgroupFilter) {
      rows = rows.filter(m => (m.subgroups || []).some(sg => String(sg.id) === subgroupFilter));
    }
    if (eecUnmatchedOnly) {
      rows = rows.filter(m => !m.student.eec_result);
    }
    return rows;
  }, [data, search, subgroupFilter, eecUnmatchedOnly]);

  const eecUnmatchedCount = useMemo(() => {
    if (!data) return 0;
    return data.members.filter(m => !m.student.eec_result).length;
  }, [data]);

  // Column averages
  const colAvgs = useMemo(() => {
    if (!data) return [];
    return data.assignments.map((_, ci) => {
      const vals = filtered.map(m => m.scores[ci]).filter(s => s != null);
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    });
  }, [data, filtered]);

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  }
  if (error) {
    return <div className="text-danger small py-3">{error}</div>;
  }
  if (!data) return null;

  const { assignments } = data;

  return (
    <div className="container-fluid px-0">
      {/* Толгой */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <BarChart2 size={18} />
          Дүнгийн матриц
        </h5>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          {subgroups.length > 0 && (
            <Form.Select size="sm" style={{ width: 160 }}
              value={subgroupFilter} onChange={e => setSubgroupFilter(e.target.value)}>
              <option value="">Бүх бүлэг</option>
              {subgroups.map(sg => (
                <option key={sg.id} value={String(sg.id)}>{sg.name}</option>
              ))}
            </Form.Select>
          )}
          <Form.Control size="sm" placeholder="Нэрээр хайх..." style={{ width: 160 }}
            value={search} onChange={e => setSearch(e.target.value)} />
          {eecUnmatchedCount > 0 && (
            <Form.Check
              type="checkbox"
              id="eec-unmatched-only"
              label={`ЭЕШ холбогдоогүй (${eecUnmatchedCount})`}
              checked={eecUnmatchedOnly}
              onChange={e => setEecUnmatchedOnly(e.target.checked)}
              className="small text-nowrap"
            />
          )}
          <Button variant="outline-secondary" size="sm"
            onClick={() => exportCSV(assignments, filtered)} title="CSV татах">
            <Download size={14} className="me-1" />CSV
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center text-muted small py-5">Даалгавар байхгүй байна.</div>
      ) : (
        <Card className="border-0 shadow-sm">
          <div style={{ overflowX: 'auto' }}>
            <table className="table table-bordered table-sm mb-0 align-middle"
              style={{ minWidth: 500, fontSize: '0.8rem' }}>
              <thead className="table-light">
                <tr>
                  {/* Sticky student column header */}
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 2,
                    background: '#f8f9fa', minWidth: 160, maxWidth: 200,
                  }}>
                    Сурагч ({filtered.length})
                  </th>
                  {assignments.map((a, _ci) => (
                    <th key={a.id} className="text-center"
                      style={{ minWidth: 90, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <div style={{ fontSize: '0.72rem', lineHeight: 1.2 }}>{a.title}</div>
                      {a.max_score && (
                        <div className="text-muted fw-normal" style={{ fontSize: '0.65rem' }}>/{a.max_score}</div>
                      )}
                      {a.deadline && (
                        <div className="text-muted fw-normal" style={{ fontSize: '0.62rem' }}>
                          {new Date(a.deadline).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="text-center" style={{ minWidth: 60, background: '#f8f9fa' }}>
                    Нийт
                  </th>
                  <th className="text-center" style={{ minWidth: 80, background: '#f8f9fa' }}
                    title="Улсын ЭЕШ-ийн жинхэнэ дүн (Х.Оноо), клубын хичээлтэй тохирох бүлгээс">
                    ЭЕШ
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Дундаж мөр */}
                <tr className="table-secondary">
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 1,
                    background: '#e9ecef', fontWeight: 600, fontSize: '0.75rem',
                  }}>
                    Дундаж
                  </td>
                  {colAvgs.map((avg, ci) => (
                    <td key={ci} className="text-center fw-semibold"
                      style={{ color: avg != null ? '#0d6efd' : '#adb5bd' }}>
                      {avg ?? '—'}
                    </td>
                  ))}
                  <td className="text-center">
                    {(() => {
                      const active = filtered.filter(m => m.count > 0);
                      return active.length > 0
                        ? (active.reduce((s, m) => s + m.total, 0) / active.length).toFixed(1)
                        : '—';
                    })()}
                  </td>
                  <td className="text-center">
                    {(() => {
                      const withEec = filtered.filter(m => m.student.eec_result?.weighted_score != null);
                      return withEec.length > 0
                        ? Math.round(withEec.reduce((s, m) => s + m.student.eec_result.weighted_score, 0) / withEec.length)
                        : '—';
                    })()}
                  </td>
                </tr>

                {/* Сурагч бүрийн мөр */}
                {filtered.map((m) => (
                  <tr key={m.student.id}>
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 1,
                      background: '#fff', maxWidth: 200,
                    }}>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar student={m.student} size={24} />
                        <div className="overflow-hidden">
                          <div className="fw-medium text-truncate" style={{ maxWidth: 130 }}>
                            {displayName(m.student)}
                          </div>
                          {m.subgroups?.length > 0 && (
                            <div className="d-flex gap-1 flex-wrap mt-1">
                              {m.subgroups.map(sg => (
                                <Badge key={sg.id} bg={sg.color}
                                  style={{ fontSize: '0.6rem', padding: '2px 5px' }}>
                                  {sg.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {m.scores.map((score, ci) => {
                      const { bg, text } = scoreColor(score, assignments[ci].max_score);
                      return (
                        <td key={ci} className="text-center fw-medium"
                          style={{ background: bg, color: text }}>
                          {score != null ? score : <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                      );
                    })}
                    <td className="text-center fw-bold text-primary">
                      {m.count > 0 ? m.total : <span className="text-muted fw-normal">—</span>}
                    </td>
                    <td className="text-center">
                      {m.student.eec_result ? (
                        <>
                          <div className="fw-semibold" style={{ fontSize: '0.78rem' }}>
                            {m.student.eec_result.weighted_score != null ? Math.round(m.student.eec_result.weighted_score) : '—'}
                          </div>
                          {m.student.eec_result.score != null && (
                            <div className="text-muted" style={{ fontSize: '0.62rem' }}>
                              {m.student.eec_result.score} оноо
                            </div>
                          )}
                        </>
                      ) : (
                        <span
                          className="text-muted"
                          style={{ opacity: 0.4 }}
                          title={m.student.eec_register ? 'ЭЕШ дүн олдсонгүй' : 'Регистрийн дугаар оноогоогүй'}
                        >
                          {m.student.eec_register ? '—' : '⋯'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Өнгөний тайлбар */}
          <Card.Footer className="bg-white border-top py-2">
            <div className="d-flex gap-3 flex-wrap align-items-center">
              <span className="text-muted small">Оноог:</span>
              {[
                { bg: '#d1e7dd', text: '#0a3622', label: '≥80%' },
                { bg: '#fff3cd', text: '#664d03', label: '60–79%' },
                { bg: '#ffe5d9', text: '#6d1a0f', label: '40–59%' },
                { bg: '#f8d7da', text: '#58151c', label: '<40%' },
                { bg: '#f8f9fa', text: '#adb5bd', label: 'Өгөөгүй' },
              ].map(({ bg, text, label }) => (
                <span key={label} className="d-flex align-items-center gap-1 small">
                  <span style={{ width: 14, height: 14, background: bg, border: '1px solid #dee2e6', display: 'inline-block', borderRadius: 2 }} />
                  <span style={{ color: text }}>{label}</span>
                </span>
              ))}
            </div>
          </Card.Footer>
        </Card>
      )}
    </div>
  );
};

export default ClubScoresPage;
