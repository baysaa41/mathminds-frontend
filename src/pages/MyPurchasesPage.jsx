// src/pages/MyPurchasesPage.jsx
// Худалдан авалтын түүх

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { getPurchases } from '../services/productsService';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../utils/dateFormatter';

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPurchases();
  }, [user]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await getPurchases();
      setPurchases(data);
    } catch (err) {
      setError('Худалдан авалтын түүх татахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { variant: 'warning', text: 'Хүлээгдэж буй' },
      COMPLETED: { variant: 'success', text: 'Амжилттай' },
      REFUNDED: { variant: 'danger', text: 'Буцаагдсан' },
    };

    const statusInfo = statusMap[status] || { variant: 'secondary', text: status };
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>;
  };

  const handleDownload = async (purchaseId, _productName) => {
    try {
      const downloadUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/purchases/${purchaseId}/download/`;
      const token = localStorage.getItem('access_token');

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Файл татахад алдаа гарлаа');
      }

      const data = await response.json();

      // S3 URL-г шинэ таб дээр нээх
      window.open(data.download_url, '_blank');
    } catch (err) {
      console.error('Файл татахад алдаа:', err);
      alert(err.message || 'Файл татахад алдаа гарлаа');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Уншиж байна...</p>
      </Container>
    );
  }

  return (
    <div className="py-4">
      <Container>
          {/* Толгой */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-2">
                <i className="bi bi-bag-check me-2"></i>
                Миний худалдан авалт
              </h2>
              <p className="text-muted mb-0">Нийт {purchases.length} худалдан авалт</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/products')}>
              <i className="bi bi-shop me-2"></i>
              Худалдан авалт хийх
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {purchases.length === 0 ? (
            <Card className="shadow-sm border-0 text-center py-5">
              <Card.Body>
                <i className="bi bi-bag-x text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                <h4 className="mb-3">Худалдан авалт байхгүй байна</h4>
                <p className="text-muted mb-4">Та одоогоор бүтээгдэхүүн худалдаж аваагүй байна</p>
                <Button variant="primary" onClick={() => navigate('/products')}>
                  Бүтээгдэхүүн үзэх
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Body className="p-0">
                    <Table responsive hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Огноо</th>
                          <th>Бүтээгдэхүүн</th>
                          <th className="text-center">Тоо ширхэг</th>
                          <th className="text-end">Нэгжийн үнэ</th>
                          <th className="text-end">Нийт үнэ</th>
                          <th className="text-end">Урамшуулал</th>
                          <th className="text-center">Төлөв</th>
                          <th className="text-center">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => {
                          const product = purchase.product_details;
                          return (
                            <tr key={purchase.id}>
                              {/* Огноо */}
                              <td>
                                <div>
                                  {formatDate(purchase.purchased_at)}
                                </div>
                                <small className="text-muted">
                                  {formatTime(purchase.purchased_at)}
                                </small>
                              </td>

                              {/* Бүтээгдэхүүн */}
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={product.thumbnail || product.image || 'https://via.placeholder.com/50'}
                                    alt={product.name}
                                    style={{
                                      width: '50px',
                                      height: '50px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                    }}
                                    className="me-3"
                                  />
                                  <div>
                                    <div className="fw-medium">
                                      <a
                                        href={`/products/${product.id}`}
                                        className="text-decoration-none text-dark"
                                      >
                                        {product.name}
                                      </a>
                                    </div>
                                    <small className="text-muted">
                                      {product.product_type_display}
                                    </small>
                                  </div>
                                </div>
                              </td>

                              {/* Тоо ширхэг */}
                              <td className="text-center align-middle">
                                <Badge bg="secondary">{purchase.quantity}×</Badge>
                              </td>

                              {/* Нэгжийн үнэ */}
                              <td className="text-end align-middle">
                                {Math.floor(purchase.price_paid_silver / purchase.quantity)} 🥈
                              </td>

                              {/* Нийт үнэ */}
                              <td className="text-end align-middle">
                                <strong>{purchase.price_paid_silver} 🥈</strong>
                              </td>

                              {/* Урамшуулал */}
                              <td className="text-end align-middle">
                                {(purchase.bonus_copper_received || 0) > 0 ? (
                                  <span className="text-success">
                                    +{purchase.bonus_copper_received} 🥉
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>

                              {/* Төлөв */}
                              <td className="text-center align-middle">
                                {getStatusBadge(purchase.status)}
                              </td>

                              {/* Үйлдэл */}
                              <td className="text-center align-middle">
                                {product.product_type === 'DIGITAL_BOOK' && purchase.status === 'COMPLETED' && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleDownload(purchase.id, product.name)}
                                  >
                                    <i className="bi bi-download me-1"></i>
                                    Татах
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>

                {/* Нийт статистик */}
                <Row className="mt-4">
                  <Col md={4}>
                    <Card className="shadow-sm border-0 text-center">
                      <Card.Body>
                        <h3 className="text-primary mb-2">
                          {purchases.reduce((sum, p) => sum + (p.price_paid_silver || 0), 0)} 🥈
                        </h3>
                        <p className="text-muted mb-0">Нийт зарцуулсан</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="shadow-sm border-0 text-center">
                      <Card.Body>
                        <h3 className="text-success mb-2">
                          {purchases.reduce((sum, p) => sum + (p.bonus_copper_received || 0), 0)} 🥉
                        </h3>
                        <p className="text-muted mb-0">Нийт урамшуулал</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="shadow-sm border-0 text-center">
                      <Card.Body>
                        <h3 className="text-info mb-2">
                          {purchases.reduce((sum, p) => sum + (p.quantity || 0), 0)}
                        </h3>
                        <p className="text-muted mb-0">Нийт бүтээгдэхүүн</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
      </Container>
    </div>
  );
}
