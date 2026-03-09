// frontend/src/pages/ProfilePage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import apiClient from '../api/axiosConfig.js';
import { SITE_ROLE_CONFIG } from '../constants/membership';
import { formatDate as formatDateUtil } from '../utils/dateFormatter';
import { API_ENDPOINTS } from '../constants/api.js';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Badge from 'react-bootstrap/Badge';
import Nav from 'react-bootstrap/Nav';
import {
  User,
  Coins,
  UserPlus,
  UserMinus,
  Users,
  Award,
  FileText,
  Heart,
  MessageSquare,
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import PrivatePostModal from '../components/PrivatePostModal';
import PostCard from '../components/PostCard';
import { MessageCircle } from 'lucide-react';
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';

// ─── Пост жагсаалт компонент ──────────────────────────────────────────────────
const PostList = ({ endpoint, params, emptyText }) => {
  const { data: posts, loading, loadingMore, error, hasMore, fetchData, loadMore, setData } =
    usePaginatedFetch(endpoint);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    fetchData(params);
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleted = useCallback(
    (id) => setData((prev) => prev.filter((p) => p.id !== id)),
    [setData]
  );

  if (loading && posts.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return <Alert variant="danger" className="mt-3">{error}</Alert>;
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <FileText size={36} className="mb-2 opacity-25" />
        <p className="mb-0 small">{emptyText}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onPostDeleted={handleDeleted} />
      ))}
      {loadingMore && (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </div>
      )}
      <div ref={triggerRef} />
    </div>
  );
};

