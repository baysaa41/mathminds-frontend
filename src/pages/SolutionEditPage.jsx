// frontend/src/pages/SolutionEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Preview талбар бүрийн яг доор

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
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
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// Icons
import { Save, X, Lightbulb, FileText, StickyNote, ArrowLeft } from 'lucide-react';

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
      }}
    >
      <div className="small text-muted mb-1 fw-semibold">👁 Preview:</div>
      <MathJax hideUntilTypeset={'first'}>
        <div
          className="mathjax-content"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.7',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </MathJax>
    </div>
  );
};

// --- Үндсэн компонент ---
const SolutionEditPage = () => {
  const { uuid: id } = useParams(); // problem UUID
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Засварлаж байгаа solution
  const [currentSolution, setCurrentSolution] = useState(null);
  const [formData, setFormData] = useState({
    hint: '',
    solution: '',
    note: '',
  });

  // Debounced values for live preview
  const debouncedHint = useDebounce(formData.hint, 500);
  const debouncedSolution = useDebounce(formData.solution, 500);
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

      // Анхны solution-г автоматаар сонгох
      if (solutionsData.length > 0) {
        const firstSolution = solutionsData[0];
        setCurrentSolution(firstSolution);
        setFormData({
          hint: firstSolution.hint || '',
          solution: firstSolution.solution || '',
          note: firstSolution.note || '',
        });
      } else {
        // Шинэ solution
        setCurrentSolution(null);
        setFormData({ hint: '', solution: '', note: '' });
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
    if (!formData.hint && !formData.solution && !formData.note) {
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

  const handleSolutionSwitch = (solution) => {
    setCurrentSolution(solution);
    setFormData({
      hint: solution.hint || '',
      solution: solution.solution || '',
      note: solution.note || '',
    });
  };

  // Permission check
  const canEdit =
    user && problem && problem.author && (user.id === problem.author.id || user.is_staff);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error && !problem) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to={`/problem/${id}`} variant="outline-secondary" size="sm">
          &laquo; Буцах
        </Button>
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Бодлого олдсонгүй.</Alert>
        <Button as={Link} to="/" variant="outline-secondary" size="sm">
          &laquo; Нүүр хуудас
        </Button>
      </Container>
    );
  }

  if (!canEdit) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Та энэ бодлогын бодолтыг засах эрхгүй байна.</Alert>
        <Button as={Link} to={`/problem/${id}`} variant="outline-secondary" size="sm">
          &laquo; Буцах
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/problem/${id}` }}>
          {problem.title || `Бодлого #${id}`}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Бодолт засах</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header - Бодлогын мэдээлэл */}
      <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
        <div className="flex-grow-1">
          <MathJax hideUntilTypeset={'first'}>
            <h1 className="h3 fw-bold mathjax-content mb-2">{problem.title || `Бодлого #${id}`}</h1>
          </MathJax>
          <Stack direction="horizontal" gap={2} className="mb-2">
            {problem.level_name && <Badge bg="secondary">{problem.level_name}</Badge>}
            {currentSolution && <Badge bg="success">Одоогийн бодолт</Badge>}
            {!currentSolution && <Badge bg="primary">Шинэ бодолт</Badge>}
          </Stack>
        </div>
        <Button variant="outline-secondary" size="sm" as={Link} to={`/problem/${id}`}>
          <ArrowLeft size={16} className="me-1" />
          Буцах
        </Button>
      </Stack>

      {/* Бодлогын нөхцөл - товч харуулах */}
      <Card className="mb-4 bg-light border-0">
        <Card.Body className="p-3">
          <h6 className="fw-semibold mb-2">Бодлогын нөхцөл:</h6>
          <MathJax hideUntilTypeset={'first'}>
            <div
              className="mathjax-content small text-muted"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {problem.statement?.substring(0, 300)}
              {problem.statement?.length > 300 && '...'}
            </div>
          </MathJax>
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

        {/* Бусад бодолтууд сонгох (олон бодолт байвал) */}
        {solutions.length > 1 && (
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <strong>Одоо байгаа бодолтууд ({solutions.length})</strong>
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
                    {sol.author && ` (${sol.author.first_name})`}
                  </Button>
                ))}
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

        {/* Note Field + Preview */}
        <Card className="mb-4 border-info border-opacity-25">
          <Card.Header className="bg-info bg-opacity-10">
            <Stack direction="horizontal" gap={2}>
              <StickyNote size={18} className="text-info" />
              <strong>Тэмдэглэл (Note)</strong>
              {formData.note && (
                <Badge bg="info" className="ms-auto">
                  {formData.note.length} тэмдэгт
                </Badge>
              )}
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
    </Container>
  );
};

export default SolutionEditPage;
