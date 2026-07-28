// src/components/postCard/AIChatExcerptCard.jsx

import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import LivePreview from '../LivePreview';
import { useAuth } from '../../context/AuthContext';

export const AIChatExcerptCard = ({ post, excerpt }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messages = excerpt?.messages_snapshot || [];
  const canContinue = excerpt?.conversation_uuid && post?.author?.id === user?.id;

  return (
    <div className="border rounded p-2" style={{ background: '#f8f9fa' }}>
      {!messages.length ? (
        <div className="text-muted fst-italic">[Чатын агуулга олдсонгүй]</div>
      ) : (
        messages.map((m, idx) => (
          <div key={idx} className={`d-flex gap-2 mb-2 ${idx === messages.length - 1 && !canContinue ? 'mb-0' : ''}`}>
            <span style={{ flexShrink: 0 }}>{m.is_ai ? '🤖' : '🧑'}</span>
            <div className="small">
              <div className="fw-bold">{m.author_name}</div>
              <LivePreview content={m.content} />
            </div>
          </div>
        ))
      )}
      {canContinue && (
        <Button
          variant="link"
          size="sm"
          className="p-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/ai-chat/messages', { state: { conversationUuid: excerpt.conversation_uuid } });
          }}
        >
          Үргэлжлүүлэх ярилцах
        </Button>
      )}
    </div>
  );
};
