// frontend/src/pages/ArticleEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Tiptap Rich Text Editor + Split View

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal';

import { MathJax } from 'better-react-mathjax';
import LivePreview from '../components/LivePreview.jsx';
import {
  Eye,
  Edit3,
  Save,
  X,
  Trash2,
  FileText,
  AlignLeft,
  Sparkles,
  MessageCircle,
  Send,
  Check,
} from 'lucide-react';

const ArticleEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPageTitle } = useOutletContext() || {};

  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialAuthorId, setInitialAuthorId] = useState(null);
  const [originalTitle, setOriginalTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // AI сайжруулах чат
  const [showImproveChat, setShowImproveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatPreview, setChatPreview] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/api/integral/articles/${id}/`);
        const articleData = response.data;

        if (!user || !articleData.author || (user.id !== articleData.author.id && !user.is_staff && user.site_role !== 'STAFF')) {
          setError('Энэ өгүүллийг засварлах эрх танд байхгүй байна.');
          setLoading(false);
          return;
        }

        setTitle(articleData.title || '');
        setOriginalTitle(articleData.title || '');
        setAbstract(articleData.abstract || '');
        setContent(articleData.content || '');
        setIsPublic(articleData.is_public ?? false);
        setInitialAuthorId(articleData.author.id);
        const t = articleData.title || `Өгүүлэл #${id}`;
        setPageTitle?.(`Өгүүлэл засах · ${t}`);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Засварлах өгүүлэл олдсонгүй.');
        } else {
          setError('Өгүүллийн мэдээллийг татахад алдаа гарлаа.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchArticle();
    } else {
      setLoading(false);
      setError('Өгүүллийн дугаар олдсонгүй.');
    }
  }, [id, user?.id, user?.is_staff]);

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await apiClient.post(`/api/integral/articles/${id}/generate-ai-content/`, {
        topic: aiTopic,
        title: title,
      });
      if (response.data.title) setTitle(response.data.title);
      if (response.data.abstract) setAbstract(response.data.abstract);
      if (response.data.content) setContent(response.data.content);
      setShowAIModal(false);
      setAiTopic('');
    } catch (err) {
      setError('AI агуулга үүсгэхэд алдаа гарлаа.');
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleImproveSubmit = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const response = await apiClient.post(`/api/integral/articles/${id}/improve/`, {
        message: msg,
        title,
        abstract,
        content,
      });
      const data = response.data;
      setChatPreview(data);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `Гарчиг: ${data.title}\n\nХураангуй: ${data.abstract}`,
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `Алдаа: ${err.response?.data?.detail || 'AI дуудахад алдаа гарлаа'}`,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApplyImprovement = () => {
    if (!chatPreview) return;
    setTitle(chatPreview.title);
    setAbstract(chatPreview.abstract);
    setContent(chatPreview.content);
    setChatPreview(null);
    setChatMessages(prev => [...prev, { role: 'ai', text: 'Өөрчлөлт хэрэглэгдлээ. Хадгалахын тулд "Хадгалах" дарна уу.' }]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiClient.patch(`/api/integral/articles/${id}/`, {
        title: title,
        abstract: abstract,
        content: content,
        is_public: isPublic,
      });
      navigate(`/article/${id}`);
    } catch (err) {
      setError('Өгүүллийг хадгалахад алдаа гарлаа.');
      console.error(err);
      setSaving(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
    }
  };

  const handleShowDeleteModal = () => setShowDeleteModal(true);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.delete(`/api/integral/articles/${id}/`);
      navigate('/content/browse?type=articles');
    } catch (err) {
      setError('Өгүүллийг устгахад алдаа гарлаа.');
      console.error(err);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error && (!initialAuthorId || !user || (user.id !== initialAuthorId && !user.is_staff && user.site_role !== 'STAFF'))) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Link to={initialAuthorId ? `/article/${id}` : '/'}> &laquo; Буцах</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/articles' }}>
          Өгүүллүүд
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/article/${id}` }}>
          <MathJax inline dynamic>
            {originalTitle || 'Өгүүлэл'}
          </MathJax>
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Засварлах</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="h3 fw-bold mb-4">
        <Edit3 size={24} className="me-2" />
        Өгүүлэл засварлах
      </h1>

      {error && initialAuthorId && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSave}>
        {/* Гарчиг */}
        <Form.Group className="mb-3" controlId="articleTitle">
          <Form.Label className="fw-semibold">
            <FileText size={16} className="me-2" />
            Гарчиг
          </Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            required
          />
        </Form.Group>

        {/* Abstract талбар */}
        <Form.Group className="mb-3" controlId="articleAbstract">
          <Form.Label className="fw-semibold">
            <AlignLeft size={16} className="me-2" />
            Хураангуй (Abstract)
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            disabled={saving}
            placeholder="Өгүүллийн товч хураангуй..."
          />
          <Form.Text className="text-muted">
            Энэ хэсэг нь постонд болон хайлтын үр дүнд харагдана.
          </Form.Text>
        </Form.Group>

        {/* Агуулга Editor */}
        <Form.Group className="mb-3" controlId="articleContent">
          <Stack direction="horizontal" gap={2} className="mb-2">
            <Form.Label className="fw-semibold mb-0">
              Агуулга (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)
            </Form.Label>
            <Button
              size="sm"
              variant="outline-primary"
              className="ms-auto"
              onClick={() => setShowPreviewModal(true)}
            >
              <Eye size={14} className="me-1" />
              Preview
            </Button>
          </Stack>
          <Form.Control
            as="textarea"
            rows={20}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Агуулга бичих..."
            disabled={saving}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9em',
              lineHeight: '1.5',
            }}
          />
        </Form.Group>

        {/* Нийтэд харагдах */}
        <Form.Check
          type="switch"
          id="article-is-public"
          label="Нийтэд харагдах"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          disabled={saving}
          className="mb-3"
        />

        {/* Товчууд */}
        <Stack direction="horizontal" gap={2} className="justify-content-end mt-4">
          {/* AI товчууд (зүүн талд) */}
          <Button
            variant="outline-info"
            onClick={() => {
              setShowImproveChat(true);
              setChatMessages([]);
              setChatPreview(null);
            }}
            disabled={saving || isDeleting}
            className="me-auto"
          >
            <MessageCircle size={16} className="me-2" />
            AI сайжруулах
          </Button>

          {/* Устгах товч */}
          <Button
            variant="outline-danger"
            onClick={handleShowDeleteModal}
            disabled={saving || isDeleting}
          >
            <Trash2 size={16} className="me-2" />
            Устгах
          </Button>

          {/* Цуцлах товч */}
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/article/${id}`)}
            disabled={saving || isDeleting}
          >
            <X size={16} className="me-2" />
            Цуцлах
          </Button>

          {/* Хадгалах товч */}
          <Button variant="primary" type="submit" disabled={saving || isDeleting}>
            {saving ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Хадгалж байна...
              </>
            ) : (
              <>
                <Save size={16} className="me-2" />
                Хадгалах
              </>
            )}
          </Button>
        </Stack>
      </Form>

      {/* AI Generate Modal */}
      <Modal show={showAIModal} onHide={() => !isGeneratingAI && setShowAIModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Sparkles size={20} className="me-2 text-success" />
            AI-аар өгүүлэл үүсгэх
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            DeepSeek AI өгүүллийн гарчиг болон агуулгыг автоматаар үүсгэнэ. Одоогийн агуулга
            солигдоно.
          </p>
          <Form.Group>
            <Form.Label className="fw-semibold">Сэдэв / Заавар</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={`Жишээ: "Арифметик прогрессийн нийлбэр" эсвэл хоосон орхивол гарчгийг ашиглана`}
              disabled={isGeneratingAI}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAIModal(false)}
            disabled={isGeneratingAI}
          >
            <X size={16} className="me-2" />
            Болих
          </Button>
          <Button variant="success" onClick={handleGenerateAI} disabled={isGeneratingAI}>
            {isGeneratingAI ? (
              <>
                <Spinner as="span" size="sm" className="me-2" />
                Үүсгэж байна...
              </>
            ) : (
              <>
                <Sparkles size={16} className="me-2" />
                Үүсгэх
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Trash2 size={20} className="me-2 text-danger" />
            Устгахыг баталгаажуулна уу
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та "<b>{originalTitle || 'энэ өгүүллийг'}</b>" устгахдаа итгэлтэй байна уу? Энэ үйлдлийг
          буцаах боломжгүй.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>
            <X size={16} className="me-2" />
            Болих
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner as="span" size="sm" className="me-2" />
                Устгаж байна...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-2" />
                Устгах
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Eye size={20} className="me-2" />
            Урьдчилж харах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Гарчиг */}
          <MathJax hideUntilTypeset={'first'}>
            <h1 className="h3 fw-bold mathjax-content mb-3">{title || 'Гарчиггүй өгүүлэл'}</h1>
          </MathJax>

          {/* Abstract */}
          {abstract && (
            <MathJax hideUntilTypeset={'first'}>
              <div
                className="mathjax-content text-muted mb-4 p-3 bg-light rounded border-start border-primary border-4"
                style={{ fontSize: '1.05em', lineHeight: '1.6', fontStyle: 'italic' }}
              >
                {abstract}
              </div>
            </MathJax>
          )}

          <hr className="mb-4" />

          {/* Үндсэн агуулга */}
          <div
            className="article-content mathjax-content"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
          >
            {content ? (
              <LivePreview content={content} />
            ) : (
              <span className="text-muted fst-italic">Агуулга хоосон байна...</span>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            <X size={16} className="me-2" />
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
      {/* AI Improve Chat Modal */}
      <Modal
        show={showImproveChat}
        onHide={() => !chatLoading && setShowImproveChat(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h6">
            <MessageCircle size={18} className="me-2" />
            AI сайжруулалт
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {chatMessages.length === 0 && (
            <div className="text-center text-muted py-4">
              <MessageCircle size={32} className="mb-2 opacity-25" />
              <p className="small mb-0">Өгүүллийг хэрхэн сайжруулахыг бичнэ үү.</p>
              <p className="small text-muted">
                Жишээ: "Нэр томьёог солих", "Илүү олон жишээ нэм", "Хялбаршуул"
              </p>
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className={`d-flex mb-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
            >
              <div
                className={`rounded px-3 py-2 small ${
                  m.role === 'user' ? 'bg-primary text-white' : 'bg-light border'
                }`}
                style={{ maxWidth: '80%', whiteSpace: 'pre-wrap' }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="d-flex justify-content-start mb-2">
              <div className="bg-light border rounded px-3 py-2">
                <Spinner animation="border" size="sm" className="me-1" />
                <span className="small text-muted">AI боловсруулж байна...</span>
              </div>
            </div>
          )}
          {chatPreview && !chatLoading && (
            <Alert variant="info" className="mt-2 small">
              <div className="d-flex justify-content-between align-items-center">
                <span>Шинэ хувилбар бэлэн. Хэрэглэх үү?</span>
                <div className="d-flex gap-1">
                  <Button size="sm" variant="success" onClick={handleApplyImprovement}>
                    <Check size={14} className="me-1" />
                    Хэрэглэх
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setChatPreview(null)}
                  >
                    <X size={14} />
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
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleImproveSubmit();
                }
              }}
              disabled={chatLoading}
              style={{ resize: 'none' }}
            />
            <Button
              variant="primary"
              onClick={handleImproveSubmit}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Send size={16} />
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ArticleEditPage;
