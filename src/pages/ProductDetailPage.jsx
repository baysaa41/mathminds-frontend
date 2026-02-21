// src/pages/ProductDetailPage.jsx
// Бүтээгдэхүүний дэлгэрэнгүй хуудас

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import {
  getProductDetail,
  getProductReviews,
  createReview,
  addToCart,
} from '../services/productsService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateFormatter';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Сэтгэгдэл бичих
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Сагсанд нэмэх
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProductDetail();
    fetchReviews();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      const data = await getProductDetail(id);
      setProduct(data);
    } catch (err) {
      setError('Бүтээгдэхүүний мэдээлэл татахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await getProductReviews(id);
      setReviews(data);
    } catch (err) {
      console.error('Сэтгэгдэл татахад алдаа:', err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү');
      return;
    }

    setSubmitting(true);
    try {
      await createReview(id, rating, comment);
      setComment('');
      setRating(5);
      fetchReviews(); // Сэтгэгдлүүдийг дахин татах
      alert('Сэтгэгдэл амжилттай илгээгдлээ!');
    } catch (err) {
      alert('Сэтгэгдэл илгээхэд алдаа гарлаа');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Сагсанд нэмэхийн тулд нэвтэрнэ үү');
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(id, quantity);
      alert('Бүтээгдэхүүн сагсанд нэмэгдлээ!');
    } catch (err) {
      alert('Сагсанд нэмэхэд алдаа гарлаа');
      console.error(err);
    } finally {
      setAddingToCart(false);
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Уншиж байна...</p>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Бүтээгдэхүүн олдсонгүй'}</Alert>
        <Button onClick={() => navigate('/products')}>Буцах</Button>
      </Container>
    );
  }

  return (
    <>
      {/* Гарчиг навигаци */}
      <Navbar bg="white" className="border-bottom shadow-sm mb-0">
        <Container>
          <Navbar.Brand href="/" className="fw-bold text-primary">
            <i className="bi bi-calculator me-2"></i>
            MathMinds
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            <Nav.Link href="/products">
              <i className="bi bi-shop me-1"></i>
              Бүтээгдэхүүн
            </Nav.Link>
            <Nav.Link href="/cart">
              <i className="bi bi-cart me-1"></i>
              Сагс
            </Nav.Link>
            <Nav.Link href="/my-purchases">
              <i className="bi bi-bag-check me-1"></i>
              Худалдан авалт
            </Nav.Link>
            <Nav.Link href="/" className="fw-bold">
              <i className="bi bi-house me-1"></i>
              Нүүр
            </Nav.Link>
            {user && (
              <Nav.Link href="/profile" className="d-flex align-items-center">
                <div className="d-flex align-items-center">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="rounded-circle me-2"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                      style={{ width: '32px', height: '32px', fontSize: '14px' }}
                    >
                      {user.first_name?.[0] || user.username?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-dark">{user.first_name || user.username}</span>
                </div>
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>

      <div className="bg-light min-vh-100 py-5">
        <Container>
          {/* Буцах товч */}
          <Button
            variant="outline-secondary"
            className="mb-4"
            onClick={() => navigate('/products')}
          >
            ← Буцах
          </Button>

          <Row className="mb-5">
            {/* Зүүн тал - Зураг */}
            <Col lg={5}>
              <Card className="shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src={product.image || 'https://via.placeholder.com/400'}
                  alt={product.name}
                  style={{ height: '400px', objectFit: 'cover' }}
                />
              </Card>

              {/* Үнэлгээ */}
              {product.review_count > 0 && (
                <Card className="mt-3 shadow-sm border-0">
                  <Card.Body className="text-center">
                    <div className="mb-2">{renderStars(Math.round(product.average_rating))}</div>
                    <h4 className="mb-0">{product.average_rating}/5</h4>
                    <small className="text-muted">{product.review_count} үнэлгээ</small>
                  </Card.Body>
                </Card>
              )}
            </Col>

            {/* Баруун тал - Мэдээлэл */}
            <Col lg={7}>
              <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                  {/* Төрөл */}
                  <div className="mb-3">
                    <Badge bg="primary">{product.product_type_display}</Badge>
                    {product.is_digital && (
                      <Badge bg="info" className="ms-2">
                        <i className="bi bi-download me-1" />
                        Дижитал
                      </Badge>
                    )}
                  </div>

                  {/* Нэр */}
                  <h2 className="mb-3">{product.name}</h2>

                  {/* Номын мэдээлэл */}
                  {product.author && (
                    <div className="mb-3">
                      <h6 className="text-muted mb-2">
                        <i className="bi bi-book me-2" />
                        Номын мэдээлэл
                      </h6>
                      <p className="mb-1">
                        <strong>Зохиогч:</strong> {product.author}
                      </p>
                      {product.publisher && (
                        <p className="mb-1">
                          <strong>Хэвлэлийн газар:</strong> {product.publisher}
                        </p>
                      )}
                      {product.isbn && (
                        <p className="mb-1">
                          <strong>ISBN:</strong> {product.isbn}
                        </p>
                      )}
                      {product.pages && (
                        <p className="mb-1">
                          <strong>Хуудас:</strong> {product.pages}
                        </p>
                      )}
                      {product.publication_year && (
                        <p className="mb-1">
                          <strong>Он:</strong> {product.publication_year}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Товч тайлбар */}
                  <p className="text-muted mb-4">{product.description}</p>

                  {/* Үнэ */}
                  <div className="mb-4">
                    <h3 className="text-primary mb-0">
                      {product.price_in_silver_coins} 🥈
                      <small className="text-muted ms-2" style={{ fontSize: '1rem' }}>
                        ({product.price} ₮)
                      </small>
                    </h3>
                    {product.bonus_copper_coins > 0 && (
                      <small className="text-success">
                        +{product.bonus_copper_coins} 🥉 урамшуулал
                      </small>
                    )}
                  </div>

                  {/* Хүргэлтийн мэдээлэл */}
                  {product.requires_shipping && (
                    <Alert variant="info" className="mb-4">
                      <i className="bi bi-truck me-2" />
                      <strong>Хүргэлт:</strong> {product.shipping_cost} ₮
                      {product.shipping_info && (
                        <div className="mt-2 small">{product.shipping_info}</div>
                      )}
                    </Alert>
                  )}

                  {/* Нөөц */}
                  {product.in_stock ? (
                    <div className="mb-4">
                      <i className="bi bi-check-circle text-success me-2" />
                      <span className="text-success">Нөөцөд байгаа</span>
                      {product.unlimited_stock ? (
                        <small className="text-muted ms-2">(Хязгааргүй)</small>
                      ) : (
                        <small className="text-muted ms-2">({product.stock_quantity} ширхэг)</small>
                      )}
                    </div>
                  ) : (
                    <Alert variant="warning">Нөөц дууссан</Alert>
                  )}

                  {/* Тоо ширхэг + Сагсанд нэмэх */}
                  {product.in_stock && (
                    <Row className="align-items-center">
                      <Col xs={4}>
                        <Form.Group>
                          <Form.Label className="small">Тоо ширхэг</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            max={product.unlimited_stock ? undefined : product.stock_quantity}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={8}>
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-100 mt-4"
                          onClick={handleAddToCart}
                          disabled={addingToCart}
                        >
                          {addingToCart ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Нэмж байна...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-cart me-2" />
                              Сагсанд нэмэх
                            </>
                          )}
                        </Button>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Дэлгэрэнгүй тайлбар */}
          {product.detailed_description && (
            <Card className="shadow-sm border-0 mb-5">
              <Card.Body className="p-4">
                <h4 className="mb-3">Дэлгэрэнгүй тайлбар</h4>
                <div style={{ whiteSpace: 'pre-line' }}>{product.detailed_description}</div>
              </Card.Body>
            </Card>
          )}

          {/* Сэтгэгдлүүд */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <h4 className="mb-4">Сэтгэгдэл ({reviews.length})</h4>

              {/* Сэтгэгдэл бичих форм */}
              {user && (
                <Card className="mb-4 bg-light border-0">
                  <Card.Body>
                    <h6 className="mb-3">Таны үнэлгээ</h6>
                    <Form onSubmit={handleSubmitReview}>
                      <Form.Group className="mb-3">
                        <Form.Label>Үнэлгээ</Form.Label>
                        <div>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                              onClick={() => setRating(star)}
                            >
                              {star <= rating ? (
                                <i className="bi bi-star-fill text-warning" />
                              ) : (
                                <i className="bi bi-star text-muted" />
                              )}
                            </span>
                          ))}
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Сэтгэгдэл</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Бүтээгдэхүүний талаархи санал бодлоо бичнэ үү..."
                        />
                      </Form.Group>

                      <Button type="submit" variant="primary" disabled={submitting}>
                        {submitting ? 'Илгээж байна...' : 'Сэтгэгдэл үлдээх'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {/* Сэтгэгдлийн жагсаалт */}
              {reviews.length === 0 ? (
                <p className="text-muted">Одоогоор сэтгэгдэл байхгүй байна.</p>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id} className="mb-3 border">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{review.user_full_name || review.user_username}</strong>
                          <div className="mt-1">{renderStars(review.rating)}</div>
                        </div>
                        <small className="text-muted">
                          {formatDate(review.created_at)}
                        </small>
                      </div>
                      {review.comment && <p className="mb-0 mt-2">{review.comment}</p>}
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
}
