// src/pages/OlympiadRosterPage.jsx
// Бүртгүүлсэн оролцогчдын жагсаалт

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Table, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { getRoster } from '../services/olympiadService';
import { useAuth } from '../context/AuthContext';

function OlympiadRosterPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRoster(slug)
      .then(setRows)
      .catch(() => setError('Жагсаалт татахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => `${r.full_name} ${r.province} ${r.school}`.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <Link to={`/olympiads/${slug}`} className="small">← Олимпиад</Link>
      <h3 className="mt-2">Бүртгэлийн жагсаалт <small className="text-muted">({rows.length})</small></h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Control className="mb-3" placeholder="Нэр, сургуулиар хайх" value={q} onChange={(e) => setQ(e.target.value)} />
      <Table striped hover size="sm">
        <thead><tr><th>№</th><th>Овог нэр</th><th>Аймаг/Дүүрэг</th><th>Сургууль</th><th>Анги</th>{user?.is_staff && <th>Төлөв</th>}</tr></thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={`${r.participant_no}-${i}`}>
              <td>{r.participant_no ?? '-'}</td><td>{r.full_name}</td><td>{r.province}</td><td>{r.school}</td><td>{r.grade_label}</td>
              {user?.is_staff && <td><Badge bg={r.status === 'PAID' ? 'success' : 'warning'}>{r.status}</Badge></td>}
            </tr>
          ))}
        </tbody>
      </Table>
      {filtered.length === 0 && <Alert variant="info">Жагсаалт хоосон байна.</Alert>}
    </Container>
  );
}

export default OlympiadRosterPage;
