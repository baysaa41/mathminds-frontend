// src/pages/MyStudentsPage.jsx
// Миний бүртгүүлсэн (эсвэл эзэмшдэг) олимпиадын сурагчид, тэдний бүртгэлүүд

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { getMyStudents, REG_STATUS } from '../services/olympiadService';

function MyStudentsPage() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    getMyStudents().then(setStudents).catch(() => setError('Сурагчдын жагсаалтыг ачаалж чадсангүй'));
  }, []);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (students || []).filter((st) => !s
      || `${st.full_name} ${st.email} ${st.school}`.toLowerCase().includes(s)
      || st.registrations.some((r) => r.olympiad_title.toLowerCase().includes(s)));
  }, [students, q]);

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!students) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h3 className="mb-0">Миний сурагчид <small className="text-muted">({students.length})</small></h3>
        <Link to="/olympiads" className="btn btn-primary btn-sm">Олимпиадад бүртгүүлэх</Link>
      </div>
      {students.length === 0 ? (
        <Alert variant="light" className="border">
          Та одоогоор сурагч бүртгүүлээгүй байна. Олимпиадын хуудас дээр «Өөр сурагч бүртгүүлэх»-ийг сонгоно уу.
        </Alert>
      ) : (
        <Card>
          <Card.Body className="pb-0">
            <Form.Control placeholder="Нэр, имэйл, сургууль, олимпиадаар хайх" value={q} onChange={(e) => setQ(e.target.value)} />
          </Card.Body>
          <Table responsive hover className="mb-0 mt-3 align-middle">
            <thead>
              <tr><th>Овог нэр</th><th>Анги · Сургууль</th><th>Олимпиадууд</th><th>Account</th></tr>
            </thead>
            <tbody>
              {rows.map((st) => (
                <tr key={st.id}>
                  <td>
                    <Link to={`/my-students/${st.id}`} className="fw-semibold">{st.full_name}</Link>
                    <div className="small text-muted">{st.email}</div>
                  </td>
                  <td className="small">{[st.grade && `${st.grade}-р анги`, st.school].filter(Boolean).join(' · ') || '-'}</td>
                  <td className="small">
                    {st.registrations.map((r) => (
                      <div key={r.id}>
                        {r.olympiad_title} <Badge bg={REG_STATUS[r.status][0]}>{REG_STATUS[r.status][1]}</Badge>
                      </div>
                    ))}
                  </td>
                  <td>{st.has_account
                    ? <Badge bg="success">Холбогдсон</Badge>
                    : <Badge bg="light" text="dark" className="border">Холбогдоогүй</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
}

export default MyStudentsPage;
