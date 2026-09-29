// src/pages/MyStudentsPage.jsx
// Миний бүртгүүлсэн (эсвэл эзэмшдэг) олимпиадын сурагчид, тэдний бүртгэлүүд

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Table, Form, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import RegistrationPayment from '../components/RegistrationPayment';
import { getMyStudents, paymentRequestFor, transferUnderReview, REG_STATUS } from '../services/olympiadService';

// Дансаар шилжүүлээд шалгагдаж буйг дахин төлүүлэхгүй
const payable = (r) => r.status === 'PENDING' && Number(r.fee) > 0 && !transferUnderReview(r);

function MyStudentsPage() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(() => new Set());  // бөөнд төлөх бүртгэлийн id-ууд
  const [payReq, setPayReq] = useState(null);

  const load = useCallback(() => {
    getMyStudents().then(setStudents).catch(() => setError('Сурагчдын жагсаалтыг ачаалж чадсангүй'));
  }, []);
  useEffect(() => { load(); }, [load]);

  const allRegs = useMemo(() => (students || []).flatMap((st) => st.registrations), [students]);
  const payableRegs = allRegs.filter(payable);
  const selectedRegs = payableRegs.filter((r) => selected.has(r.id));
  const total = selectedRegs.reduce((sum, r) => sum + Number(r.fee), 0);
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(
    selectedRegs.length === payableRegs.length ? new Set() : new Set(payableRegs.map((r) => r.id)));

  // QPay (нэг нэхэмжлэх) эсвэл дансаар (нэг гүйлгээний утга) — RegistrationPayment сонгуулна
  const payBulk = () => setPayReq({ ...paymentRequestFor(selectedRegs), transferId: null });

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (students || []).filter((st) => !s
      || `${st.full_name} ${st.email} ${st.school}`.toLowerCase().includes(s)
      || st.registrations.some((r) => r.olympiad_title.toLowerCase().includes(s)));
  }, [students, q]);

  if (error && !students) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!students) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h3 className="mb-0">Миний сурагчид <small className="text-muted">({students.length})</small></h3>
        <Link to="/olympiads" className="btn btn-primary btn-sm">Олимпиадад бүртгүүлэх</Link>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {payableRegs.length > 0 && (
        <Alert variant="warning" className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            Төлбөр хүлээгдэж буй <strong>{payableRegs.length}</strong> бүртгэл.
            {' '}Сонгосон: <strong>{selectedRegs.length}</strong> · нийт <strong>{total.toLocaleString()}₮</strong>
          </div>
          <div className="d-flex gap-2">
            <Button size="sm" variant="outline-dark" onClick={toggleAll}>
              {selectedRegs.length === payableRegs.length ? 'Сонголтыг арилгах' : 'Бүгдийг сонгох'}
            </Button>
            <Button size="sm" disabled={!selectedRegs.length} onClick={payBulk}>
              {`Сонгосныг бөөнд төлөх (${total.toLocaleString()}₮)`}
            </Button>
          </div>
        </Alert>
      )}
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
                    <div className="small text-muted">{st.email}{st.mmo_id && ` · MMO ID: ${st.mmo_id}`}</div>
                  </td>
                  <td className="small">{[st.grade && st.grade_label, st.school].filter(Boolean).join(' · ') || '-'}</td>
                  <td className="small">
                    {st.registrations.map((r) => (
                      <div key={r.id} className="d-flex align-items-center gap-1">
                        {payable(r) && (
                          <Form.Check className="me-1" id={`pay-${r.id}`} checked={selected.has(r.id)}
                                      onChange={() => toggle(r.id)} aria-label="Бөөнд төлөхөд сонгох" />
                        )}
                        <span>{r.olympiad_title}{r.olympiad_category_name ? ` · ${r.olympiad_category_name}` : ''}</span>
                        <Badge bg={REG_STATUS[r.status][0]}>{REG_STATUS[r.status][1]}</Badge>
                        {transferUnderReview(r) && <Badge bg="info">Дансаар: шалгаж буй</Badge>}
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
      <RegistrationPayment request={payReq} onClose={() => { setPayReq(null); setSelected(new Set()); }} onChanged={load} />
    </Container>
  );
}

export default MyStudentsPage;
