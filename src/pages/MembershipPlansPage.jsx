// frontend/src/pages/MembershipPlansPage.jsx
// Гишүүнчлэлийн төлөвлөгөөнүүд болон боломжуудыг харуулах хуудас

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Table from 'react-bootstrap/Table';
import ListGroup from 'react-bootstrap/ListGroup';
import Alert from 'react-bootstrap/Alert';

// Icons
import {
  Crown,
  Award,
  Zap,
  Star,
  User,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Shield,
  Sparkles,
  Infinity as InfinityIcon,
  Lock,
} from 'lucide-react';

function MembershipPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // 'monthly' or 'yearly'

  // Хэрэглэгчийн role-ээс хамааруулж харуулах түвшингүүд
  const userRole = user?.role || 'student'; // Default: student
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';

  // Гишүүнчлэлийн төлөвлөгөөнүүд
  const membershipPlans = {
    FREE_TEACHER: {
      name: 'Гишүүнчлэлгүй Багш',
      icon: User,
      color: 'secondary',
      emoji: '👤',
      roleType: 'teacher',
      price: {
        monthly: 0,
        yearly: 0,
      },
      tagline: 'Үнэгүй багшийн эрх',
      features: [
        { text: 'Үндсэн контентод хандах', available: true },
        { text: 'Контент үзэх, коммент бичих', available: true },
        { text: 'Максимум 1 клуб үүсгэх', available: true },
        { text: 'Клубын максимум 10 гишүүн', available: true },
        { text: 'Зарын дэмжлэгтэй', available: true, isNegative: true },
        { text: '5 зураг нийтлэлд', available: true },
        { text: 'Видео хэмжээ: 100MB', available: true },
        { text: 'Контент үүсгэх боломжгүй', available: false },
      ],
      limitations: {
        max_clubs: 1,
        max_club_members: 10,
        boosted_posts_per_month: 0,
        max_images_per_post: 5,
        max_video_size: '100MB',
        show_ads: true,
        can_create_content: false,
      },
    },
    TEACHER: {
      name: 'Энгийн Багш',
      icon: Star,
      color: 'success',
      emoji: '👨‍🏫',
      roleType: 'teacher',
      price: {
        monthly: 20000,
        yearly: 200000, // 2 сараар хямдруулсан
      },
      tagline: 'Идэвхтэй багш нарт',
      popular: true,
      features: [
        { text: 'Гишүүнчлэлгүйн бүх боломж', available: true },
        { text: 'Нийтлэл, бодлого үүсгэх', available: true },
        { text: 'Томьёо, тест үүсгэх', available: true },
        { text: 'Максимум 3 клуб үүсгэх', available: true },
        { text: 'Клубын максимум 30 гишүүн', available: true },
        { text: 'Сард 5 boosted пост', available: true },
        { text: 'Зарыг идэвхгүй болгох', available: true },
        { text: '10 зураг нийтлэлд', available: true },
        { text: 'Видео хэмжээ: 200MB', available: true },
        { text: 'Имэйл дэмжлэг', available: true },
      ],
      limitations: {
        max_clubs: 3,
        max_club_members: 30,
        boosted_posts_per_month: 5,
        max_images_per_post: 10,
        max_video_size: '200MB',
        show_ads: false,
        can_create_content: true,
      },
    },
    PRO_TEACHER: {
      name: 'PRO Багш',
      icon: Crown,
      color: 'warning',
      emoji: '👑',
      roleType: 'teacher',
      price: {
        monthly: 30000,
        yearly: 300000, // 2 сараар хямдруулсан
      },
      tagline: 'Мэргэжлийн багш нарт',
      featured: true,
      features: [
        { text: 'Энгийн багшийн бүх боломж', available: true },
        { text: 'Хязгааргүй контент үүсгэх', available: true },
        { text: 'Онцгой бодлого, материал үүсгэх', available: true },
        { text: 'Олимпиадын материал нэмэх', available: true },
        { text: 'Максимум 10 клуб үүсгэх', available: true },
        { text: 'Клубын максимум 100 гишүүн', available: true },
        { text: 'Хязгааргүй boosted пост', available: true },
        { text: '20 зураг нийтлэлд', available: true },
        { text: 'Видео хэмжээ: 1GB', available: true },
        { text: 'Урамшуулалтай зоос', available: true },
        { text: 'PRO badge профайл дээр', available: true },
        { text: '24/7 тусгай дэмжлэг', available: true },
      ],
      limitations: {
        max_clubs: 10,
        max_club_members: 100,
        boosted_posts_per_month: '∞',
        max_images_per_post: 20,
        max_video_size: '1GB',
        show_ads: false,
        can_create_content: true,
      },
    },
    STUDENT: {
      name: 'Сурагч',
      icon: Award,
      color: 'info',
      emoji: '🎓',
      roleType: 'student',
      price: {
        monthly: 10000,
        yearly: 100000, // 2 сараар хямдруулсан
      },
      tagline: 'Суралцагч нарт',
      popular: true,
      features: [
        { text: 'Бүх контентод хандах', available: true },
        { text: 'Бодлого, тест бодох', available: true },
        { text: 'Томьёо, материал үзэх', available: true },
        { text: 'Клубт элсэх (хязгааргүй)', available: true },
        { text: 'Коммент бичих, хариу өгөх', available: true },
        { text: 'Зарыг идэвхгүй болгох', available: true },
        { text: '8 зураг нийтлэлд', available: true },
        { text: 'Видео хэмжээ: 200MB', available: true },
        { text: 'Ахиц харах, статистик', available: true },
        { text: 'Имэйл дэмжлэг', available: true },
        { text: 'Контент үүсгэх боломжгүй', available: false },
      ],
      limitations: {
        max_clubs: 0, // Зөвхөн клубт элсэх, үүсгэхгүй
        max_club_members: 0,
        boosted_posts_per_month: 0,
        max_images_per_post: 8,
        max_video_size: '200MB',
        show_ads: false,
        can_create_content: false,
        can_join_clubs: true,
      },
    },
  };

  // Хэрэглэгчийн role-ээс хамааруулж харуулах түвшингүүд
  const availableTiers = isTeacher ? ['FREE_TEACHER', 'TEACHER', 'PRO_TEACHER'] : ['STUDENT'];

  const tiers = availableTiers;

  const handleSelectPlan = (tier) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (tier === 'FREE_TEACHER') {
      alert('Та аль хэдийн үнэгүй хувилбарыг ашиглаж байна');
      return;
    }

    // Бүтээгдэхүүн хуудас руу шилжих
    navigate('/products', { state: { filterTier: tier } });
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Үнэгүй';
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">
          <Sparkles className="me-2" size={40} />
          {isTeacher ? '👨‍🏫 Багшийн Гишүүнчлэл' : '🎓 Сурагчийн Гишүүнчлэл'}
        </h1>
        <p className="lead text-muted">
          {isTeacher
            ? 'Контент үүсгэж, сурагчдаа заан сургаарай'
            : 'Бүх контентод хандаж, бодлого бодож, тест өгөөрөй'}
        </p>

        {/* Period Toggle */}
        <div className="d-flex justify-content-center align-items-center gap-3 mt-4">
          <Button
            variant={selectedPeriod === 'monthly' ? 'primary' : 'outline-secondary'}
            onClick={() => setSelectedPeriod('monthly')}
          >
            Сараар
          </Button>
          <Button
            variant={selectedPeriod === 'yearly' ? 'primary' : 'outline-secondary'}
            onClick={() => setSelectedPeriod('yearly')}
          >
            Жилээр
            <Badge bg="success" className="ms-2">
              -17% хямдрал
            </Badge>
          </Button>
        </div>
      </div>

      {/* Багшийн Эрхүүд */}
      {isTeacher && (
        <div className="mb-5">
          <h2 className="text-center mb-4 fw-bold">👨‍🏫 Багшийн Эрх</h2>
          <Row className="g-4">
            {tiers
              .filter((tierKey) => membershipPlans[tierKey].roleType === 'teacher')
              .map((tierKey) => {
                const plan = membershipPlans[tierKey];
                const TierIcon = plan.icon;
                const price =
                  selectedPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly / 12;
                const isCurrentTier = user?.membership_tier === tierKey;

                return (
                  <Col key={tierKey} md={6} lg={4}>
                    <Card
                      className={`h-100 ${plan.featured ? 'border-warning border-3 shadow-lg' : plan.popular ? 'border-success border-2 shadow' : 'shadow-sm'}`}
                    >
                      {plan.popular && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <Badge bg="success" className="px-3 py-2">
                            Хамгийн алдартай
                          </Badge>
                        </div>
                      )}
                      {plan.featured && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <Badge bg="warning" text="dark" className="px-3 py-2">
                            <Crown size={14} className="me-1" />
                            Онцгой санал
                          </Badge>
                        </div>
                      )}

                      <Card.Header
                        className={`bg-${plan.color} bg-opacity-10 border-0 ${plan.popular || plan.featured ? 'pt-4' : ''}`}
                      >
                        <div className="text-center">
                          <div style={{ fontSize: '3rem' }}>{plan.emoji}</div>
                          <h3 className="fw-bold mb-1">{plan.name}</h3>
                          <p className="text-muted small mb-0">{plan.tagline}</p>
                        </div>
                      </Card.Header>

                      <Card.Body className="d-flex flex-column">
                        {/* Price */}
                        <div className="text-center mb-4">
                          <div className="display-5 fw-bold">{formatPrice(price)}</div>
                          {price > 0 && (
                            <div className="text-muted small">
                              сард
                              {selectedPeriod === 'yearly' && (
                                <div className="text-success mt-1">
                                  <small>Жилд {formatPrice(plan.price.yearly)}</small>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <ListGroup variant="flush" className="flex-grow-1 mb-3">
                          {plan.features.map((feature, idx) => (
                            <ListGroup.Item key={idx} className="border-0 px-0 py-2">
                              <div className="d-flex align-items-start">
                                {feature.available ? (
                                  <CheckCircle
                                    size={18}
                                    className={`me-2 flex-shrink-0 ${feature.isNegative ? 'text-warning' : 'text-success'}`}
                                  />
                                ) : (
                                  <XCircle size={18} className="me-2 flex-shrink-0 text-muted" />
                                )}
                                <span className={feature.isNegative ? 'text-muted' : ''}>
                                  {feature.text}
                                </span>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>

                        {/* CTA Button */}
                        <Button
                          variant={
                            isCurrentTier
                              ? 'outline-secondary'
                              : plan.featured
                                ? 'warning'
                                : plan.popular
                                  ? 'success'
                                  : plan.color
                          }
                          size="lg"
                          className="w-100"
                          onClick={() => handleSelectPlan(tierKey)}
                          disabled={isCurrentTier}
                        >
                          {isCurrentTier ? (
                            <>
                              <CheckCircle size={18} className="me-2" />
                              Одоогийн төлөвлөгөө
                            </>
                          ) : tierKey === 'FREE_TEACHER' ? (
                            'Үнэгүй эхлэх'
                          ) : (
                            <>
                              <TrendingUp size={18} className="me-2" />
                              Сонгох
                            </>
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </div>
      )}

      {/* Сурагчийн Эрх */}
      {isStudent && (
        <div className="mb-5">
          <h2 className="text-center mb-4 fw-bold">🎓 Сурагчийн Эрх</h2>
          <Row className="justify-content-center g-4">
            {tiers
              .filter((tierKey) => membershipPlans[tierKey].roleType === 'student')
              .map((tierKey) => {
                const plan = membershipPlans[tierKey];
                const TierIcon = plan.icon;
                const price =
                  selectedPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly / 12;
                const isCurrentTier = user?.membership_tier === tierKey;

                return (
                  <Col key={tierKey} md={8} lg={6}>
                    <Card
                      className={`h-100 ${plan.featured ? 'border-warning border-3 shadow-lg' : plan.popular ? 'border-info border-2 shadow' : 'shadow-sm'}`}
                    >
                      {plan.popular && (
                        <div className="position-absolute top-0 start-50 translate-middle">
                          <Badge bg="info" className="px-3 py-2">
                            Хамгийн алдартай
                          </Badge>
                        </div>
                      )}

                      <Card.Header
                        className={`bg-${plan.color} bg-opacity-10 border-0 ${plan.popular || plan.featured ? 'pt-4' : ''}`}
                      >
                        <div className="text-center">
                          <div style={{ fontSize: '3rem' }}>{plan.emoji}</div>
                          <h3 className="fw-bold mb-1">{plan.name}</h3>
                          <p className="text-muted small mb-0">{plan.tagline}</p>
                        </div>
                      </Card.Header>

                      <Card.Body className="d-flex flex-column">
                        {/* Price */}
                        <div className="text-center mb-4">
                          <div className="display-5 fw-bold">{formatPrice(price)}</div>
                          {price > 0 && (
                            <div className="text-muted small">
                              сард
                              {selectedPeriod === 'yearly' && (
                                <div className="text-success mt-1">
                                  <small>Жилд {formatPrice(plan.price.yearly)}</small>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <ListGroup variant="flush" className="flex-grow-1 mb-3">
                          {plan.features.map((feature, idx) => (
                            <ListGroup.Item key={idx} className="border-0 px-0 py-2">
                              <div className="d-flex align-items-start">
                                {feature.available ? (
                                  <CheckCircle
                                    size={18}
                                    className={`me-2 flex-shrink-0 ${feature.isNegative ? 'text-warning' : 'text-success'}`}
                                  />
                                ) : (
                                  <XCircle size={18} className="me-2 flex-shrink-0 text-muted" />
                                )}
                                <span className={feature.isNegative ? 'text-muted' : ''}>
                                  {feature.text}
                                </span>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>

                        {/* CTA Button */}
                        <Button
                          variant={isCurrentTier ? 'outline-secondary' : 'info'}
                          size="lg"
                          className="w-100"
                          onClick={() => handleSelectPlan(tierKey)}
                          disabled={isCurrentTier}
                        >
                          {isCurrentTier ? (
                            <>
                              <CheckCircle size={18} className="me-2" />
                              Одоогийн төлөвлөгөө
                            </>
                          ) : (
                            <>
                              <TrendingUp size={18} className="me-2" />
                              Сонгох
                            </>
                          )}
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
          </Row>
        </div>
      )}

      {/* Comparison Table */}
      <div className="mb-5">
        <h2 className="text-center mb-4 fw-bold">
          <Shield size={28} className="me-2" />
          Дэлгэрэнгүй Харьцуулалт
        </h2>

        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '25%' }}>Боломжууд</th>
                    {tiers.map((tierKey) => (
                      <th key={tierKey} className="text-center">
                        <div>{membershipPlans[tierKey].emoji}</div>
                        <small>{membershipPlans[tierKey].name}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-semibold">
                      <Users size={16} className="me-2" />
                      Клубын тоо
                    </td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.max_clubs === '∞' ? (
                          <InfinityIcon size={20} className="text-warning" />
                        ) : (
                          membershipPlans[tierKey].limitations.max_clubs
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">
                      <Users size={16} className="me-2" />
                      Клубын гишүүдийн тоо
                    </td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.max_club_members === '∞' ? (
                          <InfinityIcon size={20} className="text-warning" />
                        ) : (
                          membershipPlans[tierKey].limitations.max_club_members
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">
                      <TrendingUp size={16} className="me-2" />
                      Boosted пост (сард)
                    </td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.boosted_posts_per_month === '∞' ? (
                          <InfinityIcon size={20} className="text-warning" />
                        ) : membershipPlans[tierKey].limitations.boosted_posts_per_month === 0 ? (
                          <XCircle size={18} className="text-muted" />
                        ) : (
                          membershipPlans[tierKey].limitations.boosted_posts_per_month
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">Зурагны тоо (пост бүрт)</td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.max_images_per_post}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">Видеоны хэмжээ</td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.max_video_size}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">
                      <Sparkles size={16} className="me-2" />
                      Контент үүсгэх
                    </td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.can_create_content ? (
                          <CheckCircle size={18} className="text-success" />
                        ) : (
                          <XCircle size={18} className="text-muted" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="fw-semibold">Зар харуулах</td>
                    {tiers.map((tierKey) => (
                      <td key={tierKey} className="text-center">
                        {membershipPlans[tierKey].limitations.show_ads ? (
                          <CheckCircle size={18} className="text-warning" />
                        ) : (
                          <XCircle size={18} className="text-success" />
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* FAQ / Additional Info */}
      <Row className="mb-4">
        <Col lg={8} className="mx-auto">
          <Alert variant="info" className="shadow-sm">
            <h5 className="alert-heading">
              <Lock size={20} className="me-2" />
              Мэдээлэл
            </h5>
            <ul className="mb-0">
              {isTeacher ? (
                <>
                  <li>
                    <strong>Багшийн эрх:</strong> Контент үүсгэх, клуб удирдах, сурагчдын ахиц харах
                  </li>
                  <li>Гишүүнчлэлгүй багш: Үнэгүй, харин контент үүсгэх боломжгүй</li>
                  <li>Энгийн багш: Бүх төрлийн контент үүсгэх, 3 клуб удирдах</li>
                  <li>PRO багш: Хязгааргүй контент, 10 клуб, олимпиадын материал нэмэх</li>
                </>
              ) : (
                <>
                  <li>
                    <strong>Сурагчийн эрх:</strong> Бүх контентод хандах, бодлого бодох, тест өгөх
                  </li>
                  <li>Хязгааргүй клубт элсэх боломжтой (харин үүсгэхгүй)</li>
                  <li>Бүх төрлийн бодлого, тестийг бодох</li>
                  <li>Ахиц, статистик харах</li>
                </>
              )}
              <li>Бүх төлөвлөгөө нь 30 хоногийн хугацаатай</li>
              <li>Жилийн төлөвлөгөө нь 2 сараар хямдруу (17% хямдрал)</li>
              <li>Та дахин төлбөр төлөхгүйгээр аль ч үед цуцлах боломжтой</li>
              <li>Зоосоор төлөх боломжтой</li>
            </ul>
          </Alert>
        </Col>
      </Row>

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
    </Container>
  );
}

export default MembershipPlansPage;
