// ClubExercisesPage — бодлого постуудыг өдрөөр харуулах (өдөр = RightSidebar-д)
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';

import PostCard from '../components/PostCard';
import EmptyState from '../components/common/EmptyState';
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { API_ENDPOINTS } from '../constants/api';

const MONTHS_MN = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}.${MONTHS_MN[d.getMonth()]} ${d.getDate()}`;
}

const ClubExercisesPage = () => {
  const { clubData } = useOutletContext();
  const clubId = clubData?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  // Навигацийн зорилгоор бүх өдрийн жагсаалт (prev/next)
  const [allDates, setAllDates] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  // Бүх өдрийн жагсаалт татах (prev/next товчлуурт хэрэгтэй)
  useEffect(() => {
    if (!clubId) return;
    apiClient.get(`${API_ENDPOINTS.MINDS.POSTS}dates/`, {
      params: { club: clubId, content_type: 'problem' },
    }).then(res => {
      const list = res.data || [];
      setAllDates(list);
      setNoData(list.length === 0);
    }).catch(() => setNoData(true));
  }, [clubId]);

  // Сонгосон өдрийн постуудыг татах
  useEffect(() => {
    if (!clubId || !selectedDate) return;
    let cancelled = false;
    setPosts([]);
    setPostsLoading(true);
    apiClient.get(API_ENDPOINTS.MINDS.POSTS, {
      params: {
        club: clubId,
        content_type: 'problem',
        date: selectedDate,
        ordering: 'created_at',
        page_size: 100,
      },
    }).then(res => {
      if (!cancelled) setPosts(res.data?.results ?? res.data ?? []);
    }).catch(() => {
      if (!cancelled) setPosts([]);
    }).finally(() => {
      if (!cancelled) setPostsLoading(false);
    });
    return () => { cancelled = true; };
  }, [clubId, selectedDate]);

  const handlePostDeleted = useCallback((deletedId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedId));
  }, []);

  // Prev / Next
  const currentIdx = allDates.findIndex(d => d.date === selectedDate);
  const prevDate = currentIdx > 0 ? allDates[currentIdx - 1].date : null;
  const nextDate = currentIdx < allDates.length - 1 ? allDates[currentIdx + 1].date : null;

  const goTo = (date) => setSearchParams({ date }, { replace: false });

  return (
    <div className="container-fluid">
      <h4 className="mb-3 d-flex align-items-center gap-2">
        <Dumbbell size={20} />Дасгал
      </h4>

      {noData ? (
        <EmptyState
          icon={Dumbbell}
          title="Бодлого байхгүй байна"
          message="Клубын хэлэлцүүлэгт бодлого пост нийтлэгдээгүй байна."
        />
      ) : !selectedDate ? (
        <div className="text-center py-5 text-muted small">
          Баруун талаас өдөр сонгоно уу.
        </div>
      ) : (
        <>
          {/* Навигаци товч */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <Button
              variant="outline-secondary" size="sm"
              disabled={!prevDate}
              onClick={() => goTo(prevDate)}
            >
              <ChevronLeft size={14} className="me-1" />Өмнөх
            </Button>
            <span className="fw-semibold small text-muted">
              {formatDateLabel(selectedDate)}
            </span>
            <Button
              variant="outline-secondary" size="sm"
              disabled={!nextDate}
              onClick={() => goTo(nextDate)}
            >
              Дараагийн<ChevronRight size={14} className="ms-1" />
            </Button>
          </div>

          {postsLoading ? (
            <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-5 text-muted small">
              Энэ өдөр бодлого нийтлэгдээгүй байна.
            </div>
          ) : (
            <div className="bg-white rounded shadow-sm overflow-hidden">
              {posts.filter(p => p?.id).map(post => (
                <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClubExercisesPage;
