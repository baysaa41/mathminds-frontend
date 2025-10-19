// frontend/src/components/BookmarksPage.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import PostCard from './PostCard';

// React Bootstrap компонентууд
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Bookmark } from 'lucide-react';

const BookmarksPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBookmarkedPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get('/api/minds/posts/bookmarked/');
                setPosts(response.data.results || response.data);
            } catch (err) {
                setError("Хадгалсан постуудыг уншихад алдаа гарлаа.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarkedPosts();
    }, []);

    // Loading төлөв
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Ачааллаж байна...</span>
                </Spinner>
            </div>
        );
    }

    // Алдааны төлөв
    if (error) {
        return (
            <Alert variant="danger" className="m-3">
                {error}
            </Alert>
        );
    }

    // Хоосон төлөв
    if (posts.length === 0) {
        return (
            <div className="text-center p-5">
                <Bookmark size={64} className="text-muted mb-3" />
                <h4 className="text-muted">Хадгалсан пост байхгүй байна</h4>
                <p className="text-muted">
                    Та пост дээрх 🔖 товчийг дарж постуудыг хадгалж болно.
                </p>
            </div>
        );
    }

    // Пост bookmark-с хасагдахад жагсаалтаас арилгах
    const handlePostRemoved = (postId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    };

    // Постуудыг харуулах
    return (
        <div>
            {/* Гарчиг */}
            <div className="border-bottom p-3 bg-white sticky-top" style={{ zIndex: 10 }}>
                <div className="d-flex align-items-center gap-2">
                    <Bookmark size={20} />
                    <h5 className="mb-0 fw-bold">Хадгалсан постууд</h5>
                </div>
                <p className="text-muted small mb-0 mt-1">
                    Нийт {posts.length} пост
                </p>
            </div>

            {/* Постуудын жагсаалт */}
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    post={post}
                    onBookmarkRemoved={handlePostRemoved}
                />
            ))}
        </div>
    );
};

export default BookmarksPage;