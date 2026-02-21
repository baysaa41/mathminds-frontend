// frontend/src/pages/QuizzesPage.jsx
// (!!! ШИНЭЧИЛСЭН: "Постлох" товч нэмсэн, CreatePostForm руу "бэлэг" илгээдэг болсон)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import { stripPSTricks } from '../utils/stripPSTricks.js';
// Lucide icons ашиглахгүй болсон - Bootstrap Icons-руу шилжсэн

// (!!!) 1. ШИНЭ HOOK БОЛОН КОМПОНЕНТУУДЫГ ИМПОРТЛОХ
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import UserName from '../components/UserName.jsx';

// React Bootstrap components
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
import Breadcrumb from 'react-bootstrap/Breadcrumb';

const QuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // (!!!) Энэ hook-г ашиглана
  const { setPageTitle } = useOutletContext();
  const { setPrefillData } = usePrefill(); // <-- 2. ЭНЭ МӨРИЙГ НЭМЭХ

  // ... (Hooks, State хэвээрээ) ...
  const { toast, showToast, hideToast } = useToast();
  const {
    data: quizzes,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
  } = usePaginatedFetch('/api/integral/quizzes/'); //

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentQuery, setCurrentQuery] = useState({ search: '' });

  // ... (useEffect, handleSearch, handleCreateNew хэвээрээ) ...
  // Анхны ачаалалт болон гарчиг тохируулах
  useEffect(() => {
    setPageTitle('Миний тестүүд');
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

  // Шинэ тест үүсгэх
  const handleCreateNew = async () => {
    setIsCreatingNew(true);
    try {
      const response = await apiClient.post('/api/integral/quizzes/', {
        title: 'Шинэ тест (Гарчиггүй)',
        description: 'Тестийн тайлбар...',
        is_published: false,
      });
      const newQuizId = response.data.id;
      navigate(`/quiz/${newQuizId}/edit`);
    } catch (err) {
      console.error('Failed to create new quiz:', err);
      showToast('Шинэ тест үүсгэхэд алдаа гарлаа.', 'danger');
    } finally {
      setIsCreatingNew(false);
    }
  };

  // (!!!) ШИНЭ ФУНКЦ: Пост үүсгэх ("бэлэг" илгээх)
  const handleCreatePost = (e, quiz) => {
    e.stopPropagation(); // Картыг дарагдахаас сэргийлэх

    // 1. "Бэлэг"-г бэлтгэх
    const prefillData = {
      type: 'quiz',
      item: {
        id: quiz.id,
        title: quiz.title || `Тест #${quiz.id}`,
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
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Тестүүд</Breadcrumb.Item>
      </Breadcrumb>

      {/* ... (ToastContainer, PageHeader, SearchBar, Loading, Error, Empty хэвээрээ) ... */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <PageHeader
        title="Миний тестүүд"
        action={{
          label: 'Шинэ тест',
          onClick: handleCreateNew,
          icon: <i className="bi bi-patch-plus me-1"></i>,
        }}
        loading={isCreatingNew}
      />

      <SearchBar
        onSearch={handleSearch}
        placeholder="Миний тестүүдээс хайх..."
        loading={loading}
        filters={[]}
      />

      {loading && <LoadingState message="Миний тестүүдийг ачааллаж байна..." />}

      {error && !loading && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && quizzes.length === 0 && (
        <EmptyState
          icon={() => <i className="bi bi-patch-check"></i>}
          title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Та тест үүсгээгүй байна'}
          message={
            currentQuery.search
              ? 'Хайлтын утганд тохирох тест таны сан дотор байхгүй байна.'
              : 'Та эхний тестээ үүсгэнэ үү.'
          }
          actionLabel="Шинэ тест үүсгэх"
          onAction={handleCreateNew}
        />
      )}

      {/* Тестүүдийн жагсаалт */}
      {!loading && !error && quizzes.length > 0 && (
        <Row className="g-3">
          {quizzes.map((quiz) => (
            <Col key={quiz.id} xs={12}>
              <Card
                className="h-100 shadow-sm hover-shadow transition"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <Card.Body>
                  <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                    {quiz.is_published ? (
                      <Badge bg="success">Нийтлэгдсэн</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">
                        Ноорог
                      </Badge>
                    )}
                    <Badge bg="secondary">{quiz.problems_count || 0} бодлоготой</Badge>

                    {/* (!!!) ШИНЭ ТОВЧ (!!!) */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="ms-auto"
                      onClick={(e) => handleCreatePost(e, quiz)}
                    >
                      <i className="bi bi-send me-1"></i>
                      Постлох
                    </Button>
                  </Stack>

                  {/* ... (Гарчиг, Тайлбар, Мета хэвээрээ) ... */}
                  <div className="h5 mb-2 mathjax-content">
                    <LivePreview content={stripPSTricks(quiz.title || `Тест #${quiz.id}`, 100)} />
                  </div>

                  <div className="text-muted small mathjax-content">
                    <LivePreview
                      content={stripPSTricks(quiz.description || 'Тайлбар байхгүй...', 200)}
                    />
                  </div>

                  <div className="text-muted small mt-2">
                    <i className="bi bi-person me-1"></i>
                    <UserName user={quiz.author} />
                    {quiz.updated_at && (
                      <>
                        <span className="mx-2">•</span>
                        <i className="bi bi-clock me-1"></i>
                        {new Date(quiz.updated_at).toLocaleString()}
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

      {quizzes.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded">
          <small className="text-muted">
            Нийт: <strong>{quizzes.length}</strong> тест
            {currentQuery.search ? (
              <>
                {' '}
                • (Одоогийн хайлтаар <strong>{quizzes.length}</strong> олдсон)
              </>
            ) : null}
            {hasMore && !loading && <> • (Гүйлгэж илүү ихийг ачаална уу)</>}
          </small>
        </div>
      )}
    </Container>
  );
};

export default QuizzesPage;
