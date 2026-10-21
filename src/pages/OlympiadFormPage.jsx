// src/pages/OlympiadFormPage.jsx
// Админ: олимпиад үүсгэх / засах (хуваарийн жагсаалттай)

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { apiErrorText, getOlympiad, createOlympiad, updateOlympiad } from '../services/olympiadService';

const CYR = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
const slugify = (t) =>
  t.toLowerCase().split('').map((c) => CYR[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ISO <-> <input type="datetime-local"> (хөтчийн орон нутгийн цаг)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const toIso = (local) => (local ? new Date(local).toISOString() : null);

const EMPTY = {
  title: '', slug: '', description: '', venue: '', contact_phone: '', registration_start: '', registration_end: '',
  exam_start: '', exam_end: '', fee: 0, problem_count: 6, is_published: false,
  bank_name: '', bank_account: '', bank_account_holder: '',
};
const EMPTY_CAT = { name: '', grade_from: 1, grade_to: 12 };
const NO_LIMIT_PRESETS = ['Бага ангийн багш', 'Дунд ангийн багш', 'Чөлөөт'];
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
// Нэр хоосон үед backend-тэй ижил дүрмээр автомат нэр
const autoName = (a, b) => (a === null || a === '' ? '' : (Number(a) === Number(b) ? `${a}-р анги` : `${a}–${b}-р анги`));
const EMPTY_ITEM = { starts_at: '', ends_at: '', title: '', description: '' };

function OlympiadFormPage() {
  const { slug: editSlug } = useParams();
  const navigate = useNavigate();
  const isEdit = !!editSlug;

  const [form, setForm] = useState(EMPTY);
  const [schedule, setSchedule] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getOlympiad(editSlug)
      .then((o) => {
        setForm({
          title: o.title, slug: o.slug, description: o.description, venue: o.venue, contact_phone: o.contact_phone || '',
          registration_start: toLocalInput(o.registration_start),
          registration_end: toLocalInput(o.registration_end),
          exam_start: toLocalInput(o.exam_start), exam_end: toLocalInput(o.exam_end),
          fee: o.fee, problem_count: o.problem_count, is_published: o.is_published,
          bank_name: o.bank_name || '', bank_account: o.bank_account || '', bank_account_holder: o.bank_account_holder || '',
        });
        setCategories((o.categories || []).map((c) => ({
          id: c.id, name: c.name, grade_from: c.grade_from, grade_to: c.grade_to,
          problem_count: c.problem_count ?? '',  // хоосон бол олимпиадын бодлогын тоо
        })));
        setSchedule(o.schedule.map((s) => ({
          starts_at: toLocalInput(s.starts_at), ends_at: toLocalInput(s.ends_at),
          title: s.title, description: s.description,
        })));
      })
      .catch(() => setErrors({ detail: 'Олимпиад олдсонгүй' }))
      .finally(() => setLoading(false));
  }, [editSlug, isEdit]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === 'title' && !slugTouched) next.slug = slugify(v);
      return next;
    });
    if (k === 'slug') setSlugTouched(true);
  };

  const setItem = (i, k) => (e) =>
    setSchedule((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: e.target.value } : r)));

  const setCat = (i, k) => (e) =>
    setCategories((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: e.target.value } : r)));

  const toggleLimit = (i) => (e) =>
    setCategories((rows) => rows.map((r, idx) => (idx === i
      ? { ...r, grade_from: e.target.checked ? 1 : null, grade_to: e.target.checked ? 12 : null } : r)));

  // Багш / чөлөөт гэх мэт ангийн хязгааргүй ангилалуудыг (байхгүйг нь) нэмнэ
  const addNoLimitPresets = () =>
    setCategories((rows) => [
      ...rows,
      ...NO_LIMIT_PRESETS.filter((n) => !rows.some((r) => r.name.trim() === n))
        .map((name) => ({ name, grade_from: null, grade_to: null })),
    ]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.exam_end && form.exam_start && form.exam_end < form.exam_start) {
      setErrors({ exam_end: 'Шалгалт дуусах нь эхлэхээс өмнө байж болохгүй' });
      return;
    }
    setSaving(true);
    setErrors(null);
    const payload = {
      ...form,
      fee: form.fee || 0,
      problem_count: Number(form.problem_count),
      registration_start: toIso(form.registration_start),
      registration_end: toIso(form.registration_end),
      exam_start: toIso(form.exam_start),
      exam_end: toIso(form.exam_end),
      categories: categories.map((c) => ({
        ...(c.id ? { id: c.id } : {}), name: c.name.trim(),
        grade_from: c.grade_from === null ? null : Number(c.grade_from),
        grade_to: c.grade_to === null ? null : Number(c.grade_to),
        problem_count: c.problem_count === '' || c.problem_count == null ? null : Number(c.problem_count),
      })),
      schedule: schedule.filter((s) => s.title && s.starts_at).map((s) => ({
        ...s, starts_at: toIso(s.starts_at), ends_at: toIso(s.ends_at),
      })),
    };
    try {
      const saved = isEdit ? await updateOlympiad(editSlug, payload) : await createOlympiad(payload);
      navigate(`/admin/olympiads/${saved.slug}`);
    } catch (err) {
      setErrors(err.response?.data || { detail: 'Хадгалахад алдаа гарлаа' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  const fieldErr = (k) => errors?.[k] && <div className="text-danger small">{[].concat(errors[k]).join(' ')}</div>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/admin/olympiads" className="small">← Олимпиад удирдлага</Link>
      <h3 className="mt-2 mb-3">{isEdit ? 'Олимпиад засах' : 'Шинэ олимпиад'}</h3>
      {errors?.detail && <Alert variant="danger">{errors.detail}</Alert>}

      <Form onSubmit={submit}>
        <Card className="mb-3">
          <Card.Body>
            <Row className="g-3">
              <Col md={8}>
                <Form.Label>Нэр</Form.Label>
                <Form.Control required value={form.title} onChange={set('title')} />
                {fieldErr('title')}
              </Col>
              <Col md={4}>
                <Form.Label>Slug (URL)</Form.Label>
                <Form.Control required value={form.slug} onChange={set('slug')} disabled={isEdit} pattern="[-a-zA-Z0-9_]+" />
                {fieldErr('slug')}
              </Col>
              <Col md={12}>
                <Form.Label>Мэдээлэл</Form.Label>
                <Form.Control as="textarea" rows={5} value={form.description} onChange={set('description')} />
              </Col>
              <Col md={12}>
                <Form.Label>Болох газар</Form.Label>
                <Form.Control value={form.venue} onChange={set('venue')} />
              </Col>
              <Col md={12}>
                <Form.Label>Холбоо барих утас</Form.Label>
                <Form.Control value={form.contact_phone} onChange={set('contact_phone')} placeholder="Жишээ: 9911 2233, 8800 1122" />
                <Form.Text muted>Бүртгэлийн хэсэгт харагдана. Хэд хэдэн дугаарыг таслалаар тусгаарлана.</Form.Text>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Хугацаа, төлбөр</Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Бүртгэл эхлэх</Form.Label>
                <Form.Control required type="datetime-local" value={form.registration_start} onChange={set('registration_start')} />
                {fieldErr('registration_start')}
              </Col>
              <Col md={6}>
                <Form.Label>Бүртгэл дуусах</Form.Label>
                <Form.Control required type="datetime-local" value={form.registration_end} onChange={set('registration_end')} />
                {fieldErr('registration_end')}
              </Col>
              <Col md={6}>
                <Form.Label>Шалгалт эхлэх</Form.Label>
                <Form.Control required type="datetime-local" value={form.exam_start} onChange={set('exam_start')} />
                {fieldErr('exam_start')}
              </Col>
              <Col md={6}>
                <Form.Label>Шалгалт дуусах</Form.Label>
                <Form.Control type="datetime-local" value={form.exam_end} onChange={set('exam_end')}
                              min={form.exam_start || undefined} isInvalid={!!errors?.exam_end} />
                {fieldErr('exam_end')}
              </Col>
              <Col md={6}>
                <Form.Label>Бүртгэлийн төлбөр (₮, 0 = үнэгүй)</Form.Label>
                <Form.Control type="number" min={0} step="100" value={form.fee} onChange={set('fee')} />
                {fieldErr('fee')}
              </Col>
              <Col md={6}>
                <Form.Label>Бодлогын тоо</Form.Label>
                <Form.Control type="number" min={1} max={30} value={form.problem_count} onChange={set('problem_count')} />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Дансаар төлөх <small className="text-muted">(QPay-ийн хоёр дахь сонголт — дансны дугааргүй бол харагдахгүй)</small></Card.Header>
          <Card.Body>
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Банк</Form.Label>
                <Form.Control value={form.bank_name} onChange={set('bank_name')} placeholder="Жишээ: Хаан банк" />
              </Col>
              <Col md={4}>
                <Form.Label>Дансны дугаар (IBAN)</Form.Label>
                <Form.Control value={form.bank_account} onChange={set('bank_account')}
                              placeholder="MN12 0005 0050 0012 3456" isInvalid={!!errors?.bank_account} />
                <Form.Text muted>IBAN дугаарыг бүтнээр нь (MN + 18 орон) оруулна.</Form.Text>
                {fieldErr('bank_account')}
              </Col>
              <Col md={4}>
                <Form.Label>Данс эзэмшигч</Form.Label>
                <Form.Control value={form.bank_account_holder} onChange={set('bank_account_holder')} />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Оролцох ангилал</span>
            <span className="d-flex gap-2">
              <Button size="sm" variant="outline-secondary" type="button" onClick={addNoLimitPresets}>
                + Багш / Чөлөөт
              </Button>
              <Button size="sm" variant="outline-primary" type="button" onClick={() => setCategories((r) => [...r, { ...EMPTY_CAT }])}>
                + Ангилал нэмэх
              </Button>
            </span>
          </Card.Header>
          <Card.Body>
            {categories.length === 0 && <div className="text-muted small">Ангилал алга.</div>}
            {categories.map((c, i) => (
              <Row className="g-2 mb-2 align-items-center" key={i}>
                <Col md={4}>
                  <Form.Control
                    required={c.grade_from === null}
                    placeholder={c.grade_from === null ? 'Нэр' : `Нэр (хоосон бол: ${autoName(c.grade_from, c.grade_to)})`}
                    value={c.name} onChange={setCat(i, 'name')} maxLength={100}
                  />
                </Col>
                <Col xs={12} md={2}>
                  <Form.Check type="checkbox" id={`cat-limit-${i}`} label="Ангийн хязгаартай"
                    checked={c.grade_from !== null} onChange={toggleLimit(i)} />
                </Col>
                <Col xs={5} md={2}>
                  {c.grade_from !== null && (
                    <Form.Select value={c.grade_from} onChange={setCat(i, 'grade_from')} aria-label="Доод анги">
                      {GRADES.map((g) => <option key={g} value={g}>{g}-р анги</option>)}
                    </Form.Select>
                  )}
                </Col>
                <Col xs={5} md={2}>
                  {c.grade_from !== null && (
                    <Form.Select value={c.grade_to} onChange={setCat(i, 'grade_to')} aria-label="Дээд анги" isInvalid={Number(c.grade_from) > Number(c.grade_to)}>
                      {GRADES.map((g) => <option key={g} value={g}>{g}-р анги</option>)}
                    </Form.Select>
                  )}
                </Col>
                <Col xs={2} md={2} className="text-end">
                  <Button size="sm" variant="outline-danger" type="button" onClick={() => setCategories((r) => r.filter((_, idx) => idx !== i))}>Устгах</Button>
                </Col>
                <Col xs={12} md={4}>
                  <InputGroup size="sm">
                    <InputGroup.Text>Бодлогын тоо</InputGroup.Text>
                    <Form.Control type="number" min={1} max={Number(form.problem_count) || 30} value={c.problem_count ?? ''}
                                  placeholder={`олимпиадынх (${form.problem_count})`} onChange={setCat(i, 'problem_count')} />
                  </InputGroup>
                </Col>
              </Row>
            ))}
            <div className="text-muted small mb-1">Ангилал бүр өөр бодлоготой байж болно. Олимпиадын бодлогын тоо нь ангилал бүрийнхээс багагүй (хамгийн их) байна.</div>
            {fieldErr('categories') && <div className="text-danger small">Ангилалын анги буруу байна (доод анги дээд ангиас их байж болохгүй).</div>}
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Хуваарь</span>
            <Button size="sm" variant="outline-primary" type="button" onClick={() => setSchedule((r) => [...r, { ...EMPTY_ITEM }])}>
              + Мөр нэмэх
            </Button>
          </Card.Header>
          <Card.Body>
            {schedule.length === 0 && <div className="text-muted small">Хуваарийн мөр алга.</div>}
            {schedule.map((it, i) => (
              <Row className="g-2 mb-3 pb-3 border-bottom" key={i}>
                <Col md={4}><Form.Control type="datetime-local" required value={it.starts_at} onChange={setItem(i, 'starts_at')} /></Col>
                <Col md={4}><Form.Control type="datetime-local" value={it.ends_at} onChange={setItem(i, 'ends_at')} /></Col>
                <Col md={4} className="text-end">
                  <Button size="sm" variant="outline-danger" type="button" onClick={() => setSchedule((r) => r.filter((_, idx) => idx !== i))}>Устгах</Button>
                </Col>
                <Col md={12}><Form.Control required placeholder="Гарчиг" value={it.title} onChange={setItem(i, 'title')} /></Col>
                <Col md={12}><Form.Control placeholder="Тайлбар" value={it.description} onChange={setItem(i, 'description')} /></Col>
              </Row>
            ))}
            {fieldErr('schedule')}
          </Card.Body>
        </Card>

        <Form.Check
          type="switch" id="is_published" className="mb-3"
          label="Нийтлэх (хэрэглэгчдэд харагдана)" checked={form.is_published} onChange={set('is_published')}
        />
        {errors && !errors.detail && (  // хадгалаагүй шалтгааныг товчны дээр заавал харуулна
          <Alert variant="danger">Хадгалагдсангүй: {apiErrorText(errors)}</Alert>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner size="sm" animation="border" /> : isEdit ? 'Хадгалах' : 'Үүсгэх'}
        </Button>
      </Form>
    </Container>
  );
}

export default OlympiadFormPage;
