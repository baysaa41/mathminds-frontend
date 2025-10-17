// frontend/src/components/Feed.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import PostCard from './PostCard';

// React Bootstrap компонентууд
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get('/api/minds/posts/');
                setPosts(response.data.results);
            } catch (err) {
                setError("Пост уншихад алдаа гарлаа. Backend сервер ажиллаж байгаа эсэхийг шалгана уу.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
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

    // Постуудыг харуулах
    return (
        <div> {/* Гадна талын div-г үлдээсэн */}
            {posts.length > 0 ? (
                posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))
            ) : (
                <div className="text-center p-5 text-muted">
                    Одоогоор харуулах пост байхгүй байна.
                </div>
            )}
        </div>
    );
};

export default Feed;