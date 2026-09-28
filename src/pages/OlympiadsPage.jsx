// src/pages/OlympiadsPage.jsx
// Олимпиадын жагсаалт

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { getOlympiads, fmtDate } from '../services/olympiadService';
import { useAuth } from '../context/AuthContext';

function OlympiadsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOlympiads()
      .then(setItems)
      .catch(() => setError('Олимпиадын жагсаалт татахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Олимпиад</h3>
        <div className="d-flex gap-2">
          <Link to="/my-olympiads" className="btn btn-outline-primary btn-sm">Миний олимпиадууд</Link>
          <Link to="/my-students" className="btn btn-outline-primary btn-sm">Миний сурагчид</Link>
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {!error && items.length === 0 && <Alert variant="info">Одоогоор зарлагдсан олимпиад байхгүй.</Alert>}
      {items.map((o) => (
        <Card key={o.id} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <Card.Title as="h5">
                  <Link to={`/olympiads/${o.slug}`} className="text-decoration-none">{o.title}</Link>
                </Card.Title>
                <div className="text-muted small">
                  Шалгалт: {fmtDate(o.exam_start)}{o.venue ? ` · ${o.venue}` : ''}
                </div>
                <div className="text-muted small">
                  Бүртгэл: {fmtDate(o.registration_start)} – {fmtDate(o.registration_end)}
                </div>
              </div>
              <div className="text-end">
                <Badge bg={o.registration_open ? 'success' : 'secondary'}>
                  {o.registration_open ? 'Бүртгэл нээлттэй' : 'Бүртгэл хаалттай'}
                </Badge>
                <div className="small mt-1">
                  {Number(o.fee) > 0 ? `${Number(o.fee).toLocaleString()}₮` : 'Үнэгүй'} · {o.registered_count} оролцогч
                </div>
              </div>
            </div>
            {o.categories?.length > 0 && (
              <div className="mt-2 d-flex flex-wrap gap-1 align-items-center">
                <span className="small text-muted me-1">Ангилал:</span>
                {o.categories.map((c) => (
                  <Badge key={c.id} bg="light" text="dark" className="border fw-normal">
                    {c.name}{c.grade_from !== null && c.name !== (c.grade_from === c.grade_to ? `${c.grade_from}-р анги` : `${c.grade_from}–${c.grade_to}-р анги`)
                      ? ` (${c.grade_from}–${c.grade_to}-р анги)` : ''}
                  </Badge>
                ))}
              </div>
            )}
            {o.description && (
              <div className="mt-2 small" style={{ whiteSpace: 'pre-wrap' }}>{o.description}</div>
            )}
            <div className="mt-3 d-flex gap-2">
              <Button as={Link} to={`/olympiads/${o.slug}`} size="sm" variant="primary">Дэлгэрэнгүй / Бүртгүүлэх</Button>
              <Button as={Link} to={`/olympiads/${o.slug}/roster`} size="sm" variant="outline-secondary">Бүртгэлийн жагсаалт</Button>
              {user?.is_staff && (
                <>
                  <Button as={Link} to={`/admin/olympiads/${o.slug}/edit`} size="sm" variant="outline-primary">Засах</Button>
                  <Button as={Link} to={`/admin/olympiads/${o.slug}`} size="sm" variant="outline-dark">Админ</Button>
                </>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
}

export default OlympiadsPage;
