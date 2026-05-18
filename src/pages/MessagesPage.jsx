// frontend/src/pages/MessagesPage.jsx
// Шинэ Message API ашигласан мессежийн хуудас

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import UserName from '../components/UserName';
import LivePreview from '../components/LivePreview';
import NewConversationModal from '../components/NewConversationModal';

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
const MessageBubble = memo(function MessageBubble({ message, currentUserId, onReuse, isTypewriting, onTypewritingDone, onTypewritingStart }) {
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
        <div className="message-time d-flex align-items-center gap-1">
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

  // Refs
  const messagesEndRef = useRef(null);
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
          const aiMsg = [...data.messages].reverse().find((m) => m.author?.is_ai_teacher)
          if (aiMsg?.uuid) {
            setTypewriterStarted(false)
            setTypewriterMsgId(aiMsg.uuid)
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

    try {
      setSending(true)

      const sentMessage = await sendMessage({
        conversationUuid: selectedConversation.uuid,
        content: inputText,
        attachments: uploadedImages,
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
    // AI чат хуудаснаас ирсэн бол багш сонгох хуудас руу буцаана
    if (aiOnly) {
      navigate('/ai-chat', { replace: true });
      return null;
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
                to="/ai-chat"
                className="btn btn-sm btn-primary"
                title="Шинэ AI багш сонгох"
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
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.uuid}
                    message={message}
                    currentUserId={user?.id}
                    onReuse={handleReuse}
                    isTypewriting={message.uuid === typewriterMsgId}
                    onTypewritingDone={() => { setTypewriterMsgId(null); setTypewriterStarted(false); }}
                    onTypewritingStart={() => setTypewriterStarted(true)}
                  />
                ))
              )}
              {/* AI typing indicator */}
              {(aiTyping || (typewriterMsgId && !typewriterStarted)) && (
                <div className="message received ai-thinking-row">
                  <div className="message-bubble ai-thinking-bubble">
                    <span className="ai-thinking-icon">🧠</span>
                    <span className="ai-thinking-text">Бодож байна</span>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-area">
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
    </div>
  );
};

export default MessagesPage;