// ─── Үндсэн ProfilePage ───────────────────────────────────────────────────────
function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [olympiadData, setOlympiadData] = useState(null);
  const [olympiadLoading, setOlympiadLoading] = useState(false);

  const [showPrivatePostModal, setShowPrivatePostModal] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  const coinTypes = [
    { value: 'gold', label: 'Алт', emoji: '🥇' },
    { value: 'silver', label: 'Мөнгө', emoji: '🥈' },
    { value: 'copper', label: 'Зэс', emoji: '🥉' },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'Тодорхойгүй';
    return formatDateUtil(dateString);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getUserProfile(username);
        setProfile(data);
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

  useEffect(() => {
    if (!username) return;
    setOlympiadLoading(true);
    apiClient
      .get(`/users/api/profile/${username}/olympiad-achievements/`)
      .then((response) => {
        if (response.data?.has_mmo_id) setOlympiadData(response.data);
      })
      .catch(() => {})
      .finally(() => setOlympiadLoading(false));
  }, [username]);

  const handleFollowToggle = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiService.unfollowUser(username);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await apiService.followUser(username);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCoinTransfer = (coinType) => {
    navigate('/coins/transfer', { state: { recipientUsername: profile.username, coinType } });
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

  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.id === profile.id;
  const canEdit = isOwnProfile || currentUser?.is_staff;

  return (
    <>
      <Container className="my-4" style={{ maxWidth: '900px' }}>
        {/* ── Профайл карт ── */}
        <Card className="shadow-sm border-0 mb-4">
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

                {profile.site_role && SITE_ROLE_CONFIG[profile.site_role] && (
                  <span className="badge bg-primary bg-opacity-75 me-2">
                    <User size={12} className="me-1" />
                    {SITE_ROLE_CONFIG[profile.site_role].label}
                  </span>
                )}

                <div className="mt-2">
                  <Badge
                    bg="light" text="dark" className="me-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${username}/followers`)}
                  >
                    <Users size={14} className="me-1" />
                    {followersCount} дагагч
                  </Badge>
                  <Badge
                    bg="light" text="dark"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${username}/following`)}
                  >
                    <Users size={14} className="me-1" />
                    {followingCount} дагаж байгаа
                  </Badge>
                </div>
              </Col>

              <Col xs="auto">
                <Stack direction="horizontal" gap={2}>
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
                          <><UserMinus size={16} /> Дагахаа болих</>
                        ) : (
                          <><UserPlus size={16} /> Дагах</>
                        )}
                      </Button>
                      <Button
                        variant="outline-success" size="sm"
                        onClick={() => setShowPrivatePostModal(true)}
                      >
                        <MessageCircle size={16} /> Мессеж
                      </Button>
                      <DropdownButton
                        variant="outline-primary" size="sm"
                        title={<><Coins size={16} className="me-1" />Зоос илгээх</>}
                      >
                        {coinTypes.map((coin) => (
                          <Dropdown.Item key={coin.value} onClick={() => handleCoinTransfer(coin.value)}>
                            <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                    </>
                  )}

                  {isOwnProfile && (
                    <DropdownButton
                      variant="outline-primary" size="sm"
                      title={<><Coins size={16} className="me-1" />Зоос илгээх</>}
                    >
                      {coinTypes.map((coin) => (
                        <Dropdown.Item
                          key={coin.value}
                          onClick={() => navigate('/coins/transfer', { state: { coinType: coin.value } })}
                        >
                          <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}
                        </Dropdown.Item>
                      ))}
                    </DropdownButton>
                  )}

                  {canEdit && (
                    <Button
                      variant="outline-secondary" size="sm"
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

          {/* Үндсэн мэдээлэл */}
          <Card.Body className="px-4 py-3">
            <Row className="g-3">
              <Col xs="auto">
                <span className="text-muted small">И-мэйл:</span>{' '}
                <span className="small fw-semibold">{profile.email || 'Нууцлал'}</span>
              </Col>
              <Col xs="auto">
                <span className="text-muted small">Бүртгүүлсэн:</span>{' '}
                <span className="small fw-semibold">{formatDate(profile.date_joined)}</span>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* ── Олимпиадын амжилт ── */}
        {!olympiadLoading && olympiadData?.has_mmo_id && olympiadData.achievements?.length > 0 && (
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-warning bg-opacity-10 border-0 p-3">
              <div className="d-flex align-items-center">
                <Award size={20} className="text-warning me-2" />
                <h6 className="mb-0 fw-bold">Олимпиадын амжилтууд 🏆</h6>
              </div>
            </Card.Header>
            <Card.Body className="p-3">
              <Row className="g-2 mb-3">
                {[
                  { label: 'Нийт оролцсон', value: olympiadData.statistics.total_count || 0, color: 'primary' },
                  { label: '1-р даваа', value: olympiadData.statistics.first_round_count || 0, color: 'success' },
                  { label: 'Шагнал авсан', value: olympiadData.statistics.prize_count || 0, color: 'danger' },
                ].map((s) => (
                  <Col key={s.label} xs={4}>
                    <div className="text-center p-2 bg-light rounded">
                      <div className={`fw-bold text-${s.color}`} style={{ fontSize: '1.5rem' }}>{s.value}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {olympiadData.achievements.map((a, i) => (
                  <div key={i} className="py-2 border-bottom small">
                    <div className="fw-semibold">
                      {a.olympiad_name || 'Олимпиад'}
                      {a.prize && <Badge bg="warning" text="dark" className="ms-2">🏆 {a.prize}</Badge>}
                    </div>
                    <div className="text-muted">
                      📅 {a.school_year} · 🎯 {a.round}-р даваа · 📝 {a.problems_solved || 0} бодлого · ⭐ {a.total_score || 0} оноо
                    </div>
                    {a.school_name && <div className="text-muted">🏫 {a.school_name}</div>}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* ── Постын табууд ── */}
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white border-bottom p-0">
            <Nav
              variant="tabs"
              className="border-0"
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
            >
              <Nav.Item>
                <Nav.Link eventKey="posts" className="px-4 py-3 d-flex align-items-center gap-2">
                  <FileText size={15} />
                  Постууд
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="replies" className="px-4 py-3 d-flex align-items-center gap-2">
                  <MessageSquare size={15} />
                  Хариултууд
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="favorites" className="px-4 py-3 d-flex align-items-center gap-2">
                  <Heart size={15} />
                  Таалагдсан
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body className="p-0">
            {activeTab === 'posts' && (
              <PostList
                endpoint={API_ENDPOINTS.MINDS.POSTS}
                params={{ author_username: username, content_type__in: 'post,article,problem,formula,quiz,repost' }}
                emptyText="Пост байхгүй байна."
              />
            )}
            {activeTab === 'replies' && (
              <PostList
                endpoint={API_ENDPOINTS.MINDS.POSTS}
                params={{ author_username: username, content_type: 'reply' }}
                emptyText="Хариулт байхгүй байна."
              />
            )}
            {activeTab === 'favorites' && (
              <PostList
                endpoint={API_ENDPOINTS.MINDS.POSTS}
                params={{ favored_by_username: username }}
                emptyText="Таалагдсан пост байхгүй байна."
              />
            )}
          </Card.Body>
        </Card>
      </Container>

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

export default ProfilePage;
