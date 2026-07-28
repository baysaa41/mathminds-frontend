// src/components/curriculumAdmin/ProgramsTab.jsx
// CurriculumAdminPage-ийн "Хөтөлбөрүүд" таб

import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import * as svc from '../../services/curriculumAdminService';
import ConfirmModal from './ConfirmModal.jsx';
import SaveButton from './SaveButton.jsx';

export default function ProgramsTab() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    grade: '', name: '', code: '', description: '', is_active: true,
    academic_year: '', hours_per_week: 2, total_hours: 0,
  });
  const [saving, setSaving] = useState(false);

  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await svc.getPrograms();
      setPrograms(res.data);
    } catch {
      setError('Ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      grade: '', name: '', code: '', description: '', is_active: true,
      academic_year: '', hours_per_week: 2, total_hours: 0,
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      grade: p.grade, name: p.name, code: p.code, description: p.description, is_active: p.is_active,
      academic_year: p.academic_year || '', hours_per_week: p.hours_per_week || 2, total_hours: p.total_hours || 0,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await svc.updateProgram(editing.id, form);
      } else {
        await svc.createProgram(form);
      }
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await svc.deleteProgram(confirmId);
      setConfirmId(null);
      await load();
    } catch {
      setError('Устгахад алдаа гарлаа');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner /></div>;

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Хөтөлбөрүүд ({programs.length})</h5>
        <Button size="sm" variant="primary" onClick={openCreate}>
          <Plus size={16} className="me-1" />Нэмэх
        </Button>
      </div>

      <Table responsive hover size="sm">
        <thead className="table-light">
          <tr>
            <th>Анги</th><th>Нэр</th><th>Код</th><th>Хичээлийн жил</th><th>Цаг/7 хоног</th><th>Нийт цаг</th><th>Идэвхтэй</th><th></th>
          </tr>
        </thead>
        <tbody>
          {programs.length === 0 && (
            <tr><td colSpan={8} className="text-center text-muted py-3">Хөтөлбөр байхгүй байна</td></tr>
          )}
          {programs.map(p => (
            <tr key={p.id}>
              <td><Badge bg="secondary">{p.grade}-р анги</Badge></td>
              <td>{p.name}</td>
              <td><code>{p.code}</code></td>
              <td>{p.academic_year || '—'}</td>
              <td>{p.hours_per_week}</td>
              <td>{p.total_hours || '—'}</td>
              <td>
                {p.is_active
                  ? <CheckCircle size={16} className="text-success" />
                  : <XCircle size={16} className="text-muted" />}
              </td>
              <td className="text-end">
                <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(p)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => setConfirmId(p.id)}>
                  <Trash2 size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Хөтөлбөр засах' : 'Шинэ хөтөлбөр'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Анги <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" min="1" max="12" required
                    value={form.grade}
                    onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Нэр <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="7-р ангийн энгийн хөтөлбөр"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Код <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="7-regular"
              />
              <Form.Text className="text-muted">Жишээ: 7-regular, 7-advanced</Form.Text>
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Хичээлийн жил</Form.Label>
                  <Form.Control
                    value={form.academic_year}
                    onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
                    placeholder="2025-2026"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Цаг/7 хоног</Form.Label>
                  <Form.Control
                    type="number" min="1" max="10"
                    value={form.hours_per_week}
                    onChange={e => setForm(f => ({ ...f, hours_per_week: parseInt(e.target.value) || 1 }))}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Нийт цаг</Form.Label>
                  <Form.Control
                    type="number" min="0"
                    value={form.total_hours}
                    onChange={e => setForm(f => ({ ...f, total_hours: parseInt(e.target.value) || 0 }))}
                  />
                  <Form.Text className="text-muted">0 = автомат</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Тайлбар</Form.Label>
              <Form.Control
                as="textarea" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </Form.Group>
            <Form.Check
              type="switch" id="program-active" label="Идэвхтэй"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Болих</Button>
            <SaveButton loading={saving} />
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!confirmId}
        message="Энэ хөтөлбөрийг устгах уу?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />
    </>
  );
}
