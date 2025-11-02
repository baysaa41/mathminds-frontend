// frontend/src/pages/FollowingPage.jsx (ШИНЭЧИЛСЭН: UserAvatar компонент ашигласан)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { ArrowLeft, User } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

function FollowingPage() {
    const { username } = useParams();
    const navigate = useNavigate();

    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFollowing = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getUserFollowing(username);
                // API pagination хэлбэртэй буцаасан бол
                if (data && data.results && Array.isArray(data.results)) {
                    setFollowing(data.results);
                } else if (Array.isArray(data)) {
                    setFollowing(data);
                } else {
                    console.error('Unexpected API response format:', data);
                    setFollowing([]);
                }
            } catch (err) {
                setError(err.message || 'Дагаж буй хүмүүсийн жагсаалт татахад алдаа гарлаа.');
            } finally {
                setLoading(false);
            }
        };

        fetchFollowing();
    }, [username]);

    const handleUserClick = (followingUsername) => {
        navigate(`/profile/${followingUsername}`);
    };

    const handleBack = () => {
        navigate(`/profile/${username}`);
    };

    if (loading) {
        return (
            <Container className="my-4">
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" />
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={handleBack}>
                    <ArrowLeft size={16} className="me-2" />
                    Буцах
                </Button>
            </Container>
        );
    }

    return (
        <Container className="my-4" style={{ maxWidth: '600px' }}>
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-light p-3 border-0">
                    <div className="d-flex align-items-center">
                        <Button
                            variant="link"
                            onClick={handleBack}
                            className="text-decoration-none p-0 me-3"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h4 className="mb-0">@{username} дагаж буй</h4>
                            <small className="text-muted">{following.length} хүн</small>
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="p-0">
                    {following.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <User size={48} className="mb-3 opacity-50" />
                            <p>Одоогоор хэнийг ч дагаагүй байна.</p>
                        </div>
                    ) : (
                        <ListGroup variant="flush">
                            {following.map((user) => (
                                <ListGroup.Item
                                    key={user.id}
                                    action
                                    onClick={() => handleUserClick(user.username)}
                                    className="d-flex align-items-center py-3"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <UserAvatar user={user} size={48} className="me-3" />
                                    <div>
                                        <div className="fw-semibold">
                                            {user.first_name} {user.last_name}
                                        </div>
                                        <small className="text-muted">@{user.username}</small>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}

export default FollowingPage;