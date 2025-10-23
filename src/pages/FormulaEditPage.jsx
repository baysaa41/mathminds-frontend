// frontend/src/pages/FormulaEditPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
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
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import CloseButton from 'react-bootstrap/CloseButton';

// --- Debounce Hook ---
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

// --- Preview Компонент ---
const LivePreview = ({ content }) => {
    if (!content) return <div className="text-muted small">(Preview)</div>;
    return (
        <div className="mathjax-preview-wrapper" style={{ border: '1px solid #ccc', padding: '15px', marginTop: '10px', backgroundColor: '#f9f9f9' }}>
            <MathJax hideUntilTypeset={"first"}>
                <span dangerouslySetInnerHTML={{ __html: content.replace(/\n\n/g, '<br/><br/>') }} />
            </MathJax>
        </div>
    );
};

// --- Томьёо Засварлах Хуудас ---
const FormulaEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const { user } = useAuth();

    const [formula, setFormula] = useState(null);
    const [topics, setTopics] = useState([]);
    const [keywords, setKeywords] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [keywordSearch, setKeywordSearch] = useState('');
    const [keywordResults, setKeywordResults] = useState([]);
    const [loadingKeywords, setLoadingKeywords] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const debouncedContent = useDebounce(formula?.content || '', 500);

    // --- Data Fetching ---
    useEffect(() => {
        setPageTitle('Томьёо засах');
        fetchFormula(id);
        fetchTopics();
    }, [id, setPageTitle]);

    const fetchFormula = async (formulaId) => {
        try {
            setLoading(true); setError(null);
            const response = await apiClient.get(`/api/minds/formulas/${formulaId}/`);

            // (!!!) ЗАСВАР: topic object-ыг ID болгож хөрвүүлэх
            const formulaData = response.data;
            if (formulaData.topic && typeof formulaData.topic === 'object') {
                formulaData.topic = formulaData.topic.id; // object-ыг ID болгох
            }

            setFormula(formulaData);
            setKeywords(response.data.keywords || []);
            setPageTitle(response.data.title || `Томьёо #${formulaId} засах`);
        } catch (err) {
            console.error(err);
            setError('Томьёо ачаалахад алдаа гарлаа.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopics = async () => {
        try {
            const response = await apiClient.get('/api/integral/topics/');
            if (response.data && Array.isArray(response.data.results)) {
                setTopics(response.data.results);
            } else if (Array.isArray(response.data)) {
                setTopics(response.data);
            } else {
                console.warn("API-с сэдвүүдийн жагсаалт ирсэнгүй:", response.data);
                setTopics([]);
            }
        } catch (err) {
            console.error("Failed to fetch topics:", err);
            setTopics([]);
        }
    };

    // --- Form Handlers ---
    const handleFormulaChange = (e) => {
        const { name, value, type, checked } = e.target;
        let processedValue;
        if (type === 'checkbox' || name === 'published') {
            processedValue = checked;
        } else if (name === 'topic') {
            // (!!!) ЗАСВАР: topic-г зөв integer болгох
            const parsedValue = value === '' ? null : parseInt(value, 10);
            processedValue = isNaN(parsedValue) ? null : parsedValue;
        } else {
            processedValue = value;
        }
        setFormula(prev => ({ ...prev, [name]: processedValue }));
    };

    // --- Keyword Handlers ---
    useEffect(() => {
        if (keywordSearch.length < 2) { setKeywordResults([]); return; }
        const searchKeywords = async () => {
            setLoadingKeywords(true);
            try {
                const response = await apiClient.get(`/api/integral/keywords/search/?q=${keywordSearch}`);
                let results = [];
                if (response.data && Array.isArray(response.data.results)) results = response.data.results;
                else if (Array.isArray(response.data)) results = response.data;
                const currentKeywordIds = new Set(keywords.map(k => k.id));
                setKeywordResults(results.filter(k => !currentKeywordIds.has(k.id)));
            } catch (err) { console.error("Keyword search error:", err); setKeywordResults([]); }
            setLoadingKeywords(false);
        };
        const timer = setTimeout(searchKeywords, 300);
        return () => clearTimeout(timer);
    }, [keywordSearch, keywords]);

    const addKeyword = async (keyword) => {
        setKeywords([...keywords, keyword]); setKeywordSearch(''); setKeywordResults([]);
        try {
            await apiClient.post(`/api/minds/formulas/${id}/keywords/add/`, { keyword_id: keyword.id });
        } catch (err) { console.error("Failed to add keyword:", err); setError('Түлхүүр үг нэмэхэд алдаа гарлаа.'); setKeywords(prev => prev.filter(k => k.id !== keyword.id)); }
    };

    const removeKeyword = async (keywordToRemove) => {
        setKeywords(prev => prev.filter(k => k.id !== keywordToRemove.id));
        try {
            await apiClient.post(`/api/minds/formulas/${id}/keywords/remove/`, { keyword_id: keywordToRemove.id });
        } catch (err) { console.error("Failed to remove keyword:", err); setError('Түлхүүр үг устгахад алдаа гарлаа.'); setKeywords(prev => [...prev, keywordToRemove]); }
    };

    // --- Save, Delete, Clone Handlers ---
    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError(null);

        // (!!!) ЗАСВАР: payload-д topic-г зөв integer-ээр илгээх
        const payload = {
            title: formula.title,
            content: formula.content,
            topic: formula.topic || null, // Энэ нь аль хэдийн integer ID байх ёстой
            published: formula.published,
            status: formula.status || 'draft',
        };

        console.log("Saving formula with payload:", payload); // Debug

        try {
            await apiClient.patch(`/api/minds/formulas/${id}/`, payload);
            navigate(`/formulas`);
        } catch (err) {
            console.error("Failed to save formula:", err);
            console.error("Error response:", err.response?.data); // Debug
            setError(err.response?.data?.detail || err.response?.data?.topic?.[0] || 'Томьёог хадгалахад алдаа гарлаа.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setShowDeleteModal(false); setSaving(true);
        try {
            await apiClient.delete(`/api/minds/formulas/${id}/`);
            navigate('/formulas');
        } catch (err) { console.error("Failed to delete formula:", err); setError('Томьёог устгахад алдаа гарлаа.'); setSaving(false); }
    };

    const handleClone = async () => {
        setSaving(true);
        try {
            const response = await apiClient.post(`/api/minds/formulas/${id}/clone/`);
            navigate(`/formula/${response.data.new_id}/edit`);
        } catch (err) { console.error("Failed to clone formula:", err); setError('Томьёог хувилах үед алдаа гарлаа.');
        } finally { setSaving(false); }
    };

    // --- Render ---
    if (loading) return <Container className="d-flex justify-content-center py-5"><Spinner animation="border" /></Container>;
    if (error && !saving) return <Container className="mt-4"><Alert variant="danger">{error}</Alert><Button variant="outline-primary" size="sm" onClick={() => fetchFormula(id)}>Дахин оролдох</Button></Container>;
    if (!formula) return <Container className="mt-4"><Alert variant="warning">Томьёо олдсонгүй.</Alert></Container>;

    return (
        <Container className="py-4 mb-5">
            <Form onSubmit={handleSave}>
                {/* Толгой хэсэг */}
                <Stack direction="horizontal" gap={3} className="mb-3">
                    <h2 className="h4 fw-bold mb-0">{formula.title || `Томьёо #${id} засах`}</h2>
                    <div className="ms-auto">
                        <Button variant="outline-primary" size="sm" onClick={handleClone} disabled={saving} className="me-2" title="Хувилах"><i className="bi bi-copy"></i>Хувилах</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => setShowDeleteModal(true)} disabled={saving} title="Устгах"><i className="bi bi-trash"></i>Устгах</Button>
                    </div>
                </Stack>

                {/* Үндсэн Карт */}
                <Card>
                    <Card.Body className="p-4">
                        {/* Гарчиг, Сэдэв */}
                        <Row>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label htmlFor="id_title">Гарчиг</Form.Label>
                                    <Form.Control type="text" name="title" id="id_title" value={formula.title || ''} onChange={handleFormulaChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label htmlFor="id_topic">Сэдэв</Form.Label>
                                    {/* (!!!) ЗАСВАР: value-г formula.topic (integer ID) болгох */}
                                    <Form.Select
                                        name="topic"
                                        id="id_topic"
                                        value={formula.topic || ''}
                                        onChange={handleFormulaChange}
                                    >
                                        <option value="">---------</option>
                                        {topics.map(topic => (
                                            <option key={topic.id} value={topic.id}>{topic.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Томьёоны агуулга */}
                        <Form.Group className="mb-3">
                            <Form.Label htmlFor="id_content">Агуулга</Form.Label>
                            <Form.Control as="textarea" name="content" id="id_content" rows={10} value={formula.content || ''} onChange={handleFormulaChange} className="font-monospace" />
                            <LivePreview content={debouncedContent} />
                        </Form.Group>

                        {/* Нийтлэх */}
                        <Row>
                            <Col md={4} className="d-flex align-items-center pt-3">
                                <Form.Check type="switch" id="id_published" label="Нийтлэх" name="published" checked={formula.published || false} onChange={handleFormulaChange} />
                            </Col>
                        </Row>

                        <hr />

                        {/* --- Түлхүүр үгс (Keywords) --- */}
                        <div id="keywords-manager">
                            <h4>Холбоотой түлхүүр үгс</h4>
                            <div id="current-keywords-list" className="mb-3">
                                {keywords.map(kw => (<Badge bg="secondary" key={kw.id} className="me-1 keyword-badge" pill>{kw.name}<CloseButton variant="white" className="ms-1" style={{ fontSize: '0.65em' }} onClick={() => removeKeyword(kw)} /></Badge>))}
                            </div>
                            <Form.Label htmlFor="keyword-search-input">Түлхүүр үг хайж нэмэх:</Form.Label>
                            <InputGroup className="mb-1">
                                <Form.Control type="text" id="keyword-search-input" placeholder="Дор хаяж 2 үсэг бичнэ үү..." value={keywordSearch} onChange={(e) => setKeywordSearch(e.target.value)} />
                                {loadingKeywords && <InputGroup.Text><Spinner animation="border" size="sm" /></InputGroup.Text>}
                            </InputGroup>
                            {keywordResults.length > 0 && (
                                <ListGroup id="keyword-search-results">
                                    {keywordResults.map(kw => (<ListGroup.Item key={kw.id} action onClick={() => addKeyword(kw)}>{kw.name}</ListGroup.Item>))}
                                </ListGroup>
                            )}
                        </div>

                    </Card.Body>
                    <Card.Footer className="d-flex justify-content-end">
                        {error && <Alert variant="danger" className="py-2 me-auto">{error}</Alert>}
                        <Button variant="secondary" className="me-2" onClick={() => navigate('/formulas')} disabled={saving}>Цуцлах</Button>
                        <Button type="submit" variant="primary" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Хадгалах'}</Button>
                    </Card.Footer>
                </Card>
            </Form>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Устгахыг баталгаажуулах</Modal.Title></Modal.Header>
                <Modal.Body>Та "{formula.title || `Томьёо #${id}`}"-г устгахдаа итгэлтэй байна уу?</Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Цуцлах</Button><Button variant="danger" onClick={handleDelete}>Устгах</Button></Modal.Footer>
            </Modal>
        </Container>
    );
};

export default FormulaEditPage;