// src/pages/OlympiadDetailPage.jsx
// Олимпиадын мэдээлэл, хуваарь, бүртгэл, төлбөр

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Table, Form, Button, ButtonGroup, ToggleButton, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import PaymentModal from '../components/PaymentModal';
import { getOlympiad, getOlympiadMyRegistrations, approveRegistration, registerForOlympiad, payRegistration, getPrefill, getProvinces, fmtDate } from '../services/olympiadService';
import { toLatin, LATIN_NAME_RE } from '../utils/transliterate';

const EMPTY_FORM = {
  register_for: 'self', mmo_id: '', waive_fee: false, category_id: '', last_name: '', first_name: '',
  last_name_latin: '', first_name_latin: '', province: '', school: '', grade: '', phone: '', email: '',
};

// Кирилл нэр өөрчлөгдөхөд латиныг дагуулж шинэчилнэ — хэрэглэгч латиныг гараар засаагүй бол.
const syncLatin = (prev, next) => {
  const auto = (k) => !prev[`${k}_latin`] || prev[`${k}_latin`] === toLatin(prev[k]);
  return {
    ...next,
    last_name_latin: auto('last_name') ? toLatin(next.last_name) : next.last_name_latin,
    first_name_latin: auto('first_name') ? toLatin(next.first_name) : next.first_name_latin,
  };
};

