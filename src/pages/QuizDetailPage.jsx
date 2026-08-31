// frontend/src/pages/QuizDetailPage.jsx
// (!!! ШИНЭ ФАЙЛ - СУУРЬ !!!)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import LivePreview from '../components/LivePreview.jsx';
import { MathJax } from 'better-react-mathjax';
import UserName from '../components/UserName.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';

const QuizDetailPage = () => {
  const { uuid: id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [deletingAttemptId, setDeletingAttemptId] = useState(null);
  const [showDeleteAttemptModal, setShowDeleteAttemptModal] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState(null);
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

  // Клубт оруулах modal
  const [showAddToClubModal, setShowAddToClubModal] = useState(false);
  const [teacherClubs, setTeacherClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [subgroups, setSubgroups] = useState([]);
  const [subgroupsLoading, setSubgroupsLoading] = useState(false);
  const [selectedSubgroupId, setSelectedSubgroupId] = useState('');
  const [addingToClub, setAddingToClub] = useState(false);
  const [addProgress, setAddProgress] = useState({ current: 0, total: 0 });
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // PDF татах (ESH загварын сорилго template)
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        // (!!!) Backend-с quiz-н мэдээллийг 'problems'-той нь хамт nested-ээр авчирна гэж таамаглаж байна
        const response = await apiClient.get(`/api/integral/quizzes/${id}/`);
        setQuiz(response.data);
        if (response.data?.title) {
          setPageTitle(`Тест · ${response.data.title}`);
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
        <Link to="/content/browse?type=quizzes"> &laquo; Тестийн сан руу буцах</Link>
      </Container>
    );
  }

  if (!quiz) {
    return null;
  }

  const isStaff = user && user.is_staff;
  const canEdit = user && quiz && (isStaff || (quiz.author && user.id === quiz.author.id));

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

  // Тестийг "ЭШ загварын сорилго" template-ээр PDF болгож татах
  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const response = await apiClient.get(`/api/integral/quizzes/${id}/download_pdf/`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${quiz?.title || 'quiz'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      let message = 'PDF татахад алдаа гарлаа. Дахин оролдоно уу.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.error) message = parsed.error;
        } catch (_e) {
          // parse хийж чадсангүй бол анхны message-ээ ашиглана
        }
      }
      alert(message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'quiz',
      item: {
        id: quiz.uuid,
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

  const handleShowAddToClub = async () => {
    setShowAddToClubModal(true);
    setAddError(null);
    setAddSuccess(false);
    setSelectedClubId('');
    setSelectedSubgroupId('');
    setSubgroups([]);
    setAddProgress({ current: 0, total: 0 });
    setClubsLoading(true);
    try {
      const res = await apiClient.get('/api/clubs/my_clubs/');
      const clubs = res.data?.results || res.data || [];
      setTeacherClubs(clubs.filter((c) => c.role === 'teacher'));
    } catch {
      setAddError('Клубын жагсаалт ачааллахад алдаа гарлаа.');
    } finally {
      setClubsLoading(false);
    }
  };

  const handleClubChange = async (clubId) => {
    setSelectedClubId(clubId);
    setSelectedSubgroupId('');
    setSubgroups([]);
    if (!clubId) return;
    setSubgroupsLoading(true);
    try {
      const res = await apiClient.get('/api/club-subgroups/', { params: { club: clubId } });
      setSubgroups(res.data?.results || res.data || []);
    } catch {
      // subgroup алдаа — чимээгүй орхино
    } finally {
      setSubgroupsLoading(false);
    }
  };

  const handleDeleteAttemptClick = (attempt) => {
    setAttemptToDelete(attempt);
    setShowDeleteAttemptModal(true);
  };

  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;
    setDeletingAttemptId(attemptToDelete.id);
    try {
      await apiClient.delete(`/api/integral/answer-sheets/${attemptToDelete.id}/delete/`);
      setMyAttempts((prev) => prev.filter((a) => a.id !== attemptToDelete.id));
    } catch (err) {
      console.error('Оролдлого устгахад алдаа:', err);
    } finally {
      setDeletingAttemptId(null);
      setShowDeleteAttemptModal(false);
      setAttemptToDelete(null);
    }
  };

  const handleAddToClub = async () => {
    if (!selectedClubId || !quiz.problems?.length) return;
    setAddingToClub(true);
    setAddError(null);
    setAddProgress({ current: 0, total: quiz.problems.length });
    try {
      const payload = { quiz_id: quiz.id };
      if (selectedSubgroupId) payload.subgroup_id = parseInt(selectedSubgroupId);
      await apiClient.post(`/api/clubs/${selectedClubId}/add-quiz-as-exercise/`, payload);
      setAddSuccess(true);
      setAddProgress({ current: quiz.problems.length, total: quiz.problems.length });
    } catch (err) {
      console.error('Дасгал нэмэхэд алдаа:', err);
      setAddError('Дасгал нэмэхэд алдаа гарлаа. Та клубын багш мөн эсэхийг шалгана уу.');
    } finally {
      setAddingToClub(false);
    }
  };

  return (
    <Container fluid className="py-4 px-4">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/quizzes' }}>
          Тестүүд
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <MathJax inline dynamic>{quiz.title || 'Тест'}</MathJax>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Row className="g-4">
        {/* Зүүн хэсэг: Тестийн мэдээлэл */}
        <Col lg={4} xl={3}>
          {/* Гарчиг */}
          <div className="mb-3">
            <div className="d-flex align-items-start gap-2">
              <h1 className="h4 fw-bold mathjax-content mb-1 flex-grow-1">
                <LivePreview content={quiz.title || 'Гарчиггүй тест'} />
              </h1>
              {canEdit && (
                <Button variant="outline-primary" size="sm" onClick={handleEditClick} title="Засварлах" className="flex-shrink-0">
                  <i className="bi bi-pencil me-1"></i>Засварлах
                </Button>
              )}
            </div>
            <div className="text-muted small">
              Зохиогч: <UserName user={quiz.author} />
            </div>
          </div>


          {/* PDF татах (ЭШ загварын сорилго template) + Клубт оруулах (багш нарт) */}
          {quiz.problems?.length > 0 && (
            <Stack gap={2} className="mb-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    PDF бэлдэж байна...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf me-1"></i>
                    PDF татах
                  </>
                )}
              </Button>
              {user && (
                <Button variant="outline-info" size="sm" onClick={handleShowAddToClub}>
                  <i className="bi bi-collection me-1"></i>
                  Клубт дасгал болгох
                </Button>
              )}
            </Stack>
          )}

          {/* Тайлбар */}
          {quiz.description && (
            <Card className="mb-3 bg-light">
              <Card.Body className="py-2">
                <Card.Text as="div" className="mathjax-content small">
                  <LivePreview content={quiz.description} />
                </Card.Text>
              </Card.Body>
            </Card>
          )}

          {/* Тестийн статистик */}
          {quiz.statistics && (
            <Card className="mb-3 border-primary">
              <Card.Body className="py-2">
                <div className="text-muted small mb-2">
                  <i className="bi bi-bar-chart text-primary me-1"></i>
                  Статистик
                </div>
                <Stack gap={2}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small"><i className="bi bi-people me-1"></i>Оролцогч</span>
                    <strong>{quiz.statistics.participants_count}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small"><i className="bi bi-award me-1"></i>Дундаж</span>
                    <strong>{quiz.statistics.average_score}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small"><i className="bi bi-trophy me-1"></i>Хамгийн өндөр</span>
                    <strong>{quiz.statistics.highest_score}</strong>
                  </div>
                </Stack>
              </Card.Body>
            </Card>
          )}

          {/* Бодлогын статистик */}
          {quiz.problems && quiz.problems.length > 0 && (
            <Card className="mb-3">
              <Card.Body className="py-2">
                <div className="text-muted small mb-2">Бодлогын төрөл</div>
                <Stack gap={1}>
                  {quiz.problems.filter((p) => p.type === 0).length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span className="small"><i className="bi bi-pencil-square text-secondary me-1"></i>Уламжлалт</span>
                      <Badge bg="secondary">{quiz.problems.filter((p) => p.type === 0).length}</Badge>
                    </div>
                  )}
                  {quiz.problems.filter((p) => p.type === 1).length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span className="small"><i className="bi bi-check-circle text-info me-1"></i>Сонгох</span>
                      <Badge bg="info">{quiz.problems.filter((p) => p.type === 1).length}</Badge>
                    </div>
                  )}
                  {quiz.problems.filter((p) => p.type === 4).length > 0 && (
                    <div className="d-flex justify-content-between">
                      <span className="small"><i className="bi bi-input-cursor text-warning me-1"></i>Нөхөх</span>
                      <Badge bg="warning" text="dark">{quiz.problems.filter((p) => p.type === 4).length}</Badge>
                    </div>
                  )}
                </Stack>
              </Card.Body>
            </Card>
          )}

          <Link to="/content/browse?type=quizzes" className="btn btn-outline-secondary btn-sm w-100">
            &laquo; Тестийн сан
          </Link>
        </Col>

        {/* Баруун хэсэг: Миний оролдлогууд */}
        <Col lg={8} xl={9}>
          <h5 className="mb-3 fw-bold">
            <i className="bi bi-clock-history me-2"></i>
            Миний оролдлогууд
          </h5>

          {!user ? (
            <Alert variant="info">Оролдлогуудаа харахын тулд нэвтэрнэ үү.</Alert>
          ) : attemptsLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : myAttempts.length === 0 ? (
            <Alert variant="light" className="text-muted">Оролдлого байхгүй байна.</Alert>
          ) : (
            <ListGroup>
              {myAttempts.map((attempt) => {
                const statusBadge = {
                  completed: { variant: 'success', text: 'Дууссан' },
                  in_progress: { variant: 'primary', text: 'Явагдаж байгаа' },
                  paused: { variant: 'warning', text: 'Түр зогссон' },
                }[attempt.status] || { variant: 'secondary', text: attempt.status };

                const formatDateTime = (dateString) => {
                  if (!dateString) return 'Тодорхойгүй';
                  return new Date(dateString).toLocaleString('mn-MN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
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
                        <Badge bg={statusBadge.variant} className="me-2">{statusBadge.text}</Badge>
                        <span className="small">{formatDateTime(attempt.started_at)}</span>
                      </div>
                      <Stack direction="horizontal" gap={3} className="text-muted small">
                        <span><i className="bi bi-trophy me-1"></i>{attempt.score || 0} оноо</span>
                        <span><i className="bi bi-clock me-1"></i>{formatTime(attempt.total_time_spent || 0)}</span>
                        <span><i className="bi bi-check-circle me-1"></i>{attempt.answers_count || 0} хариулт</span>
                      </Stack>
                    </div>
                    <Stack direction="horizontal" gap={2}>
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
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteAttemptClick(attempt)}
                        disabled={deletingAttemptId === attempt.id}
                        title="Оролдлого устгах"
                      >
                        {deletingAttemptId === attempt.id ? (
                          <Spinner as="span" size="sm" />
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </Button>
                    </Stack>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}

          {canEdit && (
            <div className="d-flex justify-content-between align-items-center gap-2 mt-3">
              <Link
                to={`/quiz/${id}/leaderboard`}
                className="btn btn-outline-warning btn-sm"
                title="Дүнгийн жагсаалт"
              >
                <i className="bi bi-trophy me-1"></i>
                Дүнгийн жагсаалт
              </Link>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={handleEditClick} title="Засварлах">
                  <i className="bi bi-pencil"></i>
                </Button>
                <Button variant="outline-success" size="sm" onClick={handleCreatePost} title="Постлох">
                  <i className="bi bi-megaphone"></i>
                </Button>
              </div>
            </div>
          )}

          {/* Эхлүүлэх товч */}
          <div className="d-grid mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/quiz/${id}/take`)}
              disabled={!quiz.problems || quiz.problems.length === 0}
            >
              <i className="bi bi-play-circle me-2"></i>
              Эхлүүлэх
            </Button>
            {(!quiz.problems || quiz.problems.length === 0) && (
              <small className="text-muted text-center mt-1">Бодлого байхгүй байна</small>
            )}
          </div>
        </Col>
      </Row>

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
      {/* Клубт дасгал болгох Modal */}
      <Modal
        show={showAddToClubModal}
        onHide={() => !addingToClub && setShowAddToClubModal(false)}
        centered
      >
        <Modal.Header closeButton={!addingToClub}>
          <Modal.Title>
            <i className="bi bi-collection me-2"></i>
            Клубт дасгал болгох
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clubsLoading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
              <span className="ms-2 text-muted">Клубуудыг ачааллаж байна...</span>
            </div>
          ) : teacherClubs.length === 0 && !addError ? (
            <Alert variant="info" className="mb-0">
              Та багш байгаа клуб олдсонгүй. Клубын admin болж нэгдсэний дараа ашиглах боломжтой.
            </Alert>
          ) : (
            <>
              <p className="text-muted small mb-3">
                Тестийн <strong>{quiz.problems?.length}</strong> бодлогыг сонгосон клубын{' '}
                <strong>Дасгал</strong> хэсэгт пост болгон оруулна.
              </p>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Клуб сонгох</Form.Label>
                <Form.Select
                  value={selectedClubId}
                  onChange={(e) => handleClubChange(e.target.value)}
                  disabled={addingToClub || addSuccess}
                >
                  <option value="">— Клуб сонгох —</option>
                  {teacherClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedClubId && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Дэд бүлэг{subgroupsLoading && <Spinner size="sm" animation="border" className="ms-2" />}
                  </Form.Label>
                  <Form.Select
                    value={selectedSubgroupId}
                    onChange={(e) => setSelectedSubgroupId(e.target.value)}
                    disabled={addingToClub || addSuccess || subgroupsLoading}
                  >
                    <option value="">Бүх гишүүдэд</option>
                    {subgroups.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name}
                      </option>
                    ))}
                  </Form.Select>
                  {selectedSubgroupId && (
                    <Form.Text className="text-muted">
                      Зөвхөн <strong>{subgroups.find(sg => String(sg.id) === selectedSubgroupId)?.name}</strong> дэд бүлэгт харагдана
                    </Form.Text>
                  )}
                </Form.Group>
              )}
            </>
          )}

          {addError && <Alert variant="danger" className="mb-0">{addError}</Alert>}

          {addSuccess && (
            <Alert variant="success" className="mb-0">
              <i className="bi bi-check-circle me-2"></i>
              <strong>{addProgress.current}/{addProgress.total}</strong> бодлого амжилттай
              клубын дасгал болгон оруулагдлаа!
            </Alert>
          )}

          {addingToClub && (
            <div className="text-center mt-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted small">
                {addProgress.current}/{addProgress.total} бодлого оруулж байна...
              </span>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddToClubModal(false)}
            disabled={addingToClub}
          >
            {addSuccess ? 'Хаах' : 'Цуцлах'}
          </Button>
          {!addSuccess && teacherClubs.length > 0 && (
            <Button
              variant="primary"
              onClick={handleAddToClub}
              disabled={!selectedClubId || addingToClub || clubsLoading}
            >
              {addingToClub ? (
                <>
                  <Spinner as="span" size="sm" className="me-2" />
                  {addProgress.current}/{addProgress.total}
                </>
              ) : (
                <>
                  <i className="bi bi-collection me-1"></i>
                  Оруулах
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Оролдлого устгах confirm Modal */}
      <Modal
        show={showDeleteAttemptModal}
        onHide={() => !deletingAttemptId && setShowDeleteAttemptModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6">
            <i className="bi bi-trash me-2 text-danger"></i>
            Оролдлого устгах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Энэ оролдлогыг устгахдаа итгэлтэй байна уу? Бүх хариулт устана.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteAttemptModal(false)}
            disabled={!!deletingAttemptId}
          >
            Болих
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={confirmDeleteAttempt}
            disabled={!!deletingAttemptId}
          >
            {deletingAttemptId ? (
              <Spinner as="span" size="sm" className="me-1" />
            ) : (
              <i className="bi bi-trash me-1"></i>
            )}
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizDetailPage;
