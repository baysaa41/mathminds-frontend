// ClubExercisesPage — өдрийн дасгал: дэд бүлгээр хуваасан интерактив горим
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Nav from 'react-bootstrap/Nav';
import Modal from 'react-bootstrap/Modal';
import {
  Dumbbell, ChevronLeft, ChevronRight, Lightbulb,
  CheckCircle, XCircle, BookOpen, Hash, Sparkles, ChevronDown, ChevronUp, Clock,
} from 'lucide-react';

import LivePreview from '../components/LivePreview';
import EmptyState from '../components/common/EmptyState';
import apiClient from '../api/axiosConfig';
import { API_ENDPOINTS } from '../constants/api';

const MONTHS_MN = [
  '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар',
];
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}.${MONTHS_MN[d.getMonth()]} ${d.getDate()}`;
}


function AnswerInput({ problem, value, onChange, disabled, blankResults }) {
  if (problem.type === 1) {
    return (
      <div className="mb-3 d-flex flex-wrap gap-2">
        {[...(problem.choices || [])].sort((a, b) => (a.label || '').localeCompare(b.label || '')).map(c => {
          const selected = value === c.label;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => !disabled && onChange(c.label)}
              disabled={disabled}
              style={{
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.6rem 0.9rem',
                border: `2px solid ${selected ? '#0d6efd' : '#dee2e6'}`,
                borderRadius: '0.5rem',
                background: selected ? '#e8f0fe' : '#fff',
                cursor: disabled ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.15s, background 0.15s',
                opacity: disabled ? 0.75 : 1,
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 26,
                height: 26,
                borderRadius: '50%',
                background: selected ? '#0d6efd' : '#e9ecef',
                color: selected ? '#fff' : '#495057',
                fontWeight: 700,
                fontSize: '0.78rem',
                flexShrink: 0,
                marginTop: 2,
              }}>
                {c.label}
              </span>
              <span>
                <LivePreview content={c.value} />
              </span>
            </button>
          );
        })}
      </div>
    );
  }
  if (problem.type === 4) {
    const blanks = problem.choices || [];
    const parsed = (() => { try { return JSON.parse(value || '{}'); } catch { return {}; } })();
    return (
      <div className="mb-3 d-flex flex-column gap-2">
        {blanks.map(blank => {
          const br = blankResults?.[blank.label];
          const borderColor = br ? (br.is_correct ? '#198754' : '#dc3545') : '#dee2e6';
          const bg          = br ? (br.is_correct ? '#f0fff4' : '#fff5f5') : '#fff';
          return (
            <div key={blank.label} className="d-flex align-items-center gap-2">
              <span className="fw-semibold" style={{ minWidth: 36, fontSize: '0.85rem', color: br ? (br.is_correct ? '#198754' : '#dc3545') : '#6c757d' }}>
                {blank.label})
              </span>
              <Form.Control
                type="text"
                placeholder="Хариулт..."
                value={parsed[blank.label] || ''}
                onChange={e => {
                  const updated = { ...parsed, [blank.label]: e.target.value };
                  onChange(JSON.stringify(updated));
                }}
                disabled={disabled}
                style={{ maxWidth: 220, borderColor, background: bg }}
                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
              />
              {br && (
                <span style={{ fontSize: '0.78rem', color: br.is_correct ? '#198754' : '#dc3545' }}>
                  {br.is_correct
                    ? `+${br.score}`
                    : `0/${br.max_score} (зөв: ${br.correct_value})`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <Form.Control
      className="mb-3"
      type="text"
      placeholder="Хариултаа бичнэ үү..."
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
    />
  );
}

function ResultBanner({ ua, onRetry, problemType }) {
  if (!ua || ua.is_correct === null || ua.is_correct === undefined) return null;

  // Fill-in-blank: оноотой нийлмэл мессеж
  if (problemType === 4) {
    const hasScore = ua.max_score != null && ua.max_score > 0;
    if (ua.is_correct) {
      return (
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2">
          <CheckCircle size={18} className="flex-shrink-0" />
          <span>Бүгд зөв!{hasScore && <strong> {ua.score}/{ua.max_score} оноо</strong>}</span>
        </Alert>
      );
    }
    const partialOk = hasScore && ua.score > 0;
    return (
      <Alert variant={partialOk ? 'warning' : 'danger'} className="py-2">
        <div className="d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            {partialOk
              ? <span>Хэсэгчлэн зөв — <strong>{ua.score}/{ua.max_score} оноо</strong></span>
              : <span><XCircle size={18} className="flex-shrink-0 me-1" />Буруу. <strong>0/{ua.max_score} оноо</strong></span>
            }
          </span>
          <Button variant={`outline-${partialOk ? 'warning' : 'danger'}`} size="sm" onClick={onRetry} className="flex-shrink-0 ms-2">
            Дахин оролдох
          </Button>
        </div>
      </Alert>
    );
  }

  if (ua.is_correct) {
    return (
      <Alert variant="success" className="d-flex align-items-center gap-2 py-2">
        <CheckCircle size={18} className="flex-shrink-0" />
        <span>Зөв хариулт!</span>
      </Alert>
    );
  }
  const correctDisplay = ua.correct_answer || null;
  return (
    <Alert variant="danger" className="py-2">
      <div className="d-flex align-items-center justify-content-between">
        <span className="d-flex align-items-center gap-2">
          <XCircle size={18} className="flex-shrink-0" />
          <span>Буруу.{correctDisplay && <> Зөв: <strong>{correctDisplay}</strong></>}</span>
        </span>
        <Button variant="outline-danger" size="sm" onClick={onRetry} className="flex-shrink-0 ms-2">
          Дахин оролдох
        </Button>
      </div>
    </Alert>
  );
}

function ExtraInfo({ extra, itemId, enrichState, onEnrich, problemUuid, _problemId, hasAnswered }) {
  const { user } = useAuth();
  const [showSolution, setShowSolution] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const enrich = enrichState[itemId] || {};

  const hasSolution   = !!(extra?.solution?.solution || extra?.solution?.hint);
  const hasTopics     = (extra?.topics || []).length > 0;
  const hasKeywords   = (extra?.keywords || []).length > 0;
  const hasAiTopics   = (enrich.topics || []).length > 0;
  const hasAiSolution = !!enrich.solution;

  const needsEnrich = (!hasSolution && !hasAiSolution)
    || (!hasTopics && !hasKeywords && !hasAiTopics);

  const topicNames = [
    ...(extra?.topics || []).map(t => ({ name: t.name, ai: false })),
    ...(!hasTopics ? (extra?.keywords || []).map(k => ({ name: k.name, ai: false })) : []),
    ...(enrich.topics || []).map(t => ({ name: t, ai: true })),
  ];

  const allFormulas = extra?.formulas || [];

  return (
    <div className="mt-3 pt-3 border-top">
      {/* Бодолт */}
      {hasAnswered && (hasSolution || hasAiSolution) && (
        <div className="mb-2">
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="link" size="sm"
              className="p-0 text-decoration-none d-flex align-items-center gap-1"
              onClick={() => setShowSolution(v => !v)}
            >
              <BookOpen size={13} />
              <span style={{ fontSize: '0.8rem' }}>Бодолт харах</span>
              {showSolution ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </Button>
            {user?.is_staff && problemUuid && (
              <Link
                to={`/problem/${problemUuid}/solution/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted"
                style={{ fontSize: '0.72rem' }}
              >
                <i className="bi bi-pencil-square me-1" />засах
              </Link>
            )}
          </div>
          {showSolution && (
            <div className="border-start border-3 border-success ps-3 mt-2">
              {/* Сэдэв */}
              {topicNames.length > 0 && (
                <div className="mb-2 d-flex flex-wrap gap-1 align-items-center">
                  <Hash size={13} className="text-muted flex-shrink-0" />
                  {topicNames.map((t, i) => (
                    <Badge
                      key={i}
                      bg={t.ai ? 'info' : 'light'}
                      text={t.ai ? 'dark' : 'dark'}
                      className="border"
                      style={{ fontSize: '0.72rem' }}
                    >
                      {t.ai ? '✦ ' : ''}{t.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Холбоотой томьёо */}
              {allFormulas.length > 0 && (
                <div className="mb-3">
                  <div className="small text-muted mb-1 d-flex align-items-center gap-1">
                    <BookOpen size={13} />Холбоотой томьёо, тодорхойлолт
                  </div>
                  {allFormulas.map(f => (
                    <div key={f.id} className="border rounded px-3 py-2 mb-2 bg-light">
                      {f.title && (
                        <div className="fw-semibold mb-1" style={{ fontSize: '0.85rem' }}>
                          <LivePreview content={f.title} />
                        </div>
                      )}
                      <LivePreview content={f.content} />
                    </div>
                  ))}
                </div>
              )}

              <LivePreview
                content={
                  extra?.solution?.solution || extra?.solution?.hint || enrich.solution || ''
                }
              />

              {/* Дэлгэрэнгүй тайлбар (хадгалагдсан байвал харуулна) */}
              {extra?.solution?.explanation && (
                <div className="mt-2">
                  <Button
                    variant="link" size="sm"
                    className="p-0 text-decoration-none d-flex align-items-center gap-1"
                    onClick={() => setShowExplanation(v => !v)}
                  >
                    <Sparkles size={13} className="text-warning" />
                    <span style={{ fontSize: '0.8rem' }}>Дэлгэрэнгүй тайлбар</span>
                    {showExplanation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </Button>
                  {showExplanation && (
                    <div className="border-start border-3 border-warning ps-3 mt-2">
                      <LivePreview content={extra.solution.explanation} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI нөхөх */}
      {needsEnrich && (
        <Button
          variant="outline-secondary" size="sm"
          className="d-flex align-items-center gap-1 mt-1"
          style={{ fontSize: '0.75rem' }}
          onClick={() => onEnrich(itemId)}
          disabled={!!enrich.loading}
        >
          {enrich.loading
            ? <Spinner animation="border" size="sm" />
            : <><Sparkles size={13} />AI нөхөх</>}
        </Button>
      )}
      {enrich.error && (
        <div className="text-danger small mt-1">{enrich.error}</div>
      )}
    </div>
  );
}

function ProblemCard({
  item, idx, total,
  userAnswers, localInput, checking, hintState, enrichState,
  elapsedSeconds,
  onAnswer, onCheck, onHint, onEnrich, onRetry, onPrev, onNext,
}) {
  const { user } = useAuth();
  const problem    = item.problem;
  const ua         = userAnswers[item.item_id];
  // Fill-in: хариулт өгсөн бол (зөв/буруу аль ч байсан) input хааж, feedback харуулна
  const isAnswered = problem.type === 4
    ? (ua?.is_correct !== undefined && ua?.is_correct !== null)
    : ua?.is_correct === true;
  const hint       = hintState[item.item_id] || {};

  const [showHintModal, setShowHintModal] = useState(false);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (wasLoadingRef.current && !hint.loading && hint.text) {
      setShowHintModal(true);
    }
    wasLoadingRef.current = !!hint.loading;
  }, [hint.loading, hint.text]);

  const handleHintClick = () => {
    if (hint.text) {
      setShowHintModal(true);
    } else {
      onHint(item);
    }
  };

  return (
    <div>
      <div className="small text-muted mb-2 d-flex align-items-center justify-content-between">
        <span>Бодлого {idx + 1} / {total}</span>
        <span className="d-flex align-items-center gap-1">
          <Clock size={13} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
          </span>
        </span>
      </div>

      {problem.title && (
        <div className="fw-semibold mb-2"><LivePreview content={problem.title} /></div>
      )}
      {user?.is_staff && problem.uuid && (
        <div className="mb-2">
          <Link
            to={`/problem/${problem.uuid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="small text-muted text-decoration-none"
            style={{ fontSize: '0.72rem' }}
          >
            <i className="bi bi-box-arrow-up-right me-1" />бодлого #{problem.id}
          </Link>
        </div>
      )}
      {problem.statement && (
        <div className="mb-3 border-start border-3 border-primary ps-3">
          <LivePreview content={problem.statement} />
        </div>
      )}

      {isAnswered ? (
        (problem.type === 1 || problem.type === 4) ? (
          <AnswerInput
            problem={problem}
            value={ua.answer || ''}
            onChange={() => {}}
            disabled={true}
            blankResults={ua.blank_results}
          />
        ) : (
          <div className="mb-3 d-flex align-items-center gap-2">
            <CheckCircle size={16} className="text-success flex-shrink-0" />
            <span className="text-success fw-semibold">{ua.answer}</span>
          </div>
        )
      ) : (
        <AnswerInput
          problem={problem}
          value={localInput[item.item_id] || ''}
          onChange={val => onAnswer(item.item_id, val)}
          disabled={!!checking[item.item_id]}
        />
      )}

      <ResultBanner ua={ua} onRetry={() => onRetry(item.item_id)} problemType={problem.type} />

      <div className="d-flex gap-2 mb-3">
        {!isAnswered && (() => {
          let inputOk;
          const rawInput = localInput[item.item_id] || '';
          if (problem.type === 4) {
            try {
              const p = JSON.parse(rawInput || '{}');
              inputOk = (problem.choices || []).every(b => (p[b.label] || '').trim());
            } catch { inputOk = false; }
          } else {
            inputOk = !!rawInput.trim();
          }
          return (
            <Button
              variant="primary" size="sm"
              onClick={() => onCheck(item)}
              disabled={!inputOk || !!checking[item.item_id]}
            >
              {checking[item.item_id]
                ? <Spinner animation="border" size="sm" />
                : 'Шалгах'}
            </Button>
          );
        })()}
        <Button
          variant="outline-secondary" size="sm"
          onClick={handleHintClick}
          disabled={!!hint.loading}
          className="d-flex align-items-center gap-1"
        >
          {hint.loading
            ? <Spinner animation="border" size="sm" />
            : <><Lightbulb size={14} />Заавар авах</>}
        </Button>
      </div>

      <Modal show={showHintModal} onHide={() => setShowHintModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2 fs-6">
            <Lightbulb size={16} />
            {hint.type === 'ai' ? 'AI заавар' : 'Заавар'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LivePreview content={hint.text || ''} />
        </Modal.Body>
      </Modal>

      <ExtraInfo
        extra={item.extra}
        itemId={item.item_id}
        enrichState={enrichState}
        onEnrich={onEnrich}
        problemUuid={problem.uuid}
        problemId={problem.id}
        hasAnswered={!!ua}
      />

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <Button variant="outline-secondary" size="sm" disabled={idx === 0} onClick={onPrev}>
          <ChevronLeft size={14} className="me-1" />Өмнөх
        </Button>
        <Button variant="outline-secondary" size="sm" disabled={idx === total - 1} onClick={onNext}>
          Дараагийн<ChevronRight size={14} className="ms-1" />
        </Button>
      </div>
    </div>
  );
}


function GroupSection({ items, currentIdx, onIdxChange, userAnswers, localInput, checking, hintState, enrichState,
  elapsedSeconds, onAnswer, onCheck, onHint, onEnrich, onRetry }) {
  const current = items[currentIdx] || null;
  if (!current) return null;

  return (
    <div className="bg-white rounded shadow-sm p-3">
      <ProblemCard
        item={current}
        idx={currentIdx}
        total={items.length}
        userAnswers={userAnswers}
        localInput={localInput}
        checking={checking}
        hintState={hintState}
        enrichState={enrichState}
        elapsedSeconds={elapsedSeconds}
        onAnswer={onAnswer}
        onCheck={onCheck}
        onHint={onHint}
        onEnrich={onEnrich}
        onRetry={onRetry}
        onPrev={() => onIdxChange(i => i - 1)}
        onNext={() => onIdxChange(i => i + 1)}
      />
    </div>
  );
}

const ClubExercisesPage = () => {
  const { clubData, setProblemNavData } = useOutletContext();
  const clubId = clubData?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  const [allDates, setAllDates]       = useState([]);
  const [noData, setNoData]           = useState(false);
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [activeTab, setActiveTab]     = useState('main');

  const [userAnswers, setUserAnswers] = useState({});
  const [localInput, setLocalInput]   = useState({});
  const [checking, setChecking]       = useState({});
  const [hintState, setHintState]     = useState({});
  const [enrichState, setEnrichState] = useState({});
  const [currentIdxMap, setCurrentIdxMap] = useState({});

  // Таймер: item_id тус бүрд хэдэн секунд зарцуулсныг хадгална
  const timeAccRef     = useRef({});   // { [item_id]: accumulated_seconds }
  const activeTimerRef = useRef(null); // { item_id, startMs }
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerIntervalRef  = useRef(null);
  const selectedDateRef   = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  useEffect(() => {
    if (!clubId) return;
    apiClient.get(`${API_ENDPOINTS.MINDS.POSTS}dates/`, {
      params: { club: clubId, content_type: 'problem' },
    }).then(res => {
      const list = res.data || [];
      setAllDates(list);
      setNoData(list.length === 0);
    }).catch(() => setNoData(true));
  }, [clubId]);

  useEffect(() => {
    if (!clubId || !selectedDate) return;
    let cancelled = false;

    // Өмнө хадгалсан хугацааг ачаалах
    const storageKey = `exercises_time_${clubId}_${selectedDate}`;
    try {
      timeAccRef.current = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      timeAccRef.current = {};
    }

    setItems([]);
    setUserAnswers({});
    setLocalInput({});
    setHintState({});
    setEnrichState({});
    setActiveTab('main');
    setLoading(true);

    apiClient.get(API_ENDPOINTS.CLUBS.DAILY_PRACTICE(clubId), {
      params: { date: selectedDate },
    }).then(res => {
      if (cancelled) return;
      const fetched = res.data?.items || [];
      setItems(fetched);
      const initAnswers = {};
      const initInput   = {};
      for (const it of fetched) {
        if (it.user_answer && it.user_answer.is_correct !== null) {
          initAnswers[it.item_id] = {
            answer: it.user_answer.answer,
            is_correct: it.user_answer.is_correct,
            correct_answer: it.problem.correct_answer || '',
            blank_results: it.user_answer.blank_results || null,
            score: it.user_answer.score ?? null,
            max_score: it.user_answer.max_score ?? null,
          };
          initInput[it.item_id] = it.user_answer.answer || '';
        }
      }
      setUserAnswers(initAnswers);
      setLocalInput(initInput);
    }).catch(() => {
      if (!cancelled) setItems([]);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      // Идэвхтэй таймерийн хугацааг нэгтгэж localStorage-д хадгална
      const active = activeTimerRef.current;
      if (active) {
        timeAccRef.current[active.item_id] =
          (timeAccRef.current[active.item_id] || 0) + Math.floor((Date.now() - active.startMs) / 1000);
        activeTimerRef.current = null;
      }
      if (Object.keys(timeAccRef.current).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(timeAccRef.current));
      }
      timeAccRef.current = {};
      cancelled = true;
    };
  }, [clubId, selectedDate]);

  const handleCheck = useCallback(async (item) => {
    const id = item.item_id;
    const answer = localInput[id] || '';
    if (!answer.trim()) return;

    // Одоогийн таймерийг зогсоож нийт хугацааг тооцно
    const prev = activeTimerRef.current;
    let elapsed = timeAccRef.current[id] || 0;
    if (prev?.item_id === id) {
      elapsed += Math.floor((Date.now() - prev.startMs) / 1000);
      timeAccRef.current[id] = elapsed;
      activeTimerRef.current = null; // хариулсны дараа таймер зогсоно
    }
    // Хугацааг localStorage-д хадгалж sidebar-д мэдэгдэнэ
    const date = selectedDateRef.current;
    if (date) {
      localStorage.setItem(`exercises_time_${clubId}_${date}`, JSON.stringify(timeAccRef.current));
      window.dispatchEvent(new CustomEvent('exercises-time-saved'));
    }

    setChecking(prev => ({ ...prev, [id]: true }));
    try {
      const res = await apiClient.post(API_ENDPOINTS.CLUBS.DAILY_PRACTICE_ANSWER(clubId), {
        item_id: id, answer, time_spent: elapsed || undefined,
      });
      const { is_correct, correct_answer, blank_results, score, max_score } = res.data;
      setUserAnswers(prev => ({
        ...prev,
        [id]: { answer, is_correct, correct_answer, blank_results, score, max_score },
      }));
      setItems(prev => prev.map(it =>
        it.item_id === id ? { ...it, problem: { ...it.problem, correct_answer } } : it
      ));
    } finally {
      setChecking(prev => ({ ...prev, [id]: false }));
    }
  }, [clubId, localInput]);

  const handleHint = useCallback(async (item) => {
    const id = item.item_id;
    setHintState(prev => ({ ...prev, [id]: { ...(prev[id] || {}), loading: true } }));
    try {
      const res = await apiClient.post(API_ENDPOINTS.CLUBS.DAILY_PRACTICE_HINT(clubId), {
        item_id: id,
      });
      setHintState(prev => ({
        ...prev,
        [id]: { text: res.data.hint, type: res.data.type, loading: false },
      }));
    } catch {
      setHintState(prev => ({
        ...prev,
        [id]: { text: 'Заавар авахад алдаа гарлаа.', type: 'error', loading: false },
      }));
    }
  }, [clubId]);

  const handleEnrich = useCallback(async (itemId) => {
    setEnrichState(prev => ({ ...prev, [itemId]: { loading: true } }));
    try {
      const res = await apiClient.post(API_ENDPOINTS.CLUBS.DAILY_PRACTICE_ENRICH(clubId), {
        item_id: itemId,
      });
      setEnrichState(prev => ({ ...prev, [itemId]: { ...res.data, loading: false } }));
    } catch {
      setEnrichState(prev => ({
        ...prev,
        [itemId]: { error: 'AI нөхөхөд алдаа гарлаа.', loading: false },
      }));
    }
  }, [clubId]);

  const dateIdx  = allDates.findIndex(d => d.date === selectedDate);
  const prevDate = dateIdx > 0 ? allDates[dateIdx - 1].date : null;
  const nextDate = dateIdx < allDates.length - 1 ? allDates[dateIdx + 1].date : null;
  const goTo     = d => setSearchParams({ date: d }, { replace: false });

  const mainItems = useMemo(() => items.filter(it => !it.subgroup), [items]);
  const subgroups = useMemo(() => {
    const map = {};
    for (const it of items) {
      if (!it.subgroup) continue;
      const key = it.subgroup.id;
      if (!map[key]) map[key] = { info: it.subgroup, items: [] };
      map[key].items.push(it);
    }
    return Object.values(map).sort((a, b) => a.info.id - b.info.id);
  }, [items]);
  const hasTabs = subgroups.length > 0;

  const handleRetry = useCallback((itemId) => {
    setUserAnswers(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setLocalInput(prev => ({ ...prev, [itemId]: '' }));
    // Таймерыг дахин эхлүүлнэ (хуримтлагдсан хугацаа хадгалагдана)
    activeTimerRef.current = { item_id: itemId, startMs: Date.now() };
  }, []);

  const activeItems = useMemo(() => {
    if (activeTab === 'main') return hasTabs ? mainItems : items;
    return subgroups.find(sg => `sg-${sg.info.id}` === activeTab)?.items || [];
  }, [activeTab, hasTabs, mainItems, items, subgroups]);
  const activeCurrentIdx = currentIdxMap[activeTab] ?? 0;

  // Идэвхтэй бодлого солигдоход таймер шилжүүлнэ
  useEffect(() => {
    const newItemId = activeItems[activeCurrentIdx]?.item_id;
    const prev = activeTimerRef.current;
    if (prev) {
      timeAccRef.current[prev.item_id] =
        (timeAccRef.current[prev.item_id] || 0) + Math.floor((Date.now() - prev.startMs) / 1000);
    }
    activeTimerRef.current = newItemId ? { item_id: newItemId, startMs: Date.now() } : null;
  }, [activeItems, activeCurrentIdx]);

  // Хуудас орхиход таймер зогсоно
  useEffect(() => {
    return () => {
      const prev = activeTimerRef.current;
      if (prev) {
        timeAccRef.current[prev.item_id] =
          (timeAccRef.current[prev.item_id] || 0) + Math.floor((Date.now() - prev.startMs) / 1000);
        activeTimerRef.current = null;
      }
    };
  }, []);

  // Дэлгэцийн таймер — 1 секунд тутамд: одоогийн бодлогын + нийт хугацааг шинэчлэнэ
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const itemId = activeItems[activeCurrentIdx]?.item_id;
    const isAnswered = itemId ? userAnswers[itemId] !== undefined : false;

    const tick = () => {
      const active = activeTimerRef.current;
      const activeExtra = active ? Math.floor((Date.now() - active.startMs) / 1000) : 0;

      // Нийт хугацаа
      const accTotal = Object.values(timeAccRef.current).reduce((s, v) => s + v, 0);
      setTotalSeconds(accTotal + activeExtra);

      // Одоогийн бодлогын хугацаа: хариулсан бол хөлдөөнө, үгүй бол явна
      if (itemId) {
        const acc = timeAccRef.current[itemId] || 0;
        if (isAnswered) {
          setElapsedSeconds(acc);
        } else {
          const extra = active?.item_id === itemId ? activeExtra : 0;
          setElapsedSeconds(acc + extra);
        }
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    };
  }, [activeItems, activeCurrentIdx, userAnswers]);

  const handleNavSelect = useCallback((i) => {
    setCurrentIdxMap(prev => ({ ...prev, [activeTab]: i }));
  }, [activeTab]);

  useEffect(() => {
    if (!setProblemNavData) return;
    setProblemNavData({
      items: activeItems,
      currentIdx: activeCurrentIdx,
      userAnswers,
      times: { ...timeAccRef.current },
      onSelect: handleNavSelect,
    });
  }, [activeItems, activeCurrentIdx, userAnswers, handleNavSelect, setProblemNavData]);

  useEffect(() => {
    return () => { if (setProblemNavData) setProblemNavData(null); };
  }, [setProblemNavData]);

  const sharedProps = {
    userAnswers, localInput, checking, hintState, enrichState,
    elapsedSeconds,
    onAnswer: (id, val) => setLocalInput(prev => ({ ...prev, [id]: val })),
    onCheck: handleCheck,
    onHint: handleHint,
    onEnrich: handleEnrich,
    onRetry: handleRetry,
  };

  const totalDone = Object.values(userAnswers).filter(a => a.is_correct === true).length;

  if (noData) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Бодлого байхгүй байна"
        message="Клубын хэлэлцүүлэгт бодлого пост нийтлэгдээгүй байна."
      />
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center py-5 text-muted small">
        <Dumbbell size={32} className="mb-2 opacity-25" />
        <p>Баруун талаас өдөр сонгоно уу.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="outline-secondary" size="sm" disabled={!prevDate} onClick={() => goTo(prevDate)}>
          <ChevronLeft size={14} />
        </Button>
        <div className="text-center">
          <div className="fw-semibold">{formatDateLabel(selectedDate)}</div>
          {items.length > 0 && (
            <small className="text-muted d-flex align-items-center gap-2 justify-content-center">
              <span>{totalDone}/{items.length} бодлого</span>
              <span className="d-flex align-items-center gap-1">
                <Clock size={11} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {Math.floor(totalSeconds / 60)}:{String(totalSeconds % 60).padStart(2, '0')}
                </span>
              </span>
            </small>
          )}
        </div>
        <Button variant="outline-secondary" size="sm" disabled={!nextDate} onClick={() => goTo(nextDate)}>
          <ChevronRight size={14} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted small">Энэ өдөр дасгал байхгүй байна.</div>
      ) : (
        <>
          {hasTabs && (
            <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
              <Nav.Item>
                <Nav.Link eventKey="main" className="small">
                  Үндсэн
                  {mainItems.length > 0 && (
                    <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>
                      {mainItems.length}
                    </Badge>
                  )}
                </Nav.Link>
              </Nav.Item>
              {subgroups.map(sg => (
                <Nav.Item key={sg.info.id}>
                  <Nav.Link eventKey={`sg-${sg.info.id}`} className="small">
                    <span
                      className="me-1"
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        display: 'inline-block', verticalAlign: 'middle',
                        background: `var(--bs-${sg.info.color || 'primary'})`,
                      }}
                    />
                    {sg.info.name}
                    <Badge bg="secondary" className="ms-1" style={{ fontSize: '0.65rem' }}>
                      {sg.items.length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          )}

          {(!hasTabs || activeTab === 'main') && (
            <GroupSection
              items={hasTabs ? mainItems : items}
              currentIdx={currentIdxMap['main'] ?? 0}
              onIdxChange={(v) => setCurrentIdxMap(prev => ({ ...prev, main: typeof v === 'function' ? v(prev.main ?? 0) : v }))}
              {...sharedProps}
            />
          )}

          {subgroups.map(sg => {
            const key = `sg-${sg.info.id}`;
            return activeTab === key ? (
              <GroupSection
                key={sg.info.id}
                items={sg.items}
                currentIdx={currentIdxMap[key] ?? 0}
                onIdxChange={(v) => setCurrentIdxMap(prev => ({ ...prev, [key]: typeof v === 'function' ? v(prev[key] ?? 0) : v }))}
                {...sharedProps}
              />
            ) : null;
          })}
        </>
      )}
    </div>
  );
};

export default ClubExercisesPage;
