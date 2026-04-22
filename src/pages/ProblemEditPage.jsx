// frontend/src/pages/ProblemEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Tiptap Rich Text Editor + Visual/Source/Preview режим

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import LivePreview from '../components/LivePreview.jsx';
import RichTextEditor from '../components/RichTextEditor';
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
  PlusCircle,
  Home,
  BookOpen,
  Wand2,
  Sparkles,
  ImagePlus,
  Image as ImageIcon,
} from 'lucide-react';

// (!!!) MathJax тохиргоог Layout.jsx-с авдаг болсон тул эндээс хассан.

// --- Debounce Hook ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// --- PSTricks Рендер хийх туслах компонент ---
const PSTricksRenderer = ({ code }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageData, setImageData] = useState(null);

  useEffect(() => {
    const renderPST = async () => {
      if (!code) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setImageData(null);
      try {
        //
        const response = await fetch('http://127.0.0.1:5000/render-pstricks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code }),
        });
        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || 'PSTricks server error');
        }
        const result = await response.json();
        if (result.png_base64) {
          //
          setImageData(result.png_base64);
        } else {
          throw new Error('Invalid response from PSTricks server.');
        }
      } catch (err) {
        setError(err.message);
        console.error('PSTricks rendering failed:', err);
      } finally {
        setLoading(false);
      }
    };
    renderPST();
  }, [code]);

  if (loading) {
    return (
      <div className="text-center p-2">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="danger" className="p-1 small">
        [PST] Алдаа: {error}
      </Alert>
    );
  }
  if (imageData) {
    //
    return (
      <img
        src={'data:image/png;base64,' + imageData}
        style={{ maxWidth: '100%', height: 'auto' }}
        alt="PSTricks render"
      />
    );
  }
  return null;
};

