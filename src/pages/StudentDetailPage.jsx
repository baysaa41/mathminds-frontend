// src/pages/StudentDetailPage.jsx
// Сурагчийн мэдээлэл (claim хийгээгүй бол засна) болон олимпиадын бүртгэлүүд

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Table, Form, Button, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import RegistrationPayment from '../components/RegistrationPayment';
import useSiteGrades from '../hooks/useSiteGrades';
import { apiErrorText, getStudent, updateStudent, paymentRequestFor, transferUnderReview, resendRegistrationLink, REG_STATUS } from '../services/olympiadService';
import { LATIN_NAME_RE } from '../utils/transliterate';

const FIELDS = [
  ['last_name', 'Овог', 6], ['first_name', 'Нэр', 6],
  ['last_name_latin', 'Овог (латинаар)', 6], ['first_name_latin', 'Нэр (латинаар)', 6],
  ['email', 'Имэйл', 6], ['phone', 'Утас', 6], ['school', 'Сургууль', 8], ['grade', 'Анги', 4],
];

function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [payReq, setPayReq] = useState(null);
  const siteGrades = useSiteGrades();

  const load = useCallback(async () => {
    try {
      const data = await getStudent(id);
      setStudent(data);
      setForm(Object.fromEntries(FIELDS.map(([k]) => [k, data[k] ?? ''])));
    } catch {
      setError('Сурагч олдсонгүй');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (![form.last_name_latin, form.first_name_latin].every((v) => !v.trim() || LATIN_NAME_RE.test(v.trim()))) {
      setError('Латин овог, нэрийг зөвхөн латин үсгээр бичнэ үү.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await updateStudent(id, { ...form, grade: form.grade === '' ? null : Number(form.grade) });
      setStudent(data);
      setEditing(false);
      setInfo('Хадгаллаа. Дараагийн бүртгэлүүдэд шинэ мэдээлэл ашиглагдана.');
    } catch (err) {
      const d = err.response?.data;
      setError(apiErrorText(d, 'Хадгалахад алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  const pay = (r) => setPayReq(paymentRequestFor(r));
  const resend = async (r) => {
    setError(null);
    try {
      const { sent_to: to } = await resendRegistrationLink(r.id);
      setInfo(`${to} хаяг руу шинэ link илгээлээ. Өмнөх link-үүд хүчингүй боллоо.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Link илгээхэд алдаа гарлаа');
    }
  };

  if (!student) {
    return <Container className="py-4">{error ? <Alert variant="danger">{error}</Alert> : <Spinner animation="border" />}</Container>;
  }

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/my-students" className="small">← Миний сурагчид</Link>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mt-2 mb-3">
        <div>
          <h3 className="mb-0">{student.full_name}</h3>
          <div className="text-muted small">
            {[student.last_name_latin && `${student.last_name_latin} ${student.first_name_latin}`, student.grade && student.grade_label, student.school, student.mmo_id && `MMO ID: ${student.mmo_id}`]
              .filter(Boolean).join(' · ')}
          </div>
        </div>
        {student.has_account
          ? <Badge bg="success">Сурагч account-даа холбосон</Badge>
          : <Badge bg="light" text="dark" className="border">Account-д холбогдоогүй</Badge>}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {info && <Alert variant="info" dismissible onClose={() => setInfo(null)}>{info}</Alert>}

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Сурагчийн мэдээлэл</span>
          {student.can_edit && !editing && <Button size="sm" variant="outline-primary" onClick={() => setEditing(true)}>Засах</Button>}
        </Card.Header>
        <Card.Body>
          {!student.can_edit && (
            <div className="small text-muted mb-2">Сурагч өөрийн account-тай холбогдсон тул мэдээллээ зөвхөн өөрөө засна.</div>
          )}
          <Form onSubmit={save}>
            <Row className="g-2">
              {FIELDS.map(([k, label, md]) => (
                <Col md={md} key={k}>
                  <Form.Label className="small mb-0">{label}</Form.Label>
                  {k === 'grade' ? (
                    <Form.Select disabled={!editing} value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}>
                      <option value="">—</option>
                      {siteGrades.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </Form.Select>
                  ) : (
                    <Form.Control disabled={!editing} type={k === 'email' ? 'email' : 'text'} value={form[k]}
                                  required={['last_name', 'first_name', 'email'].includes(k)}
                                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
                  )}
                </Col>
              ))}
              {editing && (
                <Col md={12} className="d-flex gap-2 pt-2">
                  <Button type="submit" disabled={busy}>{busy ? <Spinner size="sm" animation="border" /> : 'Хадгалах'}</Button>
                  <Button variant="outline-secondary" onClick={() => { setEditing(false); load(); }}>Болих</Button>
                </Col>
              )}
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Олимпиадын бүртгэлүүд <small className="text-muted">({student.registrations.length})</small></Card.Header>
        <Table responsive size="sm" className="mb-0 align-middle">
          <thead><tr><th>Олимпиад</th><th>№</th><th>Анги / Ангилал</th><th>Төлөв</th><th /></tr></thead>
          <tbody>
            {student.registrations.map((r) => (
              <tr key={r.id}>
                <td><Link to={`/olympiads/${r.olympiad_slug}`}>{r.olympiad_title}</Link></td>
                <td>{r.participant_no ?? '-'}</td>
                <td>{r.grade_label || r.olympiad_category_name || '-'}</td>
                <td>
                  <Badge bg={REG_STATUS[r.status][0]}>{REG_STATUS[r.status][1]}</Badge>
                  {r.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                </td>
                <td className="text-end">
                  {!student.has_account && (
                    <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => resend(r)}>Link дахин илгээх</Button>
                  )}
                  {r.status === 'PENDING' && Number(r.fee) > 0 && (transferUnderReview(r)
                    ? <Badge bg="info">Дансаар: шалгаж буй</Badge>
                    : <Button size="sm" onClick={() => pay(r)}>Төлбөр төлөх</Button>)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <RegistrationPayment request={payReq} onClose={() => setPayReq(null)} onChanged={load} />
    </Container>
  );
}

export default StudentDetailPage;
