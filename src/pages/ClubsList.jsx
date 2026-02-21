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
import SearchBar from '../components/common/SearchBar';
import useToast from '../hooks/useToast';

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
import { Users, Send, Eye, ShieldCheck, Award, User, Unlock, Lock, BookOpen } from 'lucide-react';

export default function ClubsList() {
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const { setPrefillData } = usePrefill();
  const { toast, hideToast } = useToast();

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
      const data = await clubsService.getClubs(params);

      let clubsList = [];
      if (data?.results && Array.isArray(data.results)) {
        clubsList = data.results;
        setPagination({ next: data.next, count: data.count });
      } else if (Array.isArray(data)) {
        clubsList = data;
        setPagination({ next: null, count: data.length });
      }

      // Эрэмбэлэх: official -> promoted -> бусад
      const sortedClubs = clubsList.sort((a, b) => {
        if (a.is_official && !b.is_official) return -1;
        if (!a.is_official && b.is_official) return 1;
        if (a.is_promoted && !b.is_promoted) return -1;
        if (!a.is_promoted && b.is_promoted) return 1;
        return 0;
      });

      setClubs(reset ? sortedClubs : [...clubs, ...sortedClubs]);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle('Бүх клубууд');
    fetchAllClubs(currentQuery, true); // (true = reset)
    return () => setPageTitle('Нүүр');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((query) => {
    const searchQuery = query.search || '';
    const clubType = query.club_type || '';
    const newQuery = {
      search: searchQuery,
      ...(clubType && { club_type: clubType })
    };
    setCurrentQuery(newQuery);
    fetchAllClubs(newQuery, true); // (true = reset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePost = (e, club) => {
    e.stopPropagation();
    const prefillData = {
      type: 'club',
      item: { id: club.id, title: club.name || `Клуб #${club.id}` },
    };
    setPrefillData(prefillData);
    navigate('/');
  };

  if (loading && clubs.length === 0) {
    return <LoadingState message="Клубуудыг ачааллаж байна..." fullPage />;
  }

  if (error && clubs.length === 0) {
    return (
      <ErrorState message={error} onRetry={() => fetchAllClubs(currentQuery, true)} fullPage />
    );
  }

  return (
    <Container className="py-4">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === 'success' ? 'Амжилттай' : 'Алдаа'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'success' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Page Header */}
      <div className="mb-4">
        <h2 className="mb-1">Бүх клубууд</h2>
        <p className="text-muted mb-0">Нийт олдсон: {pagination.count || clubs.length} клуб</p>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Клубын нэр, тайлбар, багшийн нэрээр хайх..."
        loading={loading}
        filters={[
          {
            name: 'club_type',
            label: 'Төрөл',
            options: [
              { value: '', label: 'Бүгд' },
              { value: 'PUBLIC', label: 'Нээлттэй' },
              { value: 'CLOSED', label: 'Хаалттай' },
              { value: 'STUDY', label: 'Суралцах' }
            ]
          }
        ]}
      />

      {/* Empty State */}
      {!loading && clubs.length === 0 && (
        <EmptyState
          icon={Users}
          title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Клуб олдсонгүй'}
          message={
            currentQuery.search
              ? 'Хайлтын утганд тохирох клуб байхгүй байна.'
              : 'Одоогоор бүртгэлтэй клуб байхгүй байна.'
          }
        />
      )}

      {/* Club List - Бүлгээр хуваасан */}
      {clubs.length > 0 &&
        (() => {
          const officialClubs = clubs.filter((c) => c.is_official);
          const promotedClubs = clubs.filter((c) => !c.is_official && c.is_promoted);
          const regularClubs = clubs.filter((c) => !c.is_official && !c.is_promoted);

          return (
            <>
              {/* Mathminds клубууд */}
              {officialClubs.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-3 text-success">
                    <Badge bg="success" className="me-2">
                      <ShieldCheck size={14} />
                    </Badge>
                    Mathminds клубууд ({officialClubs.length})
                  </h5>
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {officialClubs.map((club) => (
                      <Col key={club.id}>
                        <PublicClubCard club={club} onPost={handleCreatePost} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Онцлох клубууд */}
              {promotedClubs.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-3 text-warning">
                    <Badge bg="warning" text="dark" className="me-2">
                      <Award size={14} />
                    </Badge>
                    Онцлох клубууд ({promotedClubs.length})
                  </h5>
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {promotedClubs.map((club) => (
                      <Col key={club.id}>
                        <PublicClubCard club={club} onPost={handleCreatePost} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* Бусад клубууд */}
              {regularClubs.length > 0 && (
                <div className="mb-4">
                  {(officialClubs.length > 0 || promotedClubs.length > 0) && (
                    <h5 className="mb-3 text-secondary">
                      <Badge bg="secondary" className="me-2">
                        <Users size={14} />
                      </Badge>
                      Бусад клубууд ({regularClubs.length})
                    </h5>
                  )}
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {regularClubs.map((club) => (
                      <Col key={club.id}>
                        <PublicClubCard club={club} onPost={handleCreatePost} />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </>
          );
        })()}

      {/* (Infinite scroll-г энд нэмж болно) */}
    </Container>
  );
}

// ----------------------------------------------
// ✅ PublicClubCard (Нийтийн клубын карт) - Төрлөөр өнгөлөгдсөн
// ----------------------------------------------
function PublicClubCard({ club, onPost }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/clubs/${club.id}`);
  };

  // Клубын төрлийн мэдээллийг авах
  const getClubTypeInfo = () => {
    const typeMap = {
      PUBLIC: { label: 'Нээлттэй', variant: 'info', Icon: Unlock },
      CLOSED: { label: 'Хаалттай', variant: 'danger', Icon: Lock },
      STUDY: { label: 'Суралцах', variant: 'primary', Icon: BookOpen },
    };
    return typeMap[club.club_type] || typeMap.PUBLIC;
  };

  // Клубын төрлөөр өнгө тодорхойлох
  const getClubStyle = () => {
    if (club.is_official) {
      return {
        borderLeft: '4px solid #198754', // success green
        backgroundColor: '#f0fdf4',
        variant: 'success',
        outlineVariant: 'outline-success',
      };
    }
    if (club.is_promoted) {
      return {
        borderLeft: '4px solid #ffc107', // warning yellow
        backgroundColor: '#fffdf0',
        variant: 'warning',
        outlineVariant: 'outline-warning',
      };
    }
    return {
      borderLeft: '4px solid #6c757d', // secondary gray
      backgroundColor: '#f8f9fa',
      variant: 'secondary',
      outlineVariant: 'outline-secondary',
    };
  };

  const style = getClubStyle();
  const typeInfo = getClubTypeInfo();

  return (
    <Card
      className="h-100 shadow-sm hover-shadow transition"
      style={{
        cursor: 'pointer',
        borderLeft: style.borderLeft,
        backgroundColor: style.backgroundColor,
      }}
      onClick={handleCardClick}
    >
      <Card.Body className="d-flex flex-column">
        <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
          {club.is_official && (
            <Badge bg="success">
              <ShieldCheck size={12} className="me-1" />
              Mathminds
            </Badge>
          )}
          {club.is_promoted && !club.is_official && (
            <Badge bg="warning" text="dark">
              <Award size={12} className="me-1" />
              Онцлох
            </Badge>
          )}
          <Badge bg={typeInfo.variant}>
            {typeInfo.Icon && <typeInfo.Icon size={12} className="me-1" />}
            {typeInfo.label}
          </Badge>
          <Badge bg="secondary" pill className="ms-auto">
            <Users size={12} className="me-1" />
            {club.member_count || 0}
          </Badge>
        </Stack>
        <Card.Title className="h5 mb-2">{club.name}</Card.Title>
        <Card.Text className="text-muted small mb-3 flex-grow-1">
          {club.description || 'Тайлбаргүй'}
        </Card.Text>
        <div className="text-muted small mb-3">
          <User size={14} className="me-1" />
          {club.creator_name}
        </div>

        <Stack direction="horizontal" gap={2}>
          <Button
            as={Link}
            to={`/clubs/${club.id}`}
            variant={style.variant}
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="flex-grow-1"
          >
            <Eye size={14} className="me-1" />
            Харах
          </Button>
          <Button
            variant={style.outlineVariant}
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
