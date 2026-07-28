// src/components/clubSubGroups/SubGroupFormModal.jsx
// Дэд бүлэг үүсгэх/засах modal

import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import apiClient from '../../api/axiosConfig';
import { COLOR_OPTIONS } from './constants.js';

export const SubGroupFormModal = ({ show, onHide, clubId, subgroup, onSaved }) => {
  const [form, setForm] = useState({ name: '', description: '', color: 'primary', order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (show) {
      setForm(subgroup
        ? { name: subgroup.name, description: subgroup.description, color: subgroup.color, order: subgroup.order, is_active: subgroup.is_active !== false }
        : { name: '', description: '', color: 'primary', order: 0, is_active: true }
      );
      setErr('');
    }
  }, [show, subgroup]);

  const handleSave = async () => {
    if (!form.name.trim()) { setErr('Нэр оруулна уу.'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = { ...form, club: clubId };
      const res = subgroup
        ? await apiClient.patch(`/api/club-subgroups/${subgroup.id}/`, payload)
        : await apiClient.post('/api/club-subgroups/', payload);
      onSaved(res.data);
      onHide();
    } catch (e) {
      setErr(e.response?.data?.detail || Object.values(e.response?.data || {})[0] || 'Алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          {subgroup ? 'Дэд бүлэг засах' : 'Шинэ дэд бүлэг'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-medium">Нэр <span className="text-danger">*</span></Form.Label>
          <Form.Control size="sm" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="жишээ: 11а, A бүлэг..." autoFocus />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-medium">Тайлбар</Form.Label>
          <Form.Control size="sm" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Заавал биш" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-medium">Өнгө</Form.Label>
          <div className="d-flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map(c => (
              <Button key={c.value} size="sm"
                variant={form.color === c.value ? c.value : `outline-${c.value}`}
                onClick={() => setForm(f => ({ ...f, color: c.value }))}>
                {c.label}
              </Button>
            ))}
          </div>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className="small fw-medium">Эрэмбэ</Form.Label>
          <Form.Control type="number" size="sm" style={{ width: 90 }} value={form.order}
            onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
        </Form.Group>
        <Form.Group>
          <Form.Check
            type="switch"
            id="subgroup-is-active-switch"
            label={form.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
          />
          <Form.Text className="text-muted small">Идэвхгүй дэд бүлэг харагдахгүй болно.</Form.Text>
        </Form.Group>
        {err && <div className="text-danger small mt-2">{err}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>Болих</Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Spinner animation="border" size="sm" /> : 'Хадгалах'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
