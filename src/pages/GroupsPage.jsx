// src/pages/GroupsPage.jsx
// (!!! ШИНЭ ФАЙЛ)

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { useOutletContext } from 'react-router-dom';

const GroupsPage = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    // Layout-н гарчгийг өөрчлөхийн тулд
    const { setPageTitle } = useOutletContext();

    useEffect(() => {
        setPageTitle('Клубууд'); // Layout-н гарчгийг "Клубууд" болгох
        fetchGroups();
    }, [setPageTitle]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            // (!!!) Бидний үүсгэсэн /api/integral/groups/ API-г дуудах
            const response = await apiClient.get('/api/integral/groups/');
            setGroups(response.data.results || []);
        } catch (error) {
            console.error("Бүлгүүдийг дуудахад алдаа гарлаа:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container fluid="lg" className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h4 mb-0">Бүртгэлтэй Клубууд</h2>
                {/* /group/create (дараагийн файл) руу үсрэх товч */}
                <Button variant="primary" onClick={() => navigate('/group/create')}>
                    <i className="bi bi-plus-lg me-1"></i> Шинэ Клуб
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" />
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-3">
                    {groups.length === 0 ? (
                        <Col>
                            <p className="text-muted">Одоогоор бүртгэлтэй клуб байхгүй байна.</p>
                        </Col>
                    ) : (
                        groups.map(group => (
                            <Col key={group.id}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Body>
                                        <Card.Title className="h5">
                                            {/* /group/:id (дэлгэрэнгүй) руу үсрэх холбоос */}
                                            <Link to={`/group/${group.id}`} className="text-decoration-none stretched-link">
                                                {group.name}
                                            </Link>
                                        </Card.Title>
                                        <Card.Text className="text-muted small">
                                            {group.description?.substring(0, 100) || "Тодорхойлолтгүй"}
                                            {group.description?.length > 100 && "..."}
                                        </Card.Text>
                                    </Card.Body>
                                    <Card.Footer className="bg-white border-top-0 d-flex justify-content-between small text-muted">
                                        <span>
                                            <i className="bi bi-person-workspace me-1"></i> {group.teacher_count} Багш
                                        </span>
                                        <span>
                                            <i className="bi bi-people-fill me-1"></i> {group.student_count} Гишүүн
                                        </span>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        ))
                    )}
                </Row>
            )}
        </Container>
    );
};

export default GroupsPage;