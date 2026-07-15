// frontend/src/pages/MessagesPage.jsx
// Шинэ Message API ашигласан мессежийн хуудас

import { useState, useEffect, useRef, memo, useCallback, Fragment } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import UserName from '../components/UserName';
import LivePreview from '../components/LivePreview';
import { MathJax } from 'better-react-mathjax';
import NewConversationModal from '../components/NewConversationModal';
import ProgramProgressModal from '../components/ProgramProgressModal';

// ViewerJS for image viewing
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

// React Bootstrap компонентууд
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Image,
  X,
  AlertTriangle,
  Smile,
  Link2,
  Check,
  Plus,
  User,
  Trash2,
  Zap,
  Copy,
  CornerUpLeft,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  GraduationCap,
} from 'lucide-react';

// Services
import {
  getConversations,
  getConversation,
  getConversationMessages,
  sendMessage,
  createConversation,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  pollConversation,
  getEeshProblems,
  getEeshStats,
  getEeshTopics,
  getEeshDifferentProblem,
  sendExamProblem,
  getProblemHintSolution,
  explainWrongChoice,
  rateMessage,
  rateAnswerChoice,
} from '../services/conversationService';

import './PrivateMessagesPage.css';

// formatTime компонентоос гадагш — render бүрт шинэ функц үүсгэхгүй
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  if (diffInHours < 24) {
    return date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Өчигдөр';
  } else {
    return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
  }
};

// Зураг дарахад ViewerJS-ээр нээх
const openImageViewer = (e) => {
  const img = e.currentTarget;
  const container = img.closest('.message-images');
  if (!container) return;
  const viewer = new Viewer(container, {
    inline: false,
    navbar: container.querySelectorAll('img').length > 1,
    title: false,
    toolbar: { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, rotateLeft: 1, rotateRight: 1 },
    hidden() { viewer.destroy(); },
  });
  viewer.show();
  const imgs = [...container.querySelectorAll('img')];
  const idx = imgs.indexOf(img);
  if (idx > 0) viewer.view(idx);
};

