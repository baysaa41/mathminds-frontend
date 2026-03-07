// src/pages/CheckoutPage.jsx
// Төлбөр төлөх хуудас

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { getCart, checkout } from '../services/productsService';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import apiClient from '../api/axiosConfig';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get payment method from cart page or default to silver
  const initialPaymentMethod = location.state?.paymentMethod || 'silver';

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [discountInfo, setDiscountInfo] = useState(null);

  // Exchange rate
  const COPPER_TO_SILVER_RATE = 100;

  // QPay modal
  const [showQPayModal, setShowQPayModal] = useState(false);
  const [qpayData, setQpayData] = useState(null);
  const [qpayInvoiceId, setQpayInvoiceId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
    fetchDiscount();
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);

      if (!data.items || data.items.length === 0) {
        navigate('/cart');
      }
    } catch (err) {
      setError('Сагс татахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscount = async () => {
    try {
      const response = await apiClient.get('/api/cart/discount_check/');
      if (response.data.eligible) {
        setDiscountInfo(response.data);
      }
    } catch (err) {
      console.error('Хөнгөлөлт шалгахад алдаа:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const result = await checkout(paymentMethod);

      if (result.payment_method === 'qpay') {
        // QPay modal харуулах
        setQpayData(result.qpay_data);
        setQpayInvoiceId(result.invoice_id);
        setShowQPayModal(true);
      } else {
        // Зоосоор амжилттай төлсөн
        const coinIcon = paymentMethod === 'copper' ? '🥉' : '🥈';
        const coinName = paymentMethod === 'copper' ? 'хүрэл зоос' : 'мөнгөн зоос';
        const bonusReceived = result.bonus_received || 0;

        let message = `Амжилттай! ${result.message}\nТөлсөн: ${result.total_paid} ${coinIcon} ${coinName}`;
        if (bonusReceived > 0) {
          message += `\nУрамшуулал: ${bonusReceived} 🥉`;
        }

        // Хөнгөлөлт хадгалах (хэрэв байвал)
        if (result.discount) {
          setDiscountInfo(result.discount);
        }

        alert(message);
        navigate('/my-purchases');
      }
    } catch (err) {
      console.error(err);

      if (err.response?.data?.error) {
        const errorData = err.response.data;

        if (errorData.shortage) {
          // Зоос хүрэлцэхгүй
          const coinIcon = paymentMethod === 'copper' ? '🥉' : '🥈';
          const coinName = paymentMethod === 'copper' ? 'хүрэл зоос' : 'мөнгөн зоос';
          const required = paymentMethod === 'copper' ? errorData.required * COPPER_TO_SILVER_RATE : errorData.required;
          const available = paymentMethod === 'copper' ? (user?.copper_coins || 0) : (user?.silver_coins || 0);
          const shortage = required - available;

          setError(
            <div>
              <strong>{errorData.error}</strong>
              <div className="mt-2">
                Шаардлагатай: <strong>{required} {coinIcon}</strong> {coinName}
                <br />
                Таны данс: <strong>{available} {coinIcon}</strong>
                <br />
                Дутуу байгаа: <strong className="text-danger">{shortage} {coinIcon}</strong>
              </div>
              {paymentMethod === 'copper' && (
                <div className="mt-2 text-muted small">
                  Мөнгөн зоосоор: {errorData.required} 🥈
                </div>
              )}
              <Button
                variant="primary"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/products')}
              >
                Зоос цэнэглэх
              </Button>
            </div>
          );
        } else {
          setError(errorData.error);
        }
      } else {
        setError('Төлбөр төлөхөд алдаа гарлаа');
      }
    } finally {
      setSubmitting(false);
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

  if (!cart || !cart.items || cart.items.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <div className="py-4">
      <Container>
          <Row>
            {/* Зүүн тал - Захиалгын мэдээлэл */}
            <Col lg={7}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                  <h4 className="mb-4">Захиалгын мэдээлэл</h4>

                  {cart.items.map((item) => {
                    const product = item.product_details;
                    return (
                      <div
                        key={item.id}
                        className="d-flex align-items-center mb-3 pb-3 border-bottom"
                      >
                        <img
                          src={product.image || 'https://via.placeholder.com/80'}
                          alt={product.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                          className="me-3"
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{product.name}</h6>
                          <small className="text-muted">
                            {item.quantity} × {product.price_in_silver_coins} 🥈
                          </small>
                        </div>
                        <div className="fw-bold">{item.subtotal} 🥈</div>
                      </div>
                    );
                  })}

                  <div className="d-flex justify-content-between mt-3">
                    <h5>Нийт:</h5>
                    <h5 className="text-primary">{cart.total_price} 🥈</h5>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Баруун тал - Төлбөрийн мэдээлэл */}
            <Col lg={5}>
              <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                <Card.Body className="p-4">
                  <h4 className="mb-4">Төлбөрийн мэдээлэл</h4>

                  {error && (
                    <Alert variant="danger" className="mb-4">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Төлбөрийн арга */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">Төлбөрийн арга</Form.Label>

                      <div className="d-grid gap-2">
                        <Button
                          variant={paymentMethod === 'silver' ? 'primary' : 'outline-primary'}
                          onClick={() => setPaymentMethod('silver')}
                          className="text-start p-3"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>Мөнгөн зоос 🥈</strong>
                              <br />
                              <small className="text-muted">
                                Таны данс: {user?.silver_coins || 0} 🥈
                              </small>
                            </div>
                            <Form.Check
                              type="radio"
                              checked={paymentMethod === 'silver'}
                              onChange={() => {}}
                              readOnly
                            />
                          </div>
                        </Button>

                        <Button
                          variant={paymentMethod === 'copper' ? 'warning' : 'outline-warning'}
                          onClick={() => setPaymentMethod('copper')}
                          className="text-start p-3"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>Хүрэл зоос 🥉</strong>
                              <br />
                              <small className="text-muted">
                                Таны данс: {user?.copper_coins || 0} 🥉
                              </small>
                              <br />
                              <small className="text-muted">
                                Ханш: 1 🥈 = {COPPER_TO_SILVER_RATE} 🥉
                              </small>
                            </div>
                            <Form.Check
                              type="radio"
                              checked={paymentMethod === 'copper'}
                              onChange={() => {}}
                              readOnly
                            />
                          </div>
                        </Button>

                        <Button
                          variant={paymentMethod === 'qpay' ? 'primary' : 'outline-primary'}
                          onClick={() => setPaymentMethod('qpay')}
                          className="text-start p-3"
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>QPay</strong>
                              <br />
                              <small className="text-muted">Банкны картаар</small>
                            </div>
                            <Form.Check
                              type="radio"
                              checked={paymentMethod === 'qpay'}
                              onChange={() => {}}
                              readOnly
                            />
                          </div>
                        </Button>
                      </div>
                    </Form.Group>

                    {/* Нийт дүн */}
                    <div className="bg-light p-3 rounded mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Бүтээгдэхүүн:</span>
                        <span>
                          {paymentMethod === 'copper' ? (
                            <>
                              {cart.total_price * COPPER_TO_SILVER_RATE} 🥉
                              <div className="small text-muted">≈ {cart.total_price} 🥈</div>
                            </>
                          ) : (
                            <>
                              {cart.total_price} 🥈
                              {paymentMethod === 'silver' && (
                                <div className="small text-muted">
                                  ≈ {cart.total_price * COPPER_TO_SILVER_RATE} 🥉
                                </div>
                              )}
                            </>
                          )}
                        </span>
                      </div>

                      {/* Олимпиадын хөнгөлөлт (хэрэв байвал) */}
                      {discountInfo && discountInfo.eligible && (
                        <div className="d-flex justify-content-between mb-2 text-success">
                          <span>
                            <i className="bi bi-trophy me-1"></i>
                            Олимпиадын хөнгөлөлт ({discountInfo.percent}%):
                          </span>
                          <span className="fw-bold">
                            -{discountInfo.amount} 🥈
                          </span>
                        </div>
                      )}

                      {cart.total_shipping > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Хүргэлт:</span>
                          <span>{cart.total_shipping} ₮</span>
                        </div>
                      )}
                      <hr />
                      <div className="d-flex justify-content-between">
                        <h5 className="mb-0">Нийт:</h5>
                        <h5 className="mb-0 text-primary">
                          {paymentMethod === 'copper' ? (
                            <>
                              {(discountInfo && discountInfo.eligible
                                ? (cart.total_price - discountInfo.amount) * COPPER_TO_SILVER_RATE
                                : cart.total_price * COPPER_TO_SILVER_RATE)} 🥉
                            </>
                          ) : (
                            <>
                              {discountInfo && discountInfo.eligible
                                ? cart.total_price - discountInfo.amount
                                : cart.total_price} 🥈
                            </>
                          )}
                          {cart.total_shipping > 0 && (
                            <div className="small text-muted">+ {cart.total_shipping} ₮</div>
                          )}
                        </h5>
                      </div>
                    </div>

                    {/* Олимпиадын хөнгөлөлтийн тайлбар (хэрэв байвал) */}
                    {discountInfo && discountInfo.eligible && (
                      <Alert variant="success" className="mb-4">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-trophy-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                          <div>
                            <strong>Баяр хүргэе! 🎉</strong>
                            <div className="small mt-1">{discountInfo.reason}</div>
                          </div>
                        </div>
                      </Alert>
                    )}

                    {/* Төлөх товч */}
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Төлж байна...
                          </>
                        ) : (
                          'Төлбөр төлөх'
                        )}
                      </Button>

                      <Button
                        variant="outline-secondary"
                        onClick={() => navigate('/cart')}
                        disabled={submitting}
                      >
                        Буцах
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>

      {/* QPay Modal */}
      <PaymentModal
        show={showQPayModal}
        onClose={() => {
          setShowQPayModal(false);
          navigate('/my-purchases');
        }}
        paymentData={qpayData}
        localInvoiceId={qpayInvoiceId}
      />
    </div>
  );
}
