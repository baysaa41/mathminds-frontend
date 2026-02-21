import { useState, useEffect } from 'react';
// (!!!) useOutletContext-г import хийнэ
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
// (!!!) Импортын замыг засварласан
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
// (!!!) Импортын замыг засварласан
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import UserName from '../components/UserName.jsx';
import { formatDate } from '../utils/dateFormatter';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';

const ArticleDetailPage = () => {
  // (!!!) "articleId"-г "id" болгож өөрчилсөн (App.jsx-тэй нийцүүлсэн)
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPrefillData } = usePrefill();
  // (!!!) useOutletContext-г ашиглан setPageTitle-г авна
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        // (!!!) "articleId"-г "id" болгож өөрчилсөн
        // (!!!) API ЗАМЫГ ЗАСВАРЛАСАН: minds -> integral
        const response = await apiClient.get(`/api/integral/articles/${id}/`);
        setArticle(response.data);

        // (!!!) Гарчгийг энд тохируулна
        if (response.data?.title) {
          setPageTitle(response.data.title);
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError('Өгүүлэл олдсонгүй.');
        } else {
          setError('Өгүүллийг уншихад алдаа гарлаа.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // (!!!) --- АЛДААГ ЗАСАХ ХАМГААЛАЛТ --- (!!!)
    // (!!!) "articleId"-г "id" болгож өөрчилсөн
    if (id) {
      fetchArticle();
    } else {
      // Хэрэв id ямар нэг шалтгаанаар undefined байвал
      setError('Өгүүллийн дугаар (ID) олдсонгүй.');
      setLoading(false);
      setPageTitle('Алдаа'); // Гарчгийг "Алдаа" болгох
    }

    // Cleanup: Компонент солигдох үед гарчгийг цэвэрлэх
    return () => {
      setPageTitle('Нүүр'); // Эсвэл өөр үндсэн гарчиг
    };
  }, [id, setPageTitle]); // (!!!) "articleId"-г "id" болгож өөрчилсөн

  // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
  // Ачааллаж байх үеийн дэлгэц
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
  // Алдаа гарсан үеийн дэлгэц
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Link to="/"> &laquo; Буцах</Link>
      </Container>
    );
  }

  // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
  // Өгүүлэл олдсонгүй (гэхдээ алдаа биш)
  if (!article) {
    return null;
  }

  // (!!!) user.user_id-г user.id болгож засварласан
  const canEdit =
    user && article && article.author && (user.id === article.author.id || user.is_staff);

  const handleEditClick = () => {
    // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
    // (!!!) "articleId"-г "id" болгож өөрчилсөн
    navigate(`/article/${id}/edit`);
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'article',
      item: {
        id: article.id,
        title: article.title
      }
    });
    navigate('/');
  };

  // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ (БҮХЭЛД НЬ) --- (!!!)
  // Үндсэн дэлгэц
  return (
    <Container className="py-4">
      <Breadcrumb listProps={{ className: 'mb-3' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        {/* (!!!) ШИНЭ: /articles хуудас руу буцах */}
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/articles' }}>
          Өгүүллийн сан
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{article.title || 'Өгүүлэл'}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Гарчиг ба Засварлах товч */}
      <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
        <MathJax hideUntilTypeset={'first'} className="flex-grow-1">
          <h1 className="h3 fw-bold mathjax-content mb-0">
            {article.title || 'Гарчиггүй өгүүлэл'}
          </h1>
        </MathJax>
        {canEdit && (
          <>
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleCreatePost}
              className="flex-shrink-0"
            >
              <i className="bi bi-megaphone me-1"></i>
              Постлох
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleEditClick}
              className="flex-shrink-0"
            >
              <i className="bi bi-pencil me-1"></i>
              Засварлах
            </Button>
          </>
        )}
      </Stack>

      {/* ✅ Abstract харуулах */}
      {article.abstract && (
        <MathJax hideUntilTypeset={'first'}>
          <div
            className="mathjax-content text-muted mb-4 p-3 bg-light rounded border-start border-primary border-4"
            style={{ fontSize: '1.05em', lineHeight: '1.6', fontStyle: 'italic' }}
          >
            {article.abstract}
          </div>
        </MathJax>
      )}

      {/* Зохиогч, огноо */}
      <div className="text-muted mb-4 small d-flex flex-wrap gap-2 align-items-center">
        <span>
          Зохиогч: <UserName user={article.author} />
        </span>
        <span className="d-none d-sm-inline mx-1">|</span>
        <span>
          Нийтэлсэн: {article.published ? formatDate(article.published) : 'N/A'}
        </span>
      </div>

      <hr className="mb-4" />

      {/* Үндсэн агуулга */}
      <MathJax hideUntilTypeset={'first'}>
        <div
          className="article-content mathjax-content"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />
      </MathJax>

      <hr className="mt-5" />
      <Link to="/articles" className="btn btn-outline-secondary btn-sm mt-3">
        &laquo; Өгүүллийн сан руу буцах
      </Link>
    </Container>
  );
};

export default ArticleDetailPage;
