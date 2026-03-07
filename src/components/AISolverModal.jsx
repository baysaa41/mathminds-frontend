// frontend/src/components/AISolverModal.jsx
// Staff хэрэглэгчдэд бодлогын хуудсанд AI-тай хамтарч бодолт гаргах modal

import { useState, useRef, useEffect, useCallback } from 'react';
import { MathJax } from 'better-react-mathjax';
import apiClient from '../api/axiosConfig.js';
import Spinner from 'react-bootstrap/Spinner';
import LivePreview from './LivePreview.jsx';

// ─── LaTeX-хамгаалсан markdown renderer ──────────────────────────────────────
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

// hasHistory=true үед харагдах промтууд тэмдэглэнэ
const PRESETS = [
  { icon: '🔍', label: 'Бодлогыг бод',      needsHistory: false,
    prompt: 'Энэ бодлогыг алхам алхмаар дэлгэрэнгүй бод. Гол санаа, стратегиа тайлбарлаад бүрэн бодолт гарга.' },
  { icon: '💡', label: 'Санаа өг',           needsHistory: false,
    prompt: 'Энэ бодлогод ашиглаж болох гол арга, стратеги, санаануудыг санал болго. Бодолтыг шууд өгөхгүйгээр зөвхөн чиглэл, санааг хэлнэ үү.' },
  { icon: '✅', label: 'Бодолтыг шалга',     needsHistory: true,
    prompt: 'Өмнөх бодолтыг нарийвчлан шалгаарай. Алдаа, дутуу алхам, тодорхойгүй хэсэг байгаа эсэхийг тодорхойлж тайлбарла.' },
  { icon: '✏️', label: 'Эмх цэгцтэй бич',   needsHistory: true,
    prompt: 'Бодолтыг эмх цэгцтэй, алхам алхмаар, тодорхой форматтайгаар дахин бич. Бүх математикийн тэмдэглэгээг LaTeX ашиглан бич.' },
  { icon: '🔧', label: 'Алдааг засна',       needsHistory: true,
    prompt: 'Өмнөх бодолтод алдаа байвал олоод зас. Зөв алхмуудыг хадгалаад алдаатай хэсгийг дахин бод.' },
  { icon: '📝', label: 'Товч дүгнэлт',      needsHistory: true,
    prompt: 'Бодолтыг товчлоод эцсийн хариулт болон гол алхмуудыг хэдхэн мөрөнд дүгнэж бич.' },
  { icon: '🔄', label: 'Өөр арга хэрэглэ', needsHistory: true,
    prompt: 'Өөр арга, өөр аргачлал ашиглан бодлогыг дахин бод.' },
];

function aiInfo(role) {
  return AI_OPTIONS.find(o => o.value === role) || { label: role, icon: '?', color: '#888', grad: '#888' };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ role, size = 32 }) {
  if (role === 'user') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, background: 'linear-gradient(135deg,#f39c12,#e67e22)',
        color: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.18)',
      }}>👤</div>
    );
  }
  const ai = aiInfo(role);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, background: ai.grad, color: '#fff',
      boxShadow: '0 2px 6px rgba(0,0,0,.18)',
    }}>{ai.icon}</div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg }) {
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
          background: isUser
            ? 'linear-gradient(135deg,#fff8f0,#fdefd8)'
            : '#f8f9fe',
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
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function Typing({ role }) {
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
}

// ─── Хадгалах хэсэг ───────────────────────────────────────────────────────────
function SavePanel({ messages, problemUuid, onClose, onSaved }) {
  const [text, setText] = useState(() => {
    // AI-н бүх хариуг нэгтгэж эхний утгаар тавина
    return messages
      .filter(m => m.role !== 'user')
      .map(m => {
        const name = m.role === 'gemini' ? 'Gemini' : 'ChatGPT';
        return `**${name}:**\n${m.content}`;
      })
      .join('\n\n---\n\n');
  });
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
      display: 'flex', flexDirection: 'column', padding: 24,
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
        📄 Бодолтыг хянаж хадгалах
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
        AI-н хариуг засаж, бодлогын бодолт болгон хадгална. LivePreview-аар харагдана.
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6',
          borderRadius: 8, padding: '8px 12px', color: '#c00', fontSize: 13, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        style={{
          flex: 1, border: '1.5px solid #dde', borderRadius: 10,
          padding: 14, fontSize: 13, lineHeight: 1.65,
          fontFamily: 'monospace', resize: 'none', outline: 'none',
          marginBottom: 14,
        }}
      />

      <div className="d-flex gap-2 justify-content-end">
        <button onClick={onClose}
          style={{
            border: '1.5px solid #dde', borderRadius: 8, background: '#fff',
            padding: '8px 20px', fontSize: 13, cursor: 'pointer', color: '#555',
          }}>
          Цуцлах
        </button>
        <button onClick={handleSave} disabled={saving || !text.trim()}
          style={{
            border: 'none', borderRadius: 8, padding: '8px 24px',
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

// ─── Үндсэн modal ─────────────────────────────────────────────────────────────
export default function AISolverModal({ problem, onClose, onSaved }) {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [selectedAI,  setSelectedAI]  = useState('gemini');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showSave,    setShowSave]    = useState(false);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  // Esc дарахад хаах
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !showSave) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, showSave]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg   = { role: 'user', content: text };
    const prevMsgs  = messages;
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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
  }, [input, loading, messages, selectedAI, problem.uuid]);

  const onInputKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaved = () => {
    setShowSave(false);
    onSaved?.();
    onClose();
  };

  const aiMsgCount = messages.filter(m => m.role !== 'user').length;

  return (
    // Overlay
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1050,
      background: 'rgba(10,10,20,.55)',
      display: 'flex', alignItems: 'stretch',
      backdropFilter: 'blur(3px)',
    }}>
      {/* Container */}
      <div style={{
        margin: 'auto',
        width: 'min(1100px, 96vw)',
        height: 'min(720px, 92vh)',
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,.30)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Save overlay */}
        {showSave && (
          <SavePanel
            messages={messages}
            problemUuid={problem.uuid}
            onClose={() => setShowSave(false)}
            onSaved={handleSaved}
          />
        )}

        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
          color: '#fff',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 22 }}>🤝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>AI Хамтарсан Бодолт</div>
            <div style={{ fontSize: 11, opacity: .6 }}>
              <MathJax inline dynamic>{problem.title}</MathJax>
            </div>
          </div>
          {aiMsgCount > 0 && (
            <button
              onClick={() => setShowSave(true)}
              style={{
                border: 'none', borderRadius: 8, padding: '7px 18px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(135deg,#27ae60,#219a52)', color: '#fff',
              }}
            >
              💾 Хадгалах
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,.12)', border: 'none',
              color: '#fff', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 16, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: бодлого */}
          <div style={{
            width: 280, flexShrink: 0,
            borderRight: '1px solid #eef',
            display: 'flex', flexDirection: 'column',
            background: '#fafbff',
            overflowY: 'auto',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid #eef',
              fontSize: 11, fontWeight: 700, color: '#888',
              textTransform: 'uppercase', letterSpacing: '.5px',
              background: '#f0f4ff',
            }}>
              📋 Бодлогын нөхцөл
            </div>
            <div style={{ padding: '14px', fontSize: 13, lineHeight: 1.7, flex: 1 }}>
              <LivePreview content={problem.statement || ''} />
            </div>
          </div>

          {/* Right: chat */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>

              {/* Empty */}
              {messages.length === 0 && !loading && (
                <div style={{
                  height: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', textAlign: 'center',
                }}>
                  <div style={{ maxWidth: 340 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🧮</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#333', marginBottom: 8 }}>
                      Хамтарч бодоцгооё
                    </div>
                    <div style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                      Доод талд AI сонгоод асуулт, санаа, хэцүү алхам зэргийг асуугаарай.
                      Бодолт гарсны дараа <strong>Хадгалах</strong> товчоор бодлогод нэмнэ.
                    </div>
                    <div className="d-flex justify-content-center gap-3 mt-3">
                      {AI_OPTIONS.map(ai => (
                        <div key={ai.value} style={{
                          background: `${ai.color}15`, border: `1.5px solid ${ai.color}40`,
                          borderRadius: 10, padding: '8px 16px', fontSize: 12,
                          color: ai.color, fontWeight: 600,
                        }}>
                          {ai.icon} {ai.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bubbles */}
              {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

              {/* Typing */}
              {loading && <Typing role={selectedAI} />}

              {/* Error */}
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
              borderTop: '1px solid #eef',
              padding: '10px 16px 12px',
              background: '#fff',
              flexShrink: 0,
            }}>
              {/* Preset промт товчнууд */}
              <div style={{
                display: 'flex', gap: 6, marginBottom: 8,
                overflowX: 'auto', paddingBottom: 2,
                scrollbarWidth: 'none',
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
                        border: '1.5px solid #e0e6ff',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 11.5,
                        fontWeight: 500,
                        cursor: disabled ? 'default' : 'pointer',
                        background: disabled ? '#f5f5f8' : '#f0f4ff',
                        color: disabled ? '#bbb' : '#4a6cf7',
                        transition: 'all .12s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>

              {/* AI selector */}
              <div className="d-flex gap-2 mb-2">
                <span style={{ fontSize: 11, color: '#aaa', lineHeight: '28px', marginRight: 4 }}>
                  AI:
                </span>
                {AI_OPTIONS.map(ai => {
                  const active = selectedAI === ai.value;
                  return (
                    <button
                      key={ai.value}
                      onClick={() => setSelectedAI(ai.value)}
                      style={{
                        border: active ? `2px solid ${ai.color}` : '1.5px solid #e0e4f0',
                        borderRadius: 20, padding: '3px 14px',
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
                  placeholder="Асуулт, санаа, эсвэл бодолтын алхам бичнэ үү... (Enter — илгээх)"
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
                    border: 'none', borderRadius: 10, padding: '0 18px',
                    height: 52, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    color: '#fff', flexShrink: 0,
                    background: (loading || !input.trim())
                      ? '#ccc'
                      : aiInfo(selectedAI).grad,
                  }}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : '↵ Илгээх'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
                Shift+Enter — мөр дараах · Esc — хаах
              </div>
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
  );
}
