// src/pages/AIConversationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Badge, Form, InputGroup, Button, Spinner, Pagination } from 'react-bootstrap';
import { MessageCircle, Search, ChevronLeft, Bot, User } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';

const SUBJECT_LABELS = {
  math: 'Математик',
  physics: 'Физик',
  chemistry: 'Хими',
  biology: 'Биологи',
  all: 'Бүх хичээл',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('mn-MN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function UserCell({ user }) {
  if (!user) return <span className="text-muted">—</span>;
  return (
    <div className="d-flex align-items-center gap-2">
      {user.picture_url ? (
        <img src={user.picture_url} alt="" width={28} height={28} className="rounded-circle object-fit-cover" />
      ) : (
        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
          {user.is_ai ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
        </div>
      )}
      <div>
        <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>
          {user.is_ai ? (user.ai_name_mn || user.username) : (user.first_name || user.username)}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>@{user.username}</div>
      </div>
    </div>
  );
}

export default function AIConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      const res = await axiosInstance.get('/api/minds/conversations/admin_list/', { params });
      setConversations(res.data.results || []);
      setTotalPages(res.data.num_pages || 1);
      setTotal(res.data.count || 0);
    } catch (e) {
      setError(e.response?.data?.error || 'Мэдээлэл ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3 mb-3">
            <Link to="/admin" className="btn btn-outline-secondary btn-sm">
              <ChevronLeft size={16} className="me-1" />
              Admin
            </Link>
            <div>
              <h4 className="mb-0 d-flex align-items-center gap-2">
                <Bot size={22} className="text-primary" />
                AI Багштай Ярилцлагууд
              </h4>
              <small className="text-muted">Нийт: {total} ярилцлага</small>
            </div>
          </div>

          <Card className="shadow-sm">
            <Card.Body className="pb-2">
              <Form onSubmit={handleSearch}>
                <InputGroup style={{ maxWidth: 360 }}>
                  <Form.Control
                    placeholder="Хэрэглэгчийн нэрээр хайх..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <Button type="submit" variant="outline-secondary">
                    <Search size={16} />
                  </Button>
                </InputGroup>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <MessageCircle size={48} className="mb-3 opacity-25" />
          <p>Ярилцлага олдсонгүй</p>
        </div>
      ) : (
        <>
          <Card className="shadow-sm">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Хэрэглэгч</th>
                    <th>AI Багш</th>
                    <th className="text-center">Хичээл</th>
                    <th className="text-center">Мессеж</th>
                    <th>Сүүлд шинэчлэгдсэн</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conv) => (
                    <tr key={conv.id}>
                      <td><UserCell user={conv.human_user} /></td>
                      <td><UserCell user={conv.ai_user} /></td>
                      <td className="text-center">
                        {conv.ai_user?.ai_subject ? (
                          <Badge bg="primary" className="fw-normal">
                            {SUBJECT_LABELS[conv.ai_user.ai_subject] || conv.ai_user.ai_subject}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="text-center">
                        <Badge bg="secondary" className="fw-normal">{conv.message_count}</Badge>
                      </td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(conv.updated_at)}
                      </td>
                      <td>
                        <Link
                          to={`/admin/conversation/${conv.uuid}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Харах
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev disabled={page === 1} onClick={() => handlePageChange(page - 1)} />
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...'
                      ? <Pagination.Ellipsis key={`e${i}`} disabled />
                      : <Pagination.Item key={p} active={p === page} onClick={() => handlePageChange(p)}>{p}</Pagination.Item>
                  )}
                <Pagination.Next disabled={page === totalPages} onClick={() => handlePageChange(page + 1)} />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
