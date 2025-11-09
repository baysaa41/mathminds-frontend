// frontend/src/pages/PostDetailPage.jsx
// (!!! ШИНЭЧИЛСЭН: ViewerJS шууд ашиглан зургийн харагдацыг сайжруулав !!!)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

// (!!! ViewerJS ИМПОРТ (!!!)
import Viewer from 'viewerjs';
// CSS нь public/index.html дээр CDN-ээс ачаалагдана

// Components
import LivePreview from '../components/LivePreview';
import CommentSection from '../components/CommentSection';
import UserAvatar from '../components/UserAvatar';
import EmbedRenderer from '../components/EmbedRenderer';

// Bootstrap
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';

/**
 * Холбоотой контент (Бодлого, Томьёо г.м)-г харуулна.
 */
const PostContentRenderer = ({ post }) => {
    if (!post) return null;
    if (post.content_type === 'post' || post.content_type === 'reply' ) {
        if (post.content) {
            return (
                <Card.Text as="div" className="post-full-content mathjax-content fs-5" style={{ whiteSpace: 'pre-wrap' }}>
                    <LivePreview content={post.content} />
                </Card.Text>
            );
        }
        return null;
    }
    const relatedItem = post.related_problem || post.related_formula || post.related_article || post.related_quiz;
    if (!relatedItem) { return <Alert variant="warning">[Холбоотой контент олдсонгүй]</Alert>; }
    let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;
    let description = relatedItem.statement || relatedItem.content || relatedItem.description || relatedItem.abstract || '';
    let linkTo = `/${post.content_type}/${relatedItem.id}`;
    let typeLabel;
    switch (post.content_type) {
        case 'problem': typeLabel = 'Бодлого'; break;
        case 'formula': typeLabel = 'Томьёо'; break;
        case 'article': typeLabel = 'Өгүүлэл'; break;
        case 'quiz': typeLabel = 'Тест'; break;
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
            <h2 className="h4 mathjax-content mb-3"><LivePreview content={title} /></h2>
            {description && (
                <div className="mathjax-content fs-5 border-top pt-3" style={{ whiteSpace: 'pre-wrap' }}>
                    <LivePreview content={description} />
                </div>
            )}
        </div>
    );
};


/**
 * Зургийн цомог (Grid) харуулах компонент
 * ViewerJS-тэй ажиллахаар тохируулсан
 */
const PostDetailGallery = ({ images, galleryRef }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="my-3 post-detail-gallery" ref={galleryRef}>
            <Row className="g-2">
                {images.map((img) => (
                    <Col key={img.id} xs={6} md={4} lg={3}>
                        <img
                            src={img.image}
                            alt={`Зураг ${img.id}`}
                            style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                border: '1px solid #eee'
                            }}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
};


// --- Үндсэн Detail Page Компонент ---
const PostDetailPage = () => {
    const { postId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commentCount, setCommentCount] = useState(0);

    // (!!! ViewerJS-д зориулсан ref !!!)
    const galleryRef = useRef(null);
    const viewerInstance = useRef(null);

    // Пост татах
    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.get(`/api/minds/posts/${postId}/`);
                setPost(response.data);
                setCommentCount(response.data.replies_count || 0);
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setError(err.response?.data?.detail || 'Пост олдсонгүй.');
            } finally {
                setLoading(false);
            }
        };
        const incrementView = async () => {
            try {
                await apiClient.post(`/api/minds/posts/${postId}/view/`);
            } catch (err) {
                console.warn('Could not increment view count:', err);
            }
        };
        fetchPost();
        if (user) { incrementView(); }
    }, [postId, user]);

    // (!!! ViewerJS-ийг эхлүүлэх !!!)
    useEffect(() => {
        if (post?.images && post.images.length > 0 && galleryRef.current) {
            console.log('Initializing ViewerJS with', post.images.length, 'images');

            // ViewerJS instance үүсгэх
            viewerInstance.current = new Viewer(galleryRef.current, {
                inline: false,
                button: true,
                navbar: true,
                title: true,
                toolbar: {
                    zoomIn: 1,
                    zoomOut: 1,
                    oneToOne: 1,
                    reset: 1,
                    prev: 1,
                    play: 1,
                    next: 1,
                    rotateLeft: 1,
                    rotateRight: 1,
                    flipHorizontal: 1,
                    flipVertical: 1,
                },
                tooltip: true,
                movable: true,
                zoomable: true,
                rotatable: true,
                scalable: true,
                transition: true,
                fullscreen: true,
                keyboard: true,
                zoomRatio: 0.1,
                minZoomRatio: 0.1,
                maxZoomRatio: 3,
                ready: function() {
                    console.log('✅ ViewerJS is ready');
                },
                show: function() {
                    console.log('✅ ViewerJS shown');
                },
            });

            console.log('ViewerJS instance created:', viewerInstance.current);

            // Cleanup функц
            return () => {
                if (viewerInstance.current) {
                    console.log('Destroying ViewerJS instance');
                    viewerInstance.current.destroy();
                    viewerInstance.current = null;
                }
            };
        } else {
            console.log('ViewerJS not initialized:', {
                hasPost: !!post,
                hasImages: !!post?.images,
                imageCount: post?.images?.length,
                hasGalleryRef: !!galleryRef.current
            });
        }
    }, [post]);

    const handleCommentCountChange = (newCount) => {
        setCommentCount(newCount);
    };

    // Loading
    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Уншиж байна...</span>
                </Spinner>
            </Container>
        );
    }

    // Error
    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">
                    <Alert.Heading>Алдаа гарлаа</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => navigate(-1)}>
                        Буцах
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!post) return null;

    const author = post.author;
    if (!author) {
        return (
            <Container className="my-5">
                <Alert variant="warning">Зохиогчийн мэдээлэл олдсонгүй.</Alert>
            </Container>
        );
    }

    return (
        <Container className="my-4">
            <Row>
                <Col>
                    {/* Буцах товч */}
                    <Button
                        variant="link"
                        onClick={() => navigate(-1)}
                        className="mb-2 p-0 text-decoration-none text-muted"
                    >
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
                                    <Link
                                        to={`/profile/${author.username}`}
                                        className="fw-bold text-decoration-none text-dark h5 mb-0"
                                    >
                                        {author.first_name || author.email}
                                    </Link>
                                    <p className="text-muted small mb-0" title={new Date(post.created_at).toISOString()}>
                                        {new Date(post.created_at).toLocaleString('mn-MN', {
                                            dateStyle: 'long',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>
                            </Stack>

                            {/* ЗУРГИЙН ЦОМОГ (GRID) - ViewerJS ашиглана */}
                            <PostDetailGallery
                                images={post.images}
                                galleryRef={galleryRef}
                            />

                            {/* Постын үндсэн агуулга */}
                            <PostContentRenderer post={post} />

                            {/* Embed Видео */}
                            {post.embed_link && (
                                <div className="mt-3">
                                    <EmbedRenderer url={post.embed_link} />
                                </div>
                            )}

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
                                initialCount={commentCount}
                                onCountChange={handleCommentCountChange}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default PostDetailPage;