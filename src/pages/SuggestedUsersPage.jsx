// src/pages/SuggestedUsersPage.jsx
// Санал болгох хэрэглэгчдийн бүрэн жагсаалт

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { UserPlus, Users, CheckCircle } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import UserAvatar from '../components/UserAvatar';
import UserName from '../components/UserName';

const SuggestedUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/users/api/suggested/');
      setUsers(response.data || []);
    } catch (err) {
      console.error('Санал болгох хэрэглэгчид татахад алдаа:', err);
      setError('Хэрэглэгчдийн жагсаалт татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (username, userId) => {
    if (processingIds.has(userId)) return;

    const isCurrentlyFollowing = followingIds.has(userId);

    try {
      setProcessingIds((prev) => new Set(prev).add(userId));

      if (isCurrentlyFollowing) {
        // Unfollow
        await apiClient.post(`/users/api/${username}/unfollow/`);
        setFollowingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        // Follow
        await apiClient.post(`/users/api/${username}/follow/`);
        setFollowingIds((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Дагах/Дагахаа больсон алдаа:', err);
      alert(isCurrentlyFollowing ? 'Дагахаа больсон алдаа гарлаа.' : 'Дагахад алдаа гарлаа.');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container className="my-4">
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      </Container>
    );
  }

  const breadcrumb = (
    <AppBreadcrumb className="mb-3" items={[{ label: 'Санал болгох хэрэглэгчид' }]} />
  );

  if (error) {
    return (
      <Container className="my-4" style={{ maxWidth: '600px' }}>
        {breadcrumb}
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4" style={{ maxWidth: '600px' }}>
      {breadcrumb}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-bottom p-3">
          <div>
            <h4 className="mb-0 fw-bold">
              <Users size={24} className="me-2" />
                Санал болгох хэрэглэгчид
              </h4>
              <small className="text-muted">{users.length} хэрэглэгч</small>
            </div>
        </Card.Header>
        <Card.Body className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Users size={48} className="mb-3 opacity-50" />
              <p>Одоогоор санал болгох хэрэглэгч байхгүй байна.</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {users.map((user) => (
                <ListGroup.Item key={user.id} className="py-3 px-4">
                  <div className="d-flex align-items-start justify-content-between">
                    <div className="d-flex align-items-start flex-grow-1 me-3">
                      <Link to={`/profile/${user.username}`} className="me-3 flex-shrink-0">
                        <UserAvatar user={user} size={48} />
                      </Link>
                      <div className="flex-grow-1">
                        <div className="mb-1">
                          <UserName
                            user={user}
                            showLink={true}
                            className="fw-semibold text-dark"
                            showMembershipBadge={true}
                          />
                        </div>
                        <Link
                          to={`/profile/${user.username}`}
                          className="text-decoration-none text-muted small"
                        >
                          @{user.username}
                        </Link>
                        {user.bio && (
                          <p className="text-muted small mb-0 mt-2" style={{ lineHeight: '1.4' }}>
                            {user.bio.length > 100 ? user.bio.substring(0, 100) + '...' : user.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={followingIds.has(user.id) ? 'outline-secondary' : 'primary'}
                      onClick={(e) => {
                        e.preventDefault();
                        handleFollow(user.username, user.id);
                      }}
                      disabled={processingIds.has(user.id)}
                      style={{ minWidth: '110px' }}
                      className="flex-shrink-0"
                    >
                      {processingIds.has(user.id) ? (
                        <Spinner animation="border" size="sm" />
                      ) : followingIds.has(user.id) ? (
                        <>
                          <CheckCircle size={14} />
                          &nbsp;Дагахаа болих
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          &nbsp;Дагах
                        </>
                      )}
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SuggestedUsersPage;
