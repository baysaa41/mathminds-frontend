// frontend/src/pages/SolutionEditPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';
import Accordion from 'react-bootstrap/Accordion';

// Icons
import { Plus, Edit2, Trash2, Save, X, Lightbulb, FileText, StickyNote } from 'lucide-react';

const SolutionEditPage = () => {
    const { id } = useParams(); // problem ID
    const navigate = useNavigate();
    const { user } = useAuth();

    const [problem, setProblem] = useState(null);
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null); // null = new, number = editing
    const [modalData, setModalData] = useState({
        hint: '',
        solution: '',
        note: ''
    });

    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchProblemAndSolutions();
    }, [id]);

    const fetchProblemAndSolutions = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch problem details
            const problemResponse = await apiClient.get(`/api/integral/problems/${id}/`);
            setProblem(problemResponse.data);

            // Fetch solutions for this problem
            const solutionsResponse = await apiClient.get(`/api/integral/solutions/?problem_id=${id}`);
            setSolutions(solutionsResponse.data);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Мэдээлэл татахад алдаа гарлаа.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (index = null) => {
        if (index !== null) {
            // Editing existing solution
            const solution = solutions[index];
            setModalData({
                hint: solution.hint || '',
                solution: solution.solution || '',
                note: solution.note || ''
            });
            setEditingIndex(index);
        } else {
            // Adding new solution
            setModalData({ hint: '', solution: '', note: '' });
            setEditingIndex(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalData({ hint: '', solution: '', note: '' });
        setEditingIndex(null);
    };

    const handleSaveSolution = async () => {
        try {
            setSaving(true);

            // Validate: at least one field must be filled
            if (!modalData.hint && !modalData.solution && !modalData.note) {
                alert('Дор хаяж нэг талбар бөглөнө үү!');
                return;
            }

            if (editingIndex !== null) {
                // Update existing solution
                const solutionId = solutions[editingIndex].id;
                await apiClient.patch(`/api/integral/solutions/${solutionId}/`, modalData);
            } else {
                // Create new solution
                await apiClient.post('/api/integral/solutions/', {
                    ...modalData,
                    problem: id
                });
            }

            // Refresh solutions list
            await fetchProblemAndSolutions();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving solution:', err);
            alert('Хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSolution = async (solutionId) => {
        try {
            setSaving(true);
            await apiClient.delete(`/api/integral/solutions/${solutionId}/`);
            await fetchProblemAndSolutions();
            setShowDeleteModal(false);
            setDeletingId(null);
        } catch (err) {
            console.error('Error deleting solution:', err);
            alert('Устгахад алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
            setSaving(false);
        }
    };

    const openDeleteModal = (solutionId) => {
        setDeletingId(solutionId);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeletingId(null);
    };

    // Check permissions
    const canEdit = user && problem && problem.author &&
        (user.id === problem.author.id || user.is_staff);

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
                <Button as={Link} to={`/problem/${id}`} variant="outline-secondary" size="sm">
                    &laquo; Буцах
                </Button>
            </Container>
        );
    }

    if (!problem) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">Бодлого олдсонгүй.</Alert>
                <Button as={Link} to="/" variant="outline-secondary" size="sm">
                    &laquo; Нүүр хуудас
                </Button>
            </Container>
        );
    }

    if (!canEdit) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    Та энэ бодлогын бодолтыг засах эрхгүй байна.
                </Alert>
                <Button as={Link} to={`/problem/${id}`} variant="outline-secondary" size="sm">
                    &laquo; Бодлого руу буцах
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Header */}
            <Stack direction="horizontal" gap={3} className="mb-4">
                <div>
                    <h2 className="h4 mb-2">Бодолт засах</h2>
                    <p className="text-muted mb-0">
                        Бодлого: <strong>{problem.title || `#${id}`}</strong>
                    </p>
                </div>
                <Button
                    as={Link}
                    to={`/problem/${id}`}
                    variant="outline-secondary"
                    size="sm"
                    className="ms-auto"
                >
                    Бодлого харах
                </Button>
            </Stack>

            {/* Add New Solution Button */}
            <div className="mb-4">
                <Button
                    variant="primary"
                    onClick={() => handleOpenModal(null)}
                    className="d-flex align-items-center gap-2"
                >
                    <Plus size={18} />
                    Шинэ бодолт нэмэх
                </Button>
            </div>

            {/* Solutions List */}
            {solutions.length === 0 ? (
                <Alert variant="info">
                    Одоогоор бодолт байхгүй байна. Шинэ бодолт нэмнэ үү.
                </Alert>
            ) : (
                <div className="solutions-list">
                    {solutions.map((solution, index) => (
                        <Card key={solution.id} className="mb-3">
                            <Card.Header className="bg-light">
                                <Stack direction="horizontal" gap={2}>
                                    <strong>Бодолт #{index + 1}</strong>
                                    {solution.author && (
                                        <Badge bg="secondary">
                                            {solution.author.first_name || solution.author.email}
                                        </Badge>
                                    )}
                                    <div className="ms-auto d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleOpenModal(index)}
                                        >
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => openDeleteModal(solution.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </Stack>
                            </Card.Header>
                            <Card.Body>
                                <Accordion>
                                    {solution.hint && (
                                        <Accordion.Item eventKey={`hint-${solution.id}`}>
                                            <Accordion.Header>
                                                <Stack direction="horizontal" gap={2}>
                                                    <Lightbulb size={16} className="text-warning" />
                                                    <span>Заавар</span>
                                                </Stack>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <MathJax hideUntilTypeset={"first"}>
                                                    <div
                                                        className="mathjax-content"
                                                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                        dangerouslySetInnerHTML={{ __html: solution.hint }}
                                                    />
                                                </MathJax>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {solution.solution && (
                                        <Accordion.Item eventKey={`solution-${solution.id}`}>
                                            <Accordion.Header>
                                                <Stack direction="horizontal" gap={2}>
                                                    <FileText size={16} className="text-success" />
                                                    <span>Бодолт</span>
                                                </Stack>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <MathJax hideUntilTypeset={"first"}>
                                                    <div
                                                        className="mathjax-content"
                                                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                        dangerouslySetInnerHTML={{ __html: solution.solution }}
                                                    />
                                                </MathJax>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}

                                    {solution.note && (
                                        <Accordion.Item eventKey={`note-${solution.id}`}>
                                            <Accordion.Header>
                                                <Stack direction="horizontal" gap={2}>
                                                    <StickyNote size={16} className="text-info" />
                                                    <span>Тэмдэглэл</span>
                                                </Stack>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <MathJax hideUntilTypeset={"first"}>
                                                    <div
                                                        className="mathjax-content"
                                                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                                        dangerouslySetInnerHTML={{ __html: solution.note }}
                                                    />
                                                </MathJax>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    )}
                                </Accordion>

                                {!solution.hint && !solution.solution && !solution.note && (
                                    <p className="text-muted mb-0">Агуулга хоосон байна.</p>
                                )}
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit/Add Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingIndex !== null ? 'Бодолт засах' : 'Шинэ бодолт нэмэх'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="d-flex align-items-center gap-2">
                                <Lightbulb size={16} className="text-warning" />
                                Заавар (Hint)
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={modalData.hint}
                                onChange={(e) => setModalData({ ...modalData, hint: e.target.value })}
                                placeholder="LaTeX томъёо ашиглаж болно: $x^2 + y^2 = z^2$"
                            />
                            <Form.Text className="text-muted">
                                Сурагчдад бодоход туслах зөвлөмж
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="d-flex align-items-center gap-2">
                                <FileText size={16} className="text-success" />
                                Бодолт (Solution)
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                value={modalData.solution}
                                onChange={(e) => setModalData({ ...modalData, solution: e.target.value })}
                                placeholder="Бодолтын алхам алхмаар тайлбар..."
                            />
                            <Form.Text className="text-muted">
                                Бодолтын дэлгэрэнгүй тайлбар
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="d-flex align-items-center gap-2">
                                <StickyNote size={16} className="text-info" />
                                Тэмдэглэл (Note)
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={modalData.note}
                                onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                                placeholder="Нэмэлт тайлбар эсвэл санамж..."
                            />
                            <Form.Text className="text-muted">
                                Нэмэлт мэдээлэл
                            </Form.Text>
                        </Form.Group>

                        <Alert variant="info" className="small mb-0">
                            <strong>Санамж:</strong> Дор хаяж нэг талбар бөглөнө үү. LaTeX томъёо ашиглахдаа
                            $ эсвэл $$ тэмдэг ашиглана.
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal} disabled={saving}>
                        <X size={16} className="me-1" />
                        Болих
                    </Button>
                    <Button variant="primary" onClick={handleSaveSolution} disabled={saving}>
                        {saving ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Хадгалж байна...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="me-1" />
                                Хадгалах
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={closeDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Бодолт устгах</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Та энэ бодолтыг үнэхээр устгахыг хүсч байна уу?</p>
                    <Alert variant="warning" className="small mb-0">
                        <strong>Анхааруулга:</strong> Энэ үйлдлийг буцаах боломжгүй!
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeDeleteModal} disabled={saving}>
                        Болих
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleDeleteSolution(deletingId)}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
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

export default SolutionEditPage;