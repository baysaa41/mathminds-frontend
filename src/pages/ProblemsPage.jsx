// frontend/src/pages/ProblemsPage.IMPROVED.jsx
// ✅ САЙЖРУУЛСАН: Нэгдсэн components, hooks, constants ашигласан

import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';

// ✅ Common Components
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';

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
import { Puzzle, Send, Lock, Crown } from 'lucide-react';

const ProblemsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // State
    const [activeTab, setActiveTab] = useState('my'); // 'my' эсвэл 'all'
    const [creatingNew, setCreatingNew] = useState(false);
    const [postingId, setPostingId] = useState(null);
    const [showMembershipModal, setShowMembershipModal] = useState(false);
    const [membershipMessage, setMembershipMessage] = useState('');
    const [hasShownMembershipModal, setHasShownMembershipModal] = useState(() => {
        // localStorage-с уншиж эхлүүлэх (reload хийсэн ч хадгалагдана)
        return localStorage.getItem('membershipModalShown') === 'true';
    });

    // Хоёр өөр endpoint-д зориулсан custom hook
    // Миний бодлогууд
    const {
        data: myProblems,
        loading: myLoading,
        loadingMore: myLoadingMore,
        error: myError,
        hasMore: myHasMore,
        fetchData: fetchMyData,
        loadMore: loadMyMore,
        refresh: refreshMy
    } = usePaginatedFetch(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}my_problems/`);

    // Бүх бодлогууд (зөвхөн гишүүдэд)
    const {
        data: allProblems,
        loading: allLoading,
        loadingMore: allLoadingMore,
        error: allError,
        hasMore: allHasMore,
        fetchData: fetchAllData,
        loadMore: loadAllMore,
        refresh: refreshAll
    } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.PROBLEMS);

    // Одоо идэвхтэй табын дата
    const problems = activeTab === 'my' ? myProblems : allProblems;
    const loading = activeTab === 'my' ? myLoading : allLoading;
    const loadingMore = activeTab === 'my' ? myLoadingMore : allLoadingMore;
    const error = activeTab === 'my' ? myError : allError;
    const hasMore = activeTab === 'my' ? myHasMore : allHasMore;
    const refresh = activeTab === 'my' ? refreshMy : refreshAll;

    // LoadMore wrapper - гишүүнчлэлийн алдааг барих
    const loadMore = async () => {
        try {
            if (activeTab === 'my') {
                await loadMyMore();
            } else {
                await loadAllMore();
            }
        } catch (err) {
            // 403 Forbidden эсвэл membership_required алдааг шалгах
            if (err?.response?.status === 403 || err?.response?.data?.membership_required) {
                // Хэрэв modal аль хэдийн харуулсан бол дахин харуулахгүй
                if (!hasShownMembershipModal) {
                    setMembershipMessage(
                        err.response?.data?.detail ||
                        'Дараагийн хуудсуудыг үзэхийн тулд гишүүнчлэл шаардлагатай'
                    );
                    setShowMembershipModal(true);
                    setHasShownMembershipModal(true);
                    // localStorage-д хадгалах (reload хийсэн ч санагдана)
                    localStorage.setItem('membershipModalShown', 'true');
                }
                // hasMore-г false болгох (цааш ачаалахгүй)
                return;
            }
            // Бусад алдаануудыг дахин throw хийх
            throw err;
        }
    };

    // Infinite scroll-г хязгаарлах - гишүүн биш + "Бүх бодлого" + аль хэдийн modal харуулсан
    const shouldDisableInfiniteScroll =
        activeTab === 'all' &&
        user &&
        !user.is_member &&
        hasShownMembershipModal;

    const { triggerRef } = useInfiniteScroll(
        loadMore,
        hasMore && !shouldDisableInfiniteScroll,  // hasMore-г зогсооно
        loadingMore
    );
    const { toast, showToast, hideToast } = useToast();

    // Анхны ачаалалт
    useEffect(() => {
        setPageTitle('Бодлогын сан');
        // Эхлээд миний бодлогуудыг ачаалах
        fetchMyData();
        return () => setPageTitle('Нүүр');
    }, []);

    // Таб солих үед өгөгдөл ачаалах
    useEffect(() => {
        if (activeTab === 'all' && allProblems.length === 0 && !allLoading && !allError) {
            fetchAllData();
        }
    }, [activeTab, allProblems.length, allLoading, allError]);

    // Таб солих функц
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    // Хайлт хийх
    const handleSearch = ({ search, published }) => {
        const params = {};
        if (search) params.search = search;
        if (published !== 'all') params.is_published = published === 'published';

        if (activeTab === 'my') {
            fetchMyData(params);
        } else {
            fetchAllData(params);
        }
    };

    // Шинэ бодлого үүсгэх
    const handleCreateNew = async () => {
        setCreatingNew(true);
        try {
            const response = await apiClient.post(API_ENDPOINTS.INTEGRAL.PROBLEMS, {
                title: 'Шинэ бодлого (Гарчиггүй)',
                statement: 'Бодлогын өгүүлбэр...',
                type: 0,
                is_published: false,
            });
            navigate(`/problem/${response.data.id}/edit`);
        } catch (err) {
            showToast(MESSAGES.ERROR.CREATE, 'danger');
        } finally {
            setCreatingNew(false);
        }
    };

    // Пост үүсгэх
    const handleCreatePost = async (e, problemId) => {
        e.stopPropagation();
        setPostingId(problemId);

        try {
            const response = await apiClient.post(
                API_ENDPOINTS.MINDS.CREATE_FROM_PROBLEM,
                { problem_id: problemId }
            );

            if (response.status === 201) {
                showToast(MESSAGES.SUCCESS.POST_CREATED, 'success');
            } else if (response.status === 200) {
                showToast(MESSAGES.SUCCESS.POST_ALREADY_EXISTS, 'info');
            }
        } catch (err) {
            showToast(
                err.response?.data?.error || MESSAGES.ERROR.GENERIC,
                'danger'
            );
        } finally {
            setPostingId(null);
        }
    };

    // Problem type label
    const getProblemTypeLabel = (type) => {
        const types = {
            0: 'Уламжлалт',
            1: 'Сонгох тест',
            4: 'Нөхөх тест'
        };
        return types[type] || 'Тодорхойгүй';
    };

    // ✅ Loading State
    if (loading && problems.length === 0) {
        return <LoadingState message={MESSAGES.LOADING.DEFAULT} fullPage />;
    }

    // ✅ Error State
    if (error && problems.length === 0) {
        return (
            <ErrorState
                message={error}
                onRetry={refresh}
                fullPage
            />
        );
    }

    return (
        <Container className="py-4">
            {/* ✅ Toast Notification */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast
                    show={toast.show}
                    onClose={hideToast}
                    delay={3000}
                    autohide
                    bg={toast.variant}
                >
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
                    // Modal хаагдах үед тэмдэглэх
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
                        <Crown size={48} className="text-warning mb-3" />
                        <div className="h3 mb-0">Гишүүнчлэл шаардлагатай</div>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center px-5 py-4">
                    <Alert variant="info" className="mb-4">
                        <Lock size={20} className="me-2" />
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
                                navigate('/membership'); // Эсвэл pricing хуудас
                                setShowMembershipModal(false);
                            }}
                        >
                            <Crown size={20} className="me-2" />
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
                action={{
                    label: 'Шинэ бодлого',
                    onClick: handleCreateNew,
                    icon: <i className="bi bi-puzzle  me-1"></i>
                }}
                loading={creatingNew}
            />

            {/* ✅ Tab Navigation */}
            <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
                <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                        <Nav.Link eventKey="my">
                            <Puzzle size={16} className="me-2" />
                            Миний бодлогууд
                        </Nav.Link>
                    </Nav.Item>
                    {/* Бүх хэрэглэгчид "Бүх бодлого" табыг харна */}
                    <Nav.Item>
                        <Nav.Link eventKey="all">
                            Бүх бодлого
                            {user && !user.is_member && (
                                <Lock size={14} className="ms-2 text-warning" />
                            )}
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
                    filters={[
                        {
                            name: 'published',
                            defaultValue: 'all',
                            options: [
                                { value: 'all', label: 'Бүгд' },
                                { value: 'published', label: 'Нийтэлсэн' },
                                { value: 'draft', label: 'Ноорог' }
                            ]
                        }
                    ]}
                    loading={loading}
                />

                {/* ✅ Loading State */}
                {loading && problems.length === 0 && (
                    <LoadingState message={MESSAGES.LOADING.DEFAULT} fullPage />
                )}

                {/* ✅ Error State */}
                {error && problems.length === 0 && (
                    <ErrorState
                        message={error}
                        onRetry={refresh}
                        fullPage
                    />
                )}

                {/* ✅ Empty State */}
                {!loading && problems.length === 0 && (
                    <EmptyState
                        icon={Puzzle}
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
                                    onClick={() => navigate(`/problem/${problem.id}`)}
                                >
                                    <Card.Body>
                                        <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                            {problem.level_name && (
                                                <Badge bg="secondary">{problem.level_name}</Badge>
                                            )}
                                            {problem.type !== undefined && (
                                                <Badge bg="info">{getProblemTypeLabel(problem.type)}</Badge>
                                            )}
                                            {problem.is_published ? (
                                                <Badge bg="success">Нийтлэгдсэн</Badge>
                                            ) : (
                                                <Badge bg="warning" text="dark">Ноорог</Badge>
                                            )}
                                            {user && problem.author && user.id === problem.author.id && (
                                                <Badge bg="primary">Миний</Badge>
                                            )}

                                            {/* Постлох товч */}
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="ms-auto"
                                                onClick={(e) => handleCreatePost(e, problem.id)}
                                                disabled={postingId === problem.id}
                                            >
                                                {postingId === problem.id ? (
                                                    <Spinner as="span" size="sm" />
                                                ) : (
                                                    <>
                                                        <Send size={14} className="me-1" />
                                                        Постлох
                                                    </>
                                                )}
                                            </Button>
                                        </Stack>

                                        {/* Гарчиг */}
                                        <div className="h5 mb-2">
                                            <LivePreview content={problem.title || `Бодлого #${problem.id}`} />
                                        </div>

                                        {/* Өгүүлбэр */}
                                        <div className="text-muted small">
                                            <LivePreview content={problem.statement || 'Агуулга байхгүй'} />
                                        </div>

                                        {/* Мета мэдээлэл */}
                                        <div className="text-muted small mt-2">
                                            <i className="bi bi-person me-1"></i>
                                            {problem.author?.first_name || problem.author?.email || 'N/A'}
                                            {problem.last_edited && (
                                                <>
                                                    <span className="mx-2">•</span>
                                                    <i className="bi bi-clock me-1"></i>
                                                    {new Date(problem.last_edited).toLocaleDateString()}
                                                </>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}

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
                {problems.length > 0 && (
                    <>
                        <div className="mt-4 p-3 bg-light rounded">
                            <small className="text-muted">
                                Нийт: <strong>{problems.length}</strong> бодлого
                                {hasMore && (
                                    <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>
                                )}
                            </small>
                        </div>

                        {/* Гишүүн биш хүмүүст анхааруулга - үргэлж харагдана */}
                        {activeTab === 'all' && user && !user.is_member && (
                            <Alert variant="warning" className="mt-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <Lock size={20} className="me-2" />
                                        <strong>Анхаарна уу:</strong> Та эхний 20 бодлогыг үнэгүй үзэж байна.
                                        Бүх бодлогын санг үзэхийг хүсвэл гишүүнээр элсэнэ үү.
                                    </div>
                                    <Button
                                        variant="warning"
                                        size="sm"
                                        onClick={() => {
                                            setMembershipMessage('Бүх бодлогын санг үзэхийн тулд гишүүнчлэл шаардлагатай');
                                            setShowMembershipModal(true);
                                            setHasShownMembershipModal(true);
                                            localStorage.setItem('membershipModalShown', 'true');
                                        }}
                                    >
                                        <Crown size={16} className="me-1" />
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