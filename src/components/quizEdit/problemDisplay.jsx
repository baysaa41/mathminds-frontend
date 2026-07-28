// src/components/quizEdit/problemDisplay.jsx
// QuizEditPage-ийн бодлого харуулах туслах бүрдлүүд (шинэ state үүсгэдэггүй, цэвэр presentational)

import React from 'react';
import LivePreview from '../LivePreview.jsx';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { PROBLEM_TYPE_LABELS, PROBLEM_TYPE_COLORS } from './problemFormat.js';

// ── Бодлогын мөр (selected list болон modal аль алинд) ──────────
export const ProblemMeta = ({ problem }) => (
  <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
    {problem.type !== undefined && problem.type !== null && (
      <span
        className="badge"
        style={{ backgroundColor: PROBLEM_TYPE_COLORS[problem.type] ?? '#6c757d', fontSize: '0.68rem' }}
      >
        {PROBLEM_TYPE_LABELS[problem.type] ?? 'Тодорхойгүй'}
      </span>
    )}
    {problem.ai_summary ? (
      <span className="text-muted small">
        <Sparkles size={11} className="me-1 text-warning" />
        {problem.ai_summary}
      </span>
    ) : (
      <span className="text-secondary fst-italic small">
        <Sparkles size={11} className="me-1 text-secondary" />
        AI summary байхгүй
      </span>
    )}
    {problem.category && (
      <span
        className="badge ms-1"
        style={{ backgroundColor: problem.category.color || '#6c757d', fontSize: '0.68rem' }}
      >
        {problem.category.name_mn || problem.category.name}
      </span>
    )}
  </div>
);

// ── Бодлогын бүрэн харагдац (QuizTakePage-тай адил) ─────────────
// React.memo: problem prop өөрчлөгдөөгүй бол LivePreview дахин render болохгүй
export const ProblemBodyPreview = React.memo(({ problem }) => (
  <div>
    <div className="fw-semibold mb-1">
      <LivePreview content={problem.title || `Бодлого #${problem.id}`} />
    </div>
    {problem.statement && (
      <div className="mb-2" style={{ fontSize: '0.92rem' }}>
        <LivePreview content={problem.statement} />
      </div>
    )}
    {problem.type === 1 && problem.choices?.length > 0 && (
      <div className="mb-2">
        {[...problem.choices].sort((a, b) => a.label.localeCompare(b.label)).map((choice) => {
          const isCorrect = (choice.default_score ?? 0) > 0;
          return (
            <div
              key={choice.id}
              className={`d-flex align-items-baseline gap-2 mb-1 ${isCorrect ? 'text-success fw-semibold' : ''}`}
              style={{ fontSize: '0.88rem' }}
            >
              {isCorrect ? (
                <CheckCircle2 size={13} className="flex-shrink-0 text-success" />
              ) : (
                <i className="bi bi-circle flex-shrink-0 text-secondary" style={{ fontSize: '0.65rem' }} />
              )}
              <LivePreview content={`${choice.label}: ${choice.value}`} />
              {isCorrect && <span className="badge bg-success" style={{ fontSize: '0.62rem' }}>Зөв</span>}
            </div>
          );
        })}
      </div>
    )}
    {problem.type === 4 && problem.choices?.length > 0 && (
      <div className="mb-2 text-success fw-semibold" style={{ fontSize: '0.88rem' }}>
        <CheckCircle2 size={13} className="me-1" />
        Зөв хариулт: {[...problem.choices]
          .sort((a, b) => a.label.localeCompare(b.label))
          .map(c => `${c.label}=${c.value}`)
          .join(', ')}
      </div>
    )}
    {problem.type === 0 && problem.answer && (
      <div className="mb-2 text-success fw-semibold d-flex align-items-baseline gap-1" style={{ fontSize: '0.88rem' }}>
        <CheckCircle2 size={13} className="flex-shrink-0" />
        <span>Зөв хариулт:</span>
        <LivePreview content={problem.answer} />
      </div>
    )}
    <ProblemMeta problem={problem} />
  </div>
));
