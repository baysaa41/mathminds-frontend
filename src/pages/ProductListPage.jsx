// src/pages/ProductListPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Nav from 'react-bootstrap/Nav';
import { getProducts } from '../services/productsService';
import PaymentModal from '../components/PaymentModal.jsx';
import './ProductListPage.css';

function ProductListPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Модалын state-үүд (хуучин төлбөрийн систем)
  const [showModal, setShowModal] = useState(false);
  const [modalData, _setModalData] = useState(null);
  const [localInvoiceId, _setLocalInvoiceId] = useState(null);

  // Ангиллын тодорхойлолт
  const categories = [
    { key: 'all', label: 'Бүгд', icon: 'grid' },
    { key: 'student_membership', label: 'Сурагчийн гишүүнчлэл', icon: 'person-badge' },
    { key: 'teacher_membership', label: 'Багшийн гишүүнчлэл', icon: 'person-workspace' },
    { key: 'club_membership', label: 'Клубын эрх', icon: 'people' },
    { key: 'book', label: 'Ном', icon: 'book' },
    { key: 'other', label: 'Бусад', icon: 'box-seam' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError('Бүтээгдэхүүн татахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <i key={i} className="bi bi-star-fill text-warning" />
        ) : (
          <i key={i} className="bi bi-star text-muted" />
        )
      );
    }
    return stars;
  };

  // Ангилалаар шүүх
  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => {
          switch (selectedCategory) {
            case 'student_membership':
              return product.product_type === 'MEMBERSHIP' && product.target_audience === 'student';
            case 'teacher_membership':
              return product.product_type === 'MEMBERSHIP' && product.target_audience === 'teacher';
            case 'club_membership':
              return product.product_type === 'CLUB_ACCESS';
            case 'book':
              return (
                product.product_type === 'PHYSICAL_BOOK' || product.product_type === 'DIGITAL_BOOK'
              );
            case 'other':
              return product.product_type === 'ITEM' || product.product_type === 'COIN_PACK';
            default:
              return true;
          }
        });

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Уншиж байна...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <div className="py-4">
      <Container>
          {/* Толгой хэсэг */}
          <div className="text-center mb-4">
            <h1 className="mb-3">Манай бүтээгдэхүүнүүд</h1>
            <p className="text-muted">
              Математикийн ном, гишүүнчлэл, клубын эрх зэрэг олон төрлийн бүтээгдэхүүн
            </p>
          </div>

          {/* Ангиллын tabs */}
          <div className="mb-4">
            <Nav variant="pills" className="justify-content-center flex-wrap gap-2">
              {categories.map((category) => (
                <Nav.Item key={category.key}>
                  <Nav.Link
                    active={selectedCategory === category.key}
                    onClick={() => setSelectedCategory(category.key)}
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className={`bi bi-${category.icon}`}></i>
                    {category.label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>

          {/* Бүтээгдэхүүнүүд */}
          {filteredProducts.length === 0 ? (
            <Alert variant="info" className="text-center">
              Одоогоор худалдаж авах боломжтой бүтээгдэхүүн алга.
            </Alert>
          ) : (
            <Row className="g-3">
              {filteredProducts.map((product) => (
                <Col key={product.id} xs={6} sm={6} md={4} lg={3} xl={3}>
                  <Card className="h-100 shadow-sm border-0 product-card-hover">
                    {/* Зураг */}
                    <div
                      style={{
                        height: '160px',
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: '#fff4d6',
                      }}
                    >
                      {product.image ? (
                        <Card.Img
                          variant="top"
                          src={product.image}
                          alt={product.name}
                          style={{
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        />
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            backgroundColor: '#ffe4a3',
                          }}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <i
                            className="bi bi-box-seam"
                            style={{ fontSize: '2.5rem', color: '#d4a574' }}
                          ></i>
                        </div>
                      )}
                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        {product.is_digital && (
                          <Badge bg="info" className="mb-1 d-block">
                            <i className="bi bi-download me-1" />
                            Дижитал
                          </Badge>
                        )}
                        {!product.in_stock && <Badge bg="danger">Нөөц дууссан</Badge>}
                      </div>
                    </div>

                    {/* Контент */}
                    <Card.Body className="d-flex flex-column p-2">
                      {/* Төрөл */}
                      <Badge
                        bg="primary"
                        className="mb-1 align-self-start"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {product.product_type_display}
                      </Badge>

                      {/* Нэр */}
                      <Card.Title
                        className="mb-1"
                        style={{
                          cursor: 'pointer',
                          minHeight: '36px',
                          fontSize: '0.9rem',
                          lineHeight: '1.2',
                        }}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {product.name}
                      </Card.Title>

                      {/* Зохиогч */}
                      {product.author && (
                        <small className="text-muted mb-1 d-block" style={{ fontSize: '0.75rem' }}>
                          {product.author}
                        </small>
                      )}

                      {/* Товч тайлбар */}
                      <Card.Text
                        className="text-muted mb-2"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.75rem',
                          lineHeight: '1.3',
                        }}
                      >
                        {product.description || 'Бүтээгдэхүүний дэлгэрэнгүй тайлбар.'}
                      </Card.Text>

                      {/* Үнэлгээ */}
                      {product.review_count > 0 && (
                        <div
                          className="mb-2 d-flex align-items-center"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {renderStars(Math.round(product.average_rating))}
                          <small className="text-muted ms-1">({product.review_count})</small>
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="mt-auto">
                        {/* Үнэ */}
                        <div className="mb-2">
                          <span className="text-primary fw-bold" style={{ fontSize: '0.95rem' }}>
                            {product.price_in_silver_coins} 🥈
                          </span>
                          <small className="text-muted ms-1" style={{ fontSize: '0.7rem' }}>
                            ({product.price}₮)
                          </small>
                          {product.bonus_copper_coins > 0 && (
                            <div>
                              <small className="text-success" style={{ fontSize: '0.7rem' }}>
                                +{product.bonus_copper_coins} 🥉
                              </small>
                            </div>
                          )}
                        </div>

                        {/* Товчууд */}
                        <div className="d-grid">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            <i className="bi bi-eye me-1" />
                            Дэлгэрэнгүй
                          </Button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Хуучин төлбөрийн модал */}
          <PaymentModal
            show={showModal}
            onClose={() => setShowModal(false)}
            paymentData={modalData}
            localInvoiceId={localInvoiceId}
          />
      </Container>

      <style>
        {`
          .product-card-hover {
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }
          .product-card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          }
        `}
      </style>
    </div>
  );
}

export default ProductListPage;
