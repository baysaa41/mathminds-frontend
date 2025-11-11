// frontend/src/components/TrendingPostsWidget.jsx
// (!!! ШИНЭЧИЛСЭН: PostDetailPage руу үргэлж үсэрдэг болгосон)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import LivePreview from './LivePreview';

// (getPreviewContent функц хэвээрээ байна)
const getPreviewContent = (content, maxLength = 60) => {
    if (!content || typeof content !== 'string') {
        return '(Агуулгагүй)';
    }
    let text = content.replace(/\[pst\][\s\S]*?\[\/pst\]/g, ' [Зураг] ');
    text = text.replace(/\\begin\{(enumerate|itemize|center|tabular)\}[\s\S]*?\\end\{\1\}/g, ' [Объект] ');
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
};


const TrendingPostsWidget = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrending = async () => {
            if (!loading) setLoading(true);
            try {
                const response = await apiClient.get('/api/minds/posts/trending/', {
                    params: { days: 7, limit: 5 }
                });
                const validPosts = (response.data || []).filter(post =>
                    post &&
                    post.content !== null &&
                    post.content !== undefined &&
                    typeof post.content === 'string'
                );
                setTrendingPosts(validPosts);
            } catch (error) {
                console.error('Trending posts татахад алдаа:', error);
                setTrendingPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
        const interval = setInterval(fetchTrending, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // (!!!) ЗАСВАРЛАСАН ФУНКЦ (!!!)
    // Өмнө нь /article, /problem руу үсэрдэг байсныг
    // /post/:id руу үсэрдэг болголоо.
    const handlePostClick = (post) => {
        // App.jsx (File 2)-д тодорхойлсон PostDetailPage-ийн зам
        navigate(`/post/${post.id}`);
    };

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
                <div className="d-flex align-items-center">
                    <TrendingUp className="text-danger me-2" size={20} />
                    <strong>Trending</strong>
                </div>
            </Card.Header>

            {/* Ачааллах, Хоосон, Жагсаалт гэсэн 3 төлөв */}

            {loading && (
                <Card.Body className="text-center text-muted">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </Card.Body>
            )}

            {!loading && trendingPosts.length === 0 && (
                <Card.Body className="text-center text-muted">
                    Trending пост байхгүй байна
                </Card.Body>
            )}

            {!loading && trendingPosts.length > 0 && (
                <ListGroup variant="flush">
                    {trendingPosts.map((post, index) => {
                        const previewContent = getPreviewContent(post.content, 60);

                        return (
                            <ListGroup.Item
                                key={post.id}
                                action
                                onClick={() => handlePostClick(post)} // Энд шинэ функц дуудагдана
                                className="cursor-pointer"
                            >
                                <div className="d-flex align-items-start">
                                    <Badge bg="secondary" className="me-2">#{index + 1}</Badge>
                                    <div className="flex-grow-1">
                                        <div className="fw-semibold small mb-1">
                                            <LivePreview content={previewContent} />
                                        </div>
                                        <div className="d-flex gap-3 text-muted" style={{ fontSize: '0.75rem' }}>
                                            <span><Eye size={12} /> {post.view_count || 0}</span>
                                            <span><Heart size={12} /> {post.favorite_count || 0}</span>
                                            <span><MessageCircle size={12} /> {post.comments_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            )}
        </Card>
    );
};

export default TrendingPostsWidget;