// --- Үндсэн Засварлах Хуудас ---
const ProblemEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [choices, setChoices] = useState([]);
  const [keywords, setKeywords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [keywordSearch, setKeywordSearch] = useState('');
  const [keywordResults, setKeywordResults] = useState([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [viewMode, setViewMode] = useState('source'); // 'visual' or 'source' - default: source
  const [isCopied, setIsCopied] = useState(false);
  const [originalTitle, setOriginalTitle] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounce
  const debouncedStatement = useDebounce(problem?.statement || '', 500);
  const debouncedChoiceValues = useDebounce(
    choices.map((c) => c.value),
    500
  );

  // Автомат Label-д зориулсан Memoized Dependencies
  const problemType = problem ? problem.type : null;
  const choiceValues = useMemo(() => choices.map((c) => c.value), [choices]);
  const choiceDeletes = useMemo(() => choices.map((c) => c.DELETE), [choices]);
  const choiceLength = choices.length;

  // --- Data Fetching ---
  useEffect(() => {
    setPageTitle('Бодлого засах');
    fetchProblem(id);
  }, [id, setPageTitle]);

  const fetchProblem = async (problemId) => {
    try {
      setLoading(true);
      setError(null);
      //
      const response = await apiClient.get(`/api/integral/problems/${problemId}/`);
      setProblem({ ...response.data, is_public: response.data.is_public ?? false });
      setChoices(response.data.choices?.map((c) => ({ ...c, DELETE: false })) || []);
      setKeywords(response.data.keywords || []);
      setImages(response.data.images || []);
      setOriginalTitle(response.data.title || '');
      const t = response.data.title || `Бодлого #${problemId}`;
      setPageTitle(`Бодлого засах · ${t}`);
    } catch (err) {
      console.error(err);
      setError('Бодлого ачаалахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  // (!!!) Автомат Label-г тооцоолох Effect
  useEffect(() => {
    if (!problem || !choices) return;

    let labelsChanged = false;
    let newChoices;

    if (problemType == 1) {
      // Сонгох тест (A, B, C...)
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      let activeChoiceIndex = 0;

      newChoices = choices.map((choice) => {
        if (choice.DELETE) {
          return choice;
        }
        const newLabel = labels[activeChoiceIndex] || '';
        activeChoiceIndex++;

        if (choice.label !== newLabel) {
          labelsChanged = true;
          return { ...choice, label: newLabel };
        }
        return choice;
      });
    } else if (problemType == 4) {
      // Нөхөх тест (a, bc, def...)
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      let pointer = 0;

      newChoices = choices.map((choice) => {
        if (choice.DELETE) {
          return choice;
        }
        const valueLength = choice.value ? choice.value.length : 0;
        const newLabel = alphabet.substring(pointer, pointer + valueLength);
        pointer += valueLength;

        if (choice.label !== newLabel) {
          labelsChanged = true;
          return { ...choice, label: newLabel };
        }
        return choice;
      });
    } else {
      // Бусад төрөл бол (0 - Уламжлалт) автоматаар шошголохгүй
      // Гэхдээ label-г цэвэрлэх шаардлагатай байж магадгүй
      newChoices = choices.map((choice) => {
        if (choice.label !== '' && !choice.DELETE) {
          labelsChanged = true;
          return { ...choice, label: '' };
        }
        return choice;
      });
    }

    if (labelsChanged) {
      setChoices(newChoices);
    }
  }, [problemType, choiceValues, choiceDeletes, choiceLength]); // Эдгээрээс хамаарна

  // --- Form Handlers ---
  const handleProblemChange = (e) => {
    const { name, value, type, checked } = e.target;

    let processedValue;
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'type' || name === 'level') {
      const parsedValue = parseInt(value, 10);

      if (isNaN(parsedValue)) {
        processedValue = null;
      } else {
        processedValue = parsedValue;
      }
    } else {
      processedValue = value;
    }

    setProblem((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSuggestTitles = async () => {
    if (!id) return;
    setLoadingSuggestions(true);
    setTitleSuggestions([]);
    try {
      const res = await apiClient.get(`/api/integral/problems/${id}/suggest-titles/`);
      setTitleSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Гарчиг санал болгоход алдаа:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // --- Choices Handlers (Formset logic) ---
  const handleChoiceChange = (index, e) => {
    const { name, value, type } = e.target;
    // Label-г гараар өөрчлөхийг хориглосон тул энд шалгалт хийх шаардлагагүй
    const val = name === 'default_score' ? parseInt(value, 10) || 0 : value;

    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [name]: val };
    setChoices(newChoices);
  };

  const addChoice = () => {
    //
    setChoices([...choices, { id: null, label: '', value: '', default_score: 0, DELETE: false }]);
  };

  const removeChoice = (index) => {
    const choice = choices[index];
    if (choice.id) {
      //
      const newChoices = choices.map((c, i) => (i === index ? { ...c, DELETE: true } : c));
      setChoices(newChoices);
    } else {
      const newChoices = choices.filter((_, i) => i !== index);
      setChoices(newChoices);
    }
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
        //
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
      //
      await apiClient.post(`/api/integral/problems/${id}/keywords/add/`, {
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
      //
      await apiClient.post(`/api/integral/problems/${id}/keywords/remove/`, {
        keyword_id: keywordToRemove.id,
      });
    } catch (err) {
      console.error('Failed to remove keyword:', err);
      setError('Түлхүүр үг устгахад алдаа гарлаа.');
      setKeywords((prev) => [...prev, keywordToRemove]);
    }
  };

  // --- Images ---
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    setImageError(null);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiClient.post(`/api/integral/problems/${id}/upload-image/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((prev) => [...prev, res.data]);
    } catch (err) {
      setImageError('Зураг оруулахад алдаа гарлаа.');
      console.error(err);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (imageId) => {
    setImageError(null);
    try {
      await apiClient.delete(`/api/integral/problems/${id}/delete-image/${imageId}/`);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setImageError('Зураг устгахад алдаа гарлаа.');
      console.error(err);
    }
  };

  // --- AI Summary ---
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setSummaryError(null);
    try {
      const res = await apiClient.post(`/api/integral/problems/${id}/generate_summary/`);
      setProblem((prev) => ({
        ...prev,
        ai_summary: res.data.ai_summary ?? prev.ai_summary,
        title: res.data.title ?? prev.title,
      }));
    } catch {
      setSummaryError('AI summary үүсгэхэд алдаа гарлаа.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // --- Save, Delete, Clone Handlers ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: problem.title,
      statement: problem.statement,
      level: problem.level || null,
      type: problem.type || 0,
      answer: problem.answer || '',
      is_public: problem.is_public ?? false,
      rendering: problem.rendering,
      mute_comments: problem.mute_comments,
      //
      choices: choices
        .filter((c) => !c.DELETE)
        .map((c) => ({
          id: c.id || null,
          label: c.label,
          value: c.value,
          default_score: c.default_score,
          description: c.description || null,
        })),
    };

    try {
      //
      await apiClient.patch(`/api/integral/problems/${id}/`, payload);
      navigate(`/problem/${id}`);
    } catch (err) {
      console.error('Failed to save problem:', err);
      setError(err.response?.data?.detail || 'Бодлогыг хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setSaving(true);
    try {
      //
      await apiClient.delete(`/api/integral/problems/${id}/`);
      navigate('/content/browse?type=problems');
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setError('Бодлогыг устгахад алдаа гарлаа.');
      setSaving(false);
    }
  };

  const handleCopyStatement = () => {
    if (!problem.statement) return;

    navigator.clipboard
      .writeText(problem.statement)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error('Өгүүлбэр хуулахад алдаа гарлаа: ', err);
      });
  };

  const handleConvertToMC = async () => {
    setShowConvertModal(false);
    setConverting(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/integral/problems/${id}/convert_to_mc/`);
      const newUuid = response.data.new_uuid;
      navigate(`/problem/${newUuid}/edit`);
    } catch (err) {
      console.error('Convert to MC error:', err);
      setError(err.response?.data?.error || 'Сонгох тест үүсгэхэд алдаа гарлаа.');
    } finally {
      setConverting(false);
    }
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
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error && !saving) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" size="sm" onClick={() => fetchProblem(id)}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Бодлого олдсонгүй.</Alert>
      </Container>
    );
  }

  //
  const showChoices = problem.type == 1 || problem.type == 4;

  return (
    <Container className="py-4 mb-5">
      {/* Breadcrumb Navigation */}
      <Breadcrumb listProps={{ className: 'mb-3' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          <Home size={14} className="me-1" />
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/problems' }}>
          <BookOpen size={14} className="me-1" />
          Бодлогууд
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/problem/${id}` }}>
          <FileText size={14} className="me-1" />
          <MathJax inline dynamic>{originalTitle || 'Бодлого'}</MathJax>
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <Edit3 size={14} className="me-1" />
          Засварлах
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* (!!!) MathJaxContext-г эндээс хассан. Layout.jsx-с өвлөгдөнө. */}
      <Form onSubmit={handleSave}>
        {/* Толгой хэсэг */}
        <h2 className="h4 fw-bold mb-2">
          <Edit3 size={24} className="me-2" />
          <MathJax inline dynamic>{problem.title || `Бодлого #${id} засах`}</MathJax>
        </h2>
        <Stack direction="horizontal" gap={2} className="mb-3">
          <Button
            variant={isCopied ? 'success' : 'outline-primary'}
            size="sm"
            onClick={handleCopyStatement}
            disabled={saving || isCopied || !problem.statement}
            title="Өгүүлбэр хуулах"
          >
            {isCopied ? (
              <Check size={16} className="me-1" />
            ) : (
              <Copy size={16} className="me-1" />
            )}
            {isCopied ? 'Хуулсан!' : 'Өгүүлбэр хуулах'}
          </Button>
          {problem.type === 0 && (
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => setShowConvertModal(true)}
              disabled={saving || converting}
              title="AI ашиглан сонгох тест болгох"
            >
              {converting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-1" />
                  Үүсгэж байна...
                </>
              ) : (
                <>
                  <Wand2 size={16} className="me-1" />
                  Сонгох тест болгох
                </>
              )}
            </Button>
          )}
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={saving || generatingSummary}
            title="AI summary үүсгэх"
          >
            {generatingSummary ? (
              <Spinner as="span" animation="border" size="sm" className="me-1" />
            ) : (
              <Sparkles size={16} className="me-1" />
            )}
            {generatingSummary ? 'Бодож байна...' : 'AI summary'}
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
        </Stack>
        {summaryError && <Alert variant="danger" className="py-2 small mb-2">{summaryError}</Alert>}

        {/* Үндсэн Карт */}
        <Card>
          <Card.Body className="p-4">
            {/* Гарчиг, Түвшин */}
            <Row>
              <Col md={8}>
                <Form.Group className="mb-1">
                  <Form.Label htmlFor="id_title" className="fw-semibold">
                    <FileText size={16} className="me-2" />
                    Гарчиг
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="title"
                      id="id_title"
                      value={problem.title || ''}
                      onChange={handleProblemChange}
                      placeholder="Гарчиг оруулах..."
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleSuggestTitles}
                      disabled={loadingSuggestions}
                      title="Гарчиг санал болгох"
                    >
                      {loadingSuggestions
                        ? <Spinner animation="border" size="sm" />
                        : <Wand2 size={15} />}
                    </Button>
                  </InputGroup>
                </Form.Group>
                {titleSuggestions.length > 0 && (
                  <div className="mb-3">
                    {titleSuggestions.map((s, i) => (
                      <Button
                        key={i}
                        variant="outline-primary"
                        size="sm"
                        className="me-1 mt-1"
                        onClick={() => {
                          setProblem((prev) => ({ ...prev, title: s.title }));
                          setTitleSuggestions([]);
                        }}
                      >
                        {s.title}
                      </Button>
                    ))}
                  </div>
                )}
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_level" className="fw-semibold">
                    <Layers size={16} className="me-2" />
                    Түвшин
                  </Form.Label>
                  <Form.Select
                    name="level"
                    id="id_level"
                    value={problem.level || ''}
                    onChange={handleProblemChange}
                  >
                    <option value="">---------</option>
                    <option value="1">Сэргээн санах түвшин</option>
                    <option value="2">Ойлгох түвшин</option>
                    <option value="3">Хэрэглэх түвшин</option>
                    <option value="4">Задлан шинжлэх түвшин</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Бодлогын өгүүлбэр */}
            <Form.Group className="mb-3">
              <Stack direction="horizontal" gap={2} className="mb-2">
                <Form.Label className="fw-semibold mb-0">
                  <AlignLeft size={16} className="me-2" />
                  Өгүүлбэр (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)
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
                  content={problem.statement || ''}
                  onChange={(html) => setProblem((prev) => ({ ...prev, statement: html }))}
                  placeholder="Бодлогын өгүүлбэр бичих..."
                />
              ) : (
                <Form.Control
                  as="textarea"
                  rows={15}
                  value={problem.statement || ''}
                  onChange={(e) => setProblem((prev) => ({ ...prev, statement: e.target.value }))}
                  placeholder="HTML код шууд бичих..."
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    lineHeight: '1.5',
                  }}
                />
              )}
            </Form.Group>

            {/* Төрөл, Хариулт, Нийтлэх */}
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_type">Бодлогын төрөл</Form.Label>
                  <Form.Select
                    name="type"
                    id="id_type"
                    value={problem.type || 0}
                    onChange={handleProblemChange}
                  >
                    <option value="0">Уламжлалт</option>
                    <option value="1">Сонгох тест</option>
                    <option value="4">Нөхөх тест</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label htmlFor="id_answer">Хариулт</Form.Label>
                  <Form.Control
                    type="text"
                    name="answer"
                    id="id_answer"
                    value={problem.answer || ''}
                    onChange={handleProblemChange}
                  />
                  <Form.Text>Сонгох/Нөхөх тестийн зөв хариултын Label (A, B, abcde...)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-center pt-3">
                <Form.Check
                  type="switch"
                  id="id_is_public"
                  label="Нийтэд харагдах"
                  name="is_public"
                  checked={problem.is_public || false}
                  onChange={handleProblemChange}
                />
              </Col>
            </Row>

            <hr />

            {/* --- Хариултын Сонголтууд (Formset) --- */}
            {showChoices && (
              <div id="choices-section">
                <h4>
                  <Layers size={20} className="me-2" />
                  Хариултын сонголтууд
                </h4>
                <div id="choice-forms-container">
                  {choices.map((choice, index) => {
                    if (choice.DELETE) return null; //
                    const isCorrect = choice.default_score > 0;
                    return (
                      <Card
                        key={choice.id || `new-${index}`}
                        className={`mb-3 choice-form ${isCorrect ? 'bg-success-subtle' : ''}`}
                        border={isCorrect ? 'success' : null}
                      >
                        <Card.Body>
                          <Row className="align-items-start">
                            <Col md={2}>
                              <Form.Group>
                                <Form.Label>Label</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="label"
                                  value={choice.label || ''}
                                  onChange={(e) => handleChoiceChange(index, e)}
                                  readOnly // (!!!) Гараас засахыг хориглох
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Утга (Value)</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  name="value"
                                  rows={2}
                                  value={choice.value || ''}
                                  onChange={(e) => handleChoiceChange(index, e)}
                                  className="font-monospace"
                                />
                                <LivePreview content={debouncedChoiceValues[index]} />
                              </Form.Group>
                            </Col>
                            <Col md={2}>
                              <Form.Group>
                                <Form.Label>Оноо</Form.Label>
                                <Form.Control
                                  type="number"
                                  name="default_score"
                                  value={choice.default_score}
                                  onChange={(e) => handleChoiceChange(index, e)}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={2} className="text-end pt-4">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeChoice(index)}
                              >
                                Устгах
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
                <Button
                  id="add-choice-btn"
                  type="button"
                  variant="outline-success"
                  size="sm"
                  onClick={addChoice}
                >
                  <PlusCircle size={16} className="me-1" />
                  Шинэ сонголт нэмэх
                </Button>
              </div>
            )}

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
            <hr />

            {/* --- Зурагнууд --- */}
            <div id="images-section">
              <h4>
                <ImageIcon size={20} className="me-2" />
                Зурагнууд
              </h4>
              {imageError && (
                <Alert variant="danger" className="py-2 small mb-2">{imageError}</Alert>
              )}
              {images.length > 0 && (
                <Row className="g-2 mb-3">
                  {images.map((img) => (
                    <Col key={img.id} xs={6} sm={4} md={3}>
                      <div className="position-relative border rounded overflow-hidden" style={{ aspectRatio: '4/3' }}>
                        <img
                          src={img.image}
                          alt=""
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0 m-1 p-1 lh-1"
                          onClick={() => handleImageDelete(img.id)}
                          title="Зураг устгах"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
              <Form.Group>
                <Form.Label
                  htmlFor="image-upload-input"
                  className="btn btn-outline-secondary btn-sm mb-0"
                  style={{ cursor: 'pointer' }}
                >
                  {uploadingImage ? (
                    <><Spinner as="span" animation="border" size="sm" className="me-1" />Оруулж байна...</>
                  ) : (
                    <><ImagePlus size={16} className="me-1" />Зураг нэмэх</>
                  )}
                </Form.Label>
                <Form.Control
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </Form.Group>
            </div>
          </Card.Body>
          <Card.Footer className="d-flex justify-content-end">
            {error && (
              <Alert variant="danger" className="py-2 me-auto">
                {error}
              </Alert>
            )}
            <Button
              variant="secondary"
              className="me-2"
              onClick={() => navigate(`/problem/${id}`)}
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
      {/* (!!!) MathJaxContext-г эндээс хассан. */}

      {/* Convert to MC Confirmation Modal */}
      <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Wand2 size={20} className="me-2 text-warning" />
            Сонгох тест болгох
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            AI ашиглан <b>{problem.title || `Бодлого #${id}`}</b> бодлогыг клон хийж,{' '}
            <b>5 сонгох хариулттай (1 зөв = 2 оноо, 4 буруу = 0 оноо)</b> шинэ бодлого үүсгэнэ.
          </p>
          {!problem.statement && (
            <Alert variant="warning" className="py-2">
              Бодлогын өгүүлбэр хоосон байна. AI-д илүү мэдээлэл өгсөн тусам илүү сайн хариулт гарна.
            </Alert>
          )}
          <p className="text-muted small mb-0">
            Эх бодлого өөрчлөгдөхгүй. Шинэ бодлого үүсэн засварлах хуудас руу шилжинэ.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConvertModal(false)}>
            <X size={16} className="me-2" />
            Цуцлах
          </Button>
          <Button variant="warning" onClick={handleConvertToMC}>
            <Wand2 size={16} className="me-2" />
            Үүсгэх
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Trash2 size={20} className="me-2 text-danger" />
            Устгахыг баталгаажуулах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та "<b>{problem.title || `Бодлого #${id}`}</b>"-г устгахдаа итгэлтэй байна уу? Энэ
          үйлдлийг буцаах боломжгүй.
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
          {problem.title && (
            <div className="mb-4">
              <h2 className="h3 fw-bold">
                <FileText size={24} className="me-2 text-primary" />
                {problem.title}
              </h2>
            </div>
          )}

          {/* Statement Preview */}
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
                  problem.statement ||
                  "<span class='text-muted fst-italic'>Өгүүлбэр хоосон байна...</span>",
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

export default ProblemEditPage;
