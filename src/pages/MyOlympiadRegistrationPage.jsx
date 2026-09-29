// src/pages/MyOlympiadRegistrationPage.jsx
// Миний сурагчийн нэг олимпиадын бүртгэл: мэдээлэл, хуваарь, төлбөр

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import PaymentModal from '../components/PaymentModal';
import { getMeRegistration, payRegistration, fmtDate, REG_STATUS } from '../services/olympiadService';

function MyOlympiadRegistrationPage() {
  const { id } = useParams();
  const [reg, setReg] = useState(null);
  const [error, setError] = useState(null);
  const [payment, setPayment] = useState(null);

  const load = useCallback(() => {
    getMeRegistration(id).then(setReg).catch(() => setError('Бүртгэл олдсонгүй'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!reg) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  const o = reg.olympiad;
  const fee = Number(reg.fee || 0);

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/my-olympiads" className="small">← Миний олимпиадууд</Link>
      <h3 className="mt-2 mb-0">{o.title}</h3>
      <div className="text-muted mb-3">{reg.student_name}{reg.last_name_latin ? ` · ${reg.last_name_latin} ${reg.first_name_latin}` : ''}</div>

      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <Badge bg={REG_STATUS[reg.status][0]}>{REG_STATUS[reg.status][1]}</Badge>
            {reg.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
            {reg.participant_no && <span className="ms-2">Оролцогчийн дугаар: <strong>{reg.participant_no}</strong></span>}
          </div>
          {reg.status === 'PENDING' && fee > 0 && (
            <Button size="sm" onClick={async () => setPayment(await payRegistration(reg.id))}>
              Бүртгэлийн хураамж төлөх ({fee.toLocaleString()}₮)
            </Button>
          )}
        </Card.Body>
        <Table size="sm" className="mb-0">
          <tbody>
            <tr><td className="text-muted">MMO ID</td><td>{reg.mmo_id ?? '-'}</td></tr>
            <tr><td className="text-muted">Анги / ангилал</td><td>{reg.grade_label || reg.olympiad_category_name || '-'}</td></tr>
            <tr><td className="text-muted">Сургууль</td><td>{reg.school}</td></tr>
            <tr><td className="text-muted">Шалгалт</td><td>{fmtDate(o.exam_start)}{o.venue ? ` · ${o.venue}` : ''}</td></tr>
          </tbody>
        </Table>
      </Card>

      {o.schedule?.length > 0 && (
        <Card className="mb-3">
          <Card.Header>Хуваарь</Card.Header>
          <Table size="sm" className="mb-0">
            <tbody>
              {o.schedule.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.starts_at)}{s.ends_at ? ` – ${fmtDate(s.ends_at)}` : ''}</td>
                  <td><strong>{s.title}</strong>{s.description && <div className="small text-muted">{s.description}</div>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Link to={`/olympiads/${o.slug}`} className="small">Олимпиадын танилцуулга →</Link>

      <PaymentModal
        show={!!payment}
        paymentData={payment}
        localInvoiceId={payment?.local_invoice_id}
        amount={fee}
        title="Бүртгэлийн хураамж төлөх"
        successMessage="Төлбөр амжилттай төлөгдлөө, бүртгэл баталгаажлаа."
        onClose={() => { setPayment(null); load(); }}
      />
    </Container>
  );
}

export default MyOlympiadRegistrationPage;
