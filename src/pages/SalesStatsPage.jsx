// src/pages/SalesStatsPage.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, Table, Badge, Spinner, Alert,
  Collapse, Nav, Form,
} from 'react-bootstrap';
import {
  ArrowLeft, Package, TrendingUp, ShoppingCart, DollarSign,
  ChevronDown, ChevronRight, User, CreditCard,
} from 'lucide-react';
import api from '../api/axiosConfig';

const PRODUCT_TYPE_LABELS = {
  MEMBERSHIP:   'Гишүүнчлэл',
  CLUB_ACCESS:  'Клубын эрх',
  CLUB_SLOT:    'Нэмэлт клуб',
  MEMBER_SLOT:  'Нэмэлт сурагч',
  CLUB_TEACHER: 'Клубт багш',
  PHYSICAL_BOOK:'Ном (Хэвлэмэл)',
  DIGITAL_BOOK: 'Ном (Дижитал)',
  COIN_PACK:    'Зоосны багц',
  ITEM:         'Бусад',
};

const QUARTER_LABELS = { 1: 'I улирал', 2: 'II улирал', 3: 'III улирал', 4: 'IV улирал' };
const MONTHS_MN = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
                   '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMnt(n) {
  return Number(n || 0).toLocaleString() + ' ₮';
}

// ── Coin purchases tab ────────────────────────────────────────────────────────

function CoinSalesTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  useEffect(() => {
    api.get('/api/v1/products/sales-stats/')
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Статистик ачаалахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  if (error)   return <Alert variant="danger">{error}</Alert>;

  const { total_stats, recent_30_days, by_product, by_type } = stats;

  return (
    <>
      {/* Summary cards */}
      <Row className="g-3 mb-4">
        {[
          { icon: ShoppingCart, color: 'primary',  label: 'Нийт худалдан авалт', value: total_stats.total_purchases },
          { icon: Package,      color: 'success',  label: 'Нийт зарагдсан ширхэг', value: total_stats.total_items_sold },
          { icon: DollarSign,   color: 'warning',  label: 'Нийт орлого (зоос)', value: (total_stats.total_revenue || 0).toLocaleString() },
          { icon: TrendingUp,   color: 'info',     label: 'Сүүлийн 30 хоног', value: recent_30_days.total_items_sold || 0 },
        ].map(({ icon: Icon, color, label, value }) => (
          <Col md={6} lg={3} key={label}>
            <Card className={`h-100 border-${color}`}>
              <Card.Body className="text-center">
                <Icon size={32} className={`text-${color} mb-2`} />
                <h3 className="mb-0">{value}</h3>
                <small className="text-muted">{label}</small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* By type */}
      <Card className="mb-4">
        <Card.Header><h6 className="mb-0">Төрлөөр</h6></Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Төрөл</th>
                <th className="text-end">Ширхэг</th>
                <th className="text-end">Гүйлгээ</th>
                <th className="text-end">Орлого (зоос)</th>
              </tr>
            </thead>
            <tbody>
              {by_type.length === 0
                ? <tr><td colSpan={4} className="text-muted text-center py-3">Борлуулалт байхгүй</td></tr>
                : by_type.map((item, i) => (
                  <tr key={i}>
                    <td><Badge bg="secondary">{PRODUCT_TYPE_LABELS[item.product__product_type] || item.product__product_type}</Badge></td>
                    <td className="text-end fw-bold">{item.total_quantity}</td>
                    <td className="text-end">{item.purchase_count}</td>
                    <td className="text-end">{(item.total_revenue || 0).toLocaleString()}</td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* By product (expandable) */}
      <Card>
        <Card.Header><h6 className="mb-0">Бүтээгдэхүүн тус бүрээр</h6></Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 32 }}></th>
                <th>#</th>
                <th>Бүтээгдэхүүн</th>
                <th>Төрөл</th>
                <th className="text-end">Үнэ</th>
                <th className="text-end">Ширхэг</th>
                <th className="text-end">Гүйлгээ</th>
                <th className="text-end">Орлого</th>
              </tr>
            </thead>
            <tbody>
              {by_product.length === 0
                ? <tr><td colSpan={8} className="text-muted text-center py-3">Борлуулалт байхгүй</td></tr>
                : by_product.map((item, idx) => (
                  <React.Fragment key={item.product__id}>
                    <tr onClick={() => toggle(item.product__id)} style={{ cursor: 'pointer' }}
                        className={expanded[item.product__id] ? 'table-active' : ''}>
                      <td>{expanded[item.product__id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                      <td>{idx + 1}</td>
                      <td>{item.product__name}</td>
                      <td><Badge bg="light" text="dark" className="border">{PRODUCT_TYPE_LABELS[item.product__product_type] || item.product__product_type}</Badge></td>
                      <td className="text-end">{item.product__price_in_silver_coins}</td>
                      <td className="text-end fw-bold text-success">{item.total_quantity}</td>
                      <td className="text-end">{item.purchase_count}</td>
                      <td className="text-end">{(item.total_revenue || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={8} className="p-0 border-0">
                        <Collapse in={expanded[item.product__id]}>
                          <div className="bg-light p-3 mx-2 mb-2 rounded">
                            <p className="mb-2 fw-semibold"><User size={14} className="me-1" />Худалдан авсан хэрэглэгчид ({item.purchases?.length || 0})</p>
                            {item.purchases?.length > 0 ? (
                              <Table size="sm" className="mb-0 bg-white">
                                <thead>
                                  <tr>
                                    <th>Хэрэглэгч</th>
                                    <th className="text-end">Ширхэг</th>
                                    <th className="text-end">Төлсөн</th>
                                    <th className="text-end">Огноо</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.purchases.map((p, pi) => (
                                    <tr key={pi}>
                                      <td>
                                        <Link to={`/profile/${p.username}`} className="text-decoration-none text-dark d-flex align-items-center gap-2">
                                          {p.avatar
                                            ? <img src={p.avatar} alt="" className="rounded-circle" style={{ width: 26, height: 26, objectFit: 'cover' }} />
                                            : <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: 26, height: 26, fontSize: 11 }}>{(p.full_name || p.username || '?')[0]}</div>
                                          }
                                          <div>
                                            <div className="fw-medium">{p.full_name || p.username}</div>
                                            <small className="text-muted">@{p.username}</small>
                                          </div>
                                        </Link>
                                      </td>
                                      <td className="text-end">{p.quantity}</td>
                                      <td className="text-end">{(p.price_paid || 0).toLocaleString()}</td>
                                      <td className="text-end"><small>{formatDate(p.purchased_at)}</small></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            ) : <p className="text-muted mb-0 small">Худалдан авалт байхгүй</p>}
                          </div>
                        </Collapse>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              }
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

// ── QPay payments tab ─────────────────────────────────────────────────────────

function QPayTab() {
  const [year, setYear]       = useState('');
  const [quarter, setQuarter] = useState('');
  const [month, setMonth]     = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (year)    params.append('year', year);
    if (quarter) params.append('quarter', quarter);
    if (month)   params.append('month', month);
    api.get(`/api/v1/payments/qpay-stats/?${params}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.detail || 'Алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, [year, quarter, month]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleQuarterChange = (v) => { setQuarter(v); setMonth(''); };
  const handleMonthChange   = (v) => { setMonth(v);   setQuarter(''); };

  return (
    <>
      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col xs={6} md={3}>
              <Form.Label className="small fw-semibold">Жил</Form.Label>
              <Form.Select value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Бүх жил</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Label className="small fw-semibold">Улирал</Form.Label>
              <Form.Select value={quarter} onChange={e => handleQuarterChange(e.target.value)}>
                <option value="">Бүх улирал</option>
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Label className="small fw-semibold">Сар</Form.Label>
              <Form.Select value={month} onChange={e => handleMonthChange(e.target.value)}>
                <option value="">Бүх сар</option>
                {MONTHS_MN.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>}
      {error   && <Alert variant="danger">{error}</Alert>}

      {data && !loading && (
        <>
          {/* Summary */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <Card className="border-success h-100">
                <Card.Body className="text-center">
                  <CreditCard size={32} className="text-success mb-2" />
                  <h3 className="mb-0">{data.total_count}</h3>
                  <small className="text-muted">Амжилттай QPay төлбөр</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="border-warning h-100">
                <Card.Body className="text-center">
                  <DollarSign size={32} className="text-warning mb-2" />
                  <h3 className="mb-0">{formatMnt(data.total_amount)}</h3>
                  <small className="text-muted">Нийт орлого</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* By month chart-like table */}
          {data.by_month.length > 0 && (
            <Card className="mb-4">
              <Card.Header><h6 className="mb-0">Сараар</h6></Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Сар</th>
                      <th className="text-end">Гүйлгээ</th>
                      <th className="text-end">Дүн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_month.map((row, i) => (
                      <tr key={i}>
                        <td>{new Date(row.month).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' })}</td>
                        <td className="text-end fw-bold">{row.count}</td>
                        <td className="text-end text-success fw-semibold">{formatMnt(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* By product */}
          {data.by_product.length > 0 && (
            <Card className="mb-4">
              <Card.Header><h6 className="mb-0">Бүтээгдэхүүнээр</h6></Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Бүтээгдэхүүн</th>
                      <th>Төрөл</th>
                      <th className="text-end">Гүйлгээ</th>
                      <th className="text-end">Дүн</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_product.map((row, i) => (
                      <tr key={i}>
                        <td>{row.product__name || '-'}</td>
                        <td><Badge bg="secondary">{PRODUCT_TYPE_LABELS[row.product__product_type] || row.product__product_type || '-'}</Badge></td>
                        <td className="text-end">{row.count}</td>
                        <td className="text-end text-success fw-semibold">{formatMnt(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Invoice list */}
          <Card>
            <Card.Header><h6 className="mb-0">Дэлгэрэнгүй жагсаалт ({data.invoices.length})</h6></Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Хэрэглэгч</th>
                    <th>Бүтээгдэхүүн</th>
                    <th className="text-end">Дүн</th>
                    <th className="text-end">Төлсөн огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.length === 0
                    ? <tr><td colSpan={5} className="text-center text-muted py-3">Гүйлгээ байхгүй</td></tr>
                    : data.invoices.map((inv, i) => (
                      <tr key={i}>
                        <td><small className="text-muted">{i + 1}</small></td>
                        <td>
                          <Link to={`/profile/${inv.user__username}`} className="text-decoration-none">
                            <div className="fw-medium">{[inv.user__first_name, inv.user__last_name].filter(Boolean).join(' ') || inv.user__username}</div>
                            <small className="text-muted">@{inv.user__username}</small>
                          </Link>
                        </td>
                        <td>
                          <div>{inv.product__name}</div>
                          <Badge bg="light" text="dark" className="border">{PRODUCT_TYPE_LABELS[inv.product__product_type] || inv.product__product_type}</Badge>
                        </td>
                        <td className="text-end fw-semibold text-success">{formatMnt(inv.amount)}</td>
                        <td className="text-end"><small>{formatDate(inv.paid_at)}</small></td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SalesStatsPage() {
  const [tab, setTab] = useState('coins');

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to="/admin" className="btn btn-outline-secondary mb-3">
            <ArrowLeft size={18} className="me-2" />
            Dashboard руу буцах
          </Link>
          <h1 className="mb-0">Борлуулалтын Статистик</h1>
          <p className="text-muted">Бүтээгдэхүүний зарагдсан тоо, QPay гүйлгээ</p>
        </Col>
      </Row>

      <Nav variant="tabs" className="mb-4" activeKey={tab} onSelect={setTab}>
        <Nav.Item>
          <Nav.Link eventKey="coins">
            <Package size={16} className="me-1" />
            Зоосоор худалдан авалт
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="qpay">
            <CreditCard size={16} className="me-1" />
            QPay төлбөр
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === 'coins' && <CoinSalesTab />}
      {tab === 'qpay'  && <QPayTab />}
    </Container>
  );
}

export default SalesStatsPage;
