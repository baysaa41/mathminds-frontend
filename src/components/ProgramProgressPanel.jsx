// frontend/src/components/ProgramProgressPanel.jsx
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Badge from 'react-bootstrap/Badge';

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
            // Прогресс бар = гүйцэтгэл (бодсон эсэх), mastery биш — бодсон бол 100%.
            // Өнгө нь mastery-г илэрхийлнэ, зөв хариулсан тоог доор тусад нь харуулна.
            const masteryPct = Math.round((t.mastery_score || 0) * 100);
            const variant = masteryPct >= 70 ? 'success' : masteryPct >= 40 ? 'warning' : 'danger';
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
                      <div className="mt-1" style={{ maxWidth: '280px' }}>
                        <ProgressBar
                          now={100}
                          variant={variant}
                          label="100%"
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
