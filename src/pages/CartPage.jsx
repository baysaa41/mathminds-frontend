// src/pages/CartPage.jsx
// Сагсны хуудас

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { getCart, updateCartItem, removeCartItem } from '../services/productsService';
import { useAuth } from '../context/AuthContext';

function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('silver'); // 'silver' or 'copper'

  // Exchange rate: 1 silver = 100 copper
  const COPPER_TO_SILVER_RATE = 100;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError('Сагс татахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId, newQuantity, currentQuantity, product) => {
    if (newQuantity < 1) return;

    if (newQuantity > 1 && currentQuantity === 1) {
      const label = product?.name || 'бүтээгдэхүүн';
      const ok = window.confirm(
        `"${label}"-г ${newQuantity} ширхэг болгох уу?`
      );
      if (!ok) return;
    }

    if (newQuantity > 1 && product?.is_digital) {
      const ok = window.confirm(
        'Дижитал бүтээгдэхүүнийг олон ширхэгээр авч байна. Үргэлжлүүлэх үү?'
      );
      if (!ok) return;
    }

    setUpdating((prev) => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItem(itemId, newQuantity);
      await fetchCart(); // Сагсыг дахин татах
    } catch (err) {
      console.error('Тоо ширхэг өөрчлөх алдаа:', err);
      const errorMessage = err.response?.data?.error || 'Тоо ширхэг өөрчлөхөд алдаа гарлаа';
      alert(errorMessage);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Энэ бүтээгдэхүүнийг сагснаас хасах уу?')) {
      return;
    }

    setUpdating((prev) => ({ ...prev, [itemId]: true }));
    try {
      await removeCartItem(itemId);
      await fetchCart(); // Сагсыг дахин татах
    } catch (err) {
      alert('Сагснаас устгахад алдаа гарлаа');
      console.error(err);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCheckout = () => {
    // Төлбөрийн аргыг дамжуулж төлбөр төлөх хуудас руу шилжих
    navigate('/checkout', { state: { paymentMethod } });
  };

  // Calculate price in copper coins
  const calculateCopperPrice = (silverPrice) => {
    return silverPrice * COPPER_TO_SILVER_RATE;
  };

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
        <Button onClick={() => navigate('/products')}>
          <i className="bi bi-arrow-left me-2" />
          Бүтээгдэхүүн рүү буцах
        </Button>
      </Container>
    );
  }

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="py-4">
      <Container>
          {/* Толгой хэсэг */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-2">
                <i className="bi bi-cart me-2" />
                Миний сагс
              </h2>
              {hasItems && <p className="text-muted mb-0">{cart.items.length} бүтээгдэхүүн</p>}
            </div>
            <Button variant="outline-secondary" onClick={() => navigate('/products')}>
              <i className="bi bi-arrow-left me-2" />
              Үргэлжлүүлэн худалдаж авах
            </Button>
          </div>

          {!hasItems ? (
            // Хоосон сагс
            <Card className="shadow-sm border-0 text-center py-5">
              <Card.Body>
                <i className="bi bi-cart text-muted fs-1 mb-3"></i>
                <h4 className="mb-3">Таны сагс хоосон байна</h4>
                <p className="text-muted mb-4">Бүтээгдэхүүн нэмэхийн тулд жагсаалтаас сонгоно уу</p>
                <Button variant="primary" onClick={() => navigate('/products')}>
                  Бүтээгдэхүүн үзэх
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Row>
              {/* Зүүн тал - Бүтээгдэхүүнүүд */}
              <Col lg={8}>
                <Card className="shadow-sm border-0 mb-4">
                  <Card.Body className="p-0">
                    <Table responsive className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Бүтээгдэхүүн</th>
                          <th className="text-center">Үнэ</th>
                          <th className="text-center">Тоо ширхэг</th>
                          <th className="text-end">Нийт</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.items.map((item) => {
                          const product = item.product_details;
                          return (
                            <tr key={item.id}>
                              {/* Бүтээгдэхүүний мэдээлэл */}
                              <td>
                                <div className="d-flex align-items-center">
                                  <img
                                    src={product.thumbnail || product.image || 'https://via.placeholder.com/80'}
                                    alt={product.name}
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                    }}
                                    className="me-3"
                                  />
                                  <div>
                                    <h6 className="mb-1">
                                      <a
                                        href={`/products/${product.id}`}
                                        className="text-decoration-none text-dark"
                                      >
                                        {product.name}
                                      </a>
                                    </h6>
                                    {product.author && (
                                      <small className="text-muted d-block">{product.author}</small>
                                    )}
                                    <div className="mt-1">
                                      <Badge bg="primary" className="me-1">
                                        {product.product_type_display}
                                      </Badge>
                                      {product.is_digital && <Badge bg="info">Дижитал</Badge>}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Үнэ */}
                              <td className="text-center align-middle">
                                <div className="fw-bold">{product.price_in_silver_coins} 🥈</div>
                                <small className="text-muted">({product.price} ₮)</small>
                              </td>

                              {/* Тоо ширхэг */}
                              <td className="text-center align-middle">
                                <div className="d-flex justify-content-center align-items-center">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.quantity, product)}
                                    disabled={item.quantity <= 1 || updating[item.id]}
                                  >
                                    -
                                  </Button>
                                  <Form.Control
                                    type="number"
                                    value={item.quantity}
                                    readOnly
                                    className="mx-2 text-center"
                                    style={{ width: '60px' }}
                                    disabled={updating[item.id]}
                                  />
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.quantity, product)}
                                    disabled={
                                      (!product.unlimited_stock &&
                                        item.quantity >= product.stock_quantity) ||
                                      updating[item.id]
                                    }
                                  >
                                    +
                                  </Button>
                                </div>
                                {!product.unlimited_stock &&
                                  item.quantity >= product.stock_quantity && (
                                    <small className="text-warning d-block mt-1">
                                      Нөөц: {product.stock_quantity}
                                    </small>
                                  )}
                              </td>

                              {/* Нийт үнэ */}
                              <td className="text-end align-middle">
                                <div className="fw-bold">{item.subtotal} 🥈</div>
                              </td>

                              {/* Устгах товч */}
                              <td className="align-middle">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={updating[item.id]}
                                >
                                  {updating[item.id] ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : (
                                    <i className="bi bi-trash" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>

              {/* Баруун тал - Нийлбэр */}
              <Col lg={4}>
                <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                  <Card.Body className="p-4">
                    <h5 className="mb-4">Захиалгын дүн</h5>

                    {/* Бүтээгдэхүүний үнэ */}
                    <div className="d-flex justify-content-between mb-3">
                      <span>Бүтээгдэхүүн:</span>
                      <span className="fw-bold">{cart.total_price} 🥈</span>
                    </div>

                    {/* Хүргэлтийн үнэ */}
                    {cart.total_shipping > 0 && (
                      <div className="d-flex justify-content-between mb-3">
                        <span>
                          <i className="bi bi-truck me-2" />
                          Хүргэлт:
                        </span>
                        <span>{cart.total_shipping} ₮</span>
                      </div>
                    )}

                    <hr />

                    {/* Төлбөрийн арга */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Төлбөрийн арга:</label>
                      <div className="btn-group w-100" role="group">
                        <input
                          type="radio"
                          className="btn-check"
                          name="paymentMethod"
                          id="silverPayment"
                          autoComplete="off"
                          checked={paymentMethod === 'silver'}
                          onChange={() => setPaymentMethod('silver')}
                        />
                        <label
                          className="btn btn-outline-primary"
                          htmlFor="silverPayment"
                        >
                          🥈 Мөнгөн зоос
                        </label>

                        <input
                          type="radio"
                          className="btn-check"
                          name="paymentMethod"
                          id="copperPayment"
                          autoComplete="off"
                          checked={paymentMethod === 'copper'}
                          onChange={() => setPaymentMethod('copper')}
                        />
                        <label
                          className="btn btn-outline-warning"
                          htmlFor="copperPayment"
                        >
                          🥉 Хүрэл зоос
                        </label>
                      </div>
                    </div>

                    {/* Нийт дүн */}
                    <div className="d-flex justify-content-between mb-4">
                      <h5 className="mb-0">Нийт:</h5>
                      <h5 className="mb-0 text-primary">
                        {paymentMethod === 'silver' ? (
                          <>
                            {cart.grand_total} 🥈
                            <div className="small text-muted">
                              ≈ {calculateCopperPrice(cart.grand_total)} 🥉
                            </div>
                          </>
                        ) : (
                          <>
                            {calculateCopperPrice(cart.grand_total)} 🥉
                            <div className="small text-muted">
                              ≈ {cart.grand_total} 🥈
                            </div>
                          </>
                        )}
                        {cart.total_shipping > 0 && (
                          <div className="small text-muted">+ {cart.total_shipping} ₮</div>
                        )}
                      </h5>
                    </div>

                    {/* Төлбөр төлөх товч */}
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-100 mb-3"
                      onClick={handleCheckout}
                    >
                      <i className="bi bi-credit-card me-2" />
                      Төлбөр төлөх
                    </Button>

                    {/* Мэдээлэл */}
                    <Alert variant="info" className="small mb-0">
                      <strong>Анхаар:</strong> Мөнгөн дүнг таны{' '}
                      {paymentMethod === 'silver' ? (
                        <>
                          <strong>мөнгөн зоос</strong> 🥈
                        </>
                      ) : (
                        <>
                          <strong>хүрэл зоос</strong> 🥉
                        </>
                      )}{' '}
                      -оос хасагдана.
                      <div className="mt-1 small">
                        Ханш: 1 🥈 = {COPPER_TO_SILVER_RATE} 🥉
                      </div>
                    </Alert>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
      </Container>
    </div>
  );
}

export default CartPage;
