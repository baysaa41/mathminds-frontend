// frontend/src/pages/ProblemDetailPage.jsx
// (!!! ШИНЭЧИЛСЭН: LivePreview ашигласан)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import LivePreview from '../components/LivePreview.jsx'; // (!!!) 1. LivePreview импортлох
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
import { Lightbulb, BookOpen, FileText } from 'lucide-react';

const ProblemDetailPage = () => {
  const { uuid: id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPrefillData } = usePrefill();
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/api/integral/problems/${id}/`);
        setProblem(response.data);

        // LivePreview LaTeX-г харуулдаг тул setPageTitle-д цэвэр текст хэрэгтэй
        // Эсвэл энгийнээр тавина
        if (response.data?.title) {
          // Энгийн арга: LaTeX тэмдэгтүүдийг устгах
          const plainTitle = response.data.title.replace(/\$[^\$]*\$|\$\$[^\$]*\$\$/g, '').trim();
          setPageTitle(plainTitle || `Бодлого #${id}`);
        } else {
          setPageTitle(`Бодлого #${id}`);
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

    if (id) {
      fetchProblem();
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

      {/* Гарчиг ба Засварлах товч */}
      <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
        <h1 className="h3 fw-bold mb-0 flex-grow-1">
          <LivePreview content={problem.title || `Бодлого #${id}`} />
        </h1>
        {canEdit && (
          <>
            <Button variant="outline-success" size="sm" onClick={handleCreatePost}>
              <i className="bi bi-megaphone me-1"></i>
              Постлох
            </Button>
            <Button variant="outline-primary" size="sm" onClick={handleEditClick}>
              <i className="bi bi-pencil me-1"></i>
              Засварлах
            </Button>
          </>
        )}
      </Stack>

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
          <Stack direction="horizontal" gap={3} className="align-items-center mb-3">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
              <BookOpen size={20} />
              Заавар ба Бодолт
            </h5>
            {canEdit && (
              <Button
                as={Link}
                to={`/problem/${id}/solution/edit`}
                variant="outline-success"
                size="sm"
              >
                <FileText size={16} className="me-1" />
                Бодолт засах/нэмэх
              </Button>
            )}
          </Stack>

          <Alert variant="info" className="small mb-3">
            💡 Та эхлээд өөрөө бодохыг оролдоод, шаардлагатай үед л заавар болон бодолт харна уу.
          </Alert>

          <Accordion>
            {problem.solutions.map((solution, i) => (
              <div key={solution.id || i}>
                {solution.hint && (
                  <Accordion.Item eventKey={`hint-${solution.id || i}`}>
                    <Accordion.Header>
                      <Stack direction="horizontal" gap={2}>
                        <Lightbulb size={18} className="text-warning" />
                        <span>Заавар {problem.solutions.length > 1 ? `#${i + 1}` : ''}</span>
                      </Stack>
                    </Accordion.Header>
                    <Accordion.Body>
                      <LivePreview content={solution.hint} />
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {solution.solution && (
                  <Accordion.Item eventKey={`solution-${solution.id || i}`}>
                    <Accordion.Header>
                      <Stack direction="horizontal" gap={2}>
                        <FileText size={18} className="text-success" />
                        <span>Бодолт {problem.solutions.length > 1 ? `#${i + 1}` : ''}</span>
                      </Stack>
                    </Accordion.Header>
                    <Accordion.Body>
                      <div className="bg-light p-3 rounded">
                        <LivePreview content={solution.solution} />
                      </div>
                      {solution.author && (
                        <div className="text-muted small mt-3 pt-3 border-top">
                          <strong>Бодлогыг бодсон:</strong>{' '}
                          {solution.author.first_name || solution.author.email}
                        </div>
                      )}
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {solution.note && (
                  <Accordion.Item eventKey={`note-${solution.id || i}`}>
                    <Accordion.Header>
                      <Stack direction="horizontal" gap={2}>
                        <i className="bi bi-sticky"></i>
                        <span>Тэмдэглэл {problem.solutions.length > 1 ? `#${i + 1}` : ''}</span>
                      </Stack>
                    </Accordion.Header>
                    <Accordion.Body>
                      <LivePreview content={solution.note} />
                    </Accordion.Body>
                  </Accordion.Item>
                )}
              </div>
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
              <Button variant="primary" size="sm" as={Link} to={`/problem/${id}/solution/edit`}>
                Бодолт нэмэх
              </Button>
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
