// frontend/src/pages/AISolverPage.jsx
// Staff хэрэглэгчдэд зориулсан AI хамтарсан бодолтын хуудас
// /problem/:uuid/ai-solve

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig } from '../mathjax.config.js';
import apiClient from '../api/axiosConfig.js';
import Spinner from 'react-bootstrap/Spinner';
import LivePreview from '../components/LivePreview.jsx';
import AppHeader from '../components/AppHeader.jsx';

// ─── LaTeX хамгаалсан Markdown renderer ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  const saved = [];
  const save = (m) => { const k = `\x00L${saved.length}\x00`; saved.push(m); return k; };
  const restore = (h) => h.replace(/\x00L(\d+)\x00/g, (_, i) => saved[+i]);
  let t = text;
  t = t.replace(/\$\$[\s\S]*?\$\$/g, save);
  t = t.replace(/\\\[[\s\S]*?\\\]/g,  save);
  t = t.replace(/\$[^$\n]+?\$/g,      save);
  t = t.replace(/\\\([\s\S]*?\\\)/g,  save);
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

const AI_OPTIONS = [
  { value: 'gemini',  label: 'Gemini',  icon: '✦', color: '#4285f4', grad: 'linear-gradient(135deg,#4285f4,#9b59b6)' },
  { value: 'chatgpt', label: 'GPT-4o',  icon: '⬡', color: '#10a37f', grad: 'linear-gradient(135deg,#10a37f,#1a7f64)' },
];

const PRESETS = [
  { icon: '🔍', label: 'Бодлогыг бод',    needsHistory: false,
    prompt: 'Энэ бодлогыг алхам алхмаар дэлгэрэнгүй бод. Гол санаа, стратегиа тайлбарлаад бүрэн бодолт гарга.' },
  { icon: '💡', label: 'Санаа өг',         needsHistory: false,
    prompt: 'Энэ бодлогод ашиглаж болох гол арга, стратеги, санаануудыг санал болго. Бодолтыг шууд өгөхгүйгээр зөвхөн чиглэл, санааг хэлнэ үү.' },
  { icon: '✅', label: 'Бодолтыг шалга',   needsHistory: true,
    prompt: 'Өмнөх бодолтыг нарийвчлан шалгаарай. Алдаа, дутуу алхам, тодорхойгүй хэсэг байгаа эсэхийг тодорхойлж тайлбарла.' },
  { icon: '✏️', label: 'Эмх цэгцтэй бич', needsHistory: true,
    prompt: 'Бодолтыг эмх цэгцтэй, алхам алхмаар, тодорхой форматтайгаар дахин бич. Бүх математикийн тэмдэглэгээг LaTeX ашиглан бич.' },
  { icon: '🔧', label: 'Алдааг засна',     needsHistory: true,
    prompt: 'Өмнөх бодолтод алдаа байвал олоод зас. Зөв алхмуудыг хадгалаад алдаатай хэсгийг дахин бод.' },
  { icon: '📝', label: 'Товч дүгнэлт',    needsHistory: true,
    prompt: 'Бодолтыг товчлоод эцсийн хариулт болон гол алхмуудыг хэдхэн мөрөнд дүгнэж бич.' },
  { icon: '🔄', label: 'Өөр арга',        needsHistory: true,
    prompt: 'Өөр арга, өөр аргачлал ашиглан бодлогыг дахин бод.' },
];

function aiInfo(role) {
  return AI_OPTIONS.find(o => o.value === role) || { label: role, icon: '?', color: '#888', grad: '#888' };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ role }) {
  if (role === 'user') {
    return (
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, background: 'linear-gradient(135deg,#f39c12,#e67e22)',
        color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
      }}>👤</div>
    );
  }
  const ai = aiInfo(role);
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, background: ai.grad, color: '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,.18)',
    }}>{ai.icon}</div>
  );
}

