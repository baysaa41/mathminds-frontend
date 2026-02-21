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
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Modal from 'react-bootstrap/Modal';
import Breadcrumb from 'react-bootstrap/Breadcrumb';

// Lucide Icons
import { Copy, Check, Edit, Trash2 } from 'lucide-react';

const FormulaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const { user } = useAuth();
  const { setPrefillData } = usePrefill();

  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false); // Устгах үед

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Copy state
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchFormula(id);
  }, [id]);

  useEffect(() => {
    // Томьёо ачаалагдсаны дараа хуудасны гарчгийг шинэчлэх
    if (formula) {
      setPageTitle(formula.title || `Томьёо #${id}`);
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

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setActionInProgress(true);
    setError(null);
    try {
      await apiClient.delete(`/api/integral/formulas/${id}/`);
      navigate('/formulas');
    } catch (err) {
      console.error('Failed to delete formula:', err);
      setError('Томьёог устгахад алдаа гарлаа.');
      setActionInProgress(false);
    }
  };

  const handleCopyContent = () => {
    if (!formula?.content) return;

    navigator.clipboard
      .writeText(formula.content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch((err) => {
        console.error('Агуулга хуулахад алдаа гарлаа: ', err);
      });
  };

  const handleCreatePost = () => {
    setPrefillData({
      type: 'formula',
      item: {
        id: formula.id,
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
        <Breadcrumb.Item active>{formula.title || `Томьёо #${id}`}</Breadcrumb.Item>
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
        <div className="ms-auto d-flex gap-2">
          {/* Агуулга хуулах товч - бүгдэд харагдана */}
          <Button
            variant={isCopied ? 'success' : 'outline-primary'}
            size="sm"
            onClick={handleCopyContent}
            disabled={isCopied || !formula.content}
            title="Агуулга хуулах"
          >
            {isCopied ? (
              <>
                <Check size={16} className="me-1" />
                Хуулсан!
              </>
            ) : (
              <>
                <Copy size={16} className="me-1" />
                Агуулга хуулах
              </>
            )}
          </Button>

          {/* Засах/Устгах - зөвхөн зохиогч эсвэл админд */}
          {(isAuthor || user?.is_staff) && (
            <>
              <Link to={`/formula/${id}/edit`}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={actionInProgress}
                  title="Засах"
                >
                  <Edit size={16} className="me-1" />
                  Засах
                </Button>
              </Link>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                disabled={actionInProgress}
                title="Устгах"
              >
                <Trash2 size={16} className="me-1" />
                Устгах
              </Button>
            </>
          )}
        </div>
      </Stack>

      {/* Алдааны мсж (Устгах/Хувилах үед гарвал) */}
      {error && actionInProgress && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {/* Томьёоны агуулга */}
      <Card>
        <Card.Body>
          {/* (!!!) LivePreview ашиглан агуулга харуулах */}
          <div className="formula-content">
            {formula.content ? (
              <LivePreview content={formula.content} />
            ) : (
              <p className="text-muted">Агуулга байхгүй.</p>
            )}
          </div>
        </Card.Body>
      </Card>

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

      {/* Постлох товч (зөвхөн зохиогчид) */}
      {isAuthor && (
        <div className="mt-4 d-flex gap-2">
          <Button variant="outline-success" size="sm" onClick={handleCreatePost}>
            <i className="bi bi-megaphone me-1"></i>
            Постлох
          </Button>
        </div>
      )}

      {/* Устгах Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">
            <Trash2 size={20} className="me-2 text-danger" />
            Устгахыг баталгаажуулах
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та "<b>{formula.title || `Томьёо #${id}`}</b>"-г устгахдаа итгэлтэй байна уу? Энэ үйлдлийг
          буцаах боломжгүй.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Цуцлах
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionInProgress}>
            {actionInProgress ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Устгаж байна...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-1" />
                Устгах
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FormulaDetailPage;
