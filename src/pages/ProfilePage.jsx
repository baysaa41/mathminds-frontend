// frontend/src/pages/ProfilePage.jsx (ШИНЭЧИЛСЭН: UserAvatar компонент ашигласан)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';

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
import { User, CheckCircle, BarChart2, Coins, UserPlus, UserMinus, Users } from 'lucide-react';
import { LinkContainer } from 'react-router-bootstrap';
import UserAvatar from '../components/UserAvatar';

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

    // Coin types configuration
    const coinTypes = [
        { value: 'gold', label: 'Алт', emoji: '🥇' },
        { value: 'silver', label: 'Мөнгө', emoji: '🥈' },
        { value: 'bronze', label: 'Хүрэл', emoji: '🥉' }
    ];

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
                setFollowersCount(prev => Math.max(0, prev - 1));
            } else {
                // Follow
                await apiService.followUser(username);
                setIsFollowing(true);
                setFollowersCount(prev => prev + 1);
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
                coinType: coinType
            }
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Тодорхойгүй';
        const date = new Date(dateString);
        return date.toLocaleDateString('mn-MN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

        return (
            <Container className="my-4" style={{ maxWidth: '900px' }}>
                <Card className="shadow-sm border-0">
                    <Card.Header className="bg-light p-4 border-0">
                        <Row className="align-items-center">
                            <Col xs="auto">
                                <UserAvatar
                                    user={profile}
                                    size={96}
                                    border={true}
                                />
                            </Col>
                            <Col>
                                <h2 className="h4 fw-bold mb-0">
                                    {profile.first_name} {profile.last_name}
                                </h2 >
                                <p className="text-muted mb-1">@{profile.username}</p>
                                {profile.role_display && (
                                    <span className="badge bg-primary bg-opacity-75">
                                        <User size={12} className="me-1" /> {profile.role_display}
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
                                                variant={isFollowing ? "outline-secondary" : "primary"}
                                                size="sm"
                                                onClick={handleFollowToggle}
                                                disabled={followLoading}
                                            >
                                                {followLoading ? (
                                                    <Spinner as="span" animation="border" size="sm" />
                                                ) : isFollowing ? (
                                                    <>
                                                        <UserMinus size={16} className="me-1" />
                                                        Дагахаа болих
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={16} className="me-1" />
                                                        Дагах
                                                    </>
                                                )}
                                            </Button>
                                            <DropdownButton
                                                variant="outline-primary"
                                                size="sm"
                                                title={
                                                    <>
                                                        <Coins size={16} className="me-1" />
                                                        Coin илгээх
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
                                        <>
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
                                                        onClick={() => navigate('/coins/transfer', { state: { coinType: coin.value } })}
                                                    >
                                                        <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}
                                                    </Dropdown.Item>
                                                ))}
                                            </DropdownButton>
                                            <LinkContainer to="/profile/edit">
                                                <Button variant="outline-secondary" size="sm">
                                                    Профайл засах
                                                </Button>
                                            </LinkContainer>
                                        </>
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

                            {/* Баруун тал: Coin балансууд */}
                            <Col md={6} className="mt-4 mt-md-0">
                                <h5 className="fw-semibold mb-3">Хэтэвчин дэх зоос 💰</h5>
                                <ListGroup variant="flush">
                                    {coinTypes.map((coin) => (
                                        <ListGroup.Item key={coin.value} className="d-flex justify-content-between px-0">
                                            <span className="text-muted">
                                                <span style={{ fontSize: '18px' }}>{coin.emoji}</span> {coin.label}:
                                            </span>
                                            <strong>{(profile[`${coin.value}_coins`] || 0).toLocaleString()}</strong>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Col>
                        </Row>

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
            </Container>
        );
    }

    return null;
}

export default ProfilePage;