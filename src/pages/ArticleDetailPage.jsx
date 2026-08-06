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
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import { formatDate } from '../utils/dateFormatter';
import LivePreview from '../components/LivePreview.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Collapse from 'react-bootstrap/Collapse';
import ListGroup from 'react-bootstrap/ListGroup';

// Нэг хөтөлбөрийн өгүүллүүдийг дараалалд нь үзэх навигаци (өмнөх/дараах + бүх долоо
// хоногийн жагсаалт). Article нь ямар ч Program-той холбоогүй бол null-той тэнцүү
// байх тул юу ч рендерлэхгүй.
const ProgramArticleNav = ({ nav }) => {
  const [expanded, setExpanded] = useState(false);
  if (!nav || !nav.program) return null;

  const { program, topics, current_week_num: currentWeek, prev, next } = nav;

  return (
    <div className="border rounded-3 p-3 mb-4 bg-light">
      <div className="small text-muted">
        <i className="bi bi-journal-bookmark me-1"></i>
        Хөтөлбөр: <strong>{program.name}</strong> &middot; {currentWeek}/{topics.length} долоо хоног
      </div>

      <div className="d-flex justify-content-between align-items-stretch gap-2 mt-3">
        {prev ? (
          <Button
            as={Link}
            to={`/article/${prev.uuid}`}
            variant="outline-primary"
            size="sm"
            className="text-start flex-grow-1"
            style={{ maxWidth: '48%' }}
          >
            <div className="small text-muted">&laquo; {prev.week_num}-р долоо хоног</div>
            <div className="text-truncate">{prev.topic}</div>
          </Button>
        ) : (
          <div className="flex-grow-1" style={{ maxWidth: '48%' }} />
        )}
        {next ? (
          <Button
            as={Link}
            to={`/article/${next.uuid}`}
            variant="outline-primary"
            size="sm"
            className="text-end flex-grow-1"
            style={{ maxWidth: '48%' }}
          >
            <div className="small text-muted">{next.week_num}-р долоо хоног &raquo;</div>
            <div className="text-truncate">{next.topic}</div>
          </Button>
        ) : (
          <div className="flex-grow-1" style={{ maxWidth: '48%' }} />
        )}
      </div>

      <Button
        variant="outline-secondary"
        size="sm"
        className="mt-3"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Жагсаалтыг хаах' : 'Бүх долоо хоногийг харах'}
        <i className={`bi ms-1 bi-chevron-${expanded ? 'up' : 'down'}`}></i>
      </Button>

      <Collapse in={expanded}>
        <div className="mt-3">
          <ListGroup variant="flush">
            {topics.map((t) => {
              const isCurrent = t.week_num === currentWeek;
              const content = (
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <strong>{t.week_num}.</strong> {t.topic}
                  </span>
                  {!t.uuid && <span className="text-muted small">Өгүүлэлгүй</span>}
                </div>
              );
              return t.uuid ? (
                <ListGroup.Item
                  key={t.week_num}
                  as={Link}
                  to={`/article/${t.uuid}`}
                  action
                  active={isCurrent}
                  className="py-2"
                >
                  {content}
                </ListGroup.Item>
              ) : (
                <ListGroup.Item key={t.week_num} disabled className="py-2 text-muted">
                  {content}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </div>
      </Collapse>
    </div>
  );
};

const ArticleDetailPage = () => {
  // (!!!) "articleId"-г "id" болгож өөрчилсөн (App.jsx-тэй нийцүүлсэн)
  const { uuid: id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programNav, setProgramNav] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPrefillData } = usePrefill();
  // (!!!) useOutletContext-г ашиглан setPageTitle-г авна
  const { setPageTitle } = useOutletContext();

  const fontSizes = [1, 1.2, 1.5];
  const [fontSizeIndex, setFontSizeIndex] = useState(0);
  const fontSize = fontSizes[fontSizeIndex];

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
          setPageTitle(`Өгүүлэл · ${response.data.title}`);
        }

        // Хөтөлбөрийн навигаци — заавал биш тул алдаа гарвал зүгээр л нуугдана
        setProgramNav(null);
        apiClient
          .get(`/api/integral/articles/${id}/program-nav/`)
          .then((navRes) => setProgramNav(navRes.data))
          .catch(() => setProgramNav(null));
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
        <AppBreadcrumb items={[{ label: 'Нийтлэл' }]} />
      </Container>
    );
  }

  // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
  // Өгүүлэл олдсонгүй (гэхдээ алдаа биш)
  if (!article) {
    return null;
  }

  // (!!!) user.user_id-г user.id болгож засварласан
  const isStaff = user && user.is_staff;
  const canEdit =
    user && article && (isStaff || (article.author && user.id === article.author.id));

  // Сэдэв / анги / хөтөлбөр мөрийг бүрдүүлэх
  const topicPrograms = article.curriculum_topic?.programs || [];
  const metaParts = [];
  if (article.category) metaParts.push(article.category.name_mn || article.category.name);
  if (article.curriculum_topic) metaParts.push(`Сэдэв: ${article.curriculum_topic.name}`);
  if (article.grade_level) metaParts.push(`${article.grade_level}-р анги`);
  if (topicPrograms.length > 0) {
    metaParts.push(`Хөтөлбөр: ${topicPrograms.map((p) => p.name).join(', ')}`);
  }

  const handleEditClick = () => {
    // (!!!) --- СЭРГЭЭСЭН ХЭСЭГ --- (!!!)
    // (!!!) "articleId"-г "id" болгож өөрчилсөн
    navigate(`/article/${id}/edit`);
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'article',
      item: {
        id: article.uuid,
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
        <Breadcrumb.Item active>
          <MathJax inline dynamic>{article.title || 'Өгүүлэл'}</MathJax>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Гарчиг ба Засварлах товч */}
      <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
        <MathJax hideUntilTypeset={'first'} className="flex-grow-1">
          <h1 className="h3 fw-bold mathjax-content mb-0">
            {article.title || 'Гарчиггүй өгүүлэл'}
          </h1>
        </MathJax>
        <div className="ms-auto d-flex align-items-center gap-1 flex-shrink-0">
          {canEdit && (
            <Button variant="outline-primary" size="sm" onClick={handleEditClick} title="Засварлах" className="me-1">
              <i className="bi bi-pencil me-1"></i>Засварлах
            </Button>
          )}
          <Button
            variant="link"
            className="text-decoration-none p-1 text-muted"
            onClick={() => setFontSizeIndex((p) => Math.max(p - 1, 0))}
            disabled={fontSizeIndex === 0}
            title="Үсэг жижигрүүлэх"
          >
            <small style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</small>
          </Button>
          <Button
            variant="link"
            className="text-decoration-none p-1 text-muted"
            onClick={() => setFontSizeIndex((p) => Math.min(p + 1, fontSizes.length - 1))}
            disabled={fontSizeIndex === fontSizes.length - 1}
            title="Үсэг томруулах"
          >
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Aa</span>
          </Button>
        </div>
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

      {/* Сэдэв, анги, хөтөлбөр */}
      {metaParts.length > 0 && (
        <div className="text-muted small mb-3">{metaParts.join(' · ')}</div>
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
      <div
        className="article-content mathjax-content"
        style={{ fontSize: `${fontSize}rem`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
      >
        <LivePreview content={article.content || ''} />
      </div>

      {programNav?.program && (
        <div className="mt-4">
          <ProgramArticleNav nav={programNav} />
        </div>
      )}

      {canEdit && (
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button variant="outline-primary" size="sm" onClick={handleEditClick} title="Засварлах">
            <i className="bi bi-pencil"></i>
          </Button>
          <Button variant="outline-success" size="sm" onClick={handleCreatePost} title="Постлох">
            <i className="bi bi-megaphone"></i>
          </Button>
        </div>
      )}

      <hr className="mt-4" />
      <Link to="/content/browse?type=articles" className="btn btn-outline-secondary btn-sm mt-3">
        &laquo; Өгүүллийн сан руу буцах
      </Link>
    </Container>
  );
};

export default ArticleDetailPage;
