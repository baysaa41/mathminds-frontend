// frontend/src/pages/MessagesPage.jsx
// Шинэ Message API ашигласан мессежийн хуудас

import { useState, useEffect, useRef, memo, useCallback, Fragment } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import UserName from '../components/UserName';
import LivePreview from '../components/LivePreview';
import MathText from '../components/MathText';
import { MathJax } from 'better-react-mathjax';
import NewConversationModal from '../components/NewConversationModal';
import ProgramProgressModal from '../components/ProgramProgressModal';
import useChatSocket from '../hooks/useChatSocket';
import { formatMessageTime } from '../utils/dateFormatter';

// Chat UI Kit — bubble/sidebar/input-ийн бүтэц (business logic хэвээр)
import {
  MainContainer,
  ChatContainer,
  ConversationList,
  Conversation,
  Sidebar,
  ConversationHeader,
  MessageList,
  Message,
  TypingIndicator,
  InputToolbox,
  Avatar as ChatAvatar,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

// ViewerJS for image viewing
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

// React Bootstrap компонентууд
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import {
  MessageCircle,
  ArrowLeft,
  Image,
  Send,
  X,
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
  Lock,
  Unlock,
  LayoutDashboard,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Globe,
  Lightbulb,
  SkipForward,
  BookOpenCheck,
} from 'lucide-react';
import Dropdown from 'react-bootstrap/Dropdown';

// Services
import {
  getConversations,
  getConversation,
  getConversationMessages,
  sendMessage,
  createConversation,
  archiveConversation,
  unarchiveConversation,
  closeConversation,
  reopenConversation,
  deleteConversation,
  getEeshProblems,
  generateSimilarProblem,
  getEeshStats,
  getEeshTopics,
  sendExamProblem,
  getProblemHintSolution,
  explainWrongChoice,
  rateMessage,
  rateAnswerChoice,
} from '../services/conversationService';

import './PrivateMessagesPage.css';


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
const MessageBubble = memo(function MessageBubble({ message, currentUserId, onReuse, isTypewriting, onTypewritingDone, rating, onRate }) {
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
    <Message model={{ direction: isSent ? 'outgoing' : 'incoming', position: 'single' }}>
      <Message.CustomContent>
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
            {formatMessageTime(message.created_at)}
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
                onClick={() => onRate(message.uuid, rating === 'like' ? null : 'like')}
                title="Таалагдсан"
                style={{ lineHeight: 1 }}
              >
                <ThumbsUp size={12} fill={rating === 'like' ? 'currentColor' : 'none'} />
              </button>
              <button
                className={`btn btn-link btn-sm p-0 ${rating === 'dislike' ? 'text-danger' : 'text-muted'}`}
                onClick={() => onRate(message.uuid, rating === 'dislike' ? null : 'dislike')}
                title="Таалагдаагүй"
                style={{ lineHeight: 1 }}
              >
                <ThumbsDown size={12} fill={rating === 'dislike' ? 'currentColor' : 'none'} />
              </button>
            </span>
          )}
        </div>
      </Message.CustomContent>
    </Message>
  );
});

// Backend чатын гарчигт дотоод тэмдэг хадгалдаг — "[day:YYYY-MM-DD] " ("Миний өдөр"-ийн
// өдрийн чат) ба "[obj:<id>] " (curriculum зорилтын чат); чатыг гарчгаар нь олоход
// ашигладаг тул хэрэглэгчид харуулахгүй.
const displayTitle = (title) => (title || '').replace(/^\[(day|obj):[^\]]*\]\s*/, '');

// ЭЕШ блок: аль нэг сонголт ийм урт (LaTeX эх текстээр) бол бүх сонголтыг нэг баганаар
// харуулна — нарийн grid-д томьёо тасрахаас сэргийлнэ
const LONG_CHOICE_LEN = 28;

