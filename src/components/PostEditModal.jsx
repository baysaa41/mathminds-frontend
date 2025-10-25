// frontend/src/components/PostEditModal.jsx
// ✅ Post засах modal - Twitter style

import { useState, useEffect } from 'react';
import { MathJax } from 'better-react-mathjax';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Collapse from 'react-bootstrap/Collapse';
import Card from 'react-bootstrap/Card';

// Icons
import { Save, X, Eye, EyeOff } from 'lucide-react';

const PostEditModal = ({ show, onHide, post, onPostUpdated }) => {
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Modal нээгдэх үед content-ийг тохируулах
    useEffect(() => {
        if (show && post) {
            setContent(post.content || '');
            setError(null);
        }
    }, [show, post]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('Пост хоосон байна');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Backend-д patch request илгээх
            const response = await apiClient.patch(`/api/minds/posts/${post.id}/`, {
                content: content.trim()
            });

            // Success
            if (onPostUpdated) {
                onPostUpdated(response.data);
            }

            // Modal хаах
            onHide();
        } catch (err) {
            console.error('Update post error:', err);
            setError(err.response?.data?.detail || 'Засварлахад алдаа гарлаа');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) {
            setContent(post?.content || '');
            setError(null);
            setShowPreview(false);
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="h5">Пост засах</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Error */}
                    {error && (
                        <Alert variant="danger" className="py-2 small mb-3">
                            {error}
                        </Alert>
                    )}

                    {/* Textarea */}
                    <Form.Group className="mb-3">
                        <Form.Control
                            as="textarea"
                            rows={6}
                            placeholder="Пост засах... (LaTeX ашиглаж болно: $x^2$)"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={submitting}
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            LaTeX томъёо: $x^2$ эсвэл $$\int_0^1 x dx$$
                        </Form.Text>
                    </Form.Group>

                    {/* Preview */}
                    <Collapse in={showPreview}>
                        <div>
                            <Card className="bg-light border-0 mb-3">
                                <Card.Body className="p-3">
                                    <div className="small text-muted mb-2 fw-semibold">
                                        👁 Preview:
                                    </div>
                                    {content.trim() ? (
                                        <MathJax hideUntilTypeset={"first"}>
                                            <div
                                                className="mathjax-content"
                                                style={{
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                {content}
                                            </div>
                                        </MathJax>
                                    ) : (
                                        <div className="text-muted small fst-italic">
                                            Preview харагдахгүй байна...
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </div>
                    </Collapse>

                    {/* Preview toggle + Character count */}
                    <Stack direction="horizontal" gap={2} className="justify-content-between mb-3">
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-0 text-muted text-decoration-none"
                        >
                            {showPreview ? (
                                <>
                                    <EyeOff size={16} className="me-1" />
                                    <span className="small">Preview нуух</span>
                                </>
                            ) : (
                                <>
                                    <Eye size={16} className="me-1" />
                                    <span className="small">Preview харах</span>
                                </>
                            )}
                        </Button>

                        <span
                            className={`small ${content.length > 500 ? 'text-danger' : 'text-muted'}`}
                        >
                            {content.length}/500
                        </span>
                    </Stack>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClose}
                    disabled={submitting}
                >
                    <X size={14} className="me-1" />
                    Цуцлах
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || !content.trim() || content.length > 500}
                >
                    {submitting ? (
                        <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Хадгалж байна...
                        </>
                    ) : (
                        <>
                            <Save size={14} className="me-1" />
                            Хадгалах
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PostEditModal;