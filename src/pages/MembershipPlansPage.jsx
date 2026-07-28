// frontend/src/pages/MembershipPlansPage.jsx
// Гишүүнчлэлийн төлөвлөгөөнүүд болон боломжуудыг харуулах хуудас

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, addToCart } from '../services/productsService';
import { createMembershipInvoice } from '../services/membershipService';
import PaymentModal from '../components/PaymentModal';
import EndowmentStatusCard from '../components/EndowmentStatusCard';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Alert from 'react-bootstrap/Alert';

// Icons
import { Crown, CheckCircle, Sparkles, Coins } from 'lucide-react';

function MembershipPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // "Жилийн гишүүнчлэл" (100,000₮) болон "360 гишүүнчлэл" (endowment)
  const [generalProducts, setGeneralProducts] = useState([]);
  const [buyLoadingId, setBuyLoadingId] = useState(null);
  const [buyError, setBuyError] = useState(null);
  const [showQPayModal, setShowQPayModal] = useState(false);
  const [qpayData, setQpayData] = useState(null);
  const [qpayInvoiceId, setQpayInvoiceId] = useState(null);

  useEffect(() => {
    getProducts()
      .then((products) => {
        const names = ['Жилийн гишүүнчлэл', '360 гишүүнчлэл'];
        setGeneralProducts(products.filter((p) => names.includes(p.name)));
      })
      .catch((err) => console.error('Гишүүнчлэлийн бүтээгдэхүүн татахад алдаа:', err));
  }, []);

  const handleBuyMembership = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBuyError(null);
    setBuyLoadingId(product.id);
    try {
      const result = await createMembershipInvoice(product.id);
      setQpayData(result);
      setQpayInvoiceId(result.local_invoice_id);
      setShowQPayModal(true);
    } catch (err) {
      setBuyError(err.response?.data?.error || 'Нэхэмжлэх үүсгэхэд алдаа гарлаа');
    } finally {
      setBuyLoadingId(null);
    }
  };

  const handleBuyWithSilver = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBuyError(null);
    setBuyLoadingId(`silver-${product.id}`);
    try {
      await addToCart(product.id, 1);
      navigate('/cart');
    } catch (err) {
      setBuyError(err.response?.data?.error || 'Сагсанд нэмэхэд алдаа гарлаа');
    } finally {
      setBuyLoadingId(null);
    }
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">
          <Sparkles className="me-2" size={40} />
          Гишүүнчлэл
        </h1>
        <p className="lead text-muted">
          Бүх контентод хандаж, AI боломжуудыг ашиглаж, клубт элсээрэй
        </p>
      </div>

      {/* Ерөнхий гишүүнчлэл */}
      <div className="mb-5">
        <h2 className="text-center mb-4 fw-bold">
          <Coins size={28} className="me-2 text-warning" />
          Ерөнхий гишүүнчлэл
        </h2>

        <EndowmentStatusCard />

        {buyError && <Alert variant="danger">{buyError}</Alert>}

        <Row className="justify-content-center g-4">
          <Col md={6} lg={5}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-info bg-opacity-10 border-0 text-center">
                <div style={{ fontSize: '3rem' }}>🎓</div>
                <h3 className="fw-bold mb-1">Жилийн гишүүнчлэл</h3>
                <p className="text-muted small mb-0">1 жилийн хугацаатай</p>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-4">
                  <div className="display-5 fw-bold">100,000₮</div>
                  <div className="text-muted small">жилд</div>
                </div>
                <ListGroup variant="flush" className="flex-grow-1 mb-3">
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> 1 жилийн бүрэн гишүүн эрх
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> AI боломжуудыг бүрэн ашиглах
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> Клубт элсэх, контент үзэх
                  </ListGroup.Item>
                </ListGroup>
                {(() => {
                  const product = generalProducts.find((p) => p.name === 'Жилийн гишүүнчлэл');
                  return (
                    <>
                      <Button
                        variant="info"
                        size="lg"
                        className="w-100 mb-2"
                        disabled={!product || buyLoadingId === product?.id}
                        onClick={() => product && handleBuyMembership(product)}
                      >
                        {buyLoadingId === product?.id ? 'Уншиж байна...' : 'QPay-аар худалдаж авах'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="w-100"
                        disabled={!product || buyLoadingId === `silver-${product?.id}`}
                        onClick={() => product && handleBuyWithSilver(product)}
                      >
                        <Coins size={16} className="me-2" />
                        {buyLoadingId === `silver-${product?.id}`
                          ? 'Уншиж байна...'
                          : product
                            ? `${new Intl.NumberFormat('mn-MN').format(product.price_in_silver_coins)} ⚪ зоосоор`
                            : 'Мөнгөн зоосоор'}
                      </Button>
                    </>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={5}>
            <Card className="h-100 shadow-lg border-warning border-2">
              <div className="position-absolute top-0 start-50 translate-middle">
                <Badge bg="warning" text="dark" className="px-3 py-2">
                  <Crown size={14} className="me-1" />
                  Endowment
                </Badge>
              </div>
              <Card.Header className="bg-warning bg-opacity-10 border-0 pt-4 text-center">
                <div style={{ fontSize: '3rem' }}>👑</div>
                <h3 className="fw-bold mb-1">360 гишүүнчлэл</h3>
                <p className="text-muted small mb-0">60,000₮ хураамж + 300,000₮ endowment</p>
              </Card.Header>
              <Card.Body className="d-flex flex-column">
                <div className="text-center mb-4">
                  <div className="display-5 fw-bold">360,000₮</div>
                  <div className="text-muted small">нэг удаа</div>
                </div>
                <ListGroup variant="flush" className="flex-grow-1 mb-3">
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> 1 жилийн бүрэн гишүүн эрх
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> 300,000₮ нь endowment (алтан зоосоор хадгалагдана)
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> Дуусахаас 1 сарын өмнө цуцлаад мөнгөө буцааж авах
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <CheckCircle size={18} className="me-2 text-success" /> Хүсэлт гаргаагүй бол автоматаар 1 жилээр сунгагдана
                  </ListGroup.Item>
                  <ListGroup.Item className="border-0 px-0 py-2">
                    <Crown size={18} className="me-2 text-warning" /> Бүрмөсөн хандивлаад хугацаагүй VIP болох (Монбүшо/ЭЕШ тэргүүн ээлж)
                  </ListGroup.Item>
                </ListGroup>
                {(() => {
                  const product = generalProducts.find((p) => p.name === '360 гишүүнчлэл');
                  return (
                    <>
                      <Button
                        variant="warning"
                        size="lg"
                        className="w-100 mb-2"
                        disabled={!product || buyLoadingId === product?.id}
                        onClick={() => product && handleBuyMembership(product)}
                      >
                        {buyLoadingId === product?.id ? 'Уншиж байна...' : 'QPay-аар худалдаж авах'}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        className="w-100"
                        disabled={!product || buyLoadingId === `silver-${product?.id}`}
                        onClick={() => product && handleBuyWithSilver(product)}
                      >
                        <Coins size={16} className="me-2" />
                        {buyLoadingId === `silver-${product?.id}`
                          ? 'Уншиж байна...'
                          : product
                            ? `${new Intl.NumberFormat('mn-MN').format(product.price_in_silver_coins)} ⚪ зоосоор`
                            : 'Мөнгөн зоосоор'}
                      </Button>
                    </>
                  );
                })()}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Alert variant="light" className="mt-4 text-center small">
          Анги/бүлэг, сургуулиараа гишүүн болохыг хүсвэл{' '}
          <a href="/about">бидэнтэй холбогдож</a> нөхцөлөө тохирно уу.
        </Alert>
      </div>

      {/* CTA Section */}
      <div className="text-center py-5 bg-light rounded">
        <h3 className="mb-3">Асуулт байна уу?</h3>
        <p className="text-muted mb-4">
          Бид танд тохирсон төлөвлөгөөг сонгоход тань туслахад бэлэн байна
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/about')}>
          Холбогдох
        </Button>
      </div>

      <PaymentModal
        show={showQPayModal}
        onClose={() => {
          setShowQPayModal(false);
          navigate('/my-purchases');
        }}
        paymentData={qpayData}
        localInvoiceId={qpayInvoiceId}
      />
    </Container>
  );
}

export default MembershipPlansPage;
