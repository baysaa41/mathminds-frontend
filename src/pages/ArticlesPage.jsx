// frontend/src/pages/ArticlesPage.jsx
// (!!! ШИНЭЧИЛСЭН: "Постлох" товч болон Toast мэдэгдэл нэмсэн)

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
// (!!!) 1. Toast-г импортлох
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';


const ArticlesPage = () => {
    // Үндсэн state-үүд
    const [articles, setArticles] = useState([]);
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
    const [postingId, setPostingId] = useState(null); // (!!!) "Постлох" state

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
        setPageTitle('Өгүүллийн сан');
        fetchArticles('', true);

        return () => { setPageTitle('Нүүр'); };
    }, []);

    // (!!!) 3. Toast харуулах туслах функц
    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };


    // --- Өгөгдөл татах функцууд (хэвээрээ) ---

    const fetchArticles = async (query, isInitialLoad = false) => {
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
            const response = await apiClient.get('/api/integral/articles/', { params });

            if (response.data && Array.isArray(response.data.results)) {
                setArticles(response.data.results);
                setNextPageUrl(response.data.next);
            } else {
                console.warn("API response error:", response.data);
                setArticles([]);
            }
        } catch (err) {
            setError('Өгүүллүүдийг ачааллахад алдаа гарлаа.');
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
                    setArticles(prevArticles => [...prevArticles, ...response.data.results]);
                    setNextPageUrl(response.data.next);
                } else {
                    setNextPageUrl(null);
                }
            } else {
                setNextPageUrl(null);
            }
        } catch (err) {
            setError('Нэмэлт өгүүлэл ачааллахад алдаа гарлаа.');
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


    // Хайлтыг "Хайх" товч дарахад эхлүүлэх (хэвээрээ)
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchArticles(searchQuery);
    };


    // --- Үйлдэл гүйцэтгэх функцууд ---

    // Шинэ өгүүлэл үүсгэх (хэвээрээ)
    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        setError(null);
        try {
            const response = await apiClient.post('/api/integral/articles/', {
                title: 'Шинэ өгүүлэл (Гарчиггүй)',
                content: 'Өгүүллийн агуулга...',
                abstract: 'Товч хураангуй...',
            });
            const newArticleId = response.data.id;
            navigate(`/article/${newArticleId}/edit`);
        } catch (err) {
            console.error("Failed to create new article:", err);
            setError('Шинэ өгүүлэл үүсгэхэд алдаа гарлаа.');
        } finally {
            setIsCreatingNew(false);
        }
    };

    // (!!!) 4. Пост үүсгэх функц (ProblemsPage-ээс хуулсан)
    const handleCreatePost = async (e, articleId) => {
        e.stopPropagation(); // Карт дээрх onClick-г зогсоох
        setPostingId(articleId);
        setError(null);

        try {
            // (!!!) Шинэ API замаа дуудах
            const response = await apiClient.post('/api/minds/posts/create-from-article/', {
                article_id: articleId // (!!!) article_id гэж илгээнэ
            });

            if (response.status === 201) {
                showNotification('Пост амжилттай үүслээ!', 'success');
            } else if (response.status === 200 && response.data.message === "Post already exists.") {
                showNotification('Та энэ өгүүллийг аль хэдийн постлосон байна.', 'info');
            }

        } catch (err) {
            console.error('Failed to create post:', err);
            const errorMsg = err.response?.data?.error || 'Пост үүсгэхэд алдаа гарлаа.';
            showNotification(errorMsg, 'danger');
        } finally {
            setPostingId(null);
        }
    };


    // --- Render хэсэг ---

    if (loading && articles.length === 0 && !loadingMore) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error && !loadingMore && !postingId) { // (!!!) postingId үед алдаа харуулахгүй
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="outline-primary" size="sm" onClick={() => fetchArticles(currentQuery.search)}>
                    Дахин оролдох
                </Button>
            </Container>
        );
    }

    const renderPageError = () => {
        // (!!!) postingId үед алдааг Toast-р харуулж байгаа тул энд давхардуулахгүй
        if (error && (loadingMore)) {
            return <Alert variant="danger" className='mt-3'>{error}</Alert>
        }
        return null;
    }

    return (
        <Container className="py-4">

            {/* (!!!) 5. Toast Container-г нэмэх */}
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

            {/* Толгой хэсэг (хэвээрээ) */}
            <Stack direction="horizontal" gap={3} className="mb-4">
                <h1 className="h4 fw-bold mb-0">Өгүүллийн сан</h1>
                <Button
                    variant="primary"
                    size="sm"
                    className="ms-auto"
                    onClick={handleCreateNew}
                    disabled={isCreatingNew}
                >
                    {isCreatingNew ? <Spinner as="span" size="sm" /> : '+ Шинэ өгүүлэл'}
                </Button>
            </Stack>

            {/* Хайлт (хэвээрээ) */}
            <Form onSubmit={handleSearchSubmit}>
                <Row className="mb-4 g-3">
                    <Col md={9}>
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Гарчиг, агуулгаар хайх..."
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

            {loading && articles.length === 0 && (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            )}

            {/* Өгүүллүүдийн жагсаалт */}
            {!loading && articles.length === 0 ? (
                <Alert variant="info">
                    {currentQuery.search
                        ? 'Хайлтын үр дүн олдсонгүй.'
                        : 'Өгүүлэл олдсонгүй.'}
                </Alert>
            ) : (
                <Row className="g-3">
                    {articles.map((article) => (
                        <Col key={article.id} xs={12}>
                            <Card
                                className="h-100 shadow-sm hover-shadow transition"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/article/${article.id}`)}
                            >
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {article.published ? (
                                            <Badge bg="success">Нийтлэгдсэн</Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark">Ноорог</Badge>
                                        )}
                                        {user && article.author && user.id === article.author.id && (
                                            <Badge bg="primary">Миний</Badge>
                                        )}

                                        {/* (!!!) 6. "Постлох" товч нэмэх */}
                                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={(e) => handleCreatePost(e, article.id)} disabled={postingId === article.id}>
                                            {postingId === article.id ? <Spinner as="span" size="sm" /> : <i className="bi bi-send-plus me-1"></i> }
                                            {postingId !== article.id && 'Постлох'}
                                        </Button>
                                    </Stack>

                                    <div className="h5 mb-2 mathjax-content">
                                        <LivePreview content={article.title || `Өгүүлэл #${article.id}`} />
                                    </div>

                                    <div className="text-muted small mathjax-content">
                                        <LivePreview content={article.abstract || 'Хураангуй байхгүй...'} />
                                    </div>

                                    <div className="text-muted small mt-2">
                                        <i className="bi bi-person me-1"></i>
                                        {article.author?.first_name || article.author?.email || 'N/A'}
                                        {article.published && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <i className="bi bi-clock me-1"></i>
                                                {new Date(article.published).toLocaleDateString()}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* (!!!) Бусад хэсэг хэвээрээ */}
            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />

            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                    Нийт: <strong>{articles.length}</strong> өгүүлэл
                    {currentQuery.search ? (
                        <> • (Одоогийн хайлтаар <strong>{articles.length}</strong> олдсон)</>
                    ) : null}
                    {nextPageUrl && !loading && (
                        <> • (Гүйлгэж илүү ихийг ачаална уу)</>
                    )}
                </small>
            </div>
        </Container>
    );
};

export default ArticlesPage;