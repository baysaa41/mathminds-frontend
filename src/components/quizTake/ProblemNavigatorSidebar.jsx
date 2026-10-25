// src/components/quizTake/ProblemNavigatorSidebar.jsx
// QuizTakePage-ийн баруун талын бодлого шүүх сайдбар (state-гүй, зөвхөн props хүлээж авдаг)

export function ProblemNavigatorSidebar({
  problems, answers, selectedImages, currentIndex, answeredCount, isSaving,
  onJumpTo, onFinish, onSaveAndExit,
}) {
  return (
    // Өргөн/sticky-г index.css-ийн .quiz-nav-sidebar тодорхойлно (утсан дээр бодлогын доор бүтэн өргөнөөр)
    <div className="quiz-nav-sidebar">
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
                  onClick={() => onJumpTo(idx)}
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
              onClick={onFinish}
              disabled={isSaving}
              style={{ fontSize: '0.75rem' }}
            >
              <i className="bi bi-check-circle me-1"></i>
              Дуусгах
            </button>
            <button
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={onSaveAndExit}
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
  );
}
