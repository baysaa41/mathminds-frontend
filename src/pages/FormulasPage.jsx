// frontend/src/pages/FormulasPage.jsx
// ✅ ШИНЭЧИЛСЭН: Custom hooks, common components ашигласан, ProblemsPage-тай адил бүтэцтэй

import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MathJax } from 'better-react-mathjax';

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
import { Calculator, Send } from 'lucide-react';

const FormulasPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // ✅ Custom Hooks ашиглах
    const {
        data: formulas,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh
    } = usePaginatedFetch(API_ENDPOINTS.INTEGRAL.FORMULAS);

    const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);
    const { toast, showToast, hideToast } = useToast();

    // State
    const [creatingNew, setCreatingNew] = useState(false);
    const [postingId, setPostingId] = useState(null);

    // Анхны ачаалалт
    useEffect(() => {
        setPageTitle('Томьёоны сан');
        fetchData();
        return () => setPageTitle('Нүүр');
    }, []);

    // Хайлт хийх
    const handleSearch = ({ search, published }) => {
        const params = {};
        if (search) params.search = search;
        if (published !== 'all') params.published = published === 'published';

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

    // Пост үүсгэх
    const handleCreatePost = async (e, formulaId) => {
        e.stopPropagation();
        setPostingId(formulaId);

        try {
            const response = await apiClient.post(
                API_ENDPOINTS.MINDS.CREATE_FROM_FORMULA,
                { formula_id: formulaId }
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

    // ✅ Loading State
    if (loading && formulas.length === 0) {
        return <LoadingState message={MESSAGES.LOADING.FORMULAS} fullPage />;
    }

    // ✅ Error State
    if (error && formulas.length === 0) {
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
                title="Томьёоны сан"
                subtitle={`Нийт ${formulas.length} томьёо`}
                action={{
                    label: 'Шинэ томьёо',
                    onClick: handleCreateNew,
                    icon: <i className="bi bi-infinity me-2"></i>
                }}
                loading={creatingNew}
            />

            {/* ✅ Search Bar */}
            <SearchBar
                onSearch={handleSearch}
                placeholder="Гарчиг, агуулгаар хайх..."
                filters={[
                    {
                        name: 'published',
                        defaultValue: 'all',
                        options: [
                            { value: 'all', label: 'Бүгд' },
                            { value: 'published', label: 'Нийтлэгдсэн' },
                            { value: 'draft', label: 'Ноорог' }
                        ]
                    }
                ]}
                loading={loading}
            />

            {/* ✅ Empty State */}
            {!loading && formulas.length === 0 && (
                <EmptyState
                    icon={Calculator}
                    title={MESSAGES.EMPTY.NO_FORMULAS}
                    message="Шинэ томьёо нэмж эхлээрэй!"
                    actionLabel="Шинэ томьёо"
                    onAction={handleCreateNew}
                />
            )}

            {/* Formulas Grid */}
            {formulas.length > 0 && (
                <Row className="g-3">
                    {formulas.map((formula) => (
                        <Col key={formula.id} xs={12}>
                            <Card
                                className="h-100 shadow-sm hover-shadow transition"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/formula/${formula.id}/edit`)}
                            >
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {formula.topic_name && (
                                            <Badge bg="info">{formula.topic_name}</Badge>
                                        )}
                                        {formula.published !== undefined && (
                                            formula.published ? (
                                                <Badge bg="success">Нийтлэгдсэн</Badge>
                                            ) : (
                                                <Badge bg="warning" text="dark">Ноорог</Badge>
                                            )
                                        )}
                                        {user && formula.author && user.id === formula.author.id && (
                                            <Badge bg="primary">Миний</Badge>
                                        )}

                                        {/* Постлох товч */}
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="ms-auto"
                                            onClick={(e) => handleCreatePost(e, formula.id)}
                                            disabled={postingId === formula.id}
                                        >
                                            {postingId === formula.id ? (
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
                                    <MathJax hideUntilTypeset={"first"}>
                                        <Card.Title className="h5 mb-2 mathjax-content">
                                            {formula.title || `Томьёо #${formula.id}`}
                                        </Card.Title>
                                    </MathJax>

                                    {/* Агуулга */}
                                    <Card.Text
                                        className="text-muted small"
                                        style={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        <LivePreview content={formula.content || 'Агуулга байхгүй'} />
                                    </Card.Text>

                                    {/* Мета мэдээлэл */}
                                    <div className="text-muted small mt-2">
                                        <i className="bi bi-person me-1"></i>
                                        {formula.author?.first_name || formula.author?.email || 'N/A'}
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
            {formulas.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        Нийт: <strong>{formulas.length}</strong> томьёо
                        {hasMore && (
                            <> • {MESSAGES.INFO.SCROLL_FOR_MORE}</>
                        )}
                    </small>
                </div>
            )}
        </Container>
    );
};

export default FormulasPage;