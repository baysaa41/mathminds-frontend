// frontend/src/components/TopicPracticeChat.jsx
import { useState, useEffect, useRef } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Send, ListChecks, ArrowRight } from 'lucide-react';
import LivePreview from './LivePreview';
import { useAuth } from '../context/AuthContext';
import { getNextPracticeProblem } from '../services/clubsService';
import { sendMessage } from '../services/conversationService';
import useChatSocket from '../hooks/useChatSocket';

const GEN_POLL_MS = 3000;
const GEN_TIMEOUT_MS = 180000;
const REPLY_TIMEOUT_MS = 60000;

const toBubble = (m, userId) => ({
  uuid: m.uuid,
  id: m.id,
  content: m.content || '',
  isAi: m.author?.id !== userId,
});

const ChatBubble = ({ content, isAi }) => (
  <div className={`d-flex mb-3 ${isAi ? 'justify-content-start' : 'justify-content-end'}`}>
    <div
      className={`p-2 px-3 rounded-3 ${isAi ? 'bg-light' : 'bg-primary text-white'}`}
      style={{ maxWidth: '88%' }}
    >
      <LivePreview content={content} />
    </div>
  </div>
);

/**
 * "Дасгал бодлого" хэсгийг ЭЕШ бэлтгэлийн адил чат горимоор ажиллуулна: бодлого
 * нэг нэгээр (шууд Message болгон) чатад гарч ирнэ, сурагч хариултаа бичих/сонголт
 * дарахад do_ai_chat_reply-ийн байгаа ЭЕШ-ийн үнэлгээний логик (exam_prep_problem_id)
 * автоматаар тохирсон хариулт өгнө. Backend бодлогыг эхлээд одоо байгаа
 * жагсаалт/сангаас хайж, дууссан бол AI-аар шинээр үүсгэнэ.
 */
const TopicPracticeChat = ({ weeklyTopicId }) => {
  const { user } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle | loading | generating | active | error
  const [error, setError] = useState(null);
  const [conversationUuid, setConversationUuid] = useState(null);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastIdRef = useRef(0);
  const bottomRef = useRef(null);
  const pendingResolverRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [displayMessages.length, phase]);

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

  const fetchNextProblem = async () => {
    setError(null);
    setPhase((p) => (p === 'idle' ? 'loading' : p));
    const deadline = Date.now() + GEN_TIMEOUT_MS;
    try {
      let result = await getNextPracticeProblem(weeklyTopicId);
      while (result.status !== 'ready') {
        if (Date.now() > deadline) throw new Error('timeout');
        setPhase('generating');
        await new Promise((resolve) => setTimeout(resolve, GEN_POLL_MS));
        result = await getNextPracticeProblem(weeklyTopicId);
      }
      setConversationUuid(result.conversation_uuid);
      const bubble = toBubble(result.message, user?.id);
      lastIdRef.current = Math.max(lastIdRef.current, bubble.id || 0);
      setDisplayMessages((prev) => [...prev, bubble]);
      setCurrentProblem(result.problem);
      setAnswered(false);
      setPhase('active');
    } catch {
      setError('Бодлого ачаалахад алдаа гарлаа. Дахин оролдоно уу.');
      setPhase('error');
    }
  };

  const submitAnswer = async (content) => {
    if (!content || sending) return;
    setSending(true);
    const isAnsweringProblem = currentProblem && !answered;
    if (isAnsweringProblem) setAnswered(true);
    setDisplayMessages((prev) => [...prev, { uuid: `tmp-${Date.now()}`, id: -1, content, isAi: false }]);
    try {
      await sendMessage({
        conversationUuid,
        content,
        examPrepProblemId: isAnsweringProblem ? currentProblem.id : undefined,
      });
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

  const handleChoiceClick = (label) => {
    submitAnswer(label);
  };

  const handleSend = () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    submitAnswer(content);
  };

  if (phase === 'idle') {
    return (
      <div className="text-center py-3">
        <p className="text-muted small mb-2">
          Энэ сэдвийн дасгал бодлогуудыг чат хэлбэрээр нэг нэгээр бодоцгооё.
        </p>
        <Button variant="outline-primary" size="sm" onClick={fetchNextProblem}>
          <ListChecks size={14} className="me-1" /> Эхлэх
        </Button>
        {error && <Alert variant="danger" className="py-2 small mt-2">{error}</Alert>}
      </div>
    );
  }

  if (phase === 'loading' || phase === 'generating') {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        <span className="text-muted small">
          {phase === 'generating' ? 'Дасгал бодлого бэлдэж байна...' : 'Ачааллаж байна...'}
        </span>
      </div>
    );
  }

  if (phase === 'error' && displayMessages.length === 0) {
    return (
      <div>
        <Alert variant="danger" className="py-2 small">{error}</Alert>
        <Button variant="outline-primary" size="sm" onClick={fetchNextProblem}>Дахин оролдох</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="mb-2 px-1">
        {displayMessages.map((m) => (
          <ChatBubble key={m.uuid} content={m.content} isAi={m.isAi} />
        ))}
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
        <div ref={bottomRef} />
      </div>

      {currentProblem && !answered && currentProblem.choices?.length > 0 && (
        <div className="d-flex flex-column gap-2 mb-2">
          {currentProblem.choices.map((c) => (
            <Button
              key={c.label}
              variant="outline-primary"
              size="sm"
              className="text-start"
              disabled={sending}
              onClick={() => handleChoiceClick(c.label)}
            >
              <strong>{c.label})</strong> <LivePreview content={c.value} />
            </Button>
          ))}
        </div>
      )}

      <Form
        className="d-flex gap-2 mb-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <Form.Control
          as="textarea"
          rows={1}
          placeholder={answered || !currentProblem ? 'Асуулт бичих...' : 'Хариултаа бичих...'}
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

      {answered && (
        <div className="text-center">
          <Button variant="outline-primary" size="sm" onClick={fetchNextProblem} disabled={sending}>
            Дараагийн бодлого <ArrowRight size={14} className="ms-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TopicPracticeChat;
