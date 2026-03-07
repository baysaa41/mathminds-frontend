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
import {
  getProductDetail,
  getProductReviews,
  createReview,
  addToCart,
  getPurchases,
  deleteReview,
  addReviewReply,
  deleteReviewReply,
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

  // Сэтгэгдэл
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewStep, setReviewStep] = useState('form'); // 'form' | 'rating'
  const [rating, setRating] = useState(null);
  // Хариу
  const [replyingTo, setReplyingTo] = useState(null); // review.id
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Сагсанд нэмэх
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  useEffect(() => {
    fetchProductDetail();
    fetchReviews();
    checkIfPurchased();
  }, [id]);

  const checkIfPurchased = async () => {
    try {
      const purchases = await getPurchases();
      const found = purchases.some(
        (p) => String(p.product_details?.id) === String(id) && p.status === 'COMPLETED'
      );
      setAlreadyPurchased(found);
    } catch {
      // чимээгүй алддаг
    }
  };

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

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setReviewStep('rating');
  };

  const handleFinalSubmit = async (chosenRating) => {
    setSubmitting(true);
    try {
      await createReview(id, chosenRating, comment);
      setComment('');
      setRating(null);
      setReviewStep('form');
      fetchReviews();
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

    if (quantity > 1) {
      const ok = window.confirm(
        `${quantity} ширхэг худалдан авах гэж байна. Үргэлжлүүлэх үү?`
      );
      if (!ok) return;
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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Энэ сэтгэгдлийг устгах уу?')) return;
    try {
      await deleteReview(reviewId);
      fetchReviews();
    } catch (err) {
      alert('Сэтгэгдэл устгахад алдаа гарлаа');
      console.error(err);
    }
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await addReviewReply(reviewId, replyText.trim());
      setReplyText('');
      setReplyingTo(null);
      fetchReviews();
    } catch (err) {
      alert('Хариу илгээхэд алдаа гарлаа');
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Энэ хариуг устгах уу?')) return;
    try {
      await deleteReviewReply(replyId);
      fetchReviews();
    } catch (err) {
      alert('Хариу устгахад алдаа гарлаа');
      console.error(err);
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
    <div className="py-4">
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

                  {/* Дижитал бүтээгдэхүүн аль хэдийн авсан бол анхааруулга */}
                  {product.is_digital && alreadyPurchased && product.product_type !== 'MEMBERSHIP' && (
                    <Alert variant="warning" className="mb-4">
                      <i className="bi bi-exclamation-triangle-fill me-2" />
                      Та энэ дижитал бүтээгдэхүүнийг <strong>аль хэдийн худалдан авсан</strong> байна.
                      Дахин авах шаардлагагүй — <Alert.Link href="/my-purchases">худалдан авалтаас</Alert.Link> татаж авна уу.
                    </Alert>
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
                          disabled={addingToCart || (product.is_digital && alreadyPurchased && product.product_type !== 'MEMBERSHIP')}
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

          {/* Үнэлгээ */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <h4 className="mb-4">Үнэлгээ</h4>

              {/* Үнэлгээний тойм */}
              {reviews.filter((r) => r.rating).length > 0 && (() => {
                const rated = reviews.filter((r) => r.rating);
                const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
                return (
                <Row className="mb-4 align-items-center">
                  <Col xs="auto" className="text-center pe-4">
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1 }}>
                      {avg.toFixed(1)}
                    </div>
                    <div>{renderStars(Math.round(avg))}</div>
                    <small className="text-muted">{rated.length} үнэлгээ</small>
                  </Col>
                  <Col>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = rated.filter((r) => r.rating === star).length;
                      const pct = rated.length ? Math.round((count / rated.length) * 100) : 0;
                      return (
                        <div key={star} className="d-flex align-items-center gap-2 mb-1">
                          <small className="text-muted" style={{ width: 12 }}>{star}</small>
                          <i className="bi bi-star-fill text-warning" style={{ fontSize: '0.75rem' }} />
                          <div className="flex-grow-1 bg-light rounded" style={{ height: 8 }}>
                            <div className="bg-warning rounded" style={{ width: `${pct}%`, height: '100%' }} />
                          </div>
                          <small className="text-muted" style={{ width: 28 }}>{count}</small>
                        </div>
                      );
                    })}
                  </Col>
                </Row>
                );
              })()}

            </Card.Body>
          </Card>

          {/* Сэтгэгдлүүд */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <h4 className="mb-4">Сэтгэгдлүүд ({reviews.filter((r) => r.comment).length})</h4>

              {/* Сэтгэгдэл бичих форм */}
              {user && (
                <Card className="mb-4 bg-light border-0">
                  <Card.Body>
                    {reviewStep === 'form' ? (
                      <>
                        <h6 className="mb-3">Сэтгэгдэл үлдээх</h6>
                        <Form onSubmit={handleCommentSubmit}>
                          <Form.Group className="mb-2">
                            <Form.Control
                              as="textarea"
                              rows={3}
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Бүтээгдэхүүний талаархи санал бодлоо бичнэ үү..."
                            />
                          </Form.Group>
                          <Button type="submit" variant="primary" size="sm" disabled={!comment.trim()}>
                            Нийтлэх
                          </Button>
                        </Form>
                      </>
                    ) : (
                      <>
                        <h6 className="mb-3">Үнэлгээ өгөх <small className="text-muted fw-normal">(алгасаж болно)</small></h6>
                        <div className="d-flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{ cursor: 'pointer', fontSize: '2rem' }}
                              onClick={() => setRating(star)}
                            >
                              {star <= (rating ?? 0)
                                ? <i className="bi bi-star-fill text-warning" />
                                : <i className="bi bi-star text-muted" />}
                            </span>
                          ))}
                        </div>
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={submitting || !rating}
                            onClick={() => handleFinalSubmit(rating)}
                          >
                            {submitting ? <Spinner size="sm" animation="border" /> : 'Илгээх'}
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleFinalSubmit(null)}
                          >
                            Алгасах
                          </Button>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Сэтгэгдлийн жагсаалт */}
              {reviews.filter((r) => r.comment).length === 0 ? (
                <p className="text-muted">Одоогоор сэтгэгдэл байхгүй байна.</p>
              ) : (
                reviews.filter((r) => r.comment).map((review) => (
                  <Card key={review.id} className="mb-3 border">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{review.user_full_name || review.user_username}</strong>
                          <span className="ms-2">{renderStars(review.rating)}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">{formatDate(review.created_at)}</small>
                          {user?.is_staff && (
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteReview(review.id)}>
                              <i className="bi bi-trash" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="mb-2">{review.comment}</p>

                      {/* Хариунууд */}
                      {review.replies?.length > 0 && (
                        <div className="border-start ps-3 ms-2 mt-2">
                          {review.replies.map((reply) => (
                            <div key={reply.id} className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <strong className="small">
                                  {reply.user_full_name || reply.user_username}
                                  {reply.is_staff && <Badge bg="primary" className="ms-1" style={{ fontSize: '0.65rem' }}>Staff</Badge>}
                                </strong>
                                <p className="mb-0 small">{reply.comment}</p>
                              </div>
                              <div className="d-flex align-items-center gap-1 ms-2">
                                <small className="text-muted text-nowrap">{formatDate(reply.created_at)}</small>
                                {(user?.is_staff || user?.id === reply.user) && (
                                  <Button variant="outline-danger" size="sm" onClick={() => handleDeleteReply(reply.id)}>
                                    <i className="bi bi-trash" style={{ fontSize: '0.7rem' }} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Хариу бичих */}
                      {user && (
                        replyingTo === review.id ? (
                          <div className="mt-2 d-flex gap-2">
                            <Form.Control
                              size="sm"
                              placeholder="Хариу бичих..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmitReply(review.id))}
                            />
                            <Button size="sm" variant="primary" onClick={() => handleSubmitReply(review.id)} disabled={submittingReply || !replyText.trim()}>
                              {submittingReply ? <Spinner size="sm" animation="border" /> : 'Илгээх'}
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                              Болих
                            </Button>
                          </div>
                        ) : (
                          <Button variant="link" size="sm" className="p-0 mt-1 text-muted" onClick={() => setReplyingTo(review.id)}>
                            <i className="bi bi-reply me-1" />Хариулах
                          </Button>
                        )
                      )}
                    </Card.Body>
                  </Card>
                ))
              )}
            </Card.Body>
          </Card>
      </Container>
    </div>
  );
}
