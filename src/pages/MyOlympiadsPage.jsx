// src/pages/MyOlympiadsPage.jsx
// Миний (account-д нэмсэн) сурагчдын олимпиадын бүртгэлүүд — эцэг эх бол хүүхэд бүрээр бүлэглэнэ

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { getMeRegistrations, fmtRange, REG_STATUS } from '../services/olympiadService';

function MyOlympiadsPage() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMeRegistrations().then(setGroups).catch(() => setError('Бүртгэлүүдийг ачаалж чадсангүй'));
  }, []);

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!groups) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <h3 className="mb-3">Миний олимпиадууд</h3>
      {groups.every((g) => g.registrations.length === 0) && (
        <Alert variant="light" className="border">
          Одоогоор олимпиадын бүртгэл алга. Багш эсвэл эцэг эх таныг бүртгүүлсэн бол имэйлээр ирсэн link-ийг нээж
          бүртгэлээ account-даа нэмнэ үү. Эсвэл <Link to="/olympiads">олимпиадууд</Link> хэсгээс өөрөө бүртгүүлнэ.
        </Alert>
      )}
      {groups.filter((g) => g.registrations.length > 0).map((g) => (
        <Card key={g.student_id} className="mb-3">
          <Card.Header className="fw-semibold">
            {g.full_name} {g.is_self && <Badge bg="light" text="dark" className="border ms-1">Би</Badge>}
          </Card.Header>
          <ListGroup variant="flush">
            {g.registrations.map((r) => (
              <ListGroup.Item key={r.id} action as={Link} to={`/my-olympiads/${r.id}`}
                              className="d-flex justify-content-between align-items-center">
                <div>
                  <div>{r.olympiad_title}</div>
                  <div className="small">
                    📅 {fmtRange(r.exam_start, r.exam_end)}
                    {new Date(r.exam_end || r.exam_start) < new Date() && <span className="text-muted"> · Дууссан</span>}
                  </div>
                  <div className="small text-muted">
                    {[r.olympiad_category_name, r.grade && r.grade_label].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <Badge bg={REG_STATUS[r.status][0]}>{REG_STATUS[r.status][1]}</Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      ))}
    </Container>
  );
}

export default MyOlympiadsPage;
