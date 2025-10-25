// frontend/src/pages/QuizzesPage.jsx
// (!!! ЗАСВАРЛАСАН: </Ert> -> </Alert> болгосон)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
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

const QuizzesPage = () => {
    // Үндсэн state-үүд
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Хайлт/Шүүлтүүрийн state-үүд
    const [searchQuery, setSearchQuery] = useState('');
    const [currentQuery, setCurrentQuery] = useState({ search: '' });

    // Infinite Scroll-н state-үүд
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // Үйлдэл гүйцэтгэх state-үүд
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Ref-үүд
    const loadMoreTriggerRef = useRef(null);
    const isHandlingLoadMore = useRef(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // Анхны ачаалалт
    useEffect(() => {
        setPageTitle('Тестийн сан');
        fetchQuizzes('', true); // Эхний ачаалалт

        return () => { setPageTitle('Нүүр'); };
    }, []);


    // --- Өгөгдөл татах функцууд (Сервер талын хайлт) ---

    const fetchQuizzes = async (query, isInitialLoad = false) => {
        if (!isInitialLoad) {
            setLoading(true);
        }
        setError(null);
        setNextPageUrl(null);
        isHandlingLoadMore.current = true;

        setCurrentQuery({ search: query });

        const params = {};
        if (query) {
            params.search = query;
        }

        try {
            // (!!!) QuizViewSet-г дуудах
            const response = await apiClient.get('/api/integral/quizzes/', { params });

            if (response.data && Array.isArray(response.data.results)) {
                setQuizzes(response.data.results); // Шинэ хайлт: "СОЛИХ"
                setNextPageUrl(response.data.next);
            } else {
                console.warn("API response error:", response.data);
                setQuizzes([]);
            }
        } catch (err) {
            setError('Тестүүдийг ачааллахад алдаа гарлаа.');
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
                    setQuizzes(prevQuizzes => [...prevQuizzes, ...response.data.results]); // Дараагийн хуудас: "НЭМЭХ"
                    setNextPageUrl(response.data.next);
                } else {
                    setNextPageUrl(null);
                }
            } else {
                setNextPageUrl(null);
            }
        } catch (err) {
            setError('Нэмэлт тест ачааллахад алдаа гарлаа.');
            console.error(err);
        } finally {
            setLoadingMore(false);
            setTimeout(() => {
                isHandlingLoadMore.current = false;
            }, 500);
        }
    }, [nextPageUrl]);

    // Intersection Observer
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
        fetchQuizzes(searchQuery);
    };


    // --- Үйлдэл гүйцэтгэх функцууд ---

    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        setError(null);
        try {
            const response = await apiClient.post('/api/integral/quizzes/', {
                title: 'Шинэ тест (Гарчиггүй)',
                description: 'Тестийн тайлбар...',
                is_published: false,
            });
            const newQuizId = response.data.id;
            // (!!!) QuizEditPage рүү үсрэх
            navigate(`/quiz/${newQuizId}/edit`);
        } catch (err) {
            console.error("Failed to create new quiz:", err);
            setError('Шинэ тест үүсгэхэд алдаа гарлаа.');
        } finally {
            setIsCreatingNew(false);
        }
    };


    // --- Render хэсэг ---

    if (loading && quizzes.length === 0 && !loadingMore) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error && !loadingMore) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" size="sm" onClick={() => fetchQuizzes(currentQuery.search)}>
                    Дахин оролдох
                </Button>
            </Container>
        );
    }

    const renderPageError = () => {
        if (error && loadingMore) {
            return <Alert variant="danger" className='mt-3'>{error}</Alert>
        }
        return null;
    }

    return (
        <Container className="py-4">

            {/* Толгой хэсэг */}
            <Stack direction="horizontal" gap={3} className="mb-4">
                <h1 className="h4 fw-bold mb-0">Тестийн сан</h1>
                <Button
                    variant="primary"
                    size="sm"
                    className="ms-auto"
                    onClick={handleCreateNew}
                    disabled={isCreatingNew}
                >
                    {isCreatingNew ? <Spinner as="span" size="sm" /> : '+ Шинэ тест'}
                </Button>
            </Stack>

            {/* Хайлт */}
            <Form onSubmit={handleSearchSubmit}>
                <Row className="mb-4 g-3">
                    <Col md={9}>
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Гарчиг, тайлбараар хайх..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={3}>
                        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                            {loading ? <Spinner as="span" size="sm" /> : 'Хайх'}
                        </Button>
                    </Col>
                </Row>
            </Form>

            {renderPageError()}

            {loading && quizzes.length === 0 && (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            )}

            {/* Тестүүдийн жагсаалт */}
            {!loading && quizzes.length === 0 ? (
                <Alert variant="info">
                    {currentQuery.search
                        ? 'Хайлтын үр дүн олдсонгүй.'
                        : 'Тест олдсонгүй.'}
                </Alert>
            ) : (
                <Row className="g-3">
                    {quizzes.map((quiz) => (
                        <Col key={quiz.id} xs={12}>
                            <Card
                                className="h-100 shadow-sm hover-shadow transition"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/quiz/${quiz.id}`)} // (!!!) Detail хуудас руу үсрэх
                            >
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {quiz.is_published ? (
                                            <Badge bg="success">Нийтлэгдсэн</Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark">Ноорог</Badge>
                                        )}
                                        {user && quiz.author && user.id === quiz.author.id && (
                                            <Badge bg="primary">Миний</Badge>
                                        )}
                                        {/* (!!!) Бодлогын тоог харуулах (backend-с `problems_count` ирнэ гэж таамаглав) */}
                                        <Badge bg="secondary" className="ms-auto">
                                            {quiz.problems_count || 0} бодлоготой
                                        </Badge>
                                    </Stack>

                                    <div className="h5 mb-2 mathjax-content">
                                        <LivePreview content={quiz.title || `Тест #${quiz.id}`} />
                                    </div>

                                    <div className="text-muted small mathjax-content">
                                        <LivePreview content={quiz.description || 'Тайлбар байхгүй...'} />
                                    </div>

                                    <div className="text-muted small mt-2">
                                        <i className="bi bi-person me-1"></i>
                                        {quiz.author?.first_name || quiz.author?.email || 'N/A'}
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

            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />

            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                    Нийт: <strong>{quizzes.length}</strong> тест
                    {currentQuery.search ? (
                        <> • (Одоогийн хайлтаар <strong>{quizzes.length}</strong> олдсон)</>
                    ) : null}
                    {nextPageUrl && !loading && (
                        <> • (Гүйлгэж илүү ихийг ачаална уу)</>
                    )}
                </small>
            </div>
        </Container>
    );
};

export default QuizzesPage;