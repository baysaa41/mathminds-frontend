// frontend/src/pages/ProblemEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Tiptap Rich Text Editor + Visual/Source/Preview режим

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Stack from 'react-bootstrap/Stack';
import Form from 'react-bootstrap/Form';
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// Lucide React Icons
import {
  Edit3, Save, X, Trash2, Copy, Check, FileText, Home, BookOpen, Wand2, Sparkles,
} from 'lucide-react';

import { ProblemInfoForm } from '../components/problemEdit/ProblemInfoForm.jsx';
import { ChoicesEditor } from '../components/problemEdit/ChoicesEditor.jsx';
import { KeywordsManager } from '../components/problemEdit/KeywordsManager.jsx';
import { ImagesManager } from '../components/problemEdit/ImagesManager.jsx';
import { DeleteProblemModal } from '../components/problemEdit/DeleteProblemModal.jsx';
import { ConvertToMCModal } from '../components/problemEdit/ConvertToMCModal.jsx';
import { PreviewModal } from '../components/problemEdit/PreviewModal.jsx';

// (!!!) MathJax тохиргоог Layout.jsx-с авдаг болсон тул эндээс хассан.

// --- Үндсэн Засварлах Хуудас ---
const ProblemEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
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

  const handleStatementChange = (html) => {
    setProblem((prev) => ({ ...prev, statement: html }));
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

  const handleApplyTitleSuggestion = (title) => {
    setProblem((prev) => ({ ...prev, title }));
    setTitleSuggestions([]);
  };

  // --- Choices Handlers (Formset logic) ---
  const handleChoiceChange = (index, e) => {
    const { name, value } = e.target;
    // Label-г гараар өөрчлөхийг хориглосон тул энд шалгалт хийх шаардлагагүй
    const val = name === 'default_score' ? parseInt(value, 10) || 0 : value;

    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], [name]: val };
    setChoices(newChoices);
  };

  const addChoice = () => {
    setChoices([...choices, { id: null, label: '', value: '', default_score: 0, DELETE: false }]);
  };

  const removeChoice = (index) => {
    const choice = choices[index];
    if (choice.id) {
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
      subject: problem.subject || 'math',
      level: problem.level || null,
      type: problem.type || 0,
      answer: problem.answer || '',
      is_public: problem.is_public ?? false,
      rendering: problem.rendering,
      mute_comments: problem.mute_comments,
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
            <ProblemInfoForm
              problem={problem}
              onFieldChange={handleProblemChange}
              onStatementChange={handleStatementChange}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onShowPreview={() => setShowPreviewModal(true)}
              titleSuggestions={titleSuggestions}
              loadingSuggestions={loadingSuggestions}
              onSuggestTitles={handleSuggestTitles}
              onApplyTitleSuggestion={handleApplyTitleSuggestion}
            />

            <hr />

            {/* --- Хариултын Сонголтууд (Formset) --- */}
            {showChoices && (
              <ChoicesEditor
                choices={choices}
                onChoiceChange={handleChoiceChange}
                onAddChoice={addChoice}
                onRemoveChoice={removeChoice}
              />
            )}

            <hr />

            <KeywordsManager
              keywords={keywords}
              keywordSearch={keywordSearch}
              setKeywordSearch={setKeywordSearch}
              keywordResults={keywordResults}
              loadingKeywords={loadingKeywords}
              onAddKeyword={addKeyword}
              onRemoveKeyword={removeKeyword}
            />
            <hr />

            <ImagesManager
              images={images}
              imageError={imageError}
              uploadingImage={uploadingImage}
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
            />
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

      <ConvertToMCModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        onConfirm={handleConvertToMC}
        title={problem.title}
        id={id}
        hasStatement={!!problem.statement}
      />

      <DeleteProblemModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={problem.title}
        id={id}
      />

      <PreviewModal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        title={problem.title}
        statement={problem.statement}
      />
    </Container>
  );
};

export default ProblemEditPage;
