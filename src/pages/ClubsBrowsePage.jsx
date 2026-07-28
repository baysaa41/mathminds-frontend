// src/pages/ClubsBrowsePage.jsx
// Клубуудын жагсаалт — ContentBrowsePage-тэй адил fullscreen layout

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePaginatedFetch from '../hooks/usePagenatedFetch';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import JoinClubModal from '../components/JoinClubModal';

import AppHeader from '../components/AppHeader';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';

import {
  Users, PlusCircle, LogIn, ShieldCheck, Award,
  Lock, Unlock, BookOpen, User, Power,
} from 'lucide-react';
import { reactivateClub } from '../services/clubService';

// -------------------------------------------------------------------
const VIEW_TYPES = {
  all:  { label: 'Бүх клубууд',   icon: 'bi-grid' },
  mine: { label: 'Миний клубууд', icon: 'bi-person-check' },
};

const CLUB_TYPE_FILTERS = [
  { value: '',       label: 'Бүгд',       Icon: null },
  { value: 'PUBLIC', label: 'Нээлттэй',   Icon: Unlock },
  { value: 'CLOSED', label: 'Хаалттай',   Icon: Lock },
  { value: 'STUDY',  label: 'Суралцах',   Icon: BookOpen },
];

const CLUB_TYPE_INFO = {
  PUBLIC: { label: 'Нээлттэй', variant: 'info',    Icon: Unlock },
  CLOSED: { label: 'Хаалттай', variant: 'danger',  Icon: Lock },
  STUDY:  { label: 'Суралцах', variant: 'primary', Icon: BookOpen },
};

