// src/pages/OlympiadsAdminListPage.jsx
// Админ: бүх олимпиадын удирдлагын жагсаалт (нийтлээгүйг оруулаад)

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { getOlympiads, deleteOlympiad, fmtDate } from '../services/olympiadService';

function OlympiadsAdminListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(
    () => getOlympiads()
      .then(setItems)
      .catch(() => setError('Олимпиадын жагсаалт татахад алдаа гарлаа'))
      .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => { load(); }, [load]);

  const remove = async (o) => {
    const hasRegs = o.has_registrations;  // сервер төлөгдөөгүй, цуцлагдсан бүртгэлийг ч тооцож нууна
    const ok = window.confirm(
      hasRegs
        ? `"${o.title}" олимпиадад бүртгэлтэй хэрэглэгч байгаа тул устгахгүй, зөвхөн нууна. Үргэлжлүүлэх үү?`
        : `"${o.title}" олимпиадыг бүр мөсөн устгах уу?`,
    );
    if (!ok) return;
    try {
      const r = await deleteOlympiad(o.slug);
      setMsg(r.deleted ? 'Олимпиад устгагдлаа.' : 'Бүртгэлтэй тул олимпиадыг нууллаа (Ноорог болсон).');
      await load();
    } catch {
      setError('Устгахад алдаа гарлаа');
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/admin" className="small">← Admin Dashboard</Link>
      <div className="d-flex justify-content-between align-items-center mt-2 mb-3">
        <h3 className="mb-0">Олимпиад удирдлага</h3>
        <Button as={Link} to="/admin/olympiads/new" variant="success">+ Олимпиад үүсгэх</Button>
      </div>
      {msg && <Alert variant="success" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Table hover responsive size="sm" className="align-middle">
        <thead>
          <tr><th>Нэр</th><th>Шалгалт</th><th>Бүртгэл</th><th>Төлбөр</th><th>Оролцогч</th><th>Төлөв</th><th /></tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id}>
              <td><Link to={`/olympiads/${o.slug}`}>{o.title}</Link></td>
              <td>{fmtDate(o.exam_start)}</td>
              <td className="small">{fmtDate(o.registration_start)} – {fmtDate(o.registration_end)}</td>
              <td>{Number(o.fee) > 0 ? `${Number(o.fee).toLocaleString()}₮` : 'Үнэгүй'}</td>
              <td>{o.registered_count}</td>
              <td>{!o.is_published && <Badge bg="warning" text="dark" className="me-1">Ноорог</Badge>}<Badge bg={o.registration_open ? 'success' : 'secondary'}>{o.registration_open ? 'Нээлттэй' : 'Хаалттай'}</Badge></td>
              <td className="text-nowrap">
                <Button as={Link} to={`/olympiads/${o.slug}/roster`} size="sm" variant="outline-secondary" className="me-1">Бүртгэл</Button>
                <Button as={Link} to={`/admin/olympiads/${o.slug}`} size="sm" variant="outline-dark" className="me-1">Админ</Button>
                <Button as={Link} to={`/admin/olympiads/${o.slug}/edit`} size="sm" variant="outline-primary" className="me-1">Засах</Button>
                {o.is_published || !o.has_registrations ? (
                  <Button size="sm" variant="outline-danger" onClick={() => remove(o)}>
                    {o.has_registrations ? 'Нуух' : 'Устгах'}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!error && items.length === 0 && <Alert variant="info">Олимпиад үүсээгүй байна.</Alert>}
    </Container>
  );
}

export default OlympiadsAdminListPage;
