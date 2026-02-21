// frontend/src/pages/QuizDetailPage.jsx
// (!!! ШИНЭ ФАЙЛ - СУУРЬ !!!)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import LivePreview from '../components/LivePreview.jsx';
import UserName from '../components/UserName.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';

const QuizDetailPage = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myAttempts, setMyAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPrefillData } = usePrefill();
  const { setPageTitle } = useOutletContext();

  // Нийтлэгдсэн тест засах modal
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        // (!!!) Backend-с quiz-н мэдээллийг 'problems'-той нь хамт nested-ээр авчирна гэж таамаглаж байна
        const response = await apiClient.get(`/api/integral/quizzes/${id}/`);
        setQuiz(response.data);
        if (response.data?.title) {
          setPageTitle(response.data.title);
        }
      } catch (err) {
        setError(
          err.response?.status === 404 ? 'Тест олдсонгүй.' : 'Тестийг ачааллахад алдаа гарлаа.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    }

    return () => {
      setPageTitle('Нүүр');
    };
  }, [id, setPageTitle]);

  // Өмнөх оролдлогуудыг авах
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!quiz || !user) return;
      try {
        setAttemptsLoading(true);
        const response = await apiClient.get(`/api/integral/quizzes/${id}/my-attempts/`);
        setMyAttempts(response.data);
      } catch (err) {
        console.error('Оролдлогууд ачааллахад алдаа:', err);
      } finally {
        setAttemptsLoading(false);
      }
    };
    fetchAttempts();
  }, [quiz, user, id]);

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
        <Link to="/quizzes"> &laquo; Тестийн сан руу буцах</Link>
      </Container>
    );
  }

  if (!quiz) {
    return null;
  }

  const canEdit = user && quiz && quiz.author && (user.id === quiz.author.id || user.is_staff);

  // Засварлах товч дарах
  const handleEditClick = () => {
    if (quiz.is_published) {
      // Нийтлэгдсэн бол modal харуулна
      setShowCloneModal(true);
    } else {
      // Ноорог бол шууд засна
      navigate(`/quiz/${id}/edit`);
    }
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'quiz',
      item: {
        id: quiz.id,
        title: quiz.title
      }
    });
    navigate('/');
  };

  // Тест хуулах
  const handleCloneQuiz = async () => {
    setCloning(true);
    try {
      const response = await apiClient.post(`/api/integral/quizzes/${id}/clone/`);
      const newQuizId = response.data.new_id;
      // Шинэ тест руу шилжинэ
      navigate(`/quiz/${newQuizId}/edit`);
    } catch (err) {
      console.error('Тест хуулахад алдаа гарлаа:', err);
      setError('Тест хуулахад алдаа гарлаа.');
    } finally {
      setCloning(false);
      setShowCloneModal(false);
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/quizzes' }}>
          Тестүүд
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{quiz.title || 'Тест'}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Гарчиг ба Засварлах товч */}
      <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
        <div className="flex-grow-1">
          <h1 className="h3 fw-bold mathjax-content mb-1">
            <LivePreview content={quiz.title || 'Гарчиггүй тест'} />
          </h1>
          <div className="text-muted small">
            Зохиогч: <UserName user={quiz.author} />
          </div>
        </div>
        {canEdit && (
          <>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleCreatePost}
              className="flex-shrink-0"
            >
              <i className="bi bi-megaphone me-1"></i>
              Постлох
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleEditClick}
              className="flex-shrink-0"
            >
              <i className="bi bi-pencil me-1"></i>
              Засварлах
            </Button>
          </>
        )}
      </Stack>

      {/* Тайлбар */}
      {quiz.description && (
        <Card className="mb-4 bg-light">
          <Card.Body>
            <Card.Text as="div" className="mathjax-content">
              <LivePreview content={quiz.description} />
            </Card.Text>
          </Card.Body>
        </Card>
      )}

      {/* Тестийн статистик */}
      {quiz.statistics && (
        <Card className="mb-4 border-primary">
          <Card.Body>
            <h6 className="mb-3">
              <i className="bi bi-bar-chart text-primary me-2"></i>
              Тестийн статистик
            </h6>
            <Stack direction="horizontal" gap={4} className="flex-wrap">
              <div>
                <i className="bi bi-people text-primary me-2"></i>
                <strong className="fs-4">{quiz.statistics.participants_count}</strong>
                <div className="text-muted small">оролцогч</div>
              </div>
              <div>
                <i className="bi bi-award text-success me-2"></i>
                <strong className="fs-4">{quiz.statistics.average_score}</strong>
                <div className="text-muted small">дундаж оноо</div>
              </div>
              <div>
                <i className="bi bi-trophy text-warning me-2"></i>
                <strong className="fs-4">{quiz.statistics.highest_score}</strong>
                <div className="text-muted small">хамгийн өндөр</div>
              </div>
            </Stack>
          </Card.Body>
        </Card>
      )}

      {/* Бодлогын статистик */}
      {quiz.problems && quiz.problems.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h6 className="mb-3">Бодлогын статистик:</h6>
            <Stack direction="horizontal" gap={3} className="flex-wrap">
              {(() => {
                const stats = {
                  traditional: quiz.problems.filter((p) => p.type === 0).length,
                  multipleChoice: quiz.problems.filter((p) => p.type === 1).length,
                  fillInBlank: quiz.problems.filter((p) => p.type === 4).length,
                };
                return (
                  <>
                    {stats.traditional > 0 && (
                      <div>
                        <i className="bi bi-pencil-square text-secondary me-1"></i>
                        <strong>{stats.traditional}</strong> уламжлалт
                      </div>
                    )}
                    {stats.multipleChoice > 0 && (
                      <div>
                        <i className="bi bi-check-circle text-info me-1"></i>
                        <strong>{stats.multipleChoice}</strong> сонгох
                      </div>
                    )}
                    {stats.fillInBlank > 0 && (
                      <div>
                        <i className="bi bi-input-cursor text-warning me-1"></i>
                        <strong>{stats.fillInBlank}</strong> нөхөх
                      </div>
                    )}
                  </>
                );
              })()}
            </Stack>
          </Card.Body>
        </Card>
      )}

      <hr />

      {/* Тест эхлүүлэх */}
      <div className="d-grid gap-2 mb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate(`/quiz/${id}/take`)}
          disabled={!quiz.problems || quiz.problems.length === 0}
        >
          <i className="bi bi-play-circle me-2"></i>
          Тест эхлүүлэх
        </Button>
        {(!quiz.problems || quiz.problems.length === 0) && (
          <small className="text-muted text-center">Энэ тестэд бодлого байхгүй байна</small>
        )}
      </div>

      {/* Агуулагдсан бодлогууд */}
      <h4 className="mb-3">Тестэд багтсан бодлогууд ({quiz.problems?.length || 0})</h4>

      {quiz.problems && quiz.problems.length > 0 ? (
        <ListGroup variant="flush">
          {quiz.problems.map((problem, index) => (
            <ListGroup.Item
              key={problem.id}
              className="d-flex justify-content-between align-items-start p-3"
            >
              <div className="ms-2 me-auto">
                <div className="fw-bold mathjax-content mb-2">
                  <LivePreview
                    content={`${index + 1}. ${problem.title || `Бодлого #${problem.id}`}`}
                  />
                </div>
                <div className="text-muted small mathjax-content">
                  <LivePreview content={problem.statement?.substring(0, 150) + '...'} />
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate(`/problem/${problem.id}`)}
                title="Бодлогыг харах"
              >
                <i className="bi bi-eye"></i>
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <Alert variant="info">Энэ тестэд одоогоор бодлого нэмэгдээгүй байна.</Alert>
      )}

      {/* Миний оролдлогууд */}
      {user && myAttempts && myAttempts.length > 0 && (
        <>
          <hr className="mt-5" />
          <h4 className="mb-3">
            <i className="bi bi-clock-history me-2"></i>
            Миний оролдлогууд
          </h4>
          {attemptsLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <ListGroup>
              {myAttempts.map((attempt) => {
                const statusBadge = {
                  completed: { variant: 'success', icon: 'check-circle', text: 'Дууссан' },
                  in_progress: { variant: 'primary', icon: 'play-circle', text: 'Явагдаж байгаа' },
                  paused: { variant: 'warning', icon: 'pause-circle', text: 'Түр зогссон' },
                }[attempt.status] || {
                  variant: 'secondary',
                  icon: 'question-circle',
                  text: attempt.status,
                };

                const formatDate = (dateString) => {
                  if (!dateString) return 'Тодорхойгүй';
                  const date = new Date(dateString);
                  return date.toLocaleString('mn-MN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                };

                const formatTime = (seconds) => {
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  return `${mins}м ${secs}с`;
                };

                return (
                  <ListGroup.Item
                    key={attempt.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="mb-1">
                        <i className={`bi bi-${statusBadge.icon} me-1`}></i>
                        <strong>{formatDate(attempt.started_at)}</strong>
                      </div>
                      <Stack direction="horizontal" gap={3} className="text-muted small">
                        <span>
                          <i className="bi bi-trophy me-1"></i>
                          {attempt.score || 0} оноо
                        </span>
                        <span>
                          <i className="bi bi-clock me-1"></i>
                          {formatTime(attempt.total_time_spent || 0)}
                        </span>
                        <span>
                          <i className="bi bi-check-circle me-1"></i>
                          {attempt.answers_count || 0} хариулт
                        </span>
                      </Stack>
                    </div>
                    <div>
                      {attempt.status === 'completed' ? (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/quiz/${id}/result/${attempt.id}`)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          Дүн харах
                        </Button>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => navigate(`/quiz/${id}/take`)}
                        >
                          <i className="bi bi-play-circle me-1"></i>
                          Үргэлжлүүлэх
                        </Button>
                      )}
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </>
      )}

      <hr className="mt-5" />
      <Link to="/quizzes" className="btn btn-outline-secondary btn-sm mt-3">
        &laquo; Тестийн сан руу буцах
      </Link>

      {/* Нийтлэгдсэн тест засах Modal */}
      <Modal show={showCloneModal} onHide={() => setShowCloneModal(false)} centered>
        <Modal.Header closeButton className="bg-warning">
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2"></i>
            ⚠️ Нийтлэгдсэн тест засварлах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Энэ тест <strong>нийтлэгдсэн</strong> байна. Засварлах нь дараах нөлөөтэй:
          </p>
          <ul className="mb-3">
            <li>Тестийг өмнө нь бөглөсөн хэрэглэгчдийн хариулт өөрчлөгдөж болзошгүй</li>
            <li>Статистик, үр дүн буруу харагдаж болзошгүй</li>
            <li>Идэвхтэй тест бөглөж байгаа хүмүүст асуудал үүсгэж болзошгүй</li>
          </ul>
          <Alert variant="info" className="mb-0">
            <strong>Зөвлөмж:</strong>
            <ul className="mb-0 mt-2">
              <li>Зөвхөн алдаа засах гэж байвал "Засварлах" дарна уу</li>
              <li>Томоохон өөрчлөлт хийх бол "Хуулбар үүсгэх" дарж шинэ тест үүсгэнэ үү</li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCloneModal(false)} disabled={cloning}>
            Цуцлах
          </Button>
          <Button
            variant="outline-primary"
            onClick={handleCloneQuiz}
            disabled={cloning}
          >
            {cloning ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Хуулж байна...
              </>
            ) : (
              <>
                <i className="bi bi-copy me-2"></i>
                Хуулбар үүсгэх
              </>
            )}
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowCloneModal(false);
              navigate(`/quiz/${id}/edit`);
            }}
            disabled={cloning}
          >
            <i className="bi bi-pencil me-2"></i>
            Засварлах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizDetailPage;
