// frontend/src/components/MembershipSummary.jsx
// Гишүүнчлэлийн дэлгэрэнгүй мэдээллийг харуулах компонент

import { useState, useEffect } from 'react';
import {
  getMembershipSummary,
  getMembershipPurchasesByMonth,
  applyHighestMembership,
} from '../services/productsService';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';

// Bootstrap components
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import Table from 'react-bootstrap/Table';

// Icons
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Award,
  ShoppingBag,
  Crown,
  Star,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

function MembershipSummary({ isOwnProfile = false }) {
  const [summary, setSummary] = useState(null);
  const [purchasesByMonth, setPurchasesByMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyingHighest, setApplyingHighest] = useState(false);

  // Tier icons and colors
  const tierConfig = {
    VIP: { icon: Crown, color: 'warning', emoji: '👑' },
    PREMIUM: { icon: Award, color: 'danger', emoji: '💎' },
    PRO: { icon: Zap, color: 'info', emoji: '⭐' },
    MEMBER: { icon: Star, color: 'success', emoji: '🎖️' },
    FREE: { icon: CheckCircle, color: 'secondary', emoji: '🆓' },
  };

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, monthlyData] = await Promise.all([
        getMembershipSummary(),
        getMembershipPurchasesByMonth(),
      ]);

      setSummary(summaryData);
      setPurchasesByMonth(monthlyData);
    } catch (err) {
      console.error('Гишүүнчлэлийн мэдээлэл татахад алдаа:', err);
      setError(err.message || 'Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyHighest = async () => {
    if (
      !window.confirm(
        'Та худалдаж авсан эрхүүдээсээ хамгийн өндөр түвшинтэйг идэвхжүүлэхдээ итгэлтэй байна уу?'
      )
    ) {
      return;
    }

    setApplyingHighest(true);
    try {
      const result = await applyHighestMembership();

      if (result.status === 'upgraded') {
        alert(`Амжилттай! ${result.old_tier} → ${result.new_tier}`);
        // Мэдээллийг дахин татах
        await fetchMembershipData();
      } else if (result.status === 'no_change') {
        alert(result.message);
      } else {
        alert(result.message || 'Амжилттай');
      }
    } catch (err) {
      console.error('Хамгийн өндөр эрх идэвхжүүлэхэд алдаа:', err);
      alert(err.message || 'Алдаа гарлаа');
    } finally {
      setApplyingHighest(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Тодорхойгүй';
    return formatDateUtil(dateString);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('mn-MN').format(amount);
  };

  if (loading) {
    return (
      <Card className="mt-4">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Гишүүнчлэлийн мэдээлэл татаж байна...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="warning" className="mt-4">
        <AlertCircle size={16} className="me-2" />
        {error}
      </Alert>
    );
  }

  if (!summary) {
    return null;
  }

  const { current_status, statistics, by_tier } = summary;
  const TierIcon = tierConfig[current_status.current_tier]?.icon || Star;
  const tierColor = tierConfig[current_status.current_tier]?.color || 'secondary';
  const tierEmoji = tierConfig[current_status.current_tier]?.emoji || '❓';

  return (
    <Card className="mt-4 border-0 shadow-sm">
      <Card.Header className={`bg-${tierColor} bg-opacity-10 border-0`}>
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold">
            <TierIcon size={20} className={`text-${tierColor} me-2`} />
            Гишүүнчлэлийн Дэлгэрэнгүй
          </h5>
          {isOwnProfile && statistics.total_purchases > 0 && (
            <Button
              variant={tierColor}
              size="sm"
              onClick={handleApplyHighest}
              disabled={applyingHighest}
            >
              {applyingHighest ? (
                <Spinner as="span" animation="border" size="sm" className="me-2" />
              ) : (
                <TrendingUp size={16} className="me-2" />
              )}
              Өндөр эрх идэвхжүүлэх
            </Button>
          )}
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {/* Одоогийн төлөв */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className={`border-${tierColor} h-100`}>
              <Card.Body>
                <h6 className="fw-semibold mb-3 text-muted">
                  <Clock size={16} className="me-2" />
                  Одоогийн Төлөв
                </h6>
                <div className="d-flex align-items-center mb-3">
                  <span style={{ fontSize: '2rem' }} className="me-2">
                    {tierEmoji}
                  </span>
                  <div>
                    <h4 className="mb-0">{current_status.current_tier}</h4>
                    <small className="text-muted">Эрэмбэ: {current_status.tier_priority}</small>
                  </div>
                </div>
                {current_status.is_active ? (
                  <>
                    <div className="mb-2">
                      <Badge bg="success" className="me-2">
                        Идэвхтэй
                      </Badge>
                      <span className="text-success">
                        <CheckCircle size={14} className="me-1" />
                        {current_status.remaining_days} хоног үлдсэн
                      </span>
                    </div>
                    <small className="text-muted">
                      Дуусах: {formatDate(current_status.expiration)}
                    </small>
                  </>
                ) : (
                  <Badge bg="secondary">Идэвхгүй</Badge>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mt-3 mt-md-0">
            <Card className="border-info h-100">
              <Card.Body>
                <h6 className="fw-semibold mb-3 text-muted">
                  <DollarSign size={16} className="me-2" />
                  Үлдэгдэл Үнэ Цэнэ
                </h6>
                <h3 className="mb-3">{formatCurrency(current_status.remaining_value)} ₮</h3>
                <div className="text-muted small">
                  <div>Өдрийн үнэ: {formatCurrency(current_status.daily_price)} ₮</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Статистик */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="bg-light border-0">
              <Card.Body>
                <h6 className="fw-semibold mb-3">
                  <TrendingUp size={16} className="me-2" />
                  Нийт Статистик
                </h6>
                <Row>
                  <Col xs={6} md={3} className="text-center mb-3 mb-md-0">
                    <div className="text-primary" style={{ fontSize: '2rem' }}>
                      {statistics.total_purchases}
                    </div>
                    <div className="text-muted small">Худалдаж авалт</div>
                  </Col>
                  <Col xs={6} md={3} className="text-center mb-3 mb-md-0">
                    <div className="text-success" style={{ fontSize: '2rem' }}>
                      {formatCurrency(statistics.total_spent)}
                    </div>
                    <div className="text-muted small">Нийт зарцуулалт</div>
                  </Col>
                  <Col xs={6} md={3} className="text-center">
                    <div className="text-info small">
                      <div className="fw-semibold">Эхний худалдаж авалт</div>
                      <div>{formatDate(statistics.first_purchase)}</div>
                    </div>
                  </Col>
                  <Col xs={6} md={3} className="text-center">
                    <div className="text-warning small">
                      <div className="fw-semibold">Сүүлд худалдаж авсан</div>
                      <div>{formatDate(statistics.latest_purchase)}</div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Accordion - Дэлгэрэнгүй */}
        <Accordion defaultActiveKey="0">
          {/* Түвшин бүрээр */}
          <Accordion.Item eventKey="0">
            <Accordion.Header>
              <Award size={18} className="me-2" />
              Түвшин Бүрээр ({Object.keys(by_tier).length})
            </Accordion.Header>
            <Accordion.Body>
              <ListGroup variant="flush">
                {Object.entries(by_tier).map(([tier, data]) => {
                  const config = tierConfig[tier];
                  return (
                    <ListGroup.Item key={tier} className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span style={{ fontSize: '1.2rem' }} className="me-2">
                            {config?.emoji || '❓'}
                          </span>
                          <strong>{tier}</strong>
                        </div>
                        <div className="text-end">
                          <div>
                            <Badge bg={config?.color || 'secondary'} className="me-2">
                              {data.count} удаа
                            </Badge>
                          </div>
                          <small className="text-muted">
                            {formatCurrency(data.total_spent)} зоос • {data.total_days} хоног
                          </small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>

          {/* Он сараар */}
          {purchasesByMonth &&
            Object.keys(purchasesByMonth.purchases_by_month || {}).length > 0 && (
              <Accordion.Item eventKey="1">
                <Accordion.Header>
                  <Calendar size={18} className="me-2" />
                  Он Сараар ({Object.keys(purchasesByMonth.purchases_by_month).length} сар)
                </Accordion.Header>
                <Accordion.Body>
                  <Table responsive striped hover size="sm">
                    <thead>
                      <tr>
                        <th>Огноо</th>
                        <th>Түвшин</th>
                        <th>Үнэ</th>
                        <th>Хугацаа</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(purchasesByMonth.purchases_by_month).map(
                        ([month, purchases]) =>
                          purchases.map((purchase, idx) => {
                            const config = tierConfig[purchase.tier];
                            return (
                              <tr key={`${month}-${idx}`}>
                                <td>
                                  <small className="text-muted">{month}</small>
                                </td>
                                <td>
                                  <Badge bg={config?.color || 'secondary'}>
                                    {config?.emoji || '❓'} {purchase.tier}
                                  </Badge>
                                </td>
                                <td>{formatCurrency(purchase.price_paid)} зоос</td>
                                <td>{purchase.duration_days} хоног</td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </Table>
                </Accordion.Body>
              </Accordion.Item>
            )}

          {/* Бүх худалдаж авалт */}
          {summary.all_purchases && summary.all_purchases.length > 0 && (
            <Accordion.Item eventKey="2">
              <Accordion.Header>
                <ShoppingBag size={18} className="me-2" />
                Бүх Худалдаж Авалт ({summary.all_purchases.length})
              </Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  {summary.all_purchases.slice(0, 10).map((purchase, idx) => {
                    const config = tierConfig[purchase.tier];
                    return (
                      <ListGroup.Item key={idx} className="px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="mb-1">
                              <Badge bg={config?.color || 'secondary'}>
                                {config?.emoji || '❓'} {purchase.tier}
                              </Badge>
                            </div>
                            <div className="small text-muted">
                              {formatDate(purchase.purchased_at)}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-semibold">
                              {formatCurrency(purchase.price_paid)} зоос
                            </div>
                            <small className="text-muted">{purchase.duration_days} хоног</small>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {summary.all_purchases.length > 10 && (
                    <ListGroup.Item className="px-0 text-center text-muted">
                      <small>... болон {summary.all_purchases.length - 10} өөр</small>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          )}
        </Accordion>

        {/* Хэрвээ худалдаж авалт байхгүй бол */}
        {statistics.total_purchases === 0 && (
          <Alert variant="info" className="mt-3">
            <AlertCircle size={16} className="me-2" />
            Та одоогоор гишүүнчлэл худалдаж аваагүй байна.
          </Alert>
        )}

        {/* Гишүүнчлэл худалдаж авах */}
        {isOwnProfile && (
          <Card className="mt-4 border-primary">
            <Card.Body className="p-4 text-center">
              <ShoppingBag size={48} className="text-primary mb-3" />
              <h5 className="mb-3">Гишүүнчлэл Худалдаж Авах</h5>
              <p className="text-muted mb-4">
                Өөрийн түвшингээ дээшлүүлж, илүү олон боломжоор хангагдаарай!
              </p>
              <Row className="g-3 justify-content-center">
                <Col xs={12} md={6} lg={4}>
                  <Button
                    variant="success"
                    size="lg"
                    className="w-100"
                    href="/products?filter=student_membership"
                  >
                    <Star size={20} className="me-2" />
                    Сурагчийн гишүүнчлэл
                  </Button>
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100"
                    href="/products?filter=teacher_membership"
                  >
                    <Award size={20} className="me-2" />
                    Багшийн гишүүнчлэл
                  </Button>
                </Col>
                <Col xs={12} md={6} lg={4}>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="w-100"
                    href="/products"
                  >
                    <ShoppingBag size={20} className="me-2" />
                    Бүх бүтээгдэхүүн
                  </Button>
                </Col>
              </Row>
              <div className="mt-4">
                <small className="text-muted">
                  💰 Мөнгөн зоос 🥈 эсвэл хүрэл зоос 🥉 ашиглан худалдаж авах боломжтой
                  <br />
                  Ханш: 1 🥈 = 100 🥉
                </small>
              </div>
            </Card.Body>
          </Card>
        )}
      </Card.Body>
    </Card>
  );
}

export default MembershipSummary;
