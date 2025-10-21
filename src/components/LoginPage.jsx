// frontend/src/components/LoginPage.jsx

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

// React Bootstrap компонентуудыг импорт хийх
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/users/api/login/', {
                email: email, // 'username'-г 'email' болгож өөрчилнө
                password: password,
            });

            // --- ШИНЭ КОД ---
            const { token, user } = response.data;
            login(user, token); // userData биш 'user' обьектыг дамжуулна
            navigate('/');

        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('И-мэйл эсвэл нууц үг буруу байна.');
            }
            console.error("Нэвтрэх үед алдаа гарлаа:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
            <Card className="p-4 p-md-5 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
                <Card.Body>
                    {/* Гарчиг */}
                    <Card.Title as="h2" className="text-center mb-2 fw-bold text-primary">
                        MathMinds.club
                    </Card.Title>

                    {/* Уриа үг */}
                    <p className="text-center text-muted mb-4 fst-italic" style={{ fontSize: '0.9rem' }}>
                        Where every mind counts.
                    </p>

                    {/* Алдааны мэдээлэл */}
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        {/* И-мэйл талбар */}
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label className="fw-semibold">И-мэйл хаяг</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Нууц үг талбар */}
                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label className="fw-semibold">Нууц үг</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Нэвтрэх товч */}
                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Түр хүлээнэ үү...
                                </>
                            ) : (
                                'Нэвтрэх'
                            )}
                        </Button>

                        {/* Нууц үг сэргээх холбоос */}
                        <div className="text-center mt-3">
                            <Link to="/password-reset" className="text-decoration-none">
                                Нууц үгээ мартсан уу?
                            </Link>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default LoginPage;