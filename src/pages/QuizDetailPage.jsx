// frontend/src/pages/QuizDetailPage.jsx
// (!!! ШИНЭ ФАЙЛ - СУУРЬ !!!)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import LivePreview from '../components/LivePreview.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

const QuizDetailPage = () => {
    const { id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                setError(null);
                // (!!!) Backend-с quiz-н мэдээллийг 'problems'-той нь хамт nested-ээр авчирна гэж таамаглаж байна
                const response = await apiClient.get(`/api/integral/quizzes/${id}/`);
                setQuiz(response.data);
                if (response.data?.title) {
                    setPageTitle(response.data.title);
                }
            } catch (err) {
                setError(err.response?.status === 404 ? 'Тест олдсонгүй.' : 'Тестийг ачааллахад алдаа гарлаа.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchQuiz();
        }

        return () => { setPageTitle("Нүүр"); };
    }, [id, setPageTitle]);

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
                <Link to="/quizzes"> &laquo; Тестийн сан руу буцах</Link>
            </Container>
        );
    }

    if (!quiz) {
        return null;
    }

    const canEdit = user && quiz && quiz.author && (user.id === quiz.author.id || user.is_staff);

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/quizzes" }}>Тестийн сан</Breadcrumb.Item>
                <Breadcrumb.Item active>{quiz.title || 'Тест'}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Гарчиг ба Засварлах товч */}
            <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                <div className="flex-grow-1">
                    <h1 className="h3 fw-bold mathjax-content mb-1">
                        <LivePreview content={quiz.title || 'Гарчиггүй тест'} />
                    </h1>
                    <div className="text-muted small">
                        Зохиогч: {quiz.author?.first_name || quiz.author?.email || 'N/A'}
                    </div>
                </div>
                {canEdit && (
                    <Button variant="outline-primary" size="sm" onClick={() => navigate(`/quiz/${id}/edit`)} className="flex-shrink-0">
                        Засварлах
                    </Button>
                )}
            </Stack>

            {/* Тайлбар */}
            {quiz.description && (
                <Card className="mb-4 bg-light">
                    <Card.Body>
                        <Card.Text as="div" className="mathjax-content">
                            <LivePreview content={quiz.description} />
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}

            <hr />

            {/* Тест эхлүүлэх (Ирээдүйд) */}
            <div className="d-grid gap-2 mb-4">
                <Button variant="primary" size="lg" disabled>
                    Тест эхлүүлэх (Тун удахгүй)
                </Button>
            </div>


            {/* Агуулагдсан бодлогууд */}
            <h4 className="mb-3">Тестэд багтсан бодлогууд ({quiz.problems?.length || 0})</h4>

            {quiz.problems && quiz.problems.length > 0 ? (
                <ListGroup variant="flush">
                    {quiz.problems.map((problem, index) => (
                        <ListGroup.Item key={problem.id} className="d-flex justify-content-between align-items-start p-3">
                            <div className="ms-2 me-auto">
                                <div className="fw-bold mathjax-content mb-2">
                                    <LivePreview content={`${index + 1}. ${problem.title || `Бодлого #${problem.id}`}`} />
                                </div>
                                <div className="text-muted small mathjax-content">
                                    <LivePreview content={problem.statement?.substring(0, 150) + '...'} />
                                </div>
                            </div>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate(`/problem/${problem.id}`)}
                                title="Бодлогыг харах"
                            >
                                <i className="bi bi-eye"></i>
                            </Button>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <Alert variant="info">Энэ тестэд одоогоор бодлого нэмэгдээгүй байна.</Alert>
            )}

            <hr className="mt-5"/>
            <Link to="/quizzes" className="btn btn-outline-secondary btn-sm mt-3">
                &laquo; Тестийн сан руу буцах
            </Link>
        </Container>
    );
};

export default QuizDetailPage;