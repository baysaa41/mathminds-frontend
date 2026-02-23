// frontend/src/pages/ProfilePage.jsx (ШИНЭЧИЛСЭН: UserAvatar компонент ашигласан)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import { SITE_ROLE_CONFIG } from '../constants/membership';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Stack from 'react-bootstrap/Stack';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Badge from 'react-bootstrap/Badge';
import {
  User,
  CheckCircle,
  BarChart2,
  Coins,
  UserPlus,
  UserMinus,
  Users,
  Crown,
  Star,
  Zap,
  Award,
} from 'lucide-react';
import { LinkContainer } from 'react-router-bootstrap';
import UserAvatar from '../components/UserAvatar';
import MembershipSummary from '../components/MembershipSummary';
import PrivatePostModal from '../components/PrivatePostModal';
import { MessageCircle } from 'lucide-react';

function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Follow статус
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Олимпиадын амжилт
  const [olympiadData, setOlympiadData] = useState(null);
  const [olympiadLoading, setOlympiadLoading] = useState(false);

  // Хувийн пост modal
  const [showPrivatePostModal, setShowPrivatePostModal] = useState(false);

  // Coin types configuration
  const coinTypes = [
    { value: 'gold', label: 'Алт', emoji: '🥇' },
    { value: 'silver', label: 'Мөнгө', emoji: '🥈' },
    { value: 'copper', label: 'Зэс', emoji: '🥉' },
  ];

  // Membership tier configuration
  const membershipTiers = {
    FREE: {
      name: 'Үнэгүй',
      icon: User,
      color: 'secondary',
      features: ['Үндсэн контентод хандах', 'Энгийн бодлого бодох'],
    },
    MEMBER: {
      name: 'Гишүүн',
      icon: Star,
      color: 'success',
      features: [
        'Үндсэн бүх агуулгад хандах',
        'Бодлого шийдэх боломж',
        'Клубт элсэх эрх',
        'Имэйл дэмжлэг',
      ],
    },
    PRO: {
      name: 'Мэргэжлийн',
      icon: Zap,
      color: 'info',
      features: [
        'Гишүүн түвшний бүх боломж',
        'Онцгой бодлогуудад хандах',
        'Багшийн зөвлөгөө авах',
        'Ахисан түвшний тестүүд',
        'Эрэмбэлэлтэд оролцох',
      ],
    },
    PREMIUM: {
      name: 'Онцгой',
      icon: Award,
      color: 'danger',
      features: [
        'Мэргэжлийн түвшний бүх боломж',
        'Олимпиадын бодлого, материал',
        'Биечлэн зөвлөгөө авах',
        'Тусгай вебинар, хичээл',
        'Урамшуулалтай зоос',
      ],
    },
    VIP: {
      name: 'VIP',
      icon: Crown,
      color: 'warning',
      features: [
        'Онцгой түвшний бүх боломж',
        'Хувийн багшийн туслалцаа',
        'Ахисан бодлого, материалууд',
        'Олон улсын олимпиадын бэлтгэл',
        'Тусгай урамшуулал, шагнал',
        'VIP badge, profile тэмдэг',
      ],
    },
  };

  // Профайл мэдээлэл татах
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getUserProfile(username);
        setProfile(data);

        // Follow статус татах
        setIsFollowing(data.is_following || false);
        setFollowersCount(data.followers_count || 0);
        setFollowingCount(data.following_count || 0);
      } catch (err) {
        setError(err.message || 'Профайл олдсонгүй.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Олимпиадын амжилт татах
  useEffect(() => {
    const fetchOlympiadAchievements = async () => {
      if (!username) return;

      setOlympiadLoading(true);
      try {
        const response = await apiService.get(`/users/api/profile/${username}/olympiad-achievements/`);
        if (response.data && response.data.has_mmo_id) {
          setOlympiadData(response.data);
        }
      } catch (err) {
        console.error('Олимпиадын мэдээлэл татахад алдаа:', err);
      } finally {
        setOlympiadLoading(false);
      }
    };

    fetchOlympiadAchievements();
  }, [username]);

  // Follow/Unfollow товчлуур дарах
  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await apiService.unfollowUser(username);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        // Follow
        await apiService.followUser(username);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Follow/Unfollow алдаа:', err);
      alert(err.message || 'Алдаа гарлаа.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCoinTransfer = (coinType) => {
    navigate('/coins/transfer', {
      state: {
        recipientUsername: profile.username,
        coinType: coinType,
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Тодорхойгүй';
    return formatDateUtil(dateString);
  };

  const navigateToFollowers = () => {
    navigate(`/profile/${username}/followers`);
  };

  const navigateToFollowing = () => {
    navigate(`/profile/${username}/following`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (profile) {
    const isOwnProfile = currentUser && currentUser.id === profile.id;
    const canEdit = isOwnProfile || currentUser?.is_staff;
    const canViewCoins = isOwnProfile || currentUser?.is_staff;

    return (
      <>
        <Container className="my-4" style={{ maxWidth: '900px' }}>
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-light p-4 border-0">
            <Row className="align-items-center">
              <Col xs="auto">
                <UserAvatar user={profile} size={96} border={true} />
              </Col>
              <Col>
                <h2 className="h4 fw-bold mb-0">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-muted mb-1">@{profile.username}</p>

                {/* Үүрэг (site_role) */}
                {profile.site_role && SITE_ROLE_CONFIG[profile.site_role] && (
                  <span className="badge bg-primary bg-opacity-75 me-2">
                    <User size={12} className="me-1" />
                    {SITE_ROLE_CONFIG[profile.site_role].label}
                  </span>
                )}

                {/* Follow статус badge-ууд */}
                <div className="mt-2">
                  <Badge
                    bg="light"
                    text="dark"
                    className="me-2"
                    style={{ cursor: 'pointer' }}
                    onClick={navigateToFollowers}
                  >
                    <Users size={14} className="me-1" />
                    {followersCount} дагагч
                  </Badge>
                  <Badge
                    bg="light"
                    text="dark"
                    style={{ cursor: 'pointer' }}
                    onClick={navigateToFollowing}
                  >
                    <Users size={14} className="me-1" />
                    {followingCount} дагаж байгаа
                  </Badge>
                </div>
              </Col>

              {/* Товчлуурууд */}
              <Col xs="auto">
                <Stack direction="horizontal" gap={2}>
                  {/* Өөрийнх биш бол: Дагах/Coin илгээх товч */}
                  {!isOwnProfile && (
                    <>
                      <Button
                        variant={isFollowing ? 'outline-secondary' : 'primary'}
                        size="sm"
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <Spinner as="span" animation="border" size="sm" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus size={16} />
                            &nbsp;Дагахаа болих
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            &nbsp;Дагах
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => setShowPrivatePostModal(true)}
                      >
                        <MessageCircle size={16} />
                        &nbsp;Мессеж
                      </Button>
                      <DropdownButton
                        variant="outline-primary"
                        size="sm"
                        title={
                          <>
                            <Coins size={16} className="me-1" />
                            Зоос илгээх
                          </>
                        }
                      >
                        {coinTypes.map((coin) => (
                          <Dropdown.Item
                            key={coin.value}
                            onClick={() => handleCoinTransfer(coin.value)}
                          >
                            <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                    </>
                  )}

                  {/* Өөрийнх бол: Coin илгээх + Засах товч */}
                  {isOwnProfile && (
                    <DropdownButton
                      variant="primary"
                      size="sm"
                      title={
                        <>
                          <Coins size={16} className="me-1" />
                          Зоос илгээх
                        </>
                      }
                    >
                      {coinTypes.map((coin) => (
                        <Dropdown.Item
                          key={coin.value}
                          onClick={() =>
                            navigate('/coins/transfer', { state: { coinType: coin.value } })
                          }
                        >
                          <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}
                        </Dropdown.Item>
                      ))}
                    </DropdownButton>
                  )}

                  {/* Засах товч: өөрийнх эсвэл staff */}
                  {canEdit && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() =>
                        isOwnProfile
                          ? navigate('/profile/edit')
                          : navigate(`/profile/edit?username=${profile.username}`)
                      }
                    >
                      Профайл засах
                    </Button>
                  )}
                </Stack>
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-4">
            <Row>
              {/* Зүүн тал: Үндсэн мэдээлэл */}
              <Col md={6}>
                <h5 className="fw-semibold mb-3">Үндсэн мэдээлэл</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span className="text-muted">И-мэйл:</span>
                    <b>{profile.email || 'Нууцлал'}</b>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span className="text-muted">Бүртгүүлсэн:</span>
                    <b>{formatDate(profile.date_joined)}</b>
                  </ListGroup.Item>
                </ListGroup>
              </Col>

              {/* Баруун тал: Coin балансууд - зөвхөн өөрөө эсвэл staff харна */}
              {canViewCoins && (
                <Col md={6} className="mt-4 mt-md-0">
                  <h5 className="fw-semibold mb-3">Хэтэвчин дэх зоос 💰</h5>
                  <ListGroup variant="flush">
                    {coinTypes.map((coin) => (
                      <ListGroup.Item
                        key={coin.value}
                        className="d-flex justify-content-between px-0"
                      >
                        <span className="text-muted">
                          <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}:
                        </span>
                        <strong>{(profile[`${coin.value}_coins`] || 0).toLocaleString()}</strong>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Col>
              )}
            </Row>

            {/* Гишүүнчлэлийн мэдээлэл */}
            {profile.membership_tier && profile.membership_tier !== 'FREE' && (
              <Row className="mt-4">
                <Col md={12}>
                  {(() => {
                    const tierConfig = membershipTiers[profile.membership_tier];
                    const TierIcon = tierConfig?.icon || Star;
                    const isExpired =
                      profile.expiration && new Date(profile.expiration) < new Date();

                    return (
                      <Card className={`border-2 border-${tierConfig?.color || 'secondary'}`}>
                        <Card.Header
                          className={`bg-${tierConfig?.color || 'secondary'} bg-opacity-10 border-0`}
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <h5 className="mb-0 fw-bold">
                              <TierIcon
                                size={20}
                                className={`text-${tierConfig?.color || 'secondary'} me-2`}
                              />
                              {tierConfig?.name || profile.membership_tier} гишүүнчлэл
                            </h5>
                            <Badge bg={tierConfig?.color || 'secondary'} className="px-3 py-2">
                              {tierConfig?.name || profile.membership_tier}
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <h6 className="fw-semibold mb-3">Боломжууд:</h6>
                              <ul className="list-unstyled">
                                {tierConfig?.features.map((feature, index) => (
                                  <li key={index} className="mb-2">
                                    <CheckCircle
                                      size={16}
                                      className={`text-${tierConfig?.color || 'secondary'} me-2`}
                                    />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </Col>
                            <Col md={6}>
                              <h6 className="fw-semibold mb-3">Эрхийн мэдээлэл:</h6>
                              {profile.expiration && (
                                <div className="mb-3">
                                  <div className="d-flex align-items-center mb-2">
                                    <i className="bi bi-calendar-check me-2"></i>
                                    <span className="text-muted">Дуусах огноо:</span>
                                  </div>
                                  <div
                                    className={`fs-5 fw-bold ${isExpired ? 'text-danger' : 'text-success'}`}
                                  >
                                    {formatDate(profile.expiration)}
                                  </div>
                                  {isExpired ? (
                                    <small className="text-danger">
                                      ⚠️ Гишүүнчлэлийн эрх дууссан байна
                                    </small>
                                  ) : (
                                    <small className="text-success">✓ Идэвхтэй байна</small>
                                  )}
                                </div>
                              )}
                              {isOwnProfile && (
                                <div className="mt-3">
                                  <LinkContainer to="/products">
                                    <Button variant={tierConfig?.color || 'secondary'} size="sm">
                                      Гишүүнчлэл сунгах
                                    </Button>
                                  </LinkContainer>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    );
                  })()}
                </Col>
              </Row>
            )}

            {/* Доод хэсэг: Үзүүлэлтүүд */}
            <Row className="mt-4">
              <Col md={12}>
                <h5 className="fw-semibold mb-3">Үзүүлэлт</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span className="text-muted">
                      <CheckCircle size={16} className="text-success me-1" /> Бодсон:
                    </span>
                    <b>{profile.number_solved || 0}</b>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between px-0">
                    <span className="text-muted">
                      <BarChart2 size={16} className="text-info me-1" /> Амжилт:
                    </span>
                    <b>{(profile.success_rate || 0).toFixed(1)}%</b>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Олимпиадын амжилтууд */}
        {olympiadLoading ? (
          <Card className="shadow-sm border-0 mt-4">
            <Card.Body className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Олимпиадын мэдээлэл уншиж байна...</p>
            </Card.Body>
          </Card>
        ) : olympiadData && olympiadData.has_mmo_id && olympiadData.achievements && olympiadData.achievements.length > 0 ? (
          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="bg-warning bg-opacity-10 border-0 p-4">
              <div className="d-flex align-items-center">
                <Award size={24} className="text-warning me-2" />
                <h5 className="mb-0 fw-bold">Олимпиадын амжилтууд 🏆</h5>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {/* Статистик */}
              <Row className="mb-4">
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fw-bold text-primary" style={{ fontSize: '2rem' }}>
                      {olympiadData.statistics.total_count || 0}
                    </div>
                    <div className="text-muted small">Нийт оролцсон</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fw-bold text-success" style={{ fontSize: '2rem' }}>
                      {olympiadData.statistics.first_round_count || 0}
                    </div>
                    <div className="text-muted small">1-р даваа</div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="fw-bold text-danger" style={{ fontSize: '2rem' }}>
                      {olympiadData.statistics.prize_count || 0}
                    </div>
                    <div className="text-muted small">Шагнал авсан</div>
                  </div>
                </Col>
              </Row>

              {/* Олимпиадын жагсаалт */}
              <h6 className="fw-semibold mb-3">Оролцсон олимпиадууд:</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {olympiadData.achievements.map((achievement, index) => (
                    <ListGroup.Item key={index} className="px-0 py-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="fw-bold mb-1">
                            {achievement.olympiad_name || 'Олимпиад'}
                            {achievement.prize && (
                              <Badge bg="warning" text="dark" className="ms-2">
                                🏆 {achievement.prize}
                              </Badge>
                            )}
                          </div>
                          <div className="small text-muted">
                            <span className="me-3">
                              📅 {achievement.school_year || 'Тодорхойгүй'}
                            </span>
                            <span className="me-3">
                              🎯 {achievement.round}-р даваа
                            </span>
                            <span className="me-3">
                              📝 {achievement.problems_solved || 0} бодлого
                            </span>
                            <span>
                              ⭐ {achievement.total_score || 0} оноо
                            </span>
                          </div>
                          {achievement.school_name && (
                            <div className="small text-muted mt-1">
                              🏫 {achievement.school_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Card.Body>
          </Card>
        ) : null}

        {/* Гишүүнчлэлийн Дэлгэрэнгүй Мэдээлэл */}
        {isOwnProfile && <MembershipSummary isOwnProfile={isOwnProfile} />}
        </Container>

        {/* Хувийн пост илгээх Modal */}
        <PrivatePostModal
          show={showPrivatePostModal}
          onHide={() => setShowPrivatePostModal(false)}
          recipientUsername={profile.username}
          onSuccess={(conversationUuid) => {
            const dest = profile.is_ai_teacher ? '/ai-chat' : '/messages';
            navigate(dest, { state: { conversationUuid } });
          }}
        />
      </>
    );
  }

  return null;
}

export default ProfilePage;
