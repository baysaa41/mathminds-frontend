// frontend/src/pages/QuizEditPage.jsx
// (!!! ШИНЭЧИЛСЭН: react-beautiful-dnd ашиглан Drag-and-Drop эрэмбэлэлт нэмсэн)
// ✅ ШИНЭЧИЛСЭН: Icons нэмсэн

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import LivePreview from '../components/LivePreview.jsx';

// (!!!) 1. Drag and Drop-д зориулсан импортууд
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

// Lucide React Icons
import { Edit3, Save, X, FileText, AlignLeft, Clock, GraduationCap, PlusCircle, Sparkles, Trash2 } from 'lucide-react';

const QuizEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [grades, setGrades] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [originalTitle, setOriginalTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Нийтлэгдсэн тест засварлах анхааруулга
  const [showPublishedWarning, setShowPublishedWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  const [showProblemModal, setShowProblemModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  // ... (Modal-н бусад state-үүд хэвээрээ) ...
  const [modalProblems, setModalProblems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalNextPageUrl, setModalNextPageUrl] = useState(null);
  const [modalLoadError, setModalLoadError] = useState(null);
  const modalLoadMoreTriggerRef = useRef(null);
  const isHandlingModalLoadMore = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizRes = await apiClient.get(`/api/integral/quizzes/${id}/`);
        const quizData = quizRes.data;

        if (!user || !quizData.author || (user.id !== quizData.author.id && !user.is_staff)) {
          setError('Энэ тестийг засварлах эрх танд байхгүй байна.');
          setLoading(false);
          return;
        }

        setTitle(quizData.title || '');
        setOriginalTitle(quizData.title || '');
        setDescription(quizData.description || '');
        setIsPublic(quizData.is_public ?? false);
        setDefaultTimeLimit(quizData.default_time_limit ?? '');
        setGradeId(quizData.grade?.id ?? '');
        setSelectedProblems(quizData.problems || []);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Засварлах тест олдсонгүй.'
            : 'Тестийн мэдээллийг татахад алдаа гарлаа.'
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchGrades = async () => {
      try {
        const res = await apiClient.get('/api/integral/grades/');
        setGrades(Array.isArray(res.data) ? res.data : (res.data?.results || []));
      } catch {
        // grades татахад алдаа гарвал хоосон жагсаалттайгаар үргэлжлүүлнэ
      }
    };

    fetchData();
    fetchGrades();
  }, [id, user]);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/integral/quizzes/${id}/`);
      navigate('/content/browse?type=quizzes');
    } catch {
      setError('Тестийг устгахад алдаа гарлаа.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // (!!!) 2. ШИНЭ ФУНКЦ: Drag дуусахад ажиллах
  const handleDragEnd = (result) => {
    // Анхааруулга уншаагүй бол drag-г зөвшөөрөхгүй
    if (!warningAcknowledged && isPublic) {
      return;
    }

    const { destination, source } = result;

    // Хэрэв жагсаалтаас гадуур унагавал юу ч хийхгүй
    if (!destination) {
      return;
    }

    // Хэрэв байрандаа буцааж тавьсан бол юу ч хийхгүй
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    // State-г өөрчлөхийн тулд шинэ хуулбар үүсгэх
    const newSelectedProblems = Array.from(selectedProblems);

    // Чирсэн элементийг салгаж авах
    const [reorderedItem] = newSelectedProblems.splice(source.index, 1);

    // Шинэ байрлалд нь нэмэх
    newSelectedProblems.splice(destination.index, 0, reorderedItem);

    // State-г шинэ дарааллаар шинэчлэх
    setSelectedProblems(newSelectedProblems);
  };

  // (!!!) handleSave функц ЯМАР Ч ӨӨРЧЛӨЛТГҮЙ ажиллана.
  // Учир нь 'selectedProblems' state-н дараалал өөрчлөгдсөн тул
  // problemIds нь автоматаар зөв дарааллыг авах болно.
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const problemIds = selectedProblems.map((p) => p.uuid);

    try {
      await apiClient.patch(`/api/integral/quizzes/${id}/`, {
        title: title,
        description: description,
        is_public: isPublic,
        default_time_limit: defaultTimeLimit !== '' ? Number(defaultTimeLimit) : null,
        grade: gradeId !== '' ? Number(gradeId) : null,
        problems: problemIds,
      });
      navigate(`/quiz/${id}`);
    } catch (err) {
      setError('Тестийг хадгалахад алдаа гарлаа.');
      console.error(err);
      setSaving(false);
    }
  };

  // ... (Modal-н бүх функцууд: handleShowProblemModal, fetchModalProblems г.м. хэвээрээ) ...
  // --- Modal-н функцууд ---
  const handleShowProblemModal = () => {
    setShowProblemModal(true);
    setModalProblems([]);
    setModalSearchQuery('');
    setModalNextPageUrl(null);
    setModalLoadError(null);
    fetchModalProblems('', true);
  };
  const handleCloseProblemModal = () => {
    setShowProblemModal(false);
  };
  const fetchModalProblems = async (query, isNewSearch = false) => {
    setModalLoading(true);
    setModalLoadError(null);
    isHandlingModalLoadMore.current = true;
    const params = { search: query, page_size: 10 };
    try {
      const response = await apiClient.get('/api/integral/problems/', { params });
      if (response.data && Array.isArray(response.data.results)) {
        setModalProblems(
          isNewSearch ? response.data.results : [...modalProblems, ...response.data.results]
        );
        setModalNextPageUrl(response.data.next);
      }
    } catch (err) {
      setModalLoadError('Бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setModalLoading(false);
      setTimeout(() => {
        isHandlingModalLoadMore.current = false;
      }, 300);
    }
  };
  const handleModalSearchSubmit = (e) => {
    e.preventDefault();
    fetchModalProblems(modalSearchQuery, true);
  };
  const handleModalLoadMore = useCallback(async () => {
    if (!modalNextPageUrl || isHandlingModalLoadMore.current) return;
    isHandlingModalLoadMore.current = true;
    setModalLoading(true);
    try {
      const response = await apiClient.get(modalNextPageUrl);
      if (response.data && Array.isArray(response.data.results)) {
        setModalProblems((prev) => [...prev, ...response.data.results]);
        setModalNextPageUrl(response.data.next);
      }
    } catch (err) {
      setModalLoadError('Нэмэлт бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setModalLoading(false);
      setTimeout(() => {
        isHandlingModalLoadMore.current = false;
      }, 300);
    }
  }, [modalNextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && modalNextPageUrl && !isHandlingModalLoadMore.current) {
          handleModalLoadMore();
        }
      },
      { threshold: 1.0 }
    );
    const currentTrigger = modalLoadMoreTriggerRef.current;
    if (currentTrigger) observer.observe(currentTrigger);
    return () => {
      if (currentTrigger) observer.unobserve(currentTrigger);
    };
  }, [modalNextPageUrl, handleModalLoadMore]);
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState(null);

  const handleGenerateSummary = async (problem) => {
    setGeneratingSummaryFor(problem.id);
    try {
      const response = await apiClient.post(`/api/integral/problems/${problem.uuid}/generate_summary/`);
      const newSummary = response.data.ai_summary;
      setSelectedProblems((prev) =>
        prev.map((p) => (p.id === problem.id ? { ...p, ai_summary: newSummary } : p))
      );
    } catch (err) {
      console.error('AI summary generation error:', err);
    } finally {
      setGeneratingSummaryFor(null);
    }
  };

  // --- Сонгогдсон бодлогыг удирдах (хэвээрээ) ---
  const handleAddProblem = (problem) => {
    if (!selectedProblems.find((p) => p.id === problem.id)) {
      setSelectedProblems((prev) => [...prev, problem]);
    }
  };
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems((prev) => prev.filter((p) => p.id !== problemId));
  };

  // --- Үндсэн Render (loading, error хэсгүүд хэвээрээ) ---
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
        <Link to={id ? `/quiz/${id}` : '/quizzes'}> &laquo; Буцах</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/quizzes' }}>
          Тестүүд
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/quiz/${id}` }}>
          {originalTitle || 'Тест'}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Засварлах</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="h3 fw-bold mb-4">
        <Edit3 size={24} className="me-2" />
        Тест засварлах
      </h1>

      <Form onSubmit={handleSave}>
        <Row>
          {/* Зүүн тал: Бодлогуудын жагсаалт */}
          <Col lg={8}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Card className="mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                  Тестэд багтсан бодлогууд ({selectedProblems.length})
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleShowProblemModal}
                    disabled={!warningAcknowledged && isPublic}
                  >
                    <PlusCircle size={16} className="me-1" />
                    Бодлого нэмэх
                  </Button>
                </Card.Header>

                <Droppable droppableId="selectedProblemsList">
                  {(provided) => (
                    <ListGroup variant="flush" ref={provided.innerRef} {...provided.droppableProps}>
                      {selectedProblems.length > 0 ? (
                        selectedProblems.map((problem, index) => (
                          <Draggable
                            key={problem.id}
                            draggableId={String(problem.id)}
                            index={index}
                          >
                            {(provided) => (
                              <ListGroup.Item
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="d-flex align-items-center"
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="me-3 px-2 text-muted"
                                  title="Чирч эрэмбийг солих"
                                  style={{ cursor: 'grab' }}
                                >
                                  <i className="bi bi-grip-vertical"></i>
                                </div>

                                <span className="fw-bold me-3">{index + 1}.</span>

                                <div className="flex-grow-1">
                                  <LivePreview
                                    content={problem.title || `Бодлого #${problem.id}`}
                                  />
                                  {problem.ai_summary && (
                                    <div className="text-muted small mt-1">
                                      <Sparkles size={12} className="me-1 text-warning" />
                                      {problem.ai_summary}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleGenerateSummary(problem)}
                                  disabled={saving || generatingSummaryFor !== null}
                                  className="ms-2"
                                  title="AI summary үүсгэх"
                                >
                                  {generatingSummaryFor === problem.id ? (
                                    <Spinner as="span" size="sm" />
                                  ) : (
                                    <Sparkles size={14} />
                                  )}
                                </Button>

                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveProblem(problem.id)}
                                  disabled={saving || (!warningAcknowledged && isPublic)}
                                  className="ms-2"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </ListGroup.Item>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <ListGroup.Item>
                          <Alert variant="info" className="mb-0">
                            "Бодлого нэмэх" товчийг дарж тестээ бүрдүүлнэ үү.
                          </Alert>
                        </ListGroup.Item>
                      )}
                      {provided.placeholder}
                    </ListGroup>
                  )}
                </Droppable>
              </Card>
            </DragDropContext>
          </Col>

          {/* Баруун тал: Тестийн мэдээлэл + Хадгалах */}
          <Col lg={4}>
            <Card className="mb-3">
              <Card.Header as="h6" className="fw-semibold">Тестийн мэдээлэл</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3" controlId="quizTitle">
                  <Form.Label className="fw-semibold small">
                    <FileText size={14} className="me-1" />
                    Гарчиг
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={saving || (!warningAcknowledged && isPublic)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizDescription">
                  <Form.Label className="fw-semibold small">
                    <AlignLeft size={14} className="me-1" />
                    Тайлбар
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving || (!warningAcknowledged && isPublic)}
                    placeholder="Тестийн дэлгэрэнгүй тайлбар, заавар..."
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizTimeLimit">
                  <Form.Label className="fw-semibold small">
                    <Clock size={14} className="me-1" />
                    Хугацааны хязгаар (минут)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="300"
                    value={defaultTimeLimit}
                    onChange={(e) => setDefaultTimeLimit(e.target.value)}
                    disabled={saving || (!warningAcknowledged && isPublic)}
                    placeholder="Хоосон = хязгааргүй"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizGrade">
                  <Form.Label className="fw-semibold small">
                    <GraduationCap size={14} className="me-1" />
                    Зорилтот анги
                  </Form.Label>
                  <Form.Select
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    disabled={saving || (!warningAcknowledged && isPublic)}
                  >
                    <option value="">— Ангигүй —</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name || `${g.grade}-р анги`}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  type="switch"
                  id="is-public-switch"
                  label="Нийтэд харагдах"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={saving || (!warningAcknowledged && isPublic)}
                />
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={saving || (!warningAcknowledged && isPublic)}
                  >
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
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(`/quiz/${id}`)}
                    disabled={saving}
                  >
                    <X size={16} className="me-2" />
                    Цуцлах
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={saving || isDeleting}
                  >
                    <Trash2 size={16} className="me-2" />
                    Устгах
                  </Button>
                </div>
                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* Устгах баталгаажуулах modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Тест устгах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та <b>{originalTitle || 'энэ тестийг'}</b> устгахдаа итгэлтэй байна уу?
          <br />
          <small className="text-muted">
            Хэрэв хэн нэгэн хариулсан бол тест устгагдахгүй, зохиогч нь хасагдана.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Цуцлах
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner as="span" size="sm" className="me-2" /> : <Trash2 size={14} className="me-2" />}
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Нийтлэгдсэн тест засварлах анхааруулга */}
      <Modal
        show={showPublishedWarning}
        onHide={() => {}}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="bg-warning">
          <Modal.Title>⚠️ Анхааруулга</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            Энэ тест <strong>нийтлэгдсэн</strong> байна. Засварлах нь дараах нөлөөтэй:
          </p>
          <ul className="mb-3">
            <li>Тестийг өмнө нь бөглөсөн хэрэглэгчдийн хариулт өөрчлөгдөж болзошгүй</li>
            <li>Статистик, үр дүн буруу харагдаж болзошгүй</li>
            <li>Идэвхтэй тест бөглөж байгаа хүмүүст асуудал үүсгэж болзошгүй</li>
          </ul>
          <Alert variant="info" className="mb-0">
            <small>
              Хэрэв та зөвхөн алдаа засах гэж байгаа бол үргэлжлүүлж болно.
              Томоохон өөрчлөлт хийх бол тестийг нийтлэхийг хураах эсвэл шинэ тест үүсгэхийг зөвлөж байна.
            </small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => navigate(`/quiz/${id}`)}
          >
            Буцах
          </Button>
          <Button
            variant="warning"
            onClick={() => {
              setShowPublishedWarning(false);
              setWarningAcknowledged(true);
            }}
          >
            Ойлголоо, засварлах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ... (Modal хэсэг хэвээрээ) ... */}
      <Modal show={showProblemModal} onHide={handleCloseProblemModal} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Бодлогын сангаас сонгох</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '60vh' }}>
          {/* Modal доторх хайлт */}
          <Form onSubmit={handleModalSearchSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                placeholder="Бодлогын гарчиг, агуулгаар хайх..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
              />
              <Button type="submit" variant="primary" disabled={modalLoading}>
                {modalLoading && isHandlingModalLoadMore.current ? (
                  <Spinner as="span" size="sm" />
                ) : (
                  'Хайх'
                )}
              </Button>
            </InputGroup>
          </Form>

          {modalLoadError && <Alert variant="danger">{modalLoadError}</Alert>}

          {/* Modal доторх хайлтын үр дүн */}
          <ListGroup variant="flush">
            {modalProblems.length > 0
              ? modalProblems.map((problem) => {
                  const isAdded = selectedProblems.some((p) => p.id === problem.id);
                  return (
                    <ListGroup.Item key={problem.id} className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <LivePreview content={problem.title || `Бодлого #${problem.id}`} />
                        <div className="text-muted small">
                          Төрөл: {problem.type_display || 'Тодорхойгүй'}
                        </div>
                      </div>
                      <Button
                        variant={isAdded ? 'success' : 'outline-primary'}
                        size="sm"
                        onClick={() => handleAddProblem(problem)}
                        disabled={isAdded}
                      >
                        {isAdded ? (
                          <>
                            <i className="bi bi-check-lg"></i> Нэмэгдсэн
                          </>
                        ) : (
                          'Нэмэх'
                        )}
                      </Button>
                    </ListGroup.Item>
                  );
                })
              : !modalLoading && (
                  <div className="text-center text-muted p-3">Хайлтын үр дүн олдсонгүй.</div>
                )}

            {/* Modal infinite scroll trigger */}
            <div ref={modalLoadMoreTriggerRef} style={{ height: '20px' }} />

            {modalLoading && (
              <div className="text-center py-3">
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Ачааллаж байна...</span>
              </div>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseProblemModal}>
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizEditPage;
