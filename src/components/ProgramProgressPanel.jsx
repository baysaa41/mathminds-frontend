// frontend/src/components/ProgramProgressPanel.jsx
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { Star } from 'lucide-react';

/**
 * Хөтөлбөрийн сэдэв бүрийн явц (mastery) + AI-аар шалгах тест үүсгэх/бодох
 * товчнуудыг харуулна. useProgramProgress hook-оос ирсэн state/action-уудыг
 * дамжуулж ашиглана — ProgramProgressModal болон ProgramDetailPage хоёулаа
 * энэ markup-ийг дахин ашиглана.
 */
const ProgramProgressPanel = ({
  loading,
  error,
  data,
  generatingTopicId,
  generatingReview,
  onTopicQuiz,
  onReviewQuiz,
  onTopicClick,
}) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (!data) {
    return error ? <Alert variant="danger" className="py-2 small">{error}</Alert> : null;
  }

  return (
    <>
      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      {(generatingReview || generatingTopicId) && (
        <Alert variant="info" className="py-2 small d-flex align-items-center gap-2">
          <Spinner as="span" size="sm" />
          AI тест бэлдэж байна... (хэдэн арван секунд орчим үргэлжилж болно)
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
        <div className="text-muted small">
          {data.program.grade}-р анги
          {data.current_week_num && !data.program_finished && (
            <> · Одоогийн долоо хоног: {data.current_week_num}</>
          )}
          {data.program_finished && <> · Хөтөлбөрийг бүрэн үзсэн</>}
        </div>
        <Button
          variant={data.program.has_review_quiz ? 'outline-success' : 'outline-primary'}
          size="sm"
          onClick={onReviewQuiz}
          disabled={generatingReview}
        >
          {generatingReview ? <Spinner as="span" size="sm" className="me-1" /> : null}
          {data.program.has_review_quiz ? 'Нэгтгэсэн тест бодох' : 'Нэгтгэсэн тест үүсгэх (40 бодлого)'}
        </Button>
      </div>

      {data.topics.length === 0 ? (
        <div className="text-muted small">Энэ хөтөлбөрт долоо хоногийн сэдэв бүртгэгдээгүй байна.</div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {data.topics.map((t) => {
            const masteryPct = Math.round((t.mastery_score || 0) * 100);
            const starCount = Math.round(masteryPct / 20);
            return (
              <div
                key={t.id}
                className={`p-2 border rounded ${t.is_current ? 'border-primary bg-light' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div
                    className="flex-grow-1"
                    role={onTopicClick ? 'button' : undefined}
                    onClick={onTopicClick ? () => onTopicClick(t.id) : undefined}
                    style={onTopicClick ? { cursor: 'pointer' } : undefined}
                  >
                    <div className="small fw-semibold">
                      {t.week_num}. {t.topic}
                      {t.is_current && (
                        <Badge bg="primary" className="ms-2">Одоо</Badge>
                      )}
                      {t.is_club_current && (
                        <Badge bg="info" className="ms-2">Клуб яг одоо</Badge>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < starCount ? 'text-warning' : 'text-muted'}
                          fill={i < starCount ? 'currentColor' : 'none'}
                        />
                      ))}
                      {t.problems_attempted > 0 ? (
                        <span className="text-muted small ms-1">
                          {t.problems_correct}/{t.problems_attempted} зөв
                        </span>
                      ) : (
                        <span className="text-muted small ms-1">Хараахан бодоогүй</span>
                      )}
                    </div>
                  </div>
                  {onTopicQuiz && (
                    <Button
                      variant={t.has_check_quiz ? 'outline-success' : 'outline-primary'}
                      size="sm"
                      onClick={() => onTopicQuiz(t.id)}
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ProgramProgressPanel;
