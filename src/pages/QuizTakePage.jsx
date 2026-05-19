// frontend/src/pages/QuizTakePage.jsx
// Тест бөглөх хуудас

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
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
  const [problemTimes, setProblemTimes] = useState({}); // { problemId: seconds }
  const [totalElapsedTime, setTotalElapsedTime] = useState(0); // Нийт зарцуулсан хугацаа (секунд)
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState(false);
  const timerRef = useRef(null);
  const totalTimerRef = useRef(null);
  const baseTimeRef = useRef(0); // accumulated seconds from previous visits to current problem
  const intentionalExitRef = useRef(false); // санаатай гарахад leave modal-г bypass хийнэ

  // Modal states
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLeave, setIsSavingLeave] = useState(false);

  // Browser close/refresh анхааруулга
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (answerSheet && !loading && !intentionalExitRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answerSheet, loading]);

  // Browser back товч анхааруулга (popstate)
  useEffect(() => {
    if (!answerSheet || loading) return;
    // Одоогийн байрлалыг history-д нэмж back-с хамгаална
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      if (intentionalExitRef.current) return;
      // Back товч дарсан үед буцааж state нэмж modal харуулна
      window.history.pushState(null, '', window.location.href);
      setShowLeaveModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [answerSheet, loading]);

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

        // Паузласан бол сүүлд бодсон бодлогоос үргэлжлүүлэх
        if (sheetData.current_problem_index) {
          setCurrentIndex(sheetData.current_problem_index);
        }

        // Өмнө зарцуулсан хугацааг сэргээх
        const savedTime = sheetData.total_time_spent || 0;
        const restoredStart = new Date(new Date().getTime() - savedTime * 1000);
        setQuizStartTime(restoredStart);
        setTotalElapsedTime(savedTime);

        // Бодлого бүрийн хугацааг хариултаас сэргээх
        const timesMap = {};
        if (sheetData.answers && sheetData.answers.length > 0) {
          sheetData.answers.forEach(ans => {
            if (ans.problem && ans.time_spent) {
              // Fill-in blanks: нэг бодлогод олон хариулт байж болно — хамгийн ихийг авна
              timesMap[ans.problem] = Math.max(timesMap[ans.problem] || 0, ans.time_spent);
            }
          });
        }
        // Хариулт өгөөгүй бодлогын хугацааг current_problem_time-с нөхөх
        const savedProblemIdx = sheetData.current_problem_index || 0;
        const savedProblemTime = sheetData.current_problem_time || 0;
        const currentProblemId = problemsData[savedProblemIdx]?.id;
        if (currentProblemId && !timesMap[currentProblemId] && savedProblemTime > 0) {
          timesMap[currentProblemId] = savedProblemTime;
        }
        setProblemTimes(timesMap);

        // Одоогийн бодлогын тоологчийг сэргээх
        const restoredProblemTime = currentProblemId ? (timesMap[currentProblemId] || 0) : savedProblemTime;
        baseTimeRef.current = restoredProblemTime;
        setCurrentProblemTime(restoredProblemTime);

        // Timer эхлүүлэх
        setProblemStartTime(new Date());
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
        setCurrentProblemTime(baseTimeRef.current + elapsed);
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
      saveProblemTime(problems[currentIndex].id, currentProblemTime);
      goToIndex(currentIndex + 1);
    } else {
      setShowFinishModal(true);
    }
  };

  // Өмнөх бодлого
  const handlePrevious = () => {
    if (currentIndex > 0) {
      saveProblemTime(problems[currentIndex].id, currentProblemTime);
      goToIndex(currentIndex - 1);
    }
  };

  // Одоогийн хариулт хадгалаад паузлах (дотоод хэрэгцээ)
  const pauseWithIndex = async (idx) => {
    const currentProblem = problems[currentIndex];
    const currentAnswer = answers[currentProblem?.id];
    const imageFile = selectedImages[currentProblem?.id];
    if (currentAnswer && currentProblem) {
      await submitAnswer(currentProblem.id, currentAnswer, imageFile).catch(console.error);
    }
    baseTimeRef.current = currentProblemTime;
    await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/pause/`, {
      current_problem_index: idx,
      time_spent: totalElapsedTime,
      current_problem_time: currentProblemTime,
    });
  };

  // Түр зогсоох (modal харуулна)
  const handlePause = async () => {
    try {
      await pauseWithIndex(currentIndex);
      setIsPaused(true);
      setShowPauseModal(true);
    } catch (err) {
      console.error('Түр зогсоохоон алдаа:', err);
      alert('Түр зогсоохоон алдаа гарлаа.');
    }
  };

  // Хадгалаад гарах (modal харуулахгүй, шууд гарна)
  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      await pauseWithIndex(currentIndex);
      intentionalExitRef.current = true;
      navigate(`/quiz/${id}`);
    } catch (err) {
      console.error('Хадгалаад гарахад алдаа:', err);
      alert('Хадгалаад гарахад алдаа гарлаа.');
    } finally {
      setIsSaving(false);
    }
  };

  // Үргэлжлүүлэх
  const handleResume = async () => {
    try {
      await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/resume/`);
      setIsPaused(false);
      setShowPauseModal(false);
      // Нийт хугацааны тоологчийг зогссон цагаас үргэлжлүүлэх
      setQuizStartTime(new Date(new Date().getTime() - totalElapsedTime * 1000));
      setProblemStartTime(new Date());
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
        await submitAnswer(currentProblem.id, currentAnswer, imageFile).catch(console.error);
      }

      // Тест дуусгах
      await apiClient.post(`/api/integral/answer-sheets/${answerSheet.id}/finish/`);

      // Дүн харуулах хуудас руу шилжих
      intentionalExitRef.current = true;
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

  // Бодлого шилжихэд хугацааг хадгалж, шинэ хугацааг сэргээх
  const saveProblemTime = (fromProblemId, totalTime) => {
    setProblemTimes(prev => ({
      ...prev,
      [fromProblemId]: totalTime,
    }));
  };

  const goToIndex = (idx) => {
    const nextProblemId = problems[idx]?.id;
    const base = problemTimes[nextProblemId] || 0;
    baseTimeRef.current = base;
    setCurrentIndex(idx);
    setCurrentProblemTime(base);
    setProblemStartTime(new Date());
  };

  // Sidebar-аас бодлого руу шүүж очих
  const handleJumpTo = async (idx) => {
    if (idx === currentIndex || isSaving) return;
    const currentProblem = problems[currentIndex];
    const currentAnswer = answers[currentProblem?.id];
    const imageFile = selectedImages[currentProblem?.id];
    if (currentAnswer && currentProblem) {
      setIsSaving(true);
      try {
        await submitAnswer(currentProblem.id, currentAnswer, imageFile);
      } catch (err) {
        console.error('Хариулт хадгалахад алдаа:', err);
      } finally {
        setIsSaving(false);
      }
    }
    saveProblemTime(currentProblem.id, currentProblemTime);
    goToIndex(idx);
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

  // Бүх бодлогод зарцуулсан нийт хугацаа
  const totalProblemTime = currentProblemTime + Object.entries(problemTimes)
    .filter(([id]) => Number(id) !== currentProblem?.id)
    .reduce((sum, [, t]) => sum + t, 0);

  // Бодлогод бодит хариулт байгаа эсэхийг төрлөөр нь шалгах
  const hasRealAnswer = (p) => {
    const ans = answers[p.id];
    if (p.type === 4) {
      return !!ans?.answers &&
        (p.choices || []).length > 0 &&
        (p.choices || []).every(c => {
          const v = ans.answers[c.label];
          return v !== undefined && v !== '';
        });
    }
    if (p.type === 1) return !!(ans?.label);
    // type=0 уламжлалт: текст эсвэл зураг
    return !!(ans?.value?.trim()) || !!(selectedImages[p.id]);
  };

  const answeredCount = problems.filter(p => hasRealAnswer(p)).length;

  return (
    <Container fluid className="py-4" style={{ maxWidth: '1100px' }}>
      <div className="d-flex gap-3 align-items-start">
      <div style={{ flex: 1, minWidth: 0 }}>
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
            <div className="ms-auto d-flex gap-3 align-items-center">
              <div>
                <i className="bi bi-stopwatch me-1"></i>
                <strong>{formatTime(totalProblemTime)}</strong>
                <small className="text-muted"> (нийт)</small>
              </div>
              {quiz?.default_time_limit && (
                <div>
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
            </div>
          </Stack>
          <ProgressBar
            now={problems.length ? Math.round(answeredCount / problems.length * 100) : 0}
            label={`${answeredCount}/${problems.length}`}
          />
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
      </div>{/* flex main */}

      {/* Right Sidebar */}
      <div style={{
        width: 200,
        flexShrink: 0,
        position: 'sticky',
        top: 80,
        alignSelf: 'flex-start',
      }}>
        <div className="card border-0 shadow-sm">
          <div className="card-header py-2 px-3 bg-white border-bottom d-flex justify-content-between align-items-center">
            <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>Бодлогууд</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {answeredCount}/{problems.length}
            </span>
          </div>
          <div className="card-body p-2">
            <div className="d-flex flex-wrap gap-1">
              {problems.map((p, idx) => {
                const ans = answers[p.id];
                let isAnswered = false;
                let isPartial = false;
                if (p.type === 4) {
                  const choices = p.choices || [];
                  const filledCount = choices.filter(c => {
                    const v = ans?.answers?.[c.label];
                    return v !== undefined && v !== '';
                  }).length;
                  isAnswered = choices.length > 0 && filledCount === choices.length;
                  isPartial = filledCount > 0 && filledCount < choices.length;
                } else if (p.type === 1) {
                  isAnswered = !!(ans?.label);
                } else {
                  isAnswered = !!(ans?.value?.trim()) || !!(selectedImages[p.id]);
                }
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleJumpTo(idx)}
                    disabled={isSaving}
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: '0.75rem',
                      fontWeight: isCurrent ? 700 : 500,
                      border: isCurrent ? '2px solid #0d6efd' : isPartial ? '1px solid #ffc107' : '1px solid #dee2e6',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isCurrent
                        ? '#0d6efd'
                        : isAnswered
                        ? '#d1e7dd'
                        : isPartial
                        ? '#fff3cd'
                        : '#f8f9fa',
                      color: isCurrent ? '#fff' : isAnswered ? '#0a3622' : isPartial ? '#664d03' : '#6c757d',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 d-flex flex-column gap-1" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, background: '#0d6efd', borderRadius: 3, display: 'inline-block' }} />
                Одоогийн
              </div>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, background: '#d1e7dd', border: '1px solid #dee2e6', borderRadius: 3, display: 'inline-block' }} />
                Хариулсан
              </div>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 3, display: 'inline-block' }} />
                Дутуу
              </div>
              <div className="d-flex align-items-center gap-1">
                <span style={{ width: 12, height: 12, background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 3, display: 'inline-block' }} />
                Хариулаагүй
              </div>
            </div>
            <div className="mt-3 d-flex flex-column gap-2">
              <button
                className="btn btn-success btn-sm w-100"
                onClick={() => setShowFinishModal(true)}
                disabled={isSaving}
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-check-circle me-1"></i>
                Дуусгах
              </button>
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={handleSaveAndExit}
                disabled={isSaving}
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-save me-1"></i>
                Хадгалаад гарах
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>{/* d-flex wrapper */}

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
          <Button variant="outline-secondary" onClick={() => { intentionalExitRef.current = true; navigate(`/quiz/${id}`); }}>
            <i className="bi bi-save me-1"></i>
            Хадгалаад гарах
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
            <strong>Нийт хариулсан:</strong> {answeredCount} / {problems.length}
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

      {/* Leave Warning Modal — back товч дарахад гарна */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} centered backdrop="static">
        <Modal.Header>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Тестээс гарах уу?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Та тестийг дуусгаагүй байна. Явцыг хадгалаад гарах уу?</p>
          <p className="text-muted small mb-0">
            Хадгалсан тохиолдолд дараа үргэлжлүүлж болно.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            disabled={isSavingLeave}
            onClick={async () => {
              setIsSavingLeave(true);
              try {
                await pauseWithIndex(currentIndex);
              } catch (e) {
                console.error(e);
              } finally {
                setIsSavingLeave(false);
              }
              setShowLeaveModal(false);
              intentionalExitRef.current = true;
              navigate(`/quiz/${id}`);
            }}
          >
            {isSavingLeave
              ? <><Spinner as="span" size="sm" className="me-1" />Хадгалж байна...</>
              : <><i className="bi bi-save me-1" />Хадгалаад гарах</>
            }
          </Button>
          <Button
            variant="outline-danger"
            disabled={isSavingLeave}
            onClick={() => {
              setShowLeaveModal(false);
              intentionalExitRef.current = true;
              navigate(`/quiz/${id}`);
            }}
          >
            Хадгалахгүй гарах
          </Button>
          <Button
            variant="outline-secondary"
            disabled={isSavingLeave}
            onClick={() => setShowLeaveModal(false)}
          >
            Цуцлах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};



export default QuizTakePage;
