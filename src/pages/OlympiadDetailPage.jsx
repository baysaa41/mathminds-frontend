// src/pages/OlympiadDetailPage.jsx
// Олимпиадын мэдээлэл, хуваарь, бүртгэл, төлбөр

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Table, Form, Button, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import PaymentModal from '../components/PaymentModal';
import { getOlympiad, registerForOlympiad, payRegistration, fmtDate } from '../services/olympiadService';

const STATUS_LABEL = {
  PENDING: ['warning', 'Төлбөр хүлээгдэж буй'],
  PAID: ['success', 'Бүртгэл баталгаажсан'],
  CANCELED: ['secondary', 'Цуцлагдсан'],
};

function OlympiadDetailPage() {
  const { slug } = useParams();
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ full_name: '', school: '', grade: 10, phone: '' });
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getOlympiad(slug);
      setOlympiad(data);
      if (data.my_registration) {
        const { full_name, school, grade, phone } = data.my_registration;
        setForm({ full_name, school, grade, phone: phone || '' });
      }
    } catch {
      setError('Олимпиад олдсонгүй');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const reg = olympiad?.my_registration;
  const fee = Number(olympiad?.fee || 0);

  const startPayment = async (registrationId) => {
    const data = await payRegistration(registrationId);
    setPayment(data);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await registerForOlympiad(slug, { ...form, grade: Number(form.grade) });
      await load();
      if (r.status === 'PENDING' && fee > 0) await startPayment(r.id);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || (d && JSON.stringify(d)) || 'Бүртгэхэд алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!olympiad) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <Link to="/olympiads" className="small">← Бүх олимпиад</Link>
      <h3 className="mt-2">{olympiad.title}</h3>
      <div className="text-muted mb-3">
        {fmtDate(olympiad.exam_start)}{olympiad.venue ? ` · ${olympiad.venue}` : ''}
      </div>

      {olympiad.description && (
        <Card className="mb-3"><Card.Body style={{ whiteSpace: 'pre-wrap' }}>{olympiad.description}</Card.Body></Card>
      )}

      <Card className="mb-3">
        <Card.Header>Хуваарь</Card.Header>
        <Table size="sm" className="mb-0">
          <tbody>
            <tr><td>Бүртгэл</td><td>{fmtDate(olympiad.registration_start)} – {fmtDate(olympiad.registration_end)}</td></tr>
            {olympiad.schedule.map((s) => (
              <tr key={s.id}>
                <td>{fmtDate(s.starts_at)}{s.ends_at ? ` – ${fmtDate(s.ends_at)}` : ''}</td>
                <td><strong>{s.title}</strong>{s.description && <div className="small text-muted">{s.description}</div>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between">
          <span>Бүртгэл</span>
          <span>{fee > 0 ? `Төлбөр: ${fee.toLocaleString()}₮` : 'Үнэгүй'}</span>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {reg && (
            <Alert variant={STATUS_LABEL[reg.status][0]} className="d-flex justify-content-between align-items-center">
              <span>
                <Badge bg={STATUS_LABEL[reg.status][0]}>{STATUS_LABEL[reg.status][1]}</Badge>
                {reg.participant_no && <> · Дугаар: <strong>{reg.participant_no}</strong></>}
              </span>
              {reg.status === 'PENDING' && fee > 0 && (
                <Button size="sm" onClick={() => startPayment(reg.id)}>Төлбөр төлөх (QPay)</Button>
              )}
            </Alert>
          )}
          {reg?.status === 'PAID' ? null : olympiad.registration_open ? (
            <Form onSubmit={submit}>
              <Row className="g-2">
                <Col md={6}><Form.Control required placeholder="Овог нэр" value={form.full_name} onChange={set('full_name')} /></Col>
                <Col md={6}><Form.Control required placeholder="Сургууль" value={form.school} onChange={set('school')} /></Col>
                <Col md={3}><Form.Control required type="number" min={1} max={12} placeholder="Анги" value={form.grade} onChange={set('grade')} /></Col>
                <Col md={5}><Form.Control placeholder="Утас" value={form.phone} onChange={set('phone')} /></Col>
                <Col md={4}>
                  <Button type="submit" disabled={busy} className="w-100">
                    {busy ? <Spinner size="sm" animation="border" /> : fee > 0 ? 'Бүртгүүлж төлөх' : 'Бүртгүүлэх'}
                  </Button>
                </Col>
              </Row>
            </Form>
          ) : (
            <Alert variant="secondary" className="mb-0">Бүртгэлийн хугацаа дууссан эсвэл эхлээгүй байна.</Alert>
          )}
        </Card.Body>
      </Card>

      <Button as={Link} to={`/olympiads/${slug}/roster`} variant="outline-secondary">Бүртгэлийн жагсаалт харах</Button>

      <PaymentModal
        show={!!payment}
        paymentData={payment}
        localInvoiceId={payment?.local_invoice_id}
        onClose={() => { setPayment(null); load(); }}
      />
    </Container>
  );
}

export default OlympiadDetailPage;
