// src/pages/Clubs.jsx
// ✅ ШИНЭЧИЛСЭН: "Клуб үүсгэх" товчийг site_role-оор хязгаарлав.

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
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
import { Users, PlusCircle, LogIn, Send, Copy, Eye, List, ShieldCheck, Award, User, Unlock, Lock, BookOpen } from 'lucide-react';
import JoinClubModal from '../components/JoinClubModal';

const ClubsUser = () => {
  const { username } = useParams(); // Get username from URL params
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
      const data = await clubsService.getMyClubs(username);

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
    // Өөрийнхөө харах үед "Миний клубууд", бусдынхыг харахад "{username}-н клубууд"
    const isOwnClubs = !username || username === user?.username;
    const title = isOwnClubs ? 'Миний клубууд' : `${username}-н клубууд`;
    setPageTitle(title);
    fetchMyClubs();
    return () => setPageTitle('Нүүр');
  }, [setPageTitle, username, user]);

  const handleJoinSuccess = (joinedClub) => {
    fetchMyClubs();
    setShowJoinModal(false);
    showToast(`"${joinedClub.name}" клубт амжилттай элслээ!`, 'success');
  };

  const handleCreatePost = (e, club) => {
    setPrefillData({ type: 'club', item: { id: club.id, name: club.name } });
    navigate('/');
  };

  const handleCopyCode = (club) => {
    if (club.reg_code) {
      navigator.clipboard.writeText(club.reg_code);
      showToast(`Бүртгэлийн код хуулагдлаа: ${club.reg_code}`, 'success');
    }
  };

  if (loading && clubs.length === 0) {
    const isOwnClubs = !username || username === user?.username;
    const loadingMessage = isOwnClubs
      ? 'Миний клубуудыг ачааллаж байна...'
      : `${username}-н клубуудыг ачааллаж байна...`;
    return <LoadingState message={loadingMessage} fullPage />;
  }

  if (error && clubs.length === 0) {
    return <ErrorState message={error} onRetry={fetchMyClubs} fullPage />;
  }

  const teacherClubs = Array.isArray(clubs) ? clubs.filter((club) => club.role === 'teacher') : [];
  const memberClubs = Array.isArray(clubs) ? clubs.filter((club) => club.role === 'member') : [];

  // Өөрийнхөө харах үед эсэхийг шалгах
  const isOwnClubs = !username || username === user?.username;

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

      <PageHeader
        title={isOwnClubs ? 'Миний клубууд' : `${username}-н клубууд`}
        subtitle={
          isOwnClubs
            ? `Та ${clubs.length} клубт холбогдсон байна`
            : `${username} ${clubs.length} клубт холбогдсон байна`
        }
        action={
          // Зөвхөн RightSidebar харагдахгүй үед (< xl) товчнуудыг харуулах
          <div className="d-flex gap-2 flex-wrap d-xl-none">
            <Button as={Link} to="/clubs" variant="outline-secondary">
              <List size={16} className="me-2" />
              Бүх клубууд
            </Button>
            <Button variant="outline-primary" onClick={() => setShowJoinModal(true)}>
              <LogIn size={16} className="me-2" />
              Клубт элсэх
            </Button>

            {/* Зөвхөн FREE-ээс өөр tier-үүд клуб үүсгэж чадна */}
            {user && user.membership_tier !== 'FREE' && (
              <Button as={Link} to="/clubs/create" variant="primary">
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
          title={
            isOwnClubs
              ? 'Та одоогоор ямар ч клубт элсээгүй байна'
              : `${username} одоогоор ямар ч клубт элсээгүй байна`
          }
          message={
            isOwnClubs
              ? 'Шинэ клуб үүсгэж эсвэл бүртгэлийн кодоор клубт элсээрэй'
              : `${username} ямар ч клубт элсээгүй байна`
          }
          actionLabel={isOwnClubs ? 'Клубт элсэх' : null}
          onAction={isOwnClubs ? () => setShowJoinModal(true) : null}
        />
      )}

      {/* Багшийн клубууд */}
      {teacherClubs.length > 0 && (
        <>
          <h5 className="mb-3 text-success">
            <Badge bg="success" className="me-2">
              Багш
            </Badge>
            Миний удирдаж буй клубууд ({teacherClubs.length})
          </h5>
          <Row xs={1} md={2} lg={3} className="g-4 mb-4">
            {teacherClubs.map((club) => (
              <Col key={club.id}>
                <ClubCard
                  club={club}
                  role="teacher"
                  onPost={handleCreatePost}
                  onCopyCode={handleCopyCode}
                />
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Гишүүний клубууд */}
      {memberClubs.length > 0 && (
        <>
          <h5 className="mb-3 text-primary">
            <Badge bg="primary" className="me-2">
              Гишүүн
            </Badge>
            Миний элссэн клубууд ({memberClubs.length})
          </h5>
          <Row xs={1} md={2} lg={3} className="g-4">
            {memberClubs.map((club) => (
              <Col key={club.id}>
                <ClubCard
                  club={club}
                  role="member"
                  onPost={handleCreatePost}
                  onCopyCode={handleCopyCode}
                />
              </Col>
            ))}
          </Row>
        </>
      )}

      <JoinClubModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </Container>
  );
};

// ClubCard компонент - Бүх клубуудтай адилхан формат
function ClubCard({ club, role, onPost, onCopyCode }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/clubs/${club.id}`);
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopyCode(club);
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

  // Клубын стайлыг тодорхойлох
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
    // Үүрэгээр өнгөлөх
    if (role === 'teacher') {
      return {
        borderLeft: '4px solid #198754', // success green
        backgroundColor: '#f8fdf9',
        variant: 'success',
        outlineVariant: 'outline-success',
      };
    }
    if (role === 'member') {
      return {
        borderLeft: '4px solid #0d6efd', // primary blue
        backgroundColor: '#f8f9ff',
        variant: 'primary',
        outlineVariant: 'outline-primary',
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
          {/* Official/Promoted badges */}
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

          {/* Үүрэг badge (official биш үед) */}
          {!club.is_official && !club.is_promoted && (
            role === 'teacher' ? (
              <Badge bg="success">Багш</Badge>
            ) : role === 'member' ? (
              <Badge bg="primary">Гишүүн</Badge>
            ) : null
          )}

          {/* Клубын төрөл */}
          <Badge bg={typeInfo.variant}>
            {typeInfo.Icon && <typeInfo.Icon size={12} className="me-1" />}
            {typeInfo.label}
          </Badge>

          {/* Гишүүдийн тоо */}
          <Badge bg="secondary" pill className="ms-auto">
            <Users size={12} className="me-1" />
            {club.member_count || 0}
          </Badge>
        </Stack>

        <Card.Title className="h5 mb-2">{club.name}</Card.Title>
        <Card.Text className="text-muted small mb-3 flex-grow-1">
          {club.description || 'Тайлбаргүй'}
        </Card.Text>

        {/* Үүсгэгчийн нэр */}
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

export default ClubsUser;
