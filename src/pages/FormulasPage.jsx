// frontend/src/pages/FormulasPage.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import { MathJax } from 'better-react-mathjax';
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

import { API_ENDPOINTS } from '../constants/api.js';
import { MESSAGES } from '../constants/messages.js';

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

const FormulasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle, mainScrollRef } = useOutletContext();
  const { setPrefillData } = usePrefill();
  const { toast, showToast, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [creatingNew, setCreatingNew] = useState(false);

  // Миний томьёонууд
  const {
    data: myFormulas, loading: myLoading, loadingMore: myLoadingMore,
    error: myError, hasMore: myHasMore,
    fetchData: fetchMyData, loadMore: loadMyMore, refresh: refreshMy,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.FORMULAS);

  // Бүх томьёонууд
  const {
    data: allFormulas, loading: allLoading, loadingMore: allLoadingMore,
    error: allError, hasMore: allHasMore,
    fetchData: fetchAllData, loadMore: loadAllMore, refresh: refreshAll,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.FORMULAS);

  const rawFormulas  = activeTab === 'my' ? myFormulas    : allFormulas;
  const loading      = activeTab === 'my' ? myLoading     : allLoading;
  const loadingMore  = activeTab === 'my' ? myLoadingMore : allLoadingMore;
  const error        = activeTab === 'my' ? myError       : allError;
  const hasMore      = activeTab === 'my' ? myHasMore     : allHasMore;
  const refresh      = activeTab === 'my' ? refreshMy     : refreshAll;

  // Давхардлыг арилгах
  const formulas = useMemo(() => {
    const seen = new Set();
    return rawFormulas.filter((f) => { if (seen.has(f.id)) return false; seen.add(f.id); return true; });
  }, [rawFormulas]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    if (activeTab === 'my') await loadMyMore();
    else await loadAllMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadMyMore, loadAllMore]);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainScrollRef);

  useEffect(() => {
    setPageTitle('Томьёоны сан');
    fetchAllData();
    return () => setPageTitle('Нүүр');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'my' && myFormulas.length === 0 && !myLoading && !myError && user?.id) {
      fetchMyData({ author: user.id });
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
    setCreatingNew(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.INTEGRAL.FORMULAS, {
        title: 'Шинэ томьёо (Гарчиггүй)',
        content: 'Томьёоны агуулга...',
        published: false,
      });
      navigate(`/formula/${response.data.uuid}/edit`);
    } catch {
      showToast(MESSAGES.ERROR.CREATE, 'danger');
    } finally {
      setCreatingNew(false);
    }
  };

  const handleCreatePost = (e, formula) => {
    e.stopPropagation();
    setPrefillData({ type: 'formula', item: { id: formula.uuid, title: formula.title || `Томьёо #${formula.id}` } });
    navigate('/');
  };

  if (loading && formulas.length === 0) {
    return <LoadingState message={MESSAGES.LOADING.FORMULAS} fullPage />;
  }
  if (error && formulas.length === 0) {
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
        title="Томьёоны сан"
        subtitle={`Нийт ${formulas.length} томьёо`}
        action={
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-primary" size="sm" onClick={() => navigate('/formulas/browse')}>
              <i className="bi bi-grid-3x3-gap me-1"></i>
              Ангиллаар үзэх
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateNew} disabled={creatingNew}>
              {creatingNew ? <Spinner as="span" animation="border" size="sm" /> : (
                <><i className="bi bi-infinity me-1"></i>Шинэ томьёо</>
              )}
            </Button>
          </Stack>
        }
      />

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="all">
              <i className="bi bi-grid-3x3-gap me-2"></i>Бүх томьёонууд
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="my">
              <i className="bi bi-infinity me-2"></i>Миний томьёонууд
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
        <SearchBar onSearch={handleSearch} placeholder="Гарчиг, агуулгаар хайх..." loading={loading} />

        {loading && formulas.length === 0 && <LoadingState message="Ачааллаж байна..." />}
        {error && formulas.length === 0 && <ErrorState message={error} onRetry={refresh} />}

        {!loading && formulas.length === 0 && (
          <EmptyState
            icon={() => <i className="bi bi-infinity"></i>}
            title={activeTab === 'my' ? MESSAGES.EMPTY.NO_FORMULAS : 'Томьёо байхгүй байна'}
            message="Шинэ томьёо нэмж эхлээрэй!"
            actionLabel="Шинэ томьёо"
            onAction={handleCreateNew}
          />
        )}

        {formulas.length > 0 && (
          <Row className="g-3">
            {formulas.map((formula) => (
              <Col key={formula.id} xs={12}>
                <Card
                  className="h-100 shadow-sm hover-shadow transition"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/formula/${formula.uuid}`)}
                >
                  <Card.Body>
                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                      {formula.topic_name && <Badge bg="info">{formula.topic_name}</Badge>}
                      {formula.is_public ? (
                        <Badge bg="success">Нийтэд харагдана</Badge>
                      ) : (
                        <Badge bg="secondary">Хувийн</Badge>
                      )}
                      {user && formula.author && user.id === formula.author.id && (
                        <Badge bg="primary">Миний</Badge>
                      )}
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="ms-auto"
                        onClick={(e) => handleCreatePost(e, formula)}
                      >
                        <i className="bi bi-send me-1"></i>Постлох
                      </Button>
                    </Stack>

                    <MathJax hideUntilTypeset="first">
                      <Card.Title className="h5 mb-2 mathjax-content">
                        {formula.title || `Томьёо #${formula.id}`}
                      </Card.Title>
                    </MathJax>

                    <Card.Text as="div" className="text-muted small">
                      <LivePreview content={stripPSTricks(formula.content || 'Агуулга байхгүй', Infinity)} />
                    </Card.Text>

                    <div className="text-muted small mt-2">
                      <i className="bi bi-person me-1"></i>
                      <UserName user={formula.author} />
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
            <span className="ms-2">{MESSAGES.LOADING.DEFAULT}</span>
          </div>
        )}

        {formulas.length > 0 && (
          <div className="mt-4 p-3 bg-light rounded">
            <small className="text-muted">
              Нийт: <strong>{formulas.length}</strong> томьёо
              {hasMore && <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>}
            </small>
          </div>
        )}
      </>
    );
  }
};

export default FormulasPage;
