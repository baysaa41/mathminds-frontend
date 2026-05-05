// ClubExercisesPage — өдрийн дасгал: бодлого бодох интерактив горим
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { Dumbbell, ChevronLeft, ChevronRight, Lightbulb, CheckCircle, XCircle } from 'lucide-react';

import LivePreview from '../components/LivePreview';
import EmptyState from '../components/common/EmptyState';
import apiClient from '../api/axiosConfig';
import { API_ENDPOINTS } from '../constants/api';

const MONTHS_MN = [
  '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];
function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}.${MONTHS_MN[d.getMonth()]} ${d.getDate()}`;
}

// ── Бодлогын индексийн товчнууд ──────────────────────────────────────────────
function IndexNav({ items, currentIdx, userAnswers, onSelect }) {
  return (
    <div className="d-flex flex-wrap gap-2 mb-4">
      {items.map((item, idx) => {
        const ua = userAnswers[item.item_id];
        const answered = ua?.is_correct !== null && ua?.is_correct !== undefined;
        let variant = 'outline-secondary';
        if (answered && ua.is_correct === true)  variant = 'success';
        if (answered && ua.is_correct === false) variant = 'danger';
        const isActive = idx === currentIdx;
        return (
          <Button
            key={item.item_id}
            variant={variant}
            size="sm"
            onClick={() => onSelect(idx)}
            style={{
              width: 36, height: 36, borderRadius: '50%', padding: 0,
              fontWeight: 700, fontSize: 13,
              boxShadow: isActive ? '0 0 0 3px rgba(13,110,253,.35)' : undefined,
            }}
          >
            {idx + 1}
          </Button>
        );
      })}
    </div>
  );
}

// ── Хариулт оруулах хэсэг ────────────────────────────────────────────────────
function AnswerInput({ problem, value, onChange, disabled }) {
  if (problem.type === 1) {
    // Сонгох тест (MC)
    return (
      <div className="mb-3">
        {(problem.choices || []).map(c => (
          <Form.Check
            key={c.id}
            type="radio"
            id={`choice-${c.id}`}
            name={`problem-${problem.id}`}
            className="mb-2"
            checked={value === c.label}
            onChange={() => onChange(c.label)}
            disabled={disabled}
            label={
              <span className="d-flex gap-2 align-items-start">
                <Badge bg="secondary" className="flex-shrink-0 mt-1" style={{ minWidth: 22 }}>
                  {c.label}
                </Badge>
                <LivePreview content={c.value} />
              </span>
            }
          />
        ))}
      </div>
    );
  }
  // Уламжлалт (0) болон нөхөх тест (4)
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

// ── Дүнгийн мессеж ───────────────────────────────────────────────────────────
function ResultBanner({ ua, correctAnswer }) {
  if (!ua || ua.is_correct === null || ua.is_correct === undefined) return null;
  if (ua.is_correct) {
    return (
      <Alert variant="success" className="d-flex align-items-center gap-2 py-2">
        <CheckCircle size={18} className="flex-shrink-0" />
        <span>Зөв хариулт!</span>
      </Alert>
    );
  }
  return (
    <Alert variant="danger" className="d-flex align-items-center gap-2 py-2">
      <XCircle size={18} className="flex-shrink-0" />
      <span>
        Буруу.{correctAnswer ? <> Зөв хариулт: <strong>{correctAnswer}</strong></> : null}
      </span>
    </Alert>
  );
}

// ── Үндсэн хуудас ────────────────────────────────────────────────────────────
const ClubExercisesPage = () => {
  const { clubData } = useOutletContext();
  const clubId = clubData?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get('date');

  const [allDates, setAllDates]       = useState([]);
  const [noData, setNoData]           = useState(false);
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [currentIdx, setCurrentIdx]   = useState(0);
  // {item_id: {answer, is_correct, correct_answer}}
  const [userAnswers, setUserAnswers] = useState({});
  // {item_id: string} — бичиж байгаа утга
  const [localInput, setLocalInput]   = useState({});
  // {item_id: bool} — шалгаж байна
  const [checking, setChecking]       = useState({});
  // {item_id: {text, type, loading}}
  const [hintState, setHintState]     = useState({});

  // Бүх өдрийн жагсаалт (sidebar-тай хуваалцдаг)
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

  // Сонгосон өдрийн бодлогуудыг татах
  useEffect(() => {
    if (!clubId || !selectedDate) return;
    let cancelled = false;
    setItems([]);
    setUserAnswers({});
    setLocalInput({});
    setHintState({});
    setCurrentIdx(0);
    setLoading(true);
    apiClient.get(API_ENDPOINTS.CLUBS.DAILY_PRACTICE(clubId), {
      params: { date: selectedDate },
    }).then(res => {
      if (cancelled) return;
      const fetched = res.data?.items || [];
      setItems(fetched);
      // Хуудас шинэчлэгдэхэд хариулсан бодлогуудыг сэргээнэ
      const initAnswers = {};
      const initInput = {};
      for (const it of fetched) {
        if (it.user_answer && it.user_answer.is_correct !== null) {
          initAnswers[it.item_id] = {
            answer: it.user_answer.answer,
            is_correct: it.user_answer.is_correct,
            correct_answer: it.problem.correct_answer || '',
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
    return () => { cancelled = true; };
  }, [clubId, selectedDate]);

  const currentItem    = items[currentIdx] || null;
  const currentProblem = currentItem?.problem || null;
  const itemId         = currentItem?.item_id;
  const ua             = userAnswers[itemId];
  const isAnswered     = ua?.is_correct !== null && ua?.is_correct !== undefined;
  const hint           = hintState[itemId];

  // Шалгах
  const handleCheck = useCallback(async () => {
    if (!currentItem) return;
    const id = currentItem.item_id;
    const answer = localInput[id] || '';
    if (!answer.trim()) return;
    setChecking(prev => ({ ...prev, [id]: true }));
    try {
      const res = await apiClient.post(API_ENDPOINTS.CLUBS.DAILY_PRACTICE_ANSWER(clubId), {
        item_id: id, answer,
      });
      const { is_correct, correct_answer } = res.data;
      setUserAnswers(prev => ({ ...prev, [id]: { answer, is_correct, correct_answer } }));
      setItems(prev => prev.map(it =>
        it.item_id === id
          ? { ...it, problem: { ...it.problem, correct_answer } }
          : it
      ));
    } finally {
      setChecking(prev => ({ ...prev, [id]: false }));
    }
  }, [clubId, currentItem, localInput]);

  // Заавар авах
  const handleHint = useCallback(async () => {
    if (!currentItem) return;
    const id = currentItem.item_id;
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
  }, [clubId, currentItem]);

  // Өдрийн навигаци
  const dateIdx  = allDates.findIndex(d => d.date === selectedDate);
  const prevDate = dateIdx > 0 ? allDates[dateIdx - 1].date : null;
  const nextDate = dateIdx < allDates.length - 1 ? allDates[dateIdx + 1].date : null;
  const goTo = d => setSearchParams({ date: d }, { replace: false });

  // ── Render ──
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

  const doneCount = Object.values(userAnswers).filter(
    a => a.is_correct !== null && a.is_correct !== undefined
  ).length;

  return (
    <div>
      {/* Гарчиг + өдрийн навигаци */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Button variant="outline-secondary" size="sm" disabled={!prevDate} onClick={() => goTo(prevDate)}>
          <ChevronLeft size={14} />
        </Button>
        <div className="text-center">
          <div className="fw-semibold">{formatDateLabel(selectedDate)}</div>
          {items.length > 0 && (
            <small className="text-muted">{doneCount}/{items.length} бодлого</small>
          )}
        </div>
        <Button variant="outline-secondary" size="sm" disabled={!nextDate} onClick={() => goTo(nextDate)}>
          <ChevronRight size={14} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-muted small">
          Энэ өдөр дасгал байхгүй байна.
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm p-3">
          {/* Индексийн товчнууд */}
          <IndexNav
            items={items}
            currentIdx={currentIdx}
            userAnswers={userAnswers}
            onSelect={setCurrentIdx}
          />

          {currentProblem && (
            <>
              {/* Бодлогын дугаар */}
              <div className="small text-muted mb-2">
                Бодлого {currentIdx + 1} / {items.length}
              </div>

              {/* Бодлогын гарчиг */}
              {currentProblem.title && (
                <div className="fw-semibold mb-2">
                  <LivePreview content={currentProblem.title} />
                </div>
              )}

              {/* Бодлогын текст */}
              {currentProblem.statement && (
                <div className="mb-3 border-start border-3 border-primary ps-3">
                  <LivePreview content={currentProblem.statement} />
                </div>
              )}

              {/* Хариулт оруулах */}
              {!isAnswered && (
                <AnswerInput
                  problem={currentProblem}
                  value={localInput[itemId] || ''}
                  onChange={val => setLocalInput(prev => ({ ...prev, [itemId]: val }))}
                  disabled={!!checking[itemId]}
                />
              )}

              {/* Дүн */}
              <ResultBanner ua={ua} correctAnswer={ua?.correct_answer} />

              {/* Товчнууд */}
              <div className="d-flex gap-2 mb-3">
                {!isAnswered && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCheck}
                    disabled={!(localInput[itemId] || '').trim() || !!checking[itemId]}
                  >
                    {checking[itemId] ? <Spinner animation="border" size="sm" /> : 'Шалгах'}
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleHint}
                  disabled={!!hint?.loading}
                >
                  {hint?.loading
                    ? <Spinner animation="border" size="sm" />
                    : <><Lightbulb size={14} className="me-1" />Заавар</>
                  }
                </Button>
              </div>

              {/* Заавар */}
              {hint?.text && (
                <Alert
                  variant={hint.type === 'ai' ? 'info' : 'light'}
                  className="small mb-3"
                >
                  {hint.type === 'ai' && (
                    <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                      <Lightbulb size={14} />AI заавар
                    </div>
                  )}
                  <LivePreview content={hint.text} />
                </Alert>
              )}

              {/* Бодлого хооронд шилжих */}
              <div className="d-flex justify-content-between mt-4 pt-3 border-top">
                <Button
                  variant="outline-secondary" size="sm"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => i - 1)}
                >
                  <ChevronLeft size={14} className="me-1" />Өмнөх
                </Button>
                <Button
                  variant="outline-secondary" size="sm"
                  disabled={currentIdx === items.length - 1}
                  onClick={() => setCurrentIdx(i => i + 1)}
                >
                  Дараагийн<ChevronRight size={14} className="ms-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ClubExercisesPage;
