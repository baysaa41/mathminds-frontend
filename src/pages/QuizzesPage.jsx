// frontend/src/pages/QuizzesPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import { stripPSTricks } from '../utils/stripPSTricks.js';

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
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';

const QuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle, mainScrollRef } = useOutletContext();
  const { setPrefillData } = usePrefill();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState('my');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Миний тестүүд
  const {
    data: myQuizzes, loading: myLoading, loadingMore: myLoadingMore,
    error: myError, hasMore: myHasMore,
    fetchData: fetchMyData, loadMore: loadMyMore, refresh: refreshMy,
  } = usePaginatedFetch('/api/integral/quizzes/');

  // Бүх тестүүд
  const {
    data: allQuizzes, loading: allLoading, loadingMore: allLoadingMore,
    error: allError, hasMore: allHasMore,
    fetchData: fetchAllData, loadMore: loadAllMore, refresh: refreshAll,
  } = usePaginatedFetch('/api/integral/quizzes/');

  const quizzes     = activeTab === 'my' ? myQuizzes     : allQuizzes;
  const loading     = activeTab === 'my' ? myLoading     : allLoading;
  const loadingMore = activeTab === 'my' ? myLoadingMore : allLoadingMore;
  const error       = activeTab === 'my' ? myError       : allError;
  const hasMore     = activeTab === 'my' ? myHasMore     : allHasMore;
  const refresh     = activeTab === 'my' ? refreshMy     : refreshAll;

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (activeTab === 'my') await loadMyMore();
    else await loadAllMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadMyMore, loadAllMore]);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainScrollRef);

  useEffect(() => {
    setPageTitle('Тестийн сан');
    if (user?.id) fetchMyData({ author: user.id });
    return () => setPageTitle('Нүүр');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'all' && allQuizzes.length === 0 && !allLoading && !allError) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearch = ({ search }) => {
    const params = {};
    if (search) params.search = search;
    if (activeTab === 'my') {
      if (user?.id) params.author = user.id;
      fetchMyData(params);
    } else {
      fetchAllData(params);
    }
  };

  const handleCreateNew = async () => {
    setIsCreatingNew(true);
    try {
      const response = await apiClient.post('/api/integral/quizzes/', {
        title: 'Шинэ тест (Гарчиггүй)',
        description: 'Тестийн тайлбар...',
        is_public: false,
      });
      navigate(`/quiz/${response.data.uuid}/edit`);
    } catch {
      showToast('Шинэ тест үүсгэхэд алдаа гарлаа.', 'danger');
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleCreatePost = (e, quiz) => {
    e.stopPropagation();
    setPrefillData({ type: 'quiz', item: { id: quiz.uuid, title: quiz.title || `Тест #${quiz.id}` } });
    navigate('/');
  };

  if (loading && quizzes.length === 0) {
    return <LoadingState message="Тестүүдийг ачааллаж байна..." fullPage />;
  }
  if (error && quizzes.length === 0) {
    return <ErrorState message={error} onRetry={refresh} fullPage />;
  }

  return (
    <Container className="py-4">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <PageHeader
        title="Тестийн сан"
        subtitle={`Нийт ${quizzes.length} тест`}
        action={
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-primary" size="sm" onClick={() => navigate('/quizzes/browse')}>
              <i className="bi bi-grid-3x3-gap me-1"></i>
              Ангиллаар үзэх
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateNew} disabled={isCreatingNew}>
              {isCreatingNew ? <Spinner as="span" animation="border" size="sm" /> : (
                <><i className="bi bi-patch-plus me-1"></i>Шинэ тест</>
              )}
            </Button>
          </Stack>
        }
      />

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="my">
              <i className="bi bi-patch-check me-2"></i>Миний тестүүд
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="all">
              <i className="bi bi-grid-3x3-gap me-2"></i>Бүх тестүүд
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey={activeTab} active>
            {renderContent()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <div ref={triggerRef} style={{ height: '1px', marginTop: '1px', visibility: 'hidden' }} />
    </Container>
  );

  function renderContent() {
    return (
      <>
        <SearchBar onSearch={handleSearch} placeholder="Тестүүдээс хайх..." loading={loading} />

        {loading && quizzes.length === 0 && <LoadingState message="Ачааллаж байна..." />}
        {error && quizzes.length === 0 && <ErrorState message={error} onRetry={refresh} />}

        {!loading && quizzes.length === 0 && (
          <EmptyState
            icon={() => <i className="bi bi-patch-check"></i>}
            title={activeTab === 'my' ? 'Та тест үүсгээгүй байна' : 'Тест байхгүй байна'}
            message="Шинэ тест нэмж эхлээрэй!"
            actionLabel="Шинэ тест үүсгэх"
            onAction={handleCreateNew}
          />
        )}

        {quizzes.length > 0 && (
          <Row className="g-3">
            {quizzes.map((quiz) => (
              <Col key={quiz.id} xs={12}>
                <Card
                  className="h-100 shadow-sm hover-shadow transition"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/quiz/${quiz.uuid}`)}
                >
                  <Card.Body>
                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                      {quiz.is_public ? (
                        <Badge bg="success">Нийтэд харагдана</Badge>
                      ) : (
                        <Badge bg="secondary">Хувийн</Badge>
                      )}
                      <Badge bg="secondary">{quiz.problems_count || 0} бодлоготой</Badge>
                      {user && quiz.author && user.id === quiz.author.id && (
                        <Badge bg="primary">Миний</Badge>
                      )}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="ms-auto"
                        onClick={(e) => handleCreatePost(e, quiz)}
                      >
                        <i className="bi bi-send me-1"></i>Постлох
                      </Button>
                    </Stack>

                    <div className="h5 mb-2 mathjax-content">
                      <LivePreview content={stripPSTricks(quiz.title || `Тест #${quiz.id}`, 100)} />
                    </div>

                    <div className="text-muted small mathjax-content">
                      <LivePreview content={stripPSTricks(quiz.description || 'Тайлбар байхгүй...', 200)} />
                    </div>

                    <div className="text-muted small mt-2">
                      <i className="bi bi-person me-1"></i>
                      <UserName user={quiz.author} />
                      {quiz.updated_at && (
                        <><span className="mx-2">•</span><i className="bi bi-clock me-1"></i>
                        {new Date(quiz.updated_at).toLocaleDateString('mn-MN')}</>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {loadingMore && (
          <div className="text-center mt-4 py-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">Ачааллаж байна...</span>
          </div>
        )}

        {quizzes.length > 0 && (
          <div className="mt-4 p-3 bg-light rounded">
            <small className="text-muted">
              Нийт: <strong>{quizzes.length}</strong> тест
              {hasMore && <> • Гүйлгэж илүүг харна уу</>}
            </small>
          </div>
        )}
      </>
    );
  }
};

export default QuizzesPage;
