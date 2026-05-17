// src/pages/AdminConversationPage.jsx
// Admin: AI багштай ярилцлагын мессежүүдийг харах (redirect хийхгүй)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { ChevronLeft, Bot, User } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import LivePreview from '../components/LivePreview';
import UserAvatar from '../components/UserAvatar';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

export default function AdminConversationPage() {
  const { conversationUuid } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [convRes, msgRes] = await Promise.all([
        axiosInstance.get(`/api/minds/conversations/${conversationUuid}/`),
        axiosInstance.get(`/api/minds/messages/conversation/${conversationUuid}/`),
      ]);
      setConversation(convRes.data);
      setMessages(msgRes.data.messages || []);
    } catch {
      setError('Ярилцлага олдсонгүй эсвэл хандах эрх байхгүй байна.');
    } finally {
      setLoading(false);
    }
  }, [conversationUuid]);

  useEffect(() => { load(); }, [load]);

  const user1 = conversation?.user1;
  const user2 = conversation?.user2;
  const aiUser = user1?.is_ai_teacher ? user1 : user2;
  const humanUser = user1?.is_ai_teacher ? user2 : user1;

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4" style={{ maxWidth: 760 }}>
        <Alert variant="danger">{error}</Alert>
        <Link to="/admin/ai-conversations" className="btn btn-outline-secondary btn-sm">
          <ChevronLeft size={16} className="me-1" />
          Буцах
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 760 }}>
      {/* Back + header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <Link to="/admin/ai-conversations" className="btn btn-outline-secondary btn-sm">
          <ChevronLeft size={16} className="me-1" />
          Буцах
        </Link>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="d-flex align-items-center gap-1">
            <User size={16} className="text-muted" />
            <span className="fw-semibold">{humanUser?.first_name || humanUser?.username}</span>
            <span className="text-muted small">@{humanUser?.username}</span>
          </div>
          <span className="text-muted">↔</span>
          <div className="d-flex align-items-center gap-1">
            <Bot size={16} className="text-primary" />
            <span className="fw-semibold text-primary">
              {aiUser?.ai_name_mn || aiUser?.first_name || aiUser?.username}
            </span>
          </div>
          <Badge bg="secondary" className="fw-normal">{messages.length} мессеж</Badge>
        </div>
        <span className="text-muted small ms-auto">{formatTime(conversation?.created_at)}</span>
      </div>

      {/* Messages */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '16px' }}>
            {messages.length === 0 ? (
              <div className="text-center text-muted py-5">Мессеж байхгүй байна.</div>
            ) : (
              messages.map((msg) => {
                const isAi = msg.author?.id === aiUser?.id;
                return (
                  <div
                    key={msg.id || msg.uuid}
                    className={`d-flex gap-2 mb-3 ${isAi ? '' : 'flex-row-reverse'}`}
                  >
                    <UserAvatar user={msg.author} size={32} />
                    <div style={{ maxWidth: '75%' }}>
                      <div className={`rounded-3 px-3 py-2 ${isAi ? 'bg-light' : 'bg-primary text-white'}`}>
                        <div className={`small fw-semibold mb-1 ${isAi ? 'text-muted' : 'text-white-50'}`}>
                          {msg.author?.first_name || msg.author?.username}
                        </div>
                        <LivePreview content={msg.content} />
                        {msg.attachments?.map((att) => (
                          <img
                            key={att.id}
                            src={att.file}
                            alt=""
                            className="mt-2 rounded"
                            style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                          />
                        ))}
                      </div>
                      <div className={`small text-muted mt-1 ${isAi ? '' : 'text-end'}`}>
                        {formatTime(msg.created_at)}
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
}
