// frontend/src/pages/SolverPage.jsx
// AI чат — бодлого бодох хуудас

import { useState, useRef, useEffect, useCallback } from 'react';
import { MathJax } from 'better-react-mathjax';
import authService from '../services/authService.js';
import Spinner from 'react-bootstrap/Spinner';

// ─── Copy товч helper ───────────────────────────────────────────────────────
function CopyBtn({ text, size = 16, style = {} }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* fallback */ }
  };
  return (
    <button
      onClick={copy}
      title="Хуулах"
      style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        padding: 2, color: copied ? '#16a34a' : '#aaa',
        transition: 'color .2s', fontSize: size, lineHeight: 1,
        ...style,
      }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// ─── Моделүүд ────────────────────────────────────────────────────────────────
const MODELS = [
  { value: 'deepseek-chat',     label: 'DeepSeek Chat',     color: '#4d6bfe' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner', color: '#4d6bfe' },
  { value: 'gemini-2.5-flash',  label: 'Gemini 2.5 Flash',  color: '#4285f4' },
  { value: 'gemini-2.5-pro',    label: 'Gemini 2.5 Pro',    color: '#4285f4' },
  { value: 'gpt-4o',            label: 'GPT-4o',            color: '#10a37f' },
];

function modelInfo(id) {
  return MODELS.find(m => m.value === id) || { label: id, color: '#888' };
}

// ─── Preset товчууд ──────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Бод',       prompt: 'Энэ бодлогыг алхам алхмаар дэлгэрэнгүй бод. Гол санаа, стратегиа тайлбарлаад бүрэн бодолт гарга. Эцэст "Хариу: ..." гэж бич.' },
  { label: 'Санаа өг',  prompt: 'Энэ бодлогод ашиглаж болох гол арга, стратегийг санал болго. Бодолтыг шууд өгөхгүйгээр зөвхөн чиглэл, санааг хэлнэ үү.' },
  { label: 'Шалга',     prompt: 'Өмнөх бодолтыг нарийвчлан шалгаж, алдаа, дутуу алхам, тодорхойгүй хэсэг байгаа эсэхийг тодорхойл.' },
  { label: 'Өөр арга',  prompt: 'Өөр арга, өөр аргачлал ашиглан бодлогыг дахин бод.' },
  { label: 'LaTeX бодолт', latex: true, prompt: 'Бодолтыг бүтэн LaTeX документ хэлбэрээр бич. Дараах толгойг яг ингэж эхлүүл:\n\\documentclass[12pt]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage[mongolian]{babel}\n\\usepackage{amsmath,amssymb}\n\\usepackage[margin=2cm]{geometry}\n\\setlength{\\parindent}{0pt}\n\\setlength{\\parskip}{\\bigskipamount}\n\\begin{document}\n...\n\\end{document}\n\n\\section{}, \\begin{align*}, \\textbf{} зэрэг LaTeX бүтэц чөлөөтэй ашигла. Зөвхөн LaTeX код буцаа — тайлбар, markdown хэрэглэхгүй.' },
];

// ─── LaTeX хамгаалсан Markdown renderer ──────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  const saved = [];
  const save = (m) => { const k = `\x00L${saved.length}\x00`; saved.push(m); return k; };
  // eslint-disable-next-line no-control-regex
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

