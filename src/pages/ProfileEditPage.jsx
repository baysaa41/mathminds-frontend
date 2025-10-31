// frontend/src/pages/ProfileEditPage.jsx (ШИНЭ ФАЙЛ)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row'; // <-- ЭНЭ МӨРИЙГ НЭМЭХ
import Col from 'react-bootstrap/Col'; // <-- ЭНЭ МӨРИЙГ НЭМЭХ

// Django 'models.py'-д тодорхойлсон RoleChoices-г
// frontend-д ашиглахын тулд энд тодорхойлно.
const roleChoices = [
    { key: 'GRADE_1', value: '1-р анги' },
    { key: 'GRADE_2', value: '2-р анги' },
    { key: 'GRADE_3', value: '3-р анги' },
    { key: 'GRADE_4', value: '4-р анги' },
    { key: 'GRADE_5', value: '5-р анги' },
    { key: 'GRADE_6', value: '6-р анги' },
    { key: 'GRADE_7', value: '7-р анги' },
    { key: 'GRADE_8', value: '8-р анги' },
    { key: 'GRADE_9', value: '9-р анги' },
    { key: 'GRADE_10', value: '10-р анги' },
    { key: 'GRADE_11', value: '11-р анги' },
    { key: 'GRADE_12', value: '12-р анги' },
    { key: 'PRIMARY_TEACHER', value: 'Бага ангийн багш' },
    { key: 'SECONDARY_TEACHER', value: 'Дунд ангийн багш' },
    { key: 'PARENT', value: 'Эцэг эх' },
    { key: 'ENTHUSIAST', value: 'Сонирхогч' },
    { key: 'OTHER', value: 'Бусад' },
];

function ProfileEditPage() {
    const { user, updateUser } = useAuth(); // updateUser-г context-с авна
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        role: '',
        picture_url: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // user мэдээлэл context-с ачаалагдсаны дараа form-г дүүргэнэ
    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                role: user.role || '', // 'role' нь 'GRADE_1' гэх мэт key байна
                picture_url: user.picture_url || '',
            });
        }
    }, [user]);


    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Backend partial=True-г хүлээж авч байгаа тул
            // зүгээр л бүх мэдээллээ явуулж болно.
            const dataToUpdate = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                role: formData.role || null, // Хоосон сонговол 'null' явуулах
                picture_url: formData.picture_url,
            };

            const updatedUser = await apiService.updateUserProfile(dataToUpdate);

            // (!!!) Маш чухал: Context-г шинэчлэх
            updateUser(updatedUser);

            setSuccess('Амжилттай шинэчлэгдлээ.');
            setLoading(false);

            // 2 секундын дараа профайл хуудас руу буцах
            setTimeout(() => {
                navigate('/profile'); // Энэ нь /profile/:username руу автоматаар очно
            }, 2000);

        } catch (err) {
            setLoading(false);
            if (typeof err === 'object') {
                // Backend validation алдаа (жишээ: {role: ["Invalid choice."]})
                const messages = Object.values(err).flat().join(' ');
                setError(messages || 'Алдаа гарлаа.');
            } else {
                setError(err.message || 'Профайл шинэчлэхэд алдаа гарлаа.');
            }
        }
    };

    return (
        <Container className="my-4" style={{ maxWidth: '800px' }}>
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-light p-4 border-0">
                    <h2 className="h4 fw-bold mb-0">Профайл засах</h2>
                    <p className="text-muted mb-0">@{user?.username}</p>
                </Card.Header>
                <Card.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="first_name">
                                    <Form.Label>Нэр</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="Нэр"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="last_name">
                                    <Form.Label>Овог</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Овог"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" controlId="role">
                            <Form.Label>Таны үүрэг</Form.Label>
                            <Form.Select
                                name="role"
                                value={formData.role} // Энэ нь 'GRADE_1' гэх мэт key-г хүлээж авна
                                onChange={handleChange}
                            >
                                <option value="">--- Сонгоно уу ---</option>
                                {roleChoices.map(choice => (
                                    <option key={choice.key} value={choice.key}>
                                        {choice.value}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="picture_url">
                            <Form.Label>Профайл зургийн URL</Form.Label>
                            <Form.Control
                                type="text"
                                name="picture_url"
                                value={formData.picture_url}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                            <Form.Text className="text-muted">
                                ui-avatars.com, gravatar.com, эсвэл бусад зургийн линк.
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/profile')}
                                disabled={loading}
                            >
                                Цуцлах
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Хадгалах'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default ProfileEditPage;