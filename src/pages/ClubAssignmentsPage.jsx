// ClubAssignmentsPage — даалгаврын жагсаалт + quiz хайж даалгавар болгох
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import {
  ClipboardList, Plus, Clock, CheckCircle, PlayCircle,
  Trash2, Award, Search, ClipboardPlus, Trophy, Users,
} from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import {
  getAssignments, createAssignment, deleteAssignment,
  startAssignment,
} from '../services/clubsService';
import apiClient from '../api/axiosConfig';

const STATUS_MAP = {
  in_progress: { label: 'Явагдаж байна', bg: 'warning', icon: PlayCircle },
  submitted: { label: 'Илгээсэн', bg: 'info', icon: CheckCircle },
  graded: { label: 'Үнэлэгдсэн', bg: 'success', icon: Award },
};

const ClubAssignmentsPage = () => {
  const { clubData, isTeacherOrAdmin, showToast } = useOutletContext();
  const navigate = useNavigate();
  const clubId = clubData?.id;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [clubSubgroups, setClubSubgroups] = useState([]);

  // Quiz search + assign modal
  const [showQuizSearch, setShowQuizSearch] = useState(false);
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [assigningQuizId, setAssigningQuizId] = useState(null);

  // Assign confirm modal (deadline, title, subgroups)
  const [assignModal, setAssignModal] = useState(null); // quiz object
  const [assignForm, setAssignForm] = useState({ title: '', deadline: '', allow_late: false, subgroups: [] });
  const [creating, setCreating] = useState(false);

  const fetchAssignments = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const data = await getAssignments(clubId);
      setAssignments(Array.isArray(data) ? data : data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  useEffect(() => {
    if (!clubId || !isTeacherOrAdmin) return;
    apiClient.get('/api/club-subgroups/', { params: { club: clubId } })
      .then(r => setClubSubgroups(r.data.results || r.data || []))
      .catch(() => {});
  }, [clubId, isTeacherOrAdmin]);

  // ----- Quiz search -----
  const searchQuizzes = async (query) => {
    try {
      setQuizLoading(true);
      const params = { page_size: 20 };
      if (query.trim()) params.search = query.trim();
      const res = await apiClient.get('/api/integral/quizzes/', { params });
      setQuizResults(res.data.results || res.data || []);
    } catch { /* ignore */ }
    finally { setQuizLoading(false); }
  };

  const openQuizSearch = () => {
    setShowQuizSearch(true);
    setQuizSearchQuery('');
    searchQuizzes('');
  };

  useEffect(() => {
    if (!showQuizSearch) return;
    const timeout = setTimeout(() => searchQuizzes(quizSearchQuery), 300);
    return () => clearTimeout(timeout);
  }, [quizSearchQuery, showQuizSearch]);

  // Quiz сонгоход → assign confirm modal руу шилжих
  const handleSelectQuiz = (quiz) => {
    setShowQuizSearch(false);
    setAssignModal(quiz);
    setAssignForm({ title: quiz.title, deadline: '', allow_late: false, subgroups: [] });
  };

  // Даалгавар үүсгэх
  const handleCreateAssignment = async () => {
    if (!assignModal || !assignForm.title.trim()) return;
    try {
      setCreating(true);
      const data = {
        title: assignForm.title,
        quiz: assignModal.id,
        allow_late: assignForm.allow_late,
        subgroups: assignForm.subgroups,
      };
      if (assignForm.deadline) data.deadline = new Date(assignForm.deadline).toISOString();
      await createAssignment(clubId, data);
      showToast?.('Даалгавар амжилттай үүслээ', 'success');
      setAssignModal(null);
      fetchAssignments();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" даалгаврыг устгахдаа итгэлтэй байна уу?`)) return;
    try {
      await deleteAssignment(id);
      showToast?.('Даалгавар устгагдлаа', 'success');
      fetchAssignments();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    }
  };

  const handleStart = async (assignment) => {
    try {
      setStartingId(assignment.id);
      const result = await startAssignment(assignment.id);
      console.log('start result:', result, 'quiz_uuid:', assignment.quiz_uuid);
      if (assignment.quiz_uuid) {
        navigate(`/quiz/${assignment.quiz_uuid}/take`);
      } else {
        showToast?.(result.detail || 'Эхэллээ', 'success');
        fetchAssignments();
      }
    } catch (err) {
      console.error('start error:', err.response?.status, err.response?.data);
      // Already started (200) or other — try navigate if quiz_uuid available
      if (assignment.quiz_uuid && err.response?.data?.answer_sheet_id) {
        navigate(`/quiz/${assignment.quiz_uuid}/take`);
      } else {
        showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
      }
    } finally {
      setStartingId(null);
    }
  };

  const handleContinue = (assignment) => {
    if (assignment.quiz_uuid) navigate(`/quiz/${assignment.quiz_uuid}/take`);
  };

  const handleViewResult = (assignment) => {
    const sheetId = assignment.my_submission?.answer_sheet_id;
    if (assignment.quiz_uuid && sheetId) {
      navigate(`/quiz/${assignment.quiz_uuid}/result/${sheetId}`);
    } else if (assignment.quiz_uuid) {
      navigate(`/quiz/${assignment.quiz_uuid}`);
    }
  };

  const now = new Date();

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Даалгавар</h4>
        {isTeacherOrAdmin && (
          <Button variant="primary" size="sm" onClick={openQuizSearch}>
            <Plus size={14} className="me-1" />Даалгавар нэмэх
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Даалгавар байхгүй"
          message="Одоогоор клубд даалгавар өгөгдөөгүй байна."
        />
      ) : (
        <div className="d-flex flex-column gap-2">
          {assignments.map(a => {
            const my = a.my_submission;
            const isExpired = a.deadline && new Date(a.deadline) < now;
            const statusInfo = my ? STATUS_MAP[my.status] : null;

            return (
              <Card key={a.id} className="shadow-sm">
                <Card.Body className="py-2 px-3">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span
                          className="fw-semibold cursor-pointer"
                          role="button"
                          onClick={() => navigate(`/clubs/${clubId}/assignments/${a.id}`)}
                        >
                          {a.title}
                        </span>
                        {a.quiz_title && a.quiz_title !== a.title && (
                          <Badge bg="light" text="dark" className="small">{a.quiz_title}</Badge>
                        )}
                        {isExpired && !a.allow_late && (
                          <Badge bg="danger" className="small">Хугацаа дууссан</Badge>
                        )}
                        {a.subgroup_info?.map(sg => (
                          <Badge key={sg.id} bg={sg.color || 'secondary'} className="small d-flex align-items-center gap-1">
                            <Users size={9} />{sg.name}
                          </Badge>
                        ))}
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        {a.deadline && (
                          <span className="small text-muted d-flex align-items-center gap-1">
                            <Clock size={12} />
                            {new Date(a.deadline).toLocaleDateString('mn-MN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                        {!isTeacherOrAdmin && statusInfo && (
                          <Badge bg={statusInfo.bg} className="small d-flex align-items-center gap-1">
                            <statusInfo.icon size={10} />
                            {statusInfo.label}
                            {my.status === 'graded' && my.score != null && (
                              <span> — {my.score}/{my.max_score}</span>
                            )}
                          </Badge>
                        )}
                        {isTeacherOrAdmin && (
                          <span className="small text-muted">
                            Илгээсэн: {a.submitted_count || 0}/{a.submission_count || 0}
                          </span>
                        )}
                      </div>
                      {isTeacherOrAdmin && a.submission_count > 0 && (
                        <ProgressBar
                          className="mt-1"
                          style={{ height: '4px' }}
                          now={(a.submitted_count / a.submission_count) * 100}
                          variant="success"
                        />
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      {a.quiz_uuid && (
                        <>
                          {!my && (
                            <Button
                              variant="primary" size="sm"
                              onClick={() => handleStart(a)}
                              disabled={startingId === a.id || (isExpired && !a.allow_late)}
                            >
                              {startingId === a.id
                                ? <Spinner animation="border" size="sm" />
                                : <><PlayCircle size={14} className="me-1" />Эхлэх</>}
                            </Button>
                          )}
                          {my?.status === 'in_progress' && (
                            <Button variant="warning" size="sm" onClick={() => handleContinue(a)}>
                              <PlayCircle size={14} className="me-1" />Үргэлжлүүлэх
                            </Button>
                          )}
                          {(my?.status === 'submitted' || my?.status === 'graded') && (
                            <Button variant="outline-success" size="sm" onClick={() => handleViewResult(a)}>
                              <CheckCircle size={14} className="me-1" />Үр дүн
                            </Button>
                          )}
                        </>
                      )}
                      {isTeacherOrAdmin && (
                        <>
                          <Button
                            variant="outline-warning" size="sm" className="py-0 px-1"
                            onClick={() => navigate(`/clubs/${clubId}/assignments/${a.id}/leaderboard`)}
                            title="Дүнгийн жагсаалт"
                          >
                            <Trophy size={14} />
                          </Button>
                          <Button
                            variant="outline-danger" size="sm" className="py-0 px-1"
                            onClick={() => handleDelete(a.id, a.title)} title="Устгах"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========== Quiz хайх Modal ========== */}
      <Modal show={showQuizSearch} onHide={() => setShowQuizSearch(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">Тест хайж даалгавар болгох</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <InputGroup className="mb-3" size="sm">
            <InputGroup.Text><Search size={14} /></InputGroup.Text>
            <Form.Control
              placeholder="Тестийн нэрээр хайх..."
              value={quizSearchQuery}
              onChange={e => setQuizSearchQuery(e.target.value)}
              autoFocus
            />
          </InputGroup>

          {quizLoading ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : quizResults.length === 0 ? (
            <div className="text-center py-3 text-muted small">Тест олдсонгүй</div>
          ) : (
            <ListGroup variant="flush">
              {quizResults.map(q => {
                const alreadyAssigned = assignments.some(a => a.quiz === q.id);
                return (
                  <ListGroup.Item
                    key={q.id}
                    className="d-flex justify-content-between align-items-center py-2"
                  >
                    <div className="flex-grow-1">
                      <span className="small fw-medium">{q.title}</span>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {q.problems_count != null && <span className="me-2">{q.problems_count} бодлого</span>}
                        {q.author_name && <span className="me-2">· {q.author_name}</span>}
                      </div>
                    </div>
                    {alreadyAssigned ? (
                      <Badge bg="secondary" className="small">Нэмэгдсэн</Badge>
                    ) : (
                      <Button
                        variant="outline-primary" size="sm" className="py-0 px-2"
                        onClick={() => handleSelectQuiz(q)}
                        disabled={assigningQuizId === q.id}
                      >
                        <ClipboardPlus size={12} className="me-1" />Даалгавар болгох
                      </Button>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>

      {/* ========== Даалгавар тохируулах Modal ========== */}
      <Modal show={!!assignModal} onHide={() => setAssignModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">Даалгавар тохируулах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 p-2 bg-light rounded small">
            <strong>Сорил:</strong> {assignModal?.title}
            {assignModal?.problems_count != null && (
              <span className="text-muted ms-2">({assignModal.problems_count} бодлого)</span>
            )}
          </div>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Даалгаврын нэр</Form.Label>
            <Form.Control
              size="sm"
              value={assignForm.title}
              onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Эцсийн хугацаа</Form.Label>
            <Form.Control
              type="datetime-local"
              size="sm"
              value={assignForm.deadline}
              onChange={e => setAssignForm(f => ({ ...f, deadline: e.target.value }))}
            />
          </Form.Group>
          <Form.Check
            type="checkbox"
            label="Хоцорсон хариулт зөвшөөрөх"
            className="small"
            checked={assignForm.allow_late}
            onChange={e => setAssignForm(f => ({ ...f, allow_late: e.target.checked }))}
          />
          {clubSubgroups.length > 0 && (
            <Form.Group className="mt-3">
              <Form.Label className="small fw-medium d-flex align-items-center gap-1">
                <Users size={13} />Дэд бүлэг (хоосон = бүх гишүүд)
              </Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {clubSubgroups.map(sg => (
                  <Form.Check
                    key={sg.id}
                    type="checkbox"
                    id={`sg-${sg.id}`}
                    label={<Badge bg={sg.color || 'secondary'}>{sg.name}</Badge>}
                    className="small"
                    checked={assignForm.subgroups.includes(sg.id)}
                    onChange={e => setAssignForm(f => ({
                      ...f,
                      subgroups: e.target.checked
                        ? [...f.subgroups, sg.id]
                        : f.subgroups.filter(id => id !== sg.id),
                    }))}
                  />
                ))}
              </div>
              {assignForm.subgroups.length === 0 && (
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Сонгоогүй бол бүх клубын гишүүдэд харагдана
                </div>
              )}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setAssignModal(null)}>Болих</Button>
          <Button
            variant="primary" size="sm"
            onClick={handleCreateAssignment}
            disabled={creating || !assignForm.title.trim()}
          >
            {creating ? <Spinner animation="border" size="sm" /> : 'Даалгавар үүсгэх'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClubAssignmentsPage;
