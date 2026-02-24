// frontend/src/pages/ProblemDetailPage.jsx
// (!!! ШИНЭЧИЛСЭН: LivePreview ашигласан)

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import LivePreview from '../components/LivePreview.jsx';
import UserName from '../components/UserName.jsx';
import { formatDate } from '../utils/dateFormatter';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';

// Icons
import { Lightbulb, BookOpen, FileText, Sparkles, Pencil, Trash2, StickyNote } from 'lucide-react';

// ─── Бодлогын зургийн gallery (viewerjs) ─────────────────────────────────
const ProblemImageGallery = ({ images }) => {
  const galleryRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!galleryRef.current || !images || images.length === 0) return;

    viewerRef.current = new Viewer(galleryRef.current, {
      toolbar: {
        zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1,
        prev: images.length > 1 ? 1 : 0,
        play: 0,
        next: images.length > 1 ? 1 : 0,
        rotateLeft: 1, rotateRight: 1,
        flipHorizontal: 0, flipVertical: 0,
      },
      navbar: images.length > 1,
      title: false,
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <div ref={galleryRef} className="d-flex flex-wrap gap-2 mt-3">
      {images.map((img, i) => (
        <img
          key={img.id || i}
          src={img.image}
          alt={`Зураг ${i + 1}`}
          style={{
            height: 120,
            maxWidth: 200,
            objectFit: 'contain',
            borderRadius: 8,
            border: '1px solid #dee2e6',
            background: '#f8f9fa',
            cursor: 'zoom-in',
          }}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────
const ProblemDetailPage = () => {
  const { uuid: id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPrefillData } = usePrefill();
  const { setPageTitle } = useOutletContext();

  const fetchProblem = async (problemId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/integral/problems/${problemId}/`);
      setProblem(response.data);

      if (response.data?.title) {
        const plainTitle = response.data.title.replace(/\$[^\$]*\$|\$\$[^\$]*\$\$/g, '').trim();
        setPageTitle(plainTitle || `Бодлого #${problemId}`);
      } else {
        setPageTitle(`Бодлого #${problemId}`);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('Бодлого олдсонгүй.');
      } else {
        setError('Бодлогыг уншихад алдаа гарлаа.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProblem(id);
    } else {
      setError('Бодлогын дугаар (ID) олдсонгүй.');
      setLoading(false);
      setPageTitle('Алдаа');
    }

    // Cleanup function
    return () => {
      setPageTitle('Нүүр'); // Компонент unmount хийгдэхэд гарчгийг буцаах
    };
  }, [id, setPageTitle]);

  const handleGenerateAI = async () => {
    try {
      setGeneratingAI(true);
      setAiSuccess(false);
      await apiClient.post(`/api/integral/problems/${id}/generate_ai_solution/`);
      setAiSuccess(true);
      await fetchProblem(id);
    } catch (err) {
      console.error('AI бодолт үүсгэхэд алдаа:', err);
      setError(err.response?.data?.error || 'AI бодолт үүсгэж чадсангүй.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDeleteSolution = async (solutionId) => {
    if (!window.confirm('Энэ бодолтыг устгах уу?')) return;
    try {
      await apiClient.delete(`/api/integral/solutions/${solutionId}/`);
      await fetchProblem(id);
    } catch (err) {
      console.error('Бодолт устгахад алдаа:', err);
      setError(err.response?.data?.error || 'Бодолт устгаж чадсангүй.');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Link to="/content/browse?type=problems"> &laquo; Бодлогын сан руу буцах</Link>{' '}
        {/* "/" -г "/problems" болгосон */}
      </Container>
    );
  }

  if (!problem) {
    return null;
  }

  const canEdit =
    user && problem && problem.author && (user.id === problem.author.id || user.is_staff);

  const handleEditClick = () => {
    navigate(`/problem/${id}/edit`);
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'problem',
      item: {
        id: problem.uuid,
        title: problem.title,
        statement: problem.statement,
      }
    });
    navigate('/');
  };

  const getProblemTypeLabel = (type) => {
    switch (type) {
      case 0:
        return 'Уламжлалт';
      case 1:
        return 'Сонгох тест';
      case 4:
        return 'Нөхөх тест';
      default:
        return 'Төрөл тодорхойгүй';
    }
  };

  const hasSolutions = problem.solutions && problem.solutions.length > 0;

  return (
    <Container className="py-4">
      <Breadcrumb listProps={{ className: 'mb-3' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/problems' }}>
          Бодлогын сан
        </Breadcrumb.Item>
        {/* Гарчгийг Breadcrumb дотор LivePreview-гүйгээр харуулах нь дээр (урт байж болно) */}
        <Breadcrumb.Item active>
          {problem.title
            ? problem.title.substring(0, 50) + (problem.title.length > 50 ? '...' : '')
            : `Бодлого #${id}`}
        </Breadcrumb.Item>
      </Breadcrumb>

      {aiSuccess && (
        <Alert variant="success" dismissible onClose={() => setAiSuccess(false)} className="mb-3">
          AI бодолт амжилттай үүслээ!
        </Alert>
      )}

      {/* Гарчиг ба Засварлах товч */}
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-2">
          <LivePreview content={problem.title || `Бодлого #${id}`} />
        </h1>
        {canEdit && (
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-success" size="sm" onClick={handleCreatePost}>
              <i className="bi bi-megaphone me-1"></i>
              Постлох
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleEditClick}>
              <i className="bi bi-pencil me-1"></i>
              Засварлах
            </Button>
          </Stack>
        )}
      </div>

      {/* Мэдээллийн badges */}
      <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
        {problem.level_name && <Badge bg="secondary">{problem.level_name}</Badge>}
        {problem.type !== undefined && <Badge bg="info">{getProblemTypeLabel(problem.type)}</Badge>}
        {problem.is_public ? (
          <Badge bg="success">Нийтэд харагдана</Badge>
        ) : (
          <Badge bg="secondary">Хувийн</Badge>
        )}
      </Stack>

      {/* Зохиогч, огноо */}
      <div className="text-muted mb-4 small d-flex flex-wrap gap-2 align-items-center">
        <span>
          Зохиогч: <UserName user={problem.author} />
        </span>
        {problem.last_edited && (
          <>
            <span className="d-none d-sm-inline mx-1">|</span>
            <span>Сүүлд засварласан: {formatDate(problem.last_edited)}</span>
          </>
        )}
      </div>

      <hr className="mb-4" />

      {/* Бодлогын агуулга */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-3">Бодлогын нөхцөл:</h5>
        <div className="problem-statement p-3 bg-light rounded">
          <LivePreview content={problem.statement || '(Нөхцөл оруулаагүй)'} />
        </div>
        {/* Хавсралт зурагнууд */}
        {problem.images && problem.images.length > 0 && (
          <div className="mt-3">
            <small className="text-muted fw-semibold d-block mb-2">
              <i className="bi bi-images me-1" />
              ХАВСРАЛТ ЗУРАГНУУД ({problem.images.length})
            </small>
            <ProblemImageGallery images={problem.images} />
          </div>
        )}
      </div>

      {/* Сонголтууд */}
      {problem.type === 1 && problem.choices && problem.choices.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-semibold mb-3">Сонголтууд:</h5>
          <div className="list-group">
            {problem.choices.map((choice, index) => {
              const isCorrect = canEdit && choice.default_score > 0;
              return (
                <div
                  key={choice.id || index}
                  className={`list-group-item d-flex align-items-start ${isCorrect ? 'bg-success-subtle' : ''}`}
                >
                  <strong className="me-2">
                    {choice.label || `${String.fromCharCode(65 + index)}.`}
                  </strong>{' '}
                  <div className="flex-grow-1">
                    <LivePreview content={choice.value || '(Сонголт хоосон)'} />
                  </div>
                  {isCorrect && (
                    <Badge bg="success" className="ms-2 flex-shrink-0">
                      Зөв
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Заавар ба бодолт */}
      {hasSolutions && (
        <div className="mb-4">
          <div className="mb-3">
            <h5 className="fw-semibold mb-2 d-flex align-items-center gap-2">
              <BookOpen size={20} />
              Заавар ба Бодолт
            </h5>
            {canEdit && (
              <Stack direction="horizontal" gap={2}>
                <Button
                  as={Link}
                  to={`/problem/${id}/solution/new`}
                  variant="outline-success"
                  size="sm"
                  state={{ forceNew: true }}
                >
                  <i className="bi bi-plus-lg me-1" />
                  Шинэ бодолт нэмэх
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Үүсгэж байна...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="me-1" />
                      AI бодолт
                    </>
                  )}
                </Button>
              </Stack>
            )}
          </div>

          <Alert variant="info" className="small mb-3">
            💡 Та эхлээд өөрөө бодохыг оролдоод, шаардлагатай үед л заавар болон бодолт харна уу.
          </Alert>

          <Accordion>
            {problem.solutions.map((solution, i) => (
              <Accordion.Item key={solution.id || i} eventKey={`sol-${solution.id || i}`}>
                <Accordion.Header>
                  <Stack direction="horizontal" gap={2}>
                    <BookOpen size={18} className="text-primary flex-shrink-0" />
                    <span className="fw-semibold">Бодолт #{i + 1}</span>
                    {solution.author && (
                      <span className="text-muted fw-normal small">
                        — {solution.author.first_name || solution.author.username}
                      </span>
                    )}
                  </Stack>
                </Accordion.Header>
                <Accordion.Body>
                  {solution.hint && (
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Lightbulb size={16} className="text-warning" />
                        <strong className="small text-uppercase text-muted">Заавар</strong>
                      </div>
                      <div className="ps-3 border-start border-warning border-2">
                        <LivePreview content={solution.hint} />
                      </div>
                    </div>
                  )}

                  {solution.solution && (
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FileText size={16} className="text-success" />
                        <strong className="small text-uppercase text-muted">Бодолт</strong>
                      </div>
                      <div className="bg-light p-3 rounded">
                        <LivePreview content={solution.solution} />
                      </div>
                    </div>
                  )}

                  {solution.note && (
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <StickyNote size={16} className="text-info" />
                        <strong className="small text-uppercase text-muted">Тэмдэглэл</strong>
                      </div>
                      <LivePreview content={solution.note} />
                    </div>
                  )}

                  <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                    <div className="text-muted small">
                      {solution.author && (
                        <span>
                          Бодсон: <strong>{solution.author.first_name || solution.author.username}</strong>
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <Stack direction="horizontal" gap={2}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          as={Link}
                          to={`/problem/${id}/solution/new`}
                          state={{ solutionId: solution.id }}
                        >
                          <Pencil size={14} className="me-1" />
                          Засах
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteSolution(solution.id)}
                        >
                          <Trash2 size={14} className="me-1" />
                          Устгах
                        </Button>
                      </Stack>
                    )}
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      )}

      {/* Бодолт байхгүй үед */}
      {!hasSolutions && canEdit && (
        <div className="mb-4">
          <Card className="border-dashed">
            <Card.Body className="text-center py-4">
              <BookOpen size={32} className="text-muted mb-3" />
              <p className="text-muted mb-3">Энэ бодлогод заавар ба бодолт байхгүй байна.</p>
              <Stack direction="horizontal" gap={2} className="justify-content-center">
                <Button variant="primary" size="sm" as={Link} to={`/problem/${id}/solution/new`}>
                  Бодолт нэмэх
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Үүсгэж байна...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="me-1" />
                      AI бодолт үүсгэх
                    </>
                  )}
                </Button>
              </Stack>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Хариулт */}
      {canEdit &&
        problem.answer && ( // !hasSolutions нөхцөлийг хассан - хариултыг үргэлж харуулна
          <div className="mb-4">
            <h5 className="fw-semibold mb-3">Хариулт (Зөвхөн засварлах эрхтэй хүнд харагдана):</h5>
            <div className="problem-answer p-3 bg-warning bg-opacity-10 rounded border border-warning">
              <LivePreview content={problem.answer} />
            </div>
          </div>
        )}

      <hr className="mt-5" />
      <Link to="/content/browse?type=problems" className="btn btn-outline-secondary btn-sm mt-3">
        &laquo; Бодлогын сан руу буцах
      </Link>
    </Container>
  );
};

export default ProblemDetailPage;
