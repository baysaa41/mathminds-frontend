// frontend/src/pages/PostDetailPage.jsx
// (!!! ШИНЭЧИЛСЭН: 100% өргөнтэй болгосон)

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

// Components
import LivePreview from '../components/LivePreview'; //
import CommentSection from '../components/CommentSection'; //
import UserAvatar from '../components/UserAvatar'; //

// Bootstrap
import Container from 'react-bootstrap/Container'; //
import Row from 'react-bootstrap/Row'; //
import Col from 'react-bootstrap/Col'; //
import Card from 'react-bootstrap/Card'; //
import Spinner from 'react-bootstrap/Spinner'; //
import Alert from 'react-bootstrap/Alert'; //
import Stack from 'react-bootstrap/Stack'; //
import Button from 'react-bootstrap/Button'; //
import Badge from 'react-bootstrap/Badge'; //

/**
 * PostCard.jsx доторх 'PostContent'-той ижил үүрэгтэй,
 * гэхдээ дэлгэрэнгүй хуудсанд зориулсан том хэлбэрээр харуулна.
 */
const PostContentRenderer = ({ post }) => {
    // (!!! Энэ туслах компонент өөрчлөгдөөгүй)
    if (!post) return null;

    // 1. Энгийн пост ("post")
    if (post.content_type === 'post') { //
        if (post.content) {
            return (
                <Card.Text as="div" className="post-full-content mathjax-content fs-5" style={{ whiteSpace: 'pre-wrap' }}>
                    <LivePreview content={post.content} />
                </Card.Text>
            );
        }
        return null; // Хоосон пост
    }

    // 2. Холбоотой контент (Бодлого, Томьёо, Өгүүлэл, Тест)
    const relatedItem = post.related_problem || post.related_formula || post.related_article || post.related_quiz; //

    if (!relatedItem) {
        return <Alert variant="warning">[Холбоотой контент олдсонгүй]</Alert>;
    }

    let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;
    let description = relatedItem.statement || relatedItem.content || relatedItem.description || relatedItem.abstract || '';
    let linkTo = `/${post.content_type}/${relatedItem.id}`; //
    let typeLabel;

    switch (post.content_type) {
        case 'problem': typeLabel = 'Бодлого'; break; //
        case 'formula': typeLabel = 'Томьёо'; break; //
        case 'article': typeLabel = 'Өгүүлэл'; break; //
        case 'quiz': typeLabel = 'Тест'; break; //
        default: typeLabel = 'Контент';
    }

    return (
        <div className="related-content-full mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <Badge bg="secondary" className="fs-6">{typeLabel}</Badge>
                <Link to={linkTo} className="btn btn-outline-primary btn-sm">
                    {typeLabel}-г дэлгэрэнгүй үзэх <i className="bi bi-arrow-right-short"></i>
                </Link>
            </div>

            <h2 className="h4 mathjax-content mb-3">
                <LivePreview content={title} />
            </h2>

            {description && (
                <div className="mathjax-content fs-5 border-top pt-3" style={{ whiteSpace: 'pre-wrap' }}>
                    <LivePreview content={description} />
                </div>
            )}
        </div>
    );
};


// --- Үндсэн Detail Page Компонент ---
const PostDetailPage = () => {
    const { postId } = useParams(); //
    const { user } = useAuth(); //
    const navigate = useNavigate(); //
    const [post, setPost] = useState(null); //
    const [loading, setLoading] = useState(true); //
    const [error, setError] = useState(null); //
    const [commentCount, setCommentCount] = useState(0); //

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/api/minds/posts/${postId}/`);
                setPost(response.data);
                setCommentCount(response.data.comments_count || 0);
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setError(err.response?.data?.detail || 'Пост олдсонгүй.');
            } finally {
                setLoading(false);
            }
        };

        const incrementView = async () => {
            try {
                await apiClient.post(`/api/minds/posts/${postId}/view/`); //
            } catch (err) {
                console.warn('Could not increment view count:', err);
            }
        };

        fetchPost();

        if (user) {
            incrementView(); //
        }

    }, [postId, user]); //

    // Ачааллах
    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" />
                <p className="mt-2">Пост ачааллаж байна...</p>
            </Container>
        );
    }

    // Алдаа
    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="link" onClick={() => navigate(-1)}>Буцах</Button>
            </Container>
        );
    }

    if (!post) {
        return null;
    }

    // Зохиогчийн мэдээллийг шалгах
    const author = post.author;
    if (!author) {
        return (
            <Container className="my-5">
                <Alert variant="danger">Постын зохиогч олдсонгүй.</Alert>
                <Button variant="link" onClick={() => navigate(-1)}>Буцах</Button>
            </Container>
        );
    }

    const handleCommentCountChange = (newCount) => { //
        setCommentCount(newCount);
    };

    return (
        // (!!!) ЗАСВАР: Container-г fluid=false (default) хэвээр үлдээсэн.
        <Container className="my-4">
            {/* (!!!) ЗАСВАР: justify-content-center-г хассан */}
            <Row>
                {/* (!!!) ЗАСВАР: lg={8} md={10}-г хассан (100% өргөн) */}
                <Col>
                    {/* Буцах товч */}
                    <Button variant="link" onClick={() => navigate(-1)} className="mb-2 p-0 text-decoration-none text-muted">
                        <i className="bi bi-arrow-left me-1"></i> Буцах
                    </Button>

                    {/* Постын үндсэн карт */}
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-sm-4 p-3">
                            {/* Зохиогчийн мэдээлэл */}
                            <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                                <Link to={`/profile/${author.username}`}>
                                    <UserAvatar user={author} size={50} />
                                </Link>
                                <div className="flex-grow-1">
                                    <Link to={`/profile/${author.username}`} className="fw-bold text-decoration-none text-dark h5 mb-0">
                                        {author.first_name || author.email}
                                    </Link>
                                    <p className="text-muted small mb-0" title={new Date(post.created_at).toISOString()}>
                                        {new Date(post.created_at).toLocaleString('mn-MN', { dateStyle: 'long', timeStyle: 'short' })}
                                    </p>
                                </div>
                            </Stack>

                            {/* Постын үндсэн агуулга */}
                            <PostContentRenderer post={post} />

                            {/* Статистик */}
                            <Stack direction="horizontal" gap={3} className="mt-4 pt-3 border-top text-muted small">
                                <span>
                                   <i className="bi bi-eye me-1"></i> {post.view_count || 0} үзэлт
                                </span>
                                <span>
                                    <i className="bi bi-heart me-1"></i> {post.favorite_count || 0} таалагдсан
                                </span>
                                <span>
                                    <i className="bi bi-chat-square me-1"></i> {commentCount} сэтгэгдэл
                                </span>
                            </Stack>

                        </Card.Body>
                    </Card>

                    {/* Коммент хэсэг */}
                    <Card className="shadow-sm mt-4 border-0">
                        <Card.Header className="h5 bg-white border-bottom">
                            Сэтгэгдлүүд ({commentCount})
                        </Card.Header>
                        <Card.Body>
                            <CommentSection
                                postId={post.id}
                                initialCount={post.comments_count || 0}
                                onCountChange={handleCommentCountChange}
                                // (!!!) ЭНЭ ХЭВЭЭРЭЭ (Collapsed биш)
                                showCommentForm={true} //
                            />
                        </Card.Body>
                    </Card>

                </Col>
            </Row>
        </Container>
    );
};

export default PostDetailPage;