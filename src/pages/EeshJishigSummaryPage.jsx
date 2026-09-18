// frontend/src/pages/EeshJishigSummaryPage.jsx
// Admin: "ЭЕШ жишиг" keyword-той бодлогуудын нэгдсэн summary (тоо, эх сурвалж/
// төрөл/хүндрэл/сэдэв/төлөвөөр задаргаа, бодолтын хамрал).

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Spinner, Row, Col, Badge, Button, Alert } from 'react-bootstrap';
import { ArrowLeft, Pencil, ListChecks } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { API_ENDPOINTS } from '../constants/api.js';

function Bar({ ratio, color = '#0d6efd' }) {
  return (
    <div style={{ flex: 1, height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <Card className="border-0 shadow-sm text-center py-2">
      <div className="fs-4 fw-bold" style={{ color }}>{value}</div>
      <div className="small text-muted">{label}</div>
    </Card>
  );
}

export default function EeshJishigSummaryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}eesh-jishig-summary/`)
      .then((res) => setData(res.data))
      .catch(() => setError('Мэдээлэл татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, []);

  return (
      <Container fluid className="py-4" style={{ maxWidth: 1100 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Link to="/admin" className="btn btn-sm btn-outline-secondary">
              <ArrowLeft size={15} className="me-1" />
              Буцах
            </Link>
            <h4 className="fw-bold mb-0">ЭЕШ жишиг бодлогын summary</h4>
          </div>
          <Button as={Link} to="/admin/eesh-jishig" variant="outline-primary" size="sm">
            Жагсаалт засах →
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5 gap-2">
            <Spinner animation="border" size="sm" />
            <span className="text-muted">Уншиж байна...</span>
          </div>
        ) : data ? (
          <>
            {/* Толгой тоонууд */}
            <Row className="g-3 mb-3">
              <Col xs={6} md={3}>
                <StatCard value={data.total.toLocaleString()} label="Нийт бодлого" color="#0d6efd" />
              </Col>
              <Col xs={6} md={3}>
                <StatCard
                  value={`${data.with_solution.toLocaleString()} (${Math.round((data.with_solution / (data.total || 1)) * 100)}%)`}
                  label="Бодолттой"
                  color="#198754"
                />
              </Col>
              <Col xs={6} md={3}>
                <StatCard value={data.without_solution.toLocaleString()} label="Бодолтгүй" color="#dc3545" />
              </Col>
              <Col xs={6} md={3}>
                <StatCard value={data.by_public.public.toLocaleString()} label="Нийтэд харагдана" color="#6c757d" />
              </Col>
            </Row>

            <Row className="g-3">
              {/* Эх сурвалжаар задаргаа */}
              <Col xs={12} lg={7}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-white fw-semibold small">Эх сурвалжаар</Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive size="sm" className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th className="ps-3">Эх сурвалж</th>
                          <th className="text-end" style={{ width: 70 }}>Тоо</th>
                          <th style={{ width: 160 }}>Бодолттой</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.by_source.map((s) => {
                          const ratio = s.count ? s.with_solution / s.count : 0;
                          const complete = s.with_solution === s.count;
                          return (
                            <tr key={s.quiz_id}>
                              <td className="ps-3 small">{s.title}</td>
                              <td className="text-end small text-muted">{s.count}</td>
                              <td>
                                <div className="d-flex align-items-center gap-2 pe-3">
                                  <span className="small" style={{ minWidth: 40 }}>
                                    {s.with_solution}/{s.count}
                                  </span>
                                  <Bar ratio={ratio} color={complete ? '#198754' : '#ffc107'} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>

              {/* Төрлөөр + Хүндрэлээр */}
              <Col xs={12} lg={5}>
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-white fw-semibold small">Төрлөөр</Card.Header>
                  <Card.Body className="py-2">
                    {data.by_type.map((t) => (
                      <div key={t.type} className="d-flex align-items-center gap-2 mb-2">
                        <span className="small" style={{ minWidth: 100 }}>{t.label}</span>
                        <Bar ratio={t.count / (data.total || 1)} />
                        <span className="small text-muted" style={{ minWidth: 32 }}>{t.count}</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white fw-semibold small">Хүндрэлээр</Card.Header>
                  <Card.Body className="py-2">
                    {data.by_level.map((l) => (
                      <div key={l.level_id ?? 'none'} className="d-flex align-items-center gap-2 mb-2">
                        <span className="small" style={{ minWidth: 100 }}>{l.name}</span>
                        <Bar ratio={l.count / (data.total || 1)} color="#6f42c1" />
                        <span className="small text-muted" style={{ minWidth: 32 }}>{l.count}</span>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Сэдвээр */}
            <Card className="border-0 shadow-sm mt-3">
              <Card.Header className="bg-white fw-semibold small">Сэдвээр (категори)</Card.Header>
              <Card.Body className="d-flex flex-wrap gap-2 py-3">
                {data.by_category.map((c) => (
                  <Badge key={c.category_id ?? 'none'} style={{ backgroundColor: c.color }} className="py-2 px-3">
                    {c.name} · {c.count}
                  </Badge>
                ))}
              </Card.Body>
            </Card>

            {/* Бодолтгүй бодлогууд */}
            {data.missing_solutions.length > 0 && (
              <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-white fw-semibold small d-flex align-items-center gap-2">
                  <ListChecks size={15} />
                  Бодолтгүй бодлогууд ({data.missing_solutions.length})
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive size="sm" className="mb-0 align-middle">
                    <thead>
                      <tr>
                        <th className="ps-3" style={{ width: 70 }}>ID</th>
                        <th>Гарчиг / Өгүүлбэр</th>
                        <th className="text-center" style={{ width: 60 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {data.missing_solutions.map((p) => (
                        <tr key={p.uuid}>
                          <td className="ps-3 small text-muted">#{p.id}</td>
                          <td style={{ maxWidth: 480 }}>
                            <div className="fw-semibold small mb-1">{p.title || `Бодлого #${p.id}`}</div>
                            <div style={{ fontSize: 13, maxHeight: 60, overflow: 'hidden' }}>
                              <LivePreview content={p.statement} />
                            </div>
                          </td>
                          <td className="text-center">
                            <a
                              href={`/problem/${p.uuid}/edit`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary py-0 px-2"
                              title="Шинэ таб дээр засах"
                            >
                              <Pencil size={13} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </>
        ) : null}
      </Container>
  );
}
