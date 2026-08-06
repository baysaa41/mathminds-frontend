// frontend/src/pages/SolutionEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Preview талбар бүрийн яг доор

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import GlobalLivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';

// Icons
import { Save, X, Lightbulb, FileText, StickyNote, Sparkles, PlusCircle, Wand2 } from 'lucide-react';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

// --- Debounce Hook ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Live Preview Component ---
const LivePreview = ({ content, label }) => {
  if (!content || content.trim() === '') {
    return (
      <div
        className="text-muted small text-center p-2 mt-2"
        style={{
          fontStyle: 'italic',
          backgroundColor: '#f8f9fa',
          borderRadius: '0.375rem',
          border: '1px dashed #dee2e6',
        }}
      >
        {label} preview...
      </div>
    );
  }

  return (
    <div
      className="mt-2 p-3"
      style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '0.375rem',
        border: '1px solid #dee2e6',
        lineHeight: '1.7',
      }}
    >
      <div className="small text-muted mb-1 fw-semibold">👁 Preview:</div>
      <GlobalLivePreview content={content} />
    </div>
  );
};

// --- Үндсэн компонент ---
const SolutionEditPage = () => {
  const { uuid: id } = useParams(); // problem UUID
  const navigate = useNavigate();
  const location = useLocation();
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingAI, _setGeneratingAI] = useState(false);
  const [generatingNote, setGeneratingNote] = useState(false);
  const [improvingAI, setImprovingAI] = useState(false);
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveMode, setImproveMode] = useState('expand');
  const [improveDest, setImproveDest] = useState('replace');
  const [improveComment, setImproveComment] = useState('');
  const [aiError, setAiError] = useState(null);

  // Засварлаж байгаа solution
  const [currentSolution, setCurrentSolution] = useState(null);
  const [solutionFormulas, setSolutionFormulas] = useState([]);
  const [formulaSearch, setFormulaSearch] = useState('');
  const [formulaResults, setFormulaResults] = useState([]);
  const [formulaSearching, setFormulaSearching] = useState(false);
  const [formulaUpdating, setFormulaUpdating] = useState(false);
  const [formData, setFormData] = useState({
    hint: '',
    solution: '',
    explanation: '',
    note: '',
  });

  // Debounced values for live preview
  const debouncedHint = useDebounce(formData.hint, 500);
  const debouncedSolution = useDebounce(formData.solution, 500);
  const debouncedExplanation = useDebounce(formData.explanation, 500);
  const debouncedNote = useDebounce(formData.note, 500);

  useEffect(() => {
    setPageTitle('Бодолт засах');
    fetchProblemAndSolutions();
  }, [id, setPageTitle]);

  const fetchProblemAndSolutions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch problem details
      const problemResponse = await apiClient.get(`/api/integral/problems/${id}/`);
      setProblem(problemResponse.data);

      // Fetch solutions for this problem
      const solutionsResponse = await apiClient.get(`/api/integral/solutions/?problem_id=${id}`);

      // ✅ Pagination шалгах
      let solutionsData = [];
      if (solutionsResponse.data.results) {
        solutionsData = solutionsResponse.data.results;
      } else if (Array.isArray(solutionsResponse.data)) {
        solutionsData = solutionsResponse.data;
      } else {
        console.error('❌ Unexpected API response format:', solutionsResponse.data);
        setError('API хариу буруу форматтай байна.');
        return;
      }

      setSolutions(solutionsData);

      const forceNew = location.state?.forceNew;
      const solutionId = location.state?.solutionId;

      if (forceNew || solutionsData.length === 0) {
        // "Шинэ бодолт нэмэх" товчоор ирсэн, эсвэл бодолт байхгүй
        setCurrentSolution(null);
        setFormData({ hint: '', solution: '', explanation: '', note: '' });
      } else {
        // Тодорхой бодолт дамжуулсан бол тэр бодолтыг, үгүй бол эхнийхийг сонго
        const target = solutionId
          ? solutionsData.find((s) => s.id === solutionId) ?? solutionsData[0]
          : solutionsData[0];
        setCurrentSolution(target);
        setSolutionFormulas(target.formulas || []);
        setFormData({
          hint: target.hint || '',
          solution: target.solution || '',
          explanation: target.explanation || '',
          note: target.note || '',
        });
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.hint && !formData.solution && !formData.explanation && !formData.note) {
      setError('Дор хаяж нэг талбар бөглөнө үү!');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (currentSolution) {
        // Update existing solution
        await apiClient.patch(`/api/integral/solutions/${currentSolution.id}/`, formData);
      } else {
        // Create new solution
        await apiClient.post('/api/integral/solutions/', {
          ...formData,
          problem: id,
        });
      }

      // Амжилттай хадгалсан бол бодлогын хуудас руу буцах
      navigate(`/problem/${id}`);
    } catch (err) {
      console.error('❌ Error saving solution:', err);
      setError('Хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/problem/${id}`);
  };

  const handleFormulaSearch = async (q) => {
    setFormulaSearch(q);
    if (!q.trim()) { setFormulaResults([]); return; }
    setFormulaSearching(true);
    try {
      const res = await apiClient.get('/api/integral/formulas/', { params: { search: q, page_size: 8 } });
      setFormulaResults(res.data.results || res.data || []);
    } catch { setFormulaResults([]); }
    finally { setFormulaSearching(false); }
  };

  const handleAddFormula = async (formula) => {
    if (!currentSolution) return;
    if (solutionFormulas.some(f => f.id === formula.id)) return;
    setFormulaUpdating(true);
    try {
      await apiClient.post(`/api/integral/solutions/${currentSolution.id}/formulas/add/`, { formula_id: formula.id });
      setSolutionFormulas(prev => [...prev, formula]);
      setFormulaSearch('');
      setFormulaResults([]);
    } catch { /* ignore */ }
    finally { setFormulaUpdating(false); }
  };

  const handleRemoveFormula = async (formulaId) => {
    if (!currentSolution) return;
    setFormulaUpdating(true);
    try {
      await apiClient.post(`/api/integral/solutions/${currentSolution.id}/formulas/remove/`, { formula_id: formulaId });
      setSolutionFormulas(prev => prev.filter(f => f.id !== formulaId));
    } catch { /* ignore */ }
    finally { setFormulaUpdating(false); }
  };

  const handleGenerateNote = async () => {
    if (!formData.hint && !formData.solution) {
      setAiError('Заавар эсвэл бодолт талбарыг эхлээд бөглөнө үү.');
      return;
    }
    try {
      setGeneratingNote(true);
      setAiError(null);
      const res = await apiClient.post(`/api/integral/problems/${id}/generate_solution_note/`, {
        hint: formData.hint,
        solution: formData.solution,
      });
      handleChange('note', res.data.note);
    } catch (err) {
      console.error('AI дүгнэлт үүсгэхэд алдаа:', err);
      setAiError(err.response?.data?.error || 'AI дүгнэлт үүсгэж чадсангүй.');
    } finally {
      setGeneratingNote(false);
    }
  };

  const handleSolutionSwitch = (solution) => {
    setCurrentSolution(solution);
    setFormData({
      hint: solution.hint || '',
      solution: solution.solution || '',
      note: solution.note || '',
    });
  };

  const handleNewSolution = () => {
    setCurrentSolution(null);
    setFormData({ hint: '', solution: '', note: '' });
    setError(null);
    setAiError(null);
  };

  const handleImprove = async () => {
    if (!currentSolution) return;
    setShowImproveModal(false);
    setImprovingAI(true);
    setAiError(null);
    try {
      const res = await apiClient.post(
        `/api/integral/solutions/${currentSolution.id}/improve/`,
        { mode: improveMode, comment: improveComment.trim() }
      );
      if (improveDest === 'note') {
        const combined = [res.data.hint, res.data.solution].filter(Boolean).join('\n\n---\n\n');
        setFormData((prev) => ({ ...prev, note: combined }));
      } else {
        setFormData((prev) => ({
          ...prev,
          hint: res.data.hint || prev.hint,
          solution: res.data.solution || prev.solution,
        }));
      }
    } catch (err) {
      setAiError(err.response?.data?.error || 'Бодолтыг сайжруулахад алдаа гарлаа.');
    } finally {
      setImprovingAI(false);
    }
  };

  // Permission check
  const isStaff = user && user.is_staff;
  const canEdit =
    user && problem && (isStaff || (problem.author && user.id === problem.author.id));

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  const breadcrumb = (
    <AppBreadcrumb className="mb-3" items={[
      { label: 'Бодлогууд', to: '/problems' },
      { label: problem?.title || `Бодлого #${id}`, to: `/problem/${id}` },
      { label: 'Бодолт засах' },
    ]} />
  );

  if (error && !problem) {
    return (
      <Container className="mt-4">
        <AppBreadcrumb className="mb-2" items={[{ label: 'Бодлогууд', to: '/problems' }, { label: 'Бодолт засах' }]} />
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container className="mt-4">
        <AppBreadcrumb className="mb-2" items={[{ label: 'Бодлогууд', to: '/problems' }, { label: 'Бодолт засах' }]} />
        <Alert variant="warning">Бодлого олдсонгүй.</Alert>
      </Container>
    );
  }

  if (!canEdit) {
    return (
      <Container className="mt-4">
        {breadcrumb}
        <Alert variant="warning">Та энэ бодлогын бодолтыг засах эрхгүй байна.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {breadcrumb}

      {/* Header - Бодлогын мэдээлэл */}
      <div className="mb-3">
        <MathJax hideUntilTypeset={'first'}>
          <h1 className="h3 fw-bold mathjax-content mb-2">{problem.title || `Бодлого #${id}`}</h1>
        </MathJax>
        <Stack direction="horizontal" gap={2} className="flex-wrap">
          {problem.level_name && <Badge bg="secondary">{problem.level_name}</Badge>}
          {currentSolution && <Badge bg="success">Одоогийн бодолт</Badge>}
          {!currentSolution && <Badge bg="primary">Шинэ бодолт</Badge>}
        </Stack>
      </div>

      {/* Бодлогын нөхцөл */}
      <Card className="mb-4 bg-light border-0">
        <Card.Body className="p-3">
          <h6 className="fw-semibold mb-2">Бодлогын нөхцөл:</h6>
          <div
            className="mathjax-content small text-muted"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            <GlobalLivePreview content={problem.statement} />
          </div>

          {problem.type === 1 && problem.choices && problem.choices.length > 0 && (
            <div className="mt-3 d-flex flex-wrap gap-3">
              {[...problem.choices]
                .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
                .map((choice, index) => {
                  const isCorrect = choice.default_score > 0;
                  return (
                    <div
                      key={choice.id || index}
                      style={{ flex: `1 1 calc(${100 / problem.choices.length}% - 1rem)`, minWidth: '160px' }}
                    >
                      <div
                        className={`h-100 p-2 rounded border d-flex flex-column ${isCorrect ? 'bg-success-subtle' : ''}`}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <strong>{choice.label || `${String.fromCharCode(65 + index)}.`}</strong>
                          {isCorrect && <Badge bg="success">Зөв</Badge>}
                        </div>
                        <div className="flex-grow-1 small text-muted">
                          <GlobalLivePreview content={choice.value || '(Сонголт хоосон)'} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card.Body>
      </Card>

      <hr className="mb-4" />

      {/* Main Form */}
      <Form onSubmit={handleSave}>
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {aiError && (
          <Alert variant="warning" className="mb-4" dismissible onClose={() => setAiError(null)}>
            {aiError}
          </Alert>
        )}

        {/* Бодолт сонгох / шинэ нэмэх */}
        {solutions.length > 0 && (
          <Card className="mb-4">
            <Card.Header className="bg-light d-flex align-items-center justify-content-between">
              <strong>Бодолтууд ({solutions.length})</strong>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleNewSolution}
                disabled={!currentSolution}
              >
                <PlusCircle size={15} className="me-1" />
                Шинэ бодолт нэмэх
              </Button>
            </Card.Header>
            <Card.Body className="p-2">
              <Stack direction="horizontal" gap={2} className="flex-wrap">
                {solutions.map((sol, idx) => (
                  <Button
                    key={sol.id}
                    variant={currentSolution?.id === sol.id ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => handleSolutionSwitch(sol)}
                  >
                    Бодолт #{idx + 1}
                    {sol.author && ` (${sol.author.first_name || sol.author.username})`}
                  </Button>
                ))}
                {!currentSolution && (
                  <Button variant="success" size="sm" disabled>
                    + Шинэ
                  </Button>
                )}
              </Stack>
            </Card.Body>
          </Card>
        )}

        {/* Hint Field + Preview */}
        <Card className="mb-4 border-warning border-opacity-25">
          <Card.Header className="bg-warning bg-opacity-10">
            <Stack direction="horizontal" gap={2}>
              <Lightbulb size={18} className="text-warning" />
              <strong>Заавар (Hint)</strong>
              {formData.hint && (
                <Badge bg="warning" text="dark" className="ms-auto">
                  {formData.hint.length} тэмдэгт
                </Badge>
              )}
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.hint}
                onChange={(e) => handleChange('hint', e.target.value)}
                placeholder="Бодоход туслах зөвлөмж, зөвлөгөө...&#10;&#10;LaTeX ашиглаж болно: $x^2 + y^2 = z^2$"
                className="font-monospace"
                style={{ fontSize: '0.95rem' }}
              />
              <Form.Text className="text-muted">Сурагчдад бодоход туслах зөвлөмж</Form.Text>

              {/* ✅ Preview яг энд */}
              <LivePreview content={debouncedHint} label="Заавар" />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Solution Field + Preview */}
        <Card className="mb-4 border-success border-opacity-25">
          <Card.Header className="bg-success bg-opacity-10">
            <Stack direction="horizontal" gap={2}>
              <FileText size={18} className="text-success" />
              <strong>Бодолт (Solution)</strong>
              {formData.solution && (
                <Badge bg="success" className="ms-auto">
                  {formData.solution.length} тэмдэгт
                </Badge>
              )}
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={10}
                value={formData.solution}
                onChange={(e) => handleChange('solution', e.target.value)}
                placeholder="Алхам алхмаар бодолтын тайлбар...&#10;&#10;LaTeX ашиглаж болно."
                className="font-monospace"
                style={{ fontSize: '0.95rem' }}
              />
              <Form.Text className="text-muted">Бодолтын дэлгэрэнгүй тайлбар</Form.Text>

              {/* ✅ Preview яг энд */}
              <LivePreview content={debouncedSolution} label="Бодолт" />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Explanation Field + Preview */}
        <Card className="mb-4 border-warning border-opacity-25">
          <Card.Header className="bg-warning bg-opacity-10">
            <Stack direction="horizontal" gap={2}>
              <Sparkles size={18} className="text-warning" />
              <strong>AI дэлгэрэнгүй тайлбар</strong>
              {formData.explanation && (
                <Badge bg="warning" text="dark">
                  {formData.explanation.length} тэмдэгт
                </Badge>
              )}
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={6}
                value={formData.explanation}
                onChange={(e) => handleChange('explanation', e.target.value)}
                placeholder="Бодолтын алхам бүрийг дэлгэрэнгүй тайлбарласан текст..."
                className="font-monospace"
                style={{ fontSize: '0.95rem' }}
              />
              <Form.Text className="text-muted">Сурагчдад ойлгомжтой дэлгэрэнгүй тайлбар (LaTeX дэмжинэ)</Form.Text>
              <LivePreview content={debouncedExplanation} label="AI дэлгэрэнгүй тайлбар" />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Related Formulas */}
        {currentSolution && (
          <Card className="mb-4 border-secondary border-opacity-25">
            <Card.Header className="bg-secondary bg-opacity-10">
              <Stack direction="horizontal" gap={2}>
                <i className="bi bi-bookmarks-fill text-secondary" />
                <strong>Холбоотой томьёо, тодорхойлолт</strong>
                {solutionFormulas.length > 0 && (
                  <Badge bg="secondary">{solutionFormulas.length}</Badge>
                )}
              </Stack>
            </Card.Header>
            <Card.Body>
              {/* Одоогийн томьёонууд */}
              {solutionFormulas.length > 0 && (
                <div className="mb-3 d-flex flex-column gap-2">
                  {solutionFormulas.map(f => (
                    <div key={f.id} className="border rounded px-3 py-2 bg-light d-flex align-items-start gap-2">
                      <div style={{ flex: 1 }}>
                        {f.title && (
                          <div className="fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                            <GlobalLivePreview content={f.title} />
                          </div>
                        )}
                        <GlobalLivePreview content={f.content} />
                      </div>
                      <Button
                        variant="link" size="sm" className="p-0 text-danger flex-shrink-0 mt-1"
                        onClick={() => handleRemoveFormula(f.id)}
                        disabled={formulaUpdating}
                        title="Хасах"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Томьёо хайх */}
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="Томьёо хайх..."
                  value={formulaSearch}
                  onChange={e => handleFormulaSearch(e.target.value)}
                  size="sm"
                />
                {formulaSearching && (
                  <Spinner animation="border" size="sm" className="position-absolute end-0 top-50 translate-middle-y me-2" />
                )}
                {formulaResults.length > 0 && (
                  <div className="border rounded mt-1 bg-white shadow-sm" style={{ maxHeight: 260, overflowY: 'auto', zIndex: 10, position: 'relative' }}>
                    {formulaResults.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        className="d-block w-100 text-start px-3 py-2 border-0 bg-transparent hover-bg-light"
                        style={{ cursor: 'pointer', borderBottom: '1px solid #eee' }}
                        onClick={() => handleAddFormula(f)}
                        disabled={formulaUpdating || solutionFormulas.some(sf => sf.id === f.id)}
                      >
                        {f.title && (
                          <div className="small fw-semibold">
                            <GlobalLivePreview content={f.title} />
                          </div>
                        )}
                        <div className="small text-muted text-truncate">
                          <GlobalLivePreview content={f.content} />
                        </div>
                        {solutionFormulas.some(sf => sf.id === f.id) && (
                          <span className="badge bg-success ms-1" style={{ fontSize: '0.65rem' }}>нэмсэн</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Note Field + Preview */}
        <Card className="mb-4 border-info border-opacity-25">
          <Card.Header className="bg-info bg-opacity-10">
            <Stack direction="horizontal" gap={2}>
              <StickyNote size={18} className="text-info" />
              <strong>Тэмдэглэл (Note)</strong>
              {formData.note && (
                <Badge bg="info">
                  {formData.note.length} тэмдэгт
                </Badge>
              )}
              <Button
                variant="outline-info"
                size="sm"
                className="ms-auto"
                onClick={handleGenerateNote}
                disabled={saving || generatingNote || generatingAI}
              >
                {generatingNote ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Дүгнэж байна...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="me-1" />
                    AI дүгнэлт
                  </>
                )}
              </Button>
            </Stack>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={5}
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                placeholder="Нэмэлт тайлбар, санамж..."
                className="font-monospace"
                style={{ fontSize: '0.95rem' }}
              />
              <Form.Text className="text-muted">Нэмэлт мэдээлэл</Form.Text>

              {/* ✅ Preview яг энд */}
              <LivePreview content={debouncedNote} label="Тэмдэглэл" />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Info Alert */}
        <Alert variant="info" className="small mb-4">
          <strong>💡 Санамж:</strong>
          <ul className="mb-0 mt-2 ps-3">
            <li>Дор хаяж нэг талбар бөглөнө үү</li>
            <li>
              LaTeX томъёо: <code>$x^2$</code> эсвэл <code>$$\int_0^1 x dx$$</code>
            </li>
            <li>Мөр солих: 2 удаа Enter дарах</li>
            <li>Preview 500ms-н дараа автоматаар харагдана</li>
          </ul>
        </Alert>

        {/* Бодолтыг сайжруулах */}
        {currentSolution && (
          <div className="mb-4 d-flex justify-content-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowImproveModal(true)}
              disabled={improvingAI || saving || generatingAI}
            >
              {improvingAI ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Сайжруулж байна...
                </>
              ) : (
                <>
                  <Wand2 size={15} className="me-1" />
                  Бодолтыг сайжруулах
                </>
              )}
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <Stack direction="horizontal" gap={2} className="justify-content-end">
          <Button variant="outline-secondary" onClick={handleCancel} disabled={saving}>
            <X size={16} className="me-1" />
            Цуцлах
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <Save size={16} className="me-1" />
                Хадгалах
              </>
            )}
          </Button>
        </Stack>
      </Form>

      <hr className="mt-5" />
      <Link to={`/problem/${id}`} className="btn btn-outline-secondary btn-sm">
        &laquo; Бодлого руу буцах
      </Link>

      {/* Бодолтыг сайжруулах Modal */}
      <Modal show={showImproveModal} onHide={() => setShowImproveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Wand2 size={18} className="me-2 text-primary" />
            Бодолтыг сайжруулах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Горим */}
          <p className="fw-semibold small mb-2">Сайжруулах горим:</p>
          <div className="d-grid gap-2 mb-4">
            {[
              { value: 'expand', icon: <FileText size={15} className="me-2" />, label: 'Дэлгэрэнгүй болгох', desc: 'Алхам бүрийг тайлбарлах' },
              { value: 'shorten', icon: <Lightbulb size={15} className="me-2" />, label: 'Товчлох', desc: 'Зөвхөн гол алхмуудыг үлдээх' },
              { value: 'fix', icon: <Sparkles size={15} className="me-2" />, label: 'Засах', desc: 'Математикийн алдаа болон логикийг шалгах' },
            ].map(({ value, icon, label, desc }) => (
              <Button
                key={value}
                variant={improveMode === value ? 'primary' : 'outline-secondary'}
                size="sm"
                className="text-start"
                onClick={() => setImproveMode(value)}
              >
                {icon}
                <strong>{label}</strong>
                <span className="text-muted fw-normal ms-1">— {desc}</span>
              </Button>
            ))}
          </div>

          {/* Хадгалах байршил */}
          <p className="fw-semibold small mb-2">Үр дүнг хаана бичих:</p>
          <div className="d-grid gap-2 mb-4">
            <Button
              variant={improveDest === 'replace' ? 'primary' : 'outline-secondary'}
              size="sm"
              className="text-start"
              onClick={() => setImproveDest('replace')}
            >
              <Wand2 size={15} className="me-2" />
              <strong>Бодолтыг шинээр бичих</strong>
              <span className="text-muted fw-normal ms-1">— Заавар ба бодолт талбарыг солих</span>
            </Button>
            <Button
              variant={improveDest === 'note' ? 'primary' : 'outline-secondary'}
              size="sm"
              className="text-start"
              onClick={() => setImproveDest('note')}
            >
              <StickyNote size={15} className="me-2" />
              <strong>Note хэсэгт хадгалах</strong>
              <span className="text-muted fw-normal ms-1">— Одоогийн бодолтыг хэвээр үлдээх</span>
            </Button>
          </div>

          {/* Нэмэлт коммент */}
          <Form.Group>
            <Form.Label className="fw-semibold small mb-1">
              Нэмэлт зааварчилгаа <span className="text-muted fw-normal">(заавал биш)</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={improveComment}
              onChange={(e) => setImproveComment(e.target.value)}
              placeholder={'Жишээ: "3-р алхамд алдаа байна, зөв хариулт 42"\n"Геометрийн аргаар бод"\n"Хариулт нь бутархай байх ёстой"'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowImproveModal(false)}>
            <X size={15} className="me-1" />
            Цуцлах
          </Button>
          <Button variant="primary" size="sm" onClick={handleImprove}>
            <Wand2 size={15} className="me-1" />
            Сайжруулах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SolutionEditPage;
