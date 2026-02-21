// frontend/src/pages/QuizResultPage.jsx
// Тестийн дүн харуулах хуудас

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import LivePreview from '../components/LivePreview.jsx';

// React Bootstrap components
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

const QuizResultPage = () => {
  const { quizId, sheetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);

        // AnswerSheet авах
        const sheetResponse = await apiClient.get(`/api/integral/answer-sheets/${sheetId}/`);
        setAnswerSheet(sheetResponse.data);

        // Quiz мэдээлэл авах
        const quizResponse = await apiClient.get(`/api/integral/quizzes/${quizId}/`);
        setQuiz(quizResponse.data);

        setPageTitle(`Дүн: ${quizResponse.data.title}`);
      } catch (err) {
        console.error('Дүн ачааллахад алдаа:', err);
        setError('Дүн ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();

    return () => {
      setPageTitle('Нүүр');
    };
  }, [quizId, sheetId, setPageTitle]);

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

  if (!answerSheet || !quiz) {
    return null;
  }

  // Статистик тооцоолох
  const totalQuestions = quiz.problems?.length || 0;
  const answeredCount = answerSheet.answers?.length || 0;
  const correctCount = answerSheet.answers?.filter((a) => a.user_point > 0).length || 0;
  const maxScore =
    quiz.problems?.reduce((sum, p) => {
      if (p.type === 1 || p.type === 4) {
        const problemMax = p.choices?.reduce((s, c) => s + (c.default_score || 0), 0) || 0;
        return sum + problemMax;
      }
      return sum;
    }, 0) || 100;
  const percentage = maxScore > 0 ? Math.round((answerSheet.score / maxScore) * 100) : 0;

  // Хугацаа форматлах
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/quizzes' }}>
          Тестүүд
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/quiz/${quizId}` }}>
          {quiz.title}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Дүн</Breadcrumb.Item>
      </Breadcrumb>

      {/* Баяр хүргэе! */}
      <Card className="mb-4 text-center bg-light">
        <Card.Body className="py-5">
          <h2 className="mb-3">
            <i className="bi bi-check-circle-fill text-success me-2"></i>
            Тест дууслаа!
          </h2>
          <p className="text-muted mb-0">Амжилт хүсье! 🎉</p>
        </Card.Body>
      </Card>

      {/* Дүн */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-trophy me-2"></i>
            Таны дүн
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center mb-4">
            <h1 className="display-3 mb-0">
              {answerSheet.score}
              <small className="text-muted"> / {maxScore}</small>
            </h1>
            <p className="text-muted mb-3">({percentage}%)</p>
            <ProgressBar
              now={percentage}
              label={`${percentage}%`}
              variant={percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'danger'}
            />
          </div>

          <Stack direction="horizontal" gap={4} className="justify-content-center flex-wrap">
            <div className="text-center">
              <i className="bi bi-check-circle text-success fs-4"></i>
              <div className="mt-2">
                <strong>{correctCount}</strong> зөв
              </div>
            </div>
            <div className="text-center">
              <i className="bi bi-x-circle text-danger fs-4"></i>
              <div className="mt-2">
                <strong>{answeredCount - correctCount}</strong> буруу
              </div>
            </div>
            <div className="text-center">
              <i className="bi bi-clock text-info fs-4"></i>
              <div className="mt-2">
                <strong>{formatTime(answerSheet.total_time_spent)}</strong>
              </div>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      {/* Дэлгэрэнгүй хариултууд */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-list-check me-2"></i>
            Дэлгэрэнгүй хариултууд
          </h5>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            {answerSheet.answers.map((answer, index) => {
              const problem = quiz.problems.find((p) => p.id === answer.problem);
              if (!problem) return null;

              const isCorrect = answer.user_point > 0;
              const maxProblemScore =
                problem.choices?.reduce((s, c) => s + (c.default_score || 0), 0) || 0;

              return (
                <ListGroup.Item key={answer.id} className={isCorrect ? 'bg-success-subtle' : ''}>
                  <Stack direction="horizontal" gap={2} className="mb-2">
                    <div>
                      <Badge
                        bg={
                          problem.type === 1 ? 'info' : problem.type === 4 ? 'warning' : 'secondary'
                        }
                      >
                        {problem.type === 1 ? 'Сонгох' : problem.type === 4 ? 'Нөхөх' : 'Уламжлалт'}
                      </Badge>
                    </div>
                    <div className="ms-auto">
                      {isCorrect ? (
                        <Badge bg="success">
                          <i className="bi bi-check-circle me-1"></i>
                          Зөв: {answer.user_point}/{maxProblemScore}
                        </Badge>
                      ) : (
                        <Badge bg="danger">
                          <i className="bi bi-x-circle me-1"></i>
                          Буруу
                        </Badge>
                      )}
                    </div>
                  </Stack>

                  <div className="fw-bold mb-2 mathjax-content">
                    <LivePreview content={`${index + 1}. ${problem.title || 'Бодлого'}`} />
                  </div>

                  {problem.type === 1 && (
                    <div className="text-muted small">
                      Таны хариулт: <strong>{answer.label || 'Хариулаагүй'}</strong>
                    </div>
                  )}

                  {problem.type === 4 && answer.value && (
                    <div className="text-muted small">
                      Таны хариулт: <code>{answer.value}</code>
                    </div>
                  )}

                  {problem.type === 0 && (
                    <>
                      {answer.image_url && (
                        <div className="mt-2">
                          <img
                            src={answer.image_url}
                            alt="Хариултын зураг"
                            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                            className="border rounded"
                          />
                        </div>
                      )}
                      <Alert variant="info" className="mb-0 mt-2 small">
                        <i className="bi bi-info-circle me-1"></i>
                        Уламжлалт бодлого - багшаар шалгагдана
                      </Alert>
                    </>
                  )}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card.Body>
      </Card>

      {/* Үйлдлүүд */}
      <Stack direction="horizontal" gap={2} className="mb-4">
        <Link to={`/quiz/${quizId}`} className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i>
          Тест руу буцах
        </Link>
        <Link to="/quizzes" className="btn btn-outline-primary ms-auto">
          <i className="bi bi-list me-1"></i>
          Тестийн сан
        </Link>
      </Stack>
    </Container>
  );
};

export default QuizResultPage;
