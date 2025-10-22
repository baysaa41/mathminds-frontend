import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { MathJax } from 'better-react-mathjax';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Badge from 'react-bootstrap/Badge';

const ProblemDetailPage = () => {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get(`/api/minds/problems/${id}/`);
                setProblem(response.data);

                // Гарчгийг энд тохируулна
                if (response.data?.title) {
                    setPageTitle(response.data.title);
                } else {
                    setPageTitle(`Бодлого #${id}`);
                }

            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Бодлого олдсонгүй.');
                } else {
                    setError('Бодлогыг уншихад алдаа гарлаа.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProblem();
        } else {
            setError("Бодлогын дугаар (ID) олдсонгүй.");
            setLoading(false);
            setPageTitle("Алдаа");
        }

        // Cleanup: Компонент солигдох үед гарчгийг цэвэрлэх
        return () => {
            setPageTitle("Нүүр");
        };

    }, [id, setPageTitle]);

    // Ачааллаж байх үеийн дэлгэц
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5" >
                <Spinner animation="border" />
            </Container>
        );
    }

    // Алдаа гарсан үеийн дэлгэц
    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Link to="/"> &laquo; Буцах</Link>
            </Container>
        );
    }

    // Бодлого олдсонгүй
    if (!problem) {
        return null;
    }

    const canEdit = user && problem && problem.author && (user.id === problem.author.id || user.is_staff);

    const handleEditClick = () => {
        navigate(`/problem/${id}/edit`);
    };

    // Бодлогын төрлийг харуулах
    const getProblemTypeLabel = (type) => {
        switch (type) {
            case 0:
                return 'Уламжлалт';
            case 1:
                return 'Сонгох тест';
            case 4:
                return 'Нөхөх тест';
            default:
                return 'Төрөл тодорхойгүй';
        }
    };

    // Үндсэн дэлгэц
    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                <Breadcrumb.Item active>{problem.title || `Бодлого #${id}`}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Гарчиг ба Засварлах товч */}
            <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                <MathJax hideUntilTypeset={"first"} className="flex-grow-1">
                    <h1 className="h3 fw-bold mathjax-content mb-0">
                        {problem.title || `Бодлого #${id}`}
                    </h1>
                </MathJax>
                {canEdit && (
                    <Button variant="outline-primary" size="sm" onClick={handleEditClick} className="flex-shrink-0">
                        Засварлах
                    </Button>
                )}
            </Stack>

            {/* Мэдээллийн badges */}
            <Stack direction="horizontal" gap={2} className="mb-3 flex-wrap">
                {problem.level_name && (
                    <Badge bg="secondary">{problem.level_name}</Badge>
                )}
                {problem.type !== undefined && (
                    <Badge bg="info">{getProblemTypeLabel(problem.type)}</Badge>
                )}
                {problem.is_published && (
                    <Badge bg="success">Нийтэлсэн</Badge>
                )}
            </Stack>

            {/* Зохиогч, огноо */}
            <div className="text-muted mb-4 small d-flex flex-wrap gap-2 align-items-center">
                <span>Зохиогч: {problem.author?.first_name || problem.author?.email || 'N/A'}</span>
                {problem.last_edited && (
                    <>
                        <span className='d-none d-sm-inline mx-1'>|</span>
                        <span>Сүүлд засварласан: {new Date(problem.last_edited).toLocaleDateString()}</span>
                    </>
                )}
            </div>

            <hr className="mb-4"/>

            {/* Бодлогын агуулга (statement) */}
            <div className="mb-4">
                <h5 className="fw-semibold mb-3">Бодлогын нөхцөл:</h5>
                <MathJax hideUntilTypeset={"first"}>
                    <div
                        className="problem-statement mathjax-content p-3 bg-light rounded"
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ __html: problem.statement || '' }}
                    />
                </MathJax>
            </div>

            {/* Хариулт (зөвхөн зохиогч эсвэл админ харна) */}
            {canEdit && problem.answer && (
                <div className="mb-4">
                    <h5 className="fw-semibold mb-3">Хариулт:</h5>
                    <MathJax hideUntilTypeset={"first"}>
                        <div
                            className="problem-answer mathjax-content p-3 bg-warning bg-opacity-10 rounded border border-warning"
                            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
                        >
                            {problem.answer}
                        </div>
                    </MathJax>
                </div>
            )}

            {/* Сонголтууд (Multiple choice бол) */}
            {problem.type === 1 && problem.choices && problem.choices.length > 0 && (
                <div className="mb-4">
                    <h5 className="fw-semibold mb-3">Сонголтууд:</h5>
                    <MathJax hideUntilTypeset={"first"}>
                        <div className="list-group">
                            {problem.choices.map((choice, index) => (
                                <div
                                    key={choice.id || index}
                                    className="list-group-item mathjax-content"
                                >
                                    <strong>{choice.label || `${String.fromCharCode(65 + index)}.`}</strong> {choice.value}
                                    {canEdit && choice.default_score > 0 && (
                                        <Badge bg="success" className="ms-2">Зөв</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </MathJax>
                </div>
            )}

            <hr className="mt-5"/>
            <Link to="/" className="btn btn-outline-secondary btn-sm mt-3">
                &laquo; Нүүр хуудас руу буцах
            </Link>
        </Container>
    );
};

export default ProblemDetailPage;