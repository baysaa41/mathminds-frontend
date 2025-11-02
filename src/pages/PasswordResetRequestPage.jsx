// frontend/src/pages/PasswordResetRequestPage.jsx

import { useState } from 'react';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

const PasswordResetRequestPage = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        // Simple email validation
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError('И-мэйл хаяг буруу байна');
            setLoading(false);
            return;
        }

        try {
            await apiClient.post('/users/api/password-reset/request/', {
                email: email
            });

            setSuccess(true);
            setEmail('');

        } catch (err) {
            setError(
                err.response?.data?.error ||
                'И-мэйл илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
            );
            console.error("Password reset request error:", err);
        } finally {
            setLoading(false);
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
                                🔒
                            </span>
                        </div>
                        <h2 className="fw-bold text-dark mb-1">Нууц үг сэргээх</h2>
                        <p className="text-muted small mb-0">
                            Бүртгэлтэй и-мэйл хаягаа оруулна уу
                        </p>
                    </div>

                    {/* Амжилтын мэдэгдэл */}
                    {success && (
                        <Alert variant="success" className="py-3">
                            <div className="fw-semibold mb-1">✅ И-мэйл илгээгдлээ!</div>
                            <div className="small">
                                Нууц үг сэргээх заавар таны и-мэйл хаягт илгээгдсэн.
                                И-мэйлээ шалгаад холбоосыг дараарай.
                            </div>
                        </Alert>
                    )}

                    {/* Алдааны мэдэгдэл */}
                    {error && (
                        <Alert variant="danger" className="py-2 small">
                            {error}
                        </Alert>
                    )}

                    {!success && (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-4">
                                <Form.Label className="small fw-semibold text-secondary">
                                    И-мэйл хаяг
                                </Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="example@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                    style={{ borderRadius: '8px' }}
                                />
                                <Form.Text className="text-muted small">
                                    Бүртгэлтэй и-мэйл хаягаа оруулна уу
                                </Form.Text>
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
                                        Илгээж байна...
                                    </>
                                ) : (
                                    'Сэргээх холбоос илгээх'
                                )}
                            </Button>
                        </Form>
                    )}

                    {/* Буцах холбоос */}
                    <div className="text-center mt-4">
                        <a
                            href="/login"
                            className="text-decoration-none small text-primary"
                        >
                            ← Нэвтрэх хуудас руу буцах
                        </a>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default PasswordResetRequestPage;