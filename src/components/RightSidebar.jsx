// frontend/src/components/RightSidebar.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import { TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import { useNavigate } from 'react-router-dom';

const RightSidebar = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const response = await apiClient.get('/api/minds/posts/trending/', {
                    params: { days: 7, limit: 5 }
                });
                setTrendingPosts(response.data);
            } catch (error) {
                console.error('Trending posts татахад алдаа:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
        // 5 минут тутамд refresh хийх
        const interval = setInterval(fetchTrending, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handlePostClick = (post) => {
        // Холбогдох агуулга руу шилжих
        if (post.content_type === 'article' && post.related_content?.data) {
            navigate(`/article/${post.related_content.data.id}`);
        } else if (post.content_type === 'problem' && post.related_content?.data) {
            navigate(`/problem/${post.related_content.data.id}`);
        } else if (post.content_type === 'formula' && post.related_content?.data) {
            navigate(`/formula/${post.related_content.data.id}`);
        }
    };

    if (loading) return <div>Ачааллаж байна...</div>;

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
                <div className="d-flex align-items-center">
                    <TrendingUp className="text-danger me-2" size={20} />
                    <strong>Trending</strong>
                </div>
            </Card.Header>
            <ListGroup variant="flush">
                {trendingPosts.map((post, index) => (
                    <ListGroup.Item
                        key={post.id}
                        action
                        onClick={() => handlePostClick(post)}
                        className="cursor-pointer"
                    >
                        <div className="d-flex align-items-start">
                            <Badge bg="secondary" className="me-2">#{index + 1}</Badge>
                            <div className="flex-grow-1">
                                <div className="fw-semibold small mb-1">
                                    {post.content.substring(0, 60)}...
                                </div>
                                <div className="d-flex gap-3 text-muted" style={{ fontSize: '0.75rem' }}>
                                    <span><Eye size={12} /> {post.view_count}</span>
                                    <span><Heart size={12} /> {post.favorite_count}</span>
                                    <span><MessageCircle size={12} /> {post.comments_count}</span>
                                </div>
                            </div>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
};

export default RightSidebar;