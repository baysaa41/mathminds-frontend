// src/pages/CreateClub.jsx
// Шинэ клуб үүсгэх хуудас (Django Backend)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { createClub, formatErrorMessage } from '../services/clubsService';

const CreateClub = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        class_field: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError('Клубын нэр оруулна уу');
            return;
        }

        try {
            setLoading(true);
            const response = await createClub(formData);

            // Success - navigate to club detail page
            navigate(`/clubs/${response.club_id}`);
        } catch (err) {
            console.error('Error creating club:', err);
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <div className="mb-4">
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/clubs')}
                                    className="p-0 text-decoration-none"
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Буцах
                                </Button>
                            </div>

                            <h2 className="h3 mb-3">
                                <i className="bi bi-plus-circle text-primary me-2"></i>
                                Шинэ клуб үүсгэх
                            </h2>
                            <p className="text-muted mb-4">
                                Математикийн клубаа үүсгэж, сурагчдаа нэгтгээрэй
                            </p>

                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Клубын нэр <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder="Жишээ: Математикийн 9А анги"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={loading}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Анги</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="class_field"
                                        placeholder="Жишээ: 9А"
                                        value={formData.class_field}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-muted">
                                        Заавал биш
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Тайлбар</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        rows={4}
                                        placeholder="Клубын товч танилцуулга..."
                                        value={formData.description}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-muted">
                                        Заавал биш
                                    </Form.Text>
                                </Form.Group>

                                <Alert variant="info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    <strong>Анхаарна уу:</strong> Клуб үүсгэсний дараа таньд автоматаар
                                    бүртгэлийн код үүсэх бөгөөд үүнийг сурагчиддаа өгч клубт элсүүлнэ.
                                </Alert>

                                <div className="d-flex gap-2 justify-content-end">
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigate('/clubs')}
                                        disabled={loading}
                                    >
                                        Болих
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={loading || !formData.name.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    className="me-2"
                                                />
                                                Үүсгэж байна...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Клуб үүсгэх
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateClub;