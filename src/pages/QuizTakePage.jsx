// frontend/src/pages/QuizTakePage.jsx
// Тест бөглөх хуудас

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
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
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';

const QuizTakePage = () => {
  const { uuid: id } = useParams(); // quiz uuid
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { problemId: {label, value, image} }
  const [selectedImages, setSelectedImages] = useState({}); // { problemId: File }

  // Timer states
  const [isPaused, setIsPaused] = useState(false);
  const [currentProblemTime, setCurrentProblemTime] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0); // Нийт зарцуулсан хугацаа (секунд)
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const timerRef = useRef(null);
  const totalTimerRef = useRef(null);

  // Modal states
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Тест эхлүүлэх
  useEffect(() => {
    const startQuiz = async () => {
      try {
        setLoading(true);
        setError(null);

        // POST /api/integral/quizzes/{id}/start/
        const response = await apiClient.post(`/api/integral/quizzes/${id}/start/`);
        const sheetData = response.data.answer_sheet;

        setAnswerSheet(sheetData);
        setQuiz(sheetData.quiz);

        // Тестийн бодлогуудыг авах
        const quizResponse = await apiClient.get(`/api/integral/quizzes/${id}/`);
        const problemsData = quizResponse.data.problems || [];
        console.log('Loaded problems:', problemsData); // Debug
        setProblems(problemsData);
        setPageTitle(`Тест бөглөх: ${quizResponse.data.title}`);

        // Өмнө нь хариулсан хариултуудыг ачааллах
        if (sheetData.answers && sheetData.answers.length > 0) {
          const answersMap = {};
          sheetData.answers.forEach((ans) => {
            // Fill-in-the-blank бодлого: "ab:12,c:4,def:135" → { answers: { ab: "12", c: "4", def: "135" } }
            if (!ans.label && ans.value && ans.value.includes(':')) {
              const answersObj = {};
              ans.value.split(',').forEach((part) => {
                const [key, val] = part.split(':');
                if (key && val) {
                  answersObj[key] = val;
                }
              });
              answersMap[ans.problem] = { answers: answersObj };
            } else {
              // Multiple choice эсвэл traditional
              answersMap[ans.problem] = {
                label: ans.label,
                value: ans.value,
              };
            }
          });
          setAnswers(answersMap);
        }

        // Timer эхлүүлэх
        setProblemStartTime(new Date());
        setQuizStartTime(new Date());
      } catch (err) {
        console.error('Тест эхлүүлэхэд алдаа гарлаа:', err);
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Тест эхлүүлэхэд алдаа гарлаа.');
        }
      } finally {
        setLoading(false);
      }
    };

    startQuiz();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setPageTitle('Нүүр');
    };
  }, [id, setPageTitle]);

  // Problem timer useEffect
  useEffect(() => {
    if (!isPaused && problemStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((new Date() - problemStartTime) / 1000);
        setCurrentProblemTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, problemStartTime]);

  // Total quiz timer useEffect
  useEffect(() => {
    if (!isPaused && quizStartTime && quiz) {
      totalTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((new Date() - quizStartTime) / 1000);
        setTotalElapsedTime(elapsed);

        // Time limit хэтэрсэн эсэхийг шалгах
        const timeLimit = quiz.default_time_limit;
        if (timeLimit && elapsed >= timeLimit * 60) {
          // Хугацаа дууссан
          clearInterval(totalTimerRef.current);
          setShowTimeLimitModal(true);
        }
      }, 1000);
    } else {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
      }
    }

    return () => {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
      }
    };
  }, [isPaused, quizStartTime, quiz]);

  // Хариулт хадгалах (problemId = integer pk)
  const submitAnswer = useCallback(
    async (problemId, answerData, imageFile) => {
      if (!answerSheet) return;

      // Fill-in-the-blank бодлого: тус тусдаа хадгалах
      if (answerData.answers) {
        const submitPromises = Object.entries(answerData.answers).map(([label, value]) => {
          const formData = new FormData();
          formData.append('problem', problemId);
          formData.append('label', label);
          formData.append('value', value);
          formData.append('time_spent', currentProblemTime);
          formData.append('started_at', problemStartTime.toISOString());
          formData.append('submitted_at', new Date().toISOString());
          return apiClient.post(
            `/api/integral/answer-sheets/${answerSheet.id}/submit-answer/`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        });
        await Promise.all(submitPromises);
      } else {
        // Multiple choice эсвэл traditional - нэг хариулт
        const formData = new FormData();
        formData.append('problem', problemId);
        formData.append('label', answerData.label || '');
        formData.append('value', answerData.value || '');
        formData.append('time_spent', currentProblemTime);
        formData.append('started_at', problemStartTime.toISOString());
        formData.append('submitted_at', new Date().toISOString());
        if (imageFile) {
          formData.append('image', imageFile);
        }
        await apiClient.post(
          `/api/integral/answer-sheets/${answerSheet.id}/submit-answer/`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
    },
    [answerSheet, currentProblemTime, problemStartTime]
  );

  // Дараагийн бодлого
  const handleNext = async () => {
    if (isSaving) return;
    const currentProblem = problems[currentIndex];
    const currentAnswer = answers[currentProblem.id];
    const imageFile = selectedImages[currentProblem.id];

    if (currentAnswer) {
      setIsSaving(true);
      try {
        await submitAnswer(currentProblem.id, currentAnswer, imageFile);
      } catch (err) {
        console.error('Хариулт хадгалахад алдаа:', err);
      } finally {
        setIsSaving(false);
      }
    }

    if (currentIndex < problems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentProblemTime(0);
      setProblemStartTime(new Date());
    } else {
      setShowFinishModal(true);
    }
  };

  // Өмнөх бодлого
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentProblemTime(0);
      setProblemStartTime(new Date());
    }
  };

  // Түр зогсоох
  const handlePause = async () => {
    try {
      // Одоогийн хариулт байвал хадгалах
      const currentProblem = problems[currentIndex];
      const currentAnswer = answers[currentProblem?.id];
      const imageFile = selectedImages[currentProblem?.id];
      if (currentAnswer && currentProblem) {
        await submitAnswer(currentProblem.id, currentAnswer, imageFile).catch(console.error);
      }
      await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/pause/`);
      setIsPaused(true);
      setShowPauseModal(true);
    } catch (err) {
      console.error('Түр зогсоохоон алдаа:', err);
      alert('Түр зогсоохоон алдаа гарлаа.');
    }
  };

  // Үргэлжлүүлэх
  const handleResume = async () => {
    try {
      await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/resume/`);
      setIsPaused(false);
      setShowPauseModal(false);
      setProblemStartTime(new Date()); // Timer-г дахин эхлүүлэх
    } catch (err) {
      console.error('Үргэлжлүүлэхэд алдаа:', err);
      alert('Үргэлжлүүлэхэд алдаа гарлаа.');
    }
  };

  // Тест дуусгах
  const handleFinish = async () => {
    try {
      // Сүүлчийн хариултыг хадгалах
      const currentProblem = problems[currentIndex];
      const currentAnswer = answers[currentProblem?.id];
      const imageFile = selectedImages[currentProblem?.id];
      if (currentAnswer && currentProblem) {
        await submitAnswer(currentProblem.id, currentAnswer, imageFile);
      }

      // Тест дуусгах
      await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/finish/`);

      // Дүн харуулах хуудас руу шилжих
      navigate(`/quiz/${id}/result/${answerSheet.id}`);
    } catch (err) {
      console.error('Тест дуусгахад алдаа:', err);
      alert('Тест дуусгахад алдаа гарлаа.');
    }
  };

  // Хариулт өөрчлөх
  const handleAnswerChange = (problemId, label, value, answersObj) => {
    setAnswers((prev) => ({
      ...prev,
      [problemId]: answersObj ? { answers: answersObj } : { label, value },
    }));
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        <Link to={`/quiz/${id}`} className="btn btn-outline-secondary">
          &laquo; Тестийн хуудас руу буцах
        </Link>
      </Container>
    );
  }

  if (!problems || problems.length === 0) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Энэ тестэд бодлого байхгүй байна.</Alert>
        <Link to={`/quiz/${id}`} className="btn btn-outline-secondary">
          &laquo; Тестийн хуудас руу буцах
        </Link>
      </Container>
    );
  }

  const currentProblem = problems[currentIndex];
  const progress = ((currentIndex + 1) / problems.length) * 100;

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      {/* Progress & Timer */}
      <Card className="mb-3">
        <Card.Body>
          <Stack direction="horizontal" gap={3} className="mb-2 flex-wrap">
            <div>
              <strong>Бодлого:</strong> {currentIndex + 1} / {problems.length}
            </div>
            <div>
              <i className="bi bi-clock me-1"></i>
              <strong>{formatTime(currentProblemTime)}</strong>
              <small className="text-muted"> (одоо)</small>
            </div>
            {quiz?.default_time_limit && (
              <div className="ms-auto">
                <i className="bi bi-hourglass-split me-1"></i>
                <strong>{formatTime(totalElapsedTime)}</strong>
                <small className="text-muted"> / {quiz.default_time_limit} мин</small>
                {totalElapsedTime >= quiz.default_time_limit * 60 * 0.9 && (
                  <Badge bg="warning" className="ms-2">
                    Хугацаа дуусч байна!
                  </Badge>
                )}
              </div>
            )}
          </Stack>
          <ProgressBar now={progress} label={`${Math.round(progress)}%`} />
        </Card.Body>
      </Card>

      {/* Бодлого */}
      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">
            Бодлого {currentIndex + 1}
            {currentProblem.type === 1 && (
              <Badge bg="info" className="ms-2">
                Сонгох
              </Badge>
            )}
            {currentProblem.type === 4 && (
              <Badge bg="warning" className="ms-2">
                Нөхөх
              </Badge>
            )}
            {currentProblem.type === 0 && (
              <Badge bg="secondary" className="ms-2">
                Уламжлалт
              </Badge>
            )}
          </h5>
        </Card.Header>
        <Card.Body>
          {/* Бодлогын гарчиг */}
          {currentProblem.title && (
            <div className="mb-3 mathjax-content">
              <strong>
                <LivePreview content={currentProblem.title} />
              </strong>
            </div>
          )}

          {/* Бодлогын өгүүлбэр */}
          {currentProblem.statement && (
            <div className="mb-4 mathjax-content">
              <LivePreview content={currentProblem.statement} />
            </div>
          )}

          {/* Хариулт оруулах хэсэг */}
          {currentProblem.type === 1 &&
          currentProblem.choices &&
          currentProblem.choices.length > 0 ? (
            // Multiple choice - Radio buttons
            <Form>
              {currentProblem.choices.map((choice) => (
                <Form.Check
                  key={choice.id}
                  type="radio"
                  id={`choice-${choice.id}`}
                  name={`problem-${currentProblem.id}`}
                  label={
                    <div className="mathjax-content">
                      <LivePreview content={`${choice.label}: ${choice.value}`} />
                    </div>
                  }
                  checked={answers[currentProblem.id]?.label === choice.label}
                  onChange={() => handleAnswerChange(currentProblem.id, choice.label, choice.value)}
                />
              ))}
            </Form>
          ) : currentProblem.type === 4 &&
            currentProblem.choices &&
            currentProblem.choices.length > 0 ? (
            // Fill-in-the-blank - Input fields
            <div>
              <Form.Label className="mb-3">Хариултаа нөхнө үү:</Form.Label>
              {currentProblem.choices.map((choice) => (
                <Form.Group key={choice.id} className="mb-3">
                  <InputGroup>
                    <InputGroup.Text style={{ minWidth: '80px' }}>
                      <strong className="mathjax-content">
                        <LivePreview content={choice.label} />
                      </strong>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={answers[currentProblem.id]?.answers?.[choice.label] || ''}
                      onChange={(e) => {
                        const currentAnswers = answers[currentProblem.id]?.answers || {};
                        const newAnswers = {
                          ...currentAnswers,
                          [choice.label]: e.target.value,
                        };
                        console.log(
                          '[Fill-in-blank input] choice.label:',
                          choice.label,
                          'value:',
                          e.target.value
                        );
                        console.log('[Fill-in-blank input] newAnswers:', newAnswers);
                        handleAnswerChange(currentProblem.id, '', '', newAnswers);
                      }}
                      placeholder={`${choice.value.length} оронтой`}
                      maxLength={choice.value.length}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    {choice.value.length} тэмдэгт оруулна уу
                  </Form.Text>
                </Form.Group>
              ))}
            </div>
          ) : (
            // Traditional - Text area + Image upload
            <div>
              <Form.Group className="mb-3">
                <Form.Label>Хариулт:</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={answers[currentProblem.id]?.value || ''}
                  onChange={(e) => handleAnswerChange(currentProblem.id, '', e.target.value)}
                  placeholder="Хариултаа энд бичнэ үү..."
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>
                  <i className="bi bi-image me-1"></i>
                  Зураг оруулах (сонголттой):
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setSelectedImages((prev) => ({
                        ...prev,
                        [currentProblem.id]: file,
                      }));
                    }
                  }}
                />
                {selectedImages[currentProblem.id] && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(selectedImages[currentProblem.id])}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                      className="border rounded"
                    />
                    <div className="mt-1">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedImages((prev) => {
                            const newImages = { ...prev };
                            delete newImages[currentProblem.id];
                            return newImages;
                          });
                        }}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Устгах
                      </Button>
                    </div>
                  </div>
                )}
              </Form.Group>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Navigation Buttons */}
      <Stack direction="horizontal" gap={2} className="mb-3">
        <Button variant="outline-secondary" onClick={handlePrevious} disabled={currentIndex === 0}>
          <i className="bi bi-arrow-left me-1"></i>
          Өмнөх
        </Button>

        <Button variant="warning" onClick={handlePause} className="ms-auto">
          <i className="bi bi-pause-circle me-1"></i>
          Түр зогсоох
        </Button>

        {currentIndex < problems.length - 1 ? (
          <Button variant="primary" onClick={handleNext} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner as="span" size="sm" className="me-1" />
                Хадгалж байна...
              </>
            ) : (
              <>
                Дараагийнх
                <i className="bi bi-arrow-right ms-1"></i>
              </>
            )}
          </Button>
        ) : (
          <Button variant="success" onClick={() => setShowFinishModal(true)}>
            <i className="bi bi-check-circle me-1"></i>
            Дуусгах
          </Button>
        )}
      </Stack>

      {/* Pause Modal */}
      <Modal show={showPauseModal} onHide={handleResume} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>
            <i className="bi bi-pause-circle text-warning me-2"></i>
            Тест түр зогссон
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Тест түр зогссон байна. Та хүссэн үедээ үргэлжлүүлж болно.</p>
          <Alert variant="info" className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Түр зогсоосон хугацаа нийт хугацаанд тооцогдохгүй.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleResume}>
            <i className="bi bi-play-circle me-2"></i>
            Үргэлжлүүлэх
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate(`/quiz/${id}`)}>
            Гарах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Finish Modal */}
      <Modal show={showFinishModal} onHide={() => setShowFinishModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle text-success me-2"></i>
            Тест дуусгах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Та тестийг дуусгахдаа итгэлтэй байна уу?</p>
          <p className="mb-0">
            <strong>Нийт хариулсан:</strong> {Object.keys(answers).length} / {problems.length}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFinishModal(false)}>
            Цуцлах
          </Button>
          <Button variant="success" onClick={handleFinish}>
            <i className="bi bi-check-circle me-2"></i>
            Тийм, дуусгах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Time Limit Modal */}
      <Modal show={showTimeLimitModal} onHide={() => {}} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>
            <i className="bi bi-hourglass-bottom text-danger me-2"></i>
            Хугацаа дууслаа!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Тестийн хугацаа ({quiz?.default_time_limit} минут) дууссан байна.
          </Alert>
          <p className="mb-0">Та тестийг дуусгах уу эсвэл үргэлжлүүлэх үү?</p>
          <p className="text-muted small">
            <strong>Санамж:</strong> Үргэлжлүүлсэн ч дүн дээр нөлөөлнө.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowTimeLimitModal(false);
              // Timer-г үргэлжлүүлэх
              setQuizStartTime(new Date(new Date() - totalElapsedTime * 1000));
            }}
          >
            <i className="bi bi-play-circle me-2"></i>
            Үргэлжлүүлэх
          </Button>
          <Button variant="danger" onClick={handleFinish}>
            <i className="bi bi-check-circle me-2"></i>
            Тестийг дуусгах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizTakePage;
