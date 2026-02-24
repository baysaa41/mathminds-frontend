// Club Assignments Page — хэлэлцүүлэгт нийтлэгдсэн quiz постууд
import React, { useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

import PostCard from '../components/PostCard';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

import usePaginatedFetch from '../hooks/usePagenatedFetch';
import useInfiniteScroll from '../hooks/useInfiniteScroll';

import { API_ENDPOINTS } from '../constants/api';
import { ClipboardList } from 'lucide-react';
import Spinner from 'react-bootstrap/Spinner';

const ClubAssignmentsPage = () => {
  const { clubData } = useOutletContext();
  const clubId = clubData?.id;

  const {
    data: posts,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    setData,
  } = usePaginatedFetch(`${API_ENDPOINTS.MINDS.POSTS}?club=${clubId}&content_type=quiz`);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    if (clubId) fetchData();
  }, [clubId, fetchData]);

  const handlePostDeleted = useCallback((deletedId) => {
    setData(prev => prev.filter(p => p.id !== deletedId));
  }, [setData]);

  return (
    <div className="container-fluid">
      <h4 className="mb-3">Даалгавар</h4>

      {loading && posts.length === 0 && (
        <LoadingState message="Даалгаврууд уншиж байна..." />
      )}

      {error && posts.length === 0 && (
        <ErrorState message={error} onRetry={fetchData} />
      )}

      {!loading && posts.length === 0 && !error && (
        <EmptyState
          icon={ClipboardList}
          title="Даалгавар байхгүй байна"
          message="Клубын хэлэлцүүлэгт quiz пост нийтлэгдээгүй байна."
        />
      )}

      {posts.length > 0 && (
        <div className="bg-white rounded shadow-sm overflow-hidden">
          {posts
            .filter(p => p && p.id)
            .map(post => (
              <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
            ))}
        </div>
      )}

      <div ref={triggerRef} style={{ height: 20 }} />

      {loadingMore && (
        <div className="d-flex justify-content-center py-3">
          <Spinner animation="border" variant="primary" size="sm" />
        </div>
      )}
    </div>
  );
};

export default ClubAssignmentsPage;
