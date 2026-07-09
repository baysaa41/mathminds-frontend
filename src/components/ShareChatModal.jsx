// frontend/src/components/ShareChatModal.jsx
import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { shareMessagesToFeed } from '../services/conversationService';

const safeTruncate = (text, len) => {
  if (!text) return '';
  return text.length > len ? `${text.slice(0, len)}…` : text;
};

const ShareChatModal = ({ conversationUuid, selectedMessages, onClose, onShared }) => {
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      const messageUuids = selectedMessages.map((m) => m.uuid);
      const data = await shareMessagesToFeed(conversationUuid, messageUuids, comment.trim(), !isPublic);
      onShared?.(data.post);
    } catch (err) {
      setError(err.response?.data?.error || 'Нийтлэхэд алдаа гарлаа');
      console.error('Error sharing chat to feed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>AI чатыг feed-д нийтлэх</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="mb-3" style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {selectedMessages.map((m) => (
            <div key={m.uuid} className="small border-bottom py-1">
              <span className="fw-bold me-1">{m.isAi ? '🤖' : '🧑'}</span>
              {safeTruncate(m.content, 140)}
            </div>
          ))}
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Тайлбар нэмэх (заавал биш)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Энэ чатаас юу сурсан бэ?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
        </Form.Group>

        <Form.Check
          type="switch"
          id="share-chat-public-switch"
          label="Олон нийтэд нийтлэх"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          disabled={loading}
        />
        <Form.Text className="text-muted">
          {isPublic
            ? 'Энэ пост feed-д бүх хэрэглэгчид харагдана.'
            : 'Анхдагчаар зөвхөн танд харагдана. Дараа нь профайлаасаа олон нийтэд нээж болно.'}
        </Form.Text>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Болих
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading || selectedMessages.length === 0}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Нийтэлж байна...
            </>
          ) : (
            'Нийтлэх'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ShareChatModal;
