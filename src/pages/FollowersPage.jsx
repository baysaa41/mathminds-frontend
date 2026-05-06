// frontend/src/pages/FollowersPage.jsx (ШИНЭЧИЛСЭН: UserAvatar, UserName, Follow/Unfollow функц, Infinite Scroll)

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

function FollowersPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mainScrollRef } = useOutletContext();

  const [processingIds, setProcessingIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());

  // Pagination hook ашиглах
  const {
    data: followers,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
  } = usePaginatedFetch(`/users/api/${username}/followers/`);

  // Infinite scroll hook
  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainScrollRef);

  // Анхны ачаалалт
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleUserClick = (followerUsername) => {
    navigate(`/profile/${followerUsername}`);
  };

  const handleBack = () => {
    navigate(`/profile/${username}`);
  };

  const handleToggleFollow = async (targetUsername, userId, e) => {
    e.stopPropagation(); // Prevent navigation to profile
    if (processingIds.has(userId)) return;

    const isCurrentlyFollowing = followingIds.has(userId);

    try {
      setProcessingIds((prev) => new Set(prev).add(userId));

      if (isCurrentlyFollowing) {
        // Unfollow
        await apiClient.post(`/users/api/${targetUsername}/unfollow/`);
        setFollowingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        // Follow
        await apiClient.post(`/users/api/${targetUsername}/follow/`);
        setFollowingIds((prev) => new Set(prev).add(userId));
      }
    } catch (err) {
      console.error('Дагах/Дагахаа болих алдаа:', err);
      alert(isCurrentlyFollowing ? 'Дагахаа болоход алдаа гарлаа.' : 'Дагахад алдаа гарлаа.');
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Check if viewing own followers list
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
      { label: 'Дагагчид' },
    ]} />
  );

  if (error && followers.length === 0) {
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
            <h4 className="mb-0">@{username}-ийн дагагчид</h4>
            <small className="text-muted">{followers.length} хүн</small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {followers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <User size={48} className="mb-3 opacity-50" />
              <p>Одоогоор дагагч байхгүй байна.</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {followers.map((follower) => (
                <ListGroup.Item key={follower.id} className="py-3 px-4">
                  <div className="d-flex align-items-start justify-content-between">
                    <div
                      className="d-flex align-items-start flex-grow-1 me-3"
                      onClick={() => handleUserClick(follower.username)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Link to={`/profile/${follower.username}`} className="me-3 flex-shrink-0">
                        <UserAvatar user={follower} size={48} />
                      </Link>
                      <div className="flex-grow-1">
                        <div className="mb-1">
                          <UserName
                            user={follower}
                            showLink={true}
                            className="fw-semibold text-dark"
                            showMembershipBadge={true}
                          />
                        </div>
                        <Link
                          to={`/profile/${follower.username}`}
                          className="text-decoration-none text-muted small"
                        >
                          @{follower.username}
                        </Link>
                      </div>
                    </div>
                    {isOwnProfile && follower.id !== user.id && (
                      <Button
                        size="sm"
                        variant={followingIds.has(follower.id) ? 'outline-secondary' : 'primary'}
                        onClick={(e) => handleToggleFollow(follower.username, follower.id, e)}
                        disabled={processingIds.has(follower.id)}
                        style={{ minWidth: '110px' }}
                        className="flex-shrink-0"
                      >
                        {processingIds.has(follower.id) ? (
                          <Spinner animation="border" size="sm" />
                        ) : followingIds.has(follower.id) ? (
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

export default FollowersPage;
