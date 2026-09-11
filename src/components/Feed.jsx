// frontend/src/components/Feed.jsx
// ✅ ШИНЭЧИЛСЭН: Custom hooks, common components ашигласан, 20-оор pagination
// ✅ ШИНЭ: Хайлт, контентын төрөл, "дагаж буй" шүүлтүүр

import { useEffect, useMemo, useState, useCallback } from 'react';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';
import FeedFilterBar from './FeedFilterBar';

// ✅ Custom Hooks
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';

// ✅ Common Components
import LoadingState from './common/LoadingState.jsx';
import ErrorState from './common/ErrorState.jsx';
import EmptyState from './common/EmptyState.jsx';

// ✅ Constants
import { API_ENDPOINTS } from '../constants/api.js';
import { MESSAGES } from '../constants/messages.js';

import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { FileText, SearchX, X } from 'lucide-react';

const SEARCH_DEBOUNCE_MS = 400;

const Feed = () => {
  // ✅ Custom Hooks ашиглах
  const {
    data: posts,
    loading,
    loadingMore,
    error,
    hasMore,
    totalCount,
    fetchData,
    loadMore,
    refresh,
    setData,
  } = usePaginatedFetch(API_ENDPOINTS.MINDS.FEED);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  // --- Шүүлтүүрийн төлөв ---
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [contentType, setContentType] = useState('');

  // Хайлтыг товчлуур дарж бичихэд хэт олон хүсэлт явуулахгүйн тулд delay хийнэ
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters = Boolean(searchQuery || contentType || scope === 'following');

  const params = useMemo(() => {
    const p = {};
    if (searchQuery) p.search = searchQuery;
    if (contentType) p.content_type__in = contentType;
    if (scope === 'following') p.scope = 'following';
    return p;
  }, [searchQuery, contentType, scope]);

  // Анхны ачаалалт ба шүүлтүүр солигдох үед дахин татах
  useEffect(() => {
    fetchData(params);
  }, [fetchData, params]);

  // Пост устгасан үед
  const handlePostDeleted = useCallback(
    (deletedPostId) => {
      setData((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
    },
    [setData]
  );

  const resetFilters = () => {
    setSearchInput('');
    setScope('all');
    setContentType('');
  };

  return (
    <div>
      {/* ✅ Шинэ пост үүсгэх форм - refresh функцийг дамжуулна */}
      <CreatePostForm onPostCreated={refresh} />

      {/* ✅ Шүүлтүүрийн мөр — ачаалж байх үед ч харагдана */}
      <FeedFilterBar
        search={searchInput}
        onSearchChange={setSearchInput}
        scope={scope}
        onScopeChange={setScope}
        contentType={contentType}
        onContentTypeChange={setContentType}
      />

      {/* ✅ Анхны ачааллын үед Loading State */}
      {loading && posts.length === 0 && <LoadingState message={MESSAGES.LOADING.POSTS} />}

      {/* ✅ Error State */}
      {error && posts.length === 0 && <ErrorState message={error} onRetry={refresh} />}

      {/* Хэсэгчилсэн алдаа (нэмэлт ачааллах үед) */}
      {error && posts.length > 0 && (
        <Alert variant="danger" className="m-3">
          {error}
        </Alert>
      )}

      {/* ✅ Empty State */}
      {!loading &&
        posts.length === 0 &&
        !error &&
        (hasActiveFilters ? (
          <EmptyState
            icon={SearchX}
            title={MESSAGES.EMPTY.NO_RESULTS}
            message="Шүүлтүүрээ өөрчлөөд дахин оролдоно уу."
            actionLabel="Шүүлтүүр цэвэрлэх"
            actionIcon={X}
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title={MESSAGES.EMPTY.NO_POSTS}
            message="Та эхний постыг бичээрэй!"
          />
        ))}

      {/* Posts list */}
      {posts.length > 0 &&
        posts
          .filter((post) => post && post.id)
          .map((post) => <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />)}

      {/* ✅ Infinite Scroll-н trigger */}
      <div ref={triggerRef} style={{ height: '20px' }} />

      {/* ✅ Нэмэлт ачааллын spinner */}
      {loadingMore && (
        <div className="text-center mt-4 py-3">
          <Spinner as="span" animation="border" size="sm" />
          <span className="ms-2">{MESSAGES.LOADING.DEFAULT}</span>
        </div>
      )}

      {/* ✅ Stats footer */}
      {posts.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded">
          <small className="text-muted">
            {totalCount != null ? (
              <>
                <strong>{posts.length}</strong> / {totalCount} пост харагдаж байна
              </>
            ) : (
              <>
                Нийт: <strong>{posts.length}</strong> пост
              </>
            )}
            {hasMore && <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>}
          </small>
        </div>
      )}
    </div>
  );
};

export default Feed;
