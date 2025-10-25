// frontend/src/components/PostCard.jsx
// ✅ ШИНЭЧИЛСЭН: Edit/Delete функц нэмсэн

import { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Bookmark, Eye, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// React Bootstrap components
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { useNavigate } from 'react-router-dom';

// MathJax component
import { MathJax } from "better-react-mathjax";

// Components
import CommentSection from './CommentSection';
import PostEditModal from './PostEditModal';

// --- Туслах компонент ---
const RelatedContentDisplay = ({ type, data }) => {
    const navigate = useNavigate();
    if (!data) return null;

    const handleNavigate = (path) => {
        navigate(path);
    };

    switch (type) {
        case 'article':
            return (
                <Card
                    className="bg-light border shadow-sm mt-2 hover-card fade-in"
                    onClick={() => handleNavigate(`/article/${data.id}`)}
                    style={{ cursor: 'pointer' }}
                >
                    <Card.Body className="p-2">
                        <Badge pill bg="info" className="mb-1">Өгүүлэл</Badge>
                        <MathJax hideUntilTypeset={"first"}>
                            <Card.Title as="h6" className="fw-semibold mb-1 mathjax-content">{data.title}</Card.Title>
                            {data.abstract && <Card.Text className="small text-muted mathjax-content">{data.abstract}</Card.Text>}
                        </MathJax>
                    </Card.Body>
                </Card>
            );
        case 'problem':
            return (
                <Card
                    className="bg-light border shadow-sm mt-2 hover-card fade-in"
                    onClick={() => handleNavigate(`/problem/${data.id}`)}
                    style={{ cursor: 'pointer' }}
                >
                    <Card.Body className="p-2">
                        <Badge pill bg="warning" text="dark" className="mb-1">Бодлого</Badge>
                        <MathJax hideUntilTypeset={"first"}>
                            {data.title && <Card.Title as="h6" className="fw-semibold mb-1 mathjax-content">{data.title}</Card.Title>}
                            <div className="small mathjax-content">{data.statement}</div>
                        </MathJax>
                        {data.level_name && <Badge bg="secondary" className="mt-1">{data.level_name}</Badge>}
                    </Card.Body>
                </Card>
            );
        case 'formula':
            return (
                <Card className="bg-light border shadow-sm mt-2 fade-in">
                    <Card.Body className="p-2">
                        <Badge pill bg="success" className="mb-1">Томьёо</Badge>
                        <MathJax hideUntilTypeset={"first"}>
                            {data.title && <Card.Title as="h6" className="fw-semibold mb-1 mathjax-content">{data.title}</Card.Title>}
                            <div className="small mathjax-content">{data.content}</div>
                        </MathJax>
                        {data.topic_name && <Badge bg="secondary" className="mt-1">{data.topic_name}</Badge>}
                    </Card.Body>
                </Card>
            );
        case 'quiz':
            return (
                <Card className="bg-light border shadow-sm mt-2 fade-in">
                    <Card.Body className="p-2">
                        <Badge pill bg="danger" className="mb-1">Шалгалт</Badge>
                        <Card.Title as="h6" className="fw-semibold mb-1">{data.name}</Card.Title>
                        {data.description && <Card.Text className="small text-muted">{data.description}</Card.Text>}
                        {data.grade_name && <Badge bg="secondary" className="mt-1">{data.grade_name}</Badge>}
                    </Card.Body>
                </Card>
            );
        default:
            return null;
    }
};

const PostCard = ({ post, onBookmarkRemoved, onPostDeleted }) => {
    const { user } = useAuth();
    const [postData, setPostData] = useState(post);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);

    const cardRef = useRef(null);
    const [isViewCountSent, setIsViewCountSent] = useState(false);

    // Toast notification
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    // ✅ Edit/Delete modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!postData || !postData.author) {
        return null;
    }

    // ✅ Өөрийн пост эсэхийг шалгах
    const isOwnPost = user && postData.author && user.id === postData.author.id;

    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    // Үзсэн тоог нэмэгдүүлэх
    const incrementViewCount = useCallback(async () => {
        if (isViewCountSent) return;

        try {
            setIsViewCountSent(true);
            const response = await apiClient.post(`/api/minds/posts/${postData.id}/view/`);

            if (response.status === 200 && response.data.view_count) {
                setPostData(prevData => ({
                    ...prevData,
                    view_count: response.data.view_count
                }));
            }
        } catch (error) {
            console.warn("Failed to increment view count:", error);
        }
    }, [postData.id, isViewCountSent]);

    // IntersectionObserver
    useEffect(() => {
        const currentCardRef = cardRef.current;
        if (!currentCardRef) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    incrementViewCount();
                    observer.unobserve(currentCardRef);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(currentCardRef);

        return () => {
            if (currentCardRef) {
                observer.unobserve(currentCardRef);
            }
        };
    }, [incrementViewCount]);

    const handleFavorite = async () => {
        if (isFavoriting) return;
        setIsFavoriting(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${postData.id}/favorite/`);
            setPostData(response.data);

            if (response.data.is_favorited) {
                showNotification('❤️ Таалагдсан!', 'success');
            } else {
                showNotification('Таалагдсан хасагдлаа', 'info');
            }
        } catch (error) {
            console.error("Лайк дарахад алдаа гарлаа:", error);
            showNotification('Алдаа гарлаа. Дахин оролдоно уу.', 'danger');
        } finally {
            setIsFavoriting(false);
        }
    };

    const handleBookmark = async () => {
        if (isBookmarking) return;
        setIsBookmarking(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${postData.id}/bookmark/`);
            setPostData(response.data);

            if (response.data.is_bookmarked) {
                showNotification('🔖 Хадгалсан!', 'success');
            } else {
                showNotification('Хадгалсан хасагдлаа', 'info');
                if (onBookmarkRemoved) {
                    onBookmarkRemoved(postData.id);
                }
            }
        } catch (error) {
            console.error("Bookmark хийхэд алдаа гарлаа:", error);
            showNotification('Алдаа гарлаа. Дахин оролдоно уу.', 'danger');
        } finally {
            setIsBookmarking(false);
        }
    };

    // ✅ Post засах
    const handlePostUpdated = (updatedPost) => {
        setPostData(updatedPost);
        showNotification('✅ Пост амжилттай засагдлаа!', 'success');
    };

    // ✅ Post устгах
    const handleDeleteConfirm = async () => {
        try {
            setDeleting(true);
            await apiClient.delete(`/api/minds/posts/${postData.id}/`);

            showNotification('🗑 Пост устгагдлаа', 'info');
            setShowDeleteModal(false);

            // Parent компонентод мэдэгдэх
            if (onPostDeleted) {
                onPostDeleted(postData.id);
            }
        } catch (error) {
            console.error('Delete post error:', error);
            showNotification('Устгахад алдаа гарлаа', 'danger');
        } finally {
            setDeleting(false);
        }
    };

    // Comment count шинэчлэх
    const handleCommentCountChange = (newCount) => {
        setPostData(prev => ({
            ...prev,
            comments_count: newCount
        }));
    };

    // Холбогдох контент
    let relatedData = null;
    if (postData.related_content && postData.related_content.data) {
        relatedData = postData.related_content.data;
    }

    return (
        <>
            {/* Toast Notification */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Body className="text-white">{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            <Card ref={cardRef} className="border-0 border-bottom rounded-0 fade-in">
                <Card.Body className="p-3">
                    <Stack direction="horizontal" gap={3} className="align-items-start">
                        {/* Аватар */}
                        <div className="flex-shrink-0">
                            <div className="d-flex align-items-center justify-content-center bg-primary-subtle rounded-circle text-primary fw-bold" style={{ width: '40px', height: '40px' }}>
                                {postData.author.first_name ? postData.author.first_name.charAt(0).toUpperCase() : '?'}
                            </div>
                        </div>

                        <div className="flex-grow-1 min-w-0">
                            {/* Хэрэглэгчийн нэр + Dropdown */}
                            <Stack direction="horizontal" gap={2} className="mb-1 flex-wrap align-items-center justify-content-between">
                                <Stack direction="horizontal" gap={2} className="align-items-baseline">
                                    <a href="#" className="fw-bold text-dark text-decoration-none me-1">
                                        {postData.author.first_name || 'Хэрэглэгч'} {postData.author.last_name || ''}
                                    </a>
                                    <span className="text-muted small text-truncate">@{postData.author.username}</span>
                                </Stack>

                                {/* ✅ Edit/Delete dropdown - зөвхөн өөрийн пост */}
                                {isOwnPost && (
                                    <Dropdown align="end">
                                        <Dropdown.Toggle
                                            variant="link"
                                            size="sm"
                                            className="p-0 text-muted border-0"
                                            style={{ boxShadow: 'none' }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => setShowEditModal(true)}>
                                                <Edit2 size={14} className="me-2" />
                                                Засах
                                            </Dropdown.Item>
                                            <Dropdown.Divider />
                                            <Dropdown.Item
                                                onClick={() => setShowDeleteModal(true)}
                                                className="text-danger"
                                            >
                                                <Trash2 size={14} className="me-2" />
                                                Устгах
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </Stack>

                            {/* Постын текст */}
                            <MathJax hideUntilTypeset={"first"}>
                                <p className="mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {postData.content}
                                </p>
                            </MathJax>

                            {/* Холбогдох контент */}
                            {relatedData && postData.content_type !== 'text' && (
                                <RelatedContentDisplay type={postData.content_type} data={relatedData} />
                            )}

                            {/* Action товчнууд */}
                            <Stack direction="horizontal" gap={4} className="text-muted mt-2">
                                <div>
                                    <CommentSection
                                        postId={postData.id}
                                        initialCount={postData.comments_count}
                                        onCountChange={handleCommentCountChange}
                                    />
                                </div>

                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handleFavorite}
                                    disabled={isFavoriting}
                                    className={`p-0 d-flex align-items-center text-decoration-none btn-icon-hover ${postData.is_favorited ? 'text-danger' : 'text-muted'}`}
                                >
                                    <Heart
                                        size={16}
                                        fill={postData.is_favorited ? 'currentColor' : 'none'}
                                        className="me-1"
                                    />
                                    <span className="small">{postData.favorite_count}</span>
                                </Button>

                                <div className="d-flex align-items-center text-muted">
                                    <Eye size={16} className="me-1" />
                                    <span className="small">{postData.view_count}</span>
                                </div>

                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={handleBookmark}
                                    disabled={isBookmarking}
                                    className={`p-0 d-flex align-items-center text-decoration-none btn-icon-hover ${postData.is_bookmarked ? 'text-warning' : 'text-muted'}`}
                                >
                                    <Bookmark size={16} fill={postData.is_bookmarked ? 'currentColor' : 'none'} />
                                </Button>
                            </Stack>
                        </div>
                    </Stack>
                </Card.Body>
            </Card>

            {/* ✅ Edit Modal */}
            <PostEditModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                post={postData}
                onPostUpdated={handlePostUpdated}
            />

            {/* ✅ Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Пост устгах</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">Та энэ постыг үнэхээр устгахыг хүсч байна уу? Энэ үйлдлийг буцаах боломжгүй.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deleting}
                    >
                        Цуцлах
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteConfirm}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Устгаж байна...
                            </>
                        ) : (
                            <>
                                <Trash2 size={14} className="me-1" />
                                Устгах
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default PostCard;