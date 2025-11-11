// src/pages/ClubDetail.jsx
// ✅ ШИНЭЧИЛСЭН: "Гарах товч"-г зөвхөн гишүүдэд харуулдаг болгов.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import {
    ArrowLeft,
    LogOut,
    Key,
    Clipboard,
    Users,
    UserCircle,
    Calendar
} from 'lucide-react';

const ClubDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [club, setClub] = useState(null);
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
            console.log("Club Data:", data);
            setClub(data);
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
            navigate('/clubs/mine');
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
                <Button variant="primary" onClick={() => navigate('/clubs/mine')}>
                    Буцах
                </Button>
            </Container>
        );
    }

    // ✅ ЗАСВАР: Энэ хувьсагчийг хассан, оронд нь club.role-г шууд ашиглана
    // const isTeacher = club.role === 'teacher';

    const members = club.members || [];
    const admins = club.admins || [];
    const adminIds = new Set(admins.map(admin => admin.id));

    return (
        <Container className="py-4">
            {/* Header */}
            <div className="mb-4">
                <Button
                    variant="link"
                    // ✅ ЗАСВАР: /clubs/mine (Миний клубууд) эсвэл /clubs (Бүх) рүү буцах
                    onClick={() => navigate(club.role ? '/clubs/mine' : '/clubs')}
                    className="p-0 text-decoration-none mb-3"
                >
                    <ArrowLeft size={16} className="me-2" />
                    Буцах
                </Button>

                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <Row className="align-items-center">
                            <Col md={8}>
                                <div className="mb-2">
                                    {/* ✅ ЗАСВАР: Зөвхөн гишүүн/багш бол харуулна */}
                                    {club.role === 'teacher' && (
                                        <Badge bg='success' className="me-2">
                                            Багш
                                        </Badge>
                                    )}
                                    {club.role === 'member' && (
                                        <Badge bg='info' className="me-2">
                                            Гишүүн
                                        </Badge>
                                    )}

                                    <Badge bg="secondary" className="rounded-pill">
                                        <Users size={12} className="me-1" />
                                        {members.length} гишүүн
                                    </Badge>
                                </div>
                                <h1 className="h3 mb-2">{club.name}</h1>

                                <p className="text-muted mb-0">
                                    {club.description || 'Тайлбаргүй'}
                                </p>

                                {/* ✅ ЗАСВАР: Зөвхөн гишүүн бол багшийн нэрийг харуулна */}
                                {club.role === 'member' && (
                                    <p className="text-muted small mt-2 mb-0">
                                        <UserCircle size={14} className="me-1" />
                                        Багш: {club.creator_name}
                                    </p>
                                )}
                            </Col>

                            {/* ✅ ЗАСВАР: Товчны логикийг бүрэн өөрчилсөн */}
                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                {club.role === 'teacher' && (
                                    <Button
                                        variant="outline-primary"
                                        onClick={() => setShowRegCodeModal(true)}
                                    >
                                        <Key size={16} className="me-2" />
                                        Бүртгэлийн код
                                    </Button>
                                )}

                                {club.role === 'member' && (
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => setShowLeaveModal(true)}
                                    >
                                        <LogOut size={16} className="me-2" />
                                        Клубээс гарах
                                    </Button>
                                )}

                                {/* club.role === null бол энд юу ч харагдахгүй */}
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
                                    {members.map(member => {
                                        const isMemberTeacher = adminIds.has(member.id);

                                        return (
                                            <ListGroup.Item
                                                key={member.id}
                                                className="d-flex justify-content-between align-items-center"
                                                as={Link}
                                                to={`/profile/${member.username}`}
                                                action
                                            >
                                                <div>
                                                    <strong>
                                                        {member.first_name || ''} {member.last_name || ''}
                                                    </strong>
                                                    <span className="text-muted ms-2">
                                                        @{member.username}
                                                    </span>
                                                </div>
                                                <div>
                                                    <Badge
                                                        bg={isMemberTeacher ? 'success' : 'secondary'}
                                                    >
                                                        {isMemberTeacher ? 'Багш' : 'Гишүүн'}
                                                    </Badge>
                                                </div>
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            ) : (
                                <div className="text-center py-4 text-muted">
                                    <Users size={40} className="mb-3" />
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
                                <Calendar size={40} className="mb-3" />
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
                        <LogOut size={16} className="me-2" />
                        Гарах
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Registration Code Modal */}
            <Modal show={showRegCodeModal} onHide={() => setShowRegCodeModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <Key size={20} className="text-primary me-2" />
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
                        <Clipboard size={16} className="me-2" />
                        Код хуулах
                    </Button>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ClubDetail;