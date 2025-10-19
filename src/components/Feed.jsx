import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import PostCard from './PostCard';

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

                // ✅ ЗАСВАР: Pagination байгаа эсэхийг шалгах
                if (response.data.results) {
                    // Pagination байгаа бол results ашиглах
                    setPosts(response.data.results);
                } else if (Array.isArray(response.data)) {
                    // Pagination байхгүй бол шууд array
                    setPosts(response.data);
                } else {
                    // Буруу формат бол хоосон array
                    setPosts([]);
                    console.error('Unexpected API response format:', response.data);
                }
            } catch (err) {
                setError("Пост уншихад алдаа гарлаа. Backend сервер ажиллаж байгаа эсэхийг шалгана уу.");
                console.error('API Error:', err);
                console.error('Response:', err.response?.data);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Ачааллаж байна...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="m-3">
                {error}
            </Alert>
        );
    }

    return (
        <div>
            {posts && posts.length > 0 ? (
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