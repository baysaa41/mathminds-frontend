// frontend/src/pages/PasswordResetConfirmPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

const PasswordResetConfirmPage = () => {
    const { uidb64, token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [username, setUsername] = useState('');

    // Token-г эхлээд шалгах
    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await apiClient.get(
                    `/users/api/password-reset/validate/${uidb64}/${token}/`
                );

                if (response.data.valid) {
                    setTokenValid(true);
                    setUsername(response.data.username || '');
                } else {
                    setTokenValid(false);
                    setError(response.data.error || 'Холбоос хүчингүй байна.');
                }
            } catch (err) {
                setTokenValid(false);
                setError(
                    err.response?.data?.error ||
                    'Холбоос хүчингүй эсвэл хугацаа дууссан байна.'
                );
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, [uidb64, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (password.length < 8) {
            setError('Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой');
            setLoading(false);
            return;
        }

        if (password !== passwordConfirm) {
            setError('Нууц үг хоорондоо таарахгүй байна');
            setLoading(false);
            return;
        }

        try {
            await apiClient.post(
                `/users/api/password-reset/confirm/${uidb64}/${token}/`,
                {
                    password: password,
                    password_confirm: passwordConfirm
                }
            );

            setSuccess(true);

            // 3 секундын дараа login хуудас руу шилжих
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(
                err.response?.data?.error ||
                'Нууц үг солиход алдаа гарлаа. Дахин оролдоно уу.'
            );
            console.error("Password reset confirm error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Token шалгаж байгаа үед
    if (validating) {
        return (
            <Container
                fluid
                className="d-flex align-items-center justify-content-center min-vh-100"
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
            >
                <Card
                    className="shadow-lg border-0 text-center p-5"
                    style={{
                        maxWidth: '440px',
                        width: '100%',
                        borderRadius: '16px'
                    }}
                >
                    <Spinner animation="border" variant="primary" className="mb-3" />
                    <p className="text-muted">Холбоос шалгаж байна...</p>
                </Card>
            </Container>
        );
    }

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
                    maxWidth: '440px',
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
                                {tokenValid ? '🔑' : '❌'}
                            </span>
                        </div>
                        <h2 className="fw-bold text-dark mb-1">
                            {tokenValid ? 'Шинэ нууц үг үүсгэх' : 'Холбоос хүчингүй'}
                        </h2>
                        {tokenValid && username && (
                            <p className="text-muted small mb-0">
                                Хэрэглэгч: <strong>@{username}</strong>
                            </p>
                        )}
                    </div>

                    {/* Амжилтын мэдэгдэл */}
                    {success && (
                        <Alert variant="success" className="py-3">
                            <div className="fw-semibold mb-1">✅ Амжилттай!</div>
                            <div className="small">
                                Нууц үг амжилттай солигдлоо. Нэвтрэх хуудас руу шилжиж байна...
                            </div>
                        </Alert>
                    )}

                    {/* Алдааны мэдэгдэл */}
                    {error && (
                        <Alert variant="danger" className="py-2 small">
                            {error}
                        </Alert>
                    )}

                    {/* Token хүчингүй бол */}
                    {!tokenValid && (
                        <div className="text-center">
                            <p className="text-muted mb-4">
                                Холбоос хүчингүй эсвэл хугацаа дууссан байна.
                                Дахин оролдоно уу.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/password-reset')}
                                style={{
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    border: 'none'
                                }}
                            >
                                Нууц үг сэргээх хуудас руу очих
                            </Button>
                        </div>
                    )}

                    {/* Token хүчинтэй бол form харуулах */}
                    {tokenValid && !success && (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold text-secondary">
                                    Шинэ нууц үг
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
                                <Form.Text className="text-muted small">
                                    Дор хаяж 8 тэмдэгт
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-semibold text-secondary">
                                    Нууц үг давтах
                                </Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="••••••••"
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    disabled={loading}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
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
                                        Хадгалж байна...
                                    </>
                                ) : (
                                    'Нууц үг солих'
                                )}
                            </Button>
                        </Form>
                    )}

                    {/* Буцах холбоос */}
                    {!success && (
                        <div className="text-center mt-4">
                            <a
                                href="/login"
                                className="text-decoration-none small text-primary"
                            >
                                ← Нэвтрэх хуудас руу буцах
                            </a>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PasswordResetConfirmPage;