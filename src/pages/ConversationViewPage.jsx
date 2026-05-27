// frontend/src/pages/ConversationViewPage.jsx
// Нийтэд нээлттэй харилцан яриа харах хуудас
// - Нэвтрэлтгүй хэрэглэгч: read-only
// - Нэвтэрсэн гишүүн: /messages эсвэл /ai-chat руу redirect

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getConversation, getConversationMessages } from '../services/conversationService';
import UserAvatar from '../components/UserAvatar';
import LivePreview from '../components/LivePreview';
import Spinner from 'react-bootstrap/Spinner';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';

const openImageViewer = (e) => {
  const img = e.currentTarget;
  const viewer = new Viewer(img, {
    inline: false,
    navbar: false,
    title: false,
    toolbar: { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, rotateLeft: 1, rotateRight: 1 },
    hidden() { viewer.destroy(); },
  });
  viewer.show();
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  if (diffInHours < 24) {
    return date.toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Өчигдөр';
  }
  return date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
};

const isAiConv = (conv) => conv?.user1?.is_ai_teacher || conv?.user2?.is_ai_teacher;

const ConversationViewPage = () => {
  const { conversationUuid } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const conv = await getConversation(conversationUuid);
        if (cancelled) return;
        setConversation(conv);

        // Logged-in participant → redirect immediately, no need to load messages
        if (user) {
          const isParticipant =
            conv.user1?.id === user.id || conv.user2?.id === user.id;
          if (isParticipant) {
            const dest = isAiConv(conv) ? '/ai-chat/messages' : '/messages';
            navigate(dest, { replace: true, state: { conversationUuid } });
            return;
          }
        }

        // Public read-only view — also load messages
        const msgData = await getConversationMessages(conversationUuid);
        if (cancelled) return;
        setMessages(msgData.messages || []);
      } catch {
        if (!cancelled) setError('Харилцан яриа олдсонгүй эсвэл устгагдсан байна.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [conversationUuid, user, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5" style={{ maxWidth: '700px' }}>
        <Alert variant="danger">{error}</Alert>
        <Link to="/" className="btn btn-primary">Нүүр хуудас</Link>
      </Container>
    );
  }

  const user1 = conversation?.user1;
  const user2 = conversation?.user2;

  return (
    <Container className="my-4" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <Card className="shadow-sm border-0 mb-3">
        <Card.Header className="bg-light p-3 border-0">
          <div className="d-flex align-items-center gap-3">
            <UserAvatar user={user1} size={40} />
            <div className="fw-bold">
              {user1?.first_name || user1?.username}
            </div>
            <span className="text-muted">↔</span>
            <UserAvatar user={user2} size={40} />
            <div className="fw-bold">
              {user2?.first_name || user2?.username}
            </div>
            <Badge bg="secondary" className="ms-auto">
              Нийтэд нээлттэй
            </Badge>
          </div>
          {!user && (
            <div className="mt-2 small text-muted">
              <Link to="/login">Нэвтрэх</Link>-ээр харилцан ярианд оролцох боломжтой.
            </div>
          )}
        </Card.Header>
      </Card>

      {/* Messages */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted py-5">Мессеж байхгүй байна.</div>
            ) : (
              messages.map((message) => {
                const isByUser1 = message.author?.id === user1?.id;
                return (
                  <div
                    key={message.uuid}
                    className={`d-flex gap-2 mb-3 ${isByUser1 ? '' : 'flex-row-reverse'}`}
                  >
                    <UserAvatar user={message.author} size={32} />
                    <div style={{ maxWidth: '75%' }}>
                      <div
                        className={`rounded-3 px-3 py-2 ${
                          isByUser1 ? 'bg-light' : 'bg-primary text-white'
                        }`}
                      >
                        <div className={`small fw-semibold mb-1 ${isByUser1 ? 'text-muted' : 'text-white-50'}`}>
                          {message.author?.first_name || message.author?.username}
                        </div>
                        <LivePreview content={message.content} />
                        {message.attachments?.map((att) => (
                          <img
                            key={att.id}
                            src={att.file}
                            alt=""
                            className="mt-2 rounded"
                            onClick={openImageViewer}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', cursor: 'pointer' }}
                            title="Томруулж харах"
                          />
                        ))}
                      </div>
                      <div className={`small text-muted mt-1 ${isByUser1 ? '' : 'text-end'}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ConversationViewPage;
