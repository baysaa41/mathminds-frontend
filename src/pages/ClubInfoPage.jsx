// ClubInfoPage - Клубын мэдээлэл (үндсэн хуудас)
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import UserAvatar from '../components/UserAvatar';
import { Calendar, Users, Award, ShieldCheck, DollarSign, Settings, Key, LogIn, LogOut, UserPlus, X, Search } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { inviteTeacher, formatErrorMessage } from '../services/clubsService';
import LivePreview from '../components/LivePreview';

const ClubInfoPage = () => {
  const {
    clubData: club,
    clubActions,
    isCreator,
    newTeacherUsername,
    setNewTeacherUsername,
    addingTeacher,
    showToast
  } = useOutletContext();

  if (!club) return null;

  const teachers = club.teachers || [];
  const admins = club.admins || [];

  // Удирдагч багшийг багш нарын жагсаалтаас хасах
  const otherAdmins = admins.filter(admin => admin.id !== club.creator);

  // Teacher search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Search users
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await apiClient.get(`/users/api/search/?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = async (user) => {
    // Хайлтын цонхыг хаах
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);

    // Шууд урилга илгээх
    if (!club?.id) return;

    try {
      const result = await inviteTeacher(club.id, user.username);
      showToast?.(result.detail || 'Багшийн урилга илгээгдлээ!', 'success');
      // Клубын мэдээллийг шинэчлэх
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(formatErrorMessage(err), 'danger');
    }
  };

  return (
    <div className="container-fluid">
      {/* Клубын үндсэн мэдээлэл */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h3 className="mb-2">
                <LivePreview content={club.name} />
              </h3>
            </div>

            {/* Үйлдлийн товчууд */}
            <div className="d-flex gap-2">
              {club.role === 'teacher' && clubActions?.onEditClub && (
                <Button variant="outline-secondary" size="sm" onClick={clubActions.onEditClub}>
                  <Settings size={14} className="me-1" />
                  Засах
                </Button>
              )}

              {club.role === 'teacher' && clubActions?.onShowRegCode && (
                <Button variant="outline-primary" size="sm" onClick={clubActions.onShowRegCode}>
                  <Key size={14} className="me-1" />
                  Бүртгэлийн код
                </Button>
              )}

              {!club.role && clubActions?.onJoinClub && (
                <Button variant="primary" size="sm" onClick={clubActions.onJoinClub}>
                  <LogIn size={14} className="me-1" />
                  Элсэх
                </Button>
              )}

              {club.role === 'member' && clubActions?.onLeaveClub && (
                <Button variant="outline-danger" size="sm" onClick={clubActions.onLeaveClub}>
                  <LogOut size={14} className="me-1" />
                  Гарах
                </Button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="mb-3">
            {club.is_official && (
              <Badge bg="success" className="me-2">
                <ShieldCheck size={14} className="me-1" />
                Mathminds албан ёсны клуб
              </Badge>
            )}
            {club.is_promoted && (
              <Badge bg="warning" text="dark" className="me-2">
                <Award size={14} className="me-1" />
                Онцлох клуб
              </Badge>
            )}
            {club.club_type === 'STUDY' && (
              <Badge bg="info" className="me-2">
                Суралцах клуб
              </Badge>
            )}
            {club.club_type === 'COMMUNITY' && (
              <Badge bg="primary" className="me-2">
                Нийгэмлэгийн клуб
              </Badge>
            )}
          </div>

          {/* Тайлбар */}
          {club.description && (
            <div className="mb-4">
              <h6 className="text-muted">Тайлбар</h6>
              <div className="mb-0">
                <LivePreview content={club.description} />
              </div>
            </div>
          )}

          {/* Статистик */}
          <Row className="g-3">
            <Col md={6} lg={3}>
              <Card className="bg-light border-0 h-100">
                <Card.Body className="text-center">
                  <Users size={32} className="text-primary mb-2" />
                  <h4 className="mb-1">{club.member_count || 0}</h4>
                  <p className="text-muted small mb-0">Нийт гишүүд</p>
                  {club.total_max_members && club.total_max_members > 0 && (
                    <small className="text-muted">/ {club.total_max_members} хязгаар</small>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="bg-light border-0 h-100">
                <Card.Body className="text-center">
                  <Users size={32} className="text-success mb-2" />
                  <h4 className="mb-1">{club.admins?.length || 0}</h4>
                  <p className="text-muted small mb-0">Багш нар</p>
                  {club.teachers && club.teachers.length > 0 && (
                    <small className="text-muted">+ {club.teachers.length} нэмэлт</small>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3}>
              <Card className="bg-light border-0 h-100">
                <Card.Body className="text-center">
                  <Calendar size={32} className="text-info mb-2" />
                  <h4 className="mb-1">
                    {new Date(club.created_at).toLocaleDateString('mn-MN')}
                  </h4>
                  <p className="text-muted small mb-0">Үүсгэсэн огноо</p>
                </Card.Body>
              </Card>
            </Col>

            {club.club_type === 'STUDY' && club.monthly_price_silver > 0 && (
              <Col md={6} lg={3}>
                <Card className="bg-light border-0 h-100">
                  <Card.Body className="text-center">
                    <DollarSign size={32} className="text-warning mb-2" />
                    <h4 className="mb-1">{club.monthly_price_silver}</h4>
                    <p className="text-muted small mb-0">Мөнгөн зоос/сар</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Клубын удирдагч багш */}
      {club.creator_info && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">Удирдагч багш</h6>
          </Card.Header>
          <Card.Body>
            <div className="d-flex align-items-center gap-3">
              {club.creator_info.picture_url && (
                <img
                  src={club.creator_info.picture_url}
                  alt={club.creator_info.username}
                  className="rounded-circle"
                  width="64"
                  height="64"
                />
              )}
              <div>
                <h5 className="mb-1">
                  {club.creator_info.first_name && club.creator_info.last_name
                    ? `${club.creator_info.first_name} ${club.creator_info.last_name}`
                    : club.creator_info.username}
                </h5>
                <p className="text-muted mb-0">@{club.creator_info.username}</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Багш нар */}
      {otherAdmins.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">Багш нар ({otherAdmins.length})</h6>
          </Card.Header>
          <ListGroup variant="flush">
            {otherAdmins.map((admin) => (
              <ListGroup.Item
                key={admin.id}
                className="py-3"
              >
                <div className="d-flex align-items-center gap-3">
                  <UserAvatar user={admin} size={48} />
                  <div className="flex-grow-1">
                    <Link to={`/profile/${admin.username}`} className="text-decoration-none text-dark">
                      <div className="fw-semibold">
                        {admin.first_name || ''} {admin.last_name || ''}
                      </div>
                      <small className="text-muted">@{admin.username}</small>
                    </Link>
                  </div>
                  {isCreator && clubActions?.onRemoveTeacher && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => clubActions.onRemoveTeacher(admin.username)}
                      title="Багш хасах"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}

      {/* Багш урих (зөвхөн багш бол) */}
      {club.role === 'teacher' && clubActions?.onInviteTeacher && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">Багш урих</h6>
          </Card.Header>
          <Card.Body>
            {/* Багш хайх */}
            <div className="position-relative mb-3" ref={searchRef}>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <Search size={14} />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Багш хайх..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={addingTeacher}
                />
              </InputGroup>
              <Form.Text className="text-muted small">
                Нэр эсвэл username-ээр хайж, жагсаалтаас сонгоно
              </Form.Text>

              {/* Search results dropdown */}
              {showResults && searchResults.length > 0 && (
                <Card className="position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                  <ListGroup variant="flush">
                    {searchResults.map((user) => (
                      <ListGroup.Item
                        key={user.id}
                        action
                        onClick={() => handleSelectUser(user)}
                        className="py-2"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <UserAvatar user={user} size={32} />
                          <div>
                            <div className="fw-semibold small">
                              {user.first_name || user.username}
                            </div>
                            <small className="text-muted">@{user.username}</small>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card>
              )}

              {searching && (
                <div className="text-center text-muted small mt-1">
                  <Spinner animation="border" size="sm" /> Хайж байна...
                </div>
              )}
            </div>

            {/* Selected username + invite button */}
            <Form onSubmit={clubActions.onInviteTeacher}>
              <Form.Label className="small mb-1">Эсвэл username шууд оруулах:</Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  type="text"
                  placeholder="Username оруулах"
                  value={newTeacherUsername || ''}
                  onChange={(e) => setNewTeacherUsername && setNewTeacherUsername(e.target.value)}
                  disabled={addingTeacher}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={addingTeacher || !newTeacherUsername?.trim()}
                >
                  {addingTeacher ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <UserPlus size={14} className="me-1" />
                      Урих
                    </>
                  )}
                </Button>
              </InputGroup>
              <Form.Text className="text-muted small">
                Урилга зөвшөөрснөөр багш админ эрхтэй болж, +10 сурагчдын хязгаар нэмэгдэнэ
              </Form.Text>
            </Form>
          </Card.Body>
        </Card>
      )}

    </div>
  );
};

export default ClubInfoPage;
