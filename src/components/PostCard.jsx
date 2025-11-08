// frontend/src/components/PostCard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import LivePreview from './LivePreview';
import CommentSection from './CommentSection';
import UserAvatar from './UserAvatar';

import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';

// ----------------- PostContent компонент -----------------
const PostContent = ({ post }) => {
    if (!post) return null;

    if (post.content_type === 'post' || post.content_type === 'repost' || post.content_type === 'reply') {
        if (post.content) return <LivePreview content={post.content} />;
        return null;
    }

    const relatedItem =
        post.related_problem ||
        post.related_formula ||
        post.related_article ||
        post.related_quiz;

    if (!relatedItem)
        return <div className="text-muted fst-italic">[Холбоотой контент олдсонгүй]</div>;

    let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;
    let description =
        relatedItem.statement ||
        relatedItem.abstract ||
        relatedItem.description ||
        relatedItem.content ||
        '';
    let typeLabel;

    switch (post.content_type) {
        case 'problem': typeLabel = 'Бодлого'; break;
        case 'formula': typeLabel = 'Томьёо'; break;
        case 'article': typeLabel = 'Өгүүлэл'; break;
        case 'quiz': typeLabel = 'Тест'; break;
        default: typeLabel = 'Контент';
    }

    return (
        <Card className="bg-light border shadow-sm mt-2">
            <Card.Body>
                <Badge bg="secondary" className="mb-2">{typeLabel}</Badge>
                <Card.Title className="h6 mathjax-content mb-1">
                    <LivePreview content={title} />
                </Card.Title>
                {description && (
                    <Card.Text as="div" className="small text-muted mathjax-content">
                        <LivePreview content={description} />
                    </Card.Text>
                )}
            </Card.Body>
        </Card>
    );
};