// Жагсаалтын товч агуулга: томьёо/markdown тэмдэгтийг цэвэрлэж нэг мөр болгоно
const PREVIEW_LEN = 60;
const messagePreview = (content) => {
  const text = (content || '')
    .replace(/\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g, ' [томьёо] ')
    .replace(/\$[^$]+\$|\\\([\s\S]*?\\\)/g, '[томьёо]')
    .replace(/\[(pst|img)[^\]]*\][\s\S]*?\[\/\1\]/gi, ' [зураг] ')
    .replace(/(\*\*|__|`|^#+\s*|^>\s*)/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > PREVIEW_LEN ? `${text.slice(0, PREVIEW_LEN)}…` : text;
};

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
  const [uploadedImages, setUploadedImages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingConv, setArchivingConv] = useState(null);
  const [closingConv, setClosingConv] = useState(null);
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
  const [wrongChoiceNeedsUpgrade, setWrongChoiceNeedsUpgrade] = useState(false); // FREE: тайлбар гишүүнчлэл шаардана
  // Бодолт харсны дараа дараагийн бодлого руу шилжих
  const [examSolutionViewed, setExamSolutionViewed] = useState(false);
  // Hint / Solution modal
  const [hintModal, setHintModal] = useState(null); // null | {loading, hint}
  const [solutionModal, setSolutionModal] = useState(null); // null | {loading, solution, explanation}
  // Polling loop-д closure асуудалгүйгээр detect хийх ref
  const examNeedsAiReplyRef = useRef(false);
  // Dashboard-с (navigation state) ирсэн бодлого(ууд) — conversation солигдох
  // reset useEffect-ийн ДАРАА идэвхжүүлэхийн тулд ref-д түр хадгална.
  // Бүтэц: { problems: [...], index: number }
  const pendingExamProblemRef = useRef(null);
  // Бодлого чатад AI мессежээр аль хэдийн нэмэгдсэн эсэх (problem id).
  // Бодлого эхлээд зөвхөн оролтын дээрх ЭЕШ блокт харагдаж, сурагч хариулах
  // үед л чатад нэмэгдэнэ (алгассан бодлого чатыг бөглөхгүй).
  const examPostedProblemIdRef = useRef(null);
  // ЭЕШ бодлогыг чатад шилжүүлэхдээ шууд харуулна (typewriter-гүй) — сурагч бодлогыг
  // блокоос аль хэдийн уншсан. WS мессеж REST хариунаас өмнө ч, хойно ч ирж болох тул
  // илгээж буй үеийн flag + илгээсэн мессежүүдийн uuid-ээр хоёуланг нь таньна.
  // (AI багшийн хариулт typewriter-тэй хэвээр.)
  const postingProblemRef = useRef(false);
  const postedProblemMsgUuidsRef = useRef(new Set());
  // "Миний өдөр"-ийн "Өөр бодлого бодох"-оос ирсэн бол чат сонгогдсоны дараа бодлого санал болгоно
  const pendingSuggestRef = useRef(false);
  const [examAiReplied, setExamAiReplied] = useState(true); // false = AI хариулт хүлээж байна

  // AI харилцагчийн ID — ConversationSerializer user1/user2-д is_ai_teacher оруулдаг тул
  // энд тооцоолж, poll болон render аль алиндаа ашиглана.
  const aiUserId = selectedConversation?.user1?.is_ai_teacher
    ? selectedConversation.user1.id
    : selectedConversation?.user2?.is_ai_teacher
    ? selectedConversation.user2.id
    : null;

  // Refs
  const examChoicesRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const lastMessageIdRef = useRef(0);

  // Stable callback — memo'd MessageBubble re-render хийгдэхгүй
  const handleReuse = useCallback((text) => {
    setInput(text);
  }, []);
  // АНХААР: inline arrow дамжуулбал memo эвдэрч, parent-ийн state солигдох бүрт
  // БҮХ мессеж дахин render + MathJax дахин typeset хийгдэж (100+ мессежтэй чатад)
  // хуудас гацаж, өндөр нь хэлбэлзсэнээс scroll дээш үсэрдэг байсан.
  const handleTypewritingDone = useCallback(() => {
    setTypewriterMsgId(null);
  }, []);

  // Stick-to-bottom: chatscope-ийн autoScrollToBottom нь MathJax/зураг зэрэг
  // ХОЖУУ өндөр өөрчлөгдөхийг хянадаггүй тул хэрэглэгч доод хэсэгт байсан бол
  // контентын өндөр өсөх бүрт доош нь барина.
  useEffect(() => {
    const wrapper = document.querySelector('.cs-message-list__scroll-wrapper');
    if (!wrapper) return undefined;
    let atBottom = true;
    const onScroll = () => {
      atBottom = wrapper.scrollHeight - wrapper.scrollTop - wrapper.clientHeight < 80;
    };
    const stick = () => {
      if (atBottom) wrapper.scrollTop = wrapper.scrollHeight;
    };
    wrapper.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(stick);
    Array.from(wrapper.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(() => {
      Array.from(wrapper.children).forEach((c) => ro.observe(c));
      stick();
    });
    mo.observe(wrapper, { childList: true });
    stick();
    return () => {
      wrapper.removeEventListener('scroll', onScroll);
      ro.disconnect();
      mo.disconnect();
    };
  }, [selectedConversation?.uuid, loadingMessages]);

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
        // Dashboard-ийн "Өнөөдрийн 5 бодлого"-ос ирсэн бол — тэрхэн бодлогуудыг
        // шууд ЭЕШ бэлдэх горимоор (do_ai_chat_reply-ийн автомат үнэлгээтэй) идэвхжүүлнэ.
        // "Дараагийн бодлого" товч ажиллахын тулд examProblems жагсаалт бүхэлдээ хэрэгтэй.
        const startExamProblems = location.state?.startExamProblems;
        const startExamIndex = location.state?.startExamIndex ?? 0;
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
          if (startExamProblems && startExamProblems.length) {
            // selectedConversation солигдоход exam state-г reset хийдэг useEffect
            // дараа нь ажиллах тул шууд биш ref-ээр дамжуулж, тэрхэн effect-ийн
            // төгсгөлд идэвхжүүлнэ (эс тэгвээс reset нь үүнийг шууд дарж бичнэ).
            pendingExamProblemRef.current = { problems: startExamProblems, index: startExamIndex };
          }
          if (location.state?.suggestProblem) pendingSuggestRef.current = true;
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

    // Conversation солигдохыг input цэвэрлэх
    setInput('');

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
    setWrongChoiceFailed(false); setWrongChoiceNeedsUpgrade(false);
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
    examPostedProblemIdRef.current = null;

    // Dashboard-ийн "Өнөөдрийн 5 бодлого"-ос ирсэн бол — reset-ийн дараа шууд
    // идэвхжүүлнэ (эс тэгвээс дээрх reset нь энэ горимыг шууд унтраадаг байсан).
    // examProblems-г бүхэлд нь (зөвхөн 1 биш) тохируулснаар "Дараагийн бодлого"
    // товч dashboard-ийн 5 бодлогыг chat дотроосоо дараалуулж чадна.
    if (pendingExamProblemRef.current) {
      const { problems, index } = pendingExamProblemRef.current;
      pendingExamProblemRef.current = null;
      setExamPrepMode(true);
      setExamProblems(problems);
      setExamProblemIndex(index);
      setExamCurrentProblem(problems[index]);
      setExamAnswered(false);
      setExamLastCorrect(null);
      setExamAiReplied(true);
    }
    if (pendingSuggestRef.current && selectedConversation) {
      pendingSuggestRef.current = false;
      handleSuggestedProblem();
    }
  }, [selectedConversation?.uuid]);


  // AI мессежэд like/dislike
  // Хамаарлыг ref-ээр уншиж callback-ийг тогтвортой байлгана (MessageBubble memo)
  const rateCtxRef = useRef({});
  rateCtxRef.current = { messageRatings, examPrepMode, examCurrentProblem, examProblems, examProblemIndex };
  const handleRateMessage = useCallback(async (messageUuid, rating) => {
    const { messageRatings, examPrepMode, examCurrentProblem, examProblems, examProblemIndex } = rateCtxRef.current;
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
  }, []);

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

  const ensureProblemPosted = async (prob) => {
    if (!prob || !selectedConversation || examPostedProblemIdRef.current === prob.id) return;
    postingProblemRef.current = true;
    let problemMsg;
    try {
      problemMsg = await sendExamProblem(selectedConversation.uuid, prob.id);
    } finally {
      postingProblemRef.current = false;
    }
    examPostedProblemIdRef.current = prob.id;
    if (problemMsg?.uuid) postedProblemMsgUuidsRef.current.add(problemMsg.uuid);
    if (problemMsg?.id) {
      setMessages((prev) => (prev.some((m) => m.id === problemMsg.id) ? prev : [...prev, problemMsg]));
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, problemMsg.id);
    }
  };

  // Бодлогыг ЭЕШ блокт харуулах (чатад хараахан нэмэхгүй, зөвхөн "харуулсан" гэж бүртгэнэ)
  const sendProblemToChat = async (problems, index) => {
    const prob = problems[index];
    if (!prob || !selectedConversation) return;
    setExamSending(true);
    try {
      const recorded = await sendExamProblem(selectedConversation.uuid, prob.id, { recordOnly: true });
      examPostedProblemIdRef.current = null;
      // Жагсаалт татсаны дараа background-д үүссэн AI товч гарчгийг авна
      setExamCurrentProblem(recorded?.ai_summary ? { ...prob, ai_summary: recorded.ai_summary } : prob);
      setExamProblemIndex(index);
      setExamAnswered(false);
      setExamLastCorrect(null);
      setWrongChoiceExplanation(null);
      setWrongChoiceLoading(false);
      setWrongChoiceFailed(false); setWrongChoiceNeedsUpgrade(false);
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

  // Сурагч чатаар шинэ бодлого хүссэн (backend-ийн 'suggest_problem' WS event) —
  // AI бодлого зохиож текстээр бичихийн оронд DB-ийн бодлогыг widget-ээр харуулна.
  // ЭЕШ горим идэвхтэй бол дараагийн бодлого, эс бөгөөс одоогийн категорийг
  // (байвал) хадгалж eesh-problems алгоритмаар шинэ жагсаалт татна.
  const handleSuggestedProblem = async () => {
    if (examSending) return;
    if (examPrepMode && examProblemIndex + 1 < examProblems.length) {
      await sendProblemToChat(examProblems, examProblemIndex + 1);
      return;
    }
    const catIds = examCurrentProblem?.category_id ? [examCurrentProblem.category_id] : [];
    // Чатад аль хэдийн гарсан бодлогыг backend (ChatShownProblem) хасна — энд
    // одоогийн жагсаалтынхыг давхар хасаж, сэдэвт шинэ бодлого дуусвал AI-аар төстэйг үүсгэнэ.
    const seen = new Set(examProblems.map((p) => p.id));
    if (examCurrentProblem?.id) seen.add(examCurrentProblem.id);
    try {
      let data = await getEeshProblems('math', 20, catIds, []);
      let problems = (data.problems || []).filter((p) => !seen.has(p.id));
      if (!problems.length) {
        setExamPrepMode(true);
        setExamSending(true);
        try {
          const gen = await generateSimilarProblem(examCurrentProblem?.id ?? null, 'math');
          if (gen?.problem) problems = [gen.problem];
        } catch (e) {
          console.error('Төстэй бодлого үүсгэхэд алдаа:', e);
        } finally {
          setExamSending(false);
        }
      }
      if (!problems.length && catIds.length) {
        data = await getEeshProblems('math', 20, [], []);
        problems = (data.problems || []).filter((p) => !seen.has(p.id));
      }
      if (!problems.length) return;
      setExamPrepMode(true);
      setExamProblems(problems);
      await sendProblemToChat(problems, 0);
    } catch (e) {
      console.error('Санал болгох бодлого татахад алдаа:', e);
    }
  };

  // Одоогийн бодлогыг алгасаж дараагийн рүү шилжих
  const handleSkipProblem = async () => {
    if (examSending || typewriterMsgId) return;
    const nextIndex = examProblemIndex + 1;
    if (nextIndex >= examProblems.length) return;
    await sendProblemToChat(examProblems, nextIndex);
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
      setWrongChoiceFailed(false); setWrongChoiceNeedsUpgrade(false);
      setExamAiReplied(false);
      examNeedsAiReplyRef.current = true;
    } else {
      // Буруу: хариулт сонгох товч хэвээр, алдааны тайлбар авах
      setWrongChoiceExplanation(null);
      setWrongChoiceId(null);
      setWrongChoiceFailed(false); setWrongChoiceNeedsUpgrade(false);
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
            } else if (data.source === 'no_access') {
              setWrongChoiceNeedsUpgrade(true);
            } else {
              setWrongChoiceFailed(true);
            }
          })
          .catch((err) => { console.error('explainWrongChoice алдаа:', err); setWrongChoiceFailed(true); })
          .finally(() => setWrongChoiceLoading(false));
      }
    }

    try {
      setSending(true);
      await ensureProblemPosted(problemRef);
    } catch (err) {
      console.error('Бодлогыг чатад нэмэхэд алдаа:', err);
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
      setInput('');
    }
  };

  // Realtime: шинэ мессеж + AI typing status WebSocket-оор (poll-ийг орлосон).
  // Хүн-хүний чатад ч, AI чатад ч адилхан ажиллана — хуучин зөвхөн AI-д
  // хязгаарлагдаж байсан polling-ээс ялгаатай.
  useChatSocket(selectedConversation?.uuid, {
    active: !!selectedConversation,
    onEvent: (evt) => {
      if (evt.type === 'typing') {
        setAiTyping(!!evt.typing)
        return
      }
      if (evt.type === 'error') {
        setAiTyping(false)
        return
      }
      if (evt.type === 'suggest_problem') {
        setAiTyping(false)
        handleSuggestedProblem()
        return
      }
      if (evt.type !== 'message' || !evt.message) return

      const incoming = evt.message
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev
        // Өөрийн илгээсэн мессеж REST-ийн хариунаас өмнө WS-ээр эргэж ирж
        // болзошгүй тул — ижил зохиогч+агуулгатай хүлээгдэж буй optimistic
        // мессежийг олоод шууд сольж, давхардуулахгүй.
        const optimisticIdx = prev.findIndex(
          (m) => m._isOptimistic && m.author?.id === incoming.author?.id && m.content === incoming.content
        )
        if (optimisticIdx !== -1) {
          const next = [...prev]
          next[optimisticIdx] = incoming
          return next
        }
        return [...prev, incoming]
      })
      if (incoming.id) lastMessageIdRef.current = Math.max(lastMessageIdRef.current, incoming.id)
      // AI мессеж ирвэл typewriter эффект эхлүүлнэ (ЭЕШ бодлогыг чатад нэмж буй мессежээс бусад)
      const isPostedProblem = postingProblemRef.current
        || postedProblemMsgUuidsRef.current.has(incoming.uuid)
      if (aiUserId && incoming.author?.id === aiUserId && !isPostedProblem) {
        setAiTyping(false)
        setTypewriterMsgId(incoming.uuid)
        // Зөв хариулсны дараа багшийн хариулт ирсэн → товч харуулна
        if (examNeedsAiReplyRef.current) {
          examNeedsAiReplyRef.current = false
          setExamAiReplied(true)
        }
      }
    },
  })

  // Scroll to bottom — MessageList-ийн autoScrollToBottom prop хариуцна.


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
    setInput((prev) => prev + emoji);
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
  const handleSendMessage = async () => {
    const inputText = input.trim()
    if (!inputText && uploadedImages.length === 0) return
    if (!selectedConversation) return

    // ЭЕШ блокийн бодлогод бичгээр хариулж байвал — эхлээд бодлогыг чатад нэмнэ
    if (examPrepMode && !examAnswered && examCurrentProblem) {
      try {
        await ensureProblemPosted(examCurrentProblem)
      } catch (err) {
        console.error('Бодлогыг чатад нэмэхэд алдаа:', err)
      }
    }

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
    setInput('')
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
      setInput(inputText)
      console.error('Error sending message:', err)
      const errorData = err.response?.data
      const errorMsg = typeof errorData === 'string' ? errorData : JSON.stringify(errorData)
      alert(`Мессеж илгээхэд алдаа гарлаа: ${errorMsg || err.message}`)
    } finally {
      setSending(false)
    }
  }

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

  // Close conversation (нийтэд харагдахгүй болгох)
  const handleClose = async (conv) => {
    if (!window.confirm('Харилцан яриаг хаах уу? Хаасны дараа зөвхөн та хоёр болон админ харах боломжтой болно.')) return;
    try {
      setClosingConv(conv.uuid);
      const { conversation } = await closeConversation(conv.uuid);
      setSelectedConversation((prev) => (prev?.uuid === conv.uuid ? conversation : prev));
      setConversations((prev) => prev.map((c) => (c.uuid === conv.uuid ? conversation : c)));
    } catch (err) {
      console.error('Error closing conversation:', err);
      alert('Хаахад алдаа гарлаа.');
    } finally {
      setClosingConv(null);
    }
  };

  // Reopen conversation (дахин нийтэд нээх)
  const handleReopen = async (conv) => {
    try {
      setClosingConv(conv.uuid);
      const { conversation } = await reopenConversation(conv.uuid);
      setSelectedConversation((prev) => (prev?.uuid === conv.uuid ? conversation : prev));
      setConversations((prev) => prev.map((c) => (c.uuid === conv.uuid ? conversation : c)));
    } catch (err) {
      console.error('Error reopening conversation:', err);
      alert('Дахин нээхэд алдаа гарлаа.');
    } finally {
      setClosingConv(null);
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

  const stopExam = () => {
    setExamPrepMode(false);
    setExamProblems([]);
    setExamProblemIndex(0);
    setExamCurrentProblem(null);
    setExamAnswered(false);
    setExamLastCorrect(null);
    setExamSolutionViewed(false);
  };

  return (
    <MainContainer responsive className="private-messages-container">
      {/* Conversations List */}
      <Sidebar
        position="left"
        className={`conversations-sidebar ${selectedConversation ? 'd-none d-md-flex' : ''}`}
      >
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

        <ConversationList>
          {conversations
            .filter((c) => showArchived ? c.is_archived_by_user : !c.is_archived_by_user)
            .map((conversation) => {
            const partner = getOtherUser(conversation);
            const lastMsg = conversation.last_message;
            const unreadCount = conversation.unread_count || 0;

            return (
              <Conversation
                key={conversation.uuid}
                name={displayTitle(conversation.title) || <UserName user={partner} showLink={false} />}
                info={lastMsg ? messagePreview(lastMsg.content) : undefined}
                lastActivityTime={lastMsg ? formatMessageTime(lastMsg.created_at) : undefined}
                unreadCnt={unreadCount}
                active={selectedConversation?.uuid === conversation.uuid}
                onClick={() => setSelectedConversation(conversation)}
              >
                <ChatAvatar size="fluid">
                  <UserAvatar user={partner} size={48} />
                </ChatAvatar>
                <Conversation.Operations visible>
                  <button
                    className="btn btn-sm btn-link text-danger p-0"
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
                </Conversation.Operations>
              </Conversation>
            );
          })}
        </ConversationList>
      </Sidebar>

      {/* Chat Area */}
      <div className={`chat-area ${!selectedConversation ? 'd-none d-md-flex' : ''}`}>
        {selectedConversation ? (
          <>
            {/* ChatContainer нь зөвхөн ConversationHeader/MessageList/MessageInput/
                InputToolbox төрлийн children-г таньдаг (бусдыг шүүж хаядаг) тул
                hidden file input-ыг гадна нь байрлуулна. */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <ChatContainer>
            {/* Chat Header */}
            <ConversationHeader>
              <ConversationHeader.Back>
                <button
                  className="btn btn-link d-md-none p-0"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft size={20} />
                </button>
              </ConversationHeader.Back>
              <ChatAvatar size="fluid">
                <UserAvatar user={otherUser} size={40} />
              </ChatAvatar>
              <ConversationHeader.Content
                userName={displayTitle(selectedConversation.title) || <UserName user={otherUser} showLink={false} />}
                info={
                  <span className="d-inline-flex align-items-center gap-2 flex-wrap">
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/profile/${otherUser?.username}`)}
                    >
                      {/* AI загварын нэрийг (DeepSeek г.м.) хэрэглэгчид харуулахгүй */}
                      {otherUser?.is_ai_teacher ? 'AI багш' : `@${otherUser?.username}`}
                    </span>
                    {selectedConversation?.is_closed ? (
                      <span className="conv-status" title="Энэ харилцаа хаагдсан">
                        <Lock size={11} /> Хаагдсан
                      </span>
                    ) : (
                      <span className="conv-status" title="Энэ харилцааг бусад хэрэглэгчид харах боломжтой">
                        <Globe size={11} /> Нийтэд нээлттэй
                      </span>
                    )}
                  </span>
                }
              />
              <ConversationHeader.Actions>
                <div className="d-flex align-items-center gap-2">
                  {aiOnly && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => navigate('/dashboard')}
                      title="Миний өдөр рүү буцах"
                    >
                      <LayoutDashboard size={16} />
                      <span className="d-none d-md-inline ms-1">Миний өдөр</span>
                    </button>
                  )}
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
                  <Dropdown align="end">
                    <Dropdown.Toggle
                      variant="light"
                      size="sm"
                      className="conv-menu-toggle"
                      title="Бусад үйлдэл"
                      disabled={closingConv === selectedConversation?.uuid || archivingConv === selectedConversation?.uuid || deletingConv === selectedConversation?.uuid}
                    >
                      {(closingConv === selectedConversation?.uuid || archivingConv === selectedConversation?.uuid || deletingConv === selectedConversation?.uuid) ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <MoreVertical size={16} />
                      )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} className="conv-menu shadow-sm">
                      <Dropdown.Item onClick={() => navigate(`/profile/${otherUser?.username}`)}>
                        <User size={15} /> Профайл харах
                      </Dropdown.Item>
                      <Dropdown.Item onClick={copyConversationLink}>
                        {linkCopied ? <Check size={15} /> : <Link2 size={15} />}
                        {linkCopied ? ' Хуулагдлаа' : ' Линк хуулах'}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => (selectedConversation?.is_closed
                          ? handleReopen(selectedConversation)
                          : handleClose(selectedConversation))}
                      >
                        {selectedConversation?.is_closed
                          ? <><Unlock size={15} /> Дахин нээх</>
                          : <><Lock size={15} /> Хаах</>}
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => (selectedConversation?.is_archived_by_user
                          ? handleUnarchive(selectedConversation)
                          : handleArchive(selectedConversation))}
                      >
                        {selectedConversation?.is_archived_by_user
                          ? <><ArchiveRestore size={15} /> Архиваас гаргах</>
                          : <><Archive size={15} /> Архивлах</>}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className="text-danger" onClick={() => handleDelete(selectedConversation)}>
                        <Trash2 size={15} /> Устгах
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </ConversationHeader.Actions>
            </ConversationHeader>

            {/* Messages */}
            <MessageList
              typingIndicator={
                (aiTyping || !examAiReplied) && !typewriterMsgId ? (
                  <TypingIndicator content="Бодож байна..." />
                ) : undefined
              }
              autoScrollToBottom
              autoScrollToBottomOnMount
            >
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
                const lastAiMsgUuid = showExamNext
                  ? [...messages].reverse().find((m) => aiUserId && m.author?.id === aiUserId)?.uuid
                  : null;
                return messages.map((message) => (
                  <Fragment key={message.uuid}>
                    <MessageBubble
                      message={message}
                      currentUserId={user?.id}
                      onReuse={handleReuse}
                      isTypewriting={message.uuid === typewriterMsgId}
                      onTypewritingDone={handleTypewritingDone}
                      rating={messageRatings[message.uuid] ?? message.my_rating ?? null}
                      onRate={isAiConv(selectedConversation) ? handleRateMessage : null}
                    />
                    {message.uuid === lastAiMsgUuid && showExamNext && (
                      <div className="exam-inline-actions">
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
                  </Fragment>
                ));
              })()}
            </MessageList>

            {/* Message Input */}
            <InputToolbox className="chat-input-area">
              {/* ЭЕШ: дараагийн бодлого ачаалж байна */}
              {examPrepMode && examSending && (
                <div className="exam-loading-bar">
                  <Spinner animation="border" size="sm" />
                  <span>Бодлого ачаалж байна...</span>
                </div>
              )}
              {/* ЭЕШ: бодлогын өгүүлбэр + хариулт сонголт + товчнууд — нэг блокт */}
              {examPrepMode && examCurrentProblem && !examAnswered && !examSolutionViewed && !examSending && (
                <div className="exam-problem-block">
                  <div className="exam-problem-card">
                    {/* Толгой: гарчиг + түвшин/сэдэв + дугаар */}
                    <div className="exam-problem-head">
                      <MathText className="exam-problem-title">
                        {examCurrentProblem.ai_summary || examCurrentProblem.title || `Бодлого #${examCurrentProblem.id}`}
                      </MathText>
                      {examCurrentProblem.level_name && (() => {
                        const mnName = examCurrentProblem.level_name.replace(/\s*\(.*?\)/, '').trim();
                        const levelColors = { 1: '#198754', 2: '#0dcaf0', 3: '#0d6efd', 4: '#ffc107', 5: '#fd7e14', 6: '#dc3545' };
                        const levelTextColors = { 4: '#000', 5: '#fff' };
                        const bg = levelColors[examCurrentProblem.level_id] || '#6c757d';
                        const color = levelTextColors[examCurrentProblem.level_id] || '#fff';
                        return (
                          <span className="exam-chip" style={{ background: bg, color }} title={examCurrentProblem.level_name}>
                            {mnName}
                          </span>
                        );
                      })()}
                      {examCurrentProblem.topic_name && (
                        <MathText className="exam-chip exam-chip-muted">{examCurrentProblem.topic_name}</MathText>
                      )}
                      {examCurrentProblem.is_eesh && (
                        <span className="exam-chip" style={{ background: '#e8a700', color: '#000' }}>ЭЕШ жишиг</span>
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
                      {examProblems.length > 1 && (
                        <span className="exam-problem-counter" title="Энэ цувралын хэддүгээр бодлого">
                          {examProblemIndex + 1}/{examProblems.length}
                        </span>
                      )}
                    </div>

                    {/* Өгүүлбэр */}
                    <div className="exam-problem-statement">
                      <LivePreview content={examCurrentProblem.statement} />
                    </div>

                    {/* Хариулт сонголт */}
                    <div
                      ref={examChoicesRef}
                      className={`exam-choices${
                        examCurrentProblem.choices?.some((c) => (c.value || '').length > LONG_CHOICE_LEN) ? ' is-long' : ''
                      }`}
                    >
                      {examCurrentProblem.choices?.length ? (
                        examCurrentProblem.choices.map((c) => (
                          <button
                            key={c.label}
                            type="button"
                            className={`exam-choice-btn${wrongChoiceId && c.id === wrongChoiceId ? ' is-wrong' : ''}`}
                            onClick={() => handleSendChoiceAnswer(c.label)}
                            disabled={sending}
                          >
                            <span className="exam-choice-label">{c.label}</span>
                            <MathJax dynamic inline>{c.value}</MathJax>
                          </button>
                        ))
                      ) : (
                        <span className="exam-fill-hint">
                          Хариултаа доорх талбарт бичээд илгээнэ үү.
                        </span>
                      )}
                    </div>

                    {/* Туслах товчнууд */}
                    <div className="exam-tools">
                      <button
                        type="button"
                        className="exam-tool-btn text-warning-emphasis"
                        onClick={handleOpenHint}
                        disabled={sending || aiTyping}
                        title="Зөвлөгөө авах"
                      >
                        <Lightbulb size={14} /><span>Зөвлөгөө</span>
                      </button>
                      <button
                        type="button"
                        className="exam-tool-btn"
                        onClick={handleOpenSolution}
                        disabled={sending || aiTyping}
                        title="Бодолт харах"
                      >
                        <BookOpenCheck size={14} /><span>Бодолт</span>
                      </button>
                      <span className="flex-grow-1" />
                      <button
                        type="button"
                        className="exam-tool-btn"
                        onClick={handleSkipProblem}
                        disabled={sending || examSending || !!typewriterMsgId || examProblemIndex >= examProblems.length - 1}
                        title="Энэ бодлогыг алгасах"
                      >
                        <SkipForward size={14} /><span>Алгасах</span>
                      </button>
                      <button
                        type="button"
                        className="exam-tool-btn"
                        onClick={stopExam}
                        disabled={examSending}
                        title="ЭЕШ горимоос гарах"
                      >
                        <X size={14} /><span>Болих</span>
                      </button>
                    </div>
                  {/* Буруу хариулт сонгосны дараа алдааны тайлбар */}
                  {(wrongChoiceLoading || wrongChoiceExplanation || wrongChoiceFailed || wrongChoiceNeedsUpgrade) && (
                    <div className="exam-wrong-explanation-wrap">
                      <div
                        className="wrong-choice-explanation border-start border-danger ps-2"
                        style={{ fontSize: '0.82rem', color: '#b00020' }}
                      >
                        {wrongChoiceLoading ? (
                          <span className="text-muted">
                            <span className="spinner-border spinner-border-sm me-1" role="status" />
                            Тайлбарлаж байна...
                          </span>
                        ) : wrongChoiceNeedsUpgrade ? (
                          <span>
                            Буруу сонголтын AI тайлбар гишүүнчлэлтэй хэрэглэгчид нээлттэй.{' '}
                            <Link to="/membership" className="fw-semibold">Гишүүнчлэл авах →</Link>
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

            </InputToolbox>
            </ChatContainer>

            {/* Зураг оруулах + Emoji + мессеж бичих талбар + илгээх — бүгд НЭГ мөрт
                (chatscope-ийн MessageInput нь өөрийн мөрөндөө нэмэлт товч
                зөвшөөрдөггүй тул энэ мөрийг өөрсдөө барьж, ChatContainer-ийн
                гадна байрлуулав — эс тэгвээс ChatContainer танихгүй
                элементийг шүүж хаяна, file input-той адил асуудал гарна). */}
            <form
              className="message-input-form"
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            >
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
                className="form-control message-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Мессеж бичих..."
                disabled={sending}
                rows={1}
              />

              <button
                type="submit"
                className="btn btn-primary send-btn"
                disabled={sending || (!input.trim() && uploadedImages.length === 0)}
              >
                {sending ? <Spinner animation="border" size="sm" /> : <Send size={20} />}
              </button>
            </form>
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
                  {eeshModalStep === 'category' ? 'ЭЕШ бэлдэх — сэдэв сонгох' : 'Дэд сэдэв сонгох'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEeshModal(false)} />
              </div>

              {/* Step indicator */}
              <div className="px-3 pb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <span className={eeshModalStep === 'category' ? 'fw-bold text-warning' : 'text-muted'}>
                  1. Сэдэв
                </span>
                <span className="text-muted mx-1">›</span>
                <span className={eeshModalStep === 'topic' ? 'fw-bold text-warning' : 'text-muted'}>
                  2. Дэд сэдэв
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
                    {/* Автоматаар сонгох — хамгийн дээр (статистикийн өмнө) */}
                    <button
                      type="button"
                      className="btn btn-warning btn-sm text-start d-flex align-items-center gap-2 w-100 mb-3"
                      style={{ borderRadius: '8px', padding: '6px 10px' }}
                      onClick={handleStartExamPrep}
                    >
                      <Zap size={14} className="flex-shrink-0" />
                      <span className="flex-grow-1 small fw-medium">Автоматаар сонгох</span>
                      <span className="small" style={{ opacity: 0.75 }}>
                        {eeshStats?.auto_category_name
                          ? `(${eeshStats.auto_category_name} гэх мэт)`
                          : '(сул сэдвийг тэргүүлнэ)'}
                      </span>
                    </button>
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
                    <p className="text-muted small mb-2">Эсвэл дадлага хийх сэдвээ сонгоно уу:</p>

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
                          Дадлага хийх дэд сэдэв сонгох
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
    </MainContainer>
  );
};

export default MessagesPage;
