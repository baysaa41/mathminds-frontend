// frontend/src/pages/ArticleEditPage.jsx
// ✅ ШИНЭЧИЛСЭН: Tiptap Rich Text Editor + Split View

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import RichTextEditor from '../components/RichTextEditor';
import {
  Eye,
  Code2,
  Edit3,
  Save,
  X,
  Trash2,
  FileText,
  AlignLeft,
  Home,
  Library,
} from 'lucide-react';

const ArticleEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'source'

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/api/integral/articles/${id}/`);
        const articleData = response.data;

        if (!user || !articleData.author || (user.id !== articleData.author.id && !user.is_staff)) {
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

  if (error && (!initialAuthorId || !user || (user.id !== initialAuthorId && !user.is_staff))) {
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
          {originalTitle || 'Өгүүлэл'}
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
            <div className="ms-auto">
              <Button
                size="sm"
                variant={viewMode === 'visual' ? 'primary' : 'outline-secondary'}
                onClick={() => setViewMode('visual')}
                className="me-1"
              >
                <Edit3 size={14} className="me-1" />
                Visual
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'source' ? 'primary' : 'outline-secondary'}
                onClick={() => setViewMode('source')}
                className="me-2"
              >
                <Code2 size={14} className="me-1" />
                Source
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => setShowPreviewModal(true)}>
                <Eye size={14} className="me-1" />
                Preview
              </Button>
            </div>
          </Stack>

          {viewMode === 'visual' ? (
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Өгүүллийн агуулга бичих..."
            />
          ) : (
            <Form.Control
              as="textarea"
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="HTML код шууд бичих..."
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9em',
                lineHeight: '1.5',
              }}
            />
          )}
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
          {/* Устгах товч (зүүн талд) */}
          <Button
            variant="outline-danger"
            onClick={handleShowDeleteModal}
            disabled={saving || isDeleting}
            className="me-auto"
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
          {/* Title Preview */}
          {title && (
            <div className="mb-4">
              <h2 className="h3 fw-bold">
                <FileText size={24} className="me-2 text-primary" />
                {title}
              </h2>
            </div>
          )}

          {/* Abstract Preview */}
          {abstract && (
            <div className="mb-4 pb-3 border-bottom">
              <p className="fw-semibold small text-secondary mb-2">
                <AlignLeft size={14} className="me-1" />
                Хураангуй:
              </p>
              <MathJax hideUntilTypeset={'first'}>
                <div
                  className="mathjax-content text-muted"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95em' }}
                >
                  {abstract}
                </div>
              </MathJax>
            </div>
          )}

          {/* Content Preview */}
          <MathJax hideUntilTypeset={'first'}>
            <div
              className="mathjax-content"
              style={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.6',
              }}
              dangerouslySetInnerHTML={{
                __html:
                  content || "<span class='text-muted fst-italic'>Агуулга хоосон байна...</span>",
              }}
            />
          </MathJax>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            <X size={16} className="me-2" />
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ArticleEditPage;
