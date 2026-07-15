// frontend/src/components/ProgramProgressModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';
import { GraduationCap } from 'lucide-react';
import {
  getProgramProgress,
  getTopicCheckQuiz,
  getProgramReviewQuiz,
} from '../services/clubsService';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180000; // 40 бодлоготой нэгтгэсэн тест удаан үүсэж болно

/**
 * fetchFn нь har удаа {status: 'ready'|'generating', quiz_uuid?, title?} буцаана.
 * 'generating' бол Celery дуусах хүртэл дахин дуудаж хүлээнэ.
 */
const pollUntilReady = async (fetchFn) => {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let result = await fetchFn();
  while (result.status !== 'ready') {
    if (Date.now() > deadline) {
      throw new Error('AI тест үүсгэх хугацаа дууслаа.');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    result = await fetchFn();
  }
  return result;
};

/**
 * Хөтөлбөрийн агуулга, сэдэв бүрийн явц (mastery) харуулж, AI-аар үүсгэсэн
 * шалгах тест рүү шилжих модал.
 */
const ProgramProgressModal = ({ show, onHide, programId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [generatingTopicId, setGeneratingTopicId] = useState(null);
  const [generatingReview, setGeneratingReview] = useState(false);

  useEffect(() => {
    if (!show || !programId) return;
    setLoading(true);
    setError(null);
    getProgramProgress(programId)
      .then(setData)
      .catch(() => setError('Хөтөлбөрийн явц татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [show, programId]);

  const handleTopicQuiz = async (topicId) => {
    setGeneratingTopicId(topicId);
    setError(null);
    try {
      const quiz = await pollUntilReady(() => getTopicCheckQuiz(topicId));
      onHide();
      navigate(`/quiz/${quiz.quiz_uuid}`);
    } catch {
      setError('Тест үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setGeneratingTopicId(null);
    }
  };

  const handleReviewQuiz = async () => {
    setGeneratingReview(true);
    setError(null);
    try {
      const quiz = await pollUntilReady(() => getProgramReviewQuiz(programId));
      onHide();
      navigate(`/quiz/${quiz.quiz_uuid}`);
    } catch {
      setError('Тест үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setGeneratingReview(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <GraduationCap size={20} />
          {data?.program?.name || 'Хөтөлбөрийн агуулга'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        {(generatingReview || generatingTopicId) && (
          <Alert variant="info" className="py-2 small d-flex align-items-center gap-2">
            <Spinner as="span" size="sm" />
            AI тест бэлдэж байна... (хэдэн арван секунд орчим үргэлжилж болно)
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : data ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="text-muted small">
                {data.program.grade}-р анги
                {data.current_week_num && !data.program_finished && (
                  <> · Одоогийн долоо хоног: {data.current_week_num}</>
                )}
                {data.program_finished && <> · Хөтөлбөрийг бүрэн үзсэн</>}
              </div>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleReviewQuiz}
                disabled={generatingReview}
              >
                {generatingReview ? (
                  <Spinner as="span" size="sm" className="me-1" />
                ) : null}
                {data.program.has_review_quiz ? 'Нэгтгэсэн тест бодох' : 'Нэгтгэсэн тест үүсгэх (40 бодлого)'}
              </Button>
            </div>

            {data.topics.length === 0 ? (
              <div className="text-muted small">Энэ хөтөлбөрт долоо хоногийн сэдэв бүртгэгдээгүй байна.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {data.topics.map((t) => {
                  const pct = Math.round((t.mastery_score || 0) * 100);
                  const variant = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'danger';
                  return (
                    <div
                      key={t.id}
                      className={`p-2 border rounded ${t.is_current ? 'border-primary bg-light' : ''}`}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1">
                          <div className="small fw-semibold">
                            {t.week_num}. {t.topic}
                            {t.is_current && (
                              <Badge bg="primary" className="ms-2">Одоо</Badge>
                            )}
                          </div>
                          {t.problems_attempted > 0 ? (
                            <div className="mt-1" style={{ maxWidth: '220px' }}>
                              <ProgressBar
                                now={pct}
                                variant={variant}
                                label={`${pct}%`}
                                style={{ height: '14px', fontSize: '0.65rem' }}
                              />
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {t.problems_correct}/{t.problems_attempted} зөв
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted small mt-1">Хараахан бодоогүй</div>
                          )}
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleTopicQuiz(t.id)}
                          disabled={generatingTopicId === t.id}
                        >
                          {generatingTopicId === t.id ? (
                            <Spinner as="span" size="sm" />
                          ) : t.has_check_quiz ? (
                            'Тест бодох'
                          ) : (
                            'Тест үүсгэх'
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </Modal.Body>
    </Modal>
  );
};

export default ProgramProgressModal;
