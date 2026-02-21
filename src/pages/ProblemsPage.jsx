// frontend/src/pages/ProblemsPage.jsx (Синтаксийн алдааг зассан)

import React, { useState, useEffect, useCallback } from 'react'; // (!!!) "from 'react';" нэмэгдсэн
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { stripPSTricks } from '../utils/stripPSTricks.js';
import { formatDate } from '../utils/dateFormatter';

// ✅ Common Components
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import UserName from '../components/UserName.jsx';

// ✅ Custom Hooks
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';

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
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Collapse from 'react-bootstrap/Collapse';
import Form from 'react-bootstrap/Form';

const ProblemsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // mainScrollRef-г Layout-оос авах
  const { setPageTitle, mainScrollRef } = useOutletContext();
  const { setPrefillData } = usePrefill();

  // State
  const [activeTab, setActiveTab] = useState('my');
  const [creatingNew, setCreatingNew] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipMessage, setMembershipMessage] = useState('');
  const [hasShownMembershipModal, setHasShownMembershipModal] = useState(() => {
    return localStorage.getItem('membershipModalShown') === 'true';
  });

  // Extended search state
  const [showExtendedSearch, setShowExtendedSearch] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);

  // Миний бодлогууд
  const {
    data: myProblems,
    loading: myLoading,
    loadingMore: myLoadingMore,
    error: myError,
    hasMore: myHasMore,
    fetchData: fetchMyData,
    loadMore: loadMyMore,
    refresh: refreshMy,
  } = usePaginatedFetch(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}my_problems/`);

  // Бүх бодлогууд
  const {
    data: allProblems,
    loading: allLoading,
    loadingMore: allLoadingMore,
    error: allError,
    hasMore: allHasMore,
    fetchData: fetchAllData,
    loadMore: loadAllMore,
    refresh: refreshAll,
  } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.PROBLEMS);

  // Одоо идэвхтэй табын дата
  const problems = activeTab === 'my' ? myProblems : allProblems;
  const loading = activeTab === 'my' ? myLoading : allLoading;
  const loadingMore = activeTab === 'my' ? myLoadingMore : allLoadingMore;
  const error = activeTab === 'my' ? myError : allError;
  const hasMore = activeTab === 'my' ? myHasMore : allHasMore;
  const refresh = activeTab === 'my' ? refreshMy : refreshAll;

  const loadMore = useCallback(async () => {
    // Энэ шалгалт хэвээрээ байж болно.
    // Энэ нь хэрэв observer хэт хурдан 2-3 удаа дуудвал
    // зөвхөн эхнийхийг нь ажиллуулах "давхар хамгаалалт" болно.
    if (loadingMore) {
      return;
    }

    try {
      if (activeTab === 'my') {
        await loadMyMore();
      } else {
        await loadAllMore();
      }
    } catch (err) {
      if (err?.response?.status === 403 || err?.response?.data?.membership_required) {
        if (!hasShownMembershipModal) {
          setMembershipMessage(
            err.response?.data?.detail ||
              'Дараагийн хуудсуудыг үзэхийн тулд гишүүнчлэл шаардлагатай'
          );
          setShowMembershipModal(true);
          setHasShownMembershipModal(true);
          localStorage.setItem('membershipModalShown', 'true');
        }
        return;
      }
      console.error('LoadMore error:', err);
    }
    // (!!!) ГОЛ ЗАСВАР: "loadingMore"-г доорх жагсаалтаас ХАССАН.
    // Ингэснээр 'loadMore' функц зөвхөн таб солигдох үед л шинэчлэгдэнэ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, loadMyMore, loadAllMore, hasShownMembershipModal]);

  // Infinite scroll-г хязгаарлах
  const shouldDisableInfiniteScroll =
    activeTab === 'all' && user && !user.is_member && hasShownMembershipModal;

  // Шинэчилсэн useInfiniteScroll hook-руу 'mainScrollRef'-г дамжуулах
  const { triggerRef } = useInfiniteScroll(
    loadMore,
    hasMore && !shouldDisableInfiniteScroll,
    loadingMore,
    mainScrollRef
  );
  const { toast, showToast, hideToast } = useToast();

  // Анхны ачаалалт
  useEffect(() => {
    setPageTitle('Бодлогын сан');
    fetchMyData();
    return () => setPageTitle('Нүүр');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Таб солих үед өгөгдөл ачаалах
  useEffect(() => {
    if (activeTab === 'all' && allProblems.length === 0 && !allLoading && !allError) {
      fetchAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, allProblems.length, allLoading, allError]);

  // Таб солих функц
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Хайлт хийх
  const handleSearch = ({ search }) => {
    const params = {};
    if (search) params.search = search;

    if (selectedTypes.length > 0) {
      params.type = selectedTypes.join(',');
    }
    if (selectedLevels.length > 0) {
      params.level = selectedLevels.join(',');
    }

    if (activeTab === 'my') {
      fetchMyData(params);
    } else {
      fetchAllData(params);
    }
  };

  // Type checkbox handler
  const handleTypeChange = (typeValue) => {
    setSelectedTypes((prev) =>
      prev.includes(typeValue) ? prev.filter((t) => t !== typeValue) : [...prev, typeValue]
    );
  };

  // Level checkbox handler
  const handleLevelChange = (levelValue) => {
    setSelectedLevels((prev) =>
      prev.includes(levelValue) ? prev.filter((l) => l !== levelValue) : [...prev, levelValue]
    );
  };

  // Шинэ бодлого үүсгэх
  const handleCreateNew = async () => {
    setCreatingNew(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS.INTEGRAL.PROBLEMS, {
        title: 'Шинэ бодлого (Гарчиггүй)',
        statement: 'Бодлогын өгүүлбэр...',
        type: 0,
        is_public: false,
      });
      navigate(`/problem/${response.data.uuid}/edit`);
    } catch {
      showToast(MESSAGES.ERROR.CREATE, 'danger');
    } finally {
      setCreatingNew(false);
    }
  };

  // Пост үүсгэх
  const handleCreatePost = (e, problem) => {
    e.stopPropagation();

    const prefillData = {
      type: 'problem',
      item: {
        id: problem.uuid,
        title: problem.title || `Бодлого #${problem.id}`,
      },
    };
    setPrefillData(prefillData);
    navigate('/');
  };

  // Problem type label
  const getProblemTypeLabel = (type) => {
    const types = {
      0: 'Уламжлалт',
      1: 'Сонгох тест',
      4: 'Нөхөх тест',
    };
    return types[type] || 'Тодорхойгүй';
  };

  // ✅ Loading State
  if (loading && problems.length === 0) {
    return <LoadingState message={MESSAGES.LOADING.DEFAULT} fullPage />;
  }

  // ✅ Error State
  if (error && problems.length === 0) {
    return <ErrorState message={error} onRetry={refresh} fullPage />;
  }

  return (
    <Container className="py-4">
      {/* ✅ Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ✅ Гишүүнчлэлийн Modal */}
      <Modal
        show={showMembershipModal}
        onHide={() => {
          setShowMembershipModal(false);
          if (!hasShownMembershipModal) {
            setHasShownMembershipModal(true);
            localStorage.setItem('membershipModalShown', 'true');
          }
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="w-100 text-center">
            <i className="bi bi-award fs-1 text-warning mb-3 d-block"></i>
            <div className="h3 mb-0">Гишүүнчлэл шаардлагатай</div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center px-5 py-4">
          <Alert variant="info" className="mb-4">
            <i className="bi bi-lock me-2"></i>
            {membershipMessage}
          </Alert>

          <h5 className="mb-4">Гишүүнчлэлийн давуу талууд:</h5>
          <ul className="text-start mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <li className="mb-2">✨ 1000+ бодлогын сан бүтнээр үзэх</li>
            <li className="mb-2">📚 Ангилал, түвшингээр шүүх</li>
            <li className="mb-2">🎯 Дэлгэрэнгүй бодолт, тайлбар</li>
            <li className="mb-2">💾 Дуртай бодлого хадгалах</li>
            <li className="mb-2">📊 Ахиц, статистик хянах</li>
            <li className="mb-2">👥 Хамтын бодлого шийдэх</li>
          </ul>

          <div className="d-grid gap-2">
            <Button
              variant="warning"
              size="lg"
              onClick={() => {
                navigate('/membership');
              }}
            >
              <i className="bi bi-award me-2"></i>
              Гишүүн болох
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => {
                setShowMembershipModal(false);
                setHasShownMembershipModal(true);
                localStorage.setItem('membershipModalShown', 'true');
              }}
            >
              Дараа
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ✅ Page Header */}
      <PageHeader
        title="Бодлогын сан"
        subtitle={`Нийт ${problems.length} бодлого`}
        action={
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-primary" size="sm" onClick={() => navigate('/problems/browse')}>
              <i className="bi bi-grid-3x3-gap me-1"></i>
              Ангиллаар үзэх
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              disabled={creatingNew}
            >
              {creatingNew ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                <>
                  <i className="bi bi-puzzle me-1"></i>
                  Шинэ бодлого
                </>
              )}
            </Button>
          </Stack>
        }
      />

      {/* ✅ Tab Navigation */}
      <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="my">
              <i className="bi bi-puzzle me-2"></i>
              Миний бодлогууд
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="all">
              <i className="bi bi-grid-3x3-gap me-2"></i>
              Бүх бодлого
              {user && !user.is_member && <i className="bi bi-lock ms-2 text-warning"></i>}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="my" active={activeTab === 'my'}>
            {renderTabContent()}
          </Tab.Pane>

          <Tab.Pane eventKey="all" active={activeTab === 'all'}>
            {renderTabContent()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ✅ Infinite Scroll Trigger - Tab.Container-ээс гадуур */}
      <div
        ref={triggerRef}
        style={{
          height: '1px',
          marginTop: '1px',
          visibility: 'hidden',
        }}
      />
    </Container>
  );

  // Табын агуулгыг рендерлэх функц
  function renderTabContent() {
    return (
      <>
        {/* ✅ Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          placeholder="Гарчиг, өгүүлбэр, бодолт, түлхүүр үгээр хайх..."
          loading={loading}
        />

        {/* Extended Search Toggle */}
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowExtendedSearch(!showExtendedSearch)}
          className="mb-2"
          aria-controls="extended-search"
          aria-expanded={showExtendedSearch}
        >
          <i className={`bi bi-funnel me-1`}></i>
          Нэмэлт шүүлтүүр
          <i className={`bi bi-chevron-${showExtendedSearch ? 'up' : 'down'} ms-1`}></i>
        </Button>

        {/* Extended Search Collapse */}
        <Collapse in={showExtendedSearch}>
          <Card className="mb-3" id="extended-search">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="fw-semibold mb-3">Төрөл</h6>
                  {[
                    { value: '0', label: 'Уламжлалт' },
                    { value: '1', label: 'Сонгох тест' },
                    { value: '4', label: 'Нөхөх тест' },
                  ].map((type) => (
                    <Form.Check
                      key={type.value}
                      type="checkbox"
                      id={`type-${type.value}`}
                      label={type.label}
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeChange(type.value)}
                      className="mb-2"
                    />
                  ))}
                </Col>
                <Col md={6}>
                  <h6 className="fw-semibold mb-3">Bloom's түвшин</h6>
                  <Form.Check
                    type="checkbox"
                    id="level-null"
                    label="Level-гүй"
                    checked={selectedLevels.includes('null')}
                    onChange={() => handleLevelChange('null')}
                    className="mb-2"
                  />
                  {[
                    { value: '1', label: 'Сэргээн санах' },
                    { value: '2', label: 'Ойлгох' },
                    { value: '3', label: 'Хэрэглэх' },
                    { value: '4', label: 'Задлан шинжлэх' },
                    { value: '5', label: 'Үнэлэх' },
                    { value: '6', label: 'Бүтээх' },
                  ].map((level) => (
                    <Form.Check
                      key={level.value}
                      type="checkbox"
                      id={`level-${level.value}`}
                      label={level.label}
                      checked={selectedLevels.includes(level.value)}
                      onChange={() => handleLevelChange(level.value)}
                      className="mb-2"
                    />
                  ))}
                </Col>
              </Row>
              <div className="mt-3 d-flex gap-2">
                <Button variant="primary" size="sm" onClick={() => handleSearch({ search: '' })}>
                  <i className="bi bi-search me-1"></i>
                  Хайх
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedLevels([]);
                    if (activeTab === 'my') {
                      fetchMyData({});
                    } else {
                      fetchAllData({});
                    }
                  }}
                >
                  Цэвэрлэх
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Collapse>

        {/* ✅ Loading State */}
        {loading && problems.length === 0 && (
          <LoadingState message={MESSAGES.LOADING.DEFAULT} fullPage />
        )}

        {/* ✅ Error State */}
        {error && problems.length === 0 && (
          <ErrorState message={error} onRetry={refresh} fullPage />
        )}

        {/* ✅ Empty State */}
        {!loading && problems.length === 0 && (
          <EmptyState
            icon={() => <i className="bi bi-puzzle"></i>}
            title={MESSAGES.EMPTY.NO_PROBLEMS}
            message="Шинэ бодлого нэмж эхлээрэй!"
            actionLabel="Шинэ бодлого"
            onAction={handleCreateNew}
          />
        )}

        {/* Problems Grid */}
        {problems.length > 0 && (
          <Row className="g-3">
            {problems.map((problem) => (
              <Col key={problem.id} xs={12}>
                <Card
                  className="h-100 shadow-sm hover-shadow transition"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/problem/${problem.uuid}`)}
                >
                  <Card.Body>
                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                      {problem.level_name && <Badge bg="secondary">{problem.level_name}</Badge>}
                      {problem.type !== undefined && (
                        <Badge bg="info">{getProblemTypeLabel(problem.type)}</Badge>
                      )}
                      {problem.is_public ? (
                        <Badge bg="success">Нийтийн</Badge>
                      ) : (
                        <Badge bg="secondary">
                          Хувийн
                        </Badge>
                      )}
                      {user && problem.author && user.id === problem.author.id && (
                        <Badge bg="primary">Миний</Badge>
                      )}

                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="ms-auto"
                        onClick={(e) => handleCreatePost(e, problem)}
                      >
                        <i className="bi bi-send me-1"></i>
                        Постлох
                      </Button>
                    </Stack>

                    {/* Гарчиг */}
                    <div className="h5 mb-2">
                      <LivePreview
                        content={stripPSTricks(problem.title || `Бодлого #${problem.id}`, 100)}
                      />
                    </div>

                    {/* Өгүүлбэр */}
                    <div className="text-muted small">
                      <LivePreview
                        content={stripPSTricks(problem.statement || 'Агуулга байхгүй', 200)}
                      />
                    </div>

                    {/* Мета мэдээлэл */}
                    <div className="text-muted small mt-2">
                      <i className="bi bi-person me-1"></i>
                      <UserName user={problem.author} />
                      {problem.last_edited && (
                        <>
                          <span className="mx-2">•</span>
                          <i className="bi bi-clock me-1"></i>
                          {formatDate(problem.last_edited)}
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* ✅ Loading More Indicator */}
        {loadingMore && (
          <div className="text-center mt-4 py-3">
            <Spinner animation="border" size="sm" />
            <span className="ms-2">{MESSAGES.LOADING.DEFAULT}</span>
          </div>
        )}

        {/* Stats */}
        {problems.length > 0 && (
          <>
            <div className="mt-4 p-3 bg-light rounded">
              <small className="text-muted">
                Нийт: <strong>{problems.length}</strong> бодлого
                {hasMore && <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>}
              </small>
            </div>

            {/* Гишүүн биш хүмүүст анхааруулга */}
            {activeTab === 'all' && user && !user.is_member && (
              <Alert variant="warning" className="mt-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <i className="bi bi-lock me-2"></i>
                    <strong>Анхаарна уу:</strong> Та эхний 20 бодлогыг үнэгүй үзэж байна. Бүх
                    бодлогын санг үзэхийг хүсвэл гишүүнээр элсэнэ үү.
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => {
                      setMembershipMessage(
                        'Бүх бодлогын санг үзэхийн тулд гишүүнчлэл шаардлагатай'
                      );
                      setShowMembershipModal(true);
                      setHasShownMembershipModal(true);
                      localStorage.setItem('membershipModalShown', 'true');
                    }}
                  >
                    <i className="bi bi-award me-1"></i>
                    Гишүүн болох
                  </Button>
                </div>
              </Alert>
            )}
          </>
        )}
      </>
    );
  }
};

export default ProblemsPage;
