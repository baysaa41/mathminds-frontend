// frontend/src/pages/ProblemsPage.jsx (Toast мэдэгдэлтэй болсон)

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
// (!!!) 1. Toast-г импортлох
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';


const ProblemsPage = () => {
    // Үндсэн state-үүд
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Хайлт/Шүүлтүүрийн state-үүд
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPublished, setFilterPublished] = useState('all');
    const [currentQuery, setCurrentQuery] = useState({ search: '', published: 'all' });

    // Infinite Scroll-н state-үүд
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Үйлдэл гүйцэтгэх state-үүд
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [postingId, setPostingId] = useState(null);

    // (!!!) 2. Toast state-үүдийг нэмэх
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    // Ref-үүд
    const loadMoreTriggerRef = useRef(null);
    const isHandlingLoadMore = useRef(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // Анхны ачаалалт
    useEffect(() => {
        setPageTitle('Бодлогын сан');
        fetchProblems('', 'all', true); // Эхний ачаалалт

        return () => { setPageTitle('Нүүр'); };
    }, []);

    // (!!!) 3. Toast харуулах туслах функц
    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    // --- Өгөгдөл татах функцууд (Сервер талын хайлт) ---

    const fetchProblems = async (query, published, isInitialLoad = false) => {
        if (!isInitialLoad) {
            setLoading(true);
        }
        setError(null);
        setNextPageUrl(null);
        isHandlingLoadMore.current = true;

        setCurrentQuery({ search: query, published: published });

        const params = {};
        if (query) {
            params.search = query;
        }
        if (published !== 'all') {
            params.is_published = (published === 'published');
        }

        try {
            const response = await apiClient.get('/api/integral/problems/', { params });

            if (response.data && Array.isArray(response.data.results)) {
                setProblems(response.data.results); // Шинэ хайлт: "СОЛИХ"
                setNextPageUrl(response.data.next);
            } else {
                console.warn("API response error:", response.data);
                setProblems([]);
            }
        } catch (err) {
            setError('Бодлогуудыг ачааллахад алдаа гарлаа.');
            console.error(err);
        } finally {
            setLoading(false);
            setTimeout(() => { isHandlingLoadMore.current = false; }, 500);
        }
    };

    const handleLoadMore = useCallback(async () => {
        if (!nextPageUrl || isHandlingLoadMore.current) {
            return;
        }

        isHandlingLoadMore.current = true;
        setLoadingMore(true);
        setError(null);

        try {
            const response = await apiClient.get(nextPageUrl);

            if (response.data && Array.isArray(response.data.results)) {
                if (response.data.results.length > 0) {
                    setProblems(prevProblems => [...prevProblems, ...response.data.results]); // Дараагийн хуудас: "НЭМЭХ"
                    setNextPageUrl(response.data.next);
                } else {
                    setNextPageUrl(null);
                }
            } else {
                setNextPageUrl(null);
            }
        } catch (err) {
            setError('Нэмэлт бодлого ачааллахад алдаа гарлаа.');
            console.error(err);
        } finally {
            setLoadingMore(false);
            setTimeout(() => {
                isHandlingLoadMore.current = false;
            }, 500);
        }
    }, [nextPageUrl]);

    // Intersection Observer (хэвээрээ)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && nextPageUrl && !isHandlingLoadMore.current) {
                    handleLoadMore();
                }
            }, { threshold: 1.0 }
        );
        const currentTrigger = loadMoreTriggerRef.current;
        if (currentTrigger) observer.observe(currentTrigger);
        return () => { if (currentTrigger) observer.unobserve(currentTrigger); };
    }, [nextPageUrl, handleLoadMore]);


    // Хайлтыг "Хайх" товч дарахад эхлүүлэх
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchProblems(searchQuery, filterPublished);
    };


    // --- Үйлдэл гүйцэтгэх функцууд ---

    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        setError(null);
        try {
            const response = await apiClient.post('/api/integral/problems/', {
                title: 'Шинэ бодлого (Гарчиггүй)',
                statement: 'Бодлогын өгүүлбэр...',
                type: 0,
                is_published: false,
            });
            const newProblemId = response.data.id;
            navigate(`/problem/${newProblemId}/edit`);
        } catch (err) {
            console.error("Failed to create new problem:", err);
            setError('Шинэ бодлого үүсгэхэд алдаа гарлаа.');
        } finally {
            setIsCreatingNew(false);
        }
    };

    // (!!!) 4. handleCreatePost-г alert-н оронд showNotification ашигладаг болгох
    const handleCreatePost = async (e, problemId) => {
        e.stopPropagation();
        setPostingId(problemId);
        setError(null);

        try {
            const response = await apiClient.post('/api/minds/posts/create-from-problem/', {
                problem_id: problemId
            });

            if (response.status === 201) {
                showNotification('Пост амжилттай үүслээ!', 'success'); // (!!!) ЗАСВАР
            } else if (response.status === 200 && response.data.message === "Post already exists.") {
                showNotification('Та энэ бодлогыг аль хэдийн постлосон байна.', 'info'); // (!!!) ЗАСВАР
            }

        } catch (err) {
            console.error('Failed to create post:', err);
            const errorMsg = err.response?.data?.error || 'Пост үүсгэхэд алдаа гарлаа.';
            // (!!!) Алдааг мөн toast-р харуулж болно
            showNotification(errorMsg, 'danger');
            // setError(errorMsg); // Эсвэл хуучнаар нь Alert харуулж болно
        } finally {
            setPostingId(null);
        }
    };

    const getProblemTypeLabel = (type) => {
        switch (type) {
            case 0: return 'Уламжлалт';
            case 1: return 'Сонгох тест';
            case 4: return 'Нөхөх тест';
            default: return 'Төрөл тодорхойгүй';
        }
    };

    // --- Render хэсэг ---

    if (loading && problems.length === 0 && !loadingMore) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error && !loadingMore && !postingId) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" size="sm" onClick={() => fetchProblems(currentQuery.search, currentQuery.published)}>
                    Дахин оролдох
                </Button>
            </Container>
        );
    }

    const renderPageError = () => {
        if (error && (loadingMore || postingId)) {
            return <Alert variant="danger" className='mt-3'>{error}</Alert>
        }
        return null;
    }

    return (
        <Container className="py-4">

            {/* (!!!) 5. Toast Container-г нэмэх (PostCard.jsx-с хуулсан) */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Body className={toastVariant === 'light' ? 'text-dark' : 'text-white'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            {/* Толгой хэсэг */}
            <Stack direction="horizontal" gap={3} className="mb-4">
                <h1 className="h4 fw-bold mb-0">Бодлогын сан</h1>
                <Button
                    variant="primary"
                    size="sm"
                    className="ms-auto"
                    onClick={handleCreateNew}
                    disabled={isCreatingNew}
                >
                    {isCreatingNew ? <Spinner as="span" size="sm" /> : '+ Шинэ бодлого'}
                </Button>
            </Stack>

            {/* Хайлт ба шүүлтүүр */}
            <Form onSubmit={handleSearchSubmit}>
                <Row className="mb-4 g-3">
                    <Col md={6}>
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Гарчиг, өгүүлбэр, бодолт, түлхүүр үгээр хайх..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={3}>
                        <Form.Select
                            value={filterPublished}
                            onChange={(e) => setFilterPublished(e.target.value)}
                        >
                            <option value="all">Бүгд (Нийтэлсэн/Ноорог)</option>
                            <option value="published">Зөвхөн Нийтлэгдсэн</option>
                            <option value="draft">Зөвхөн Ноорог</option>
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                            {loading ? <Spinner as="span" size="sm" /> : 'Хайх'}
                        </Button>
                    </Col>
                </Row>
            </Form>

            {renderPageError()}

            {/* Хайлт хийж байхад (problems хоосон үед) Spinner харуулах */}
            {loading && problems.length === 0 && (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            )}

            {/* Бодлогуудын жагсаалт */}
            {!loading && problems.length === 0 ? (
                <Alert variant="info">
                    {currentQuery.search || currentQuery.published !== 'all'
                        ? 'Хайлтын үр дүн олдсонгүй.'
                        : 'Бодлого олдсонгүй.'}
                </Alert>
            ) : (
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
                                            <Badge bg="secondary" className="text-uppercase">
                                                {problem.level_name}
                                            </Badge>
                                        )}
                                        {problem.type !== undefined && (
                                            <Badge bg="info">
                                                {getProblemTypeLabel(problem.type)}
                                            </Badge>
                                        )}
                                        {problem.is_published ? (
                                            <Badge bg="success">Нийтлэгдсэн</Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark">Ноорог</Badge>
                                        )}
                                        {user && problem.author && user.id === problem.author.id && (
                                            <Badge bg="primary">Миний</Badge>
                                        )}
                                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={(e) => handleCreatePost(e, problem.id)} disabled={postingId === problem.id}>
                                            {postingId === problem.id ? <Spinner as="span" size="sm" /> : <i className="bi bi-send-plus me-1"></i> }
                                            {postingId !== problem.id && 'Постлох'}
                                        </Button>
                                    </Stack>

                                    <div className="h5 mb-2 mathjax-content">
                                        <LivePreview content={problem.title || `Бодлого #${problem.id}`} />
                                    </div>

                                    <div className="text-muted small mathjax-content">
                                        <LivePreview content={problem.statement || 'Агуулга байхгүй'} />
                                    </div>

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

            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />

            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                    Нийт: <strong>{problems.length}</strong> бодлого
                    {currentQuery.search || currentQuery.published !== 'all' ? (
                        <> • (Одоогийн хайлтаар <strong>{problems.length}</strong> олдсон)</>
                    ) : null}
                    {nextPageUrl && !loading && (
                        <> • (Гүйлгэж илүү ихийг ачаална уу)</>
                    )}
                </small>
            </div>
        </Container>
    );
};

export default ProblemsPage;