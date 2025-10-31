// src/pages/Clubs.jsx
// Хэрэглэгчийн клубууд (ЭЦСИЙН ХУВИЛБАР - clubsService ашиглана)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import JoinClubModal from '../components/JoinClubModal';
import clubsService from '../services/clubsService'; // <--- SERVICE IMPORT

const Clubs = () => {
    const { user } = useAuth();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);

    useEffect(() => {
        fetchClubs();
    }, []);

    const fetchClubs = async () => {
        try {
            setLoading(true);
            setError(null);

            // Service ашиглана
            const data = await clubsService.getClubs();

            // Өгөгдөл array эсэхийг шалгах
            console.log('📊 Data type:', typeof data);
            console.log('📊 Is array:', Array.isArray(data));
            console.log('📊 Data:', data);

            // Хэрэв array биш бол, array болгох
            if (Array.isArray(data)) {
                setClubs(data);
            } else if (data?.clubs && Array.isArray(data.clubs)) {
                // Хэрэв { clubs: [...] } формат бол
                setClubs(data.clubs);
            } else if (data?.results && Array.isArray(data.results)) {
                // Хэрэв pagination { results: [...] } формат бол
                setClubs(data.results);
            } else {
                console.warn('⚠️ Unexpected data format:', data);
                setClubs([]);
            }
        } catch (err) {
            console.error('❌ Error in fetchClubs:', err);
            // Алдаа форматлана
            const errorMessage = clubsService.formatErrorMessage(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSuccess = () => {
        fetchClubs(); // Refresh clubs list
        setShowJoinModal(false);
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Клубууд уншиж байна...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Алдаа гарлаа
                    </Alert.Heading>
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-secondary"
                            onClick={() => window.location.reload()}
                        >
                            Хуудсыг сэргээх
                        </Button>
                        <Button
                            variant="danger"
                            onClick={fetchClubs}
                        >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Дахин оролдох
                        </Button>
                    </div>
                </Alert>

                {/* Debug мэдээлэл */}
                <Card className="mt-3">
                    <Card.Body>
                        <Card.Title className="h6">
                            <i className="bi bi-info-circle me-2"></i>
                            Шалгах зүйлс:
                        </Card.Title>
                        <ul className="mb-0">
                            <li>Django backend ажиллаж байгаа эсэх: <code>python manage.py runserver</code></li>
                            <li>URL зөв эсэх: <code>http://127.0.0.1:8000/api/clubs/</code></li>
                            <li>Token байгаа эсэх: Console дээр <code>localStorage.getItem('token')</code> шалгах</li>
                            <li>CORS тохируулсан эсэх</li>
                        </ul>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    const teacherClubs = Array.isArray(clubs) ? clubs.filter(club => club.role === 'teacher') : [];
    const memberClubs = Array.isArray(clubs) ? clubs.filter(club => club.role === 'member') : [];

    return (
        <Container className="py-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h1 className="h2 mb-1">Миний клубууд</h1>
                            <p className="text-muted">
                                Таны холбогдсон бүх математикийн клубууд
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-primary"
                                onClick={() => setShowJoinModal(true)}
                            >
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Клубт элсэх
                            </Button>
                            <Button
                                as={Link}
                                to="/clubs/create"
                                variant="primary"
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Клуб үүсгэх
                            </Button>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Teacher Clubs */}
            {teacherClubs.length > 0 && (
                <div className="mb-5">
                    <h3 className="h5 mb-3">
                        <i className="bi bi-briefcase text-primary me-2"></i>
                        Миний удирдаж буй клубууд ({teacherClubs.length})
                    </h3>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {teacherClubs.map(club => (
                            <Col key={club.id}>
                                <Card className="h-100 shadow-sm hover-shadow transition">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Badge bg="success">Багш</Badge>
                                            <Badge bg="secondary" className="rounded-pill">
                                                {club.member_count} гишүүн
                                            </Badge>
                                        </div>
                                        <Card.Title className="h5 mb-2">
                                            {club.name}
                                        </Card.Title>
                                        <Card.Text className="text-muted small mb-3">
                                            {club.description || 'Тайлбаргүй'}
                                        </Card.Text>
                                        <div className="d-flex gap-2">
                                            <Button
                                                as={Link}
                                                to={`/clubs/${club.id}`}
                                                variant="primary"
                                                size="sm"
                                                className="flex-grow-1"
                                            >
                                                Харах
                                            </Button>
                                            {club.reg_code && (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(club.reg_code);
                                                        alert('Бүртгэлийн код хуулагдлаа!');
                                                    }}
                                                    title="Бүртгэлийн код хуулах"
                                                >
                                                    <i className="bi bi-clipboard"></i>
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Member Clubs */}
            {memberClubs.length > 0 && (
                <div className="mb-4">
                    <h3 className="h5 mb-3">
                        <i className="bi bi-person-badge text-info me-2"></i>
                        Гишүүнээр элссэн клубууд ({memberClubs.length})
                    </h3>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {memberClubs.map(club => (
                            <Col key={club.id}>
                                <Card className="h-100 shadow-sm hover-shadow transition">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <Badge bg="info">Гишүүн</Badge>
                                            <Badge bg="secondary" className="rounded-pill">
                                                {club.member_count} гишүүн
                                            </Badge>
                                        </div>
                                        <Card.Title className="h5 mb-2">
                                            {club.name}
                                        </Card.Title>
                                        <Card.Text className="text-muted small mb-3">
                                            {club.description || 'Тайлбаргүй'}
                                        </Card.Text>
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                <i className="bi bi-person-circle me-1"></i>
                                                Багш: {club.teacher_name}
                                            </small>
                                        </div>
                                        <Button
                                            as={Link}
                                            to={`/clubs/${club.id}`}
                                            variant="primary"
                                            size="sm"
                                            className="w-100"
                                        >
                                            Харах
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* Empty State */}
            {clubs.length === 0 && (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="bi bi-people display-1 text-muted mb-3"></i>
                        <h3 className="h5 mb-3">Та одоогоор ямар ч клубт элсээгүй байна</h3>
                        <p className="text-muted mb-4">
                            Шинэ клуб үүсгэж эсвэл бүртгэлийн кодоор клубт элсээрэй
                        </p>
                        <div className="d-flex gap-2 justify-content-center">
                            <Button
                                variant="outline-primary"
                                onClick={() => setShowJoinModal(true)}
                            >
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Клубт элсэх
                            </Button>
                            <Button
                                as={Link}
                                to="/clubs/create"
                                variant="primary"
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Клуб үүсгэх
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Join Club Modal */}
            <JoinClubModal
                show={showJoinModal}
                onHide={() => setShowJoinModal(false)}
                onSuccess={handleJoinSuccess}
            />
        </Container>
    );
};

export default Clubs;