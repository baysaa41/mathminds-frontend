// src/pages/GroupCreatePage.jsx
// (!!! ШИНЭ ФАЙЛ)

import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const GroupCreatePage = () => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [grade, setGrade] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        setPageTitle('Шинэ Клуб Үүсгэх');
    }, [setPageTitle]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // (!!!) /api/integral/groups/ руу POST хүсэлт илгээх
            const response = await apiClient.post('/api/integral/groups/', {
                name: name,
                description: description,
                grade: grade || null, // Хоосон бол null явуулах
            });

            // (!!!) Backend-д тохируулснаар, үүсгэгч автоматаар багш болно.
            // Шинэ үүссэн бүлгийн дэлгэрэнгүй хуудас руу үсрэх
            navigate(`/group/${response.data.id}`);

        } catch (err) {
            console.error("Бүлэг үүсгэхэд алдаа гарлаа:", err);
            setError(err.response?.data?.name?.[0] || err.response?.data?.detail || "Алдаа гарлаа.");
            setLoading(false);
        }
    };

    return (
        <Container fluid="lg" className="p-3">
            <Row className="justify-content-center">
                <Col md={8} lg={7}>
                    <Card className="shadow-sm">
                        <Card.Header as="h5">Шинэ Клуб Үүсгэх</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="groupName">
                                    <Form.Label>Клубын нэр (Шаардлагатай)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Жишээ нь: Математикийн гүнзгийрүүлсэн клуб"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="groupDescription">
                                    <Form.Label>Тодорхойлолт</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Энэ клуб юуны тухай болох..."
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="groupGrade">
                                    <Form.Label>Зорилтот анги/түвшин</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        placeholder="Жишээ нь: 10-12-р анги"
                                    />
                                </Form.Group>

                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? <Spinner as="span" size="sm" className="me-1" /> : <i className="bi bi-check-lg me-1"></i>}
                                    Үүсгэх
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default GroupCreatePage;