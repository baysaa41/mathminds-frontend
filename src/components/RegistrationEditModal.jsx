// src/components/RegistrationEditModal.jsx
// Админ: олимпиадын бүртгэл засах

import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { getAdminRegistration, updateAdminRegistration } from '../services/olympiadService';
import { LATIN_NAME_RE } from '../utils/transliterate';

const TEXT_FIELDS = [
  ['last_name', 'Овог', 6], ['first_name', 'Нэр', 6],
  ['last_name_latin', 'Овог (латинаар)', 6], ['first_name_latin', 'Нэр (латинаар)', 6],
  ['province', 'Аймаг / Дүүрэг', 6], ['school', 'Сургууль', 6],
  ['phone', 'Утас', 4], ['email', 'Имэйл', 5], ['mmo_id', 'MMO ID', 3],
];

function RegistrationEditModal({ registrationId, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!registrationId) return;
    setForm(null);
    setError(null);
    getAdminRegistration(registrationId).then((d) => {
      setCategories(d.categories);
      setForm({
        ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, d[k] ?? ''])),
        grade: d.grade ?? '', olympiad_category: d.olympiad_category ?? '',
      });
    }).catch(() => setError('Бүртгэлийг ачаалж чадсангүй'));
  }, [registrationId]);

  const cat = categories.find((c) => String(c.id) === String(form?.olympiad_category));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (![form.last_name_latin, form.first_name_latin].every((v) => !v.trim() || LATIN_NAME_RE.test(v.trim()))) {
      setError('Латин овог, нэрийг зөвхөн латин үсгээр бичнэ үү.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateAdminRegistration(registrationId, {
        ...form,
        mmo_id: form.mmo_id === '' ? null : Number(form.mmo_id),
        grade: form.grade === '' ? null : Number(form.grade),
        olympiad_category: form.olympiad_category === '' ? null : Number(form.olympiad_category),
      });
      onSaved();
    } catch (err) {
      const d = err.response?.data;
      setError(d?.error || (d && Object.values(d).flat().join(' ')) || 'Хадгалахад алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={!!registrationId} onHide={onClose} size="lg">
      <Form onSubmit={save}>
        <Modal.Header closeButton><Modal.Title>Бүртгэл засах</Modal.Title></Modal.Header>
        <Modal.Body>
          {!form && !error && <div className="text-center py-4"><Spinner animation="border" /></div>}
          {form && (
            <Row className="g-2">
              {categories.length > 0 && (
                <Col md={8}>
                  <Form.Label className="small mb-0">Оролцох ангилал</Form.Label>
                  <Form.Select value={form.olympiad_category} onChange={set('olympiad_category')}>
                    <option value="">—</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Form.Select>
                </Col>
              )}
              {!(cat && cat.grade_from === null) && (
                <Col md={4}>
                  <Form.Label className="small mb-0">Анги</Form.Label>
                  <Form.Select value={form.grade} onChange={set('grade')}>
                    <option value="">—</option>
                    {/* Өгсөж орж болно — ангилалын дээд хязгаар хүртэл */}
                    {Array.from({ length: cat?.grade_to ?? 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}-р анги</option>
                    ))}
                  </Form.Select>
                </Col>
              )}
              {TEXT_FIELDS.map(([k, label, md]) => (
                <Col md={md} key={k}>
                  <Form.Label className="small mb-0">{label}</Form.Label>
                  <Form.Control value={form[k]} onChange={set(k)} type={k === 'mmo_id' ? 'number' : k === 'email' ? 'email' : 'text'}
                                required={['last_name', 'first_name'].includes(k)} />
                </Col>
              ))}
            </Row>
          )}
          {error && <Alert variant="danger" className="mt-3 mb-0">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Болих</Button>
          <Button type="submit" disabled={busy || !form}>{busy ? <Spinner size="sm" animation="border" /> : 'Хадгалах'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default RegistrationEditModal;