// ─── Chat bubble — memo-р тогтворжуулна ──────────────────────────────────────
const Bubble = memo(function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const ai = isUser ? null : aiInfo(msg.role);
  return (
    <div className={`d-flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ alignItems: 'flex-start' }}>
      <Avatar role={msg.role} />
      <div style={{ maxWidth: '86%' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase',
          color: isUser ? '#e67e22' : ai.color,
          marginBottom: 4,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {isUser ? 'Та' : ai.label}
        </div>
        <div style={{
          padding: '10px 14px',
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser ? 'linear-gradient(135deg,#fff8f0,#fdefd8)' : '#f8f9fe',
          border: isUser ? '1px solid #f5c97a' : '1px solid #e0e4f4',
          fontSize: 13.5, lineHeight: 1.75,
        }}>
          {isUser
            ? <span>{msg.content}</span>
            : <MathJax>
                <div className="collab-md"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
              </MathJax>
          }
        </div>
      </div>
    </div>
  );
});

// ─── Typing indicator — memo-р тогтворжуулна ─────────────────────────────────
const Typing = memo(function Typing({ role }) {
  const ai = aiInfo(role);
  return (
    <div className="d-flex gap-2 mb-3" style={{ alignItems: 'flex-start' }}>
      <Avatar role={role} />
      <div style={{
        padding: '10px 16px', borderRadius: '4px 14px 14px 14px',
        background: '#f0f4ff', border: '1px solid #d0d8ff',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {[0, 150, 300].map(d => (
          <Spinner key={d} animation="grow" size="sm"
            style={{ color: ai.color, animationDelay: `${d}ms`, width: 7, height: 7 }} />
        ))}
        <span style={{ fontSize: 12, color: ai.color, fontStyle: 'italic', marginLeft: 4 }}>
          {ai.label} бодож байна...
        </span>
      </div>
    </div>
  );
});

// ─── Бодлогын зүүн панель — memo-р тогтворжуулна ─────────────────────────────
const ProblemPanel = memo(function ProblemPanel({ statement }) {
  return (
    <div style={{
      width: 300, flexShrink: 0,
      borderRight: '1px solid #e0e4f0',
      display: 'flex', flexDirection: 'column',
      background: '#fafbff',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #eef',
        fontSize: 11, fontWeight: 700, color: '#888',
        textTransform: 'uppercase', letterSpacing: '.5px',
        background: '#f0f4ff', flexShrink: 0,
      }}>
        📋 Бодлогын нөхцөл
      </div>
      <div style={{ padding: '16px', fontSize: 13.5, lineHeight: 1.75, flex: 1 }}>
        <LivePreview content={statement || ''} />
      </div>
    </div>
  );
});

// ─── Хадгалах хэсэг ───────────────────────────────────────────────────────────
function SavePanel({ messages, problemUuid, onClose, onSaved }) {
  const [text, setText] = useState(() =>
    messages
      .filter(m => m.role !== 'user')
      .map(m => `**${aiInfo(m.role).label}:**\n${m.content}`)
      .join('\n\n---\n\n')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/api/integral/solutions/', {
        problem:  problemUuid,
        solution: text.trim(),
        note:     'AI хамтарсан бодолт',
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(255,255,255,.97)',
      display: 'flex', flexDirection: 'column', padding: 28,
    }}>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
        📄 Бодолтыг хянаж хадгалах
      </div>
      <div style={{ fontSize: 12.5, color: '#888', marginBottom: 14 }}>
        AI-н хариуг засаж, бодлогын бодолт болгон хадгална.
      </div>
      {error && (
        <div style={{
          background: '#fff0f0', border: '1px solid #f5c6c6',
          borderRadius: 8, padding: '8px 12px', color: '#c00',
          fontSize: 13, marginBottom: 12,
        }}>
          {error}
        </div>
      )}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          flex: 1, border: '1.5px solid #dde', borderRadius: 10,
          padding: 16, fontSize: 13.5, lineHeight: 1.65,
          fontFamily: 'monospace', resize: 'none', outline: 'none',
          marginBottom: 16,
        }}
      />
      <div className="d-flex gap-2 justify-content-end">
        <button onClick={onClose} style={{
          border: '1.5px solid #dde', borderRadius: 8, background: '#fff',
          padding: '9px 22px', fontSize: 13, cursor: 'pointer', color: '#555',
        }}>
          Цуцлах
        </button>
        <button onClick={handleSave} disabled={saving || !text.trim()} style={{
          border: 'none', borderRadius: 8, padding: '9px 26px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#fff',
          background: saving ? '#aaa' : 'linear-gradient(135deg,#4285f4,#9b59b6)',
        }}>
          {saving
            ? <><Spinner animation="border" size="sm" className="me-2" />Хадгалж байна...</>
            : '💾 Бодолт болгон хадгалах'}
        </button>
      </div>
    </div>
  );
}

// ─── Үндсэн хуудас ────────────────────────────────────────────────────────────
export default function AISolverPage() {
  const { uuid } = useParams();
  const navigate  = useNavigate();

  const [problem,    setProblem]    = useState(null);
  const [fetching,   setFetching]   = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [selectedAI, setSelectedAI] = useState('gemini');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showSave,   setShowSave]   = useState(false);

  const chatEndRef  = useRef(null);
  const inputRef    = useRef(null);
  const inputValRef = useRef('');   // input-н тухайн үеийн утга

  // ─── Бодлого татах ───────────────────────────────────────────────────────
  useEffect(() => {
    apiClient.get(`/api/integral/problems/${uuid}/`)
      .then(r => setProblem(r.data))
      .catch(() => setFetchError('Бодлого олдсонгүй.'))
      .finally(() => setFetching(false));
  }, [uuid]);

  // ─── Auto scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // input өөрчлөгдөх бүрт ref шинэчлэх
  useEffect(() => { inputValRef.current = input; }, [input]);

  // ─── Мэдээж илгээх ───────────────────────────────────────────────────────
  // inputValRef ашигладаг тул input dep шаардлагагүй → keystroke бүрт recreation болохгүй
  // messages-г setMessages updater дотор capture хийдэг тул messages dep шаардлагагүй
  const sendMessage = useCallback(async () => {
    const text = inputValRef.current.trim();
    if (!text || loading || !problem) return;

    const userMsg = { role: 'user', content: text };
    let prevMsgs  = [];
    setMessages(prev => { prevMsgs = prev; return [...prev, userMsg]; });
    setInput('');
    inputValRef.current = '';
    setLoading(true);
    setError('');

    try {
      const resp = await apiClient.post('/api/integral/solver/collab/', {
        problem_id:   problem.uuid,
        messages:     prevMsgs,
        selected_ai:  selectedAI,
        user_message: text,
      });
      setMessages(prev => [...prev, resp.data]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, selectedAI, problem]);

  const onInputKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const handleSaved = useCallback(() => {
    navigate(`/problem/${uuid}`);
  }, [navigate, uuid]);

  const aiMsgCount = messages.filter(m => m.role !== 'user').length;

  // ─── Loading / error ──────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }
  if (fetchError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
        <div style={{ color: '#c00', fontSize: 15 }}>{fetchError}</div>
        <button onClick={() => navigate(-1)} style={{ border: '1.5px solid #dde', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', background: '#fff' }}>
          ← Буцах
        </button>
      </div>
    );
  }

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f4f6fb', position: 'relative' }}>

        {/* Save overlay */}
        {showSave && (
          <SavePanel
            messages={messages}
            problemUuid={problem.uuid}
            onClose={() => setShowSave(false)}
            onSaved={handleSaved}
          />
        )}

        <AppHeader />

        {/* Sub-header: бодлогын гарчиг + хадгалах */}
        <div style={{
          padding: '0 20px', height: 44,
          background: '#fff', borderBottom: '1px solid #e0e4f0',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => navigate(`/problem/${uuid}`)}
            style={{
              background: '#f0f4ff', border: '1px solid #d0d8ff', color: '#4a6cf7',
              borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            ← Буцах
          </button>
          <span style={{ fontSize: 16 }}>🤝</span>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#333',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <MathJax inline dynamic>{problem.title}</MathJax>
          </div>
          {aiMsgCount > 0 && (
            <button
              onClick={() => setShowSave(true)}
              style={{
                border: 'none', borderRadius: 8, padding: '5px 16px',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg,#27ae60,#219a52)', color: '#fff',
              }}
            >
              💾 Хадгалах
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: бодлого — ProblemPanel memo-р тогтворжуулсан */}
          <ProblemPanel statement={problem.statement} />

          {/* Right: chat */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 8px' }}>

              {messages.length === 0 && !loading && (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ maxWidth: 360 }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>🧮</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#333', marginBottom: 10 }}>
                      Хамтарч бодоцгооё
                    </div>
                    <div style={{ color: '#888', fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>
                      Доод талд AI сонгоод асуулт, санаа, хэцүү алхмыг асуугаарай.
                      Бодолт гарсны дараа <strong>Хадгалах</strong> товчоор бодлогод нэмнэ.
                    </div>
                    <div className="d-flex justify-content-center gap-3">
                      {AI_OPTIONS.map(ai => (
                        <div key={ai.value} style={{
                          background: `${ai.color}14`, border: `1.5px solid ${ai.color}40`,
                          borderRadius: 10, padding: '8px 18px', fontSize: 13,
                          color: ai.color, fontWeight: 600,
                        }}>
                          {ai.icon} {ai.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
              {loading && <Typing role={selectedAI} />}

              {error && (
                <div style={{
                  background: '#fff0f0', border: '1px solid #f5c6c6',
                  borderRadius: 10, padding: '10px 14px',
                  color: '#c00', fontSize: 13, marginBottom: 12,
                }}>
                  ⚠ {error}
                </div>
              )}

              <div ref={chatEndRef} style={{ height: 4 }} />
            </div>

            {/* Input area */}
            <div style={{
              borderTop: '1px solid #e0e4f0',
              padding: '10px 20px 14px',
              background: '#fff', flexShrink: 0,
            }}>
              {/* Preset промт товчнууд */}
              <div style={{
                display: 'flex', gap: 6, marginBottom: 10,
                overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none',
              }}>
                {PRESETS.map((p) => {
                  const disabled = loading || (p.needsHistory && messages.length === 0);
                  return (
                    <button
                      key={p.label}
                      title={p.prompt}
                      disabled={disabled}
                      onClick={() => { setInput(p.prompt); setTimeout(() => inputRef.current?.focus(), 30); }}
                      style={{
                        flexShrink: 0,
                        border: '1.5px solid #e0e6ff', borderRadius: 20,
                        padding: '4px 13px', fontSize: 12, fontWeight: 500,
                        cursor: disabled ? 'default' : 'pointer',
                        background: disabled ? '#f5f5f8' : '#f0f4ff',
                        color: disabled ? '#bbb' : '#4a6cf7',
                        transition: 'all .12s', whiteSpace: 'nowrap',
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>

              {/* AI selector */}
              <div className="d-flex gap-2 mb-2" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#aaa', marginRight: 2 }}>AI:</span>
                {AI_OPTIONS.map(ai => {
                  const active = selectedAI === ai.value;
                  return (
                    <button
                      key={ai.value}
                      onClick={() => setSelectedAI(ai.value)}
                      style={{
                        border: active ? `2px solid ${ai.color}` : '1.5px solid #e0e4f0',
                        borderRadius: 20, padding: '3px 16px',
                        background: active ? `${ai.color}18` : '#fff',
                        color: active ? ai.color : '#888',
                        fontWeight: active ? 700 : 400,
                        fontSize: 12, cursor: 'pointer', transition: 'all .12s',
                      }}
                    >
                      {ai.icon} {ai.label}
                    </button>
                  );
                })}
              </div>

              {/* Textarea + send */}
              <div className="d-flex gap-2" style={{ alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="Асуулт, санаа, эсвэл бодолтын алхам бичнэ үү... (Enter — илгээх, Shift+Enter — мөр дараах)"
                  rows={2}
                  disabled={loading}
                  style={{
                    flex: 1, border: '1.5px solid #dde', borderRadius: 10,
                    padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                    fontFamily: 'inherit', resize: 'none', outline: 'none',
                    background: loading ? '#fafafa' : '#fff',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    border: 'none', borderRadius: 10, padding: '0 20px',
                    height: 54, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    color: '#fff', flexShrink: 0,
                    background: (loading || !input.trim()) ? '#ccc' : aiInfo(selectedAI).grad,
                  }}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '↵ Илгээх'}
                </button>
              </div>
            </div>

          </div>
        </div>

        <style>{`
          .collab-md p  { margin-bottom: 8px; }
          .collab-md ol,.collab-md ul { margin-bottom: 10px; padding-left: 20px; }
          .collab-md li { margin-bottom: 3px; }
          .collab-md strong { font-weight: 700; }
          .collab-md em { font-style: italic; }
          .collab-md h4,.collab-md h5,.collab-md h6 { color:#222; margin-top:12px; }
        `}</style>
      </div>
    </MathJaxContext>
  );
}
