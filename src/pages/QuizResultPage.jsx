// frontend/src/pages/QuizResultPage.jsx
// Тестийн дүн харуулах хуудас (сурагч + багшийн дүгнэлт)

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import LivePreview from '../components/LivePreview.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import UserName from '../components/UserName.jsx';

import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Stack from 'react-bootstrap/Stack';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

// -------------------------------------------------------------------
// Уламжлалт бодлогын оноо өгөх компонент (багшид)
// -------------------------------------------------------------------
const GradeInput = ({ answer, sheetId, onGraded }) => {
  const [point, setPoint] = useState(answer.user_point ?? '');
  const [maxPoint, setMaxPoint] = useState(answer.assignment_point || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    const val = parseFloat(point);
    if (isNaN(val) || val < 0) {
      setErr('Зөв оноо оруулна уу.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      const body = { answer_id: answer.id, user_point: val };
      const maxVal = parseFloat(maxPoint);
      if (!isNaN(maxVal) && maxVal >= 0) body.assignment_point = maxVal;

      const res = await apiClient.patch(`/api/integral/answer-sheets/${sheetId}/grade/`, body);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onGraded(res.data);
    } catch (e) {
      setErr(e.response?.data?.error || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-3 border rounded bg-white">
      <div className="fw-semibold small mb-2 text-secondary">
        <i className="bi bi-pencil-square me-1"></i>
        Оноо тохируулах
      </div>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <div>
          <Form.Label className="small mb-1">Олгох оноо</Form.Label>
          <InputGroup size="sm" style={{ width: '110px' }}>
            <Form.Control
              type="number"
              min="0"
              step="0.5"
              value={point}
              onChange={(e) => { setPoint(e.target.value); setSaved(false); }}
              placeholder="0"
            />
          </InputGroup>
        </div>
        <div>
          <Form.Label className="small mb-1">Дээд оноо (заавал биш)</Form.Label>
          <InputGroup size="sm" style={{ width: '130px' }}>
            <Form.Control
              type="number"
              min="0"
              step="0.5"
              value={maxPoint}
              onChange={(e) => { setMaxPoint(e.target.value); setSaved(false); }}
              placeholder="—"
            />
          </InputGroup>
        </div>
        <div className="align-self-end">
          <Button
            size="sm"
            variant={saved ? 'success' : 'primary'}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Spinner as="span" size="sm" className="me-1" />
            ) : saved ? (
              <i className="bi bi-check-lg me-1"></i>
            ) : (
              <i className="bi bi-floppy me-1"></i>
            )}
            {saved ? 'Хадгалагдлаа' : 'Хадгалах'}
          </Button>
        </div>
      </Stack>
      {err && <div className="text-danger small mt-1">{err}</div>}
    </div>
  );
};

// -------------------------------------------------------------------
// Үндсэн QuizResultPage
// -------------------------------------------------------------------
const QuizResultPage = () => {
  const { quizUuid: quizId, sheetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [quiz, setQuiz] = useState(null);

  // answers-г local state болгон — дүгнэлт шинэчлэх үед update хийнэ
  const [answers, setAnswers] = useState([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sheetRes, quizRes] = await Promise.all([
          apiClient.get(`/api/integral/answer-sheets/${sheetId}/`),
          apiClient.get(`/api/integral/quizzes/${quizId}/`),
        ]);

        setAnswerSheet(sheetRes.data);
        setQuiz(quizRes.data);
        setAnswers(sheetRes.data.answers || []);
        setTotalScore(sheetRes.data.score || 0);
        setPageTitle(`Дүн: ${quizRes.data.title}`);
      } catch (err) {
        console.error('Дүн ачааллахад алдаа:', err);
        setError('Дүн ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
    return () => { setPageTitle('Нүүр'); };
  }, [quizId, sheetId, setPageTitle]);

  // Дүгнэлт хадгалагдсан үед local state шинэчлэх
  const handleGraded = useCallback(({ answer_id, user_point, assignment_point, total_score }) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answer_id ? { ...a, user_point, assignment_point } : a
      )
    );
    setTotalScore(total_score);
  }, []);

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
        <Link to={`/quiz/${quizId}`} className="btn btn-outline-secondary">
          &laquo; Тест руу буцах
        </Link>
      </Container>
    );
  }

  if (!answerSheet || !quiz) return null;

  // Багш уу, сурагч уу?
  const isTeacher =
    user &&
    quiz.author &&
    user.id === quiz.author.id;

  // Статистик
  const totalProblems = quiz.problems?.length || 0;
  const answeredCount = answers.length;
  const correctCount = answers.filter((a) => a.user_point > 0).length;

  // Max оноо: MC + fill-in-blank-н автомат + уламжлалтын assignment_point
  const maxScore = quiz.problems?.reduce((sum, p) => {
    if (p.type === 1 || p.type === 4) {
      return sum + (p.choices?.reduce((s, c) => s + (c.default_score || 0), 0) || 0);
    }
    if (p.type === 0) {
      const ans = answers.find((a) => a.problem === p.id);
      return sum + (ans?.assignment_point || 0);
    }
    return sum;
  }, 0) || 0;

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const formatTime = (seconds) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  // Уламжлалт бодлогууд байгаа эсэх
  const hasTraditional = quiz.problems?.some((p) => p.type === 0);
  const ungradedTraditional = isTeacher
    ? answers.filter((a) => {
        const p = quiz.problems?.find((pr) => pr.id === a.problem);
        return p?.type === 0 && (a.user_point === 0 || a.user_point == null);
      }).length
    : 0;

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Нүүр</Breadcrumb.Item>
        {isTeacher && (
          <Breadcrumb.Item
            linkAs={Link}
            linkProps={{ to: `/quiz/${quizId}/student-answers` }}
          >
            Сурагчдын хариулт
          </Breadcrumb.Item>
        )}
        {!isTeacher && (
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/quiz/${quizId}` }}>
            {quiz.title}
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item active>{isTeacher ? 'Дүгнэх' : 'Дүн'}</Breadcrumb.Item>
      </Breadcrumb>

      {/* === БАГШ: сурагчийн мэдээлэл + дүгнэлтийн header === */}
      {isTeacher ? (
        <Card className="mb-4 border-primary">
          <Card.Body>
            <Stack direction="horizontal" gap={3} className="align-items-center">
              <UserAvatar user={answerSheet.student} size={48} />
              <div className="flex-grow-1">
                <h5 className="mb-0">
                  <UserName user={answerSheet.student} />
                </h5>
                <div className="text-muted small">@{answerSheet.student?.username}</div>
              </div>
              {hasTraditional && ungradedTraditional > 0 && (
                <Badge bg="warning" text="dark" className="fs-6">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  {ungradedTraditional} дүгнэгдэх бодлого
                </Badge>
              )}
              {hasTraditional && ungradedTraditional === 0 && (
                <Badge bg="success" className="fs-6">
                  <i className="bi bi-check-all me-1"></i>
                  Бүгд дүгнэгдсэн
                </Badge>
              )}
            </Stack>
          </Card.Body>
        </Card>
      ) : (
        /* === СУРАГЧ: баярын мэдэгдэл === */
        <Card className="mb-4 text-center bg-light">
          <Card.Body className="py-4">
            <h2 className="mb-2">
              <i className="bi bi-check-circle-fill text-success me-2"></i>
              Тест дууслаа!
            </h2>
            <p className="text-muted mb-0">Амжилт хүсье!</p>
          </Card.Body>
        </Card>
      )}

      {/* === Нийт оноо === */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-trophy me-2"></i>
            {isTeacher ? 'Оноо' : 'Таны дүн'}
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h1 className="display-3 mb-0">
              {totalScore}
              {maxScore > 0 && <small className="text-muted"> / {maxScore}</small>}
            </h1>
            {maxScore > 0 && (
              <>
                <p className="text-muted mb-3">({percentage}%)</p>
                <ProgressBar
                  now={percentage}
                  label={`${percentage}%`}
                  variant={percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger'}
                />
              </>
            )}
          </div>

          <Stack direction="horizontal" gap={4} className="justify-content-center flex-wrap">
            <div className="text-center">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <div className="mt-1"><strong>{correctCount}</strong> зөв</div>
            </div>
            <div className="text-center">
              <i className="bi bi-x-circle text-danger fs-4"></i>
              <div className="mt-1"><strong>{answeredCount - correctCount}</strong> буруу</div>
            </div>
            <div className="text-center">
              <i className="bi bi-question-circle text-secondary fs-4"></i>
              <div className="mt-1"><strong>{totalProblems - answeredCount}</strong> хариулаагүй</div>
            </div>
            <div className="text-center">
              <i className="bi bi-clock text-info fs-4"></i>
              <div className="mt-1"><strong>{formatTime(answerSheet.total_time_spent)}</strong></div>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      {/* === Дэлгэрэнгүй хариултууд === */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-list-check me-2"></i>
            Дэлгэрэнгүй хариултууд
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          <ListGroup variant="flush">
            {quiz.problems?.map((problem, index) => {
              const answer = answers.find((a) => a.problem === problem.id);
              const isCorrect = answer && answer.user_point > 0;
              const isUnanswered = !answer;

              const maxProblemScore =
                problem.type === 0
                  ? answer?.assignment_point || 0
                  : problem.choices?.reduce((s, c) => s + (c.default_score || 0), 0) || 0;

              let rowBg = '';
              if (isUnanswered) rowBg = '';
              else if (problem.type === 0 && (!answer.user_point && answer.user_point !== 0)) rowBg = '';
              else if (isCorrect) rowBg = 'bg-success-subtle';
              else rowBg = 'bg-danger-subtle';

              return (
                <ListGroup.Item key={problem.id} className={`p-3 ${rowBg}`}>
                  {/* 헤더: 번호, 타입, 점수 */}
                  <Stack direction="horizontal" gap={2} className="mb-2">
                    <Badge
                      bg={problem.type === 1 ? 'info' : problem.type === 4 ? 'warning' : 'secondary'}
                      text={problem.type === 4 ? 'dark' : undefined}
                    >
                      {problem.type === 1 ? 'Сонгох' : problem.type === 4 ? 'Нөхөх' : 'Уламжлалт'}
                    </Badge>

                    <div className="ms-auto">
                      {isUnanswered ? (
                        <Badge bg="secondary">Хариулаагүй</Badge>
                      ) : problem.type === 0 ? (
                        <Badge
                          bg={answer.user_point > 0 ? 'success' : 'light'}
                          text={answer.user_point > 0 ? undefined : 'dark'}
                          className="border"
                        >
                          {answer.user_point > 0
                            ? `${answer.user_point}${maxProblemScore > 0 ? ` / ${maxProblemScore}` : ''} оноо`
                            : isTeacher
                            ? 'Дүгнэгдээгүй'
                            : 'Багшаар шалгагдана'}
                        </Badge>
                      ) : isCorrect ? (
                        <Badge bg="success">
                          <i className="bi bi-check-circle me-1"></i>
                          {answer.user_point}{maxProblemScore > 0 ? ` / ${maxProblemScore}` : ''} оноо
                        </Badge>
                      ) : (
                        <Badge bg="danger">
                          <i className="bi bi-x-circle me-1"></i>
                          Буруу
                        </Badge>
                      )}
                    </div>
                  </Stack>

                  {/* Бодлогын гарчиг */}
                  <div className="fw-bold mb-2 mathjax-content">
                    <LivePreview content={`${index + 1}. ${problem.title || 'Бодлого'}`} />
                  </div>

                  {/* Бодлогын өгүүлбэр — багшид бүтнээр харуулна */}
                  {isTeacher && problem.statement && (
                    <div className="mb-3 p-2 bg-light rounded mathjax-content small">
                      <LivePreview content={problem.statement} />
                    </div>
                  )}

                  {/* MC: сонгосон хариулт + зөв хариулт */}
                  {problem.type === 1 && answer && (
                    <div className="small">
                      <span className="text-muted">Хариулт: </span>
                      <strong>{answer.label || '—'}</strong>
                      {!isCorrect && (() => {
                        const correct = problem.choices?.find((c) => c.default_score > 0);
                        return correct ? (
                          <span className="text-success ms-2">
                            (Зөв: <strong>{correct.label}</strong>)
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Fill-in-blank: утга */}
                  {problem.type === 4 && answer && (
                    <div className="small">
                      <span className="text-muted">Хариулт: </span>
                      <code>{answer.value || '—'}</code>
                    </div>
                  )}

                  {/* Уламжлалт: зураг */}
                  {problem.type === 0 && answer?.image_url && (
                    <div className="mt-2">
                      <img
                        src={answer.image_url}
                        alt="Хариултын зураг"
                        style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                        className="border rounded"
                      />
                    </div>
                  )}

                  {/* Уламжлалт: текст хариулт */}
                  {problem.type === 0 && answer?.value && (
                    <div className="mt-2 p-2 bg-light rounded small">
                      <LivePreview content={answer.value} />
                    </div>
                  )}

                  {/* Уламжлалт: хариулаагүй */}
                  {problem.type === 0 && !answer && (
                    <div className="text-muted small fst-italic">Хариулт ирүүлээгүй</div>
                  )}

                  {/* Уламжлалт: багшийн оноо өгөх хэсэг */}
                  {isTeacher && problem.type === 0 && answer && (
                    <GradeInput
                      answer={answer}
                      sheetId={sheetId}
                      onGraded={handleGraded}
                    />
                  )}

                  {/* Сурагч: уламжлалт — дүгнэлт хүлээж байна */}
                  {!isTeacher && problem.type === 0 && answer && !answer.user_point && (
                    <Alert variant="info" className="mb-0 mt-2 small py-2">
                      <i className="bi bi-hourglass-split me-1"></i>
                      Багшийн дүгнэлт хүлээж байна
                    </Alert>
                  )}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Үйлдлүүд */}
      <Stack direction="horizontal" gap={2} className="mb-4">
        {isTeacher ? (
          <>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(`/quiz/${quizId}/student-answers`)}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Жагсаалт руу буцах
            </Button>
            <Link to={`/quiz/${quizId}`} className="btn btn-outline-primary ms-auto">
              <i className="bi bi-eye me-1"></i>
              Тест харах
            </Link>
          </>
        ) : (
          <>
            <Link to={`/quiz/${quizId}`} className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-1"></i>
              Тест руу буцах
            </Link>
            <Link to="/content/browse?type=quizzes" className="btn btn-outline-primary ms-auto">
              <i className="bi bi-list me-1"></i>
              Тестийн сан
            </Link>
          </>
        )}
      </Stack>
    </Container>
  );
};

export default QuizResultPage;
