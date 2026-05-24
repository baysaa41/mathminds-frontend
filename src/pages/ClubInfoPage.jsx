// ClubInfoPage - Клубын мэдээлэл (үндсэн хуудас)
import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import UserAvatar from '../components/UserAvatar';
import { Calendar, Users, Award, ShieldCheck, DollarSign, Settings, Key, LogIn, LogOut, X, CalendarDays, GraduationCap } from 'lucide-react';
import LivePreview from '../components/LivePreview';
import ClubFeed from '../components/ClubFeed';
import ClubMeetingsWidget from '../components/ClubMeetingsWidget';

const ClubInfoPage = ({ forceInfo = false }) => {
  const {
    clubData: club,
    clubActions,
    isCreator,
    isTeacherOrAdmin,
  } = useOutletContext();

  if (!club) return null;

  // Гишүүн эсвэл багш бол хэлэлцүүлэг харуулах (forceInfo үед үзүүлэхгүй)
  if (!forceInfo && (club.role === 'member' || club.role === 'teacher')) {
    return <ClubFeed clubId={club.id} clubName={club.name} />;
  }

  const admins = club.admins || [];

  // Удирдагч багшийг багш нарын жагсаалтаас хасах
  const otherAdmins = admins.filter(admin => admin.id !== club.creator);

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
            {club.is_active === false && (
              <Badge bg="secondary" className="me-2">
                Идэвхгүй
              </Badge>
            )}
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

      {/* Видео уулзалт */}
      <ClubMeetingsWidget
        club={club}
        onUpdate={clubActions?.onUpdate}
        isTeacherOrAdmin={isTeacherOrAdmin}
      />

      {/* Одоогийн долоо хоногийн сэдвүүд (олон хөтөлбөр) */}
      {club.current_week_topics && club.current_week_topics.length > 0 && (
        <Card className="shadow-sm mb-4 border-primary border-opacity-25">
          <Card.Header className="bg-white border-bottom">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <GraduationCap size={16} className="text-primary" />
              <h6 className="mb-0 fw-bold">Долоо хоногийн сэдвүүд</h6>
            </div>
          </Card.Header>
          <Card.Body>
            {club.current_week_topics.map((w, idx) => (
              <div key={idx} className={`d-flex align-items-start gap-3 ${idx > 0 ? 'border-top pt-3 mt-3' : ''}`}>
                <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 52, height: 52 }}>
                  <span className="fw-bold text-primary lh-1 text-center" style={{ fontSize: '0.8rem' }}>
                    {w.week_num}-р<br />7 хон
                  </span>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <Badge bg="success" pill>Одоо үзэж байна</Badge>
                    <span className="small text-muted fw-medium">{w.program_name}</span>
                    <span className="small text-muted">{w.week_num}-р долоо хоног</span>
                  </div>
                  <p className="mb-0 fw-semibold">{w.topic}</p>
                  {w.description && (
                    <p className="mb-0 small text-muted mt-1">{w.description}</p>
                  )}
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

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


    </div>
  );
};

export default ClubInfoPage;
