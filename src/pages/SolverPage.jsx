// frontend/src/pages/SolverPage.jsx
// Олимпиадын бодлогыг AI turn бүрчлэн ярилцаж шийдэх хуудас

import { useState, useRef, useEffect, useCallback } from 'react';
import { MathJax } from 'better-react-mathjax';
import apiClient from '../api/axiosConfig.js';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';

const MAX_TURNS = 9;

const AI_OPTIONS = [
  { value: 'gemini',  label: 'Gemini',  icon: '✦', color: '#4285f4' },
  { value: 'chatgpt', label: 'GPT-4o',  icon: '⬡', color: '#10a37f' },
];

// ─── LaTeX хамгаалсан Markdown renderer ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  const saved = [];
  const save = (m) => { const k = `\x00L${saved.length}\x00`; saved.push(m); return k; };
  const restore = (h) => h.replace(/\x00L(\d+)\x00/g, (_, i) => saved[+i]);
  let t = text;
  t = t.replace(/\$\$[\s\S]*?\$\$/g,  save);
  t = t.replace(/\\\[[\s\S]*?\\\]/g,   save);
  t = t.replace(/\$[^$\n]+?\$/g,       save);
  t = t.replace(/\\\([\s\S]*?\\\)/g,   save);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  t = t.replace(/^### (.+)$/gm, '<h6 class="fw-bold mt-3 mb-1">$1</h6>');
  t = t.replace(/^## (.+)$/gm,  '<h5 class="fw-bold mt-3 mb-1">$1</h5>');
  t = t.replace(/^# (.+)$/gm,   '<h4 class="fw-bold mt-3 mb-2">$1</h4>');
  t = t.replace(/((?:^\d+\. .+\n?)+)/gm, (b) => {
    const items = b.trim().split('\n').map(l => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`).join('');
    return `<ol class="ps-4 mb-2">${items}</ol>`;
  });
  t = t.replace(/((?:^[-•] .+\n?)+)/gm, (b) => {
    const items = b.trim().split('\n').map(l => `<li>${l.replace(/^[-•]\s+/, '')}</li>`).join('');
    return `<ul class="ps-4 mb-2">${items}</ul>`;
  });
  t = t.replace(/\n\n+/g, '</p><p class="mb-2">');
  t = t.replace(/\n/g, '<br/>');
  return `<p class="mb-2">${restore(t)}</p>`;
}

// ─── AI-н мэдээлэл авах ──────────────────────────────────────────────────────
function aiInfo(role) {
  return AI_OPTIONS.find(o => o.value === role) || { label: role, icon: '?', color: '#999' };
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ role }) {
  if (role === 'user') {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: '#fff',
        background: 'linear-gradient(135deg,#f39c12,#e67e22)',
        boxShadow: '0 2px 6px rgba(0,0,0,.20)',
      }}>👤</div>
    );
  }
  const ai = aiInfo(role);
  const bg = role === 'gemini'
    ? 'linear-gradient(135deg,#4285f4,#9b59b6)'
    : 'linear-gradient(135deg,#10a37f,#1a7f64)';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 15, color: '#fff', background: bg,
      boxShadow: '0 2px 6px rgba(0,0,0,.20)',
    }}>
      {ai.icon}
    </div>
  );
}

// ─── Нэг chat bubble ─────────────────────────────────────────────────────────
function TurnBubble({ turn }) {
  const isUser   = turn.role === 'user';
  const isSolver = turn.isSolver;   // solver=зүүн, reviewer=баруун
  const alignRight = isUser ? true : !isSolver;

  const isGemini = turn.role === 'gemini';
  const bubbleStyle = isUser ? {
    background: 'linear-gradient(135deg,#fff8f0,#fdefd8)',
    border: '1px solid #f5c97a',
    borderRadius: '14px 4px 14px 14px',
    padding: '11px 15px',
    fontSize: 14, lineHeight: 1.7,
    fontStyle: 'italic',
  } : {
    background: isSolver
      ? 'linear-gradient(135deg,#f0f4ff,#e8eeff)'
      : 'linear-gradient(135deg,#f0fff8,#dff8ef)',
    border: isSolver ? '1px solid #c5d3ff' : '1px solid #a8e8d0',
    borderRadius: isSolver ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
    padding: '13px 16px',
    boxShadow: '0 1px 8px rgba(0,0,0,.05)',
    fontSize: 14, lineHeight: 1.75,
  };

  const labelColor = isUser ? '#e67e22' : isGemini ? '#4285f4' : '#10a37f';

  return (
    <div className={`d-flex gap-2 mb-4 ${alignRight ? 'flex-row-reverse' : ''}`}
      style={{ alignItems: 'flex-start' }}>
      <Avatar role={turn.role} />
      <div style={{ maxWidth: '88%' }}>
        {/* Label + badge */}
        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap"
          style={{ flexDirection: alignRight ? 'row-reverse' : 'row' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.6px',
            textTransform: 'uppercase', color: labelColor,
          }}>
            {turn.label}
          </span>
          {!isUser && turn.accepted === true && (
            <span style={{ background:'#d4edda', color:'#155724', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:600 }}>
              ✅ Зөвшөөрлөө
            </span>
          )}
          {!isUser && turn.accepted === false && (
            <span style={{ background:'#fff3cd', color:'#856404', borderRadius:12, padding:'2px 10px', fontSize:11, fontWeight:600 }}>
              ⚠ Засвар шаардлагатай
            </span>
          )}
        </div>

        {/* Bubble */}
        <div style={bubbleStyle}>
          {isUser
            ? <span>{turn.content}</span>
            : <MathJax>
                <div className="solver-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(turn.content) }} />
              </MathJax>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Ачааллаж байгаа indicator ────────────────────────────────────────────────
function TypingDots({ role }) {
  const isSolver = role === 'solver';
  const ai = aiInfo(role);
  const color = ai.color;
  const label = `${ai.label} ${isSolver ? 'бодож' : 'шалгаж'} байна...`;
  const isLeft = true; // solver үед зүүн, reviewer үед баруун — role-д тулгуурлаж тодорхойлно

  return (
    <div className="d-flex gap-2 mb-4"
      style={{ alignItems: 'flex-start' }}>
      <Avatar role={role} />
      <div style={{
        background: '#f0f4ff',
        border: '1px solid #c5d3ff',
        borderRadius: '4px 14px 14px 14px',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {[0, 160, 320].map(d => (
          <Spinner key={d} animation="grow" size="sm" style={{ color, animationDelay: `${d}ms` }} />
        ))}
        <span style={{ fontSize: 12, color, fontStyle: 'italic', marginLeft: 4 }}>{label}</span>
      </div>
    </div>
  );
}

// ─── AI сонгогч ──────────────────────────────────────────────────────────────
function AIPicker({ label, value, onChange, disabled }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: '.5px',
        textTransform: 'uppercase', marginBottom: 5 }}>
        {label}
      </div>
      <div className="d-flex gap-1">
        {AI_OPTIONS.map(opt => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              style={{
                flex: 1, border: active ? `2px solid ${opt.color}` : '1.5px solid #e0e4f0',
                borderRadius: 8, padding: '5px 0', cursor: disabled ? 'default' : 'pointer',
                background: active ? `${opt.color}18` : '#fff',
                color: active ? opt.color : '#888',
                fontWeight: active ? 700 : 400, fontSize: 12,
                transition: 'all .15s',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Коммент + үргэлжлүүлэх хэсэг ───────────────────────────────────────────
function CommentInput({ nextRole, onContinue }) {
  const [comment, setComment] = useState('');
  const ai = aiInfo(nextRole);
  const nextLabel = `${ai.label} ${nextRole === 'solver' ? 'засварлана' : 'шалгана'}`;

  const submit = () => { onContinue(comment.trim()); setComment(''); };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div style={{
      margin: '0 0 28px',
      background: '#fff',
      border: '1.5px solid #e0e4f0',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,.06)',
    }}>
      <div style={{
        padding: '10px 16px',
        background: '#f8f9fc',
        borderBottom: '1px solid #e8eaf0',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>✏️</span>
        <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>Коммент нэмэх</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#999',
          background: '#eef', borderRadius: 10, padding: '2px 8px',
        }}>заавал биш</span>
      </div>

      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        onKeyDown={onKey}
        placeholder={`Бодолтын талаар коммент бичнэ үү... (хоосон үлдээж Enter дарж ${nextLabel})`}
        rows={2}
        style={{
          width: '100%', border: 'none', outline: 'none', resize: 'none',
          padding: '12px 16px', fontSize: 13, lineHeight: 1.6,
          fontFamily: 'inherit', background: 'transparent',
        }}
      />

      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid #f0f0f5',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: '#aaa', flex: 1 }}>
          Enter — илгээх · Shift+Enter — мөр дараах
        </span>
        <button
          onClick={submit}
          style={{
            border: 'none', borderRadius: 8, cursor: 'pointer',
            padding: '6px 16px', fontSize: 12, fontWeight: 600,
            color: '#fff',
            background: 'linear-gradient(135deg,#4285f4,#9b59b6)',
          }}
        >
          ↵ {nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ problem, setProblem, loading, onSolve,
                   turns, currentTurn, solverAI, setSolverAI, reviewerAI, setReviewerAI }) {
  const started = turns.length > 0;
  const solverInfo   = aiInfo(solverAI);
  const reviewerInfo = aiInfo(reviewerAI);

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSolve(); }
  };

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: '#fff', borderRight: '1px solid #e8eaf0',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 18px 14px',
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        color: '#fff',
      }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <span style={{ fontSize: 22 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Шийдэгч</div>
            <div style={{ fontSize: 11, opacity: .6 }}>AI хоорондын ярилцлага</div>
          </div>
        </div>
        <div className="d-flex gap-1 flex-wrap">
          <span style={{
            background: solverInfo.color, color: '#fff',
            borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600,
          }}>
            {solverInfo.icon} {solverInfo.label} — бодогч
          </span>
          <span style={{
            background: reviewerInfo.color, color: '#fff',
            borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 600,
          }}>
            {reviewerInfo.icon} {reviewerInfo.label} — шүүгч
          </span>
        </div>
      </div>

      {/* AI сонгох */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #f0f0f5',
        background: started ? '#fafafa' : '#fff',
      }}>
        <div className="d-flex gap-2">
          <AIPicker label="Бодогч AI" value={solverAI} onChange={setSolverAI} disabled={started} />
          <AIPicker label="Шүүгч AI"  value={reviewerAI} onChange={setReviewerAI} disabled={started} />
        </div>
        {started && (
          <div style={{ fontSize: 10, color: '#bbb', marginTop: 6, textAlign: 'center' }}>
            Ярилцлага эхэлсэн — AI сонголт өөрчлөгдөхгүй
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '14px 14px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>
          📝 Бодлогын өгүүлбэр
        </label>
        <Form.Control
          as="textarea"
          value={problem}
          onChange={e => setProblem(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || started}
          placeholder={'Олимпиадын бодлогыг энд бич...\n\nЖишээ:\n$x^2 + y^2 = 25$ ба $x+y=7$ бол $xy$-ийг ол.'}
          style={{
            flex: 1, resize: 'none', fontFamily: 'monospace',
            fontSize: 13, lineHeight: 1.65,
            border: '1.5px solid #e0e4f0', borderRadius: 10,
            minHeight: 200,
            opacity: started ? .6 : 1,
          }}
        />

        <button
          onClick={onSolve}
          disabled={loading || !problem.trim() || started}
          style={{
            width: '100%', border: 'none', borderRadius: 10, marginTop: 10,
            padding: '10px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            color: '#fff',
            background: (loading || !problem.trim() || started)
              ? '#bbb'
              : 'linear-gradient(135deg,#4285f4,#9b59b6)',
          }}
        >
          {loading
            ? <><Spinner animation="border" size="sm" className="me-2" />Ачааллаж байна...</>
            : started ? '✓ Эхэлсэн' : '⚡ Шийдэх'}
        </button>

        {started && (
          <button
            onClick={onSolve}
            disabled={loading}
            style={{
              width: '100%', border: '1.5px solid #e0e4f0', borderRadius: 10,
              marginTop: 8, padding: '7px 0', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', background: '#fff', color: '#555',
            }}
          >
            🔄 Дахин эхлэх
          </button>
        )}

        <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 6, marginBottom: 0 }}>
          Ctrl+Enter дарж илгээх
        </p>
      </div>

      {/* Progress */}
      {turns.length > 0 && (
        <div style={{ borderTop: '1px solid #f0f0f5', padding: '10px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 7,
            textTransform: 'uppercase', letterSpacing: '.5px' }}>
            Дэвшил
          </div>
          {turns.map((t, i) => {
            const ai = aiInfo(t.role);
            return (
              <div key={i} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 11 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: t.role === 'user' ? '#e67e22' : ai.color,
                }} />
                <span style={{ color: '#444', flex: 1, fontStyle: t.role === 'user' ? 'italic' : 'normal' }}>
                  {t.label}
                </span>
                {t.accepted === true  && <span style={{ color: '#28a745', fontSize: 10 }}>✅</span>}
                {t.accepted === false && <span style={{ color: '#ffc107', fontSize: 10 }}>⚠</span>}
              </div>
            );
          })}
          {loading && (
            <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 11, opacity: .5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ddd' }} />
              <span>{currentTurn % 2 === 1
                ? `${aiInfo(solverAI).label} бодож байна...`
                : `${aiInfo(reviewerAI).label} шалгаж байна...`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Үндсэн хуудас ────────────────────────────────────────────────────────────
export default function SolverPage() {
  const [problem,      setProblem]     = useState('');
  const [turns,        setTurns]       = useState([]);
  const [loading,      setLoading]     = useState(false);
  const [currentTurn,  setCurrentTurn] = useState(0);
  const [waitEnter,    setWaitEnter]   = useState(false);
  const [done,         setDone]        = useState(false);
  const [error,        setError]       = useState('');
  const [solverAI,     setSolverAI]    = useState('gemini');
  const [reviewerAI,   setReviewerAI]  = useState('chatgpt');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
    }
  }, [turns, loading, waitEnter, done]);

  // ─── Turn fetch ────────────────────────────────────────────────────────────
  const fetchTurn = useCallback(async (turnNo, prevTurns, userComment = '') => {
    setLoading(true);
    setWaitEnter(false);
    setCurrentTurn(turnNo);
    setError('');

    let displayTurns = prevTurns;
    if (userComment && turnNo % 2 === 0) {
      const userTurn = { role: 'user', label: 'Та', content: userComment, accepted: null, isSolver: false };
      displayTurns = [...prevTurns, userTurn];
      setTurns(displayTurns);
    }

    try {
      const resp = await apiClient.post('/api/integral/solver/turn/', {
        problem:      problem.trim(),
        turn:         turnNo,
        history:      prevTurns.map(t => ({ role: t.role, content: t.content })),
        solver_ai:    solverAI,
        reviewer_ai:  reviewerAI,
        user_comment: userComment,
      });
      const newTurn = { ...resp.data, isSolver: turnNo % 2 === 1 };
      const next    = [...displayTurns, newTurn];
      setTurns(next);

      const isEnd = newTurn.accepted === true;
      const isMax = turnNo >= MAX_TURNS;

      if (isEnd || isMax) {
        setDone(true);
        setWaitEnter(false);
      } else {
        setWaitEnter(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message || 'Алдаа гарлаа',
      );
    } finally {
      setLoading(false);
    }
  }, [problem, solverAI, reviewerAI]);

  // ─── Шийдэх товч ──────────────────────────────────────────────────────────
  const handleSolve = useCallback(() => {
    if (!problem.trim() || loading) return;
    setTurns([]);
    setDone(false);
    setWaitEnter(false);
    setError('');
    fetchTurn(1, []);
  }, [problem, loading, fetchTurn]);

  // ─── Дараагийн turn ────────────────────────────────────────────────────────
  const handleContinue = useCallback((comment = '') => {
    if (!waitEnter || loading || done) return;
    const aiTurnsDone = turns.filter(t => t.role !== 'user').length;
    const nextTurn    = aiTurnsDone + 1;
    const aiHistory   = turns.filter(t => t.role !== 'user');
    fetchTurn(nextTurn, aiHistory, comment);
  }, [waitEnter, loading, done, turns, fetchTurn]);

  useEffect(() => {
    if (!waitEnter) return;
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleContinue('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [waitEnter, handleContinue]);

  // Next role: after solver→reviewer, after reviewer→solver
  const aiTurnsDone = turns.filter(t => t.role !== 'user').length;
  const nextIsReviewer = aiTurnsDone % 2 === 1;
  const nextRole = nextIsReviewer ? reviewerAI : solverAI;

  const solverInfo   = aiInfo(solverAI);
  const reviewerInfo = aiInfo(reviewerAI);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#f4f6fb' }}>

      <Sidebar
        problem={problem}
        setProblem={setProblem}
        loading={loading}
        onSolve={handleSolve}
        turns={turns}
        currentTurn={currentTurn}
        solverAI={solverAI}
        setSolverAI={setSolverAI}
        reviewerAI={reviewerAI}
        setReviewerAI={setReviewerAI}
      />

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header strip */}
        <div style={{
          padding: '11px 24px',
          background: '#fff', borderBottom: '1px solid #e8eaf0',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>💬</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#222' }}>Ярилцлага</div>
            <div style={{ fontSize: 11, color: '#888' }}>
              {turns.length === 0 && !loading
                ? 'Бодлогоо зүүн талд оруулж шийдэх товч дарна уу'
                : done
                  ? `✅ Дууслаа — ${turns.length} эргэлт`
                  : loading
                    ? `Turn ${currentTurn} ачааллаж байна...`
                    : `Turn ${turns.length} дууссан · Enter дарж үргэлжлүүлнэ`}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>

          {/* Empty state */}
          {!turns.length && !loading && !error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ fontSize: 58, marginBottom: 14 }}>🧮</div>
                <h5 style={{ fontWeight: 700, color: '#333' }}>Ярилцлага эхлээгүй</h5>
                <p style={{ color: '#888', marginBottom: 22 }}>
                  Зүүн талд AI сонгоод бодлогоо оруулаад <strong>Шийдэх</strong> товч дарна уу.
                  Turn бүрийн дараа{' '}
                  <kbd style={{ background:'#eee', padding:'2px 7px', borderRadius:5, fontSize:12 }}>Enter</kbd>{' '}
                  дарж үргэлжлүүлнэ.
                </p>
                <div className="d-flex justify-content-center gap-4">
                  {[
                    { ai: solverInfo,   sub: 'бодолт' },
                    { ai: reviewerInfo, sub: 'шалгалт' },
                    { ai: solverInfo,   sub: 'засвар' },
                    { ai: reviewerInfo, sub: 'зөвшөөрөл' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign:'center' }}>
                      <div style={{
                        width:40, height:40, borderRadius:'50%', background:s.ai.color, color:'#fff',
                        fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                        margin:'0 auto 5px', boxShadow:'0 2px 8px rgba(0,0,0,.15)',
                      }}>{s.ai.icon}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:s.ai.color }}>{s.ai.label}</div>
                      <div style={{ fontSize:10, color:'#aaa' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="danger" style={{ borderRadius: 12 }}>
              <strong>Алдаа:</strong> {error}
            </Alert>
          )}

          {/* Turns */}
          {turns.map((turn, i) => <TurnBubble key={i} turn={turn} />)}

          {/* Loading indicator */}
          {loading && (
            <TypingDots role={currentTurn % 2 === 1 ? solverAI : reviewerAI} />
          )}

          {/* Коммент + үргэлжлүүлэх */}
          {waitEnter && !loading && !done && (
            <CommentInput nextRole={nextRole} onContinue={handleContinue} />
          )}

          {/* Done message */}
          {done && !loading && (
            <div style={{
              textAlign:'center', padding:'14px 20px', marginBottom:8,
              background:'#f0fff8', border:'1px solid #a8e8d0',
              borderRadius:12, color:'#10a37f', fontSize:14, fontWeight:600,
            }}>
              🎉 {reviewerInfo.label} бодолтыг бүрэн зөвшөөрлөө! Нийт {turns.length} эргэлт.
            </div>
          )}

          <div ref={chatEndRef} style={{ height: 1 }} />
        </div>
      </div>

      <style>{`
        .solver-content p  { margin-bottom: 8px; }
        .solver-content ol,.solver-content ul { margin-bottom: 10px; }
        .solver-content li { margin-bottom: 3px; }
        .solver-content strong { font-weight: 700; }
        .solver-content em { font-style: italic; }
        .solver-content h4,.solver-content h5,.solver-content h6 { color:#222; }
      `}</style>
    </div>
  );
}
