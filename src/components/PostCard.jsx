// frontend/src/components/PostCard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Components
import LivePreview from './LivePreview';
import UserAvatar from './UserAvatar';
import EmbedRenderer from './EmbedRenderer';
import VerifiedBadge from './VerifiedBadge';
import UserName from './UserName';
import PostTimestamp from './PostTimestamp';

// React Bootstrap
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';

// -------------------------------------------------------------------
// ----------------- PostImageGallery (Туслах компонент) -----------------
// -------------------------------------------------------------------
const PostImageGallery = ({ images }) => {
  const galleryRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!galleryRef.current || !images || images.length === 0) return;

    viewerRef.current = new Viewer(galleryRef.current, {
      toolbar: {
        zoomIn: 1,
        zoomOut: 1,
        oneToOne: 1,
        reset: 1,
        prev: images.length > 1 ? 1 : 0,
        play: 0,
        next: images.length > 1 ? 1 : 0,
        rotateLeft: 1,
        rotateRight: 1,
        flipHorizontal: 0,
        flipVertical: 0,
      },
      navbar: images.length > 1,
      title: false,
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [images]);

  if (!images || images.length === 0) return null;

  // 1. Нэг зураг байвал: Бүтнээр нь харуулах
  if (images.length === 1) {
    return (
      <div
        ref={galleryRef}
        className="my-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[0].image}
          className="img-fluid rounded post-image"
          alt="Post attachment"
          style={{
            maxWidth: '100%',
            maxHeight: '600px',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
            cursor: 'zoom-in',
          }}
        />
      </div>
    );
  }

  // 2. 2+ зураг байвал: Grid
  const visibleImages = images.slice(0, 4);
  const hiddenImages = images.slice(4);

  return (
    <div
      ref={galleryRef}
      className="my-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="post-image-gallery"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        {visibleImages.map((img, index) => (
          <div
            key={img.id}
            className="position-relative"
            style={{ paddingTop: '100%', overflow: 'hidden' }}
          >
            <img
              src={img.image}
              alt={`Post image ${index + 1}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'zoom-in',
              }}
            />
            {images.length > 4 && index === 3 && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  pointerEvents: 'none',
                }}
              >
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Viewer-т зориулсан нуугдмал зургууд (5-с дээш зурагтай үед) */}
      {hiddenImages.map((img) => (
        <img
          key={img.id}
          src={img.image}
          alt="Post attachment"
          style={{ display: 'none' }}
        />
      ))}
    </div>
  );
};

// LaTeX expression-н дотор тасрахгүйгээр товчлох
const safeTruncate = (text, maxLen) => {
  if (!text || text.length <= maxLen) return text;
  // maxLen-с өмнөх байрлалаас LaTeX-н хаалтад орсон эсэхийг шалгана
  let inside = false;
  let i = 0;
  while (i < maxLen) {
    if (text[i] === '$') { inside = !inside; }
    else if (text.startsWith('\\(', i)) { inside = true; i++; }
    else if (text.startsWith('\\)', i)) { inside = false; i++; }
    i++;
  }
  // LaTeX дотор байвал хаах тэмдэг хүртэл буцна
  if (inside) {
    const closeIdx = text.indexOf('$', maxLen);
    const closeIdx2 = text.indexOf('\\)', maxLen);
    const end = [closeIdx, closeIdx2].filter(x => x >= 0).sort((a,b) => a-b)[0];
    if (end !== undefined) return text.substring(0, end + (text[end] === '$' ? 1 : 2)) + '...';
  }
  return text.substring(0, maxLen) + '...';
};

// -------------------------------------------------------------------
// ----------------- PostContent (Туслах компонент) ------------------
// -------------------------------------------------------------------
const PostContent = ({ post }) => {
  const navigate = useNavigate();

  if (!post) return null;

  if (
    post.content_type === 'post' ||
    post.content_type === 'repost' ||
    post.content_type === 'reply'
  ) {
    return null;
  }

  const relatedItem =
    post.related_problem || post.related_formula || post.related_article || post.related_quiz;

  if (!relatedItem)
    return <div className="text-muted fst-italic">[Холбоотой контент олдсонгүй]</div>;

  const detailUrlMap = {
    article: `/article/${relatedItem.uuid}`,
    problem: `/problem/${relatedItem.uuid}`,
    formula: `/formula/${relatedItem.uuid}`,
    quiz:    `/quiz/${relatedItem.uuid}`,
  };
  const contentUrl = relatedItem.uuid ? detailUrlMap[post.content_type] : null;

  let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;

  let description =
    relatedItem.statement ||
    relatedItem.content ||
    relatedItem.abstract ||
    relatedItem.description ||
    '';

  let typeLabel;
  let badgeVariant;

  switch (post.content_type) {
    case 'problem':
      typeLabel = 'Бодлого';
      badgeVariant = 'secondary';
      break;
    case 'formula':
      typeLabel = 'Томьёо';
      badgeVariant = 'info';
      break;
    case 'article':
      typeLabel = 'Өгүүлэл';
      badgeVariant = 'danger';
      break;
    case 'quiz':
      typeLabel = 'Тест';
      badgeVariant = 'success';
      break;
    default:
      typeLabel = 'Контент';
      badgeVariant = 'warning';
  }

  const contentToShow =
    post.content_type === 'problem' || post.content_type === 'formula'
      ? description
      : safeTruncate(description, 100);

  return (
    <>
      <LivePreview content={post.content} />
      <Card
        className="bg-light border shadow-sm mt-2 post-content-card"
        onClick={() => navigate(`/post/${post.uuid}`)}
        style={{ cursor: 'pointer' }}
      >
        <Card.Body>
          <div className="mb-2">
            <Badge bg={badgeVariant}>{typeLabel}</Badge>
          </div>

          <Card.Title className="h6 mathjax-content mb-1">
            <LivePreview content={title} />
          </Card.Title>

          {description && (
            <Card.Text
              as="div"
              className="small text-muted mathjax-content"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              <LivePreview content={contentToShow} />
            </Card.Text>
          )}

          {contentUrl && (
            <div className="text-end mt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant={`outline-${badgeVariant}`}
                size="sm"
                onClick={() => navigate(contentUrl)}
                style={{ fontSize: '0.7rem', padding: '1px 8px' }}
              >
                {typeLabel} харах
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

// -------------------------------------------------------------------
// ----------------- Үндсэн PostCard компонент -----------------
// -------------------------------------------------------------------
const PostCard = ({ post, onPostDeleted, depth = 0, compact = false, onCardClick, onAIReplyAdded }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Post content state - засварлах үед шинэчлэгдэнэ
  const [currentPost, setCurrentPost] = useState(post);

  const [isFavorited, setIsFavorited] = useState(post.is_favored);
  const [favoriteCount, setFavoriteCount] = useState(post.favorite_count || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [isReposting, setIsReposting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // (!!! Comment Count State нэмсэн !!!)
  const [commentCount, setCommentCount] = useState(post.replies_count || 0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Post Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Post Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // AI тусламж Modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [currentViewCount, setCurrentViewCount] = useState(
    (post.reposted_post ? post.reposted_post.view_count : post.view_count) || 0
  );
  const [viewCountIncremented, setViewCountIncremented] = useState(false);
  const cardRef = useRef(null);

  // Font size state with discrete steps
  const fontSizes = [1, 1.2, 1.5]; // 1rem, 1.2rem, 1.5rem
  const [fontSizeIndex, setFontSizeIndex] = useState(0); // Start at 1rem

  const increaseFontSize = (e) => {
    e.stopPropagation();
    setFontSizeIndex((prev) => Math.min(prev + 1, fontSizes.length - 1));
  };

  const decreaseFontSize = (e) => {
    e.stopPropagation();
    setFontSizeIndex((prev) => Math.max(prev - 1, 0));
  };

  const fontSize = fontSizes[fontSizeIndex];

  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // --- Үйлдлүүд (Actions) ---

  // Favorite / Bookmark
  const handleAction = async (actionType, e) => {
    e.stopPropagation();
    if (!user) {
      showNotification('Энэ үйлдлийг хийхийн тулд нэвтэрнэ үү.', 'warning');
      return;
    }

    let url;
    switch (actionType) {
      case 'favorite':
        url = `/api/minds/posts/${currentPost.uuid}/favorite/`;
        break;
      case 'bookmark':
        url = `/api/minds/posts/${currentPost.uuid}/bookmark/`;
        break;
      default:
        return;
    }

    try {
      const response = await apiClient.post(url);
      if (actionType === 'favorite') {
        setIsFavorited(response.data.is_favored);
        setFavoriteCount(response.data.favorite_count);
      } else if (actionType === 'bookmark') {
        setIsBookmarked(response.data.is_bookmarked);
      }
    } catch (err) {
      console.error(`Failed to ${actionType} post:`, err);
      showNotification(`Үйлдэл амжилтгүй боллоо (${actionType})`, 'danger');
    }
  };

  // Repost
  const handleRepost = async (e) => {
    e.stopPropagation();
    if (!user) {
      showNotification('Repost хийхийн тулд нэвтэрнэ үү.', 'warning');
      return;
    }

    if (isReposting) return;
    if (currentPost.content_type === 'repost') {
      showNotification('Repost хийгдсэн постыг дахин repost хийх боломжгүй.', 'warning');
      return;
    }

    const targetPostUuid = currentPost.reposted_post ? currentPost.reposted_post.uuid : currentPost.uuid;

    setIsReposting(true);
    try {
      const response = await apiClient.post(`/api/minds/posts/${targetPostUuid}/repost/`);
      if (response.status === 201) {
        showNotification('Амжилттай repost хийлээ!', 'success');
      } else if (response.status === 200) {
        showNotification(response.data.message || 'Та аль хэдийн repost хийсэн байна.', 'info');
      }
    } catch (err) {
      console.error('Failed to repost:', err);
      showNotification(err.response?.data?.error || 'Repost хийхэд алдаа гарлаа.', 'danger');
    } finally {
      setIsReposting(false);
    }
  };

  // Delete
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/minds/posts/${currentPost.uuid}/`);
      showNotification('Пост амжилттай устлаа.', 'success');
      if (onPostDeleted) onPostDeleted(currentPost.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      showNotification(err.response?.data?.detail || 'Пост устгахад алдаа гарлаа.', 'danger');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Block User
  const handleBlockUser = async (e) => {
    e.stopPropagation();
    if (!user || !originalAuthor) return;

    try {
      const response = await apiClient.post(`/users/api/${originalAuthor.username}/block/`);
      showNotification(response.data.detail || 'Хэрэглэгчийг block хийлээ.', 'success');
    } catch (err) {
      console.error('Failed to block user:', err);
      showNotification(err.response?.data?.detail || 'Block хийхэд алдаа гарлаа.', 'danger');
    }
  };

  // Mute User
  const handleMuteUser = async (e) => {
    e.stopPropagation();
    if (!user || !originalAuthor) return;

    try {
      const response = await apiClient.post(`/users/api/${originalAuthor.username}/mute/`);
      showNotification(response.data.detail || 'Хэрэглэгчийг mute хийлээ.', 'success');
    } catch (err) {
      console.error('Failed to mute user:', err);
      showNotification(err.response?.data?.detail || 'Mute хийхэд алдаа гарлаа.', 'danger');
    }
  };

  // AI тусламж
  const handleAIHelp = async (e) => {
    e.stopPropagation();
    setShowAIModal(true);
    setAiResponse('');
    setAiError('');
    setAiLoading(true);
    try {
      const res = await apiClient.post(`/api/minds/posts/${currentPost.uuid}/ai_help/`);
      setAiResponse(res.data.response || '');
    } catch (err) {
      setAiError(err.response?.data?.error || 'AI тусламж авч чадсангүй.');
    } finally {
      setAiLoading(false);
    }
  };

  // Report Post - Open Modal
  const handleReportClick = (e) => {
    e.stopPropagation();
    setShowReportModal(true);
  };

  // Report Post - Submit
  const submitReport = async () => {
    setIsReporting(true);
    try {
      await apiClient.post('/api/minds/post-reports/', {
        post: currentPost.id,
        reason: reportReason,
        description: reportDescription,
      });
      showNotification('Report амжилттай илгээлээ.', 'success');
      setShowReportModal(false);
      setReportReason('spam');
      setReportDescription('');
    } catch (err) {
      console.error('Failed to report post:', err);
      showNotification(
        err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          'Report илгээхэд алдаа гарлаа.',
        'danger'
      );
    } finally {
      setIsReporting(false);
    }
  };

  // Edit Post - Open Modal
  const handleEditClick = (e) => {
    e.stopPropagation();
    // currentPost-оос агуулгыг авна
    setEditContent(currentPost.content || '');
    setShowEditModal(true);
  };

  // Edit Post - Submit
  const submitEdit = async () => {
    if (!editContent.trim()) {
      showNotification('Агуулга хоосон байж болохгүй.', 'warning');
      return;
    }

    setIsEditing(true);
    try {
      const postUuidToEdit = currentPost.uuid;
      const response = await apiClient.patch(`/api/minds/posts/${postUuidToEdit}/`, {
        content: editContent.trim(),
      });

      // Амжилттай засагдсан постын мэдээллээр currentPost-ийг шинэчлэх
      setCurrentPost(response.data);

      showNotification('Пост амжилттай засагдлаа.', 'success');
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to edit post:', err);

      // Дэлгэрэнгүй алдааны мэдээлэл харуулах
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.content?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        'Пост засахад алдаа гарлаа.';

      showNotification(errorMessage, 'danger');
    } finally {
      setIsEditing(false);
    }
  };

  // Navigation
  const navigateToPost = (e) => {
    if (e.target.closest('a, button, .dropdown-toggle, .dropdown-item, .post-content-card')) {
      e.stopPropagation();
      return;
    }

    if (onCardClick) {
      onCardClick(currentPost);
      return;
    }

    if (currentPost.content_type === 'repost' && currentPost.reposted_post) {
      const postId = currentPost.reposted_post.uuid || currentPost.reposted_post.id;
      navigate(`/post/${postId}`);
    } else {
      const postId = currentPost.uuid || currentPost.id;
      navigate(`/post/${postId}`);
    }
  };

  // (!!! View Count - Reply (depth > 0) бол ажиллахгүй !!!)
  const incrementViewCount = useCallback(async () => {
    if (!user || viewCountIncremented) return;

    setViewCountIncremented(true);
    try {
      const targetUuid = currentPost.reposted_post ? currentPost.reposted_post.uuid : currentPost.uuid;
      const response = await apiClient.post(`/api/minds/posts/${targetUuid}/view/`);
      if (response.data && response.data.view_count !== undefined)
        setCurrentViewCount(response.data.view_count);
    } catch (err) {
      console.error(`Failed to increment view count for post ${currentPost.uuid}:`, err);
    }
  }, [user, currentPost.uuid, currentPost.reposted_post, viewCountIncremented]);

  useEffect(() => {
    if (!user || viewCountIncremented) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          incrementViewCount();
          if (cardRef.current) observer.unobserve(cardRef.current);
        }
      },
      { threshold: 0.5 }
    );
    const currentCardRef = cardRef.current;
    if (currentCardRef) observer.observe(currentCardRef);
    return () => {
      if (currentCardRef) observer.unobserve(currentCardRef);
    };
  }, [incrementViewCount, viewCountIncremented, user]);


  // --- Render-д зориулсан хувьсагчид ---
  const isStaff = user && user.is_staff;
  const canEdit = user && currentPost && (isStaff || (currentPost.author && user.id === currentPost.author.id));
  const canDelete = user && currentPost && (currentPost.can_delete || isStaff || (currentPost.author && user.id === currentPost.author.id));
  const isRepost = currentPost.content_type === 'repost' && currentPost.reposted_post;
  const originalPost = isRepost ? currentPost.reposted_post : currentPost;
  const originalAuthor = originalPost?.author;
  const reposterAuthor = isRepost ? currentPost.author : null;

  if (!originalAuthor) {
    return (
      <Card className="shadow-sm m-3 post-card">
        <Card.Body>
          <p className="text-muted text-center">
            Энэ контент олдсонгүй (зохиогч устгасан байж магадгүй).
          </p>
        </Card.Body>
      </Card>
    );
  }

  const getModalTitle = () => {
    if (currentPost.content_type === 'reply') return 'Сэтгэгдэл устгах';
    if (isRepost) return 'Repost устгах';
    return 'Пост устгах';
  };

  return (
    <>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className={toastVariant === 'light' ? 'text-dark' : 'text-white'}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Modal
        show={showDeleteModal}
        onHide={() => !isDeleting && setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">{getModalTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та энэ {currentPost.content_type === 'reply' ? 'сэтгэгдлийг' : isRepost ? 'repost-г' : 'постыг'}{' '}
          устгахдаа итгэлтэй байна уу?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Болих
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <Spinner as="span" size="sm" className="me-1" />
            ) : (
              <i className="bi bi-trash me-1"></i>
            )}
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Report Modal */}
      <Modal
        show={showReportModal}
        onHide={() => !isReporting && setShowReportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <i className="bi bi-flag me-2"></i>
            Post report хийх
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            Та энэ постыг яагаад report хийж байгаагаа сонгоно уу.
          </p>

          <div className="mb-3">
            <label htmlFor="reportReason" className="form-label fw-semibold">
              Шалтгаан
            </label>
            <select
              id="reportReason"
              className="form-select"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="spam">Спам</option>
              <option value="harassment">Дарамт, доромжлол</option>
              <option value="hate_speech">Үзэн ядалт үг хэллэг</option>
              <option value="violence">Хүчирхийлэл</option>
              <option value="false_info">Худал мэдээлэл</option>
              <option value="inappropriate">Зохисгүй агуулга</option>
              <option value="other">Бусад</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="reportDescription" className="form-label fw-semibold">
              Дэлгэрэнгүй (заавал биш)
            </label>
            <textarea
              id="reportDescription"
              className="form-control"
              rows="3"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Нэмэлт мэдээлэл..."
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowReportModal(false)}
            disabled={isReporting}
          >
            Цуцлах
          </Button>
          <Button variant="warning" onClick={submitReport} disabled={isReporting}>
            {isReporting ? (
              <>
                <Spinner as="span" size="sm" className="me-1" />
                Илгээж байна...
              </>
            ) : (
              <>
                <i className="bi bi-flag me-1"></i>
                Report илгээх
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* AI тусламж Modal */}
      <Modal
        show={showAIModal}
        onHide={() => !aiLoading && !isSavingReply && setShowAIModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <i className="bi bi-stars me-2 text-warning"></i>
            AI тусламж
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {aiLoading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="warning" className="mb-3" />
              <p className="text-muted small mb-0">AI дүгнэж байна...</p>
            </div>
          )}
          {!aiLoading && aiError && (
            <div className="alert alert-danger small mb-0">{aiError}</div>
          )}
          {!aiLoading && aiResponse && (
            <LivePreview content={aiResponse} />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAIModal(false)}
            disabled={isSavingReply}
          >
            Хаах
          </Button>
          {aiResponse && !aiLoading && (
            <Button
              variant="primary"
              size="sm"
              disabled={isSavingReply}
              onClick={async () => {
                try {
                  setIsSavingReply(true);
                  const res = await apiClient.post(`/api/minds/posts/${currentPost.uuid}/save_ai_reply/`, {
                    content: aiResponse,
                  });
                  setCommentCount((c) => c + 1);
                  setShowAIModal(false);
                  onAIReplyAdded?.(res.data);
                  showNotification('AI хариулт амжилттай хадгалагдлаа.', 'success');
                } catch (err) {
                  console.error('AI reply save error:', err);
                  showNotification('Хадгалахад алдаа гарлаа.', 'danger');
                } finally {
                  setIsSavingReply(false);
                }
              }}
            >
              {isSavingReply ? (
                <>
                  <Spinner as="span" size="sm" className="me-1" />
                  Хадгалж байна...
                </>
              ) : (
                <>
                  <i className="bi bi-chat-left-text me-1"></i>
                  Хариулт болгон хадгалах
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Edit Post Modal */}
      <Modal show={showEditModal} onHide={() => !isEditing && setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <i className="bi bi-pencil me-2"></i>
            Пост засах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="editContent" className="form-label fw-semibold">
              Агуулга
            </label>
            <textarea
              id="editContent"
              className="form-control"
              rows="5"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Постын агуулгаа бичнэ үү..."
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isEditing}>
            Цуцлах
          </Button>
          <Button
            variant="primary"
            onClick={submitEdit}
            disabled={isEditing || !editContent.trim()}
          >
            {isEditing ? (
              <>
                <Spinner as="span" size="sm" className="me-1" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-1"></i>
                Хадгалах
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- Үндсэн Пост Карт --- */}
      <Card
        ref={cardRef}
        className={`shadow-sm post-card ${compact ? 'mx-1 my-2' : 'm-3'} ${depth > 0 ? 'post-reply-card' : ''}`}
        onClick={navigateToPost}
        style={{ cursor: 'pointer' }}
      >
        {/* Клубын пост мэдээлэл */}
        {currentPost.club && (
          <div className="small px-3 pt-2 pb-1 border-bottom d-flex align-items-center gap-2" style={{ background: '#f0f4ff' }}>
            <i className="bi bi-people-fill text-primary"></i>
            <Link
              to={`/clubs/${currentPost.club.id}`}
              className="text-primary fw-semibold text-decoration-none"
              onClick={(e) => e.stopPropagation()}
            >
              {currentPost.club.name}
            </Link>
            {currentPost.subgroup && (
              <Badge bg={currentPost.subgroup.color || 'secondary'} className="small">
                {currentPost.subgroup.name}
              </Badge>
            )}
          </div>
        )}

        {/* Repost мэдээлэл */}
        {isRepost && reposterAuthor && (
          <div className="text-muted small px-3 pt-2 pb-1 border-bottom bg-light">
            <i className="bi bi-repeat me-2"></i>
            <UserName user={reposterAuthor} className="fw-bold" />
            <span className="ms-1">reminded</span>
          </div>
        )}

        <Card.Body className="pb-2">
          {/* Repost-н өөрийнх нь сэтгэгдэл */}
          {isRepost && post.content && (
            <div className="mb-2">
              <LivePreview content={post.content} />
            </div>
          )}

          {/* Repost-н өөрийнх нь зургууд */}
          {isRepost && post.images && post.images.length > 0 && (
            <div className="mt-2">
              <PostImageGallery images={post.images} />
            </div>
          )}

          {/* Repost-н өөрийнх нь embed */}
          {isRepost && post.embed_link && <EmbedRenderer url={post.embed_link} postId={post.id} />}

          {/* Эх постын хэсэг */}
          <div className={isRepost ? 'reposted-content-wrapper border rounded p-3' : ''}>
            {/* Зохиогчийн мэдээлэл */}
            <Stack direction="horizontal" gap={3} className="align-items-start mb-2">
              <Link to={`/profile/${originalAuthor.username}`}>
                <UserAvatar user={originalAuthor} size={40} />
              </Link>
              <div className="flex-grow-1">
                <UserName user={originalAuthor} className="fw-bold" />
                <PostTimestamp
                  date={originalPost.created_at}
                  className="text-muted small mb-0 d-block"
                />
              </div>

              {/* Post Menu */}
              {user && (
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="link"
                    size="sm"
                    className="text-muted no-caret p-0"
                    id={`dropdown-post-${post.id}`}
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {/* Засах (эзэн/staff) */}
                    {canEdit && (
                      <Dropdown.Item onClick={handleEditClick}>
                        <i className="bi bi-pencil me-2"></i>
                        Засах
                      </Dropdown.Item>
                    )}
                    {/* Устгах (эзэн/staff/клубын багш) */}
                    {canDelete && (
                      <Dropdown.Item onClick={handleDeleteClick}>
                        <i className="bi bi-trash me-2"></i>
                        Устгах
                      </Dropdown.Item>
                    )}
                    {(canEdit || canDelete) && <Dropdown.Divider />}

                    {/* Бусад хэрэглэгчийн үйлдлүүд */}
                    {!canEdit && originalAuthor && user.id !== originalAuthor.id && (
                      <>
                        <Dropdown.Item onClick={handleBlockUser}>
                          <i className="bi bi-ban me-2"></i>@{originalAuthor.username}-г block хийх
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleMuteUser}>
                          <i className="bi bi-volume-mute me-2"></i>@{originalAuthor.username}-г
                          mute хийх
                        </Dropdown.Item>
                        <Dropdown.Divider />
                      </>
                    )}

                    {/* AI тусламж — бүх хэрэглэгчид */}
                    <Dropdown.Item onClick={handleAIHelp}>
                      <i className="bi bi-stars me-2"></i>
                      AI тусламж
                    </Dropdown.Item>

                    {/* Бүгдэд харагдах */}
                    {user.id !== originalAuthor?.id && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleReportClick}>
                          <i className="bi bi-flag me-2"></i>
                          Report хийх
                        </Dropdown.Item>
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Stack>

            {/* Постын үндсэн агуулга */}
            <div className="post-body-content" style={{ fontSize: `${fontSize}rem` }}>
              {/* Энгийн бичвэр */}
              {(originalPost.content_type === 'post' || originalPost.content_type === 'reply') &&
                originalPost.content && <LivePreview content={originalPost.content} />}

              {/* Зургийн Галерей */}
              <PostImageGallery images={originalPost.images} />

              {/* Холбоотой контент */}
              {originalPost.content_type !== 'post' && originalPost.content_type !== 'reply' && (
                <PostContent post={originalPost} />
              )}

              {/* Embed */}
              {originalPost.embed_link && <EmbedRenderer url={originalPost.embed_link} postId={originalPost.id} />}
            </div>
          </div>

        </Card.Body>

        {/* --- FOOTER: Үйлдлийн товчнууд --- */}
        <Card.Footer className="bg-white border-top-0 pt-0">
          <Stack direction="horizontal" gap={3} className="post-actions align-items-center">
            {/* Таалагдсан */}
            <Button
              variant="link"
              className="text-decoration-none p-1 d-flex align-items-center text-muted"
              onClick={(e) => handleAction('favorite', e)}
              title="Таалагдсан"
            >
              <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
              <span className={`ms-1 small ${isFavorited ? 'text-danger' : ''}`}>
                {favoriteCount}
              </span>
            </Button>

            {/* Коммент (State-с авсан тоо) - PostDetailPage руу үсрэх */}
            <div
              className="p-1 d-flex align-items-center text-muted"
              style={{ cursor: 'pointer' }}
              title="Сэтгэгдэл"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onCardClick) {
                  onCardClick(currentPost);
                } else if (depth === 0) {
                  const postId = post.uuid || post.id;
                  navigate(`/post/${postId}`);
                }
              }}
            >
              <i className="bi bi-chat-square me-1"></i>
              <span className="ms-1 small">{commentCount}</span>
            </div>

            {/* Үзэлт */}
            <span className="text-muted small ms-2 d-flex align-items-center" title="Үзсэн тоо">
              <i className="bi bi-eye me-1"></i>
              {currentViewCount || 0}
            </span>

            {/* Үсэг томруулах/жижигрүүлэх */}
            <div className="ms-auto d-flex align-items-center">
              <Button
                variant="link"
                className="text-decoration-none p-1 text-muted"
                onClick={decreaseFontSize}
                title="Үсэг жижигрүүлэх"
                disabled={fontSizeIndex === 0}
              >
                <small style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</small>
              </Button>
              <Button
                variant="link"
                className="text-decoration-none p-1 text-muted"
                onClick={increaseFontSize}
                title="Үсэг томруулах"
                disabled={fontSizeIndex === fontSizes.length - 1}
              >
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Aa</span>
              </Button>
            </div>

            {/* Хадгалах */}
            <Button
              variant="link"
              className={`text-decoration-none p-1 ${isBookmarked ? 'text-primary' : 'text-muted'}`}
              onClick={(e) => handleAction('bookmark', e)}
              title="Хадгалах"
            >
              <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
            </Button>

            {/* Repost */}
            <Button
              variant="link"
              className="text-decoration-none text-muted p-1"
              onClick={handleRepost}
              disabled={isReposting || post.content_type === 'repost'}
              title={post.content_type === 'repost' ? 'Дахин repost хийх боломжгүй' : 'Repost'}
            >
              {isReposting ? <Spinner as="span" size="sm" /> : <i className="bi bi-repeat"></i>}
            </Button>

            {/* Сурагчдын хариулт — зөвхөн тест постын эзэнд харагдана */}
            {canEdit &&
              originalPost.content_type === 'quiz' &&
              originalPost.related_quiz?.uuid && (
                <Button
                  variant="link"
                  className="text-decoration-none text-muted p-1"
                  title="Сурагчдын хариулт харах"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/quiz/${originalPost.related_quiz.uuid}/student-answers`);
                  }}
                >
                  <i className="bi bi-people-fill"></i>
                </Button>
              )}
          </Stack>
        </Card.Footer>
      </Card>
    </>
  );
};

export default PostCard;
