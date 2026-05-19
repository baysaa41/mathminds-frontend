// frontend/src/pages/FollowingPage.jsx (ШИНЭЧИЛСЭН: UserAvatar, UserName, Unfollow функц, Infinite Scroll)

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Custom Hooks
import usePaginatedFetch from '../hooks/usePagenatedFetch';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import { User, CheckCircle, UserPlus } from 'lucide-react';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import UserAvatar from '../components/UserAvatar';
import UserName from '../components/UserName';

function FollowingPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mainScrollRef } = useOutletContext();

  const [processingIds, setProcessingIds] = useState(new Set());
  const [unfollowedIds, setUnfollowedIds] = useState(new Set());

  // Pagination hook ашиглах
  const {
    data: following,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
  } = usePaginatedFetch(`/users/api/${username}/following/`);

  // Infinite scroll hook
  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainScrollRef);

  // Анхны ачаалалт
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleUserClick = (followingUsername) => {
    navigate(`/profile/${followingUsername}`);
  };

  const handleToggleFollow = async (targetUsername, userId, e) => {
    e.stopPropagation(); // Prevent navigation to profile
    if (processingIds.has(userId)) return;

    const isCurrentlyUnfollowed = unfollowedIds.has(userId);

    try {
      setProcessingIds((prev) => new Set(prev).add(userId));

      if (isCurrentlyUnfollowed) {
        // Re-follow
        await apiClient.post(`/users/api/${targetUsername}/follow/`);
        setUnfollowedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        // Unfollow
        await apiClient.post(`/users/api/${targetUsername}/unfollow/`);
        setUnfollowedIds((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Дагах/Дагахаа болих алдаа:', err);
      alert(isCurrentlyUnfollowed ? 'Дагахад алдаа гарлаа.' : 'Дагахаа болоход алдаа гарлаа.');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Check if viewing own following list
  const isOwnProfile = user && user.username === username;

  if (loading) {
    return (
      <Container className="my-4">
        <div className="d-flex justify-content-center">
          <Spinner animation="border" />
        </div>
      </Container>
    );
  }

  const breadcrumb = (
    <AppBreadcrumb className="mb-3" items={[
      { label: `@${username}`, to: `/profile/${username}` },
      { label: 'Дагаж байгаа' },
    ]} />
  );

  if (error && following.length === 0) {
    return (
      <Container className="my-4">
        {breadcrumb}
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" size="sm" onClick={refresh}>Дахин оролдох</Button>
      </Container>
    );
  }

  return (
    <Container className="my-4" style={{ maxWidth: '600px' }}>
      {breadcrumb}
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light p-3 border-0">
          <div>
            <h4 className="mb-0">@{username} дагаж буй</h4>
            <small className="text-muted">{following.length} хүн</small>
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
              {following.map((followedUser) => (
                <ListGroup.Item key={followedUser.id} className="py-3 px-4">
                  <div className="d-flex align-items-start justify-content-between">
                    <div
                      className="d-flex align-items-start flex-grow-1 me-3"
                      onClick={() => handleUserClick(followedUser.username)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Link to={`/profile/${followedUser.username}`} className="me-3 flex-shrink-0">
                        <UserAvatar user={followedUser} size={48} />
                      </Link>
                      <div className="flex-grow-1">
                        <div className="mb-1">
                          <UserName
                            user={followedUser}
                            showLink={true}
                            className="fw-semibold text-dark"
                            showMembershipBadge={true}
                          />
                        </div>
                        <Link
                          to={`/profile/${followedUser.username}`}
                          className="text-decoration-none text-muted small"
                        >
                          @{followedUser.username}
                        </Link>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant={
                          unfollowedIds.has(followedUser.id) ? 'primary' : 'outline-secondary'
                        }
                        onClick={(e) => handleToggleFollow(followedUser.username, followedUser.id, e)}
                        disabled={processingIds.has(followedUser.id)}
                        style={{ minWidth: '110px' }}
                        className="flex-shrink-0"
                      >
                        {processingIds.has(followedUser.id) ? (
                          <Spinner animation="border" size="sm" />
                        ) : unfollowedIds.has(followedUser.id) ? (
                          <>
                            <UserPlus size={14} />
                            &nbsp;Дагах
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            &nbsp;Дагахаа болих
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
              <span className="ms-2">Ачааллаж байна...</span>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div
            ref={triggerRef}
            style={{
              height: '1px',
              visibility: 'hidden',
            }}
          />
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FollowingPage;