// ----------------- Үндсэн PostCard компонент -----------------
const PostCard = ({ post, onPostDeleted, depth = 0 }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isFavorited, setIsFavorited] = useState(post.is_favored);
    const [favoriteCount, setFavoriteCount] = useState(post.favorite_count || 0);
    const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
    const [isReposting, setIsReposting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [currentCommentCount, setCurrentCommentCount] = useState(post.replies_count || 0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentViewCount, setCurrentViewCount] = useState(
        (post.reposted_post ? post.reposted_post.view_count : post.view_count) || 0
    );
    const [viewCountIncremented, setViewCountIncremented] = useState(false);
    const cardRef = useRef(null);

    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    // -------------------- Favorite / Bookmark --------------------
    const handleAction = async (actionType) => {
        if (!user) {
            showNotification('Энэ үйлдлийг хийхийн тулд нэвтэрнэ үү.', 'warning');
            return;
        }

        let url;
        switch (actionType) {
            case 'favorite': url = `/api/minds/posts/${post.id}/favorite/`; break;
            case 'bookmark': url = `/api/minds/posts/${post.id}/bookmark/`; break;
            default: return;
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

    // -------------------- Repost --------------------
    const handleRepost = async () => {
        if (!user) {
            showNotification('Repost хийхийн тулд нэвтэрнэ үү.', 'warning');
            return;
        }
        if (isReposting) return;
        if (post.content_type === 'repost') {
            showNotification('Repost хийгдсэн постыг дахин repost хийх боломжгүй.', 'warning');
            return;
        }

        setIsReposting(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${post.id}/repost/`, { content: null });
            if (response.status === 201) showNotification('Амжилттай repost хийлээ!', 'success');
            else if (response.status === 200)
                showNotification(response.data.message || 'Та аль хэдийн repost хийсэн байна.', 'info');
        } catch (err) {
            console.error('Failed to repost:', err);
            showNotification(err.response?.data?.error || 'Repost хийхэд алдаа гарлаа.', 'danger');
        } finally {
            setIsReposting(false);
        }
    };

    // -------------------- Delete --------------------
    const handleDeleteClick = () => setShowDeleteModal(true);

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/minds/posts/${post.id}/`);
            showNotification('Пост амжилттай устлаа.', 'success');
            if (onPostDeleted) onPostDeleted(post.id);
        } catch (err) {
            console.error('Failed to delete post:', err);
            showNotification(err.response?.data?.detail || 'Пост устгахад алдаа гарлаа.', 'danger');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // -------------------- Comment Count --------------------
    const handleCommentCountChange = (newCount) => setCurrentCommentCount(newCount);

    // -------------------- Navigation --------------------
    const navigateToPost = (e) => {
        if (e.target.closest('a, button, .dropdown-toggle, .dropdown-item, .post-actions')) {
            e.stopPropagation();
            return;
        }
        if (post.content_type === 'repost' && post.reposted_post) {
            navigate(`/post/${post.reposted_post.id}`);
        } else {
            navigate(`/post/${post.id}`);
        }
    };

    // -------------------- View Count --------------------
    const incrementViewCount = useCallback(async () => {
        if (!user || viewCountIncremented) return;
        setViewCountIncremented(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${post.id}/view/`);
            if (response.data && response.data.view_count !== undefined)
                setCurrentViewCount(response.data.view_count);
        } catch (err) {
            console.error(`Failed to increment view count for post ${post.id}:`, err);
        }
    }, [user, post.id, viewCountIncremented]);

    useEffect(() => {
        if (depth > 0 || !user || viewCountIncremented) return;
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
    }, [incrementViewCount, viewCountIncremented, user, depth]);

    const canEditOrDelete = user && post.author && (user.id === post.author.id || user.is_staff);
    const isRepost = post.content_type === 'repost' && post.reposted_post;
    const originalPost = isRepost ? post.reposted_post : post;
    const originalAuthor = originalPost?.author;
    const reposterAuthor = isRepost ? post.author : null;

    if (!originalAuthor) {
        return (
            <Card className="shadow-sm m-3 post-card">
                <Card.Body>
                    <p className="text-muted text-center">Зохиогчийн мэдээлэл олдсонгүй.</p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg={toastVariant}>
                    <Toast.Body className={toastVariant === 'light' ? 'text-dark' : 'text-white'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h5">{isRepost ? "Repost устгах" : "Пост устгах"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Та энэ {isRepost ? "repost-г" : "постыг"} устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Болих
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner as="span" size="sm" className="me-1" /> : <i className="bi bi-trash me-1"></i>}
                        Устгах
                    </Button>
                </Modal.Footer>
            </Modal>

            <Card
                ref={cardRef}
                className="shadow-sm m-3 post-card"
                onClick={depth > 0 ? undefined : navigateToPost}
                style={{ cursor: depth > 0 ? 'default' : 'pointer' }}
            >
                {isRepost && reposterAuthor && (
                    <div className="text-muted small px-3 pt-2 pb-1 border-bottom bg-light">
                        <i className="bi bi-repeat me-2"></i>
                        <Link to={`/profile/${reposterAuthor.username}`} className="fw-bold text-decoration-none text-dark">
                            {reposterAuthor.first_name || reposterAuthor.email}
                        </Link>
                        <span className="ms-1">reminded</span>
                    </div>
                )}

                <Card.Body className="pb-2">
                    {isRepost && post.content && (
                        <div className="mb-2">
                            <LivePreview content={post.content} />
                        </div>
                    )}

                    <div className={isRepost ? "reposted-content-wrapper border rounded p-3" : ""}>
                        <Stack direction="horizontal" gap={3} className="align-items-start mb-2">
                            <Link to={`/profile/${originalAuthor.username}`}>
                                <UserAvatar user={originalAuthor} size={40} />
                            </Link>
                            <div className="flex-grow-1">
                                <Link to={`/profile/${originalAuthor.username}`} className="fw-bold text-decoration-none text-dark mb-0">
                                    {originalAuthor.first_name || originalAuthor.email}
                                </Link>
                                <p className="text-muted small mb-0" title={new Date(originalPost.created_at).toISOString()}>
                                    {new Date(originalPost.created_at).toLocaleString('mn-MN', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                            {!isRepost && canEditOrDelete && (
                                <Dropdown align="end">
                                    <Dropdown.Toggle variant="link" size="sm" className="text-muted no-caret p-0" id={`dropdown-post-${post.id}`}>
                                        <i className="bi bi-three-dots-vertical"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={handleDeleteClick} className="text-danger">
                                            Устгах
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </Stack>

                        <div className="post-body-content">
                            {originalPost.image && (
                                <img src={originalPost.image} className="img-fluid rounded mb-2 post-image" alt="Post" />
                            )}
                            <PostContent post={originalPost} />
                        </div>
                    </div>

                    {isRepost && post.image && (
                        <img src={post.image} className="img-fluid rounded my-2 post-image" alt="Repost" />
                    )}

                    <div className="mt-3">
                        <CommentSection
                            postId={post.id}
                            initialCount={currentCommentCount}
                            onCountChange={handleCommentCountChange}
                        />
                    </div>
                </Card.Body>

                <Card.Footer className="bg-white border-top-0 pt-0">
                    <Stack direction="horizontal" gap={3} className="post-actions align-items-center">
                        <Button
                            variant="link"
                            className="text-decoration-none p-1 d-flex align-items-center text-muted"
                            onClick={() => handleAction('favorite')}
                            title="Таалагдсан"
                        >
                            <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                            <span className={`ms-1 small ${isFavorited ? 'text-danger' : ''}`}>{favoriteCount}</span>
                        </Button>

                        <div className="text-muted p-1 d-flex align-items-center" style={{ cursor: 'default' }}>
                            <i className="bi bi-chat-square me-1"></i>
                            <span className="ms-1 small">{currentCommentCount}</span>
                        </div>

                        <span className="text-muted small ms-2 d-flex align-items-center" title="Үзсэн тоо">
                            <i className="bi bi-eye me-1"></i>
                            {currentViewCount || 0}
                        </span>

                        <Button
                            variant="link"
                            className={`text-decoration-none ms-auto p-1 ${isBookmarked ? 'text-primary' : 'text-muted'}`}
                            onClick={() => handleAction('bookmark')}
                            title="Хадгалах"
                        >
                            <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                        </Button>

                        <Button
                            variant="link"
                            className="text-decoration-none text-muted p-1"
                            onClick={handleRepost}
                            disabled={isReposting || post.content_type === 'repost'}
                            title={post.content_type === 'repost' ? "Дахин repost хийх боломжгүй" : "Repost"}
                        >
                            {isReposting ? <Spinner as="span" size="sm" className="me-1" /> : <i className="bi bi-repeat"></i>}
                        </Button>
                    </Stack>
                </Card.Footer>
            </Card>
        </>
    );
};

export default PostCard;
