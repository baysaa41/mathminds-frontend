// frontend/src/pages/FormulaEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Tiptap Rich Text Editor + Visual/Source/Preview режим

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import RichTextEditor from '../components/RichTextEditor';

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
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// Lucide React Icons
import {
  Edit3,
  Save,
  X,
  Trash2,
  Copy,
  Check,
  FileText,
  AlignLeft,
  Eye,
  Code2,
  Tag,
  Layers,
  Home,
  Calculator,
} from 'lucide-react';

// --- Томьёо Засварлах Хуудас ---
const FormulaEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [viewMode, setViewMode] = useState('source'); // 'visual' or 'source' - default: source
  const [isCopied, setIsCopied] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');

  // --- Data Fetching ---
  useEffect(() => {
    setPageTitle('Томьёо засах');
    fetchFormula(id);
    fetchTopics();
  }, [id, setPageTitle]);

  const fetchFormula = async (formulaId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/integral/formulas/${formulaId}/`);

      const formulaData = response.data;

      // Topic-г integer ID болгох
      if (formulaData.topic) {
        if (typeof formulaData.topic === 'object' && formulaData.topic.id) {
          formulaData.topic = parseInt(formulaData.topic.id, 10);
        } else if (typeof formulaData.topic === 'string') {
          formulaData.topic = parseInt(formulaData.topic, 10);
        } else if (typeof formulaData.topic !== 'number') {
          formulaData.topic = null;
        }
      } else {
        formulaData.topic = null;
      }

      setFormula({ ...formulaData, is_public: formulaData.is_public ?? false });
      setKeywords(response.data.keywords || []);
      setOriginalTitle(response.data.title || '');
      const t = response.data.title || `Томьёо #${formulaId}`;
      setPageTitle(`Томьёо засах · ${t}`);
    } catch (err) {
      console.error('Failed to fetch formula:', err);
      setError('Томьёо ачаалахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await apiClient.get('/api/integral/topics/');

      let topicsArray = [];
      if (response.data && Array.isArray(response.data.results)) {
        topicsArray = response.data.results;
      } else if (Array.isArray(response.data)) {
        topicsArray = response.data;
      } else {
        console.warn('API-с сэдвүүдийн жагсаалт ирсэнгүй:', response.data);
      }

      setTopics(topicsArray);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
      setTopics([]);
    }
  };

  // --- Form Handlers ---
  const handleFormulaChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue;

    if (type === 'checkbox' || name === 'is_public') {
      processedValue = checked;
    } else if (name === 'topic') {
      // Empty string болон integer хоёуланг зөв боловсруулах
      if (value === '' || value === null || value === undefined) {
        processedValue = null;
      } else {
        const parsedValue = parseInt(value, 10);
        processedValue = isNaN(parsedValue) ? null : parsedValue;
      }
    } else {
      processedValue = value;
    }

    setFormula((prev) => ({ ...prev, [name]: processedValue }));
  };

  // --- Keyword Handlers ---
  useEffect(() => {
    if (keywordSearch.length < 2) {
      setKeywordResults([]);
      return;
    }

    const searchKeywords = async () => {
      setLoadingKeywords(true);
      try {
        const response = await apiClient.get(`/api/integral/keywords/search/?q=${keywordSearch}`);
        let results = [];

        if (response.data && Array.isArray(response.data.results)) {
          results = response.data.results;
        } else if (Array.isArray(response.data)) {
          results = response.data;
        }

        const currentKeywordIds = new Set(keywords.map((k) => k.id));
        setKeywordResults(results.filter((k) => !currentKeywordIds.has(k.id)));
      } catch (err) {
        console.error('Keyword search error:', err);
        setKeywordResults([]);
      }
      setLoadingKeywords(false);
    };

    const timer = setTimeout(searchKeywords, 300);
    return () => clearTimeout(timer);
  }, [keywordSearch, keywords]);

  const addKeyword = async (keyword) => {
    setKeywords([...keywords, keyword]);
    setKeywordSearch('');
    setKeywordResults([]);

    try {
      await apiClient.post(`/api/integral/formulas/${id}/keywords/add/`, {
        keyword_id: keyword.id,
      });
    } catch (err) {
      console.error('Failed to add keyword:', err);
      setError('Түлхүүр үг нэмэхэд алдаа гарлаа.');
      setKeywords((prev) => prev.filter((k) => k.id !== keyword.id));
    }
  };

  const removeKeyword = async (keywordToRemove) => {
    setKeywords((prev) => prev.filter((k) => k.id !== keywordToRemove.id));

    try {
      await apiClient.post(`/api/integral/formulas/${id}/keywords/remove/`, {
        keyword_id: keywordToRemove.id,
      });
    } catch (err) {
      console.error('Failed to remove keyword:', err);
      setError('Түлхүүр үг устгахад алдаа гарлаа.');
      setKeywords((prev) => [...prev, keywordToRemove]);
    }
  };

  // --- Save, Delete, Clone Handlers ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: formula.title,
      content: formula.content,
      topic: formula.topic || null,
      is_public: formula.is_public ?? false,
    };

    try {
      await apiClient.patch(`/api/integral/formulas/${id}/`, payload);
      navigate(`/formula/${id}/`);
    } catch (err) {
      console.error('Failed to save formula:', err);
      console.error('Error response:', err.response?.data);

      // Алдааны мэдээллийг илүү дэлгэрэнгүй харуулах
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.topic) {
          setError(
            `Сэдэв: ${Array.isArray(errorData.topic) ? errorData.topic.join(', ') : errorData.topic}`
          );
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError(JSON.stringify(errorData));
        }
      } else {
        setError('Томьёог хадгалахад алдаа гарлаа.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setSaving(true);

    try {
      await apiClient.delete(`/api/integral/formulas/${id}/`);
      navigate(`/formulas`);
    } catch (err) {
      console.error('Failed to delete formula:', err);
      setError('Томьёог устгахад алдаа гарлаа.');
      setSaving(false);
    }
  };

  const handleCopyContent = () => {
    if (!formula.content) return;

    navigator.clipboard
      .writeText(formula.content)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error('Агуулга хуулахад алдаа гарлаа: ', err);
      });
  };

  // isCopied state-г удирдах useEffect
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // --- Render ---
  if (loading) {
    return (
      <Container className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error && !saving) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" size="sm" onClick={() => fetchFormula(id)}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  if (!formula) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Томьёо олдсонгүй.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4 mb-5">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/formulas' }}>
          Томьёонууд
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/formula/${id}` }}>
          <MathJax inline dynamic>{originalTitle || 'Томьёо'}</MathJax>
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Засварлах</Breadcrumb.Item>
      </Breadcrumb>

      <Form onSubmit={handleSave}>
        {/* Толгой хэсэг */}
        <Stack direction="horizontal" gap={3} className="mb-3">
          <h2 className="h4 fw-bold mb-0">
            <Edit3 size={24} className="me-2" />
            <MathJax inline dynamic>{formula.title || `Томьёо #${id} засах`}</MathJax>
          </h2>
          <div className="ms-auto">
            <Button
              variant={isCopied ? 'success' : 'outline-primary'}
              size="sm"
              onClick={handleCopyContent}
              disabled={saving || isCopied || !formula.content}
              className="me-2"
              title="Агуулга хуулах"
            >
              {isCopied ? (
                <Check size={16} className="me-1" />
              ) : (
                <Copy size={16} className="me-1" />
              )}
              {isCopied ? 'Хуулсан!' : 'Агуулга хуулах'}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={saving}
              title="Устгах"
            >
              <Trash2 size={16} className="me-1" />
              Устгах
            </Button>
          </div>
        </Stack>

        {/* Үндсэн Карт */}
        <Card>
          <Card.Body className="p-4">
            {/* Гарчиг, Сэдэв */}
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_title" className="fw-semibold">
                    <FileText size={16} className="me-2" />
                    Гарчиг
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    id="id_title"
                    value={formula.title || ''}
                    onChange={handleFormulaChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_topic" className="fw-semibold">
                    <Layers size={16} className="me-2" />
                    Сэдэв
                  </Form.Label>
                  <Form.Select
                    name="topic"
                    id="id_topic"
                    value={formula.topic || ''}
                    onChange={handleFormulaChange}
                  >
                    <option value="">---------</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Томьёоны агуулга */}
            <Form.Group className="mb-3">
              <Stack direction="horizontal" gap={2} className="mb-2">
                <Form.Label className="fw-semibold mb-0">
                  <AlignLeft size={16} className="me-2" />
                  Агуулга (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)
                </Form.Label>
                <div className="ms-auto">
                  <Button
                    size="sm"
                    variant={viewMode === 'visual' ? 'primary' : 'outline-secondary'}
                    onClick={() => setViewMode('visual')}
                    className="me-1"
                  >
                    <Edit3 size={14} className="me-1" />
                    Visual
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'source' ? 'primary' : 'outline-secondary'}
                    onClick={() => setViewMode('source')}
                    className="me-2"
                  >
                    <Code2 size={14} className="me-1" />
                    Source
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => setShowPreviewModal(true)}
                  >
                    <Eye size={14} className="me-1" />
                    Preview
                  </Button>
                </div>
              </Stack>

              {viewMode === 'visual' ? (
                <RichTextEditor
                  content={formula.content || ''}
                  onChange={(html) => setFormula((prev) => ({ ...prev, content: html }))}
                  placeholder="Томьёоны агуулга бичих..."
                />
              ) : (
                <Form.Control
                  as="textarea"
                  rows={15}
                  value={formula.content || ''}
                  onChange={(e) => setFormula((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="HTML код шууд бичих..."
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    lineHeight: '1.5',
                  }}
                />
              )}
            </Form.Group>

            {/* Нийтэд харагдах */}
            <Row>
              <Col md={4} className="d-flex align-items-center pt-3">
                <Form.Check
                  type="switch"
                  id="id_is_public"
                  label="Нийтэд харагдах"
                  name="is_public"
                  checked={formula.is_public ?? false}
                  onChange={handleFormulaChange}
                />
              </Col>
            </Row>

            <hr />

            {/* --- Түлхүүр үгс (Keywords) --- */}
            <div id="keywords-manager">
              <h4>
                <Tag size={20} className="me-2" />
                Холбоотой түлхүүр үгс
              </h4>
              <div id="current-keywords-list" className="mb-3">
                {keywords.map((kw) => (
                  <Badge bg="secondary" key={kw.id} className="me-1 keyword-badge" pill>
                    {kw.name}
                    <CloseButton
                      variant="white"
                      className="ms-1"
                      style={{ fontSize: '0.65em' }}
                      onClick={() => removeKeyword(kw)}
                    />
                  </Badge>
                ))}
              </div>

              <Form.Label htmlFor="keyword-search-input">Түлхүүр үг хайж нэмэх:</Form.Label>
              <InputGroup className="mb-1">
                <Form.Control
                  type="text"
                  id="keyword-search-input"
                  placeholder="Дор хаяж 2 үсэг бичнэ үү..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                />
                {loadingKeywords && (
                  <InputGroup.Text>
                    <Spinner animation="border" size="sm" />
                  </InputGroup.Text>
                )}
              </InputGroup>

              {keywordResults.length > 0 && (
                <ListGroup id="keyword-search-results">
                  {keywordResults.map((kw) => (
                    <ListGroup.Item key={kw.id} action onClick={() => addKeyword(kw)}>
                      {kw.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          </Card.Body>

          <Card.Footer className="d-flex justify-content-end">
            {error && (
              <Alert variant="danger" className="py-2 me-auto mb-0">
                {error}
              </Alert>
            )}
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => navigate('/content/browse?type=formulas')}
              disabled={saving}
            >
              <X size={16} className="me-2" />
              Цуцлах
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Хадгалж байна...
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  Хадгалах
                </>
              )}
            </Button>
          </Card.Footer>
        </Card>
      </Form>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Trash2 size={20} className="me-2 text-danger" />
            Устгахыг баталгаажуулах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та "<b>{formula.title || `Томьёо #${id}`}</b>"-г устгахдаа итгэлтэй байна уу? Энэ үйлдлийг
          буцаах боломжгүй.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <X size={16} className="me-2" />
            Цуцлах
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="me-2" />
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Eye size={20} className="me-2" />
            Урьдчилж харах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Title Preview */}
          {formula.title && (
            <div className="mb-4">
              <h2 className="h3 fw-bold">
                <FileText size={24} className="me-2 text-primary" />
                {formula.title}
              </h2>
            </div>
          )}

          {/* Content Preview */}
          <MathJax hideUntilTypeset={'first'}>
            <div
              className="mathjax-content"
              style={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{
                __html:
                  formula.content ||
                  "<span class='text-muted fst-italic'>Агуулга хоосон байна...</span>",
              }}
            />
          </MathJax>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            <X size={16} className="me-2" />
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FormulaEditPage;
