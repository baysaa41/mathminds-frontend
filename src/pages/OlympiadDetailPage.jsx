// src/pages/OlympiadDetailPage.jsx
// Олимпиадын мэдээлэл, хуваарь, бүртгэл, төлбөр

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Table, Form, Button, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import PaymentModal from '../components/PaymentModal';
import { getOlympiad, registerForOlympiad, payRegistration, getPrefill, getProvinces, fmtDate } from '../services/olympiadService';

const EMPTY_FORM = {
  mmo_id: '', last_name: '', first_name: '', province: '', school: '', grade: '', phone: '', email: '',
};

const GRADE_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}-р анги` })),
  { value: 'TEAM_TEACHER', label: 'Багийн багш' },
  { value: 'SHARED_TEACHER', label: 'Дундын багш' },
  { value: 'FREE', label: 'Чөлөөт' },
];

const STATUS_LABEL = {
  PENDING: ['warning', 'Төлбөр хүлээгдэж буй'],
  PAID: ['success', 'Бүртгэл баталгаажсан'],
  CANCELED: ['secondary', 'Цуцлагдсан'],
};

function OlympiadDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [info, setInfo] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [filling, setFilling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getOlympiad(slug);
      setOlympiad(data);
      const r = data.my_registration;
      if (r) {
        setForm((f) => ({
          ...f, last_name: r.last_name, first_name: r.first_name, province: r.province,
          school: r.school, grade: r.category === 'STUDENT' ? String(r.grade ?? '') : r.category, phone: r.phone || '', email: r.email || '',
        }));
      }
      // Нэвтэрсэн хэрэглэгчийн профайлаар зөвхөн хоосон талбарыг нөхнө
      getPrefill().then((p) => setForm((f) => ({
        ...f,
        mmo_id: f.mmo_id || p.mmo_id || '',
        last_name: f.last_name || p.last_name || '',
        first_name: f.first_name || p.first_name || '',
        province: f.province || p.province || '',
        school: f.school || p.school || '',
        phone: f.phone || p.phone || '',
        email: f.email || p.email || '',
        grade: f.grade || p.grade || '',
      }))).catch(() => {});
    } catch {
      setError('Олимпиад олдсонгүй');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getProvinces().then(setProvinces).catch(() => {}); }, []);

  const reg = olympiad?.my_registration;
  const fee = Number(olympiad?.fee || 0);

  const startPayment = async (registrationId) => {
    const data = await payRegistration(registrationId);
    setPayment(data);
  };

  const fillFromMmo = async () => {
    setFilling(true);
    setError(null);
    setInfo(null);
    try {
      const p = await getPrefill(form.mmo_id);
      // Ирээгүй мэдээллийг хоосон харуулна (өмнөх хүний мэдээлэл үлдэхгүй)
      setForm((f) => ({
        ...f,
        last_name: p.last_name || '',
        first_name: p.first_name || '',
        province: p.province || '',
        school: p.school || '',
        phone: p.phone || '',
        email: p.email || '',
        grade: p.grade || '',
      }));
      if (!p.email) setError('Имэйл хаяг MMO-оос ирсэнгүй — гараар бөглөнө үү.');
      setInfo(p.last_name || p.first_name
        ? `${p.source === 'mmo' ? 'MMO' : 'MathMinds'} бүртгэлээс бөглөлөө: ${p.last_name} ${p.first_name}`
        : 'Хэрэглэгч олдсон боловч нэр бөглөөгүй байна');
    } catch (err) {
      setError(err.response?.data?.error || 'MMO ID-аар хайхад алдаа гарлаа');
    } finally {
      setFilling(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.mmo_id) delete payload.mmo_id;
      const r = await registerForOlympiad(slug, payload);
      await load();
      if (!r.is_mine) setInfo(`${r.full_name} (№${r.participant_no ?? '-'}) бүртгэгдлээ.`);
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
          {info && <Alert variant="info" dismissible onClose={() => setInfo(null)}>{info}</Alert>}
          {reg && (
            <Alert variant={STATUS_LABEL[reg.status][0]} className="d-flex justify-content-between align-items-center">
              <span>
                <Badge bg={STATUS_LABEL[reg.status][0]}>{STATUS_LABEL[reg.status][1]}</Badge>
                {reg.participant_no && <> · Дугаар: <strong>{reg.participant_no}</strong></>}
              </span>
              {reg.status === 'PENDING' && fee > 0 && (
                <Button size="sm" onClick={() => startPayment(reg.id)}>Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах</Button>
              )}
            </Alert>
          )}
          {reg?.status === 'PAID' ? null : olympiad.registration_open ? (
            <Form onSubmit={submit}>
              <Row className="g-2">
                <Col md={12}>
                  <Form.Label>MMO ID</Form.Label>
                  <div className="input-group">
                    <Form.Control type="number" placeholder={user?.is_staff ? 'Өөр хэрэглэгчийг MMO ID-аар бүртгэх' : 'Өөрийн MMO ID'}
                                  value={form.mmo_id} onChange={set('mmo_id')} />
                    <Button variant="outline-secondary" type="button" onClick={fillFromMmo} disabled={filling}>
                      {filling ? <Spinner size="sm" animation="border" /> : 'Бөглөх'}
                    </Button>
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label>Овог</Form.Label>
                  <Form.Control required value={form.last_name} onChange={set('last_name')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Нэр</Form.Label>
                  <Form.Control required value={form.first_name} onChange={set('first_name')} />
                </Col>
                <Col md={12}>
                  <Form.Label>Аймаг / Дүүрэг</Form.Label>
                  {provinces.length > 0 ? (
                    <Form.Select required value={form.province} onChange={set('province')}>
                      <option value="">— Сонгоно уу —</option>
                      {form.province && !provinces.includes(form.province) && (
                        <option value={form.province}>{form.province}</option>
                      )}
                      {provinces.map((n) => <option key={n} value={n}>{n}</option>)}
                    </Form.Select>
                  ) : (
                    <Form.Control required placeholder="Аймаг эсвэл дүүргийн нэр" value={form.province} onChange={set('province')} />
                  )}
                </Col>
                <Col md={8}>
                  <Form.Label>Сургууль</Form.Label>
                  <Form.Control required value={form.school} onChange={set('school')} />
                </Col>
                <Col md={4}>
                  <Form.Label>Анги / Ангилал</Form.Label>
                  <Form.Select required value={form.grade} onChange={set('grade')}>
                    <option value="">— Сонгоно уу —</option>
                    {GRADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Form.Select>
                </Col>
                <Col md={6}>
                  <Form.Label>Утас</Form.Label>
                  <Form.Control required type="tel" value={form.phone} onChange={set('phone')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Имэйл хаяг</Form.Label>
                  <Form.Control required type="email" value={form.email} onChange={set('email')} />
                </Col>
                <Col md={12} className="pt-2">
                  <Button type="submit" disabled={busy} className="w-100">
                    {busy ? <Spinner size="sm" animation="border" /> : fee > 0 ? 'Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах' : 'Бүртгүүлэх'}
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
        amount={fee}
        title="Бүртгэлийн хураамж төлөх"
        successMessage="Төлбөр амжилттай төлөгдлөө, таны бүртгэл баталгаажлаа."
        onClose={() => { setPayment(null); load(); }}
      />
    </Container>
  );
}

export default OlympiadDetailPage;