// ─── Чат bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  const isLatex = !isUser && msg.latex;
  const mi = msg.model ? modelInfo(msg.model) : null;

  return (
    <div className={`d-flex gap-2 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#fff',
        background: isUser
          ? 'linear-gradient(135deg,#f39c12,#e67e22)'
          : `linear-gradient(135deg,${mi?.color || '#888'},${mi?.color || '#888'}cc)`,
      }}>
        {isUser ? '👤' : '🤖'}
      </div>

      <div style={{ maxWidth: isLatex ? '100%' : '85%', minWidth: 0, flex: isLatex ? 1 : undefined }}>
        {/* Label */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.5px',
          textTransform: 'uppercase', marginBottom: 3,
          color: isUser ? '#e67e22' : (mi?.color || '#888'),
          textAlign: isUser ? 'right' : 'left',
        }}>
          {isUser ? 'Та' : mi?.label || 'AI'}
          {isLatex && <span style={{ marginLeft: 6, color: '#888', fontWeight: 400, textTransform: 'none' }}>LaTeX код</span>}
        </div>

        {/* Bubble — LaTeX бол textarea, бусад нь ердийн bubble */}
        {isLatex ? (
          <div style={{
            background: '#1e1e2e', borderRadius: 10,
            border: '1px solid #383850', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px', background: '#2a2a40', borderBottom: '1px solid #383850',
            }}>
              <span style={{ fontSize: 11, color: '#8888aa', fontFamily: 'monospace' }}>LaTeX</span>
              <CopyBtn text={msg.content} size={13} style={{ color: '#8888aa' }} />
            </div>
            <textarea
              readOnly
              value={msg.content}
              style={{
                width: '100%', minHeight: 300,
                resize: 'vertical', border: 'none', outline: 'none',
                padding: '12px 14px', fontSize: 13, lineHeight: 1.6,
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                background: '#1e1e2e', color: '#cdd6f4',
                whiteSpace: 'pre', overflowX: 'auto',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ) : (
          <div style={{
            padding: isUser ? '10px 14px' : '12px 16px',
            borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
            fontSize: 14, lineHeight: 1.75,
            ...(isUser
              ? { background: '#f8f4ee', border: '1px solid #ecdcc0', fontStyle: 'italic' }
              : { background: '#f7f8fc', border: '1px solid #e2e5f0', boxShadow: '0 1px 6px rgba(0,0,0,.04)' }),
          }}>
            {isUser
              ? <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              : <MathJax>
                  <div className="solver-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                </MathJax>
            }
          </div>
        )}
        {/* AI хариулт дээр copy товч (LaTeX биш үед) */}
        {!isUser && !isLatex && msg.content && (
          <CopyBtn text={msg.content} size={13}
            style={{ alignSelf: 'flex-start', marginTop: 2 }} />
        )}
      </div>
    </div>
  );
}

// ─── Loading indicator ───────────────────────────────────────────────────────
function TypingDots({ model, onStop }) {
  const mi = modelInfo(model);
  return (
    <div className="d-flex gap-2 mb-4" style={{ alignItems: 'flex-start' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#fff',
        background: `linear-gradient(135deg,${mi.color},${mi.color}cc)`,
      }}>🤖</div>
      <div style={{
        background: '#f7f8fc', border: '1px solid #e2e5f0',
        borderRadius: '4px 14px 14px 14px',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {[0, 160, 320].map(d => (
          <Spinner key={d} animation="grow" size="sm"
            style={{ color: mi.color, animationDelay: `${d}ms` }} />
        ))}
        <span style={{ fontSize: 12, color: mi.color, fontStyle: 'italic', marginLeft: 4 }}>
          {mi.label}...
        </span>
        <button onClick={onStop} style={{
          marginLeft: 8, border: '1.5px solid #e0e4f0', borderRadius: 6,
          background: '#fff', color: '#888', cursor: 'pointer',
          padding: '3px 10px', fontSize: 11, fontWeight: 600,
        }}>
          ■ Зогсоох
        </button>
      </div>
    </div>
  );
}

// ─── Үндсэн хуудас ──────────────────────────────────────────────────────────
export default function SolverPage() {
  const [problem,     setProblem]     = useState('');
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [model,       setModel]       = useState('gemini-2.5-flash');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showProblem, setShowProblem] = useState(true);
  const chatEndRef = useRef(null);
  const abortRef   = useRef(null);
  const inputRef   = useRef(null);

  // auto scroll
  useEffect(() => {
    if (chatEndRef.current)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80);
  }, [messages, loading]);

  // ─── Мессеж илгээх (streaming) ──────────────────────────────────────────────
  const send = useCallback(async (text, opts = {}) => {
    const msg = (text || '').trim();
    if (!msg || !problem.trim() || loading) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const isLatex = !!opts.latex;
    const userMsg = { role: 'user', content: msg };
    const prev = [...messages, userMsg];
    const assistantMsg = { role: 'assistant', model, content: '', ...(isLatex && { latex: true }) };
    setMessages([...prev, assistantMsg]);
    setInput('');
    setLoading(true);
    setError('');

    if (showProblem && messages.length === 0) setShowProblem(false);

    try {
      const token = authService.getToken();
      const resp = await fetch(`${API_BASE}/api/integral/solver/stream/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          problem:      problem.trim(),
          messages:     messages.map(m => ({ role: m.role, content: m.content })),
          model,
          user_message: msg,
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events parse
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6);
            try {
              const ev = JSON.parse(raw);
              if (ev.error) { setError(ev.error); break; }
              if (ev.t) content += ev.t;
              if (ev.done) break;
            } catch { /* skip */ }
          }
        }
        // Chunk бүрд message шинэчлэх
        setMessages(ms => {
          const updated = [...ms];
          const last = ms[ms.length - 1];
          updated[updated.length - 1] = { ...last, content };
          return updated;
        });
      }

      // Эцсийн шинэчлэл
      setMessages(ms => {
        const updated = [...ms];
        const last = ms[ms.length - 1];
        updated[updated.length - 1] = { ...last, content };
        return updated;
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Алдаа гарлаа');
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }, [problem, messages, model, loading, showProblem]);

  // ─── Зогсоох ──────────────────────────────────────────────────────────────
  const handleAbort = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
  }, []);

  // ─── Keyboard ──────────────────────────────────────────────────────────────
  const onInputKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const started = messages.length > 0;
  const mi = modelInfo(model);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: '#f4f6fb' }}>

      {/* ── Дээд хэсэг: Model + Problem ─────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', flexShrink: 0 }}>

        {/* Model dropdown + header */}
        <div style={{
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#222' }}>AI Бодогч</span>
          {messages.length > 0 && (
            <CopyBtn
              text={messages.map(m =>
                `${m.role === 'user' ? 'Та' : (modelInfo(m.model).label || 'AI')}:\n${m.content}`
              ).join('\n\n---\n\n')}
              size={14}
              style={{ color: '#999' }}
            />
          )}
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            style={{
              marginLeft: 'auto',
              border: `1.5px solid ${mi.color}50`,
              borderRadius: 8, padding: '5px 12px',
              fontSize: 13, fontWeight: 600, color: mi.color,
              background: `${mi.color}08`, cursor: 'pointer',
              outline: 'none',
            }}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Problem textarea */}
        {showProblem ? (
          <div style={{ padding: '0 20px 12px' }}>
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              disabled={loading}
              placeholder="Бодлогын өгүүлбэрийг энд бичнэ үү..."
              rows={4}
              style={{
                width: '100%', resize: 'vertical',
                border: '1.5px solid #e0e4f0', borderRadius: 10,
                padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                fontFamily: 'monospace', outline: 'none',
              }}
            />
          </div>
        ) : (
          <div
            onClick={() => setShowProblem(true)}
            style={{
              padding: '0 20px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: '#888' }}>📝</span>
            <span style={{
              fontSize: 12, color: '#888',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 500,
            }}>
              {problem.slice(0, 80)}{problem.length > 80 ? '...' : ''}
            </span>
            <span style={{ fontSize: 10, color: '#bbb', marginLeft: 4 }}>▼ засах</span>
          </div>
        )}
      </div>

      {/* ── Чат хэсэг ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Empty state */}
        {!started && !loading && !error && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 300,
          }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🧮</div>
              <h5 style={{ fontWeight: 700, color: '#333', marginBottom: 8 }}>AI Бодогч</h5>
              <p style={{ color: '#888', fontSize: 14, marginBottom: 0 }}>
                Бодлогоо дээр оруулаад доорх товчуудаар эсвэл өөрийн зааврыг бичиж илгээнэ үү.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 16px', marginBottom: 16,
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 10, color: '#dc2626', fontSize: 13,
          }}>
            <strong>Алдаа:</strong> {error}
          </div>
        )}

        {/* Messages */}
        {messages.map((m, i) => <ChatBubble key={i} msg={m} />)}

        {/* Loading */}
        {loading && <TypingDots model={model} onStop={handleAbort} />}

        <div ref={chatEndRef} style={{ height: 1 }} />
      </div>

      {/* ── Доод хэсэг: Presets + Input ─────────────────────────────────── */}
      <div style={{
        background: '#fff', borderTop: '1px solid #e8eaf0',
        padding: '10px 20px 14px', flexShrink: 0,
      }}>
        {/* Presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p.prompt, { latex: !!p.latex })}
              disabled={loading || !problem.trim()}
              style={{
                border: '1.5px solid #e0e4f0', borderRadius: 8,
                padding: '4px 12px', fontSize: 12, fontWeight: 500,
                background: '#fff', color: '#555', cursor: 'pointer',
                opacity: (loading || !problem.trim()) ? .5 : 1,
                transition: 'all .15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onInputKey}
            disabled={loading || !problem.trim()}
            placeholder={problem.trim() ? 'Заавар бичнэ үү... (Enter илгээх)' : 'Эхлээд бодлогын өгүүлбэр оруулна уу'}
            rows={1}
            style={{
              flex: 1, resize: 'none',
              border: '1.5px solid #e0e4f0', borderRadius: 10,
              padding: '9px 14px', fontSize: 13, lineHeight: 1.5,
              fontFamily: 'inherit', outline: 'none',
              minHeight: 38, maxHeight: 120,
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim() || !problem.trim()}
            style={{
              border: 'none', borderRadius: 10,
              padding: '9px 20px', fontSize: 13, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              background: (loading || !input.trim() || !problem.trim())
                ? '#ccc'
                : `linear-gradient(135deg,${mi.color},${mi.color}cc)`,
              flexShrink: 0, height: 38,
            }}
          >
            ↵
          </button>
        </div>

        <div style={{ fontSize: 10, color: '#bbb', marginTop: 5, textAlign: 'center' }}>
          Enter — илгээх · Shift+Enter — мөр дараах · Модел хүсэлт бүрийн өмнө солих боломжтой
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
