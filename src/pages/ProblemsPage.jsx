// frontend/src/pages/ProblemsPage.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
// (!!!) MathJaxContext-г эндээс хассан (Layout.jsx-с авна)
import { MathJax } from 'better-react-mathjax';
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

// (!!!) mathJaxConfig-г эндээс хассан (Layout.jsx-с авна)

const ProblemsPage = () => {
    // Үндсэн state-үүд
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPublished, setFilterPublished] = useState('all');

    // Infinite Scroll-н state-үүд
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Үйлдэл гүйцэтгэх state-үүд
    const [isCreatingNew, setIsCreatingNew] = useState(false); // "+ Шинэ бодлого"
    const [postingId, setPostingId] = useState(null); // "Постлох"

    // Infinite Scroll-н ref-үүд
    const loadMoreTriggerRef = useRef(null);
    const isHandlingLoadMore = useRef(false); // Төгсгөлгүй давталтаас сэргийлэх "цоож"

    // Context болон navigation
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // Хуудасны гарчиг тохируулах
    useEffect(() => {
        setPageTitle('Бодлогын сан');
        return () => {
            setPageTitle('Нүүр');
        };
    }, [setPageTitle]);

    // Анхны өгөгдөл татах
    useEffect(() => {
        fetchProblems();
    }, []);

    // --- Өгөгдөл татах функцууд ---

    const fetchProblems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/api/integral/problems/');

            // Pagination-г зөв таних (response.data.results)
            if (response.data && Array.isArray(response.data.results)) {
                setProblems(response.data.results);
                setNextPageUrl(response.data.next);
            } else if (Array.isArray(response.data)) {
                setProblems(response.data);
                setNextPageUrl(null); // Pagination байхгүй тохиолдол
            } else {
                console.warn("API-аас хүлээгдэж буй массив ирсэнгүй:", response.data);
                setProblems([]);
            }

        } catch (err) {
            setError('Бодлогуудыг ачааллахад алдаа гарлаа.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // "Infinite Scroll" үед дараагийн хуудсыг ачаалах
    const handleLoadMore = useCallback(async () => {
        if (!nextPageUrl || isHandlingLoadMore.current) {
            return;
        }

        isHandlingLoadMore.current = true; // Цоожлох
        setLoadingMore(true);
        setError(null);

        try {
            const response = await apiClient.get(nextPageUrl);

            if (response.data && Array.isArray(response.data.results)) {
                // "Хоосон хуудасны алдаа"-г засах
                if (response.data.results.length > 0) {
                    setProblems(prevProblems => [...prevProblems, ...response.data.results]);
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

            // "Дахин дуудах хугацаа" (Debounce)
            setTimeout(() => {
                isHandlingLoadMore.current = false; // 0.5 секундын дараа цоожийг тайлах
            }, 500);
        }
    }, [nextPageUrl]);


    // Intersection Observer-г тохируулах (Infinite Scroll)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && nextPageUrl && !isHandlingLoadMore.current) {
                    handleLoadMore();
                }
            },
            {
                threshold: 1.0
            }
        );

        const currentTrigger = loadMoreTriggerRef.current;
        if (currentTrigger) {
            observer.observe(currentTrigger);
        }

        return () => {
            if (currentTrigger) {
                observer.unobserve(currentTrigger);
            }
        };
    }, [nextPageUrl, handleLoadMore]);


    // --- Үйлдэл гүйцэтгэх функцууд ---

    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        setError(null);
        try {
            // Backend-д хоосон бодлого үүсгэх (POST)
            const response = await apiClient.post('/api/integral/problems/', {
                title: 'Шинэ бодлого (Гарчиггүй)',
                statement: 'Бодлогын өгүүлбэр...',
                type: 0,
                is_published: false,
            });

            // Шинэ бодлогын засварлах хуудас руу үсрэх
            const newProblemId = response.data.id;
            navigate(`/problem/${newProblemId}/edit`);

        } catch (err) {
            console.error("Failed to create new problem:", err);
            setError('Шинэ бодлого үүсгэхэд алдаа гарлаа.');
        } finally {
            setIsCreatingNew(false);
        }
    };

    const handleCreatePost = async (e, problemId) => {
        e.stopPropagation();

        setPostingId(problemId);
        setError(null);

        try {
            const response = await apiClient.post('/api/minds/posts/create-from-problem/', {
                problem_id: problemId
            });

            if (response.status === 201) {
                alert('Пост амжилттай үүслээ!');
            } else if (response.status === 200 && response.data.message === "Post already exists.") {
                alert('Та энэ бодлогыг аль хэдийн постлосон байна.');
            }

        } catch (err) {
            console.error('Failed to create post:', err);
            const errorMsg = err.response?.data?.error || 'Пост үүсгэхэд алдаа гарлаа.';
            setError(errorMsg);
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

    // Хайлт ба шүүлтүүр
    const filteredProblems = problems.filter(problem => {
        const matchesSearch = problem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            problem.statement?.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesFilter = true;
        if (filterPublished === 'published') {
            matchesFilter = problem.is_published === true;
        } else if (filterPublished === 'draft') {
            matchesFilter = problem.is_published === false;
        }
        return matchesSearch && matchesFilter;
    });

    // --- Render хэсэг ---

    if (loading) {
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
                <Button variant="outline-primary" size="sm" onClick={fetchProblems}>
                    Дахин оролдох
                </Button>
            </Container>
        );
    }

    // Ачааллаж байх үеийн (loadingMore) эсвэл Постлох үеийн (postingId) алдааг тусад нь харуулах
    const renderPageError = () => {
        if (error && (loadingMore || postingId)) {
            return <Alert variant="danger" className='mt-3'>{error}</Alert>
        }
        return null;
    }

    return (
        // (!!!) MathJaxContext-г эндээс хассан. Layout.jsx-с өвлөгдөнө.
        <Container className="py-4">
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
                    {isCreatingNew ? (
                        <Spinner as="span" animation="border" size="sm" />
                    ) : (
                        '+ Шинэ бодлого'
                    )}
                </Button>
            </Stack>

            {/* Хайлт ба шүүлтүүр */}
            <Row className="mb-4 g-3">
                <Col md={8}>
                    <InputGroup>
                        <InputGroup.Text>
                            <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            placeholder="Бодлого хайх..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </InputGroup>
                </Col>
                <Col md={4}>
                    <Form.Select
                        value={filterPublished}
                        onChange={(e) => setFilterPublished(e.target.value)}
                    >
                        <option value="all">Бүгд</option>
                        <option value="published">Нийтлэгдсэн</option>
                        <option value="draft">Ноорог</option>
                    </Form.Select>
                </Col>
            </Row>

            {/* Үйлдэл гүйцэтгэх үеийн алдаа */}
            {renderPageError()}

            {/* Бодлогуудын жагсаалт */}
            {filteredProblems.length === 0 && !loading ? (
                <Alert variant="info">
                    {searchQuery || filterPublished !== 'all'
                        ? 'Хайлтын үр дүн олдсонгүй.'
                        : 'Бодлого олдсонгүй. Эхний бодлогоо үүсгэнэ үү!'}
                </Alert>
            ) : (
                <Row className="g-3">
                    {filteredProblems.map((problem) => (
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
                                            <Badge bg="primary">
                                                Миний
                                            </Badge>
                                        )}

                                        {/* "Постлох" товч */}
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="ms-auto"
                                            onClick={(e) => handleCreatePost(e, problem.id)}
                                            disabled={postingId === problem.id}
                                        >
                                            {postingId === problem.id ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <i className="bi bi-send-plus me-1"></i>
                                            )}
                                            {postingId !== problem.id && 'Постлох'}
                                        </Button>
                                    </Stack>

                                    <MathJax hideUntilTypeset={"first"}>
                                        <Card.Title className="h5 mb-2 mathjax-content">
                                            {problem.title || `Бодлого #${problem.id}`}
                                        </Card.Title>
                                    </MathJax>

                                    {/* (!!!) Өгүүлбэрийг бүтнээр нь харуулах ЗАСВАР */}
                                    <MathJax hideUntilTypeset={"first"}>
                                        <Card.Text
                                            className="text-muted small mathjax-content"
                                            // (!!!) style болон substring()-г хассан
                                            dangerouslySetInnerHTML={{
                                                __html: problem.statement || 'Агуулга байхгүй'
                                            }}
                                        />
                                    </MathJax>

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

            {/* Ачааллах trigger (энэ нь үл үзэгдэх ба гүйлгэлт мэдрэх зорилготой) */}
            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />

            {/* Дараагийн хуудсыг ачааллаж байх үед харагдах Spinner */}
            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                    />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            {/* Статистик */}
            <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                    Нийт: <strong>{problems.length}</strong> бодлого
                    {searchQuery || filterPublished !== 'all' ? (
                        <> • Харагдаж байгаа: <strong>{filteredProblems.length}</strong></>
                    ) : null}
                </small>
            </div>
        </Container>
    );
};

export default ProblemsPage;