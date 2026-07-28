// src/components/quizTake/QuizProgressHeader.jsx
// QuizTakePage-ийн явц/тоолуурын карт (state-гүй, зөвхөн props хүлээж авдаг)

import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { formatTime } from './formatTime.js';

export function QuizProgressHeader({
  currentIndex, problemsLength, currentProblemTime, totalProblemTime,
  totalElapsedTime, defaultTimeLimit, answeredCount,
}) {
  return (
    <Card className="mb-3">
      <Card.Body>
        <Stack direction="horizontal" gap={3} className="mb-2 flex-wrap">
          <div>
            <strong>Бодлого:</strong> {currentIndex + 1} / {problemsLength}
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
            {defaultTimeLimit && (
              <div>
                <i className="bi bi-hourglass-split me-1"></i>
                <strong>{formatTime(totalElapsedTime)}</strong>
                <small className="text-muted"> / {defaultTimeLimit} мин</small>
                {totalElapsedTime >= defaultTimeLimit * 60 * 0.9 && (
                  <Badge bg="warning" className="ms-2">
                    Хугацаа дуусч байна!
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Stack>
        <ProgressBar
          now={problemsLength ? Math.round(answeredCount / problemsLength * 100) : 0}
          label={`${answeredCount}/${problemsLength}`}
        />
      </Card.Body>
    </Card>
  );
}
