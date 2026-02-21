// frontend/src/pages/FormulasPage.jsx
// ✅ ШИНЭЧИЛСЭН: "Постлох" товч CreatePostForm руу "бэлэг" илгээдэг болсон

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import { MathJax } from 'better-react-mathjax';
import { stripPSTricks } from '../utils/stripPSTricks.js';

// ✅ Custom Hooks
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';

// ✅ Common Components
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import UserName from '../components/UserName.jsx';

// ✅ Constants
import { API_ENDPOINTS } from '../constants/api.js';
import { MESSAGES } from '../constants/messages.js';

// React Bootstrap
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
// Lucide icons ашиглахгүй болсон - Bootstrap Icons-руу шилжсэн

const FormulasPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // (!!!) Энэ hook-г ашиглана
  const { setPageTitle } = useOutletContext();
  const { setPrefillData } = usePrefill(); // <-- 2. ЭНЭ МӨРИЙГ НЭМЭХ

  // ✅ Custom Hooks ашиглах
  const {
    data: formulas,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchData,
    loadMore,
    refresh,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.FORMULAS);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);
  const { toast, showToast, hideToast } = useToast();

  // ✅ Deduplicate formulas by ID to prevent duplicate key errors
  const uniqueFormulas = useMemo(() => {
    const seen = new Set();
    return formulas.filter((formula) => {
      if (seen.has(formula.id)) {
        return false;
      }
      seen.add(formula.id);
      return true;
    });
  }, [formulas]);

  // State
  const [creatingNew, setCreatingNew] = useState(false);
  // (!!!) postingId state-г хассан

  // ... (useEffect, handleSearch, handleCreateNew хэвээрээ) ...
  // Анхны ачаалалт
  useEffect(() => {
    setPageTitle('Томьёоны сан');
    fetchData();
    return () => setPageTitle('Нүүр');
  }, []);

  // Хайлт хийх
  const handleSearch = ({ search }) => {
    const params = {};
    if (search) params.search = search;

    fetchData(params);
  };

  // Шинэ томьёо үүсгэх
  const handleCreateNew = async () => {
    setCreatingNew(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.INTEGRAL.FORMULAS, {
        title: 'Шинэ томьёо (Гарчиггүй)',
        content: 'Томьёоны агуулга...',
        published: false,
      });
      navigate(`/formula/${response.data.id}/edit`);
    } catch (err) {
      showToast(MESSAGES.ERROR.CREATE, 'danger');
    } finally {
      setCreatingNew(false);
    }
  };

  // (!!!) ЗАСВАРЛАСАН: Пост үүсгэх (API дуудахын оронд "бэлэг" илгээх)
  const handleCreatePost = (e, formula) => {
    e.stopPropagation(); // Картыг дарагдахаас сэргийлэх

    // 1. "Бэлэг"-г бэлтгэх
    const prefillData = {
      type: 'formula',
      item: {
        id: formula.id,
        title: formula.title || `Томьёо #${formula.id}`,
      },
    };

    // 2. "Бэлэг"-ээ "Хайрцаг" (Context) руу хийх
    setPrefillData(prefillData);

    // 3. Feed хуудас руу энгийнээр үсрэх (state-гүйгээр)
    navigate('/');
  };

  // ... (Loading, Error state хэвээрээ) ...
  // ✅ Loading State
  if (loading && uniqueFormulas.length === 0) {
    return <LoadingState message={MESSAGES.LOADING.FORMULAS} fullPage />;
  }

  // ✅ Error State
  if (error && uniqueFormulas.length === 0) {
    return <ErrorState message={error} onRetry={refresh} fullPage />;
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Томьёонууд</Breadcrumb.Item>
      </Breadcrumb>

      {/* ... (ToastContainer, PageHeader, SearchBar, Empty хэвээрээ) ... */}
      {/* ✅ Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ✅ Page Header */}
      <PageHeader
        title="Томьёоны сан"
        subtitle={`Нийт ${uniqueFormulas.length} томьёо`}
        action={{
          label: 'Шинэ томьёо',
          onClick: handleCreateNew,
          icon: <i className="bi bi-infinity me-2"></i>,
        }}
        loading={creatingNew}
      />

      {/* ✅ Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Гарчиг, агуулгаар хайх..."
        loading={loading}
      />

      {/* ✅ Empty State */}
      {!loading && formulas.length === 0 && (
        <EmptyState
          icon={() => <i className="bi bi-infinity"></i>}
          title={MESSAGES.EMPTY.NO_FORMULAS}
          message="Шинэ томьёо нэмж эхлээрэй!"
          actionLabel="Шинэ томьёо"
          onAction={handleCreateNew}
        />
      )}

      {/* Formulas Grid */}
      {uniqueFormulas.length > 0 && (
        <Row className="g-3">
          {uniqueFormulas.map((formula) => (
            <Col key={formula.id} xs={12}>
              <Card
                className="h-100 shadow-sm hover-shadow transition"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/formula/${formula.id}`)}
              >
                <Card.Body>
                  <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                    {formula.topic_name && <Badge bg="info">{formula.topic_name}</Badge>}
                    {formula.status !== undefined && formula.status && (
                      <Badge bg="success">Идэвхтэй</Badge>
                    )}

                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="ms-auto"
                      onClick={(e) => handleCreatePost(e, formula)}
                    >
                      <i className="bi bi-send me-1"></i>
                      Постлох
                    </Button>
                  </Stack>

                  {/* ... (Гарчиг, Агуулга, Мета хэвээрээ) ... */}
                  {/* Гарчиг */}
                  <MathJax hideUntilTypeset={'first'}>
                    <Card.Title className="h5 mb-2 mathjax-content">
                      {formula.title || `Томьёо #${formula.id}`}
                    </Card.Title>
                  </MathJax>

                  {/* Агуулга */}
                  <Card.Text as="div" className="text-muted small">
                    <LivePreview
                      content={stripPSTricks(formula.content || 'Агуулга байхгүй', Infinity)}
                    />
                  </Card.Text>

                  {/* Мета мэдээлэл */}
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

      {/* ... (Infinite Scroll, Stats хэвээрээ) ... */}
      {/* ✅ Infinite Scroll Trigger */}
      <div ref={triggerRef} style={{ height: '20px' }} />

      {/* ✅ Loading More Indicator */}
      {loadingMore && (
        <div className="text-center mt-4 py-3">
          <Spinner animation="border" size="sm" />
          <span className="ms-2">{MESSAGES.LOADING.DEFAULT}</span>
        </div>
      )}

      {/* Stats */}
      {uniqueFormulas.length > 0 && (
        <div className="mt-4 p-3 bg-light rounded">
          <small className="text-muted">
            Нийт: <strong>{uniqueFormulas.length}</strong> томьёо
            {hasMore && <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>}
          </small>
        </div>
      )}
    </Container>
  );
};

export default FormulasPage;
