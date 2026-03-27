// AssignmentDetailPage — даалгаврын дэлгэрэнгүй (багш: submissions, сурагч: эхлэх/үр дүн)
import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import {
  ArrowLeft, PlayCircle, CheckCircle, Clock, Award,
  Users, BarChart3,
} from 'lucide-react';
import {
  getMySubmission, getSubmissions, getAssignmentProgress,
  startAssignment, gradeSubmission,
} from '../services/clubsService';
import apiClient from '../api/axiosConfig';

const STATUS_LABELS = {
  not_started: { label: 'Эхлээгүй', bg: 'secondary' },
  in_progress: { label: 'Явагдаж байна', bg: 'warning' },
  submitted: { label: 'Илгээсэн', bg: 'info' },
  graded: { label: 'Үнэлэгдсэн', bg: 'success' },
};

const AssignmentDetailPage = () => {
  const { assignmentId } = useParams();
  const { clubData, isTeacherOrAdmin, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mySubmission, setMySubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [startingQuiz, setStartingQuiz] = useState(false);

  // Grade modal
  const [gradeModal, setGradeModal] = useState(null); // submission object
  const [gradeForm, setGradeForm] = useState({ score: '', teacher_comment: '' });
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        // Get assignment detail
        const res = await apiClient.get(`/api/club-assignments/${assignmentId}/`);
        setAssignment(res.data);

        // Өөрийн submission авах (багш, сурагч хамаагүй)
        try {
          const sub = await getMySubmission(assignmentId);
          setMySubmission(sub);
        } catch { /* no submission yet */ }

        if (isTeacherOrAdmin) {
          // Teacher: get submissions + progress
          const [subs, prog] = await Promise.all([
            getSubmissions(assignmentId),
            getAssignmentProgress(assignmentId),
          ]);
          setSubmissions(subs);
          setProgress(prog);
        }
      } catch {
        showToast?.('Даалгавар олдсонгүй', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assignmentId, isTeacherOrAdmin]);

  const handleStart = async () => {
    try {
      setStartingQuiz(true);
      const result = await startAssignment(assignmentId);
      if (assignment.quiz_uuid && result.answer_sheet_id) {
        navigate(`/quiz/${assignment.quiz_uuid}/take`);
      }
    } catch (err) {
      if (err.response?.data?.answer_sheet_id && assignment.quiz_uuid) {
        navigate(`/quiz/${assignment.quiz_uuid}/take`);
      } else {
        showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
      }
    } finally {
      setStartingQuiz(false);
    }
  };

  const handleContinue = () => {
    if (assignment.quiz_uuid) navigate(`/quiz/${assignment.quiz_uuid}/take`);
  };

  const handleViewResult = () => {
    const sheetId = mySubmission?.answer_sheet_id || mySubmission?.answer_sheet;
    if (assignment.quiz_uuid && sheetId) {
      navigate(`/quiz/${assignment.quiz_uuid}/result/${sheetId}`);
    }
  };

  const openGradeModal = (sub) => {
    setGradeModal(sub);
    setGradeForm({
      score: sub.score ?? '',
      teacher_comment: sub.teacher_comment || '',
    });
  };

  const handleGrade = async () => {
    try {
      setGrading(true);
      await gradeSubmission(assignmentId, {
        submission_id: gradeModal.id,
        score: gradeForm.score !== '' ? parseInt(gradeForm.score) : null,
        teacher_comment: gradeForm.teacher_comment,
      });
      showToast?.('Амжилттай үнэлэгдлээ', 'success');
      setGradeModal(null);
      // Refresh
      const [subs, prog] = await Promise.all([
        getSubmissions(assignmentId),
        getAssignmentProgress(assignmentId),
      ]);
      setSubmissions(subs);
      setProgress(prog);
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (!assignment) return null;

  const now = new Date();
  const isExpired = assignment.deadline && new Date(assignment.deadline) < now;

  return (
    <div className="container-fluid">
      {/* Back button */}
      <Button
        variant="link"
        size="sm"
        className="text-muted mb-2 p-0"
        onClick={() => navigate(`/clubs/${clubData?.id}/assignments`)}
      >
        <ArrowLeft size={14} className="me-1" />Даалгаврууд
      </Button>

      {/* Assignment info */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <h5 className="mb-2">{assignment.title}</h5>
          {assignment.description && (
            <p className="text-muted small mb-2">{assignment.description}</p>
          )}
          <div className="d-flex align-items-center gap-3 flex-wrap small text-muted">
            {assignment.quiz_title && (
              <span>Сорил: <strong>{assignment.quiz_title}</strong></span>
            )}
            {assignment.deadline && (
              <span className="d-flex align-items-center gap-1">
                <Clock size={12} />
                {new Date(assignment.deadline).toLocaleString('mn-MN')}
                {isExpired && !assignment.allow_late && (
                  <Badge bg="danger" className="ms-1 small">Дууссан</Badge>
                )}
              </span>
            )}
            {assignment.max_score > 0 && (
              <span>Дээд оноо: {assignment.max_score}</span>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Quiz start/continue/result — багш, сурагч хамаагүй */}
      {assignment.quiz_uuid && (
        <Card className="shadow-sm mb-3">
          <Card.Body className="text-center py-4">
            {!mySubmission && (
              <>
                <p className="text-muted mb-3">Та энэ даалгаврыг эхлүүлээгүй байна.</p>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={startingQuiz || (isExpired && !assignment.allow_late)}
                >
                  {startingQuiz ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <><PlayCircle size={16} className="me-1" />Даалгавар эхлэх</>
                  )}
                </Button>
              </>
            )}
            {mySubmission?.status === 'in_progress' && (
              <>
                <Badge bg="warning" className="mb-3">Явагдаж байна</Badge>
                <br />
                <Button variant="warning" onClick={handleContinue}>
                  <PlayCircle size={16} className="me-1" />Үргэлжлүүлэх
                </Button>
              </>
            )}
            {mySubmission?.status === 'submitted' && (
              <>
                <Badge bg="info" className="mb-2">Илгээсэн</Badge>
                <p className="text-muted small mb-3">
                  Таны хариулт илгээгдсэн. Багш шалгахыг хүлээж байна.
                  {mySubmission.score != null && (
                    <> Автомат оноо: <strong>{mySubmission.score}</strong>/{mySubmission.max_score}</>
                  )}
                </p>
                <Button variant="outline-info" size="sm" onClick={handleViewResult}>
                  <CheckCircle size={14} className="me-1" />Хариултаа харах
                </Button>
              </>
            )}
            {mySubmission?.status === 'graded' && (
              <>
                <Badge bg="success" className="mb-2">
                  <Award size={12} className="me-1" />Үнэлэгдсэн
                </Badge>
                <h3 className="text-success mb-2">
                  {mySubmission.score}/{mySubmission.max_score}
                </h3>
                {mySubmission.teacher_comment && (
                  <p className="text-muted small mb-3">
                    Багшийн тайлбар: {mySubmission.teacher_comment}
                  </p>
                )}
                <Button variant="outline-success" size="sm" onClick={handleViewResult}>
                  <CheckCircle size={14} className="me-1" />Хариултаа харах
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Teacher view — progress + submissions table */}
      {isTeacherOrAdmin && (
        <>
          {/* Progress summary */}
          {progress && (
            <Card className="shadow-sm mb-3">
              <Card.Body>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <BarChart3 size={16} />
                  <span className="fw-semibold small">Явц</span>
                </div>
                <div className="d-flex gap-4 small text-muted flex-wrap">
                  <span><Users size={12} className="me-1" />Нийт гишүүд: {progress.total_students}</span>
                  <span>Эхэлсэн: {progress.started}</span>
                  <span>Илгээсэн: {progress.submitted}</span>
                  <span>Үнэлэгдсэн: {progress.graded}</span>
                  {progress.average_score != null && (
                    <span>Дундаж оноо: <strong>{progress.average_score}</strong></span>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Submissions table */}
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <span className="fw-semibold small">Хариултууд ({submissions.length})</span>
            </Card.Header>
            {submissions.length === 0 ? (
              <Card.Body className="text-center text-muted small py-3">
                Одоогоор хариулт ирээгүй байна.
              </Card.Body>
            ) : (
              <Table responsive hover size="sm" className="mb-0">
                <thead>
                  <tr className="small">
                    <th>Сурагч</th>
                    <th>Төлөв</th>
                    <th>Оноо</th>
                    <th>Илгээсэн</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => {
                    const si = STATUS_LABELS[sub.status] || STATUS_LABELS.not_started;
                    return (
                      <tr key={sub.id} className="small">
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {sub.student_picture ? (
                              <img
                                src={sub.student_picture}
                                alt=""
                                className="rounded-circle"
                                style={{ width: 24, height: 24, objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                                style={{ width: 24, height: 24, fontSize: '0.7rem' }}
                              >
                                {(sub.student_name || sub.student_username || '?')[0]}
                              </div>
                            )}
                            <span>{sub.student_name || sub.student_username}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg={si.bg} className="small">{si.label}</Badge>
                        </td>
                        <td>
                          {sub.score != null ? `${sub.score}/${sub.max_score || '?'}` : '—'}
                        </td>
                        <td>
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleString('mn-MN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })
                            : '—'}
                        </td>
                        <td>
                          {(sub.status === 'submitted' || sub.status === 'graded') && (
                            <Button
                              variant={sub.status === 'graded' ? 'outline-success' : 'outline-primary'}
                              size="sm"
                              className="py-0 px-2"
                              onClick={() => openGradeModal(sub)}
                            >
                              {sub.status === 'graded' ? 'Засах' : 'Үнэлэх'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Grade Modal */}
      <Modal show={!!gradeModal} onHide={() => setGradeModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6">
            Үнэлэх — {gradeModal?.student_name || gradeModal?.student_username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Оноо</Form.Label>
            <Form.Control
              type="number"
              size="sm"
              value={gradeForm.score}
              onChange={e => setGradeForm(f => ({ ...f, score: e.target.value }))}
              placeholder={`Дээд: ${assignment?.max_score || 100}`}
              min={0}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Тайлбар</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              size="sm"
              value={gradeForm.teacher_comment}
              onChange={e => setGradeForm(f => ({ ...f, teacher_comment: e.target.value }))}
              placeholder="Багшийн тайлбар (заавал биш)"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setGradeModal(null)}>
            Болих
          </Button>
          <Button variant="primary" size="sm" onClick={handleGrade} disabled={grading}>
            {grading ? <Spinner animation="border" size="sm" /> : 'Үнэлэх'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AssignmentDetailPage;
