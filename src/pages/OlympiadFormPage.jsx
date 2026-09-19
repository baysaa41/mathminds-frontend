// src/pages/OlympiadFormPage.jsx
// Админ: олимпиад үүсгэх / засах (хуваарийн жагсаалттай)

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Form, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import { getOlympiad, createOlympiad, updateOlympiad } from '../services/olympiadService';

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
  title: '', slug: '', description: '', venue: '', registration_start: '', registration_end: '',
  exam_start: '', exam_end: '', fee: 0, problem_count: 6, is_published: false,
};
const EMPTY_ITEM = { starts_at: '', ends_at: '', title: '', description: '' };

function OlympiadFormPage() {
  const { slug: editSlug } = useParams();
  const navigate = useNavigate();
  const isEdit = !!editSlug;

  const [form, setForm] = useState(EMPTY);
  const [schedule, setSchedule] = useState([]);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getOlympiad(editSlug)
      .then((o) => {
        setForm({
          title: o.title, slug: o.slug, description: o.description, venue: o.venue,
          registration_start: toLocalInput(o.registration_start),
          registration_end: toLocalInput(o.registration_end),
          exam_start: toLocalInput(o.exam_start), exam_end: toLocalInput(o.exam_end),
          fee: o.fee, problem_count: o.problem_count, is_published: o.is_published,
        });
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

  const submit = async (e) => {
    e.preventDefault();
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
    <Container className="py-4" style={{ maxWidth: 800 }}>
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
                <Form.Control type="datetime-local" value={form.exam_end} onChange={set('exam_end')} />
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
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner size="sm" animation="border" /> : isEdit ? 'Хадгалах' : 'Үүсгэх'}
        </Button>
      </Form>
    </Container>
  );
}

export default OlympiadFormPage;
