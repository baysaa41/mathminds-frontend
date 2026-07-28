// src/components/curriculumAdmin/ResourcesEditor.jsx
// Долоо хоногийн сэдвийн материалуудыг засварлах жагсаалт

import { useState } from 'react';
import { Row, Col, Form, Button, Badge, Spinner } from 'react-bootstrap';
import { Pencil, Trash2, Plus } from 'lucide-react';
import * as svc from '../../services/curriculumAdminService';

const TYPES = [
  { value: 'link', label: 'Линк' },
  { value: 'pdf', label: 'PDF' },
  { value: 'video', label: 'Видео' },
  { value: 'problem', label: 'Бодлого' },
];

export default function ResourcesEditor({ topicId, resources, onRefresh }) {
  const blankForm = { title: '', resource_type: 'link', url: '' };
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await svc.createResource({ weekly_topic: topicId, ...form });
      setForm(blankForm);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    setSaving(true);
    try {
      await svc.updateResource(id, editForm);
      setEditId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await svc.deleteResource(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  const typeLabel = (v) => TYPES.find(t => t.value === v)?.label || v;

  return (
    <div>
      <ul className="list-group list-group-flush mb-2">
        {resources.length === 0 && (
          <li className="list-group-item text-muted small px-0">Материал байхгүй</li>
        )}
        {resources.map(r => (
          <li key={r.id} className="list-group-item px-0 py-1">
            {editId === r.id ? (
              <Row className="g-1">
                <Col xs={3}>
                  <Form.Select size="sm" value={editForm.resource_type}
                    onChange={e => setEditForm(f => ({ ...f, resource_type: e.target.value }))}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Form.Select>
                </Col>
                <Col xs={4}>
                  <Form.Control size="sm" placeholder="Нэр" value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </Col>
                <Col xs={3}>
                  <Form.Control size="sm" placeholder="URL" value={editForm.url}
                    onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} />
                </Col>
                <Col xs={2} className="d-flex gap-1">
                  <Button size="sm" variant="success" onClick={() => handleUpdate(r.id)} disabled={saving}>OK</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>✕</Button>
                </Col>
              </Row>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <span className="small">
                  <Badge bg="light" text="dark" className="me-1 border">{typeLabel(r.resource_type)}</Badge>
                  {r.url
                    ? <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
                    : r.title}
                </span>
                <div className="ms-2 flex-shrink-0">
                  <Button size="sm" variant="link" className="p-0 me-1 text-secondary"
                    onClick={() => { setEditId(r.id); setEditForm({ title: r.title, resource_type: r.resource_type, url: r.url || '' }); }}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="sm" variant="link" className="p-0 text-danger"
                    onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>
                    {deleting === r.id ? <Spinner size="sm" /> : <Trash2 size={12} />}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Form onSubmit={handleAdd}>
        <Row className="g-1">
          <Col xs={3}>
            <Form.Select size="sm" value={form.resource_type}
              onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Form.Select>
          </Col>
          <Col xs={4}>
            <Form.Control size="sm" placeholder="Нэр" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </Col>
          <Col>
            <Form.Control size="sm" placeholder="URL" value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </Col>
          <Col xs="auto">
            <Button size="sm" type="submit" variant="outline-primary" disabled={saving || !form.title.trim()}>
              <Plus size={14} />
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
