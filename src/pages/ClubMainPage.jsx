// Club Main Page - Activity, Members, Teachers tabs
import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ClubFeed from '../components/ClubFeed';
import UserAvatar from '../components/UserAvatar';
import { Calendar, Users, UserPlus, X } from 'lucide-react';

const ClubMainPage = () => {
  const {
    clubData: club,
    isCreator,
    clubActions,
    newTeacherUsername,
    setNewTeacherUsername,
    addingTeacher
  } = useOutletContext();

  if (!club) return null;

  const members = club.members || [];
  const admins = club.admins || [];
  const adminIds = new Set(admins.map((admin) => admin.id));
  const teachers = club.teachers || [];

  return (
    <Tabs defaultActiveKey="activity" className="mb-4">
      <Tab eventKey="activity" title="Үйл ажиллагаа">
        {club.role ? (
          <ClubFeed clubId={club.id} clubName={club.name} />
        ) : (
          <Card>
            <Card.Body>
              <div className="text-center py-5 text-muted">
                <Calendar size={40} className="mb-3" />
                <p>Клубын гишүүн болсноор постуудыг харах боломжтой</p>
              </div>
            </Card.Body>
          </Card>
        )}
      </Tab>

      <Tab eventKey="members" title={`Гишүүд (${members.length})`}>
        <Card>
          <Card.Body>
            {members.length > 0 ? (
              <ListGroup variant="flush">
                {members.map((member) => {
                  const isMemberTeacher = adminIds.has(member.id);

                  return (
                    <ListGroup.Item
                      key={member.id}
                      className="d-flex justify-content-between align-items-center"
                      as={Link}
                      to={`/profile/${member.username}`}
                      action
                    >
                      <div className="d-flex align-items-center gap-2">
                        <UserAvatar user={member} size={40} />
                        <div>
                          <div>
                            <strong>
                              {member.first_name || ''} {member.last_name || ''}
                            </strong>
                          </div>
                          <span className="text-muted small">@{member.username}</span>
                        </div>
                      </div>
                      <div>
                        <Badge bg={isMemberTeacher ? 'success' : 'secondary'}>
                          {isMemberTeacher ? 'Багш' : 'Гишүүн'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            ) : (
              <div className="text-center py-4 text-muted">
                <Users size={40} className="mb-3" />
                <p>Одоогоор гишүүн байхгүй байна</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Tab>

      {club.role === 'teacher' && (
        <Tab eventKey="teachers" title={`Багш нар (${teachers.length + 1})`}>
          <Card>
            <Card.Body>
              <div className="mb-4">
                <h6 className="mb-2">Үндсэн багш</h6>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <UserAvatar user={{ username: club.creator_name }} size={40} />
                      <div>
                        <strong>{club.creator_name}</strong>
                        <Badge bg="success" className="ms-2">
                          Үүсгэгч
                        </Badge>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </div>

              {teachers.length > 0 && (
                <div className="mb-4">
                  <h6 className="mb-2">Нэмэлт багш нар ({teachers.length})</h6>
                  <ListGroup variant="flush">
                    {teachers.map((teacher) => (
                      <ListGroup.Item
                        key={teacher.id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <UserAvatar user={teacher} size={40} />
                          <div>
                            <div>
                              <strong>
                                {teacher.first_name || ''} {teacher.last_name || ''}
                              </strong>
                              <Badge bg="info" className="ms-2">
                                +10 сурагч
                              </Badge>
                            </div>
                            <span className="text-muted small">@{teacher.username}</span>
                          </div>
                        </div>
                        {isCreator && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => clubActions?.onRemoveTeacher(teacher.username)}
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}

              {(isCreator || club.role === 'teacher') && (
                <div>
                  <h6 className="mb-3">Багш урилга илгээх</h6>
                  <Form onSubmit={clubActions?.onInviteTeacher}>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Багшийн username"
                        value={newTeacherUsername}
                        onChange={(e) => setNewTeacherUsername(e.target.value)}
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
                            <UserPlus size={16} className="me-2" />
                            Урих
                          </>
                        )}
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Урилга зөвшөөрснөөр багш болж +10 сурагчдын хязгаар нэмэгдэнэ
                    </Form.Text>
                  </Form>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      )}
    </Tabs>
  );
};

export default ClubMainPage;
