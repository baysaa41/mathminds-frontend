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
} from 'react-bootstrap';
import { Users, Search } from 'lucide-react';
import apiClient from '../api/axiosConfig';

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

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, membershipFilter, roleFilter]);

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
    if (tier === 'PRO') {
      return (
        <Badge bg={isActiveMember ? 'warning' : 'secondary'} text={isActiveMember ? 'dark' : 'light'}>
          PRO {!isActiveMember && '(Дууссан)'}
        </Badge>
      );
    } else if (tier === 'MEMBER') {
      return (
        <Badge bg={isActiveMember ? 'primary' : 'secondary'}>
          MEMBER {!isActiveMember && '(Дууссан)'}
        </Badge>
      );
    }
    return <Badge bg="light" text="dark">FREE</Badge>;
  };

  const getRoleBadge = (role, isStaff) => {
    if (isStaff) {
      return <Badge bg="danger">ADMIN</Badge>;
    }
    switch (role) {
      case 'TEACHER':
        return <Badge bg="success">TEACHER</Badge>;
      case 'PARENT':
        return <Badge bg="info">PARENT</Badge>;
      default:
        return <Badge bg="secondary">STUDENT</Badge>;
    }
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
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-2">
            <Users size={32} className="text-primary" />
            <div>
              <h2 className="mb-0">Бүх хэрэглэгчид</h2>
              <p className="text-muted mb-0">Нийт {totalCount} хэрэглэгч</p>
            </div>
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
                        <td>{getRoleBadge(user.site_role, user.is_staff)}</td>
                        <td>
                          <small className="text-muted">{formatDateTime(user.last_login)}</small>
                        </td>
                        <td>
                          <small className="text-muted">{formatDate(user.date_joined)}</small>
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
    </Container>
  );
}

export default AllUsersPage;
