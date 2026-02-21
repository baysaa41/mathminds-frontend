// frontend/src/components/ClubFeed.jsx
// Клубын дотоод пост feed - зөвхөн клубын гишүүд харна

import { useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';

// Custom Hooks
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';

// Common Components
import LoadingState from './common/LoadingState.jsx';
import ErrorState from './common/ErrorState.jsx';
import EmptyState from './common/EmptyState.jsx';

// Constants
import { API_ENDPOINTS } from '../constants/api.js';

import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { MessageSquare } from 'lucide-react';

const ClubFeed = ({ clubId, clubName }) => {
  // Club-specific posts fetch
  const {
    data: posts,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
    setData,
  } = usePaginatedFetch(`${API_ENDPOINTS.MINDS.POSTS}?club=${clubId}`);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  // Анхны ачаалалт
  useEffect(() => {
    if (clubId) {
      fetchData();
    }
  }, [clubId, fetchData]);

  // Пост устгасан үед
  const handlePostDeleted = useCallback(
    (deletedPostId) => {
      setData((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
    },
    [setData]
  );

  // Анхны ачааллын үед Loading State
  if (loading && posts.length === 0) {
    return <LoadingState message="Постууд уншиж байна..." />;
  }

  return (
    <div>
      {/* Клубын пост үүсгэх форм - club context-тэй */}
      <CreatePostForm onPostCreated={refresh} clubId={clubId} clubName={clubName} />

      {/* Error State */}
      {error && posts.length === 0 && <ErrorState message={error} onRetry={refresh} />}

      {/* Хэсэгчилсэн алдаа (нэмэлт ачааллах үед) */}
      {error && posts.length > 0 && (
        <Alert variant="danger" className="m-3">
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="Одоогоор пост байхгүй байна"
          message={`${clubName} клубт эхний постыг бичээрэй!`}
        />
      )}

      {/* Posts list */}
      {posts.length > 0 &&
        posts
          .filter((post) => post && post.id)
          .map((post) => <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />)}

      {/* Infinite Scroll-н trigger */}
      <div ref={triggerRef} style={{ height: '20px' }} />

      {/* Нэмэлт ачааллын spinner */}
      {loadingMore && (
        <div className="d-flex justify-content-center py-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {/* Төгсгөл болсон мэдэгдэл */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center text-muted py-3">
          <small>Бүх пост ачаалагдлаа</small>
        </div>
      )}
    </div>
  );
};

export default ClubFeed;
