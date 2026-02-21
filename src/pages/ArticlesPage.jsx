// frontend/src/pages/ArticlesPage.jsx
// (!!! ШИНЭЧИЛСЭН: "Постлох" товч CreatePostForm руу "бэлэг" илгээдэг болсон)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import { FileText } from 'lucide-react'; // FileText нь EmptyState-д ашиглагдана
import { stripPSTricks } from '../utils/stripPSTricks.js';
import { formatDate } from '../utils/dateFormatter';

import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import UserName from '../components/UserName.jsx';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const ArticlesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // (!!!) navigate hook-г ашиглана
  const { setPageTitle } = useOutletContext();
  const { setPrefillData } = usePrefill(); // <-- 2. ЭНЭ МӨРИЙГ НЭМЭХ

  const { toast, showToast, hideToast } = useToast();
  const {
    data: articles,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
  } = usePaginatedFetch('/api/integral/articles/');

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  // (!!!) postingId state-г хассан
  const [currentQuery, setCurrentQuery] = useState({ search: '' });

  // ... (useEffect, handleSearch, handleCreateNew хэвээрээ) ...
  // Анхны ачаалалт болон гарчиг тохируулах
  useEffect(() => {
    setPageTitle('Миний өгүүллүүд');
    if (user?.id) {
      fetchData({ author: user.id });
    }
    return () => {
      setPageTitle('Нүүр');
    };
  }, [fetchData, setPageTitle, user?.id]);

  // Хайлтын функц
  const handleSearch = useCallback(
    (query) => {
      if (!user?.id) return;
      const searchQuery = query.search || '';
      setCurrentQuery({ search: searchQuery });
      fetchData({ search: searchQuery, author: user.id }, true);
    },
    [fetchData, user?.id]
  );

  // Шинэ өгүүлэл үүсгэх (хэвээрээ)
  const handleCreateNew = async () => {
    setIsCreatingNew(true);
    try {
      const response = await apiClient.post('/api/integral/articles/', {
        title: 'Шинэ өгүүлэл (Гарчиггүй)',
        content: 'Өгүүллийн агуулга...',
        abstract: 'Товч хураангуй...',
      });
      const newArticleId = response.data.id;
      navigate(`/article/${newArticleId}/edit`);
    } catch (err) {
      console.error('Failed to create new article:', err);
      showToast('Шинэ өгүүлэл үүсгэхэд алдаа гарлаа.', 'danger');
    } finally {
      setIsCreatingNew(false);
    }
  };

  // (!!!) ЗАСВАРЛАСАН: Пост үүсгэх (API дуудахын оронд "бэлэг" илгээх)
  const handleCreatePost = (e, article) => {
    e.stopPropagation(); // Картыг дарагдахаас сэргийлэх

    // 1. "Бэлэг"-г бэлтгэх
    const prefillData = {
      type: 'article',
      item: {
        id: article.id,
        title: article.title || `Өгүүлэл #${article.id}`,
      },
    };

    // 2. "Бэлэг"-ээ "Хайрцаг" (Context) руу хийх
    setPrefillData(prefillData);

    // 3. Feed хуудас руу энгийнээр үсрэх (state-гүйгээр)
    navigate('/');
  };

  // --- Render хэсэг ---

  return (
    <Container className="py-4">
      {/* ... (ToastContainer, PageHeader, SearchBar, Loading, Error, Empty хэвээрээ) ... */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <PageHeader
        title="Миний өгүүллүүд"
        action={{
          label: 'Шинэ өгүүлэл',
          onClick: handleCreateNew,
          icon: <i className="bi bi-journal-text me-1"></i>,
        }}
        loading={isCreatingNew}
      />

      <SearchBar
        onSearch={handleSearch}
        placeholder="Миний өгүүллүүдээс хайх..."
        loading={loading}
        filters={[]}
      />

      {loading && <LoadingState message="Миний өгүүллүүдийг ачааллаж байна..." />}

      {error && !loading && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && articles.length === 0 && (
        <EmptyState
          icon={FileText}
          title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Та өгүүлэл бичээгүй байна'}
          message={
            currentQuery.search
              ? 'Хайлтын утганд тохирох өгүүлэл таны нийтлэлд байхгүй байна.'
              : 'Та эхний өгүүллээ үүсгэнэ үү.'
          }
          actionLabel="Шинэ өгүүлэл үүсгэх"
          onAction={handleCreateNew}
        />
      )}

      {/* Өгүүллүүдийн жагсаалт */}
      {!loading && !error && articles.length > 0 && (
        <Row className="g-3">
          {articles.map((article) => (
            <Col key={article.id} xs={12}>
              <Card
                className="h-100 shadow-sm hover-shadow transition"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/article/${article.id}`)}
              >
                <Card.Body>
                  <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                    {/* ... (Бусад Badges хэвээрээ) ... */}
                    {article.published ? (
                      <Badge bg="success">Нийтлэгдсэн</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">
                        Ноорог
                      </Badge>
                    )}
                    <Badge bg="primary">Миний</Badge>

                    {/* (!!!) ЗАСВАРЛАСАН ТОВЧ (!!!) */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="ms-auto"
                      onClick={(e) => handleCreatePost(e, article)}
                      // (!!!) disabled-г хассан
                    >
                      {/* (!!!) Spinner-г хассан, icon-г сольсон */}
                      <i className="bi bi-send me-1"></i>
                      Постлох
                    </Button>
                  </Stack>

                  {/* ... (Гарчиг, Хураангуй, Мета хэвээрээ) ... */}
                  <div className="h5 mb-2 mathjax-content">
                    <LivePreview
                      content={stripPSTricks(article.title || `Өгүүлэл #${article.id}`, 100)}
                    />
                  </div>

                  <div className="text-muted small mathjax-content">
                    <LivePreview
                      content={stripPSTricks(article.abstract || 'Хураангуй байхгүй...', 200)}
                    />
                  </div>

                  <div className="text-muted small mt-2">
                    <i className="bi bi-person me-1"></i>
                    <UserName user={article.author} />
                    {article.published && (
                      <>
                        <span className="mx-2">•</span>
                        <i className="bi bi-clock me-1"></i>
                        {formatDate(article.published)}
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ... (Infinite Scroll, Stats хэвээрээ) ... */}
      <div ref={triggerRef} style={{ height: '20px' }} />

      {loadingMore && (
        <div className="text-center mt-4 py-3">
          <Spinner as="span" animation="border" size="sm" />
          <span className="ms-2">Ачааллаж байна...</span>
        </div>
      )}

      {articles.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded">
          <small className="text-muted">
            Нийт: <strong>{articles.length}</strong> өгүүлэл
            {currentQuery.search ? (
              <>
                {' '}
                • (Одоогийн хайлтаар <strong>{articles.length}</strong> олдсон)
              </>
            ) : null}
            {hasMore && !loading && <> • (Гүйлгэж илүү ихийг ачаална уу)</>}
          </small>
        </div>
      )}
    </Container>
  );
};

export default ArticlesPage;
