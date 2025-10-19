// frontend/src/components/PostCard.jsx

import { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Eye } from 'lucide-react';
import apiClient from '../api/axiosConfig';

// React Bootstrap components
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { useNavigate } from 'react-router-dom';

// MathJax component
import { MathJax } from "better-react-mathjax";

// --- Нэмэлт: Төрөл тус бүрийн контентыг харуулах туслах компонент ---
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
                <Card className="bg-light border shadow-sm mt-2 fade-in">
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
// --- Туслах компонент дууссан ---


const PostCard = ({ post, onBookmarkRemoved }) => {
    const [postData, setPostData] = useState(post);
    const [isFavoriting, setIsFavoriting] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);

    // Toast notification
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    if (!postData || !postData.author) {
        return null;
    }

    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    const handleFavorite = async () => {
        if (isFavoriting) return;
        setIsFavoriting(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${postData.id}/favorite/`);
            setPostData(response.data);

            // Notification харуулах
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

            // Notification харуулах
            if (response.data.is_bookmarked) {
                showNotification('🔖 Хадгалсан!', 'success');
            } else {
                showNotification('Хадгалсан хасагдлаа', 'info');
                // Хэрэв bookmarks хуудас дээр байгаа бол постыг жагсаалтаас хасах
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

    // Холбогдох контентыг олох
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

            <Card className="border-0 border-bottom rounded-0 fade-in">
                <Card.Body className="p-3">
                    <Stack direction="horizontal" gap={3} className="align-items-start">
                        {/* Аватар */}
                        <div className="flex-shrink-0">
                            <div className="d-flex align-items-center justify-content-center bg-primary-subtle rounded-circle text-primary fw-bold" style={{ width: '40px', height: '40px' }}>
                                {postData.author.first_name ? postData.author.first_name.charAt(0).toUpperCase() : '?'}
                            </div>
                        </div>

                        <div className="flex-grow-1 min-w-0">
                            {/* Хэрэглэгчийн нэр, имэйл */}
                            <Stack direction="horizontal" gap={2} className="mb-1 flex-wrap align-items-baseline">
                                <a href="#" className="fw-bold text-dark text-decoration-none me-1">
                                    {postData.author.first_name || 'Хэрэглэгч'} {postData.author.last_name || ''}
                                </a>
                                <span className="text-muted small text-truncate">@{postData.author.email}</span>
                            </Stack>

                            {/* Постын үндсэн текст */}
                            <MathJax hideUntilTypeset={"first"}>
                                <p className="mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {postData.content}
                                </p>
                            </MathJax>

                            {/* Холбогдох контентыг харуулах */}
                            {relatedData && postData.content_type !== 'text' && (
                                <RelatedContentDisplay type={postData.content_type} data={relatedData} />
                            )}

                            {/* Action товчнууд */}
                            <Stack direction="horizontal" gap={4} className="text-muted mt-2">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 text-muted d-flex align-items-center text-decoration-none btn-icon-hover"
                                >
                                    <MessageCircle size={16} className="me-1" />
                                    <span className="small">{postData.comments_count}</span>
                                </Button>

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
        </>
    );
};

export default PostCard;