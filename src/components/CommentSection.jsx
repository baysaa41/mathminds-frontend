// frontend/src/components/CommentSection.jsx
// (!!! ШИНЭЧИЛСЭН: Олон зураг оруулах боломж нэмсэн !!!)

import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import PostCard from './PostCard';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Stack from 'react-bootstrap/Stack';
import Image from 'react-bootstrap/Image';
import CloseButton from 'react-bootstrap/CloseButton';
import { MessageCircle } from 'lucide-react';

// ----------------------
// Reply form (Олон зураг дэмждэг болсон)
// ----------------------
const ReplyForm = ({ parentId, onReplyAdded }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // (!!! Олон зураг хадгалах State !!!)
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const imageInputRef = useRef(null);

  /**
   * Олон зураг сонгох үед ажиллана
   */
  const handleImageChange = (e) => {
    setError(null);
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Хэзгаар шалгах (10)
    if (files.length + imageFiles.length > 10) {
      setError('Нэг дор 10-аас илүүгүй зураг хавсаргах боломжтой.');
      e.target.value = null;
      return;
    }

    // Шинэ файлуудыг state-д нэмэх
    setImageFiles((prevFiles) => [...prevFiles, ...files]);

    // Шинэ preview URL-уудыг state-д нэмэх
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);

    e.target.value = null;
  };

  /**
   * Нэг зургийг preview-с устгах
   */
  const clearImage = (indexToRemove) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImageFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, index) => index !== indexToRemove));
  };

  /**
   * Бүх зургийг цэвэрлэх
   */
  const clearAllImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    if (imageInputRef.current) imageInputRef.current.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Контент эсвэл зураг байх ёстой
    if (!content.trim() && imageFiles.length === 0) {
      setError('Текст эсвэл зураг оруулна уу.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('parent_post', parentId);
      formData.append('content_type', 'reply');

      // Олон зургийг 'images' гэсэн *нэг* key-рээ нэмнэ
      if (imageFiles.length > 0) {
        imageFiles.forEach((file) => {
          formData.append('images', file);
        });
      }

      const res = await apiClient.post('/api/minds/posts/', formData);

      onReplyAdded(res.data);
      setContent('');
      clearAllImages();
      setError(null);
    } catch (err) {
      console.error('Reply error:', err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const errorMessages = Object.values(errorData).join(' ');
        setError(errorMessages || 'Хариулт илгээхэд алдаа гарлаа.');
      } else {
        setError('Хариулт илгээхэд алдаа гарлаа.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mt-2 ms-4 p-3 border rounded bg-light">
      {/* Алдааны мөр */}
      {error && (
        <Alert variant="danger" className="py-2 mb-2 small">
          {error}
        </Alert>
      )}

      {/* Текст талбар */}
      <Form.Control
        as="textarea"
        rows={2}
        placeholder="Хариулт бичих..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        className="mb-2"
      />

      {/* Зургийн Preview Хэсэг */}
      {imagePreviews.length > 0 && (
        <div className="mb-2 d-flex flex-wrap" style={{ gap: '8px' }}>
          {imagePreviews.map((previewUrl, index) => (
            <div
              key={index}
              className="position-relative d-inline-block"
              style={{ width: '80px', height: '80px' }}
            >
              <CloseButton
                onClick={() => clearImage(index)}
                className="position-absolute top-0 end-0 bg-light p-1"
                style={{ zIndex: 1, fontSize: '0.5em', opacity: 0.8 }}
                title="Устгах"
              />
              <Image
                src={previewUrl}
                thumbnail
                fluid
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Далд Файл Input */}
      <Form.Control
        type="file"
        accept="image/*"
        ref={imageInputRef}
        onChange={handleImageChange}
        className="d-none"
        multiple
      />

      {/* Доод хэсэг: Зураг нэмэх товч + Илгээх товч */}
      <Stack direction="horizontal" gap={2}>
        <Button
          variant="link"
          size="sm"
          className="p-0 text-secondary text-decoration-none"
          onClick={() => imageInputRef.current?.click()}
          disabled={imageFiles.length >= 10 || loading}
        >
          <i className="bi bi-images me-1"></i>
          Зураг {imageFiles.length > 0 && `(${imageFiles.length} / 10)`}
        </Button>

        <div className="ms-auto">
          <Button
            size="sm"
            type="submit"
            disabled={loading || (!content.trim() && imageFiles.length === 0)}
          >
            {loading ? <Spinner size="sm" /> : 'Илгээх'}
          </Button>
        </div>
      </Stack>
    </Form>
  );
};

// ----------------------
// Comment Section
// ----------------------
const SORT_OPTIONS = [
  { value: '-created_at', label: 'Шинэ' },
  { value: 'created_at',  label: 'Хуучин' },
  { value: '-favorite_count', label: 'Таалагдсан' },
];

const CommentSection = ({
  postId,
  initialCount = 0,
  onCountChange,
  defaultExpanded = true,
  externalShow = null, // Гаднаас удирдах show state
  onToggle = null // Гаднаас удирдах toggle callback
}) => {
  const { user } = useAuth();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [internalShow, setInternalShow] = useState(defaultExpanded);
  const [replyCount, setReplyCount] = useState(initialCount);
  const [ordering, setOrdering] = useState('-created_at');

  // Гаднаас удирдвал externalShow ашиглана, үгүй бол internal state
  const show = externalShow !== null ? externalShow : internalShow;
  const setShow = (value) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalShow(value);
    }
  };

  const fetchReplies = async (ord = ordering) => {
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/api/minds/posts/?parent_post=${postId}&content_type=reply&ordering=${ord}`
      );
      const data = res.data.results || res.data;
      setReplies(Array.isArray(data) ? data : []);
      setReplyCount(res.data.count || data.length);
    } catch (err) {
      console.error('Fetch replies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newOrdering) => {
    setOrdering(newOrdering);
    fetchReplies(newOrdering);
  };

  useEffect(() => {
    if (show) fetchReplies();
  }, [show, postId]);

  // Шинээр хариулт нэмэгдэх үед
  const handleReplyAdded = (newReply) => {
    setReplies((prev) => [...prev, newReply]);
    const newCount = replyCount + 1;
    setReplyCount(newCount);
    onCountChange?.(newCount);
  };

  // Reply устгагдах үед
  const handleReplyDeleted = (deletedReplyId) => {
    setReplies((prevReplies) => prevReplies.filter((reply) => reply.id !== deletedReplyId));
    const newCount = replyCount - 1;
    setReplyCount(newCount);
    onCountChange?.(newCount);
  };

  return (
    <div className="comment-section mt-2">
      <Button
        variant="link"
        size="sm"
        onClick={() => setShow(!show)}
        className="p-0 text-muted text-decoration-none"
      >
        <MessageCircle size={16} className="me-1" />
        {replyCount} {show ? '▲' : '▼'}
      </Button>

      {show && (
        <div className="mt-3 ms-2">
          {user ? (
            <ReplyForm parentId={postId} onReplyAdded={handleReplyAdded} />
          ) : (
            <Alert variant="info" className="small py-2">
              Хариулт бичихийн тулд нэвтэрнэ үү.
            </Alert>
          )}

          {replies.length > 0 && (
            <div className="d-flex gap-1 mt-3 mb-2">
              {SORT_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={ordering === opt.value ? 'secondary' : 'outline-secondary'}
                  className="py-0 px-2"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleSortChange(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-3">
              <Spinner size="sm" />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center text-muted small py-3">Одоогоор хариулт алга.</div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} style={{ marginLeft: '2rem' }}>
                <PostCard post={reply} depth={1} onPostDeleted={handleReplyDeleted} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
