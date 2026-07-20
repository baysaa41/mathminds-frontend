// frontend/src/components/ObjectiveLessonPanel.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Form from 'react-bootstrap/Form';
import { Send, MessageCircle, ArrowRight, ThumbsUp, ThumbsDown, Pencil, Check, X, Bot } from 'lucide-react';
import LivePreview from './LivePreview';
import { useAuth } from '../context/AuthContext';
import {
  startObjectiveLesson, sendObjectiveFeedback, getObjective, updateObjective,
} from '../services/clubsService';
import { getConversationMessages, sendMessage } from '../services/conversationService';
import useChatSocket from '../hooks/useChatSocket';

const GEN_POLL_MS = 3000;
const GEN_TIMEOUT_MS = 180000;
const REPLY_TIMEOUT_MS = 60000;
const TYPE_CHARS_PER_TICK = 2;
const TYPE_TICK_MS = 18;

const CONTROL_RATING_LABELS = {
  good: 'Сайн',
  needs_fix: 'Засвар хэрэгтэй',
  bad: 'Буруу',
};

const toBubble = (m, userId) => ({
  uuid: m.uuid,
  id: m.id,
  content: m.content || '',
  isAi: m.author?.id !== userId,
});

const LessonBubble = ({ content, isAi, typewriting, onDone }) => {
  const [len, setLen] = useState(typewriting ? 0 : content.length);
  const ref = useRef(null);

  useEffect(() => {
    if (!typewriting) {
      setLen(content.length);
      return;
    }
    setLen(0);
    let i = 0;
    let timer;
    const tick = () => {
      i = Math.min(i + TYPE_CHARS_PER_TICK, content.length);
      setLen(i);
      if (i < content.length) {
        timer = setTimeout(tick, TYPE_TICK_MS);
      } else {
        onDone?.();
      }
    };
    timer = setTimeout(tick, TYPE_TICK_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typewriting, content]);

  useEffect(() => {
    if (len < content.length) return;
    if (ref.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch(() => {});
    }
  }, [len, content]);

  const done = len >= content.length;

  return (
    <div className={`d-flex mb-3 ${isAi ? 'justify-content-start' : 'justify-content-end'}`}>
      <div
        className={`p-2 px-3 rounded-3 ${isAi ? 'bg-light' : 'bg-primary text-white'}`}
        style={{ maxWidth: '88%' }}
        ref={ref}
      >
        {done ? (
          <LivePreview content={content} />
        ) : (
          <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content.slice(0, len)}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Нэг суралцахуйн зорилтыг ТУСДАА чатаар (тусдаа minds.Conversation) судлах панель.
 * Зорилт бүрийн тайлбар AI-аар нэг л удаа үүсгэгдэж кэшлэгдсэн (objective.explanation_*),
 * дараагийн бүх сурагчид дахин AI дуудахгүйгээр дахин ашиглагдана — зөвхөн тухайн
 * сурагчийн харилцан яриа руу хуулагдана. Тайлбар дэлгэгдсэний дараа сурагч 1) энэ
 * зорилтын талаар асуулт асуух, эсвэл 2) "Дараагийн зорилт руу" шилжих аль нэгийг
 * сонгож болно — feedback (👍/👎) болон is_staff-д зориулсан үнэлгээ/засварын хэсэгтэй.
 */
const ObjectiveLessonPanel = ({ objective, hasNext, onNext, onDelivered }) => {
  const { user } = useAuth();
  const isStaff = !!user?.is_staff;
  const [phase, setPhase] = useState('loading'); // loading | generating | active | error
  const [error, setError] = useState(null);
  const [conversationUuid, setConversationUuid] = useState(null);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [typewritingIdx, setTypewritingIdx] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [myFeedback, setMyFeedback] = useState(objective.my_feedback || null);
  const [staffRating, setStaffRating] = useState(objective.staff_rating || '');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ explanation_title: '', explanation_content: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const lastIdRef = useRef(0);
  const bottomRef = useRef(null);
  const deliveredNotifiedRef = useRef(false);
  const pendingResolverRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  // AI-ийн хариу realtime WebSocket-оор ирнэ (хуучин blocking poll-loop-ыг орлосон).
  useChatSocket(conversationUuid, {
    active: !!conversationUuid,
    onEvent: (evt) => {
      if (evt.type !== 'message' || !evt.message) return;
      const m = evt.message;
      if (m.author?.id === user?.id) return; // өөрийн мессежийн echo
      lastIdRef.current = Math.max(lastIdRef.current, m.id || 0);
      if (pendingResolverRef.current) {
        const resolve = pendingResolverRef.current;
        pendingResolverRef.current = null;
        resolve(m);
      }
    },
  });

  const waitForReply = (timeoutMs) => new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      pendingResolverRef.current = null;
      resolve(null);
    }, timeoutMs);
    pendingResolverRef.current = (message) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(message);
    };
  });

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setPhase('loading');
      const deadline = Date.now() + GEN_TIMEOUT_MS;
      try {
        let result = await startObjectiveLesson(objective.id);
        while (result.status !== 'ready') {
          if (cancelled) return;
          if (Date.now() > deadline) throw new Error('timeout');
          setPhase('generating');
          await new Promise((resolve) => setTimeout(resolve, GEN_POLL_MS));
          result = await startObjectiveLesson(objective.id);
        }
        if (cancelled) return;

        setConversationUuid(result.conversation_uuid);
        const scripted = result.messages.map((m) => toBubble(m, user?.id));
        lastIdRef.current = scripted.reduce((max, m) => Math.max(max, m.id || 0), 0);

        if (result.newly_delivered) {
          setDisplayMessages(scripted);
          setTypewritingIdx(scripted.length ? 0 : null);
          if (!scripted.length && !deliveredNotifiedRef.current) {
            deliveredNotifiedRef.current = true;
            onDelivered?.(objective.id);
          }
        } else {
          const full = await getConversationMessages(result.conversation_uuid);
          const all = (full.messages || []).map((m) => toBubble(m, user?.id));
          const shown = all.length ? all : scripted;
          setDisplayMessages(shown);
          lastIdRef.current = shown.length
            ? Math.max(lastIdRef.current, shown[shown.length - 1].id)
            : lastIdRef.current;
          if (!deliveredNotifiedRef.current) {
            deliveredNotifiedRef.current = true;
            onDelivered?.(objective.id);
          }
        }
        setPhase('active');
      } catch {
        if (!cancelled) {
          setError('Хичээл ачаалахад алдаа гарлаа. Дахин оролдоно уу.');
          setPhase('error');
        }
      }
    };

    start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objective.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [displayMessages.length, phase]);

  const handleBubbleDone = () => {
    setTypewritingIdx(null);
    if (!deliveredNotifiedRef.current) {
      deliveredNotifiedRef.current = true;
      onDelivered?.(objective.id);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setInput('');
    setDisplayMessages((prev) => [...prev, { uuid: `tmp-${Date.now()}`, id: -1, content, isAi: false }]);
    try {
      await sendMessage({ conversationUuid, content });
      const reply = await waitForReply(REPLY_TIMEOUT_MS);
      if (!isMountedRef.current) return;
      if (reply) {
        const bubble = toBubble(reply, user?.id);
        setDisplayMessages((prev) => [...prev.filter((m) => m.id !== -1), bubble]);
      }
    } catch {
      if (isMountedRef.current) setError('Мессеж илгээхэд алдаа гарлаа.');
    } finally {
      if (isMountedRef.current) setSending(false);
    }
  };

  const handleFeedback = async (rating) => {
    const next = myFeedback === rating ? null : rating;
    setMyFeedback(next);
    try {
      if (next) await sendObjectiveFeedback(objective.id, next);
    } catch {
      setMyFeedback(myFeedback); // revert on failure
    }
  };

  const handleStaffRate = async (rating) => {
    const prev = staffRating;
    setStaffRating(rating);
    try {
      await updateObjective(objective.id, { staff_rating: rating });
    } catch {
      setStaffRating(prev);
    }
  };

  const openEdit = async () => {
    setEditing(true);
    try {
      const full = await getObjective(objective.id);
      setEditForm({
        explanation_title: full.explanation_title || '',
        explanation_content: full.explanation_content || '',
      });
    } catch {
      setError('Тайлбарыг татахад алдаа гарлаа.');
      setEditing(false);
    }
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await updateObjective(objective.id, editForm);
      setDisplayMessages((prev) => {
        if (!prev.length) return prev;
        const bubble = editForm.explanation_title
          ? `**${editForm.explanation_title}**\n\n${editForm.explanation_content}`
          : editForm.explanation_content;
        return [{ ...prev[0], content: bubble }, ...prev.slice(1)];
      });
      setEditing(false);
    } catch {
      setError('Хадгалахад алдаа гарлаа.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (phase === 'loading' || phase === 'generating') {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        <span className="text-muted small">
          {phase === 'generating' ? 'Багш тайлбараа бэлдэж байна...' : 'Ачааллаж байна...'}
        </span>
      </div>
    );
  }

  if (phase === 'error') {
    return <Alert variant="danger" className="py-2 small">{error}</Alert>;
  }

  return (
    <div>
      <div className="d-flex align-items-start gap-1 mb-2 text-muted small">
        <Bot size={13} className="mt-1 flex-shrink-0" />
        <span>
          Энэ тайлбар, хариултыг хиймэл оюун ухаан (AI) үүсгэдэг тул алдаатай эсвэл
          дутуу байж болзошгүй — шаардлагатай тохиолдолд бусад эх сурвалжаас тодруулаарай.
        </span>
      </div>

      {conversationUuid && (
        <div className="d-flex justify-content-end mb-2">
          <Link to={`/messages/conversation/${conversationUuid}`} className="small text-decoration-none d-flex align-items-center gap-1">
            <MessageCircle size={12} /> Бүтэн чат руу очих
          </Link>
        </div>
      )}

      <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="mb-2 px-1">
        {displayMessages.map((m, idx) => (
          <LessonBubble
            key={m.uuid}
            content={m.content}
            isAi={m.isAi}
            typewriting={idx === typewritingIdx}
            onDone={idx === typewritingIdx ? handleBubbleDone : undefined}
          />
        ))}
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <div ref={bottomRef} />
      </div>

      {typewritingIdx === null && (
        <Form
          className="d-flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Сэдэвтэй холбоотой сонирхсон асуултаа асуугаарай..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button variant="primary" onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? <Spinner as="span" size="sm" /> : <Send size={16} />}
          </Button>
        </Form>
      )}

      {typewritingIdx === null && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="d-flex align-items-center gap-1">
            <Button
              variant={myFeedback === 'like' ? 'success' : 'outline-secondary'}
              size="sm"
              onClick={() => handleFeedback('like')}
              title="Таалагдсан"
            >
              <ThumbsUp size={12} />
            </Button>
            <Button
              variant={myFeedback === 'dislike' ? 'danger' : 'outline-secondary'}
              size="sm"
              onClick={() => handleFeedback('dislike')}
              title="Таалагдаагүй"
            >
              <ThumbsDown size={12} />
            </Button>
          </div>
          {hasNext && (
            <Button variant="outline-primary" size="sm" onClick={onNext}>
              Дараагийн зорилт руу <ArrowRight size={12} className="ms-1" />
            </Button>
          )}
        </div>
      )}

      {(myFeedback || isStaff) && (
        <div className="mt-3 p-2 bg-light rounded d-flex flex-wrap align-items-center gap-2">
          <span className="small text-muted">Тайлбар:</span>
          {myFeedback && (
            <ButtonGroup size="sm">
              {Object.entries(CONTROL_RATING_LABELS).map(([value, label]) => (
                <Button
                  key={value}
                  variant={staffRating === value ? 'primary' : 'outline-secondary'}
                  onClick={() => handleStaffRate(value)}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          )}
          {isStaff && !editing && (
            <Button variant="outline-secondary" size="sm" onClick={openEdit}>
              <Pencil size={12} className="me-1" /> Тайлбар засах
            </Button>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-2 p-2 border rounded">
          <Form.Group className="mb-2">
            <Form.Label className="small text-muted mb-1">Гарчиг</Form.Label>
            <Form.Control
              size="sm"
              value={editForm.explanation_title}
              onChange={(e) => setEditForm((f) => ({ ...f, explanation_title: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small text-muted mb-1">Агуулга</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              value={editForm.explanation_content}
              onChange={(e) => setEditForm((f) => ({ ...f, explanation_content: e.target.value }))}
            />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button size="sm" variant="success" onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? <Spinner as="span" size="sm" /> : <><Check size={14} className="me-1" />Хадгалах</>}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setEditing(false)} disabled={savingEdit}>
              <X size={14} className="me-1" />Болих
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectiveLessonPanel;
