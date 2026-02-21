// src/pages/SalesStatsPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Collapse } from 'react-bootstrap';
import { ArrowLeft, Package, TrendingUp, ShoppingCart, DollarSign, ChevronDown, ChevronRight, User } from 'lucide-react';
import api from '../api/axiosConfig';

// Product type labels
const PRODUCT_TYPE_LABELS = {
  MEMBERSHIP: 'Гишүүнчлэл',
  CLUB_ACCESS: 'Клубын эрх',
  CLUB_SLOT: 'Нэмэлт клуб',
  MEMBER_SLOT: 'Нэмэлт сурагч',
  CLUB_TEACHER: 'Клубт багш нэмэх',
  PHYSICAL_BOOK: 'Ном (Хэвлэмэл)',
  DIGITAL_BOOK: 'Ном (Дижитал)',
  COIN_PACK: 'Зоосны багц',
  ITEM: 'Бусад бараа',
};

function SalesStatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProducts, setExpandedProducts] = useState({});

  const toggleProductDetails = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/v1/products/sales-stats/');
        setStats(response.data);
      } catch (err) {
        console.error('Sales stats fetch error:', err);
        setError(err.response?.data?.detail || 'Статистик ачаалахад алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Ачааллаж байна...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Link to="/admin" className="btn btn-secondary">
          <ArrowLeft size={18} className="me-2" />
          Буцах
        </Link>
      </Container>
    );
  }

  const { total_stats, recent_30_days, by_product, by_type } = stats;

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Link to="/admin" className="btn btn-outline-secondary mb-3">
            <ArrowLeft size={18} className="me-2" />
            Dashboard руу буцах
          </Link>
          <h1 className="mb-0">Борлуулалтын Статистик</h1>
          <p className="text-muted">Бүтээгдэхүүний зарагдсан тоо ширхэг</p>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <Card className="h-100 border-primary">
            <Card.Body className="text-center">
              <ShoppingCart size={32} className="text-primary mb-2" />
              <h3 className="mb-0">{total_stats.total_purchases}</h3>
              <small className="text-muted">Нийт худалдан авалт</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-success">
            <Card.Body className="text-center">
              <Package size={32} className="text-success mb-2" />
              <h3 className="mb-0">{total_stats.total_items_sold}</h3>
              <small className="text-muted">Нийт зарагдсан ширхэг</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <DollarSign size={32} className="text-warning mb-2" />
              <h3 className="mb-0">{total_stats.total_revenue?.toLocaleString()}</h3>
              <small className="text-muted">Нийт орлого (зоос)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <TrendingUp size={32} className="text-info mb-2" />
              <h3 className="mb-0">{recent_30_days.total_items_sold || 0}</h3>
              <small className="text-muted">Сүүлийн 30 хоногт</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* By Product Type */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Төрлөөр</h5>
            </Card.Header>
            <Card.Body>
              {by_type.length === 0 ? (
                <p className="text-muted mb-0">Борлуулалт байхгүй</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Төрөл</th>
                      <th className="text-end">Зарагдсан ширхэг</th>
                      <th className="text-end">Худалдан авалт</th>
                      <th className="text-end">Орлого (зоос)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {by_type.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <Badge bg="secondary">
                            {PRODUCT_TYPE_LABELS[item.product__product_type] || item.product__product_type}
                          </Badge>
                        </td>
                        <td className="text-end fw-bold">{item.total_quantity}</td>
                        <td className="text-end">{item.purchase_count}</td>
                        <td className="text-end">{item.total_revenue?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* By Product */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Бүтээгдэхүүн тус бүрээр</h5>
            </Card.Header>
            <Card.Body>
              {by_product.length === 0 ? (
                <p className="text-muted mb-0">Борлуулалт байхгүй</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}></th>
                      <th>#</th>
                      <th>Бүтээгдэхүүн</th>
                      <th>Төрөл</th>
                      <th className="text-end">Үнэ (зоос)</th>
                      <th className="text-end">Зарагдсан ширхэг</th>
                      <th className="text-end">Худалдан авалт</th>
                      <th className="text-end">Орлого (зоос)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {by_product.map((item, idx) => (
                      <React.Fragment key={item.product__id}>
                        <tr
                          onClick={() => toggleProductDetails(item.product__id)}
                          style={{ cursor: 'pointer' }}
                          className={expandedProducts[item.product__id] ? 'table-active' : ''}
                        >
                          <td>
                            {expandedProducts[item.product__id] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </td>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.product__image && (
                                <img
                                  src={item.product__image}
                                  alt={item.product__name}
                                  className="me-2 rounded"
                                  style={{ width: 40, height: 40, objectFit: 'cover' }}
                                />
                              )}
                              <span>{item.product__name}</span>
                            </div>
                          </td>
                          <td>
                            <Badge bg="outline-secondary" className="text-dark border">
                              {PRODUCT_TYPE_LABELS[item.product__product_type] || item.product__product_type}
                            </Badge>
                          </td>
                          <td className="text-end">{item.product__price_in_silver_coins}</td>
                          <td className="text-end fw-bold text-success">{item.total_quantity}</td>
                          <td className="text-end">{item.purchase_count}</td>
                          <td className="text-end">{item.total_revenue?.toLocaleString()}</td>
                        </tr>
                        {/* Худалдан авалтын задаргаа */}
                        <tr>
                          <td colSpan={8} className="p-0 border-0">
                            <Collapse in={expandedProducts[item.product__id]}>
                              <div>
                                <div className="bg-light p-3 mx-2 mb-2 rounded">
                                  <h6 className="mb-3">
                                    <User size={16} className="me-2" />
                                    Худалдан авсан хэрэглэгчид ({item.purchases?.length || 0})
                                  </h6>
                                  {item.purchases && item.purchases.length > 0 ? (
                                    <Table size="sm" className="mb-0 bg-white">
                                      <thead>
                                        <tr>
                                          <th>Хэрэглэгч</th>
                                          <th className="text-end">Тоо ширхэг</th>
                                          <th className="text-end">Төлсөн (зоос)</th>
                                          <th className="text-end">Огноо</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.purchases.map((purchase, pIdx) => (
                                          <tr key={pIdx}>
                                            <td>
                                              <Link
                                                to={`/purchases/${purchase.user_id}`}
                                                className="d-flex align-items-center text-decoration-none text-dark"
                                                title="Бүх худалдан авалтыг харах"
                                              >
                                                {purchase.avatar ? (
                                                  <img
                                                    src={purchase.avatar}
                                                    alt={purchase.username}
                                                    className="rounded-circle me-2"
                                                    style={{ width: 28, height: 28, objectFit: 'cover' }}
                                                  />
                                                ) : (
                                                  <div
                                                    className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                                                    style={{ width: 28, height: 28, fontSize: 12 }}
                                                  >
                                                    {purchase.full_name?.[0] || purchase.username?.[0] || '?'}
                                                  </div>
                                                )}
                                                <div>
                                                  <div className="fw-medium">{purchase.full_name}</div>
                                                  <small className="text-muted">@{purchase.username}</small>
                                                </div>
                                              </Link>
                                            </td>
                                            <td className="text-end">{purchase.quantity}</td>
                                            <td className="text-end">{purchase.price_paid?.toLocaleString()}</td>
                                            <td className="text-end">
                                              <small>{formatDate(purchase.purchased_at)}</small>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  ) : (
                                    <p className="text-muted mb-0">Худалдан авалт байхгүй</p>
                                  )}
                                </div>
                              </div>
                            </Collapse>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SalesStatsPage;
