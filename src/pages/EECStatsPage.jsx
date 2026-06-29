// frontend/src/pages/EECStatsPage.jsx

import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Spinner, Form, Row, Col, Badge } from 'react-bootstrap';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import apiClient from '../api/axiosConfig';

const BULEG_LIST = [
  'Бүлэг I. Түүх',
  'Бүлэг II. Физик',
  'Бүлэг III. Хими',
  'Бүлэг IV. Газар зүй',
  'Бүлэг V. Англи хэл',
  'Бүлэг VI. Биологи',
  'Бүлэг VII. Математик',
  'Бүлэг VIII. Монгол хэл',
  'Бүлэг IX. Орос хэл',
  'Бүлэг X. Нийгэм судлал',
];

function fmt(val) {
  if (val == null) return '—';
  return Number(val).toFixed(1);
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ArrowUpDown size={13} className="ms-1 text-muted opacity-50" />;
  return sortDir === 'asc'
    ? <ArrowUp size={13} className="ms-1 text-white" />
    : <ArrowDown size={13} className="ms-1 text-white" />;
}

const SORT_COLS = ['aimag', 'student_count', 'avg_score', 'avg_weighted'];

export default function EECStatsPage() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [buleg, setBuleg]       = useState('');
  const [availBulegs, setAvailBulegs] = useState([]);

  // Sort state
  const [sortCol, setSortCol]   = useState('avg_score');
  const [sortDir, setSortDir]   = useState('desc');

  // Боломжит бүлгүүдийг meta-аас татах
  useEffect(() => {
    apiClient.get('/api/integral/eec-results/meta/').then(res => {
      setAvailBulegs(res.data.bulegs || BULEG_LIST);
    }).catch(() => setAvailBulegs(BULEG_LIST));
  }, []);

  useEffect(() => {
    load();
  }, [buleg]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (buleg) params.set('buleg', buleg);
      const res = await apiClient.get(`/api/integral/eec-results/aimag-stats/?${params}`);
      setRows(res.data || []);
    } catch {
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }

  const sorted = [...rows].sort((a, b) => {
    let av = a[sortCol], bv = b[sortCol];
    if (typeof av === 'string') av = av.localeCompare(bv, 'mn');
    else av = (av ?? -Infinity) - (bv ?? -Infinity);
    return sortDir === 'asc' ? av : -av;
  });

  // Нийт дундаж тооцоолох
  const totalStudents = rows.reduce((s, r) => s + (r.student_count || 0), 0);
  const validScore    = rows.filter(r => r.avg_score != null);
  const validWeighted = rows.filter(r => r.avg_weighted != null);
  const overallAvgScore    = validScore.length
    ? validScore.reduce((s, r) => s + r.avg_score * r.student_count, 0) / validScore.reduce((s, r) => s + r.student_count, 0)
    : null;
  const overallAvgWeighted = validWeighted.length
    ? validWeighted.reduce((s, r) => s + r.avg_weighted * r.student_count, 0) / validWeighted.reduce((s, r) => s + r.student_count, 0)
    : null;

  // А.Оноо-гийн хамгийн өндөр утга (progress bar-д)
  const maxScore    = Math.max(...rows.map(r => r.avg_score    ?? 0), 1);
  const maxWeighted = Math.max(...rows.map(r => r.avg_weighted ?? 0), 1);

  const thStyle = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };

  return (
    <Container fluid className="py-4" style={{ maxWidth: 1000 }}>
      <h4 className="fw-bold mb-3">ЭЕШ 2026 — Аймгуудын дундаж оноо</h4>

      {/* Шүүлтүүр */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="py-2 px-3">
          <Row className="g-2 align-items-end">
            <Col xs={12} sm={5} md={4}>
              <Form.Label className="small text-muted mb-1">ЭШ-ын бүлэг</Form.Label>
              <Form.Select size="sm" value={buleg} onChange={e => setBuleg(e.target.value)}>
                <option value="">— Бүгд (нийт дундаж) —</option>
                {availBulegs.map(b => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Col>
            {buleg && (
              <Col xs="auto">
                <Badge bg="primary" className="py-2 px-3">{buleg}</Badge>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Нийт дундаж карт */}
      {!loading && rows.length > 0 && (
        <Row className="g-3 mb-3">
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm text-center py-2">
              <div className="fs-4 fw-bold text-primary">{totalStudents.toLocaleString()}</div>
              <div className="small text-muted">Нийт оюутан</div>
            </Card>
          </Col>
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm text-center py-2">
              <div className="fs-4 fw-bold text-success">{fmt(overallAvgScore)}</div>
              <div className="small text-muted">А.Оноо дундаж</div>
            </Card>
          </Col>
          <Col xs={6} md={4}>
            <Card className="border-0 shadow-sm text-center py-2">
              <div className="fs-4 fw-bold text-warning">{fmt(overallAvgWeighted)}</div>
              <div className="small text-muted">Х.Оноо дундаж</div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Хүснэгт */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <div className="p-3 text-danger small">{error}</div>}

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5 gap-2">
              <Spinner animation="border" size="sm" />
              <span className="text-muted">Уншиж байна...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-5 text-muted">
              Мэдээлэл байхгүй. Эхлээд import хийнэ үү.
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle" size="sm">
              <thead style={{ backgroundColor: '#212529', color: '#fff' }}>
                <tr>
                  <th className="px-3" style={{ width: 40 }}>#</th>
                  <th style={thStyle} onClick={() => handleSort('aimag')}>
                    Аймаг / Хот <SortIcon col="aimag" sortCol={sortCol} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, width: 100 }} className="text-end pe-3" onClick={() => handleSort('student_count')}>
                    Оюутан <SortIcon col="student_count" sortCol={sortCol} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, width: 200 }} onClick={() => handleSort('avg_score')}>
                    А.Оноо дундаж <SortIcon col="avg_score" sortCol={sortCol} sortDir={sortDir} />
                  </th>
                  <th style={{ ...thStyle, width: 200 }} onClick={() => handleSort('avg_weighted')}>
                    Х.Оноо дундаж <SortIcon col="avg_weighted" sortCol={sortCol} sortDir={sortDir} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => {
                  const scoreRatio    = maxScore    > 0 ? (row.avg_score    ?? 0) / maxScore    : 0;
                  const weightedRatio = maxWeighted > 0 ? (row.avg_weighted ?? 0) / maxWeighted : 0;

                  return (
                    <tr key={row.aimag}>
                      <td className="px-3 text-muted small">{idx + 1}</td>
                      <td className="fw-semibold">{row.aimag}</td>
                      <td className="text-end pe-3 text-muted small">
                        {(row.student_count || 0).toLocaleString()}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold" style={{ minWidth: 36 }}>{fmt(row.avg_score)}</span>
                          <div style={{ flex: 1, height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${scoreRatio * 100}%`,
                              height: '100%',
                              backgroundColor: '#0d6efd',
                              borderRadius: 4,
                            }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold" style={{ minWidth: 44 }}>{fmt(row.avg_weighted)}</span>
                          <div style={{ flex: 1, height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${weightedRatio * 100}%`,
                              height: '100%',
                              backgroundColor: '#ffc107',
                              borderRadius: 4,
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
