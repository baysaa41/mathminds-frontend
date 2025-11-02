// frontend/src/pages/RegisterPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear validation error for this field
        if (validationErrors[e.target.name]) {
            setValidationErrors({
                ...validationErrors,
                [e.target.name]: null
            });
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.username) {
            errors.username = 'Хэрэглэгчийн нэр шаардлагатай';
        } else if (formData.username.length < 3) {
            errors.username = 'Хэрэглэгчийн нэр 3-аас дээш тэмдэгттэй байх ёстой';
        }

        if (!formData.email) {
            errors.email = 'И-мэйл хаяг шаардлагатай';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'И-мэйл хаяг буруу байна';
        }

        if (!formData.password) {
            errors.password = 'Нууц үг шаардлагатай';
        } else if (formData.password.length < 8) {
            errors.password = 'Нууц үг 8-аас дээш тэмдэгттэй байх ёстой';
        }

        if (formData.password !== formData.password_confirm) {
            errors.password_confirm = 'Нууц үг хоорондоо таарахгүй байна';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setValidationErrors({});

        // Client-side validation
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            // Register API call
            const response = await apiClient.post('/users/api/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name
            });

            const { token, user } = response.data;

            // Автоматаар нэвтрүүлэх
            login(user, token);

            // Home хуудас руу очих
            navigate('/');

        } catch (err) {
            setLoading(false);

            if (err.response?.data) {
                // Backend validation errors
                const backendErrors = err.response.data;

                if (typeof backendErrors === 'object') {
                    // Field-specific errors
                    setValidationErrors(backendErrors);

                    // General error message
                    const errorMessages = Object.values(backendErrors).flat();
                    setError(errorMessages.join(' '));
                } else if (typeof backendErrors === 'string') {
                    setError(backendErrors);
                } else {
                    setError('Бүртгэл үүсгэхэд алдаа гарлаа.');
                }
            } else {
                setError('Серверт алдаа гарлаа. Дахин оролдоно уу.');
            }
            console.error("Register error:", err);
        }
    };

    return (
        <Container
            fluid
            className="d-flex align-items-center justify-content-center min-vh-100"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
        >
            <Card
                className="shadow-lg border-0"
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    borderRadius: '16px'
                }}
            >
                <Card.Body className="p-5">
                    {/* Лого & Гарчиг */}
                    <div className="text-center mb-4">
                        <div
                            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                            style={{
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            }}
                        >
                            <span className="text-white fw-bold" style={{ fontSize: '28px' }}>
                                ∑
                            </span>
                        </div>
                        <h2 className="fw-bold text-dark mb-1">Бүртгүүлэх</h2>
                        <p className="text-muted small mb-0">
                            MathMinds.club-д тавтай морил
                        </p>
                    </div>

                    {/* Алдааны мэдэгдэл */}
                    {error && (
                        <Alert variant="danger" className="py-2 small">
                            {error}
                        </Alert>
                    )}

                    {/* Registration Form */}
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-secondary">
                                        Нэр
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="first_name"
                                        placeholder="Таны нэр"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        disabled={loading}
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-secondary">
                                        Овог
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="last_name"
                                        placeholder="Таны овог"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        disabled={loading}
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold text-secondary">
                                Хэрэглэгчийн нэр *
                            </Form.Label>
                            <Form.Control
                                type="text"
                                name="username"
                                placeholder="username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                isInvalid={!!validationErrors.username}
                                style={{ borderRadius: '8px' }}
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.username}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold text-secondary">
                                И-мэйл хаяг *
                            </Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                isInvalid={!!validationErrors.email}
                                style={{ borderRadius: '8px' }}
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.email}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold text-secondary">
                                Нууц үг *
                            </Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                isInvalid={!!validationErrors.password}
                                style={{ borderRadius: '8px' }}
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.password}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted small">
                                Дор хаяж 8 тэмдэгт
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-semibold text-secondary">
                                Нууц үг давтах *
                            </Form.Label>
                            <Form.Control
                                type="password"
                                name="password_confirm"
                                placeholder="••••••••"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                disabled={loading}
                                required
                                isInvalid={!!validationErrors.password_confirm}
                                style={{ borderRadius: '8px' }}
                            />
                            <Form.Control.Feedback type="invalid">
                                {validationErrors.password_confirm}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-100 py-2 fw-semibold"
                            disabled={loading}
                            style={{
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                    />
                                    Бүртгүүлж байна...
                                </>
                            ) : (
                                'Бүртгүүлэх'
                            )}
                        </Button>
                    </Form>
                </Card.Body>

                {/* Нэвтрэх холбоос */}
                <Card.Footer
                    className="text-center py-3 bg-light border-0"
                    style={{ borderRadius: '0 0 16px 16px' }}
                >
                    <span className="small text-muted">
                        Аль хэдийн бүртгэлтэй үү?{' '}
                        <a href="/login" className="text-primary text-decoration-none fw-semibold">
                            Нэвтрэх
                        </a>
                    </span>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default RegisterPage;