// frontend/src/pages/FormulaDetailPage.jsx
// ✅ ШИНЭЧИЛСЭН: Зөвхөн зохиогч засварлах эрхтэй, бүгд агуулга хуулж болно

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax'; // Context нь Layout-с ирнэ
import { useAuth } from '../context/AuthContext.jsx';
import { usePrefill } from '../context/PrefillContext.jsx';
import LivePreview from '../components/LivePreview.jsx'; // (!!!) LivePreview импорт
import UserName from '../components/UserName.jsx';
import { formatDate } from '../utils/dateFormatter';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// Lucide Icons
import { Edit } from 'lucide-react';

const FormulaDetailPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();
  const { setPrefillData } = usePrefill();

  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fontSizes = [1, 1.2, 1.5];
  const [fontSizeIndex, setFontSizeIndex] = useState(0);
  const fontSize = fontSizes[fontSizeIndex];

  useEffect(() => {
    fetchFormula(id);
  }, [id]);

  useEffect(() => {
    // Томьёо ачаалагдсаны дараа хуудасны гарчгийг шинэчлэх
    if (formula) {
      setPageTitle(`Томьёо · ${formula.title || `#${id}`}`);
    } else {
      setPageTitle('Томьёо'); // Ачаалж байх үеийн гарчиг
    }
    // Cleanup function
    return () => {
      setPageTitle('Нүүр'); // Хуудаснаас гарах үед гарчгийг буцаах
    };
  }, [formula, id, setPageTitle]);

  const fetchFormula = async (formulaId) => {
    try {
      setLoading(true);
      setError(null);
      // API endpoint-г шалгаарай (FormulaViewSet detail)
      const response = await apiClient.get(`/api/integral/formulas/${formulaId}/`);
      setFormula(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setError('Томьёо олдсонгүй.');
      } else {
        setError('Томьёог ачаалахад алдаа гарлаа.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'formula',
      item: {
        id: formula.uuid,
        title: formula.title
      }
    });
    navigate('/');
  };

  // --- Render ---
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" size="sm" onClick={() => fetchFormula(id)}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  if (!formula) {
    // Энэ тохиолдол бараг гарахгүй (fetch-д алдаа баригдана)
    return null;
  }

  // Зохиогч мөн эсэхийг шалгах (Засах, Устгах товч харуулах)
  const isAuthor = user && formula.author && user.id === formula.author.id;

  return (
    <Container className="py-4">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/formulas' }}>
          Томьёонууд
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          <MathJax inline dynamic>{formula.title || `Томьёо #${id}`}</MathJax>
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Толгой хэсэг: Гарчиг, Товчнууд */}
      <Stack direction="horizontal" gap={3} className="mb-3 align-items-start">
        <div>
          <h1 className="h4 fw-bold mb-1">
            <MathJax hideUntilTypeset={'first'}>{formula.title || `Томьёо #${id}`}</MathJax>
          </h1>
          <div className="text-muted small">
            <i className="bi bi-person me-1"></i>
            <UserName user={formula.author} />
            {formula.updated_at && (
              <>
                <span className="mx-2">•</span>
                <i className="bi bi-clock me-1"></i>
                {formatDate(formula.updated_at)}
              </>
            )}
            {formula.topic && (
              <>
                <span className="mx-2">•</span>
                <Badge bg="info">{formula.topic.name}</Badge>
              </>
            )}
            {/* Status Badge */}
            {formula.status !== undefined && formula.status && (
              <>
                <span className="mx-2">•</span>
                <Badge bg="success">Идэвхтэй</Badge>
              </>
            )}
          </div>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          {/* Үсэг томруулах/жижигрүүлэх */}
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

      {/* Томьёоны агуулга */}
      <Card>
        <Card.Body>
          {/* (!!!) LivePreview ашиглан агуулга харуулах */}
          <div className="formula-content" style={{ fontSize: `${fontSize}rem` }}>
            {formula.content ? (
              <LivePreview content={formula.content} />
            ) : (
              <p className="text-muted">Агуулга байхгүй.</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {(isAuthor || user?.is_staff) && (
        <div className="d-flex justify-content-end gap-2 mt-2">
          <Link to={`/formula/${id}/edit`}>
            <Button variant="outline-primary" size="sm" title="Засварлах">
              <Edit size={16} />
            </Button>
          </Link>
          {isAuthor && (
            <Button variant="outline-success" size="sm" onClick={handleCreatePost} title="Постлох">
              <i className="bi bi-megaphone"></i>
            </Button>
          )}
        </div>
      )}

      {/* Холбоотой түлхүүр үгс */}
      {formula.keywords && formula.keywords.length > 0 && (
        <div className="mt-4">
          <h6>Түлхүүр үгс:</h6>
          <Stack direction="horizontal" gap={2} className="flex-wrap">
            {formula.keywords.map((kw) => (
              <Badge key={kw.id} bg="secondary" pill>
                {kw.name}
              </Badge>
            ))}
          </Stack>
        </div>
      )}

      <hr className="mt-4" />
      <Link to="/content/browse?type=formulas" className="btn btn-outline-secondary btn-sm mt-3">
        &laquo; Томьёоны сан руу буцах
      </Link>

    </Container>
  );
};

export default FormulaDetailPage;