// -------------------------------------------------------------------
function ClubsBrowsePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainColRef = useRef(null);

  const [view, setView]                   = useState(searchParams.get('view') || 'all');
  const [clubTypeFilter, setClubTypeFilter] = useState(searchParams.get('type') || '');
  const [searchInput, setSearchInput]     = useState(searchParams.get('search') || '');
  const [activeFilter, setActiveFilter]   = useState('active'); // 'all' | 'active' | 'inactive'
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Dynamic endpoint based on view
  const endpoint = view === 'mine' ? '/api/clubs/my_clubs/' : '/api/clubs/';

  const {
    data: clubs,
    loading,
    loadingMore,
    hasMore,
    fetchData,
    loadMore,
  } = usePaginatedFetch(endpoint);

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore, mainColRef);

  const buildParams = useCallback(() => {
    const p = {};
    if (clubTypeFilter) p.club_type = clubTypeFilter;
    if (searchInput)    p.search    = searchInput;
    if (view === 'mine' && user?.username) p.username = user.username;
    if (view === 'mine' || activeFilter === 'inactive') {
      p.include_inactive = '1';
    }
    return p;
  }, [clubTypeFilter, searchInput, view, user?.username, activeFilter]);

  // Re-fetch when view or type filter changes
  useEffect(() => {
    setActiveFilter('active');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Re-fetch when any filter changes
  useEffect(() => {
    const params = buildParams();
    const urlParams = { view };
    if (clubTypeFilter) urlParams.type = clubTypeFilter;
    setSearchParams(urlParams, { replace: true });
    fetchData(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, clubTypeFilter, activeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(buildParams());
    setSearchParams(
      { view, ...(clubTypeFilter && { type: clubTypeFilter }), ...(searchInput && { search: searchInput }) },
      { replace: true }
    );
  };

  const handleJoinSuccess = () => {
    setShowJoinModal(false);
    fetchData(buildParams());
  };

  // Sort: official → promoted → бусад (Бүх клубууд view-д)
  const sortedClubs = (view === 'all'
    ? [...clubs].sort((a, b) => {
        if (a.is_official  && !b.is_official)  return -1;
        if (!a.is_official && b.is_official)   return  1;
        if (a.is_promoted  && !b.is_promoted)  return -1;
        if (!a.is_promoted && b.is_promoted)   return  1;
        return 0;
      })
    : clubs)
    .filter(c =>
      activeFilter === 'inactive' ? c.is_active === false : c.is_active !== false
    );

  const hasActiveFilters = clubTypeFilter || searchInput || activeFilter !== 'active';

  return (
    <div className="d-flex flex-column vh-100">

      <AppHeader />

      {/* Main */}
      <div className="flex-grow-1 overflow-hidden">
        <Row className="g-0 h-100">

          {/* Left Sidebar */}
          <Col lg={3} md={4} className="border-end bg-light h-100 overflow-auto d-none d-md-block">
            <div className="p-3">

              {/* Хайлт */}
              <Form onSubmit={handleSearch} className="mb-3">
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    placeholder="Клуб хайх..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button variant="outline-primary" type="submit">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Form>

              {/* View switcher */}
              <h6 className="text-uppercase text-muted small fw-bold mb-2">
                <i className="bi bi-collection me-1"></i>Харагдац
              </h6>
              <ListGroup variant="flush" className="mb-3">
                {Object.entries(VIEW_TYPES).map(([key, vt]) => (
                  <ListGroup.Item
                    key={key}
                    action
                    active={view === key}
                    onClick={() => setView(key)}
                    className="py-2 px-3 small d-flex align-items-center gap-2"
                  >
                    <i className={`bi ${vt.icon}`}></i>
                    {vt.label}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <hr className="my-2" />

              {/* Идэвхтэй/Идэвхгүй фильтр */}
              <h6 className="text-uppercase text-muted small fw-bold mb-2">
                <i className="bi bi-toggle-on me-1"></i>Төлөв
              </h6>
              <ListGroup variant="flush" className="mb-3">
                {[
                  { value: 'active',   label: 'Идэвхтэй' },
                  { value: 'inactive', label: 'Идэвхгүй' },
                ].map(f => (
                  <ListGroup.Item
                    key={f.value}
                    action
                    active={activeFilter === f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className="py-2 px-3 small"
                  >
                    {f.label}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <hr className="my-2" />

              {/* Club type filter */}
              <h6 className="text-uppercase text-muted small fw-bold mb-2">
                <i className="bi bi-funnel me-1"></i>Клубын төрөл
              </h6>
              <ListGroup variant="flush" className="mb-3">
                {CLUB_TYPE_FILTERS.map((f) => (
                  <ListGroup.Item
                    key={f.value}
                    action
                    active={clubTypeFilter === f.value}
                    onClick={() => setClubTypeFilter(f.value)}
                    className="py-2 px-3 small d-flex align-items-center gap-2"
                  >
                    {f.Icon ? <f.Icon size={14} /> : <i className="bi bi-grid-3x3-gap"></i>}
                    {f.label}
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <hr className="my-2" />

              {/* Actions */}
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100 mb-2"
                onClick={() => setShowJoinModal(true)}
              >
                <LogIn size={14} className="me-1" />
                Клубт элсэх
              </Button>

              {user && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100 mb-2"
                  onClick={() => navigate('/clubs/create')}
                >
                  <PlusCircle size={14} className="me-1" />
                  Клуб үүсгэх
                </Button>
              )}

              {hasActiveFilters && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => {
                    setClubTypeFilter('');
                    setSearchInput('');
                    setActiveFilter('active');
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>Шүүлтүүр цэвэрлэх
                </Button>
              )}
            </div>
          </Col>

          {/* Main Content */}
          <Col lg={9} md={8} className="h-100 overflow-auto" ref={mainColRef}>
            <div className="py-3 px-4">

              {/* Header */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0 fw-semibold">
                  <i className={`bi ${VIEW_TYPES[view]?.icon} me-2`}></i>
                  {VIEW_TYPES[view]?.label}
                </h6>
                <Badge bg="secondary">{clubs.length} клуб</Badge>
              </div>

              {/* Mobile filters */}
              <div className="d-md-none mb-3">
                <Form onSubmit={handleSearch} className="mb-2">
                  <InputGroup size="sm">
                    <Form.Control
                      type="text"
                      placeholder="Клуб хайх..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <Button variant="outline-primary" type="submit">
                      <i className="bi bi-search"></i>
                    </Button>
                  </InputGroup>
                </Form>
                <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                  {Object.entries(VIEW_TYPES).map(([key, vt]) => (
                    <Button
                      key={key}
                      variant={view === key ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setView(key)}
                      className="text-nowrap"
                    >
                      <i className={`bi ${vt.icon} me-1`}></i>{vt.label}
                    </Button>
                  ))}
                </div>
                <div className="d-flex gap-2 overflow-auto pb-2 mb-2">
                  {CLUB_TYPE_FILTERS.map((f) => (
                    <Button
                      key={f.value}
                      variant={clubTypeFilter === f.value ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setClubTypeFilter(f.value)}
                      className="text-nowrap"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="flex-grow-1"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <LogIn size={14} className="me-1" />Клубт элсэх
                  </Button>
                  {user && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => navigate('/clubs/create')}
                    >
                      <PlusCircle size={14} className="me-1" />Клуб үүсгэх
                    </Button>
                  )}
                </div>
              </div>

              {/* Club cards */}
              {loading && clubs.length === 0 ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2 small">Клубууд ачааллаж байна...</p>
                </div>
              ) : clubs.length === 0 ? (
                <div className="text-center py-5">
                  <Users size={48} className="text-muted mb-3" />
                  <p className="text-muted">Клуб олдсонгүй</p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => { setClubTypeFilter(''); setSearchInput(''); }}
                    >
                      Шүүлтүүр цэвэрлэх
                    </Button>
                  )}
                </div>
              ) : (
                <Row className="g-3">
                  {sortedClubs.map((club) => (
                    <Col key={club.id} lg={6} xl={4}>
                      <ClubCard
                        club={club}
                        view={view}
                        navigate={navigate}
                        onReactivated={() => fetchData(buildParams())}
                        currentUserId={user?.id}
                      />
                    </Col>
                  ))}
                </Row>
              )}

              <div ref={triggerRef} style={{ height: '1px', marginTop: '16px' }} />

              {loadingMore && (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                  <span className="ms-2 text-muted small">Ачааллаж байна...</span>
                </div>
              )}

              {clubs.length > 0 && !hasMore && (
                <div className="text-center text-muted small mt-3 mb-4">
                  Нийт {clubs.length} клуб харагдаж байна
                </div>
              )}
            </div>
          </Col>
        </Row>
      </div>

      <JoinClubModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}

// -------------------------------------------------------------------
function ClubCard({ club, view, navigate, onReactivated, currentUserId }) {
  const typeInfo = CLUB_TYPE_INFO[club.club_type] || CLUB_TYPE_INFO.PUBLIC;
  const [reactivating, setReactivating] = useState(false);
  const isInactive = club.is_active === false;

  const canReactivate = isInactive && (
    club.role === 'teacher' || club.creator === currentUserId
  );

  const getBorderColor = () => {
    if (isInactive)      return '#adb5bd';
    if (club.is_official) return '#198754';
    if (club.is_promoted) return '#ffc107';
    if (view === 'mine') {
      return club.role === 'teacher' ? '#198754' : '#0d6efd';
    }
    return '#6c757d';
  };

  const getBgColor = () => {
    if (isInactive)      return '#f4f5f6';
    if (club.is_official) return '#f0fdf4';
    if (club.is_promoted) return '#fffdf0';
    if (view === 'mine') {
      return club.role === 'teacher' ? '#f8fdf9' : '#f8f9ff';
    }
    return '#f8f9fa';
  };

  const handleReactivate = async (e) => {
    e.stopPropagation();
    setReactivating(true);
    try {
      await reactivateClub(club.id);
      onReactivated?.();
    } catch {
      // silent
    } finally {
      setReactivating(false);
    }
  };

  return (
    <Card
      className="h-100 shadow-sm"
      style={{
        cursor: isInactive ? 'default' : 'pointer',
        borderLeft: `4px solid ${getBorderColor()}`,
        backgroundColor: getBgColor(),
        opacity: isInactive ? 0.75 : 1,
      }}
      onClick={() => !isInactive && navigate(`/clubs/${club.id}`)}
    >
      <Card.Body className="d-flex flex-column">
        {/* Badges */}
        <div className="d-flex gap-1 flex-wrap mb-2">
          {isInactive && <Badge bg="secondary">Идэвхгүй</Badge>}
          {!isInactive && club.is_official && (
            <Badge bg="success">
              <ShieldCheck size={12} className="me-1" />Mathminds
            </Badge>
          )}
          {!isInactive && club.is_promoted && !club.is_official && (
            <Badge bg="warning" text="dark">
              <Award size={12} className="me-1" />Онцлох
            </Badge>
          )}
          {view === 'mine' && !club.is_official && !club.is_promoted && !isInactive && (
            club.role === 'teacher'
              ? <Badge bg="success">Багш</Badge>
              : <Badge bg="primary">Гишүүн</Badge>
          )}
          {!isInactive && (
            <Badge bg={typeInfo.variant}>
              <typeInfo.Icon size={12} className="me-1" />
              {typeInfo.label}
            </Badge>
          )}
          <Badge bg="secondary" pill className="ms-auto">
            <Users size={12} className="me-1" />{club.member_count || 0}
          </Badge>
        </div>

        {/* Name */}
        <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem', color: isInactive ? '#6c757d' : undefined }}>
          {club.name}
        </div>

        {/* Description */}
        <div
          className="text-muted small flex-grow-1"
          style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {club.description || 'Тайлбаргүй'}
        </div>

        {/* Creator / Reactivate */}
        <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
          <span className="text-muted small">
            <User size={14} className="me-1" />
            {club.creator_name}
          </span>
          {canReactivate && (
            <Button
              variant="outline-success"
              size="sm"
              onClick={handleReactivate}
              disabled={reactivating}
              style={{ fontSize: '0.75rem', padding: '2px 8px' }}
            >
              <Power size={12} className="me-1" />
              {reactivating ? '...' : 'Идэвхжүүлэх'}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default ClubsBrowsePage;
