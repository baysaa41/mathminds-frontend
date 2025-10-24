// frontend/src/pages/FormulasPage.jsx (ШИНЭЧИЛСЭН)

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import { useAuth } from '../context/AuthContext.jsx';

// ... (React Bootstrap imports хэвээрээ) ...
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


const FormulasPage = () => {
    const [formulas, setFormulas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const [isCreatingNew, setIsCreatingNew] = useState(false);
    // (!!!) ШИНЭ: postingId state нэмэх
    const [postingId, setPostingId] = useState(null);

    const loadMoreTriggerRef = useRef(null);
    const isHandlingLoadMore = useRef(false);

    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        setPageTitle('Томьёоны сан');
        return () => { setPageTitle('Нүүр'); };
    }, [setPageTitle]);

    useEffect(() => {
        fetchFormulas();
    }, []);

    const fetchFormulas = async () => {
        try {
            setLoading(true); setError(null);
            const response = await apiClient.get('/api/integral/formulas/');
            if (response.data && Array.isArray(response.data.results)) {
                setFormulas(response.data.results); setNextPageUrl(response.data.next);
            } else if (Array.isArray(response.data)) {
                setFormulas(response.data); setNextPageUrl(null);
            } else { console.warn("API response error:", response.data); setFormulas([]); }
        } catch (err) { setError('Томьёог ачааллахад алдаа гарлаа.'); console.error(err);
        } finally { setLoading(false); }
    };

    const handleLoadMore = useCallback(async () => {
        if (!nextPageUrl || isHandlingLoadMore.current) return;
        isHandlingLoadMore.current = true; setLoadingMore(true); setError(null);
        try {
            const response = await apiClient.get(nextPageUrl);
            if (response.data && Array.isArray(response.data.results)) {
                if (response.data.results.length > 0) {
                    setFormulas(prev => [...prev, ...response.data.results]); setNextPageUrl(response.data.next);
                } else { setNextPageUrl(null); }
            } else { setNextPageUrl(null); }
        } catch (err) { setError('Нэмэлт томьёо ачааллахад алдаа гарлаа.'); console.error(err);
        } finally { setLoadingMore(false); setTimeout(() => { isHandlingLoadMore.current = false; }, 500); }
    }, [nextPageUrl]);

    useEffect(() => {
        const observer = new IntersectionObserver( (entries) => {
            const firstEntry = entries[0];
            if (firstEntry.isIntersecting && nextPageUrl && !isHandlingLoadMore.current) handleLoadMore();
        }, { threshold: 1.0 });
        const currentTrigger = loadMoreTriggerRef.current;
        if (currentTrigger) observer.observe(currentTrigger);
        return () => { if (currentTrigger) observer.unobserve(currentTrigger); };
    }, [nextPageUrl, handleLoadMore]);

    const handleCreateNew = async () => {
        setIsCreatingNew(true); setError(null);
        try {
            const response = await apiClient.post('/api/integral/formulas/', {
                title: 'Шинэ томьёо (Гарчиггүй)', content: 'Томьёоны агуулга...', published: false,
            });
            const newFormulaId = response.data.id;
            // (!!!) ШИНЭЧЛЭЛТ: Засварлах хуудас руу үсрэх
            navigate(`/formula/${newFormulaId}/edit`);
        } catch (err) { console.error("Failed to create new formula:", err); setError('Шинэ томьёо үүсгэхэд алдаа гарлаа.');
        } finally { setIsCreatingNew(false); }
    };

    // (!!!) ШИНЭ ФУНКЦ: handleCreatePost
    const handleCreatePost = async (e, formulaId) => {
        e.stopPropagation();
        setPostingId(formulaId); setError(null);
        try {
            // (!!!) Шинэ API endpoint-г дуудах
            const response = await apiClient.post('/api/minds/posts/create-from-formula/', {
                formula_id: formulaId
            });
            if (response.status === 201) alert('Пост амжилттай үүслээ!');
            else if (response.status === 200) alert('Та энэ томьёог аль хэдийн постлосон байна.');
        } catch (err) {
            console.error('Failed to create post from formula:', err);
            setError(err.response?.data?.error || 'Пост үүсгэхэд алдаа гарлаа.');
        } finally { setPostingId(null); }
    };

    const filteredFormulas = formulas.filter(formula => {
        const matchesSearch = formula.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            formula.content?.toLowerCase().includes(searchQuery.toLowerCase());
        let matchesFilter = true;
        if (filterStatus === 'published') matchesFilter = formula.published === true;
        else if (filterStatus === 'draft') matchesFilter = formula.published === false;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <Container className="d-flex justify-content-center py-5"><Spinner animation="border" /></Container>;
    if (error && !loadingMore && !postingId) return <Container className="mt-4"><Alert variant="danger">{error}</Alert><Button variant="outline-primary" size="sm" onClick={fetchFormulas}>Дахин оролдох</Button></Container>;
    const renderPageError = () => { if (error && (loadingMore || postingId)) return <Alert variant="danger" className='mt-3'>{error}</Alert>; return null; }

    return (
        <Container className="py-4">
            {/* Толгой хэсэг */}
            <Stack direction="horizontal" gap={3} className="mb-4">
                <h1 className="h4 fw-bold mb-0">Томьёоны сан</h1>
                <Button variant="primary" size="sm" className="ms-auto" onClick={handleCreateNew} disabled={isCreatingNew}>
                    {isCreatingNew ? <Spinner as="span" size="sm" /> : '+ Шинэ томьёо'}
                </Button>
            </Stack>
            {/* Хайлт ба шүүлтүүр */}
            <Row className="mb-4 g-3">
                <Col md={8}>
                    <InputGroup><InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text><Form.Control type="text" placeholder="Томьёо хайх..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></InputGroup>
                </Col>
                <Col md={4}><Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}><option value="all">Бүгд</option><option value="published">Нийтлэгдсэн</option><option value="draft">Ноорог</option></Form.Select></Col>
            </Row>
            {renderPageError()}
            {/* Томьёоны жагсаалт */}
            {filteredFormulas.length === 0 && !loading ? (<Alert variant="info">{searchQuery || filterStatus !== 'all' ? 'Хайлтын үр дүн олдсонгүй.' : 'Томьёо олдсонгүй.'}</Alert>) : (
                <Row className="g-3">
                    {filteredFormulas.map((formula) => (
                        <Col key={formula.id} xs={12}>
                            <Card className="h-100 shadow-sm hover-shadow transition" style={{ cursor: 'pointer' }} onClick={() => navigate(`/formula/${formula.id}/edit`)}> {/* (!!!) Edit хуудас руу үсрэх */}
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {formula.topic_name && (<Badge bg="info">{formula.topic_name}</Badge>)}
                                        {formula.published !== undefined && ( formula.published ? (<Badge bg="success">Нийтлэгдсэн</Badge>) : (<Badge bg="warning" text="dark">Ноорог</Badge>) )}
                                        {user && formula.author && user.id === formula.author.id && (<Badge bg="primary" className={postingId === null ? "ms-auto" : ""}>Миний</Badge>)}
                                        {/* (!!!) "Постлох" товч */}
                                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={(e) => handleCreatePost(e, formula.id)} disabled={postingId === formula.id}>
                                            {postingId === formula.id ? <Spinner as="span" size="sm" /> : <i className="bi bi-send-plus me-1"></i> }
                                            {postingId !== formula.id && 'Постлох'}
                                        </Button>
                                    </Stack>
                                    <MathJax hideUntilTypeset={"first"}><Card.Title className="h5 mb-2 mathjax-content">{formula.title || `Томьёо #${formula.id}`}</Card.Title></MathJax>
                                    <MathJax hideUntilTypeset={"first"}><Card.Text className="text-muted small mathjax-content" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: formula.content || 'Агуулга байхгүй' }} /></MathJax>
                                    <div className="text-muted small mt-2"><i className="bi bi-person me-1"></i>{formula.author?.first_name || formula.author?.email || 'N/A'}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
            {/* Infinite Scroll */}
            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />
            {loadingMore && <div className="text-center mt-4 py-3"><Spinner as="span" size="sm" /><span className="ms-2">Ачааллаж байна...</span></div>}
            {/* Статистик */}
            <div className="mt-4 p-3 bg-light rounded"><small className="text-muted">Нийт: <strong>{formulas.length}</strong> томьёо {searchQuery || filterStatus !== 'all' ? (<> • Харагдаж байгаа: <strong>{filteredFormulas.length}</strong></>) : null}</small></div>
        </Container>
    );
};

export default FormulasPage;