// frontend/src/pages/ProblemsPage.IMPROVED.jsx
// ✅ САЙЖРУУЛСАН: Нэгдсэн components, hooks, constants ашигласан

import { useEffect, useState } from 'react';
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
import { Puzzle, Send } from 'lucide-react';

const ProblemsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // ✅ Custom Hooks ашиглах
    const {
        data: problems,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh
    } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.PROBLEMS);

    const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);
    const { toast, showToast, hideToast } = useToast();

    // State
    const [creatingNew, setCreatingNew] = useState(false);
    const [postingId, setPostingId] = useState(null);

    // Анхны ачаалалт
    useEffect(() => {
        setPageTitle('Бодлогын сан');
        fetchData();
        return () => setPageTitle('Нүүр');
    }, []);

    // Хайлт хийх
    const handleSearch = ({ search, published }) => {
        const params = {};
        if (search) params.search = search;
        if (published !== 'all') params.is_published = published === 'published';

        fetchData(params);
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

            {/* ✅ Page Header */}
            <PageHeader
                title="Бодлогын сан"
                subtitle={`Нийт ${problems.length} бодлого`}
                action={{
                    label: 'Шинэ бодлого',
                    onClick: handleCreateNew,
                    icon: <Puzzle size={16} className="me-1" />
                }}
                loading={creatingNew}
            />

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
                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        Нийт: <strong>{problems.length}</strong> бодлого
                        {hasMore && (
                            <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>
                        )}
                    </small>
                </div>
            )}
        </Container>
    );
};

export default ProblemsPage;