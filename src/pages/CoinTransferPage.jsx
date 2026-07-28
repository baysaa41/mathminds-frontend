// frontend/src/pages/CoinTransferPage.jsx (ШИНЭЧИЛСЭН - 3 төрлийн coin)
// ✅ 3 төрлийн coin шилжүүлэх хуудас: Алт 🥇, Мөнгө 🥈, Зэс 🥉

import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';

// Icons
import { Send, TrendingUp, TrendingDown, Wallet, Award } from 'lucide-react';

const CoinTransferPage = () => {
  const { user } = useAuth();
  const { setPageTitle } = useOutletContext();
  const location = useLocation();

  // Form state
  const [receiverUsername, setReceiverUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [coinType, setCoinType] = useState('gold'); // gold, silver, copper
  const [description, setDescription] = useState('');

  // UI state
  const [balances, setBalances] = useState({
    gold_coins: 0,
    silver_coins: 0,
    copper_coins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Coin types configuration
  const coinTypes = [
    {
      value: 'gold',
      label: 'Алт',
      emoji: '🥇',
      color: '#FFD700',
      bgColor: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    },
    {
      value: 'silver',
      label: 'Мөнгө',
      emoji: '🥈',
      color: '#C0C0C0',
      bgColor: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    },
    {
      value: 'copper',
      label: 'Зэс',
      emoji: '🥉',
      color: '#B87333',
      bgColor: 'linear-gradient(135deg, #B87333 0%, #8B4513 100%)',
    },
  ];

  const currentCoinConfig = coinTypes.find((c) => c.value === coinType);
  const currentBalance = balances[`${coinType}_coins`] || 0;

  useEffect(() => {
    setPageTitle('Зоос шилжүүлэх');
    fetchData();
    return () => {
      setPageTitle('Нүүр');
    };
  }, [setPageTitle]);

  // ProfilePage-ээс ирсэн хэрэглэгчийн нэрийг автоматаар оруулах
  useEffect(() => {
    if (location.state?.recipientUsername) {
      setReceiverUsername(location.state.recipientUsername);
    }
    // ProfilePage-ээс coin type ирсэн бол
    if (location.state?.coinType) {
      setCoinType(location.state.coinType);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Балансууд татах
      const balanceResponse = await apiClient.get('/api/coins/transactions/balance/');
      setBalances(balanceResponse.data.balances);

      // Сүүлийн гүйлгээнүүд
      const transactionsResponse = await apiClient.get('/api/coins/transactions/?page_size=10');
      const transactions = transactionsResponse.data.results || transactionsResponse.data;
      setRecentTransactions(transactions);
    } catch (err) {
      setError('Мэдээлэл татахад алдаа гарлаа.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!receiverUsername.trim()) {
      showNotification('Хэрэглэгчийн нэрийг оруулна уу', 'danger');
      return;
    }

    const amountNum = parseInt(amount);
    if (!amountNum || amountNum <= 0) {
      showNotification('Дүн 0-ээс их байх ёстой', 'danger');
      return;
    }

    if (amountNum > currentBalance) {
      showNotification(`Таны ${currentCoinConfig.label} хүрэлцэхгүй байна`, 'danger');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient.post('/api/coins/transactions/transfer/', {
        receiver_username: receiverUsername.trim(),
        amount: amountNum,
        coin_type: coinType,
        description: description.trim(),
      });

      // Success
      showNotification(
        `${amountNum} ${currentCoinConfig.label} ${currentCoinConfig.emoji} амжилттай илгээлээ!`,
        'success'
      );

      // Form цэвэрлэх
      setReceiverUsername('');
      setAmount('');
      setDescription('');

      // Мэдээллийг дахин татах
      await fetchData();
    } catch (err) {
      console.error('Transfer error:', err);
      const errorMsg =
        err.response?.data?.receiver_username?.[0] ||
        err.response?.data?.amount?.[0] ||
        err.response?.data?.coin_type?.[0] ||
        err.response?.data?.detail ||
        'Coin илгээхэд алдаа гарлаа';
      showNotification(errorMsg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCoinIcon = (coinType) => {
    const config = coinTypes.find((c) => c.value === coinType);
    return config ? config.emoji : '🪙';
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className={toastVariant === 'light' ? 'text-dark' : 'text-white'}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Row>
        {/* Зүүн тал: Шилжүүлэх форм */}
        <Col lg={8}>
          {/* Balance Cards - 3 төрлийн coin */}
          <Row className="mb-4">
            {coinTypes.map((coin) => (
              <Col md={4} key={coin.value} className="mb-3">
                <Card
                  className={`border-0 shadow-sm h-100 ${coinType === coin.value ? 'border-3 border-primary' : ''}`}
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onClick={() => setCoinType(coin.value)}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <Card.Body
                    className="p-3"
                    style={{
                      background: coin.bgColor,
                    }}
                  >
                    <Stack gap={2} className="text-white">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-white bg-opacity-25"
                        style={{ width: '50px', height: '50px', fontSize: '24px' }}
                      >
                        {coin.emoji}
                      </div>
                      <div>
                        <div className="small text-white-50">{coin.label}</div>
                        <h4 className="mb-0 fw-bold">
                          {(balances[`${coin.value}_coins`] || 0).toLocaleString()}
                        </h4>
                      </div>
                    </Stack>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Transfer Form */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <Stack direction="horizontal" gap={2}>
                <Send size={20} className="text-primary" />
                <h5 className="mb-0 fw-semibold">
                  {currentCoinConfig.emoji} {currentCoinConfig.label} илгээх
                </h5>
              </Stack>
            </Card.Header>
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Coin Type Selector */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Coin-н төрөл</Form.Label>
                  <ButtonGroup className="w-100">
                    {coinTypes.map((coin) => (
                      <ToggleButton
                        key={coin.value}
                        id={`coin-${coin.value}`}
                        type="radio"
                        variant={coinType === coin.value ? 'primary' : 'outline-secondary'}
                        name="coinType"
                        value={coin.value}
                        checked={coinType === coin.value}
                        onChange={(e) => setCoinType(e.currentTarget.value)}
                      >
                        <span style={{ fontSize: '20px' }}>{coin.emoji}</span>
                        <div className="small">{coin.label}</div>
                      </ToggleButton>
                    ))}
                  </ButtonGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Хэрэглэгчийн нэр</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="username"
                    value={receiverUsername}
                    onChange={(e) => setReceiverUsername(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <Form.Text className="text-muted">
                    Хэрэглэгчийн нэвтрэх нэрийг оруулна уу
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    Дүн ({currentCoinConfig.label} {currentCoinConfig.emoji})
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="100"
                    min="1"
                    max={currentBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <Form.Text className="text-muted">
                    Хамгийн их: {currentBalance.toLocaleString()} {currentCoinConfig.label}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Тайлбар (заавал биш)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Баярлалаа..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting || currentBalance <= 0}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Илгээж байна...
                      </>
                    ) : (
                      <>
                        <Send size={18} className="me-2" />
                        {currentCoinConfig.emoji} Илгээх
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Баруун тал: Сүүлийн гүйлгээнүүд */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-white border-bottom">
              <h6 className="mb-0 fw-semibold">Сүүлийн гүйлгээнүүд</h6>
            </Card.Header>
            <ListGroup variant="flush">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const isSent = tx.sender.id === user.id;
                  const otherUser = isSent ? tx.receiver : tx.sender;

                  return (
                    <ListGroup.Item key={tx.id} className="px-3 py-3">
                      <Stack direction="horizontal" gap={2} className="mb-1">
                        <div
                          className={`d-flex align-items-center justify-content-center rounded-circle ${isSent ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}
                          style={{ width: '32px', height: '32px' }}
                        >
                          {isSent ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-semibold small text-truncate">
                            {isSent ? 'Илгээсэн' : 'Хүлээн авсан'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {otherUser.first_name || otherUser.username}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className={`fw-bold ${isSent ? 'text-danger' : 'text-success'}`}>
                            {isSent ? '-' : '+'}
                            {tx.amount}
                          </div>
                          <div style={{ fontSize: '18px' }}>{getCoinIcon(tx.coin_type)}</div>
                        </div>
                      </Stack>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {formatDateTime(tx.created_at)}
                      </div>
                      {tx.description && (
                        <div className="text-muted small mt-1 fst-italic">"{tx.description}"</div>
                      )}
                    </ListGroup.Item>
                  );
                })
              ) : (
                <ListGroup.Item className="text-center text-muted py-4">
                  Гүйлгээ байхгүй байна
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CoinTransferPage;
