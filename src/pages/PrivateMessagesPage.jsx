// frontend/src/pages/PrivateMessagesPage.jsx

import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig.js';
import PostCard from '../components/PostCard.jsx';

// React Bootstrap компонентууд
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { MessageCircle } from 'lucide-react';

const PrivateMessagesPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrivateMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/api/minds/posts/private_messages/');
        setPosts(response.data.results || response.data);
      } catch (err) {
        setError('Хувийн мессежүүдийг уншихад алдаа гарлаа.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrivateMessages();
  }, []);

  // Loading төлөв
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '200px' }}
      >
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
        <MessageCircle size={64} className="text-muted mb-3" />
        <h4 className="text-muted">Хувийн мессеж байхгүй байна</h4>
        <p className="text-muted">
          Та пост үүсгэхдээ хүлээн авагч сонгож хувийн мессеж илгээх боломжтой.
        </p>
      </div>
    );
  }

  // Постуудыг харуулах
  return (
    <div>
      {/* Гарчиг */}
      <div
        className="border-bottom p-3 bg-white sticky-top"
        style={{
          zIndex: 100,
          top: '-1rem',
          marginTop: '-1rem',
          marginLeft: '-1rem',
          marginRight: '-1rem',
          paddingTop: '1.75rem'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <MessageCircle size={20} />
          <h5 className="mb-0 fw-bold">Хувийн мессежүүд</h5>
        </div>
        <p className="text-muted small mb-0 mt-1">Нийт {posts.length} мессеж</p>
      </div>

      {/* Постуудын жагсаалт */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PrivateMessagesPage;
