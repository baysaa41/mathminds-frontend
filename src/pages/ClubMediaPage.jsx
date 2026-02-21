// Club Media Page - Клубын постуудын зургууд
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const ClubMediaPage = () => {
  const { clubData } = useOutletContext();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (clubData?.id) {
      fetchClubMedia();
    }
  }, [clubData?.id]);

  const fetchClubMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      // Клубын постуудыг авах (зөвхөн зурагтай postууд)
      const response = await apiClient.get('/api/minds/posts/', {
        params: {
          club: clubData.id,
          page_size: 100
        }
      });

      // Зурагтай постуудыг шүүх
      const postsWithImages = (response.data.results || response.data || [])
        .filter(post => post.images && post.images.length > 0);

      setPosts(postsWithImages);
    } catch (err) {
      console.error('Error fetching club media:', err);
      setError('Зургууд татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  // Бүх зургуудыг цуглуулах (нэг пост олон зурагтай байж болно)
  const allImages = [];
  posts.forEach(post => {
    post.images.forEach(img => {
      allImages.push({
        ...img,
        post: post
      });
    });
  });

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Зургууд татаж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <ImageIcon size={20} className="me-2" />
            Клубын зургууд
          </h5>
          <small className="text-muted">
            {allImages.length} зураг
          </small>
        </Card.Header>
      </Card>

      {allImages.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center text-muted py-5">
            <ImageIcon size={48} className="mb-3 opacity-25" />
            <p>Клубт постолсон зураг байхгүй байна.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={2} md={3} lg={4} className="g-3">
          {allImages.map((img, index) => (
            <Col key={`${img.post.uuid}-${img.id}-${index}`}>
              <Card className="shadow-sm h-100">
                <div
                  style={{
                    paddingTop: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <img
                    src={img.image}
                    alt={`Post ${img.post.uuid}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/post/${img.post.uuid}`)}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ClubMediaPage;
