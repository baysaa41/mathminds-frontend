// frontend/src/components/PostCard.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// Components
import LivePreview from './LivePreview';
import UserAvatar from './UserAvatar';
import EmbedRenderer from './EmbedRenderer';
import UserName from './UserName';
import PostTimestamp from './PostTimestamp';
import { PostImageGallery } from './postCard/PostImageGallery.jsx';
import { EmbeddedProblemsList } from './postCard/EmbeddedProblemsList.jsx';
import { PostContent } from './postCard/PostContent.jsx';
import { PostMenu } from './postCard/PostMenu.jsx';
import { PostActionsFooter } from './postCard/PostActionsFooter.jsx';
import { DeletePostModal } from './postCard/DeletePostModal.jsx';
import { ReportPostModal } from './postCard/ReportPostModal.jsx';
import { AIHelpModal } from './postCard/AIHelpModal.jsx';
import { EditPostModal } from './postCard/EditPostModal.jsx';

// React Bootstrap
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

// -------------------------------------------------------------------
// ----------------- Үндсэн PostCard компонент -----------------
// -------------------------------------------------------------------
const PostCard = ({
  post,
  onPostDeleted,
  depth = 0,
  compact = false,
  onCardClick,
  onAIReplyAdded,
}) => {
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

    const targetPostUuid = currentPost.reposted_post
      ? currentPost.reposted_post.uuid
      : currentPost.uuid;

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

  // AI чат постын нууц/нийтийн төлөв солих
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const handleToggleVisibility = async (e) => {
    e.stopPropagation();
    setTogglingVisibility(true);
    try {
      const response = await apiClient.post(
        `/api/minds/posts/${currentPost.uuid}/toggle-visibility/`
      );
      setCurrentPost((prev) => ({
        ...prev,
        private_recipients: response.data.is_private ? [user] : [],
      }));
      showNotification(
        response.data.is_private ? 'Пост зөвхөн танд харагдана.' : 'Пост олон нийтэд нээгдлээ.',
        'success'
      );
    } catch (err) {
      console.error('Failed to toggle post visibility:', err);
      showNotification('Төлөв солиход алдаа гарлаа.', 'danger');
    } finally {
      setTogglingVisibility(false);
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
      const targetUuid = currentPost.reposted_post
        ? currentPost.reposted_post.uuid
        : currentPost.uuid;
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
  const canEdit =
    user && currentPost && (isStaff || (currentPost.author && user.id === currentPost.author.id));
  const canDelete =
    user &&
    currentPost &&
    (currentPost.can_delete ||
      isStaff ||
      (currentPost.author && user.id === currentPost.author.id));
  const isRepost = currentPost.content_type === 'repost' && currentPost.reposted_post;
  const originalPost = isRepost ? currentPost.reposted_post : currentPost;
  const originalAuthor = originalPost?.author;
  const reposterAuthor = isRepost ? currentPost.author : null;
  // Repost хийгчийн өөрийн агуулга (сэтгэгдэл/зураг/embed) байвал энэ нь
  // quote tweet болно — тэр үед мөрийн толгой нь repost хийгчийнх, эх пост
  // нь доор нь хүрээтэй хайрцагт харагдана. Агуулгагүй бол энгийн repost.
  const isQuote = Boolean(
    reposterAuthor &&
      ((currentPost.content || '').trim() || currentPost.images?.length || currentPost.embed_link)
  );
  const headerAuthor = isQuote ? reposterAuthor : originalAuthor;
  const headerPost = isQuote ? currentPost : originalPost;

  if (!originalAuthor) {
    return (
      <div className="x-post">
        <p className="text-muted text-center mb-0 py-4">
          Энэ контент олдсонгүй (зохиогч устгасан байж магадгүй).
        </p>
      </div>
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

      <DeletePostModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        title={getModalTitle()}
        contentType={currentPost.content_type}
        isRepost={isRepost}
      />

      <ReportPostModal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        isReporting={isReporting}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportDescription={reportDescription}
        setReportDescription={setReportDescription}
        onSubmit={submitReport}
      />

      <AIHelpModal
        show={showAIModal}
        onHide={() => setShowAIModal(false)}
        aiLoading={aiLoading}
        aiError={aiError}
        aiResponse={aiResponse}
        isSavingReply={isSavingReply}
        onSaveReply={async () => {
          try {
            setIsSavingReply(true);
            const res = await apiClient.post(
              `/api/minds/posts/${currentPost.uuid}/save_ai_reply/`,
              {
                content: aiResponse,
              }
            );
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
      />

      <EditPostModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        isEditing={isEditing}
        editContent={editContent}
        setEditContent={setEditContent}
        onSubmit={submitEdit}
      />

      {/* --- Үндсэн Пост Мөр --- */}
      <article
        ref={cardRef}
        className={`x-post ${compact ? 'x-post--compact' : ''} ${depth > 0 ? 'x-post--reply' : ''}`}
        onClick={navigateToPost}
      >
        {/* Клубын пост мэдээлэл */}
        {currentPost.club && (
          <div className="x-post__banner x-post__banner--club">
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

        {/* AI чат постын нууц/нийтийн заалт */}
        {currentPost.content_type === 'ai_chat' && (
          <div className="x-post__banner x-post__banner--ai">
            <Badge bg="info">AI чат</Badge>
            {currentPost.private_recipients && currentPost.private_recipients.length > 0 ? (
              <span className="text-muted">🔒 Зөвхөн танд харагдана</span>
            ) : (
              <span className="text-muted">🌐 Олон нийтэд</span>
            )}
            {currentPost.author?.id === user?.id && (
              <Button
                variant="link"
                size="sm"
                className="p-0 ms-auto"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
              >
                {togglingVisibility ? (
                  <Spinner animation="border" size="sm" />
                ) : currentPost.private_recipients && currentPost.private_recipients.length > 0 ? (
                  'Олон нийтэд нээх'
                ) : (
                  'Нуух'
                )}
              </Button>
            )}
          </div>
        )}

        {/* Repost мэдээлэл — зөвхөн сэтгэгдэлгүй энгийн repost үед */}
        {isRepost && reposterAuthor && !isQuote && (
          <div className="x-post__banner x-post__banner--repost">
            <i className="bi bi-repeat"></i>
            <UserName user={reposterAuthor} className="fw-semibold" />
            <span>repost хийлээ</span>
          </div>
        )}

        <div className="x-post__row">
          {/* Аватар */}
          <div className="x-post__avatar">
            <Link to={`/profile/${headerAuthor.username}`} onClick={(e) => e.stopPropagation()}>
              <UserAvatar user={headerAuthor} size={40} />
            </Link>
          </div>

          <div className="x-post__main">
            {/* Зохиогчийн мэдээлэл */}
            <div className="x-post__header">
              <UserName user={headerAuthor} className="x-post__name" />
              <div className="x-post__meta">
                <Link
                  to={`/profile/${headerAuthor.username}`}
                  className="x-post__handle"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{headerAuthor.username}
                </Link>
                <span className="x-post__dot">·</span>
                <PostTimestamp date={headerPost.created_at} className="x-post__time" />
              </div>

              {/* Post Menu */}
              <div className="x-post__menu ms-auto">
                <PostMenu
                  postId={post.id}
                  user={user}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  originalAuthor={originalAuthor}
                  onEditClick={handleEditClick}
                  onDeleteClick={handleDeleteClick}
                  onBlockUser={handleBlockUser}
                  onMuteUser={handleMuteUser}
                  onAIHelp={handleAIHelp}
                  onReportClick={handleReportClick}
                />
              </div>
            </div>

            {/* Постын үндсэн агуулга */}
            <div className="x-post__content" style={{ fontSize: `${fontSize}rem` }}>
              {/* Quote: эхлээд repost хийгчийн өөрийн агуулга */}
              {isQuote && currentPost.content && <LivePreview content={currentPost.content} />}
              {isQuote && currentPost.images?.length > 0 && (
                <PostImageGallery images={currentPost.images} />
              )}
              {isQuote && currentPost.embed_link && (
                <EmbedRenderer url={currentPost.embed_link} postId={currentPost.id} />
              )}

              {/* Эх постын агуулга (quote үед хүрээтэй хайрцагт) */}
              <div className={isQuote ? 'x-quote' : ''}>
                {/* Энгийн бичвэр */}
                {(originalPost.content_type === 'post' || originalPost.content_type === 'reply') &&
                  originalPost.content && <LivePreview content={originalPost.content} />}

                {/* Зургийн Галерей */}
                <PostImageGallery images={originalPost.images} />

                {/* Постонд хавсаргасан бодлогууд (Жишээ 1, 2, ...) */}
                <EmbeddedProblemsList problems={originalPost.embedded_problems} />

                {/* Холбоотой контент */}
                {originalPost.content_type !== 'post' && originalPost.content_type !== 'reply' && (
                  <PostContent post={originalPost} />
                )}

                {/* Embed — embed_link байхгүй бол content-аас X/Facebook URL хайна */}
                {(() => {
                  const link =
                    originalPost.embed_link ||
                    (() => {
                      const m = (originalPost.content || '').match(
                        /https?:\/\/(?:(?:www\.|m\.)?(?:x\.com|twitter\.com)\/[^/\s]+\/status\/[0-9]+|(?:www\.|m\.)?facebook\.com\/(?:[^/\s]+\/(?:posts|videos)\/|permalink\.php|photo(?:\.php)?\?|watch)[^\s]*|fb\.watch\/[a-zA-Z0-9_-]+)/
                      );
                      return m ? m[0] : null;
                    })();
                  return link ? <EmbedRenderer url={link} postId={originalPost.id} /> : null;
                })()}
              </div>
            </div>

            {/* --- Үйлдлийн мөр --- */}
            <PostActionsFooter
              isFavorited={isFavorited}
              favoriteCount={favoriteCount}
              onFavorite={(e) => handleAction('favorite', e)}
              commentCount={commentCount}
              onCommentClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onCardClick) {
                  onCardClick(currentPost);
                } else if (depth === 0) {
                  const postId = post.uuid || post.id;
                  navigate(`/post/${postId}`);
                }
              }}
              currentViewCount={currentViewCount}
              fontSizeIndex={fontSizeIndex}
              fontSizesLength={fontSizes.length}
              onDecreaseFontSize={decreaseFontSize}
              onIncreaseFontSize={increaseFontSize}
              isBookmarked={isBookmarked}
              onBookmark={(e) => handleAction('bookmark', e)}
              isReposting={isReposting}
              isOriginalRepost={post.content_type === 'repost'}
              onRepost={handleRepost}
              canEdit={canEdit}
              isQuizPost={originalPost.content_type === 'quiz'}
              quizUuid={originalPost.related_quiz?.uuid}
              onViewStudentAnswers={(e) => {
                e.stopPropagation();
                navigate(`/quiz/${originalPost.related_quiz.uuid}/student-answers`);
              }}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default PostCard;
