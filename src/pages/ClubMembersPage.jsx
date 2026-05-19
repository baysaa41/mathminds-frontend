// ClubMembersPage - Клубын гишүүдийн жагсаалт
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import UserAvatar from '../components/UserAvatar';
import { Users, Users2, X, Search, UserPlus, BarChart2, TrendingUp } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { inviteTeacher, formatErrorMessage } from '../services/clubsService';

const ClubMembersPage = () => {
  const {
    clubData: club,
    clubActions,
    isTeacherOrAdmin,
    newTeacherUsername,
    setNewTeacherUsername,
    addingTeacher,
    showToast,
  } = useOutletContext();
  const navigate = useNavigate();
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
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const response = await apiClient.get(`/users/api/search/?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data || []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  // Click outside → хаах
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = async (user) => {
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    if (!club?.id) return;
    try {
      const result = await inviteTeacher(club.id, user.username);
      showToast?.(result.detail || 'Багшийн урилга илгээгдлээ!', 'success');
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(formatErrorMessage(err), 'danger');
    }
  };

  if (!club) return null;

  const members = club.members || [];
  const admins = club.admins || [];
  const creator = club.creator;

  // Гишүүдийг ангилах: удирдагч, багш нар, энгийн гишүүд
  const _creatorMember = members.find(m => m.id === creator);
  const _teacherMembers = members.filter(m =>
    admins.some(a => a.id === m.id) && m.id !== creator
  );
  const regularMembers = members.filter(m =>
    !admins.some(a => a.id === m.id)
  );

  const renderMember = (member, role = 'member') => {
    const isTeacher = role === 'teacher';
    const isCreatorRole = role === 'creator';

    return (
      <ListGroup.Item
        key={member.id}
        className="py-3"
      >
        <div className="d-flex align-items-center gap-3">
          <UserAvatar user={member} size={48} />
          <div className="flex-grow-1">
            <Link to={`/profile/${member.username}`} className="text-decoration-none text-dark">
              <div className="fw-semibold">
                {member.first_name || member.last_name
                  ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                  : member.username}
              </div>
              <small className="text-muted">@{member.username}</small>
            </Link>
          </div>
          <div className="d-flex align-items-center gap-2">
            {isCreatorRole && (
              <Badge bg="warning" text="dark">
                <Crown size={12} className="me-1" />
                Удирдагч
              </Badge>
            )}
            {isTeacher && (
              <Badge bg="success">
                <GraduationCap size={12} className="me-1" />
                Багш
              </Badge>
            )}
            {/* Тайлан товч — зөвхөн багшид */}
            {isTeacherOrAdmin && !isTeacher && !isCreatorRole && (
              <Button
                variant="outline-info"
                size="sm"
                title="Тайлан харах"
                onClick={() => navigate(`/clubs/${club.id}/report/${member.username}`)}
              >
                📊
              </Button>
            )}
            {/* Удирдагч багшаас бусад гишүүдийг хасах боломжтой */}
            {!isCreatorRole && club.role === 'teacher' && clubActions?.onRemoveMember && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => clubActions.onRemoveMember(member.username)}
                title="Гишүүн хасах"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <div className="container-fluid">
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
                <Card
                  className="position-absolute w-100 mt-1"
                  style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                >
                  <ListGroup variant="flush">
                    {searchResults.map((u) => (
                      <ListGroup.Item
                        key={u.id}
                        action
                        onClick={() => handleSelectUser(u)}
                        className="py-2"
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <UserAvatar user={u} size={32} />
                          <div>
                            <div className="fw-semibold small">{u.first_name || u.username}</div>
                            <small className="text-muted">@{u.username}</small>
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

            {/* Username шууд оруулах */}
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

      {/* Гишүүд (багш + энгийн нэгтгэсэн) */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h6 className="mb-0">
            <Users size={16} className="me-2" />
            Сурагчид ({regularMembers.length})
          </h6>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(`/clubs/${club.id}/subgroups`)}
            >
              <Users2 size={14} className="me-1" />
              Дэд бүлэг
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => navigate(`/clubs/${club.id}/scores`)}
            >
              <BarChart2 size={14} className="me-1" />
              Дүн матриц
            </Button>
            {isTeacherOrAdmin && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => navigate(`/clubs/${club.id}/group-report`)}
              >
                <TrendingUp size={14} className="me-1" />
                Тайлан
              </Button>
            )}
          </div>
        </Card.Header>
        {regularMembers.length > 0 ? (
          <ListGroup variant="flush">
            {regularMembers.map((member) => renderMember(member, 'member'))}
          </ListGroup>
        ) : (
          <Card.Body className="text-center text-muted py-4">
            <Users size={36} className="mb-2 opacity-25" />
            <p className="mb-0">Одоогоор сурагч байхгүй байна.</p>
          </Card.Body>
        )}
      </Card>
    </div>
  );
};

export default ClubMembersPage;
