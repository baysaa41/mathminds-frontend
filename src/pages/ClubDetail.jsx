// src/pages/ClubDetail.jsx
// Клубын дэлгэрэнгүй хуудас (Django Backend)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import { getClubDetail, leaveClub, formatErrorMessage } from '../services/clubsService';

const ClubDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showRegCodeModal, setShowRegCodeModal] = useState(false);

    useEffect(() => {
        fetchClubDetails();
    }, [id]);

    const fetchClubDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClubDetail(id);
            setClub(data);
            setMembers(data.members || []);
        } catch (err) {
            console.error('Error fetching club details:', err);
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveClub = async () => {
        try {
            await leaveClub(id);
            navigate('/clubs');
        } catch (err) {
            console.error('Error leaving club:', err);
            alert(formatErrorMessage(err));
        }
    };

    const handleCopyRegCode = () => {
        if (club?.reg_code) {
            navigator.clipboard.writeText(club.reg_code);
            alert('Бүртгэлийн код хуулагдлаа!');
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Уншиж байна...</p>
            </Container>
        );
    }

    if (error || !club) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error || 'Клуб олдсонгүй'}
                </Alert>
                <Button variant="primary" onClick={() => navigate('/clubs')}>
                    Буцах
                </Button>
            </Container>
        );
    }

    const isTeacher = club.is_teacher;

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="mb-4">
                <Button
                    variant="link"
                    onClick={() => navigate('/clubs')}
                    className="p-0 text-decoration-none mb-3"
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Клубууд руу буцах
                </Button>

                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="mb-2">
                                    <Badge bg={isTeacher ? 'success' : 'info'} className="me-2">
                                        {isTeacher ? 'Багш' : 'Гишүүн'}
                                    </Badge>
                                    <Badge bg="secondary" className="rounded-pill">
                                        {members.length} гишүүн
                                    </Badge>
                                </div>
                                <h1 className="h3 mb-2">{club.name}</h1>
                                {club.class_field && (
                                    <p className="text-muted small mb-2">
                                        Анги: {club.class_field}
                                    </p>
                                )}
                                <p className="text-muted mb-0">
                                    {club.description || 'Тайлбаргүй'}
                                </p>
                                {!isTeacher && (
                                    <p className="text-muted small mt-2 mb-0">
                                        <i className="bi bi-person-circle me-1"></i>
                                        Багш: {club.teacher_name}
                                    </p>
                                )}
                            </Col>
                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                {isTeacher ? (
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => setShowRegCodeModal(true)}
                                    >
                                        <i className="bi bi-key me-2"></i>
                                        Бүртгэлийн код
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => setShowLeaveModal(true)}
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Клубээс гарах
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultActiveKey="members" className="mb-4">
                <Tab eventKey="members" title={`Гишүүд (${members.length})`}>
                    <Card>
                        <Card.Body>
                            {members.length > 0 ? (
                                <ListGroup variant="flush">
                                    {members.map(member => (
                                        <ListGroup.Item
                                            key={member.user_id}
                                            className="d-flex justify-content-between align-items-center"
                                        >
                                            <div>
                                                <strong>{member.full_name}</strong>
                                                <span className="text-muted ms-2">@{member.username}</span>
                                            </div>
                                            <div>
                                                <Badge
                                                    bg={member.role === 'teacher' ? 'success' : 'secondary'}
                                                >
                                                    {member.role === 'teacher' ? 'Багш' : 'Гишүүн'}
                                                </Badge>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <i className="bi bi-people display-4 mb-3"></i>
                                    <p>Одоогоор гишүүн байхгүй байна</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="activity" title="Үйл ажиллагаа">
                    <Card>
                        <Card.Body>
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-calendar-event display-4 mb-3"></i>
                                <p>Үйл ажиллагаа удахгүй нэмэгдэнэ</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Leave Club Modal */}
            <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Клубээс гарах</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Та <strong>{club.name}</strong> клубээс гарахдаа итгэлтэй байна уу?
                    </Alert>
                    <p className="text-muted mb-0">
                        Дахин элсэхийн тулд бүртгэлийн код шаардагдана.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
                        Болих
                    </Button>
                    <Button variant="danger" onClick={handleLeaveClub}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Гарах
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Registration Code Modal */}
            <Modal show={showRegCodeModal} onHide={() => setShowRegCodeModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-key text-primary me-2"></i>
                        Бүртгэлийн код
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted mb-3">
                        Энэ кодыг сурагчиддаа өгч клубт элсүүлнэ үү
                    </p>
                    <div className="bg-light p-3 rounded text-center mb-3">
                        <h3 className="h2 font-monospace text-primary mb-0">
                            {club.reg_code}
                        </h3>
                    </div>
                    <Button
                        variant="outline-primary"
                        className="w-100"
                        onClick={handleCopyRegCode}
                    >
                        <i className="bi bi-clipboard me-2"></i>
                        Код хуулах
                    </Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ClubDetail;