const GRADE_OPTIONS = [
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}-р анги` })),
  { value: 'TEAM_TEACHER', label: 'Багийн багш' },
  { value: 'SHARED_TEACHER', label: 'Дундын багш' },
  { value: 'FREE', label: 'Чөлөөт' },
];

// Сурагчийн анги сонгосон ангилалын хязгаарт орох эсэх. Зөрвөл тайлбар, таарвал ''.
const gradeMismatch = (cat, grade) => {
  if (!cat || cat.grade_from === null || !/^\d+$/.test(String(grade))) return '';
  const g = Number(grade);
  return g >= cat.grade_from && g <= cat.grade_to
    ? '' : `${g}-р анги «${cat.name}» ангилалд (${cat.grade_from}–${cat.grade_to}-р анги) тохирохгүй байна.`;
};

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
  const [myRegs, setMyRegs] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await getOlympiad(slug);
      setOlympiad(data);
      getOlympiadMyRegistrations(slug).then(setMyRegs).catch(() => setMyRegs([]));
      const r = data.my_registration;
      // «Өөр сурагч» горимд өөрийн мэдээллээр анкетыг бөглөхгүй (mmo_id бөглөгдвөл өөрийгөө бүртгэнэ)
      if (r) {
        setForm((f) => (f.register_for === 'other' ? f : {
          ...f, category_id: r.olympiad_category ? String(r.olympiad_category) : '', last_name: r.last_name, first_name: r.first_name,
          last_name_latin: r.last_name_latin || '', first_name_latin: r.first_name_latin || '', province: r.province,
          school: r.school, grade: r.category === 'STUDENT' ? String(r.grade ?? '') : r.category, phone: r.phone || '', email: r.email || '',
        }));
      }
      // Нэвтэрсэн хэрэглэгчийн профайлаар зөвхөн хоосон талбарыг нөхнө
      getPrefill().then((p) => setForm((f) => (f.register_for === 'other' ? f : syncLatin(f, {
        ...f,
        mmo_id: f.mmo_id || p.mmo_id || '',
        last_name: f.last_name || p.last_name || '',
        first_name: f.first_name || p.first_name || '',
        province: f.province || p.province || '',
        school: f.school || p.school || '',
        phone: f.phone || p.phone || '',
        email: f.email || p.email || '',
        grade: f.grade || p.grade || '',
      })))).catch(() => {});
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

  const approve = async (r) => {
    if (!window.confirm(`${r.full_name}-ийн бүртгэлийг төлбөрөөс чөлөөлж баталгаажуулах уу?`)) return;
    setError(null);
    try {
      await approveRegistration(r.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Баталгаажуулахад алдаа гарлаа');
    }
  };

  const fillFromMmo = async () => {
    setFilling(true);
    setError(null);
    setInfo(null);
    try {
      const p = await getPrefill(form.mmo_id);
      // Ирээгүй мэдээллийг хоосон харуулна (өмнөх хүний мэдээлэл үлдэхгүй)
      setForm((f) => syncLatin(f, {
        ...f,
        last_name: p.last_name || '',
        first_name: p.first_name || '',
        province: p.province || '',
        school: p.school || '',
        phone: p.phone || '',
        email: p.email || '',
        grade: p.grade || '',
      }));
      const mismatch = gradeMismatch(selectedCat, p.grade);
      if (mismatch) setForm((f) => ({ ...f, grade: '' }));
      const warn = [!p.email && 'Имэйл хаяг MMO-оос ирсэнгүй — гараар бөглөнө үү.',
        mismatch && `${mismatch} Ангиа эсвэл ангилалаа дахин сонгоно уу.`].filter(Boolean).join(' ');
      if (warn) setError(warn);
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
    const mismatch = gradeMismatch(selectedCat, form.grade);
    if (mismatch) {
      setError(mismatch);
      return;
    }
    if (!LATIN_NAME_RE.test(form.last_name_latin.trim()) || !LATIN_NAME_RE.test(form.first_name_latin.trim())) {
      setError('Латин овог, нэрийг зөвхөн латин үсгээр бичнэ үү.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form };
      if (!payload.mmo_id) delete payload.mmo_id;
      if (!payload.category_id) delete payload.category_id;
      if (!user?.is_staff) delete payload.waive_fee;
      if (noGrade) payload.grade = '';
      const r = await registerForOlympiad(slug, payload);
      await load();
      if (!r.is_mine) {
        setInfo(`${r.full_name} (№${r.participant_no ?? '-'}) бүртгэгдлээ. ${r.account_created
          ? 'Сурагчид MathMinds бүртгэл шинээр үүсгэлээ.' : 'Сурагчийн байгаа MathMinds бүртгэлтэй холбогдлоо.'}`);
      }
      if (r.status === 'PENDING' && fee > 0) await startPayment(r.id);
      else if (form.waive_fee) setInfo('Төлбөргүйгээр бүртгэгдэж, баталгаажлаа.');
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || (d && JSON.stringify(d)) || 'Бүртгэхэд алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setName = (k) => (e) => setForm((f) => syncLatin(f, { ...f, [k]: e.target.value }));

  // «Өөр сурагч» горимд өөрийн мэдээлэл үлдэхгүйгээр хоосон анкет; «Өөрийгөө» руу буцахад профайлаас дахин бөглөнө
  const setRegisterFor = (value) => {
    setError(null);
    setInfo(null);
    setForm((f) => ({ ...EMPTY_FORM, register_for: value, category_id: f.category_id }));
    if (value === 'self') load();
  };
  const forOther = form.register_for === 'other';
  const latinIsAuto = form.last_name_latin === toLatin(form.last_name) && form.first_name_latin === toLatin(form.first_name);

  const categories = olympiad?.categories || [];
  const selectedCat = categories.find((c) => String(c.id) === form.category_id);
  // Ангилал сонгосон бол сурагчийн анги зөвхөн тухайн хязгаарт
  const noGrade = !!selectedCat && selectedCat.grade_from === null; // багш, чөлөөт гэх мэт
  const gradeOptions = categories.length === 0 ? GRADE_OPTIONS
    : GRADE_OPTIONS.filter((o) => /^\d+$/.test(o.value)
        && (!selectedCat || (Number(o.value) >= selectedCat.grade_from && Number(o.value) <= selectedCat.grade_to)));
  const setCategory = (e) => {
    const cat = categories.find((c) => String(c.id) === e.target.value);
    const mismatch = gradeMismatch(cat, form.grade);
    setError(mismatch ? `${mismatch} Ангиа дахин сонгоно уу.` : null);
    const keep = cat && cat.grade_from !== null && !mismatch;
    setForm((f) => ({ ...f, category_id: e.target.value, grade: keep ? f.grade : '' }));
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!olympiad) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <Link to="/olympiads" className="small">← Бүх олимпиад</Link>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mt-2">
        <h3 className="mb-0">{olympiad.title}</h3>
        {user?.is_staff && (
          <div className="d-flex gap-2">
            <Button as={Link} to={`/admin/olympiads/${slug}/edit`} size="sm" variant="outline-primary">Засах</Button>
            <Button as={Link} to={`/admin/olympiads/${slug}`} size="sm" variant="outline-dark">Админ</Button>
          </div>
        )}
      </div>
      <div className="text-muted mb-3">
        {fmtDate(olympiad.exam_start)}{olympiad.venue ? ` · ${olympiad.venue}` : ''}
      </div>

      {olympiad.description && (
        <Card className="mb-3">
          <Card.Header>Олимпиадын танилцуулга</Card.Header>
          <Card.Body style={{ whiteSpace: 'pre-wrap' }}>{olympiad.description}</Card.Body>
        </Card>
      )}

      {categories.length > 0 && (
        <Card className="mb-3">
          <Card.Header>Оролцох ангилал</Card.Header>
          <Table size="sm" className="mb-0">
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td className="text-muted">
                    {c.grade_from === null ? 'Ангийн хязгааргүй'
                      : c.grade_from === c.grade_to ? `${c.grade_from}-р анги` : `${c.grade_from}–${c.grade_to}-р анги`}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {myRegs.length > 0 && (
        <Card className="mb-3">
          <Card.Header>Миний бүртгэл <small className="text-muted">({myRegs.length})</small></Card.Header>
          <Table size="sm" responsive className="mb-0 align-middle">
            <thead><tr><th>№</th><th>Овог нэр</th><th>Ангилал / Анги</th><th>Төлөв</th><th /></tr></thead>
            <tbody>
              {myRegs.map((r) => (
                <tr key={r.id}>
                  <td>{r.participant_no ?? '-'}</td>
                  <td>{r.full_name}{r.is_mine && <Badge bg="light" text="dark" className="ms-2">Би</Badge>}</td>
                  <td>{r.olympiad_category_name && r.olympiad_category_name !== r.grade_label
                    ? `${r.olympiad_category_name} · ${r.grade_label}` : (r.grade_label || r.olympiad_category_name || '-')}</td>
                  <td>
                    <Badge bg={STATUS_LABEL[r.status][0]}>{STATUS_LABEL[r.status][1]}</Badge>
                    {r.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                  </td>
                  <td className="text-end">
                    {user?.is_staff && r.status === 'PENDING' && (
                      <Button size="sm" variant="outline-success" className="me-1" onClick={() => approve(r)}>Батлах (төлбөргүй)</Button>
                    )}
                    {r.status === 'PENDING' && fee > 0 && (
                      <Button size="sm" onClick={() => startPayment(r.id)}>Төлбөр төлөх</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
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
                {reg.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                {reg.participant_no && <> · Дугаар: <strong>{reg.participant_no}</strong></>}
              </span>
              {reg.status === 'PENDING' && fee > 0 && (
                <Button size="sm" onClick={() => startPayment(reg.id)}>Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах</Button>
              )}
            </Alert>
          )}
          {olympiad.registration_open && user && (
            <ButtonGroup className="w-100 mb-3">
              {[['self', 'Өөрийгөө бүртгүүлэх'], ['other', 'Өөр сурагч бүртгүүлэх']].map(([value, label]) => (
                <ToggleButton key={value} id={`register-for-${value}`} type="radio" variant="outline-primary"
                              name="register-for" value={value} checked={form.register_for === value}
                              onChange={() => setRegisterFor(value)}>
                  {label}
                </ToggleButton>
              ))}
            </ButtonGroup>
          )}
          {forOther && olympiad.registration_open && (
            <Alert variant="light" className="border small">
              Бүртгүүлсэн сурагч бүрт MathMinds бүртгэл автоматаар үүснэ. Ижил имэйл, овог, нэртэй бүртгэл аль хэдийн
              байвал түүнийг ашиглана. Сурагч дараа нь энэ имэйлээр (Google эсвэл нууц үг сэргээх) нэвтэрнэ.
            </Alert>
          )}
          {reg?.status === 'PAID' && !forOther ? null : olympiad.registration_open ? (
            <Form onSubmit={submit}>
              <Row className="g-2">
                {categories.length > 0 && (
                  <Col md={12}>
                    <Form.Label>Оролцох ангилал</Form.Label>
                    <Form.Select required value={form.category_id} onChange={setCategory}>
                      <option value="">— Сонгоно уу —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.grade_from !== null && c.name !== (c.grade_from === c.grade_to ? `${c.grade_from}-р анги` : `${c.grade_from}–${c.grade_to}-р анги`) ? ` (${c.grade_from}–${c.grade_to}-р анги)` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
                {(!forOther || user?.is_staff) && (
                  <Col md={12}>
                    <Form.Label>MMO ID</Form.Label>
                    <div className="input-group">
                      <Form.Control type="number"
                                    placeholder={forOther ? 'Сурагчийн MMO ID (заавал биш)' : user?.is_staff ? 'Өөр хэрэглэгчийг MMO ID-аар бүртгэх' : 'Өөрийн MMO ID'}
                                    value={form.mmo_id} onChange={set('mmo_id')} />
                      <Button variant="outline-secondary" type="button" onClick={fillFromMmo} disabled={filling}>
                        {filling ? <Spinner size="sm" animation="border" /> : 'Мэдээлэл татах'}
                      </Button>
                    </div>
                  </Col>
                )}
                <Col md={6}>
                  <Form.Label>Овог</Form.Label>
                  <Form.Control required value={form.last_name} onChange={setName('last_name')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Нэр</Form.Label>
                  <Form.Control required value={form.first_name} onChange={setName('first_name')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Овог (латинаар)</Form.Label>
                  <Form.Control required placeholder="Жишээ: Batbold" value={form.last_name_latin} onChange={set('last_name_latin')}
                                isInvalid={!!form.last_name_latin && !LATIN_NAME_RE.test(form.last_name_latin.trim())} />
                  <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Нэр (латинаар)</Form.Label>
                  <Form.Control required placeholder="Жишээ: Munkh-Erdene" value={form.first_name_latin} onChange={set('first_name_latin')}
                                isInvalid={!!form.first_name_latin && !LATIN_NAME_RE.test(form.first_name_latin.trim())} />
                  <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                </Col>
                <Col md={12}>
                  <Alert variant="warning" className="py-2 px-3 mb-1 small">
                    <strong>⚠️ Латин нэрээ заавал шалгана уу.</strong> Зарим сертификат дээр нэр латинаар бичигдэнэ.
                    {latinIsAuto && form.last_name && ' Кирилл нэрээс автоматаар үүсгэсэн —'} Паспорт эсвэл төрсний
                    гэрчилгээтэйгээ тулгаж, зөрвөл засна уу.
                  </Alert>
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
                {!noGrade && (
                  <Col md={4}>
                    <Form.Label>{categories.length > 0 ? 'Анги' : 'Анги / Ангилал'}</Form.Label>
                    <Form.Select required value={form.grade} onChange={set('grade')}>
                      <option value="">— Сонгоно уу —</option>
                      {gradeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Form.Select>
                  </Col>
                )}
                <Col md={6}>
                  <Form.Label>Утас</Form.Label>
                  <Form.Control required type="tel" value={form.phone} onChange={set('phone')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Имэйл хаяг</Form.Label>
                  <Form.Control required type="email" value={form.email} onChange={set('email')} />
                </Col>
                {user?.is_staff && fee > 0 && (
                  <Col md={12}>
                    <Form.Check
                      type="switch" id="waive-fee" checked={form.waive_fee}
                      onChange={(e) => setForm((f) => ({ ...f, waive_fee: e.target.checked }))}
                      label="Төлбөргүй бүртгэх (админ) — хураамж төлөхгүйгээр шууд баталгаажуулна"
                    />
                  </Col>
                )}
                <Col md={12} className="pt-2">
                  <Button type="submit" disabled={busy} className="w-100">
                    {busy ? <Spinner size="sm" animation="border" /> : fee > 0 && !form.waive_fee ? 'Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах' : 'Бүртгүүлэх'}
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
