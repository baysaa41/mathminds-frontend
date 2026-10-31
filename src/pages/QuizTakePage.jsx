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
import Badge from 'react-bootstrap/Badge';

import { QuizProgressHeader } from '../components/quizTake/QuizProgressHeader.jsx';
import { ProblemAnswerInput } from '../components/quizTake/ProblemAnswerInput.jsx';
import { ProblemNavigatorSidebar } from '../components/quizTake/ProblemNavigatorSidebar.jsx';
import { PauseModal } from '../components/quizTake/PauseModal.jsx';
import { FinishModal } from '../components/quizTake/FinishModal.jsx';
import { TimeLimitModal } from '../components/quizTake/TimeLimitModal.jsx';
import { LeaveWarningModal } from '../components/quizTake/LeaveWarningModal.jsx';

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
      <div className="d-flex flex-column flex-md-row gap-3 align-items-md-start">
      <div style={{ flex: 1, minWidth: 0 }}>
      <QuizProgressHeader
        currentIndex={currentIndex}
        problemsLength={problems.length}
        currentProblemTime={currentProblemTime}
        totalProblemTime={totalProblemTime}
        totalElapsedTime={totalElapsedTime}
        defaultTimeLimit={quiz?.default_time_limit}
        answeredCount={answeredCount}
      />

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
          <ProblemAnswerInput
            problem={currentProblem}
            answer={answers[currentProblem.id]}
            selectedImage={selectedImages[currentProblem.id]}
            onAnswerChange={handleAnswerChange}
            onImageSelect={(problemId, file) => {
              setSelectedImages((prev) => ({
                ...prev,
                [problemId]: file,
              }));
            }}
            onImageRemove={(problemId) => {
              setSelectedImages((prev) => {
                const newImages = { ...prev };
                delete newImages[problemId];
                return newImages;
              });
            }}
          />
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

      <ProblemNavigatorSidebar
        problems={problems}
        answers={answers}
        selectedImages={selectedImages}
        currentIndex={currentIndex}
        answeredCount={answeredCount}
        isSaving={isSaving}
        onJumpTo={handleJumpTo}
        onFinish={() => setShowFinishModal(true)}
        onSaveAndExit={handleSaveAndExit}
      />
      </div>{/* d-flex wrapper */}

      <PauseModal
        show={showPauseModal}
        onResume={handleResume}
        onExit={() => { intentionalExitRef.current = true; navigate(`/quiz/${id}`); }}
      />

      <FinishModal
        show={showFinishModal}
        onHide={() => setShowFinishModal(false)}
        answeredCount={answeredCount}
        problemsLength={problems.length}
        onConfirm={handleFinish}
      />

      <TimeLimitModal
        show={showTimeLimitModal}
        defaultTimeLimit={quiz?.default_time_limit}
        onContinue={() => {
          setShowTimeLimitModal(false);
          // Timer-г үргэлжлүүлэх
          setQuizStartTime(new Date(new Date() - totalElapsedTime * 1000));
        }}
        onFinish={handleFinish}
      />

      <LeaveWarningModal
        show={showLeaveModal}
        onHide={() => setShowLeaveModal(false)}
        isSavingLeave={isSavingLeave}
        onSaveAndExit={async () => {
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
        onExitWithoutSaving={() => {
          setShowLeaveModal(false);
          intentionalExitRef.current = true;
          navigate(`/quiz/${id}`);
        }}
      />
    </Container>
  );
};

export default QuizTakePage;
