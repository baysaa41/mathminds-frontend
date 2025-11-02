// frontend/src/components/CreatePostForm.jsx
// ✅ Twitter Style - Пост үүсгэх форм
// (!!!) ШИНЭЧИЛСЭН: onPostCreated-г бүрэн object-оор дууддаг болсон

import { useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import apiClient from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';

// React Bootstrap
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Collapse from 'react-bootstrap/Collapse';

// Icons
import { Send, Eye, EyeOff } from 'lucide-react';

const CreatePostForm = ({ onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            setError('Пост хоосон байна');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await apiClient.post('/api/minds/posts/', {
                content: content.trim(),
                content_type: 'text' // Одоогоор зөвхөн текст пост
            });

            // (!!!) ЗАСВАР ЭХЛЭЛ: API-с ирсэн хариуг бүрэн post object болгох
            // API-с ирсэн response.data (жишээ нь, {id: 123, content: "..."}) нь
            // post.user мэдээллийг бүрэн агуулаагүй байж болзошгүй.
            // Тиймээс useAuth()-н "user" object-г ашиглан PostCard-д хэрэгтэй
            // бүрэн object-г гараар үүсгэнэ.
            const completeNewPost = {
                ...response.data, // API-с ирсэн (id, content, created_at)
                user: user,       // useAuth-с авсан бүрэн user object

                // PostCard-д хэрэгтэй байж болох бусад талбаруудын анхны утга
                favorite_count: 0,
                comments_count: 0,
                view_count: 0,
                related_content: null,
                is_favorited: false,
                // created_at-г API буцаагаагүй бол одоогийн цагийг нэмнэ
                created_at: response.data.created_at || new Date().toISOString()
            };
            // (!!!) ЗАСВАР ТӨГСГӨЛ

            // Success
            if (onPostCreated) {
                // (!!!) Шинээр үүсгэсэн "бүрэн" object-г дамжуулах
                onPostCreated(completeNewPost);
            }

            // Form цэвэрлэх
            setContent('');
            setShowPreview(false);
        } catch (err) {
            console.error('Create post error:', err);
            setError(err.response?.data?.detail || 'Пост илгээхэд алдаа гарлаа');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return null; // Нэвтрээгүй бол харуулахгүй
    }

    return (
        <Card className="border-0 border-bottom rounded-0 mb-0">
            <Card.Body className="p-3">
                <Form onSubmit={handleSubmit}>
                    <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <UserAvatar user={user} size={40} />
                        </div>

                        {/* Textarea */}
                        <div className="flex-grow-1">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Юу бодож байна? (LaTeX ашиглаж болно: $x^2$)"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={submitting}
                                className="border-0 p-0"
                                style={{
                                    resize: 'none',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                    </Stack>

                    {/* Error */}
                    {error && (
                        <Alert variant="danger" className="py-2 small mb-3">
                            {error}
                        </Alert>
                    )}

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
                                                    wordBreak: 'break-word',
                                                    fontSize: '1rem'
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

                    {/* Action buttons */}
                    <Stack direction="horizontal" gap={2} className="justify-content-between align-items-center pt-2 border-top">
                        {/* Preview toggle */}
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

                        {/* Character count */}
                        <Stack direction="horizontal" gap={2}>
                            <span
                                className={`small ${content.length > 500 ? 'text-danger' : 'text-muted'}`}
                            >
                                {content.length}/500
                            </span>

                            {/* Submit button */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={submitting || !content.trim() || content.length > 500}
                                style={{ minWidth: '80px' }}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-1" />
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
                    </Stack>

                    {/* Help text */}
                    <div className="small text-muted mt-2">
                        💡 LaTeX томъёо: $x^2$ эсвэл $$\int_0^1 x dx$$
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default CreatePostForm;