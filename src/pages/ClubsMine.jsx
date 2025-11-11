// src/pages/Clubs.jsx
// ✅ ШИНЭЧИЛСЭН: "Клуб үүсгэх" товчийг site_role-оор хязгаарлав.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // (Аль хэдийн импортлогдсон)
import { usePrefill } from '../context/PrefillContext';

// ✅ Service
import clubsService, { formatErrorMessage } from '../services/clubsService';

// ✅ Common Components
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import useToast from '../hooks/useToast';

// ✅ React Bootstrap & Icons
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { Users, PlusCircle, LogIn, Send, Copy, Eye, List } from 'lucide-react';
import JoinClubModal from '../components/JoinClubModal';

const ClubsMine = () => {
    const { user } = useAuth(); // (Аль хэдийн дуудагдсан)
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const { setPrefillData } = usePrefill();
    const { toast, showToast, hideToast } = useToast();

    // ... (State-үүд хэвээрээ) ...
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ... (fetchMyClubs, useEffect, handleJoinSuccess, handleCreatePost, handleCopyCode хэвээрээ) ...
    const fetchMyClubs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await clubsService.getMyClubs();

            if (data?.results && Array.isArray(data.results)) {
                setClubs(data.results);
            } else if (Array.isArray(data)) {
                setClubs(data);
            } else {
                setClubs([]);
            }
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageTitle('Миний клубууд');
        fetchMyClubs();
        return () => setPageTitle('Нүүр');
    }, [setPageTitle]);

    const handleJoinSuccess = (joinedClub) => {
        fetchMyClubs();
        setShowJoinModal(false);
        showToast(`"${joinedClub.name}" клубт амжилттай элслээ!`, 'success');
    };

    const handleCreatePost = (e, club) => { /* ... */ };
    const handleCopyCode = (club) => { /* ... */ };

    if (loading && clubs.length === 0) {
        return <LoadingState message="Миний клубуудыг ачааллаж байна..." fullPage />;
    }

    if (error && clubs.length === 0) {
        return <ErrorState message={error} onRetry={fetchMyClubs} fullPage />;
    }

    const teacherClubs = Array.isArray(clubs) ? clubs.filter(club => club.role === 'teacher') : [];
    const memberClubs = Array.isArray(clubs) ? clubs.filter(club => club.role === 'member') : [];

    return (
        <Container className="py-4">
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {/* ... (Toast) ... */}
            </ToastContainer>

            <PageHeader
                title="Миний клубууд"
                subtitle={`Та ${clubs.length} клубт холбогдсон байна`}
                action={
                    <div className="d-flex gap-2 flex-wrap">
                        <Button
                            as={Link}
                            to="/clubs"
                            variant="outline-secondary"
                        >
                            <List size={16} className="me-2" />
                            Бүх клубууд
                        </Button>
                        <Button
                            variant="outline-primary"
                            onClick={() => setShowJoinModal(true)}
                        >
                            <LogIn size={16} className="me-2" />
                            Клубт элсэх
                        </Button>

                        {/* ✅ НӨХЦӨЛ НЭМСЭН */}
                        {user && user.site_role === 'TEACHER' && (
                            <Button
                                as={Link}
                                to="/clubs/create"
                                variant="primary"
                            >
                                <PlusCircle size={16} className="me-2" />
                                Клуб үүсгэх
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Empty State */}
            {!loading && clubs.length === 0 && (
                <EmptyState
                    icon={Users}
                    title="Та одоогоор ямар ч клубт элсээгүй байна"
                    message="Шинэ клуб үүсгэж эсвэл бүртгэлийн кодоор клубт элсээрэй"
                    actionLabel="Клубт элсэх"
                    onAction={() => setShowJoinModal(true)}
                />
            )}

            {/* ... (Teacher Clubs, Member Clubs, ClubCard хэвээрээ) ... */}
            {/* ... */}

            <JoinClubModal
                show={showJoinModal}
                onHide={() => setShowJoinModal(false)}
                onSuccess={handleJoinSuccess}
            />
        </Container>
    );
};

// ... (ClubCard компонент өөрчлөлтгүй) ...
function ClubCard({ club, role, onPost, onCopyCode }) {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/clubs/${club.id}`);
    };

    const handleButtonClick = (e, action) => {
        e.stopPropagation();
        action(e, club);
    };

    const handleCopyClick = (e) => {
        e.stopPropagation();
        onCopyCode(club);
    };

    return (
        <Card
            className="h-100 shadow-sm hover-shadow transition"
            style={{ cursor: 'pointer' }}
            onClick={handleCardClick}
        >
            <Card.Body className="d-flex flex-column">
                <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                    {role === 'teacher' ? (
                        <Badge bg="success">Багш</Badge>
                    ) : (
                        <Badge bg="info">Гишүүн</Badge>
                    )}
                    <Badge bg="secondary" pill className="ms-auto"><Users size={12} className="me-1" />{club.member_count || 0}</Badge>
                </Stack>

                <Card.Title className="h5 mb-2">{club.name}</Card.Title>
                <Card.Text className="text-muted small mb-3 flex-grow-1">
                    {club.description || 'Тайлбаргүй'}
                </Card.Text>

                {role === 'member' && (
                    <div className="text-muted small mb-3">
                        <i className="bi bi-person-circle me-1"></i>
                        Багш: {club.creator_name}
                    </div>
                )}

                <Stack direction="horizontal" gap={2}>
                    <Button
                        as={Link}
                        to={`/clubs/${club.id}`}
                        variant="primary"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-grow-1"
                    >
                        <Eye size={14} className="me-1" />
                        Харах
                    </Button>

                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => handleButtonClick(e, onPost)}
                        title="Постлох"
                    >
                        <Send size={14} />
                    </Button>

                    {role === 'teacher' && club.reg_code && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleCopyClick}
                            title="Бүртгэлийн код хуулах"
                        >
                            <Copy size={14} />
                        </Button>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    );
}

export default ClubsMine;