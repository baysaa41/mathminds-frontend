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

// Постын төрөл болон гарчигийг авах функц
const getPostTitle = (post) => {
  // Хэрвээ энгийн пост бол content-ийг товчлон харуулна
  if (post.content_type === 'post' || post.content_type === 'repost' || post.content_type === 'reply') {
    if (!post.content || typeof post.content !== 'string') {
      return '(Агуулгагүй)';
    }

    const maxLength = 60;
    let originalContent = post.content;

    // PSTricks зургийг устгана
    let text = originalContent.replace(/\[pst\][\s\S]*?\[\/pst\]/g, '');

    // LaTeX block орчнуудыг (enumerate, itemize гэх мэт) устгана
    text = text.replace(/\\begin\{(enumerate|itemize|center|tabular)\}[\s\S]*?\\end\{\1\}/g, '');

    // Display math устгана: $$...$$ болон \[...\]
    text = text.replace(/\$\$[\s\S]*?\$\$/g, '');
    text = text.replace(/\\\[[\s\S]*?\\\]/g, '');

    // Inline math устгана: $...$ болон \(...\)
    text = text.replace(/\$[^$\n]+\$/g, '');
    text = text.replace(/\\\([\s\S]*?\\\)/g, '');

    // Шинэ мөр болон олон хоосон зайг цэвэрлэнэ
    text = text.replace(/\n/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    // Хэрвээ LaTeX цэвэрлэсний дараа уншигдах текст үлдсэн бол харуулна
    if (text.length > 0) {
      if (text.length <= maxLength) {
        return text;
      }
      return text.substring(0, maxLength) + '...';
    }

    // Хэрвээ зөвхөн LaTeX код л байвал анхны агуулгаас товчлон харуулна
    const rawPreview = originalContent.substring(0, maxLength).replace(/\n/g, ' ').trim();
    return rawPreview + (originalContent.length > maxLength ? '...' : '');
  }

  // Холбоотой контент (бодлого, томьёо, өгүүлэл, тест)
  const relatedItem =
    post.related_problem || post.related_formula || post.related_article || post.related_quiz;

  if (!relatedItem) {
    return '(Гарчиггүй)';
  }

  return relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;
};

// Постын төрлийн шошго авах функц
const getPostTypeLabel = (contentType) => {
  const typeLabels = {
    problem: 'Бодлого',
    formula: 'Томьёо',
    article: 'Өгүүлэл',
    quiz: 'Тест',
    post: 'Пост',
    repost: 'Repost',
    reply: 'Хариулт',
  };
  return typeLabels[contentType] || 'Контент';
};

// Badge өнгийг авах функц
const getBadgeVariant = (contentType) => {
  const variants = {
    problem: 'secondary',
    formula: 'info',
    article: 'danger',
    quiz: 'success',
    post: 'primary',
    repost: 'warning',
    reply: 'dark',
  };
  return variants[contentType] || 'secondary';
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
          params: { days: 7, limit: 5 },
        });
        // Постууд нь content эсвэл related_* объект байх ёстой
        const validPosts = (response.data || []).filter((post) => {
          if (!post) return false;

          // Энгийн пост бол content байх ёстой
          if (post.content_type === 'post' || post.content_type === 'repost' || post.content_type === 'reply') {
            return post.content !== null && post.content !== undefined && typeof post.content === 'string';
          }

          // Бодлого, томьёо, өгүүлэл, тест бол холбоотой объект байх ёстой
          return (
            post.related_problem ||
            post.related_formula ||
            post.related_article ||
            post.related_quiz
          );
        });
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
    const postId = post.uuid || post.id;
    navigate(`/post/${postId}`);
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
        <Card.Body className="text-center text-muted">Trending пост байхгүй байна</Card.Body>
      )}

      {!loading && trendingPosts.length > 0 && (
        <ListGroup variant="flush">
          {trendingPosts.map((post, index) => {
            const postTitle = getPostTitle(post);
            const typeLabel = getPostTypeLabel(post.content_type);
            const badgeVariant = getBadgeVariant(post.content_type);

            return (
              <ListGroup.Item
                key={post.id}
                action
                onClick={() => handlePostClick(post)}
                className="cursor-pointer"
              >
                <div className="d-flex align-items-start gap-2">
                  <Badge bg="secondary" className="flex-shrink-0">
                    #{index + 1}
                  </Badge>
                  <div className="flex-grow-1">
                    {/* Постын төрөл */}
                    <div className="mb-1">
                      <Badge bg={badgeVariant} className="me-2" style={{ fontSize: '0.7rem' }}>
                        {typeLabel}
                      </Badge>
                    </div>
                    {/* Гарчиг эсвэл агуулга */}
                    <div className="fw-semibold small mb-1">
                      <LivePreview content={postTitle} />
                    </div>
                    {/* Статистик */}
                    <div className="d-flex gap-3 text-muted" style={{ fontSize: '0.75rem' }}>
                      <span>
                        <Eye size={12} /> {post.view_count || 0}
                      </span>
                      <span>
                        <Heart size={12} /> {post.favorite_count || 0}
                      </span>
                      <span>
                        <MessageCircle size={12} /> {post.replies_count || 0}
                      </span>
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
