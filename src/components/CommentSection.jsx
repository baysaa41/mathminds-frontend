// frontend/src/components/CommentSection.jsx
// ✅ Twitter Style Comment System

import { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

// React Bootstrap
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';

// Icons
import { MessageCircle, Send, Edit2, Trash2, X } from 'lucide-react';

// --- CommentItem компонент ---
const CommentItem = ({ comment, onEdit, onDelete, currentUserId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [saving, setSaving] = useState(false);

    const canEdit = currentUserId === comment.author?.id;

    const handleSaveEdit = async () => {
        try {
            setSaving(true);
            await apiClient.patch(`/api/minds/comments/${comment.id}/`, {
                content: editContent
            });
            onEdit(comment.id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Edit error:', error);
            alert('Засварлахад алдаа гарлаа');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(comment.content);
        setIsEditing(false);
    };

    return (
        <Card className="mb-2 border-0 border-start border-3 border-primary border-opacity-25">
            <Card.Body className="p-3">
                <Stack direction="horizontal" gap={2} className="mb-2">
                    {/* Avatar */}
                    <div
                        className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle text-secondary fw-bold flex-shrink-0"
                        style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                    >
                        {comment.author?.first_name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Author info */}
                    <div className="flex-grow-1 min-w-0">
                        <Stack direction="horizontal" gap={2} className="align-items-baseline flex-wrap">
                            <span className="fw-semibold small text-truncate">
                                {comment.author?.first_name || 'User'} {comment.author?.last_name || ''}
                            </span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(comment.created_at).toLocaleString('mn-MN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </Stack>
                    </div>

                    {/* Action buttons */}
                    {canEdit && !isEditing && (
                        <Stack direction="horizontal" gap={1}>
                            <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-muted"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit2 size={14} />
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                className="p-1 text-danger"
                                onClick={() => onDelete(comment.id)}
                            >
                                <Trash2 size={14} />
                            </Button>
                        </Stack>
                    )}
                </Stack>

                {/* Content */}
                {isEditing ? (
                    <div>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mb-2"
                        />
                        <Stack direction="horizontal" gap={2} className="justify-content-end">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                <X size={14} className="me-1" />
                                Цуцлах
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={saving || !editContent.trim()}
                            >
                                {saving ? (
                                    <Spinner animation="border" size="sm" />
                                ) : (
                                    <>
                                        <Send size={14} className="me-1" />
                                        Хадгалах
                                    </>
                                )}
                            </Button>
                        </Stack>
                    </div>
                ) : (
                    <MathJax hideUntilTypeset={"first"}>
                        <div
                            className="small mathjax-content"
                            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        >
                            {comment.content}
                        </div>
                    </MathJax>
                )}
            </Card.Body>
        </Card>
    );
};

// --- CommentForm компонент ---
const CommentForm = ({ postId, onCommentAdded }) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('Хариулт хоосон байна');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await apiClient.post('/api/minds/comments/', {
                post: postId,
                content: content.trim()
            });

            onCommentAdded(response.data);
            setContent('');
        } catch (err) {
            console.error('Comment submit error:', err);
            setError(err.response?.data?.detail || 'Хариулт илгээхэд алдаа гарлаа');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="border-0 bg-light">
            <Card.Body className="p-3">
                <Form onSubmit={handleSubmit}>
                    {error && (
                        <Alert variant="danger" className="small py-2 mb-2">
                            {error}
                        </Alert>
                    )}

                    <Form.Group className="mb-2">
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Хариулт бичих... (LaTeX ашиглаж болно: $x^2$)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={submitting}
                        />
                        <Form.Text className="text-muted">
                            Enter дарж мөр солих, LaTeX: $томъёо$
                        </Form.Text>
                    </Form.Group>

                    <Stack direction="horizontal" gap={2} className="justify-content-end">
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={submitting || !content.trim()}
                        >
                            {submitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Илгээж байна...
                                </>
                            ) : (
                                <>
                                    <Send size={14} className="me-1" />
                                    Илгээх
                                </>
                            )}
                        </Button>
                    </Stack>
                </Form>
            </Card.Body>
        </Card>
    );
};

// --- Үндсэн CommentSection ---
const CommentSection = ({ postId, initialCount = 0, onCountChange }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(initialCount);

    // Delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (showComments) {
            fetchComments();
        }
    }, [showComments, postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/api/minds/comments/?post=${postId}`);

            // Pagination шалгах
            const data = response.data.results || response.data;
            setComments(Array.isArray(data) ? data : []);
            setCommentCount(response.data.count || data.length);
        } catch (err) {
            console.error('Fetch comments error:', err);
            setError('Хариултууд татахад алдаа гарлаа');
        } finally {
            setLoading(false);
        }
    };

    const handleCommentAdded = (newComment) => {
        setComments(prev => [...prev, newComment]);
        const newCount = commentCount + 1;
        setCommentCount(newCount);

        // ✅ Parent-д мэдэгдэх
        if (onCountChange) {
            onCountChange(newCount);
        }
    };

    const handleCommentEdited = (commentId, newContent) => {
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, content: newContent } : c
        ));
    };

    const handleDeleteClick = (commentId) => {
        setDeletingCommentId(commentId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleting(true);
            await apiClient.delete(`/api/minds/comments/${deletingCommentId}/`);

            setComments(prev => prev.filter(c => c.id !== deletingCommentId));
            const newCount = commentCount - 1;
            setCommentCount(newCount);

            // ✅ Parent-д мэдэгдэх
            if (onCountChange) {
                onCountChange(newCount);
            }

            setShowDeleteModal(false);
            setDeletingCommentId(null);
        } catch (err) {
            console.error('Delete error:', err);
            alert('Устгахад алдаа гарлаа');
        } finally {
            setDeleting(false);
        }
    };

    const toggleComments = () => {
        setShowComments(prev => !prev);
    };

    return (
        <div className="comment-section">
            {/* Toggle button */}
            <Button
                variant="link"
                size="sm"
                onClick={toggleComments}
                className="p-0 text-muted d-flex align-items-center text-decoration-none"
            >
                <MessageCircle size={16} className="me-1" />
                <span className="small">
                    {commentCount} {showComments ? '▲' : '▼'}
                </span>
            </Button>

            {/* Comments area */}
            {showComments && (
                <div className="mt-3">
                    {/* Comment form - зөвхөн нэвтэрсэн хэрэглэгч */}
                    {user ? (
                        <CommentForm
                            postId={postId}
                            onCommentAdded={handleCommentAdded}
                        />
                    ) : (
                        <Alert variant="info" className="small mb-3">
                            Хариулт бичихийн тулд нэвтэрнэ үү
                        </Alert>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-3">
                            <Spinner animation="border" size="sm" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert variant="danger" className="small">
                            {error}
                        </Alert>
                    )}

                    {/* Comments list */}
                    {!loading && !error && (
                        <div className="mt-3">
                            {comments.length === 0 ? (
                                <div className="text-center text-muted small py-3">
                                    Хариулт байхгүй байна. Эхний хариултыг та бичээрэй!
                                </div>
                            ) : (
                                comments.map(comment => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        onEdit={handleCommentEdited}
                                        onDelete={handleDeleteClick}
                                        currentUserId={user?.id}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Delete confirmation modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Хариулт устгах</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-0">Та энэ хариултыг үнэхээр устгахыг хүсч байна уу?</p>
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
        </div>
    );
};

export default CommentSection;