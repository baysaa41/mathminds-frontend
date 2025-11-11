// src/pages/ClubsList.jsx
// ✅ ШИНЭЧИЛСЭН: /clubs замд ажиллана. clubsService.getClubs-г ашиглана.

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { usePrefill } from '../context/PrefillContext';

// ✅ Service
import clubsService, { formatErrorMessage } from '../services/clubsService'; //

// ✅ Common Components
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import useToast from '../hooks/useToast';

import ClubsMine from './ClubsMine.jsx';

// ✅ React Bootstrap & Icons
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { Users, Send, Eye, ShieldCheck, Award, User, PlusCircle } from 'lucide-react';

export default function ClubsList() {
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();
    const { setPrefillData } = usePrefill();
    const { toast, showToast, hideToast } = useToast();

    // ✅ State
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentQuery, setCurrentQuery] = useState({ search: '' });
    const [pagination, setPagination] = useState({ next: null, count: 0 });

    // ✅ Data Fetching
    const fetchAllClubs = async (params = {}, reset = false) => {
        try {
            setLoading(true);
            setError(null);
            const data = await clubsService.getClubs(params); //

            if (data?.results && Array.isArray(data.results)) {
                setClubs(reset ? data.results : [...clubs, ...data.results]);
                setPagination({ next: data.next, count: data.count });
            } else if (Array.isArray(data)) {
                setClubs(data); // Paginationгүй тохиолдолд
                setPagination({ next: null, count: data.length });
            } else {
                setClubs([]);
            }
        } catch (err) {
            setError(formatErrorMessage(err)); //
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageTitle('Бүх клубууд');
        fetchAllClubs(currentQuery, true); // (true = reset)
        return () => setPageTitle('Нүүр');
    }, []);

    const handleSearch = useCallback((query) => {
        const searchQuery = query.search || '';
        const newQuery = { search: searchQuery };
        setCurrentQuery(newQuery);
        fetchAllClubs(newQuery, true); // (true = reset)
    }, []);

    const handleCreatePost = (e, club) => {
        e.stopPropagation();
        const prefillData = {
            type: 'club',
            item: { id: club.id, title: club.name || `Клуб #${club.id}` }
        };
        setPrefillData(prefillData);
        navigate('/');
    };

    if (loading && clubs.length === 0) {
        return <LoadingState message="Клубуудыг ачааллаж байна..." fullPage />;
    }

    if (error && clubs.length === 0) {
        return <ErrorState message={error} onRetry={() => fetchAllClubs(currentQuery, true)} fullPage />;
    }

    return (
        <Container className="py-4">
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                {/* ... (Toast) ... */}
            </ToastContainer>

            <ClubsMine clubs={clubs} />

            <PageHeader
                title="Бүх клубууд"
                subtitle={`Нийт олдсон: ${pagination.count || clubs.length} клуб`}
                action={
                    <div className="d-flex gap-2 flex-wrap">
                        <Button
                            as={Link}
                            to="/clubs/mine" //
                            variant="outline-primary"
                        >
                            <Users size={16} className="me-2" />
                            Миний клубууд
                        </Button>
                        <Button
                            as={Link}
                            to="/clubs/create" //
                            variant="primary"
                        >
                            <PlusCircle size={16} className="me-2" />
                            Клуб үүсгэх
                        </Button>
                    </div>
                }
            />

            <SearchBar
                onSearch={handleSearch}
                placeholder="Клубын нэр, тайлбараар хайх..."
                loading={loading}
                filters={[]}
            />

            {/* Empty State */}
            {!loading && clubs.length === 0 && (
                <EmptyState
                    icon={Users}
                    title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Клуб олдсонгүй'}
                    message={currentQuery.search ? 'Хайлтын утганд тохирох клуб байхгүй байна.' : 'Одоогоор бүртгэлтэй клуб байхгүй байна.'}
                />
            )}

            {/* Club List */}
            {clubs.length > 0 && (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {clubs.map((club) => (
                        <Col key={club.id}>
                            <PublicClubCard club={club} onPost={handleCreatePost} />
                        </Col>
                    ))}
                </Row>
            )}

            {/* (Infinite scroll-г энд нэмж болно) */}
        </Container>
    );
}

// ----------------------------------------------
// ✅ PublicClubCard (Нийтийн клубын карт)
// ----------------------------------------------
function PublicClubCard({ club, onPost }) {
    const navigate = useNavigate();

    const handleCardClick = () => {
        // ✅ ЗАСВАР: Үнэмлэхүй зам ашиглах
        navigate(`/clubs/${club.id}`); //
    };

    return (
        <Card
            className="h-100 shadow-sm hover-shadow transition"
            style={{ cursor: 'pointer' }}
            onClick={handleCardClick}
        >
            <Card.Body className="d-flex flex-column">
                <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                    {club.is_official && (
                        <Badge bg="primary"><ShieldCheck size={12} className="me-1" />Албан ёсны</Badge>
                    )}
                    {club.is_promoted && !club.is_official && (
                        <Badge bg="warning" text="dark"><Award size={12} className="me-1" />Онцлох</Badge>
                    )}
                    <Badge bg="secondary" pill className="ms-auto"><Users size={12} className="me-1" />{club.member_count || 0}</Badge>
                </Stack>
                <Card.Title className="h5 mb-2">{club.name}</Card.Title>
                <Card.Text className="text-muted small mb-3 flex-grow-1">{club.description || 'Тайлбаргүй'}</Card.Text>
                <div className="text-muted small mb-3"><User size={14} className="me-1" />{club.creator_name}</div>

                <Stack direction="horizontal" gap={2}>
                    <Button
                        as={Link}
                        to={`/clubs/${club.id}`} //
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
                        onClick={(e) => onPost(e, club)}
                        title="Постлох"
                    >
                        <Send size={14} />
                    </Button>
                </Stack>
            </Card.Body>
        </Card>
    );
}