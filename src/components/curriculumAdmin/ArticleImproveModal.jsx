// src/components/curriculumAdmin/ArticleImproveModal.jsx
// Долоо хоногийн сэдвийн AI өгүүлэл сайжруулах чат modal

import { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { MessageCircle, Send, Check, X as XIcon } from 'lucide-react';
import * as svc from '../../services/curriculumAdminService';

export default function ArticleImproveModal({ show, onHide, topic, articleUuid, onApplied }) {
  const [messages, setMessages] = useState([]); // { role: 'user'|'ai', text }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { title, abstract, content }
  const [applying, setApplying] = useState(false);

  // Modal хаахад цэвэрлэх
  useEffect(() => {
    if (!show) {
      setMessages([]);
      setInput('');
      setPreview(null);
    }
  }, [show]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await svc.improveArticle(topic.id, {
        message: msg,
        article_uuid: articleUuid,
      });
      const data = res.data;
      setPreview(data);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Гарчиг: ${data.title}\n\nХураангуй: ${data.abstract}`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Алдаа: ${err.response?.data?.detail || 'AI дуудахад алдаа гарлаа'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      await svc.applyArticleImprovement(topic.id, {
        article_uuid: articleUuid,
        title: preview.title,
        abstract: preview.abstract,
        content: preview.content,
      });
      setMessages(prev => [...prev, { role: 'ai', text: 'Өгүүлэл амжилттай шинэчлэгдлээ.' }]);
      setPreview(null);
      onApplied?.();
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Хадгалахад алдаа: ${err.response?.data?.detail || 'Алдаа гарлаа'}`,
      }]);
    } finally {
      setApplying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          <MessageCircle size={18} className="me-2" />
          AI сайжруулалт — {topic?.topic}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="text-center text-muted py-4">
            <MessageCircle size={32} className="mb-2 opacity-25" />
            <p className="small mb-0">Өгүүллийг хэрхэн сайжруулахыг бичнэ үү.</p>
            <p className="small text-muted">
              Жишээ: "Тэгш өнцөгтийг тэгш олонт гэж нэрлэ", "Илүү олон жишээ нэм", "Хялбаршуул"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`d-flex mb-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div
              className={`rounded px-3 py-2 small ${
                m.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-light border'
              }`}
              style={{ maxWidth: '80%', whiteSpace: 'pre-wrap' }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="d-flex justify-content-start mb-2">
            <div className="bg-light border rounded px-3 py-2">
              <Spinner animation="border" size="sm" className="me-1" />
              <span className="small text-muted">AI боловсруулж байна...</span>
            </div>
          </div>
        )}

        {/* Preview хүлээн авах / татгалзах */}
        {preview && !applying && (
          <Alert variant="info" className="mt-2 small">
            <div className="d-flex justify-content-between align-items-center">
              <span>Шинэ хувилбар бэлэн. Хадгалах уу?</span>
              <div className="d-flex gap-1">
                <Button size="sm" variant="success" onClick={handleApply}>
                  <Check size={14} className="me-1" />Хадгалах
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setPreview(null)}>
                  <XIcon size={14} />
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="py-2">
        <div className="d-flex w-100 gap-2">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Зааварчилгаа бичих..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || applying}
            style={{ resize: 'none' }}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || loading || applying}
          >
            <Send size={16} />
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
