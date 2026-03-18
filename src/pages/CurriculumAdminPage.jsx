// src/pages/CurriculumAdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Row, Col, Card, Tabs, Tab,
  Table, Button, Badge, Modal, Form,
  Alert, Spinner, Collapse,
} from 'react-bootstrap';
import {
  Plus, Pencil, Trash2, ChevronLeft, BookOpen,
  Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import * as svc from '../services/curriculumAdminService';

// ─── ТУСЛАХ КОМПОНЕНТУУД ─────────────────────────────────────────────────────

function ConfirmModal({ show, message, onConfirm, onCancel, loading }) {
  return (
    <Modal show={show} onHide={onCancel} centered size="sm">
      <Modal.Body className="text-center p-4">
        <p className="mb-3">{message}</p>
        <Button variant="danger" onClick={onConfirm} disabled={loading} className="me-2">
          {loading ? <Spinner size="sm" /> : 'Устгах'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Болих
        </Button>
      </Modal.Body>
    </Modal>
  );
}

function SaveButton({ loading }) {
  return (
    <Button type="submit" variant="primary" disabled={loading}>
      {loading ? <Spinner size="sm" className="me-1" /> : null}
      Хадгалах
    </Button>
  );
}

// ─── 1. ХӨТӨЛБӨР (Programs) TAB ─────────────────────────────────────────────

function ProgramsTab() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ grade: '', name: '', code: '', description: '', is_active: true });
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
    setForm({ grade: '', name: '', code: '', description: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ grade: p.grade, name: p.name, code: p.code, description: p.description, is_active: p.is_active });
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
            <th>Анги</th><th>Нэр</th><th>Код</th><th>Идэвхтэй</th><th></th>
          </tr>
        </thead>
        <tbody>
          {programs.length === 0 && (
            <tr><td colSpan={5} className="text-center text-muted py-3">Хөтөлбөр байхгүй байна</td></tr>
          )}
          {programs.map(p => (
            <tr key={p.id}>
              <td><Badge bg="secondary">{p.grade}-р анги</Badge></td>
              <td>{p.name}</td>
              <td><code>{p.code}</code></td>
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

// ─── 2. ХИЧЭЭЛИЙН ЖИЛ + ДОЛОО ХОНОГ TAB ────────────────────────────────────

function AcademicYearsTab() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showYearModal, setShowYearModal] = useState(false);
  const [editYear, setEditYear] = useState(null);
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '', is_active: false });
  const [savingYear, setSavingYear] = useState(false);
  const [confirmYearId, setConfirmYearId] = useState(null);
  const [deletingYear, setDeletingYear] = useState(false);

  // Weeks state
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [editWeek, setEditWeek] = useState(null);
  const [weekForm, setWeekForm] = useState({ week_num: '', start_date: '', end_date: '' });
  const [savingWeek, setSavingWeek] = useState(false);
  const [confirmWeekId, setConfirmWeekId] = useState(null);
  const [deletingWeek, setDeletingWeek] = useState(false);

  const loadYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await svc.getAcademicYears();
      setYears(res.data);
    } catch {
      setError('Ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeeks = useCallback(async (yearId) => {
    if (!yearId) return;
    setLoadingWeeks(true);
    try {
      const res = await svc.getWeeks(yearId);
      setWeeks(res.data);
    } catch {
      setError('Долоо хоног ачааллахад алдаа гарлаа');
    } finally {
      setLoadingWeeks(false);
    }
  }, []);

  useEffect(() => { loadYears(); }, [loadYears]);
  useEffect(() => { if (selectedYearId) loadWeeks(selectedYearId); }, [selectedYearId, loadWeeks]);

  // Year CRUD
  const openCreateYear = () => {
    setEditYear(null);
    setYearForm({ name: '', start_date: '', end_date: '', is_active: false });
    setShowYearModal(true);
  };
  const openEditYear = (y) => {
    setEditYear(y);
    setYearForm({ name: y.name, start_date: y.start_date, end_date: y.end_date, is_active: y.is_active });
    setShowYearModal(true);
  };
  const handleSaveYear = async (e) => {
    e.preventDefault();
    setSavingYear(true);
    try {
      if (editYear) await svc.updateAcademicYear(editYear.id, yearForm);
      else await svc.createAcademicYear(yearForm);
      setShowYearModal(false);
      await loadYears();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Хадгалахад алдаа гарлаа');
    } finally {
      setSavingYear(false);
    }
  };
  const handleDeleteYear = async () => {
    setDeletingYear(true);
    try {
      await svc.deleteAcademicYear(confirmYearId);
      if (selectedYearId === confirmYearId) setSelectedYearId(null);
      setConfirmYearId(null);
      await loadYears();
    } catch {
      setError('Устгахад алдаа гарлаа');
    } finally {
      setDeletingYear(false);
    }
  };

  // Week CRUD
  const openCreateWeek = () => {
    setEditWeek(null);
    setWeekForm({ week_num: '', start_date: '', end_date: '' });
    setShowWeekModal(true);
  };
  const openEditWeek = (w) => {
    setEditWeek(w);
    setWeekForm({ week_num: w.week_num, start_date: w.start_date, end_date: w.end_date });
    setShowWeekModal(true);
  };
  const handleSaveWeek = async (e) => {
    e.preventDefault();
    setSavingWeek(true);
    try {
      const data = { ...weekForm, academic_year: selectedYearId };
      if (editWeek) await svc.updateWeek(editWeek.id, data);
      else await svc.createWeek(data);
      setShowWeekModal(false);
      await loadWeeks(selectedYearId);
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Хадгалахад алдаа гарлаа');
    } finally {
      setSavingWeek(false);
    }
  };
  const handleDeleteWeek = async () => {
    setDeletingWeek(true);
    try {
      await svc.deleteWeek(confirmWeekId);
      setConfirmWeekId(null);
      await loadWeeks(selectedYearId);
    } catch {
      setError('Устгахад алдаа гарлаа');
    } finally {
      setDeletingWeek(false);
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner /></div>;

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Row>
        {/* Left: Academic Years list */}
        <Col md={4}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">Хичээлийн жилүүд</h6>
            <Button size="sm" variant="primary" onClick={openCreateYear}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="list-group">
            {years.length === 0 && (
              <div className="text-muted small p-2">Хичээлийн жил байхгүй</div>
            )}
            {years.map(y => (
              <button
                key={y.id}
                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${selectedYearId === y.id ? ' active' : ''}`}
                onClick={() => setSelectedYearId(y.id)}
                type="button"
              >
                <span>
                  {y.name}
                  {y.is_active && <Badge bg="success" className="ms-2" pill>Идэвхтэй</Badge>}
                </span>
                <span onClick={e => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant={selectedYearId === y.id ? 'light' : 'outline-secondary'}
                    className="me-1 p-1"
                    onClick={() => openEditYear(y)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedYearId === y.id ? 'light' : 'outline-danger'}
                    className="p-1"
                    onClick={() => setConfirmYearId(y.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </span>
              </button>
            ))}
          </div>
        </Col>

        {/* Right: Weeks for selected year */}
        <Col md={8}>
          {!selectedYearId ? (
            <div className="text-center text-muted py-5">
              <Calendar size={40} className="mb-2 opacity-25" />
              <p>Хичээлийн жилийг сонгоно уу</p>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  Долоо хоногууд — {years.find(y => y.id === selectedYearId)?.name}
                </h6>
                <Button size="sm" variant="primary" onClick={openCreateWeek}>
                  <Plus size={14} className="me-1" />Нэмэх
                </Button>
              </div>
              {loadingWeeks ? (
                <div className="text-center py-3"><Spinner size="sm" /></div>
              ) : (
                <Table responsive hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>#</th><th>Эхлэх өдөр</th><th>Дуусах өдөр</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted">Долоо хоног байхгүй</td></tr>
                    )}
                    {weeks.map(w => (
                      <tr key={w.id}>
                        <td><Badge bg="secondary">{w.week_num}</Badge></td>
                        <td>{w.start_date}</td>
                        <td>{w.end_date}</td>
                        <td className="text-end">
                          <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEditWeek(w)}>
                            <Pencil size={12} />
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => setConfirmWeekId(w.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Col>
      </Row>

      {/* Year Modal */}
      <Modal show={showYearModal} onHide={() => setShowYearModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editYear ? 'Хичээлийн жил засах' : 'Шинэ хичээлийн жил'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveYear}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Нэр <span className="text-danger">*</span></Form.Label>
              <Form.Control
                required value={yearForm.name}
                onChange={e => setYearForm(f => ({ ...f, name: e.target.value }))}
                placeholder="2025-2026"
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Эхлэх огноо <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" required value={yearForm.start_date}
                    onChange={e => setYearForm(f => ({ ...f, start_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Дуусах огноо <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" required value={yearForm.end_date}
                    onChange={e => setYearForm(f => ({ ...f, end_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              type="switch" id="year-active" label="Идэвхтэй хичээлийн жил"
              checked={yearForm.is_active}
              onChange={e => setYearForm(f => ({ ...f, is_active: e.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowYearModal(false)}>Болих</Button>
            <SaveButton loading={savingYear} />
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Week Modal */}
      <Modal show={showWeekModal} onHide={() => setShowWeekModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editWeek ? 'Долоо хоног засах' : 'Шинэ долоо хоног'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveWeek}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Дугаар <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="number" min="1" required value={weekForm.week_num}
                onChange={e => setWeekForm(f => ({ ...f, week_num: e.target.value }))}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Эхлэх өдөр <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" required value={weekForm.start_date}
                    onChange={e => setWeekForm(f => ({ ...f, start_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Дуусах өдөр <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date" required value={weekForm.end_date}
                    onChange={e => setWeekForm(f => ({ ...f, end_date: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWeekModal(false)}>Болих</Button>
            <SaveButton loading={savingWeek} />
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!confirmYearId}
        message="Энэ хичээлийн жилийг бүх долоо хоногийн хамт устгах уу?"
        onConfirm={handleDeleteYear}
        onCancel={() => setConfirmYearId(null)}
        loading={deletingYear}
      />
      <ConfirmModal
        show={!!confirmWeekId}
        message="Энэ долоо хоногийг устгах уу?"
        onConfirm={handleDeleteWeek}
        onCancel={() => setConfirmWeekId(null)}
        loading={deletingWeek}
      />
    </>
  );
}

// ─── 3. ДОЛОО ХОНОГИЙН СЭДВҮҮД TAB ──────────────────────────────────────────

function ObjectivesEditor({ topicId, objectives, onRefresh }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await svc.createObjective({ weekly_topic: topicId, text });
      setText('');
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    setSaving(true);
    try {
      await svc.updateObjective(id, { text: editText });
      setEditId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await svc.deleteObjective(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <ul className="list-group list-group-flush mb-2">
        {objectives.length === 0 && (
          <li className="list-group-item text-muted small">Зорилт байхгүй</li>
        )}
        {objectives.map(obj => (
          <li key={obj.id} className="list-group-item px-0 py-1">
            {editId === obj.id ? (
              <div className="d-flex gap-1">
                <Form.Control
                  size="sm" value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
                <Button size="sm" variant="success" onClick={() => handleUpdate(obj.id)} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'OK'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>✕</Button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-start">
                <span className="small">{obj.text}</span>
                <div className="ms-2 flex-shrink-0">
                  <Button
                    size="sm" variant="link" className="p-0 me-1 text-secondary"
                    onClick={() => { setEditId(obj.id); setEditText(obj.text); }}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    size="sm" variant="link" className="p-0 text-danger"
                    onClick={() => handleDelete(obj.id)}
                    disabled={deleting === obj.id}
                  >
                    {deleting === obj.id ? <Spinner size="sm" /> : <Trash2 size={12} />}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Form onSubmit={handleAdd} className="d-flex gap-1">
        <Form.Control
          size="sm" placeholder="Шинэ зорилт нэмэх..."
          value={text} onChange={e => setText(e.target.value)}
        />
        <Button size="sm" type="submit" variant="outline-primary" disabled={saving || !text.trim()}>
          <Plus size={14} />
        </Button>
      </Form>
    </div>
  );
}

function ResourcesEditor({ topicId, resources, onRefresh }) {
  const blankForm = { title: '', resource_type: 'link', url: '' };
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [deleting, setDeleting] = useState(null);

  const TYPES = [
    { value: 'link', label: 'Линк' },
    { value: 'pdf', label: 'PDF' },
    { value: 'video', label: 'Видео' },
    { value: 'problem', label: 'Бодлого' },
  ];

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

function WeeklyTopicsTab({ programs, academicYears }) {
  const [filterProgram, setFilterProgram] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [topics, setTopics] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});

  const toggleExpand = (id) =>
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [weeks, setWeeks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ week: '', program: '', topic: '', description: '', is_published: false });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!filterProgram && !filterYear) return;
    setLoading(true);
    try {
      const params = {};
      if (filterProgram) params.program = filterProgram;
      if (filterYear) params.academic_year = filterYear;
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch {
      setError('Ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [filterProgram, filterYear]);

  useEffect(() => { load(); }, [load]);

  // Load weeks when year changes (for modal)
  useEffect(() => {
    if (!filterYear) { setWeeks([]); return; }
    svc.getWeeks(filterYear).then(r => setWeeks(r.data)).catch(() => {});
  }, [filterYear]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      week: '',
      program: filterProgram || '',
      topic: '',
      description: '',
      is_published: false,
    });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      week: t.week,
      program: t.program,
      topic: t.topic,
      description: t.description,
      is_published: t.is_published,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await svc.updateWeeklyTopic(editing.id, form);
      else await svc.createWeeklyTopic(form);
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
      await svc.deleteWeeklyTopic(confirmId);
      setConfirmId(null);
      await load();
    } catch {
      setError('Устгахад алдаа гарлаа');
    } finally {
      setDeleting(false);
    }
  };

  const refreshTopic = useCallback(async (topicId) => {
    try {
      const params = {};
      if (filterProgram) params.program = filterProgram;
      if (filterYear) params.academic_year = filterYear;
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch {}
  }, [filterProgram, filterYear]);

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Row className="mb-3 g-2 align-items-end">
        <Col md={4}>
          <Form.Label className="small mb-1">Хөтөлбөр</Form.Label>
          <Form.Select size="sm" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
            <option value="">— сонгох —</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.grade}-р анги · {p.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label className="small mb-1">Хичээлийн жил</Form.Label>
          <Form.Select size="sm" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">— сонгох —</option>
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md="auto">
          <Button
            size="sm" variant="primary"
            onClick={openCreate}
            disabled={!filterProgram || !filterYear}
            title={!filterProgram || !filterYear ? 'Эхлээд хөтөлбөр болон хичээлийн жилийг сонгоно уу' : ''}
          >
            <Plus size={14} className="me-1" />Сэдэв нэмэх
          </Button>
        </Col>
      </Row>

      {/* No filter selected */}
      {!filterProgram && !filterYear && (
        <div className="text-center text-muted py-5">
          <BookOpen size={40} className="mb-2 opacity-25" />
          <p>Хөтөлбөр болон хичээлийн жилийг сонгоно уу</p>
        </div>
      )}

      {/* Topics list as Accordion */}
      {loading && <div className="text-center py-3"><Spinner /></div>}
      {!loading && (filterProgram || filterYear) && (
        <>
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">{topics.length} сэдэв</small>
          </div>
          {topics.length === 0 && (
            <Alert variant="info">Сонгосон шүүлтүүрт тохирох сэдэв байхгүй байна.</Alert>
          )}
          <div className="d-flex flex-column gap-2">
            {topics.map(t => {
              const isOpen = !!expandedTopics[t.id];
              return (
                <Card key={t.id} className="border">
                  {/* Header — plain div, no nested button issue */}
                  <div
                    className="d-flex align-items-center px-3 py-2 gap-2"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleExpand(t.id)}
                  >
                    <span className="text-muted flex-shrink-0">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <Badge bg="secondary" className="flex-shrink-0">
                      {t.week_num}-р 7 хоног
                    </Badge>
                    <span className="flex-grow-1 text-truncate small fw-medium">
                      {t.topic}
                    </span>
                    <Badge
                      bg={t.is_published ? 'success' : 'warning'}
                      text={t.is_published ? undefined : 'dark'}
                      className="flex-shrink-0"
                    >
                      {t.is_published ? 'Нийтлэгдсэн' : 'Ноорог'}
                    </Badge>
                    <div
                      className="flex-shrink-0 d-flex gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button
                        size="sm" variant="outline-secondary" className="p-1"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="sm" variant="outline-danger" className="p-1"
                        onClick={() => setConfirmId(t.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  <Collapse in={isOpen}>
                    <div>
                      <Card.Body className="bg-light border-top pt-3">
                        {t.description && (
                          <p className="text-muted small mb-3">{t.description}</p>
                        )}
                        <Row>
                          <Col md={6}>
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">
                              Суралцахуйн зорилтууд
                            </h6>
                            <ObjectivesEditor
                              topicId={t.id}
                              objectives={t.objectives}
                              onRefresh={refreshTopic}
                            />
                          </Col>
                          <Col md={6}>
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">
                              Материалууд
                            </h6>
                            <ResourcesEditor
                              topicId={t.id}
                              resources={t.resources}
                              onRefresh={refreshTopic}
                            />
                          </Col>
                        </Row>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Topic Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Сэдэв засах' : 'Шинэ сэдэв'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Хөтөлбөр <span className="text-danger">*</span></Form.Label>
                  <Form.Select required value={form.program}
                    onChange={e => setForm(f => ({ ...f, program: e.target.value }))}>
                    <option value="">— сонгох —</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.grade}-р анги · {p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Долоо хоног <span className="text-danger">*</span></Form.Label>
                  <Form.Select required value={form.week}
                    onChange={e => setForm(f => ({ ...f, week: e.target.value }))}>
                    <option value="">— сонгох —</option>
                    {weeks.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.week_num}-р долоо хоног ({w.start_date})
                      </option>
                    ))}
                  </Form.Select>
                  {weeks.length === 0 && (
                    <Form.Text className="text-warning">
                      Хичээлийн жилийн шүүлтүүр сонгоогүй тул долоо хоног харагдахгүй байна
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Сэдэв <span className="text-danger">*</span></Form.Label>
              <Form.Control required value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="Тэгш өнцөгт гурвалжин" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тайлбар</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Form.Group>
            <Form.Check
              type="switch" id="topic-published" label="Нийтлэх"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
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
        message="Энэ сэдвийг бүх зорилт, материалын хамт устгах уу?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />
    </>
  );
}

// ─── ҮНДСЭН ХУУДАС ──────────────────────────────────────────────────────────

function CurriculumAdminPage() {
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      svc.getPrograms(),
      svc.getAcademicYears(),
    ]).then(([pRes, yRes]) => {
      setPrograms(pRes.data);
      setAcademicYears(yRes.data);
    }).finally(() => setInitLoading(false));
  }, []);

  if (initLoading) {
    return (
      <div className="text-center py-5">
        <Spinner className="text-primary" />
      </div>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center mb-4 gap-2">
        <Link to="/admin" className="btn btn-sm btn-outline-secondary">
          <ChevronLeft size={16} />
        </Link>
        <h2 className="mb-0">
          <BookOpen size={24} className="me-2 text-primary" />
          Хичээлийн хөтөлбөр
        </h2>
      </div>

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs defaultActiveKey="topics" className="mb-3">
            <Tab eventKey="topics" title="Долоо хоногийн сэдвүүд">
              <WeeklyTopicsTab programs={programs} academicYears={academicYears} />
            </Tab>
            <Tab eventKey="programs" title="Хөтөлбөрүүд">
              <ProgramsTab />
            </Tab>
            <Tab eventKey="years" title="Хичээлийн жил ба Долоо хоног">
              <AcademicYearsTab />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CurriculumAdminPage;
