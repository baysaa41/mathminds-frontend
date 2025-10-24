// frontend/src/pages/FormulaDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax'; // Context нь Layout-с ирнэ
import { useAuth } from '../context/AuthContext.jsx';

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
import Modal from 'react-bootstrap/Modal'; // Устгах Modal-д зориулав

const FormulaDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const { user } = useAuth();

    const [formula, setFormula] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false); // Устгах, Хувилах үед

    // Delete Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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
            // API endpoint-г шалгаарай (FormulaViewSet destroy)
            await apiClient.delete(`/api/integral/formulas/${id}/`);
            navigate('/formulas'); // Жагсаалт руу буцах
        } catch (err) {
            console.error("Failed to delete formula:", err);
            setError('Томьёог устгахад алдаа гарлаа.');
            setActionInProgress(false);
        }
        // Амжилттай устгагдсан бол хуудас солигдох тул setActionInProgress(false) хэрэггүй
    };

    const handleClone = async () => {
        setActionInProgress(true);
        setError(null);
        try {
            // API endpoint-г шалгаарай (FormulaViewSet clone)
            const response = await apiClient.post(`/api/integral/formulas/${id}/clone/`);
            const newFormulaId = response.data.new_id;
            navigate(`/formula/${newFormulaId}/edit`); // Хувилсан томьёоны засварлах хуудас руу үсрэх
        } catch (err) {
            console.error("Failed to clone formula:", err);
            setError('Томьёог хувилах үед алдаа гарлаа.');
        } finally {
            setActionInProgress(false);
        }
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
            {/* Толгой хэсэг: Гарчиг, Засах/Устгах/Хувилах товчнууд */}
            <Stack direction="horizontal" gap={3} className="mb-3 align-items-start">
                <div>
                    <h1 className="h4 fw-bold mb-1">
                        <MathJax hideUntilTypeset={"first"}>{formula.title || `Томьёо #${id}`}</MathJax>
                    </h1>
                    <div className="text-muted small">
                        <i className="bi bi-person me-1"></i>
                        {formula.author?.first_name || formula.author?.email || 'N/A'}
                        {formula.last_edited && (
                            <>
                                <span className="mx-2">•</span>
                                <i className="bi bi-clock me-1"></i>
                                {new Date(formula.last_edited).toLocaleDateString()}
                            </>
                        )}
                        {formula.topic && (
                            <>
                                <span className="mx-2">•</span>
                                <Badge bg="info">{formula.topic.name}</Badge>
                            </>
                        )}
                        {/* Published/Status Badge */}
                        {formula.published !== undefined && (
                            <>
                                <span className="mx-2">•</span>
                                {formula.published ? (
                                    <Badge bg="success">Нийтлэгдсэн</Badge>
                                ) : (
                                    <Badge bg="warning" text="dark">Ноорог</Badge>
                                )}
                            </>
                        )}
                    </div>
                </div>
                {(isAuthor || user?.is_staff) && ( // Зохиогч эсвэл админ бол
                    <div className="ms-auto d-flex gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleClone}
                            disabled={actionInProgress}
                            title="Хувилах"
                        >
                            <i className="bi bi-copy"></i>Хувилах
                        </Button>
                        <Link to={`/formula/${id}/edit`}>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                disabled={actionInProgress}
                                title="Засах"
                            >
                                <i className="bi bi-pencil"></i>Засах
                            </Button>
                        </Link>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={actionInProgress}
                            title="Устгах"
                        >
                            <i className="bi bi-trash"></i>Устгах
                        </Button>
                    </div>
                )}
            </Stack>

            {/* Алдааны мсж (Устгах/Хувилах үед гарвал) */}
            {error && actionInProgress && <Alert variant="danger" className="mt-3">{error}</Alert>}

            {/* Томьёоны агуулга */}
            <Card>
                <Card.Body>
                    <MathJax hideUntilTypeset={"first"}>
                        <div className="mathjax-content formula-content"> {/* CSS нэмж болно */}
                            {formula.content ? (
                                <div dangerouslySetInnerHTML={{ __html: formula.content.replace(/\n\n/g, '<br/><br/>') }} />
                            ) : (
                                <p className="text-muted">Агуулга байхгүй.</p>
                            )}
                        </div>
                    </MathJax>
                </Card.Body>
            </Card>

            {/* Холбоотой түлхүүр үгс */}
            {formula.keywords && formula.keywords.length > 0 && (
                <div className="mt-4">
                    <h6>Түлхүүр үгс:</h6>
                    <Stack direction="horizontal" gap={2} className="flex-wrap">
                        {formula.keywords.map(kw => (
                            <Badge key={kw.id} bg="secondary" pill>{kw.name}</Badge>
                        ))}
                    </Stack>
                </div>
            )}

            {/* (!!!) "Постлох" товчийг энд нэмж болно */}
            {/*
            <div className="mt-4">
                <Button variant="outline-primary">Энэ томьёог постлох</Button>
            </div>
            */}


            {/* Устгах Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Устгахыг баталгаажуулах</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Та "{formula.title || `Томьёо #${id}`}"-г устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Цуцлах
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={actionInProgress}>
                        {actionInProgress ? <Spinner as="span" size="sm"/> : 'Устгах'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default FormulaDetailPage;