// frontend/src/components/Feed.jsx
// ✅ ШИНЭЧИЛСЭН: Custom hooks, common components ашигласан, 20-оор pagination

import { useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';

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
import { FileText } from 'lucide-react';

const Feed = () => {
    // ✅ Custom Hooks ашиглах
    const {
        data: posts,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh,
        setData
    } = usePaginatedFetch(`${API_ENDPOINTS.MINDS.POSTS}?content_type__in=post,repost`);


    const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

    // Анхны ачаалалт
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Пост устгасан үед
    const handlePostDeleted = useCallback((deletedPostId) => {
        setData(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    }, [setData]);

    // ✅ Анхны ачааллын үед Loading State
    if (loading && posts.length === 0) {
        return <LoadingState message={MESSAGES.LOADING.POSTS} fullPage />;
    }

    return (
        <div>
            {/* ✅ Шинэ пост үүсгэх форм - refresh функцийг дамжуулна */}
            <CreatePostForm onPostCreated={refresh} />

            {/* ✅ Error State */}
            {error && posts.length === 0 && (
                <ErrorState
                    message={error}
                    onRetry={refresh}
                />
            )}

            {/* Хэсэгчилсэн алдаа (нэмэлт ачааллах үед) */}
            {error && posts.length > 0 && (
                <Alert variant="danger" className="m-3">
                    {error}
                </Alert>
            )}

            {/* ✅ Empty State */}
            {!loading && posts.length === 0 && (
                <EmptyState
                    icon={FileText}
                    title={MESSAGES.EMPTY.NO_POSTS}
                    message="Та эхний постыг бичээрэй!"
                />
            )}

            {/* Posts list */}
            {posts.length > 0 && (
                posts.filter(post => post && post.id).map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onPostDeleted={handlePostDeleted}
                    />
                ))
            )}

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
                        Нийт: <strong>{posts.length}</strong> пост
                        {hasMore && (
                            <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>
                        )}
                    </small>
                </div>
            )}
        </div>
    );
};

export default Feed;