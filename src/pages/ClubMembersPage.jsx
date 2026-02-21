// ClubMembersPage - Клубын гишүүдийн жагсаалт
import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import UserAvatar from '../components/UserAvatar';
import { Users, Crown, GraduationCap, X } from 'lucide-react';

const ClubMembersPage = () => {
  const {
    clubData: club,
    clubActions,
    isCreator
  } = useOutletContext();

  if (!club) return null;

  const members = club.members || [];
  const admins = club.admins || [];
  const creator = club.creator;

  // Гишүүдийг ангилах: удирдагч, багш нар, энгийн гишүүд
  const creatorMember = members.find(m => m.id === creator);
  const teacherMembers = members.filter(m =>
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
            {/* Зөвхөн удирдагч энгийн гишүүдийг хасах боломжтой */}
            {isCreator && role === 'member' && clubActions?.onRemoveMember && (
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
      {/* Нийт гишүүд */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-1">
                <Users size={20} className="me-2" />
                Гишүүд
              </h5>
              <small className="text-muted">
                Нийт {members.length} гишүүн
                {club.total_max_members && club.total_max_members > 0 && (
                  <> / {club.total_max_members} хязгаар</>
                )}
              </small>
            </div>
          </div>
        </Card.Header>
      </Card>

      {/* Удирдагч багш */}
      {creatorMember && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <Crown size={16} className="me-2" />
              Удирдагч багш
            </h6>
          </Card.Header>
          <ListGroup variant="flush">
            {renderMember(creatorMember, 'creator')}
          </ListGroup>
        </Card>
      )}

      {/* Багш нар */}
      {teacherMembers.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <GraduationCap size={16} className="me-2" />
              Багш нар ({teacherMembers.length})
            </h6>
          </Card.Header>
          <ListGroup variant="flush">
            {teacherMembers.map(member => renderMember(member, 'teacher'))}
          </ListGroup>
        </Card>
      )}

      {/* Энгийн гишүүд */}
      {regularMembers.length > 0 && (
        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h6 className="mb-0">
              <Users size={16} className="me-2" />
              Гишүүд ({regularMembers.length})
            </h6>
          </Card.Header>
          <ListGroup variant="flush">
            {regularMembers.map(member => renderMember(member, 'member'))}
          </ListGroup>
        </Card>
      )}

      {/* Гишүүдийн тоо 0 байвал */}
      {members.length === 0 && (
        <Card className="shadow-sm">
          <Card.Body className="text-center text-muted py-5">
            <Users size={48} className="mb-3 opacity-25" />
            <p>Одоогоор гишүүд байхгүй байна.</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ClubMembersPage;