// React.memo: message prop өөрчлөгдөөгүй бол re-render хийхгүй
// → MathJax/LivePreview зөвхөн шинэ мессеж дээр л ажиллана
const MessageBubble = memo(function MessageBubble({ message, currentUserId, onReuse, isTypewriting, onTypewritingDone, onTypewritingStart, rating, onRate }) {
  const isSent = message.author?.id === currentUserId;
  const [copied, setCopied] = useState(false);
  const bubbleRef = useRef(null);
  const [displayedLen, setDisplayedLen] = useState(isTypewriting ? 0 : Infinity);

  // Typewriter animation
  useEffect(() => {
    if (!isTypewriting) {
      setDisplayedLen(Infinity);
      return;
    }
    setDisplayedLen(0);
    const content = message.content || '';
    const SPEED = 25; // ms per character
    let current = 0;
    const tick = () => {
      current = Math.min(current + 1, content.length);
      if (current === 1) onTypewritingStart?.();
      setDisplayedLen(current);
      if (current < content.length) {
        timerId = setTimeout(tick, SPEED);
      } else {
        onTypewritingDone?.();
      }
    };
    let timerId = setTimeout(tick, SPEED);
    return () => clearTimeout(timerId);
  }, [isTypewriting, message.content]); // eslint-disable-line

  // MathJax: дууссаны дараа л render хийнэ
  useEffect(() => {
    if (displayedLen < (message.content?.length || 0)) return;
    if (bubbleRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([bubbleRef.current]).catch(() => {});
    }
  }, [displayedLen, message.content]);

  const visibleContent = displayedLen >= (message.content?.length || 0)
    ? null // бүтэн — LivePreview ашиглана
    : (message.content || '').substring(0, displayedLen);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={`message ${isSent ? 'sent' : 'received'}`}>
      <div className="message-bubble">
        <div className="message-content" ref={bubbleRef}>
          {visibleContent !== null ? (
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {visibleContent}
              <span className="typewriter-cursor" />
            </span>
          ) : (
            <LivePreview content={message.content} />
          )}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="message-images">
            {message.attachments.map((attachment) => (
              <img
                key={attachment.id}
                src={attachment.file}
                alt=""
                className="message-image"
                onClick={openImageViewer}
                style={{ cursor: 'pointer' }}
                title="Томруулж харах"
              />
            ))}
          </div>
        )}
        <div className="message-time d-flex align-items-center gap-1 flex-wrap">
          <span>
            {formatTime(message.created_at)}
            {message.is_edited && <span className="ms-1">(засварласан)</span>}
          </span>
          {message.content && (
            <span className="message-actions">
              <button
                className="btn btn-link btn-sm p-0 text-muted"
                onClick={handleCopy}
                title="Хуулах"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              {isSent && (
                <button
                  className="btn btn-link btn-sm p-0 text-muted"
                  onClick={() => onReuse?.(message.content)}
                  title="Дахин бичих"
                >
                  <CornerUpLeft size={12} />
                </button>
              )}
            </span>
          )}
          {!isSent && onRate && (
            <span className="ms-1 d-inline-flex gap-1 ai-rating-btns">
              <button
                className={`btn btn-link btn-sm p-0 ${rating === 'like' ? 'text-success' : 'text-muted'}`}
                onClick={() => onRate(rating === 'like' ? null : 'like')}
                title="Таалагдсан"
                style={{ lineHeight: 1 }}
              >
                <ThumbsUp size={12} fill={rating === 'like' ? 'currentColor' : 'none'} />
              </button>
              <button
                className={`btn btn-link btn-sm p-0 ${rating === 'dislike' ? 'text-danger' : 'text-muted'}`}
                onClick={() => onRate(rating === 'dislike' ? null : 'dislike')}
                title="Таалагдаагүй"
                style={{ lineHeight: 1 }}
              >
                <ThumbsDown size={12} fill={rating === 'dislike' ? 'currentColor' : 'none'} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

const isAiConv = (conv) => conv?.user1?.is_ai_teacher || conv?.user2?.is_ai_teacher

const MessagesPage = ({ aiOnly = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [typewriterMsgId, setTypewriterMsgId] = useState(null);
  const [typewriterStarted, setTypewriterStarted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingConv, setArchivingConv] = useState(null);
  const [deletingConv, setDeletingConv] = useState(null);

  // Like/Dislike үнэлгээ — AI мессеж болон сонголтын тайлбар
  const [messageRatings, setMessageRatings] = useState({}); // { [uuid]: 'like'|'dislike'|null }
  const [choiceRatings, setChoiceRatings] = useState({});   // { [choiceId]: 'like'|'dislike'|null }

  // ЭЕШ статистик modal
  const [showEeshModal, setShowEeshModal] = useState(false);
  const [eeshStats, setEeshStats] = useState(null);
  const [eeshStatsLoading, setEeshStatsLoading] = useState(false);
  const [examSelectedCategoryIds, setExamSelectedCategoryIds] = useState(new Set());
  // Two-step modal: category → topic
  const [eeshModalStep, setEeshModalStep] = useState('category'); // 'category' | 'topic'
  const [examSelectedCategoryId, setExamSelectedCategoryId] = useState(null); // single cat for topic step
  const [eeshTopics, setEeshTopics] = useState([]);
  const [eeshTopicsLoading, setEeshTopicsLoading] = useState(false);
  const [examSelectedTopicIds, setExamSelectedTopicIds] = useState(new Set());

  // Хөтөлбөрийн агуулга/явц modal (программ-специфик AI багштай ярилцах үед)
  const [showProgramModal, setShowProgramModal] = useState(false);

  // ЭЕШ бэлдэх горим
  const [examPrepMode, setExamPrepMode] = useState(false);
  const [examProblems, setExamProblems] = useState([]);
  const [examProblemIndex, setExamProblemIndex] = useState(0);
  const [examCurrentProblem, setExamCurrentProblem] = useState(null);
  const [examAnswered, setExamAnswered] = useState(false);
  const [examLastCorrect, setExamLastCorrect] = useState(null); // null | true | false
  const [examSending, setExamSending] = useState(false);
  // Буруу хариулт сонгосны дараа тайлбар
  const [wrongChoiceExplanation, setWrongChoiceExplanation] = useState(null); // null | string
  const [wrongChoiceId, setWrongChoiceId] = useState(null);   // буруу сонгосон choice-ийн id
  const [wrongChoiceLoading, setWrongChoiceLoading] = useState(false);
  const [wrongChoiceFailed, setWrongChoiceFailed] = useState(false); // AI алдаа гарсан
  // Бодолт харсны дараа дараагийн бодлого руу шилжих
  const [examSolutionViewed, setExamSolutionViewed] = useState(false);
  // Hint / Solution modal
  const [hintModal, setHintModal] = useState(null); // null | {loading, hint}
  const [solutionModal, setSolutionModal] = useState(null); // null | {loading, solution, explanation}
  // Polling loop-д closure асуудалгүйгээр detect хийх ref
  const examNeedsAiReplyRef = useRef(false);
  const [examAiReplied, setExamAiReplied] = useState(true); // false = AI хариулт хүлээж байна

  // AI харилцагчийн ID — ConversationSerializer user1/user2-д is_ai_teacher оруулдаг тул
  // энд тооцоолж, poll болон render аль алиндаа ашиглана.
  const aiUserId = selectedConversation?.user1?.is_ai_teacher
    ? selectedConversation.user1.id
    : selectedConversation?.user2?.is_ai_teacher
    ? selectedConversation.user2.id
    : null;

  // Refs
  const messagesEndRef = useRef(null);
  const examChoicesRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const lastMessageIdRef = useRef(0);
  const textareaRef = useRef(null);

  // Stable callback — memo'd MessageBubble re-render хийгдэхгүй
  const handleReuse = useCallback((text) => {
    if (textareaRef.current) textareaRef.current.value = text;
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getConversations();
        // Handle pagination response
        const all = data.results || data;
        const convList = aiOnly ? all.filter(isAiConv) : all.filter((c) => !isAiConv(c));
        setConversations(convList);

        // Check if we need to select a conversation by UUID (from /messages/conversation/:uuid)
        const selectUuid = location.state?.conversationUuid;
        if (selectUuid) {
          const conv = convList.find((c) => c.uuid === selectUuid);
          if (conv) {
            setSelectedConversation(conv);
          } else {
            // Conversation байхгүй бол (жишээ нь archived) API-аас шууд татах
            try {
              const fetchedConv = await getConversation(selectUuid);
              if (fetchedConv) setSelectedConversation(fetchedConv);
            } catch (e) {
              console.error('Conversation татахад алдаа:', e);
            }
          }
          navigate(location.pathname, { replace: true, state: {} });
        }

        // Check if we need to start a conversation with a specific user
        const startWith = location.state?.startConversationWith;
        if (startWith) {
          // Find existing conversation with this user
          const existingConv = convList.find((conv) => {
            const otherUser = conv.user1.id === user?.id ? conv.user2 : conv.user1;
            return otherUser.username === startWith;
          });

          if (existingConv) {
            // Select existing conversation
            setSelectedConversation(existingConv);
          } else {
            // Create new conversation
            try {
              const newConv = await createConversation(startWith);
              // Refresh conversations
              const refreshedData = await getConversations();
              const refreshedAll = refreshedData.results || refreshedData;
              const refreshedFiltered = aiOnly
                ? refreshedAll.filter(isAiConv)
                : refreshedAll.filter((c) => !isAiConv(c));
              setConversations(refreshedFiltered);

              // Select the new conversation (unfiltered-аас хайна, шинэ conv filter-д ороогүй байж болно)
              const createdConv = refreshedAll.find((c) => c.uuid === newConv.uuid);
              if (createdConv) {
                setSelectedConversation(createdConv);
              }
            } catch (err) {
              console.error('Error creating conversation:', err);
              setError('Харилцан яриа үүсгэхэд алдаа гарлаа.');
            }
          }

          // Clear the state so it doesn't trigger again on refresh
          navigate(location.pathname, { replace: true, state: {} });
        }
      } catch (err) {
        setError('Харилцан яриануудыг ачаалахад алдаа гарлаа.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [location.state, user, navigate, location.pathname]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    // Conversation солигдохыг textarea цэвэрлэх
    if (textareaRef.current) textareaRef.current.value = '';

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        lastMessageIdRef.current = 0;
        const data = await getConversationMessages(selectedConversation.uuid);
        const msgs = data.messages || [];
        setMessages(msgs);
        if (msgs.length) lastMessageIdRef.current = msgs[msgs.length - 1].id || 0;
        // Хадгалагдсан үнэлгээнүүдийг state-д ачаалах
        const initRatings = {};
        msgs.forEach((m) => { if (m.my_rating) initRatings[m.uuid] = m.my_rating; });
        setMessageRatings(initRatings);

        // Refresh conversations to update unread count
        // (backend automatically marks messages as read when fetching)
        const convData = await getConversations();
        const allConvs = convData.results || convData;
        setConversations(aiOnly ? allConvs.filter(isAiConv) : allConvs.filter((c) => !isAiConv(c)));
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);

  // ЭЕШ горим: conversation солигдоход reset
  useEffect(() => {
    setShowEeshModal(false);
    setEeshStats(null);
    setExamPrepMode(false);
    setExamProblems([]);
    setExamProblemIndex(0);
    setExamCurrentProblem(null);
    setExamAnswered(false);
    setExamLastCorrect(null);
    setWrongChoiceExplanation(null);
    setWrongChoiceLoading(false);
    setWrongChoiceFailed(false);
    setExamSolutionViewed(false);
    setHintModal(null);
    setSolutionModal(null);
    setExamSelectedCategoryIds(new Set());
    setExamSelectedCategoryId(null);
    setExamSelectedTopicIds(new Set());
    setEeshTopics([]);
    setEeshModalStep('category');
    setMessageRatings({});
    setChoiceRatings({});
    setExamAiReplied(true);
    examNeedsAiReplyRef.current = false;
  }, [selectedConversation?.uuid]);


  // AI мессежэд like/dislike
  const handleRateMessage = useCallback(async (messageUuid, rating) => {
    const prev = messageRatings[messageUuid] ?? null;
    setMessageRatings((s) => ({ ...s, [messageUuid]: rating }));
    try {
      // Exam prep mode + dislike → бодлогын choices/answer шалгаж засах
      const problemId = (examPrepMode && rating === 'dislike')
        ? (examCurrentProblem?.id ?? examProblems[examProblemIndex]?.id ?? null)
        : null;
      await rateMessage(messageUuid, rating, problemId);
    } catch {
      setMessageRatings((s) => ({ ...s, [messageUuid]: prev }));
    }
  }, [messageRatings, examPrepMode, examCurrentProblem, examProblems, examProblemIndex]);

  // Сонголтын тайлбарт like/dislike
  const handleRateChoice = useCallback(async (choiceId, rating) => {
    const prev = choiceRatings[choiceId] ?? null;
    setChoiceRatings((s) => ({ ...s, [choiceId]: rating }));
    try {
      await rateAnswerChoice(choiceId, rating);
    } catch {
      setChoiceRatings((s) => ({ ...s, [choiceId]: prev }));
    }
  }, [choiceRatings]);

  // ЭЕШ товч дарахад: статистик татаж modal нээх
  const handleEeshButtonClick = async () => {
    setShowEeshModal(true);
    setEeshModalStep('category');
    setExamSelectedCategoryId(null);
    setEeshTopics([]);
    setExamSelectedTopicIds(new Set());
    if (eeshStats) return;
    setEeshStatsLoading(true);
    try {
      const data = await getEeshStats();
      setEeshStats(data);
    } catch (e) {
      console.error('ЭЕШ статистик татахад алдаа:', e);
      setEeshStats({ has_data: false, category_stats: [] });
    } finally {
      setEeshStatsLoading(false);
    }
  };

  // Category сонгоход topic step руу шилжих
  const handleSelectCategoryForTopics = async (cat) => {
    setExamSelectedCategoryId(cat.id);
    setExamSelectedTopicIds(new Set());
    setEeshModalStep('topic');
    setEeshTopicsLoading(true);
    try {
      const data = await getEeshTopics(cat.id);
      setEeshTopics(data.topics || []);
    } catch (e) {
      console.error('Сэдэв татахад алдаа:', e);
      setEeshTopics([]);
    } finally {
      setEeshTopicsLoading(false);
    }
  };

  // Бодлогыг чатад AI мессежээр илгээх
  const sendProblemToChat = async (problems, index) => {
    const prob = problems[index];
    if (!prob || !selectedConversation) return;
    setExamSending(true);
    try {
      const problemMsg = await sendExamProblem(selectedConversation.uuid, prob.id);
      // Бодлогын мессежийг шууд messages-д нэм (polling хүлээхгүй)
      if (problemMsg?.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === problemMsg.id);
          return exists ? prev : [...prev, problemMsg];
        });
        if (problemMsg.id) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, problemMsg.id);
      }
      setExamCurrentProblem(prob);
      setExamProblemIndex(index);
      setExamAnswered(false);
      setExamLastCorrect(null);
      setWrongChoiceExplanation(null);
      setWrongChoiceLoading(false);
      setWrongChoiceFailed(false);
      setExamSolutionViewed(false);
      setHintModal(null);
      setSolutionModal(null);
      setExamAiReplied(true);
      examNeedsAiReplyRef.current = false;
    } catch (e) {
      console.error('Бодлого илгээхэд алдаа:', e);
    } finally {
      setExamSending(false);
    }
  };

  // "Бодлого бодох" дарахад: бодлогуудыг татаж эхний бодлогыг илгээнэ
  const handleStartExamPrep = async () => {
    setShowEeshModal(false);
    setExamPrepMode(true);
    setExamAnswered(false);
    // Two-step modal: single category + optional topic keywords
    const catIds = examSelectedCategoryId ? [examSelectedCategoryId] : [...examSelectedCategoryIds];
    const kwIds = [...examSelectedTopicIds];
    let problems = examProblems;
    if (!problems.length || catIds.length > 0 || kwIds.length > 0) {
      try {
        const data = await getEeshProblems('math', 20, catIds, kwIds);
        problems = data.problems || [];
        setExamProblems(problems);
      } catch (e) {
        console.error('ЭЕШ бодлого татахад алдаа:', e);
        return;
      }
    }
    if (!problems.length) {
      setExamPrepMode(false);
      alert('Бодлого олдсонгүй. Өөр сэдэв эсвэл категори сонгоно уу.');
      return;
    }
    await sendProblemToChat(problems, 0);
  };

  // Дараагийн бодлого илгээх (ижил категорийг давуу эрхтэй)
  const handleNextProblem = async () => {
    if (!examAiReplied || typewriterMsgId) return;
    const nextIndex = examProblemIndex + 1;
    if (nextIndex >= examProblems.length) return;
    await sendProblemToChat(examProblems, nextIndex);
  };

  // Одоогийн бодлогыг алгасаж дараагийн рүү шилжих
  const handleSkipProblem = async () => {
    if (examSending || typewriterMsgId) return;
    const nextIndex = examProblemIndex + 1;
    if (nextIndex >= examProblems.length) return;
    await sendProblemToChat(examProblems, nextIndex);
  };

  // Өөр (өөр сэдвийн) бодлого — алгоритмын дагуу сонгох, олдохгүй бол AI зохионо
  const handleDifferentProblem = async () => {
    const currentProblem = examProblems[examProblemIndex];
    if (!currentProblem || !selectedConversation || examSending || !examAiReplied || typewriterMsgId) return;
    setExamSending(true);
    try {
      const data = await getEeshDifferentProblem(currentProblem.id, 'math');
      if (!data?.problem) return;
      const newProblem = data.problem;
      const insertIndex = examProblemIndex + 1;
      const newList = [
        ...examProblems.slice(0, insertIndex),
        newProblem,
        ...examProblems.slice(insertIndex),
      ];
      setExamProblems(newList);
      // sendProblemToChat нь setExamSending(true/false) дотроо хийдэг тул finally-д false хийхгүй
      await sendProblemToChat(newList, insertIndex);
    } catch (e) {
      console.error('Өөр бодлого авахад алдаа:', e);
      setExamSending(false);
    }
  };

  // Зөвлөгөө (Hint) modal нээх
  const handleOpenHint = async () => {
    if (!examCurrentProblem) return;
    setHintModal({ loading: true, hint: null });
    try {
      const data = await getProblemHintSolution(examCurrentProblem.id);
      setHintModal({ loading: false, hint: data.hint || null });
    } catch (e) {
      console.error('Hint татахад алдаа:', e);
      setHintModal({ loading: false, hint: null });
    }
  };

  // Бодолт (Solution) modal нээх
  const handleOpenSolution = async () => {
    if (!examCurrentProblem) return;
    setSolutionModal({ loading: true, solution: null, explanation: null, note: null, choices: null });
    try {
      const data = await getProblemHintSolution(examCurrentProblem.id);
      setSolutionModal({
        loading: false,
        solution: data.solution || null,
        explanation: data.explanation || null,
        note: data.note || null,
        choices: data.choices || null,
      });
    } catch (e) {
      console.error('Бодолт татахад алдаа:', e);
      setSolutionModal({ loading: false, solution: null, explanation: null, note: null, choices: null });
    }
  };

  // Бодолт харсны дараа дараагийн бодлого руу шилжих
  const handleSolutionViewed = () => {
    setSolutionModal(null);
    setExamSolutionViewed(true);
  };

  // MC сонголт дарах үед хариулт шууд илгээх
  const handleSendChoiceAnswer = async (choiceLabel) => {
    if (!selectedConversation || !examCurrentProblem || examAnswered || sending) return;
    const problemRef = examCurrentProblem;

    // Хариулт зөв эсэхийг frontend-д тооцоолох (backend-тэй ижил логик)
    let isCorrect = null;
    if (problemRef.choices?.length) {
      const matched = problemRef.choices.find(
        (c) => (c.label || '').trim().toUpperCase() === choiceLabel.trim().toUpperCase()
      );
      if (matched !== undefined) isCorrect = matched.default_score > 0;
    }

    // Ижил категорийн бодлогын тоог тоолох (0-ээс эхлэн)
    const sameCatCount = examProblems
      .slice(0, examProblemIndex + 1)
      .filter((p) => p.category_id === problemRef.category_id).length;
    const suggestTopicChange = isCorrect === true && sameCatCount >= 5;

    setExamLastCorrect(isCorrect);
    if (isCorrect === true) {
      setExamAnswered(true);
      setExamCurrentProblem(null);
      setWrongChoiceExplanation(null);
      setWrongChoiceFailed(false);
      setExamAiReplied(false);
      examNeedsAiReplyRef.current = true;
    } else {
      // Буруу: хариулт сонгох товч хэвээр, алдааны тайлбар авах
      setWrongChoiceExplanation(null);
      setWrongChoiceId(null);
      setWrongChoiceFailed(false);
      if (problemRef.choices?.length) {
        const choiceObj = problemRef.choices?.find(
          (c) => (c.label || '').trim().toUpperCase() === choiceLabel.trim().toUpperCase()
        );
        if (choiceObj?.id) setWrongChoiceId(choiceObj.id);
        setWrongChoiceLoading(true);
        explainWrongChoice(problemRef.id, choiceLabel)
          .then((data) => {
            if (data.explanation) {
              setWrongChoiceExplanation(data.explanation);
            } else {
              setWrongChoiceFailed(true);
            }
          })
          .catch((err) => { console.error('explainWrongChoice алдаа:', err); setWrongChoiceFailed(true); })
          .finally(() => setWrongChoiceLoading(false));
      }
    }

    const tempId = 'temp-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        uuid: tempId,
        author: user,
        content: choiceLabel,
        created_at: new Date().toISOString(),
        attachments: [],
        _isOptimistic: true,
      },
    ]);
    if (isAiConv(selectedConversation)) setAiTyping(true);

    try {
      setSending(true);
      const sentMessage = await sendMessage({
        conversationUuid: selectedConversation.uuid,
        content: choiceLabel,
        attachments: [],
        examPrepProblemId: problemRef.id,
        examSuggestTopicChange: suggestTopicChange,
      });
      setMessages((prev) => prev.map((m) => (m.uuid === tempId ? sentMessage : m)));
      if (sentMessage.id) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sentMessage.id);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.uuid !== tempId));
      setExamAnswered(false);
      setExamCurrentProblem(problemRef);
      console.error('Хариулт илгээхэд алдаа:', err);
    } finally {
      setSending(false);
      if (textareaRef.current) textareaRef.current.value = '';
    }
  };

  // Auto-poll: шинэ мессеж + AI typing status
  // Зөвхөн AI харилцагчтай харилцаанд л polling хийнэ.
  // Хүн-хүний чатад polling огт хэрэггүй.
  useEffect(() => {
    if (!selectedConversation) return
    const isAiConversation =
      selectedConversation.user1?.is_ai_teacher || selectedConversation.user2?.is_ai_teacher
    if (!isAiConversation) return

    let timeoutId
    let abortController
    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      abortController = new AbortController()
      try {
        const data = await pollConversation(
          selectedConversation.uuid,
          lastMessageIdRef.current,
          abortController.signal,
        )
        if (cancelled) return
        const isTyping = data.ai_typing || false
        setAiTyping(isTyping)
        if (data.messages?.length > 0) {
          setMessages((prev) => {
            const optimistic = prev.filter((m) => m._isOptimistic)
            const realMessages = prev.filter((m) => !m._isOptimistic)
            const existingIds = new Set(realMessages.map((m) => m.id).filter(Boolean))
            const brandNew = data.messages.filter((m) => !existingIds.has(m.id))
            // Optimistic мессежүүдийг хадгалж, poll-д ирсэн мессежтэй давхардаагүй эсэхийг шалгана
            const pollIds = new Set(brandNew.map((m) => m.id))
            const safeOptimistic = optimistic.filter(
              (m) => !pollIds.has(m.id)
            )
            return [...realMessages, ...safeOptimistic, ...brandNew]
          })
          const last = data.messages[data.messages.length - 1]
          if (last.id) lastMessageIdRef.current = last.id
          // AI мессеж ирвэл typewriter эффект эхлүүлнэ
          const aiMsg = [...data.messages].reverse().find((m) => aiUserId && m.author?.id === aiUserId)
          if (aiMsg?.uuid) {
            setTypewriterStarted(false)
            setTypewriterMsgId(aiMsg.uuid)
            // Зөв хариулсны дараа багшийн хариулт ирсэн → товч харуулна
            if (examNeedsAiReplyRef.current) {
              examNeedsAiReplyRef.current = false
              setExamAiReplied(true)
            }
          }
        }
        // AI бичиж байх үед 500ms, эс бөгөөс 2000ms
        if (!cancelled) timeoutId = setTimeout(poll, isTyping ? 500 : 2000)
      } catch (err) {
        if (cancelled || err?.name === 'AbortError' || err?.name === 'CanceledError') return
        if (!cancelled) timeoutId = setTimeout(poll, 2000)
      }
    }

    // Анхны poll 1 секундын дараа эхэлнэ
    timeoutId = setTimeout(poll, 1000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      abortController?.abort()
    }
  }, [selectedConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && !loadingMessages) {
      // Use setTimeout to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, loadingMessages]);


  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Get other user from conversation
  const getOtherUser = (conversation) => {
    if (!conversation || !user) return null;
    return conversation.user1.id === user.id ? conversation.user2 : conversation.user1;
  };

  // Handle image upload
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setUploadedImages((prev) => [...prev, ...files]);
  };

  // Remove uploaded image
  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    if (textareaRef.current) textareaRef.current.value += emoji;
    setShowEmojiPicker(false);
  };

  // Common emojis
  const commonEmojis = [
    '😊',
    '😂',
    '🤣',
    '😍',
    '😭',
    '😘',
    '😅',
    '😎',
    '🤔',
    '😉',
    '👍',
    '👏',
    '🙏',
    '💪',
    '🎉',
    '❤️',
    '🔥',
    '✨',
    '💯',
    '👌',
    '😢',
    '😡',
    '🤗',
    '😴',
    '🤩',
    '😇',
    '🥺',
    '😱',
    '😳',
    '🤯',
  ];

  // Handle new conversation created
  const handleConversationCreated = async (conversation) => {
    try {
      // Refresh conversations
      const data = await getConversations();
      const all = data.results || data;
      const convList = aiOnly ? all.filter(isAiConv) : all.filter((c) => !isAiConv(c));
      setConversations(convList);

      // Select the new conversation
      const newConv = convList.find((c) => c.uuid === conversation.uuid);
      if (newConv) {
        setSelectedConversation(newConv);
      }
    } catch (err) {
      console.error('Error refreshing conversations:', err);
    }
  };

  // Copy conversation link
  const copyConversationLink = () => {
    if (!selectedConversation) return;

    // UUID-based линк
    const url = `${window.location.origin}/messages/conversation/${selectedConversation.uuid}`;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        alert('Линк хуулахад алдаа гарлаа');
      });
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()

    const inputText = (textareaRef.current?.value || '').trim()
    if (!inputText && uploadedImages.length === 0) return
    if (!selectedConversation) return

    // Optimistic: мессежийг шууд харуулах
    const tempId = 'temp-' + Date.now()
    const optimisticAttachments = uploadedImages.map((file, i) => ({
      id: `temp-att-${i}`,
      file: URL.createObjectURL(file),
      file_type: file.type.startsWith('image/') ? 'image' : 'other',
      uploaded_at: new Date().toISOString(),
    }))
    setMessages((prev) => [
      ...prev,
      {
        uuid: tempId,
        author: user,
        content: inputText,
        created_at: new Date().toISOString(),
        attachments: optimisticAttachments,
        _isOptimistic: true,
      },
    ])
    if (textareaRef.current) textareaRef.current.value = ''
    setUploadedImages([])
    if (fileInputRef.current) fileInputRef.current.value = ''

    // AI харилцагчтай бол мессеж илгээмэгц "Бодож байна" шууд харуулна
    if (isAiConv(selectedConversation)) setAiTyping(true)

    // ЭЕШ бэлдэх горим: идэвхтэй бодлого байвал хариулсан гэж тэмдэглэх
    const activeProblem = examPrepMode && !examAnswered && examCurrentProblem;
    if (activeProblem) setExamAnswered(true);

    try {
      setSending(true)

      const sentMessage = await sendMessage({
        conversationUuid: selectedConversation.uuid,
        content: inputText,
        attachments: uploadedImages,
        examPrepProblemId: activeProblem ? activeProblem.id : undefined,
      })
      // Optimistic-г бодит мессежээр солих; ID шинэчлэх
      setMessages((prev) => prev.map((m) => (m.uuid === tempId ? sentMessage : m)))
      if (sentMessage.id) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, sentMessage.id)

      // Conversation жагсаалт шинэчлэх
      const convData = await getConversations()
      const allConvs = convData.results || convData
      setConversations(aiOnly ? allConvs.filter(isAiConv) : allConvs.filter((c) => !isAiConv(c)))
      if (showArchived) setShowArchived(false)
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.uuid !== tempId))
      if (textareaRef.current) textareaRef.current.value = inputText
      console.error('Error sending message:', err)
      const errorData = err.response?.data
      const errorMsg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      alert(`Мессеж илгээхэд алдаа гарлаа: ${errorMsg || err.message}`)
    } finally {
      setSending(false)
    }
  }

  // Handle Enter key to send
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Archive conversation
  const handleArchive = async (conv) => {
    try {
      setArchivingConv(conv.uuid);
      await archiveConversation(conv.uuid);

      // Refresh conversations
      const data = await getConversations();
      const all = data.results || data;
      const convList = aiOnly ? all.filter(isAiConv) : all.filter((c) => !isAiConv(c));
      setConversations(convList);

      // Deselect if the archived conversation was selected
      if (selectedConversation?.uuid === conv.uuid) {
        setSelectedConversation(null);
      }
    } catch (err) {
      console.error('Error archiving conversation:', err);
      alert('Архивлахад алдаа гарлаа.');
    } finally {
      setArchivingConv(null);
    }
  };

  // Unarchive conversation
  const handleUnarchive = async (conv) => {
    try {
      setArchivingConv(conv.uuid);
      await unarchiveConversation(conv.uuid);

      // Refresh conversations
      const data = await getConversations();
      const all = data.results || data;
      const convList = aiOnly ? all.filter(isAiConv) : all.filter((c) => !isAiConv(c));
      setConversations(convList);
    } catch (err) {
      console.error('Error unarchiving conversation:', err);
      alert('Архиваас гаргахад алдаа гарлаа.');
    } finally {
      setArchivingConv(null);
    }
  };

  // Delete conversation
  const handleDelete = async (conv) => {
    const isAi = isAiConv(conv);
    const msg = isAi
      ? 'Энэ яриаг бүрэн устгах уу? Бүх мессеж устана. Дахин багшаа сонгоход шинэ яриа эхэлнэ.'
      : 'Харилцан ярианы устгах уу? Нөгөө тал дахин мессеж илгээх хүртэл харилцан яриа таны жагсаалтаас нуугдана.';
    if (!window.confirm(msg)) return;
    try {
      setDeletingConv(conv.uuid);
      await deleteConversation(conv.uuid);
      setConversations((prev) => prev.filter((c) => c.uuid !== conv.uuid));
      if (selectedConversation?.uuid === conv.uuid) setSelectedConversation(null);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Устгахад алдаа гарлаа.');
    } finally {
      setDeletingConv(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '400px' }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Ачааллаж байна...</span>
        </Spinner>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  // Empty state — selectedConversation байгаа бол хоосон state харуулахгүй
  if (conversations.length === 0 && !selectedConversation) {
    if (aiOnly) {
      return (
        <div className="text-center p-5">
          <MessageCircle size={64} className="text-muted mb-3" />
          <h4 className="text-muted">AI багштай ярилцаж эхлээгүй байна</h4>
          <p className="text-muted">
            Feed хуудаснаас "AI багш" товч дарж эхлүүлнэ үү.
          </p>
          <Link to="/" className="btn btn-primary btn-sm">
            Feed рүү очих
          </Link>
        </div>
      );
    }
    return (
      <>
        <div className="text-center p-5">
          <MessageCircle size={64} className="text-muted mb-3" />
          <h4 className="text-muted">Харилцан яриа байхгүй байна</h4>
          <p className="text-muted">"+" товч дарж шинэ харилцан яриа эхлүүлнэ үү.</p>
          <button className="btn btn-primary" onClick={() => setShowNewConversationModal(true)}>
            <Plus size={18} className="me-2" />
            Шинэ харилцан яриа
          </button>
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal
          show={showNewConversationModal}
          onHide={() => setShowNewConversationModal(false)}
          onConversationCreated={handleConversationCreated}
        />
      </>
    );
  }

  const otherUser = selectedConversation ? getOtherUser(selectedConversation) : null;

  return (
    <div className="private-messages-container">
      {/* Conversations List */}
      <div className={`conversations-sidebar ${selectedConversation ? 'd-none d-md-flex' : ''}`}>
        <div className="conversations-header">
          <div className="d-flex align-items-center gap-2">
            <MessageCircle size={20} />
            <h5 className="mb-0 fw-bold">{aiOnly ? 'AI Багш нар' : 'Мессежүүд'}</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            {aiOnly && (
              <Link to="/solver" className="btn btn-sm btn-outline-primary" title="AI Шийдэгч">
                <Zap size={16} />
              </Link>
            )}
            <Badge bg="primary" pill>
              {conversations.filter((c) => showArchived ? c.is_archived_by_user : !c.is_archived_by_user).length}
            </Badge>
            {aiOnly ? (
              <Link
                to="/"
                className="btn btn-sm btn-primary"
                title="Feed-с шинэ AI багш сонгох"
              >
                <Plus size={16} />
              </Link>
            ) : (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => setShowNewConversationModal(true)}
                title="Шинэ харилцан яриа үүсгэх"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Archive/Active toggle */}
        <div className="px-3 py-2 border-bottom">
          <div className="btn-group w-100" role="group">
            <button
              type="button"
              className={`btn btn-sm ${!showArchived ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowArchived(false)}
            >
              Идэвхтэй
            </button>
            <button
              type="button"
              className={`btn btn-sm ${showArchived ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowArchived(true)}
            >
              Архив
            </button>
          </div>
        </div>

        <div className="conversations-list">
          {conversations
            .filter((c) => showArchived ? c.is_archived_by_user : !c.is_archived_by_user)
            .map((conversation) => {
            const partner = getOtherUser(conversation);
            const lastMsg = conversation.last_message;
            const unreadCount = conversation.unread_count || 0;

            return (
              <div
                key={conversation.uuid}
                className={`conversation-item ${selectedConversation?.uuid === conversation.uuid ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="conversation-avatar">
                  <UserAvatar user={partner} size={48} />
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {conversation.title || <UserName user={partner} showLink={false} />}
                  </div>
                  {lastMsg && (
                    <div className="conversation-preview">
                      {lastMsg.content
                        ?.replace(/\$[^$]+\$/g, '[math]')
                        ?.replace(/\\\([^)]+\\\)/g, '[math]')
                        ?.substring(0, 50)}
                      {lastMsg.content?.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
                <div className="conversation-meta">
                  {lastMsg && (
                    <div className="conversation-time">{formatTime(lastMsg.created_at)}</div>
                  )}
                  {unreadCount > 0 && (
                    <Badge bg="danger" pill className="mt-1">
                      {unreadCount}
                    </Badge>
                  )}
                  <button
                    className="btn btn-sm btn-link text-danger p-0 mt-1"
                    title="Устгах"
                    disabled={deletingConv === conversation.uuid}
                    onClick={(e) => { e.stopPropagation(); handleDelete(conversation); }}
                  >
                    {deletingConv === conversation.uuid ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`chat-area ${!selectedConversation ? 'd-none d-md-flex' : ''}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button
                className="btn btn-link d-md-none p-0 me-2"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="d-flex align-items-center gap-2 flex-grow-1">
                <div className="chat-avatar">
                  <UserAvatar user={otherUser} size={40} />
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold">
                    {selectedConversation.title || <UserName user={otherUser} showLink={false} />}
                  </div>
                  <div
                    className="text-muted small"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${otherUser?.username}`)}
                  >
                    @{otherUser?.username}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {otherUser?.ai_program && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setShowProgramModal(true)}
                      title="Хөтөлбөрийн агуулга, явц харах"
                    >
                      <GraduationCap size={16} />
                      <span className="d-none d-md-inline ms-1">Хөтөлбөр</span>
                    </button>
                  )}
                  {isAiConv(selectedConversation) && (
                    <button
                      className={`btn btn-sm ${examPrepMode ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={handleEeshButtonClick}
                      title="ЭЕШ бэлдэх — статистик харах"
                    >
                      <BookOpen size={16} />
                      <span className="d-none d-md-inline ms-1">ЭЕШ</span>
                    </button>
                  )}
                  <div className="text-secondary small d-flex align-items-center gap-1">
                    <AlertTriangle size={14} />
                    <span className="d-none d-md-inline">Нийтэд нээлттэй</span>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate(`/profile/${otherUser?.username}`)}
                    title="Профайл харах"
                  >
                    <User size={16} />
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={copyConversationLink}
                    title="Харилцааны линк хуулах"
                  >
                    {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
                  </button>
                  <button
                    className={`btn btn-sm ${selectedConversation?.is_archived_by_user ? 'btn-warning' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      if (selectedConversation?.is_archived_by_user) {
                        handleUnarchive(selectedConversation);
                      } else {
                        handleArchive(selectedConversation);
                      }
                    }}
                    disabled={archivingConv === selectedConversation?.uuid}
                    title={selectedConversation?.is_archived_by_user ? 'Архиваас гаргах' : 'Архивлах'}
                  >
                    {archivingConv === selectedConversation?.uuid ? (
                      <Spinner animation="border" size="sm" />
                    ) : selectedConversation?.is_archived_by_user ? (
                      '↩'
                    ) : (
                      '📦'
                    )}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(selectedConversation)}
                    disabled={deletingConv === selectedConversation?.uuid}
                    title="Харилцан яриа устгах"
                  >
                    {deletingConv === selectedConversation?.uuid ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {loadingMessages ? (
                <div className="d-flex justify-content-center p-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (() => {
                // Зөв хариулсны дараа / бодолт харсны дараа → Үргэлжлүүлэх / Сэдэв сонгох / Болих
                const showExamNext = examPrepMode && (
                  (examAnswered && examLastCorrect === true && examAiReplied && !typewriterMsgId)
                  || examSolutionViewed
                );
                // Бодлого харагдаж байх үед, хариулаагүй → Алгасах / Болих
                const showSkip = examPrepMode && !examAnswered && !examSolutionViewed
                  && !examSending && !typewriterMsgId && examProblems.length > 0;
                const lastAiMsgUuid = (showExamNext || showSkip)
                  ? [...messages].reverse().find((m) => aiUserId && m.author?.id === aiUserId)?.uuid
                  : null;
                const stopExam = () => {
                  setExamPrepMode(false);
                  setExamProblems([]);
                  setExamProblemIndex(0);
                  setExamCurrentProblem(null);
                  setExamAnswered(false);
                  setExamLastCorrect(null);
                  setExamSolutionViewed(false);
                };
                return messages.map((message) => (
                  <Fragment key={message.uuid}>
                    <MessageBubble
                      message={message}
                      currentUserId={user?.id}
                      onReuse={handleReuse}
                      isTypewriting={message.uuid === typewriterMsgId}
                      onTypewritingDone={() => { setTypewriterMsgId(null); setTypewriterStarted(false); }}
                      onTypewritingStart={() => setTypewriterStarted(true)}
                      rating={messageRatings[message.uuid] ?? message.my_rating ?? null}
                      onRate={isAiConv(selectedConversation) ? (r) => handleRateMessage(message.uuid, r) : null}
                    />
                    {message.uuid === lastAiMsgUuid && showExamNext && (
                      <div className="d-flex gap-2 flex-wrap px-3 pb-3 pt-1" style={{ marginLeft: '2.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={handleNextProblem}
                          disabled={examSending || !examAiReplied || !!typewriterMsgId || examProblemIndex >= examProblems.length - 1}
                        >
                          {examSending ? <Spinner animation="border" size="sm" className="me-1" /> : <Check size={14} className="me-1" />}
                          Дараагийн бодлого
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => { stopExam(); handleEeshButtonClick(); }}
                          disabled={examSending}
                        >
                          Сэдэв сонгох
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={stopExam}
                          disabled={examSending}
                        >
                          Болих
                        </button>
                      </div>
                    )}
                    {message.uuid === lastAiMsgUuid && showSkip && (
                      <div className="d-flex gap-2 flex-wrap px-3 pb-3 pt-1" style={{ marginLeft: '2.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline-warning btn-sm"
                          onClick={handleSkipProblem}
                          disabled={examSending || !!typewriterMsgId || examProblemIndex >= examProblems.length - 1}
                        >
                          {examSending ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                          Алгасах
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={stopExam}
                          disabled={examSending}
                        >
                          Болих
                        </button>
                      </div>
                    )}
                  </Fragment>
                ));
              })()}
              {/* AI typing indicator — typewriter эхэлсэн бол нуугдана */}
              {(aiTyping || !examAiReplied) && !typewriterMsgId && (
                <div className="message received ai-thinking-row">
                  <div className="message-bubble ai-thinking-bubble">
                    <Spinner animation="border" size="sm" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-area">
              {/* ЭЕШ: дараагийн бодлого ачаалж байна */}
              {examPrepMode && examSending && (
                <div className="border-top py-3 d-flex justify-content-center align-items-center gap-2 text-muted" style={{ background: '#f8f9fa', fontSize: '0.85rem' }}>
                  <Spinner animation="border" size="sm" />
                  <span>Бодлого ачаалж байна...</span>
                </div>
              )}
              {/* ЭЕШ: бодлогын өгүүлбэр + хариулт сонголт + товчнууд — нэг блокт */}
              {examPrepMode && examCurrentProblem && !examAnswered && !examSolutionViewed && !examSending && (
                <div className="exam-problem-block border-top" style={{ background: '#f8f9fa' }}>
                  {/* Өгүүлбэр */}
                  <div className="px-3 pt-2 pb-1" style={{ fontSize: '1.05rem', maxHeight: '200px', overflowY: 'auto' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-semibold text-muted small flex-grow-1">
                        {examCurrentProblem.title || `#${examCurrentProblem.id}`}
                      </span>
                      {examCurrentProblem.level_name && (() => {
                        const mnName = examCurrentProblem.level_name.replace(/\s*\(.*?\)/, '').trim();
                        const levelColors = { 1: '#198754', 2: '#0dcaf0', 3: '#0d6efd', 4: '#ffc107', 5: '#fd7e14', 6: '#dc3545' };
                        const levelTextColors = { 4: '#000', 5: '#fff' };
                        const bg = levelColors[examCurrentProblem.level_id] || '#6c757d';
                        const color = levelTextColors[examCurrentProblem.level_id] || '#fff';
                        return (
                          <span
                            className="badge"
                            style={{ fontSize: '0.65rem', background: bg, color }}
                            title={examCurrentProblem.level_name}
                          >
                            {mnName}
                          </span>
                        );
                      })()}
                      {examCurrentProblem.topic_name && (
                        <span
                          className="badge"
                          style={{ fontSize: '0.65rem', background: '#6c757d', color: '#fff' }}
                        >
                          {examCurrentProblem.topic_name}
                        </span>
                      )}
                      {examCurrentProblem.is_eesh && (
                        <span
                          className="badge"
                          style={{ fontSize: '0.65rem', background: '#e8a700', color: '#000' }}
                        >
                          ЭЕШ жишиг
                        </span>
                      )}
                      {user?.is_staff && (
                        <a
                          href={`/problem/${examCurrentProblem.uuid}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted"
                          style={{ fontSize: '0.72rem' }}
                          title="Бодлого засах"
                        >
                          ✏️
                        </a>
                      )}
                    </div>
                    <LivePreview content={examCurrentProblem.statement} />
                  </div>
                  {/* Хариулт сонголт + hint/solution товчнууд — нэг мөрт */}
                  <div ref={examChoicesRef} className="px-2 pb-2 d-flex align-items-center gap-2 flex-wrap">
                    {examCurrentProblem.choices?.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="btn btn-outline-primary btn-sm exam-choice-btn"
                        onClick={async () => {
                          if (textareaRef.current) textareaRef.current.value = c.label;
                          await handleSendChoiceAnswer(c.label);
                        }}
                        disabled={sending}
                      >
                        <strong>{c.label})</strong> <MathJax dynamic inline>{c.value}</MathJax>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-warning btn-sm ms-auto"
                      onClick={handleOpenHint}
                      disabled={sending || aiTyping}
                      title="Зөвлөгөө авах"
                    >
                      💡 Hint
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleOpenSolution}
                      disabled={sending || aiTyping}
                      title="Бодолт харах"
                    >
                      📖 Бодолт
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleSkipProblem}
                      disabled={sending || examSending || !!typewriterMsgId || examProblemIndex >= examProblems.length - 1}
                      title="Алгасах"
                    >
                      ⏭
                    </button>
                  </div>
                  {/* Буруу хариулт сонгосны дараа алдааны тайлбар */}
                  {(wrongChoiceLoading || wrongChoiceExplanation || wrongChoiceFailed) && (
                    <div className="px-3 pb-2">
                      <div
                        className="wrong-choice-explanation border-start border-danger ps-2"
                        style={{ fontSize: '0.82rem', color: '#b00020' }}
                      >
                        {wrongChoiceLoading ? (
                          <span className="text-muted">
                            <span className="spinner-border spinner-border-sm me-1" role="status" />
                            Тайлбарлаж байна...
                          </span>
                        ) : wrongChoiceFailed ? (
                          <span className="text-muted fst-italic">AI багш тайлбар үүсгэж чадсангүй. Бодолтыг харна уу.</span>
                        ) : (
                          <>
                            <LivePreview content={wrongChoiceExplanation} />
                            {wrongChoiceId && (
                              <div className="mt-1 d-flex gap-2">
                                <button
                                  className={`btn btn-link btn-sm p-0 ${choiceRatings[wrongChoiceId] === 'like' ? 'text-success' : 'text-muted'}`}
                                  onClick={() => handleRateChoice(wrongChoiceId, choiceRatings[wrongChoiceId] === 'like' ? null : 'like')}
                                  style={{ fontSize: '0.75rem' }}
                                  title="Таалагдсан"
                                >
                                  <ThumbsUp size={12} fill={choiceRatings[wrongChoiceId] === 'like' ? 'currentColor' : 'none'} className="me-1" />
                                  Таалагдсан
                                </button>
                                <button
                                  className={`btn btn-link btn-sm p-0 ${choiceRatings[wrongChoiceId] === 'dislike' ? 'text-danger' : 'text-muted'}`}
                                  onClick={() => handleRateChoice(wrongChoiceId, choiceRatings[wrongChoiceId] === 'dislike' ? null : 'dislike')}
                                  style={{ fontSize: '0.75rem' }}
                                  title="Таалагдаагүй"
                                >
                                  <ThumbsDown size={12} fill={choiceRatings[wrongChoiceId] === 'dislike' ? 'currentColor' : 'none'} className="me-1" />
                                  Таалагдаагүй
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Previews */}
              {uploadedImages.length > 0 && (
                <div className="uploaded-images-preview">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="preview-image-container">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />

                <div className="input-buttons">
                  <button
                    type="button"
                    className="btn btn-light image-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    title="Зураг оруулах"
                  >
                    <Image size={20} />
                  </button>

                  <div className="emoji-picker-container" ref={emojiPickerRef}>
                    <button
                      type="button"
                      className="btn btn-light emoji-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={sending}
                      title="Emoji нэмэх"
                    >
                      <Smile size={20} />
                    </button>

                    {showEmojiPicker && (
                      <div className="emoji-picker">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            className="emoji-item"
                            onClick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  className="form-control message-textarea"
                  placeholder="Мессеж бичих..."
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                  rows={1}
                />

                <button
                  type="submit"
                  className="btn btn-primary send-btn"
                  disabled={sending}
                >
                  {sending ? <Spinner animation="border" size="sm" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="d-none d-md-flex align-items-center justify-content-center flex-column h-100 text-muted">
            <MessageCircle size={64} className="mb-3" />
            <p>Харилцагчаа сонгоно уу</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        show={showNewConversationModal}
        onHide={() => setShowNewConversationModal(false)}
        onConversationCreated={handleConversationCreated}
      />

      {/* Хөтөлбөрийн агуулга/явц Modal */}
      {otherUser?.ai_program && (
        <ProgramProgressModal
          show={showProgramModal}
          onHide={() => setShowProgramModal(false)}
          programId={otherUser.ai_program.id}
        />
      )}

      {/* ЭЕШ статистик Modal */}
      {showEeshModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEeshModal(false); }}
        >
          <div className="modal-dialog modal-dialog-scrollable modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-bottom-0 pb-1">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <BookOpen size={20} className="text-warning" />
                  {eeshModalStep === 'category' ? 'ЭЕШ бэлдэх — чиглэл сонгох' : 'Сэдэв сонгох'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEeshModal(false)} />
              </div>

              {/* Step indicator */}
              <div className="px-3 pb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <span className={eeshModalStep === 'category' ? 'fw-bold text-warning' : 'text-muted'}>
                  1. Чиглэл
                </span>
                <span className="text-muted mx-1">›</span>
                <span className={eeshModalStep === 'topic' ? 'fw-bold text-warning' : 'text-muted'}>
                  2. Сэдэв
                </span>
              </div>

              <div className="modal-body pt-1">
                {eeshStatsLoading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" className="me-2" />
                    <span className="text-muted">Статистик татаж байна...</span>
                  </div>
                ) : eeshModalStep === 'category' ? (
                  /* ── Step 1: Category selection ── */
                  <>
                    {/* Дасгалын статистик — үргэлж харуулна */}
                    {eeshStats && (() => {
                      const rate = eeshStats.overall_rate || 0;
                      const rateColor = rate >= 0.7 ? 'text-success' : rate >= 0.4 ? 'text-warning' : 'text-danger';
                      const avg = eeshStats.assignment_avg;
                      const lvl = eeshStats.suggested_levels;
                      return (
                        <div className="mb-3">
                          <div className="d-flex gap-2 p-2 bg-light rounded">
                            <div className="text-center flex-fill">
                              <div className="fw-bold">{eeshStats.total_problems}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Нийт</div>
                            </div>
                            <div className="text-center flex-fill">
                              <div className="fw-bold text-success">{eeshStats.total_correct}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Зөв</div>
                            </div>
                            <div className="text-center flex-fill">
                              <div className={`fw-bold ${rateColor}`}>
                                {eeshStats.has_data ? `${Math.round(rate * 100)}%` : '—'}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Амжилт</div>
                            </div>
                            {avg !== null && avg !== undefined && (
                              <div className="text-center flex-fill border-start ps-2">
                                <div className={`fw-bold ${avg < 20 ? 'text-danger' : avg < 25 ? 'text-warning' : avg < 50 ? 'text-primary' : 'text-success'}`}>
                                  {avg}%
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Даалгавар</div>
                              </div>
                            )}
                          </div>
                          {lvl && (
                            <div className="mt-1 px-1" style={{ fontSize: '0.7rem' }}>
                              {lvl.length === 1
                                ? <span className="text-danger">⚠ Зөвхөн <strong>Сэргээн санах</strong> түвшний бодлого санал болгоно</span>
                                : <span className="text-warning">⚠ <strong>Сэргээн санах + Ойлгох</strong> түвшний бодлого санал болгоно</span>
                              }
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <p className="text-muted small mb-2">Дадлага хийх чиглэл сонгох:</p>

                    {/* Category list — practiced + unpracticed categories */}
                    <div className="d-flex flex-column gap-1">
                      {(eeshStats?.category_stats || []).map((cat) => {
                        const practiced = cat.total > 0;
                        const pct = Math.round((cat.success_rate || 0) * 100);
                        const barColor = pct >= 70 ? '#198754' : pct >= 40 ? '#ffc107' : '#dc3545';
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className="btn btn-outline-secondary btn-sm text-start d-flex align-items-center gap-2 w-100"
                            style={{ borderRadius: '8px', padding: '6px 10px' }}
                            onClick={() => handleSelectCategoryForTopics(cat)}
                          >
                            <span
                              style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: cat.color || '#6c757d', flexShrink: 0 }}
                            />
                            <span className="flex-grow-1 small fw-medium">{cat.name_mn || cat.name}</span>
                            {practiced ? (
                              <>
                                <span className="small text-muted">{cat.correct}/{cat.total}</span>
                                <div className="progress flex-shrink-0" style={{ width: 60, height: 6, borderRadius: 3 }}>
                                  <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                                </div>
                                <span className="small" style={{ minWidth: 28, textAlign: 'right', color: barColor }}>{pct}%</span>
                              </>
                            ) : (
                              <span className="small text-muted fst-italic">Бодоогүй</span>
                            )}
                            <span className="text-muted small">›</span>
                          </button>
                        );
                      })}
                      {/* "Any category" option */}
                      <button
                        type="button"
                        className="btn btn-outline-warning btn-sm text-start d-flex align-items-center gap-2 w-100 mt-1"
                        style={{ borderRadius: '8px', padding: '6px 10px' }}
                        onClick={handleStartExamPrep}
                      >
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffc107', flexShrink: 0 }} />
                        <span className="flex-grow-1 small fw-medium">Автоматаар сонгох</span>
                        <span className="text-muted small">
                          {eeshStats?.auto_category_name
                            ? `(${eeshStats.auto_category_name} гэх мэт)`
                            : '(сул сэдвийг тэргүүлнэ)'}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── Step 2: Topic selection within chosen category ── */
                  <>
                    {(() => {
                      const cat = eeshStats?.category_stats?.find(c => c.id === examSelectedCategoryId);
                      return cat ? (
                        <div className="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: cat.color || '#6c757d' }} />
                          <span className="fw-medium small">{cat.name_mn || cat.name}</span>
                          {cat.total > 0 ? (
                            <span className="text-muted small ms-auto">{Math.round((cat.success_rate || 0) * 100)}%</span>
                          ) : (
                            <span className="text-muted small ms-auto fst-italic">Бодоогүй</span>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {eeshTopicsLoading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                        <span className="text-muted ms-2 small">Сэдвүүд татаж байна...</span>
                      </div>
                    ) : eeshTopics.length === 0 ? (
                      <div className="text-center py-3">
                        <p className="text-muted small mb-0">Энэ чиглэлд нэмэлт сэдвийн мэдээлэл байхгүй.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-muted small mb-2">
                          Дадлага хийх сэдэв сонгох
                          <span className="ms-1" style={{ fontSize: '0.72rem' }}>(олон сонгож болно)</span>
                        </p>
                        <div className="d-flex flex-wrap gap-1">
                          {eeshTopics.map((topic) => {
                            const selected = examSelectedTopicIds.has(topic.id);
                            return (
                              <button
                                key={topic.id}
                                type="button"
                                className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: '20px' }}
                                onClick={() => setExamSelectedTopicIds(prev => {
                                  const next = new Set(prev);
                                  if (next.has(topic.id)) next.delete(topic.id);
                                  else next.add(topic.id);
                                  return next;
                                })}
                              >
                                {topic.name}
                                <span className="ms-1 opacity-50" style={{ fontSize: '0.68rem' }}>{topic.problem_count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer border-top-0 pt-0 justify-content-between">
                {eeshModalStep === 'topic' ? (
                  <>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setEeshModalStep('category')}>
                      ‹ Буцах
                    </button>
                    <button className="btn btn-warning btn-sm" onClick={handleStartExamPrep}>
                      <BookOpen size={15} className="me-1" />
                      Бодлого бодох
                      {examSelectedTopicIds.size > 0 && (
                        <span className="badge bg-white text-warning ms-1" style={{ fontSize: '0.7rem' }}>
                          {examSelectedTopicIds.size}
                        </span>
                      )}
                    </button>
                  </>
                ) : (
                  <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={() => setShowEeshModal(false)}>
                    Хаах
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hint Modal ── */}
      {hintModal !== null && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setHintModal(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">💡 Зөвлөгөө</h6>
                <button type="button" className="btn-close btn-sm" onClick={() => setHintModal(null)} />
              </div>
              <div className="modal-body" style={{ minHeight: '80px' }}>
                {hintModal.loading ? (
                  <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                ) : hintModal.hint ? (
                  <LivePreview content={hintModal.hint} />
                ) : (
                  <p className="text-muted mb-0">Зөвлөгөө байхгүй байна.</p>
                )}
              </div>
              <div className="modal-footer py-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setHintModal(null)}>Хаах</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Solution Modal ── */}
      {solutionModal !== null && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={handleSolutionViewed}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title mb-0">📖 Бодолт</h6>
                <button type="button" className="btn-close btn-sm" onClick={handleSolutionViewed} />
              </div>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {solutionModal.loading ? (
                  <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                ) : (solutionModal.choices?.some((c) => c.description) || solutionModal.solution || solutionModal.explanation) ? (
                  <>
                    {solutionModal.choices?.some((c) => c.description) && (
                      <div className="mb-3">
                        {solutionModal.choices.filter((c) => c.description).map((c) => (
                          <div key={c.label} className="mb-3">
                            <div className="fw-semibold small mb-1">
                              <span className={c.default_score > 0 ? 'text-success' : 'text-danger'}>
                                {c.default_score > 0 ? '✓' : '✗'} {c.label})
                              </span>{' '}
                              <span className="text-muted">{c.value}</span>
                            </div>
                            <LivePreview content={c.description} />
                            {c.id && (
                              <div className="mt-1 d-flex gap-2">
                                <button
                                  className={`btn btn-link btn-sm p-0 ${choiceRatings[c.id] === 'like' ? 'text-success' : 'text-muted'}`}
                                  onClick={() => handleRateChoice(c.id, choiceRatings[c.id] === 'like' ? null : 'like')}
                                  title="Таалагдсан"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <ThumbsUp size={13} fill={choiceRatings[c.id] === 'like' ? 'currentColor' : 'none'} className="me-1" />
                                  Таалагдсан
                                </button>
                                <button
                                  className={`btn btn-link btn-sm p-0 ${choiceRatings[c.id] === 'dislike' ? 'text-danger' : 'text-muted'}`}
                                  onClick={() => handleRateChoice(c.id, choiceRatings[c.id] === 'dislike' ? null : 'dislike')}
                                  title="Таалагдаагүй"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <ThumbsDown size={13} fill={choiceRatings[c.id] === 'dislike' ? 'currentColor' : 'none'} className="me-1" />
                                  Таалагдаагүй
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {solutionModal.solution && (
                      <div className={solutionModal.choices?.some((c) => c.description) ? 'mt-3 pt-3 border-top' : ''}>
                        <div className="text-muted small fw-semibold mb-1">Бодолт</div>
                        <LivePreview content={solutionModal.solution} />
                      </div>
                    )}
                    {solutionModal.explanation && (
                      <div className="mt-3 pt-3 border-top">
                        <div className="text-muted small fw-semibold mb-1">Тайлбар</div>
                        <LivePreview content={solutionModal.explanation} />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted mb-0">Бодолт байхгүй байна.</p>
                )}
              </div>
              <div className="modal-footer py-2 d-flex justify-content-between">
                <button className="btn btn-secondary btn-sm" onClick={handleSolutionViewed}>Хаах</button>
                <button className="btn btn-success btn-sm" onClick={handleSolutionViewed}>
                  <Check size={14} className="me-1" />
                  Дараагийн бодлого
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
