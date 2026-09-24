// frontend/src/pages/AllUsersPage.jsx

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Card,
  Table,
  Spinner,
  Badge,
  Form,
  Row,
  Col,
  InputGroup,
  Modal,
  Button,
} from 'react-bootstrap';
import { Users, Search, Save, UserPlus } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { MEMBERSHIP_CONFIG } from '../constants/membership';

function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filters
  const [search, setSearch] = useState('');
  const [membershipFilter, setMembershipFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [clubFilter, setClubFilter] = useState('');
  const [clubs, setClubs] = useState([]);

  // ЭЕШ регистр засах
  const [eecInputs, setEecInputs] = useState({});
  const [savingEec, setSavingEec] = useState({});

  // Үүрэг / admin эрх засах
  const [savingRole, setSavingRole] = useState({});

  // Шинэ хэрэглэгч нэмэх
  const EMPTY_NEW_USER = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    site_role: 'STUDENT',
  };
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState({});

  useEffect(() => {
    apiClient
      .get('/api/clubs/?include_inactive=1')
      .then((res) => {
        const list = res.data.results || res.data || [];
        setClubs([...list].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => console.error('Failed to load clubs:', err));
  }, []);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, membershipFilter, roleFilter, clubFilter]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        page_size: pageSize,
      });
      if (search) params.append('search', search);
      if (membershipFilter) params.append('membership', membershipFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (clubFilter) params.append('club', clubFilter);

      const response = await apiClient.get(`/users/api/all-users/?${params}`);
      setUsers(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Хэрэглэгчдийн мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setNewUser(EMPTY_NEW_USER);
    setCreateErrors({});
    setShowCreate(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});
    try {
      await apiClient.post('/users/api/all-users/create/', newUser);
      setShowCreate(false);
      setSearch('');
      if (currentPage === 1) {
        loadUsers();
      } else {
        setCurrentPage(1);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        setCreateErrors(data);
      } else {
        setCreateErrors({ detail: data?.detail || 'Хэрэглэгч нэмэхэд алдаа гарлаа.' });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEecSave = async (user) => {
    const value = (eecInputs[user.id] !== undefined ? eecInputs[user.id] : (user.eec_register || '')).trim();
    setSavingEec((prev) => ({ ...prev, [user.id]: true }));
    try {
      const response = await apiClient.post('/users/api/all-users/set-eec-register/', {
        user_id: user.id,
        eec_register: value,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, eec_register: response.data.eec_register } : u))
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Регистрийн дугаар хадгалахад алдаа гарлаа.');
    } finally {
      setSavingEec((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const handleRoleUpdate = async (user, patch) => {
    setSavingRole((prev) => ({ ...prev, [user.id]: true }));
    try {
      const response = await apiClient.patch(`/users/api/all-users/${user.id}/role/`, patch);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, site_role: response.data.site_role, is_staff: response.data.is_staff }
            : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Эрх шинэчлэхэд алдаа гарлаа.');
    } finally {
      setSavingRole((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMembershipBadge = (tier, isActiveMember) => {
    const config = MEMBERSHIP_CONFIG[tier] || MEMBERSHIP_CONFIG.FREE;
    if (tier !== 'MEMBER' && tier !== 'PRO') {
      return <Badge bg="light" text="dark">{config.label}</Badge>;
    }
    return (
      <Badge
        style={{ backgroundColor: isActiveMember ? config.color : '#6c757d' }}
        text={isActiveMember && tier === 'PRO' ? 'dark' : 'light'}
      >
        {config.label} {!isActiveMember && '(Дууссан)'}
      </Badge>
    );
  };

  const getRemainingDays = (expirationDate, membershipTier) => {
    // FREE гишүүнчлэлд expiration байхгүй
    if (!expirationDate || membershipTier === 'FREE') return null;

    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge bg="danger">Дууссан</Badge>;
    } else if (diffDays <= 7) {
      return (
        <Badge bg="warning" text="dark">
          {diffDays} хоног
        </Badge>
      );
    } else if (diffDays <= 30) {
      return <Badge bg="info">{diffDays} хоног</Badge>;
    }
    return <Badge bg="success">{diffDays} хоног</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <Users size={32} className="text-primary" />
            <div>
              <h2 className="mb-0">Бүх хэрэглэгчид</h2>
              <p className="text-muted mb-0">Нийт {totalCount} хэрэглэгч</p>
            </div>
            <Button variant="primary" className="ms-auto d-flex align-items-center gap-2" onClick={openCreate}>
              <UserPlus size={18} />
              Хэрэглэгч нэмэх
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Хайх (нэр, email, mmo_id)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={membershipFilter}
                onChange={(e) => {
                  setMembershipFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Бүх гишүүнчлэл</option>
                <option value="FREE">FREE</option>
                <option value="MEMBER">MEMBER</option>
                <option value="PRO">PRO</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Бүх үүрэг</option>
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="PARENT">PARENT</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10 / хуудас</option>
                <option value={20}>20 / хуудас</option>
                <option value={50}>50 / хуудас</option>
                <option value={100}>100 / хуудас</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={clubFilter}
                onChange={(e) => {
                  setClubFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Бүх клуб</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 text-muted">Ачааллаж байна...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-4">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-5">
              <Users size={64} className="text-muted mb-3" />
              <h5 className="text-muted">Хэрэглэгч олдсонгүй</h5>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Хэрэглэгч</th>
                      <th>Нэр</th>
                      <th>Email</th>
                      <th>MMO ID</th>
                      <th>Гишүүнчлэл</th>
                      <th>Дуусах огноо</th>
                      <th>Үлдсэн</th>
                      <th>Үүрэг</th>
                      <th>Сүүлд нэвтэрсэн</th>
                      <th>Бүртгэл</th>
                      <th>ЭЕШ регистр</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id}>
                        <td>
                          <span className="text-muted">
                            {(currentPage - 1) * pageSize + index + 1}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/profile/${user.username}`}
                            className="text-decoration-none fw-medium"
                          >
                            @{user.username}
                          </Link>
                        </td>
                        <td>
                          {user.first_name || user.last_name ? (
                            `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">{user.email || '-'}</small>
                        </td>
                        <td>
                          <span className="text-muted font-monospace small">
                            {user.mmo_id || '-'}
                          </span>
                        </td>
                        <td>{getMembershipBadge(user.membership_tier, user.is_active_member)}</td>
                        <td>
                          <small className="text-muted">{formatDate(user.expiration)}</small>
                        </td>
                        <td>{getRemainingDays(user.expiration, user.membership_tier)}</td>
                        <td>
                          <div className="d-flex align-items-center gap-1" style={{ minWidth: 150 }}>
                            <Form.Select
                              size="sm"
                              value={user.site_role}
                              disabled={savingRole[user.id]}
                              onChange={(e) => handleRoleUpdate(user, { site_role: e.target.value })}
                              style={{ width: 110 }}
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="TEACHER">TEACHER</option>
                              <option value="PARENT">PARENT</option>
                              <option value="OTHER">OTHER</option>
                            </Form.Select>
                            <Form.Check
                              type="checkbox"
                              label="ADMIN"
                              checked={user.is_staff}
                              disabled={savingRole[user.id]}
                              onChange={(e) => handleRoleUpdate(user, { is_staff: e.target.checked })}
                              title="Staff эрх — зөвхөн superuser өөрчилж чадна"
                            />
                            {savingRole[user.id] && <Spinner animation="border" size="sm" />}
                          </div>
                        </td>
                        <td>
                          <small className="text-muted">{formatDateTime(user.last_login)}</small>
                        </td>
                        <td>
                          <small className="text-muted">{formatDate(user.date_joined)}</small>
                        </td>
                        <td>
                          <InputGroup size="sm" style={{ minWidth: 160 }}>
                            <Form.Control
                              type="text"
                              placeholder="Регистр"
                              value={eecInputs[user.id] !== undefined ? eecInputs[user.id] : (user.eec_register || '')}
                              onChange={(e) =>
                                setEecInputs((prev) => ({ ...prev, [user.id]: e.target.value }))
                              }
                              disabled={savingEec[user.id]}
                            />
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEecSave(user)}
                              disabled={savingEec[user.id]}
                              title="Регистр хадгалах"
                            >
                              {savingEec[user.id] ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <Save size={14} />
                              )}
                            </button>
                          </InputGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                  <div className="text-muted">
                    Хуудас {currentPage} / {totalPages} ({totalCount} хэрэглэгч)
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i> Өмнөх
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Дараах <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreate} onHide={() => !creating && setShowCreate(false)} centered>
        <Form onSubmit={handleCreateUser}>
          <Modal.Header closeButton={!creating}>
            <Modal.Title>Шинэ хэрэглэгч нэмэх</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {createErrors.detail && <div className="alert alert-danger">{createErrors.detail}</div>}
            <Form.Group className="mb-3">
              <Form.Label>Хэрэглэгчийн нэр *</Form.Label>
              <Form.Control
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                isInvalid={!!createErrors.username}
                autoComplete="off"
                required
              />
              <Form.Control.Feedback type="invalid">{createErrors.username}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Имэйл *</Form.Label>
              <Form.Control
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                isInvalid={!!createErrors.email}
                autoComplete="off"
                required
              />
              <Form.Control.Feedback type="invalid">{createErrors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Нууц үг *</Form.Label>
              <Form.Control
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                isInvalid={!!createErrors.password}
                autoComplete="new-password"
                required
              />
              <Form.Control.Feedback type="invalid">{createErrors.password}</Form.Control.Feedback>
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col>
                <Form.Label>Овог</Form.Label>
                <Form.Control
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                />
              </Col>
              <Col>
                <Form.Label>Нэр</Form.Label>
                <Form.Control
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                />
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Үүрэг</Form.Label>
              <Form.Select
                value={newUser.site_role}
                onChange={(e) => setNewUser({ ...newUser, site_role: e.target.value })}
                isInvalid={!!createErrors.site_role}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="TEACHER">TEACHER</option>
                <option value="PARENT">PARENT</option>
                <option value="OTHER">OTHER</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">{createErrors.site_role}</Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)} disabled={creating}>
              Болих
            </Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? <Spinner animation="border" size="sm" /> : 'Нэмэх'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default AllUsersPage;
