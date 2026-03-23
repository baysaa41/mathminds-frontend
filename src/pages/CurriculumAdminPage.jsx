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
  CheckCircle, XCircle, ChevronDown, ChevronUp, Sparkles, FileText,
  MessageCircle, Send, Check, X as XIcon,
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

// ─── 2. ДОЛОО ХОНОГИЙН СЭДВҮҮД TAB ──────────────────────────────────────────

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

// ─── AI ӨГҮҮЛЭЛ САЙЖРУУЛАХ MODAL ────────────────────────────────────────────

function ArticleImproveModal({ show, onHide, topic, articleUuid, onApplied }) {
  const [messages, setMessages] = useState([]); // { role: 'user'|'ai', text }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // { title, abstract, content }
  const [applying, setApplying] = useState(false);

  // Modal хаахад цэвэрлэх
  useEffect(() => {
    if (!show) {
      setMessages([]);
      setInput('');
      setPreview(null);
    }
  }, [show]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await svc.improveArticle(topic.id, {
        message: msg,
        article_uuid: articleUuid,
      });
      const data = res.data;
      setPreview(data);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Гарчиг: ${data.title}\n\nХураангуй: ${data.abstract}`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Алдаа: ${err.response?.data?.detail || 'AI дуудахад алдаа гарлаа'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      await svc.applyArticleImprovement(topic.id, {
        article_uuid: articleUuid,
        title: preview.title,
        abstract: preview.abstract,
        content: preview.content,
      });
      setMessages(prev => [...prev, { role: 'ai', text: 'Өгүүлэл амжилттай шинэчлэгдлээ.' }]);
      setPreview(null);
      onApplied?.();
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Хадгалахад алдаа: ${err.response?.data?.detail || 'Алдаа гарлаа'}`,
      }]);
    } finally {
      setApplying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          <MessageCircle size={18} className="me-2" />
          AI сайжруулалт — {topic?.topic}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {messages.length === 0 && (
          <div className="text-center text-muted py-4">
            <MessageCircle size={32} className="mb-2 opacity-25" />
            <p className="small mb-0">Өгүүллийг хэрхэн сайжруулахыг бичнэ үү.</p>
            <p className="small text-muted">
              Жишээ: "Тэгш өнцөгтийг тэгш олонт гэж нэрлэ", "Илүү олон жишээ нэм", "Хялбаршуул"
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`d-flex mb-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            <div
              className={`rounded px-3 py-2 small ${
                m.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-light border'
              }`}
              style={{ maxWidth: '80%', whiteSpace: 'pre-wrap' }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="d-flex justify-content-start mb-2">
            <div className="bg-light border rounded px-3 py-2">
              <Spinner animation="border" size="sm" className="me-1" />
              <span className="small text-muted">AI боловсруулж байна...</span>
            </div>
          </div>
        )}

        {/* Preview хүлээн авах / татгалзах */}
        {preview && !applying && (
          <Alert variant="info" className="mt-2 small">
            <div className="d-flex justify-content-between align-items-center">
              <span>Шинэ хувилбар бэлэн. Хадгалах уу?</span>
              <div className="d-flex gap-1">
                <Button size="sm" variant="success" onClick={handleApply}>
                  <Check size={14} className="me-1" />Хадгалах
                </Button>
                <Button size="sm" variant="outline-secondary" onClick={() => setPreview(null)}>
                  <XIcon size={14} />
                </Button>
              </div>
            </div>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer className="py-2">
        <div className="d-flex w-100 gap-2">
          <Form.Control
            as="textarea"
            rows={1}
            placeholder="Зааварчилгаа бичих..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || applying}
            style={{ resize: 'none' }}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || loading || applying}
          >
            <Send size={16} />
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

function WeeklyTopicsTab({ programs }) {
  const [filterProgram, setFilterProgram] = useState('');
  const [topics, setTopics] = useState([]);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [generatingId, setGeneratingId] = useState(null);
  const [improveTopic, setImproveTopic] = useState(null); // topic object for modal
  const [improveArticleUuid, setImproveArticleUuid] = useState(null);

  const toggleExpand = (id) =>
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ week_num: '', hours: 0, program: '', topic: '', description: '', is_published: false });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!filterProgram) return;
    setLoading(true);
    try {
      const params = { program: filterProgram };
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch {
      setError('Ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [filterProgram]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    // Дараагийн долоо хоногийн дугаарыг автомат олох
    const maxWeekNum = topics.reduce((max, t) => Math.max(max, t.week_num || 0), 0);
    setForm({
      week_num: maxWeekNum + 1,
      hours: 0,
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
      week_num: t.week_num,
      hours: t.hours || 0,
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

  const refreshTopic = useCallback(async () => {
    try {
      const params = { program: filterProgram };
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch {}
  }, [filterProgram]);

  const handleGenerateArticle = async (t) => {
    if (!window.confirm(
      `${t.week_num}-р долоо хоногийн «${t.topic}» сэдвээр AI өгүүлэл үүсгэх үү?\n\nПостлохгүй, зөвхөн өгүүлэл үүсгэнэ.`
    )) return;
    setGeneratingId(t.id);
    try {
      const res = await svc.generateArticle(t.id);
      setError('');
      await load();
      alert(res.data.detail || 'AI өгүүлэл амжилттай үүсгэгдлээ.');
    } catch (err) {
      setError(err.response?.data?.detail || 'AI өгүүлэл үүсгэхэд алдаа гарлаа');
    } finally {
      setGeneratingId(null);
    }
  };

  const selectedProgram = programs.find(p => String(p.id) === String(filterProgram));

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Row className="mb-3 g-2 align-items-end">
        <Col md={6}>
          <Form.Label className="small mb-1">Хөтөлбөр</Form.Label>
          <Form.Select size="sm" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
            <option value="">— сонгох —</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.grade}-р анги · {p.name}
                {p.academic_year ? ` (${p.academic_year})` : ''}
                {p.hours_per_week ? ` · ${p.hours_per_week} цаг/7хон` : ''}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md="auto">
          <Button
            size="sm" variant="primary"
            onClick={openCreate}
            disabled={!filterProgram}
            title={!filterProgram ? 'Эхлээд хөтөлбөрийг сонгоно уу' : ''}
          >
            <Plus size={14} className="me-1" />Сэдэв нэмэх
          </Button>
        </Col>
      </Row>

      {/* Program info */}
      {selectedProgram && (
        <div className="small text-muted mb-2">
          {selectedProgram.hours_per_week} цаг/долоо хоног
          {selectedProgram.total_hours ? ` · Нийт ${selectedProgram.total_hours} цаг` : ''}
          {selectedProgram.academic_year ? ` · ${selectedProgram.academic_year}` : ''}
        </div>
      )}

      {/* No filter selected */}
      {!filterProgram && (
        <div className="text-center text-muted py-5">
          <BookOpen size={40} className="mb-2 opacity-25" />
          <p>Хөтөлбөрийг сонгоно уу</p>
        </div>
      )}

      {/* Topics list as Accordion */}
      {loading && <div className="text-center py-3"><Spinner /></div>}
      {!loading && filterProgram && (
        <>
          <div className="d-flex justify-content-between mb-2">
            <small className="text-muted">{topics.length} сэдэв</small>
          </div>
          {topics.length === 0 && (
            <Alert variant="info">Сонгосон хөтөлбөрт сэдэв байхгүй байна.</Alert>
          )}
          <div className="d-flex flex-column gap-2">
            {topics.map(t => {
              const isOpen = !!expandedTopics[t.id];
              return (
                <Card key={t.id} className="border">
                  {/* Header */}
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
                    {t.effective_hours > 0 && (
                      <Badge bg="outline-secondary" className="flex-shrink-0 border text-muted">
                        {t.effective_hours} цаг
                      </Badge>
                    )}
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
                      {/* AI өгүүлэл үүсгэх / сайжруулах */}
                      {t.topic && (() => {
                        const articleRes = t.resources?.find(r => r.resource_type === 'article');
                        if (articleRes) {
                          // Байгаа article → сайжруулах
                          const match = articleRes.url?.match(/\/articles?\/([a-f0-9-]+)/);
                          const uuid = match?.[1] || '';
                          return (
                            <Button
                              size="sm" variant="outline-info" className="p-1"
                              onClick={() => { setImproveTopic(t); setImproveArticleUuid(uuid); }}
                              title="AI сайжруулах"
                            >
                              <MessageCircle size={12} />
                            </Button>
                          );
                        }
                        // Article байхгүй → үүсгэх
                        return (
                          <Button
                            size="sm" variant="outline-primary" className="p-1"
                            onClick={() => handleGenerateArticle(t)}
                            disabled={generatingId !== null}
                            title="AI өгүүлэл үүсгэх"
                          >
                            {generatingId === t.id ? <Spinner size="sm" /> : <Sparkles size={12} />}
                          </Button>
                        );
                      })()}
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

                  {/* Article resource badges */}
                  {t.resources?.filter(r => r.resource_type === 'article').length > 0 && (
                    <div className="px-3 pb-1 d-flex flex-wrap gap-1">
                      {t.resources.filter(r => r.resource_type === 'article').map(r => (
                        <Link key={r.id} to={r.url} className="text-decoration-none">
                          <Badge bg="info" className="small fw-normal d-inline-flex align-items-center gap-1">
                            <FileText size={10} />
                            {r.title.length > 50 ? r.title.slice(0, 50) + '...' : r.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}

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
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>7 хоног # <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" min="1" required value={form.week_num}
                    onChange={e => setForm(f => ({ ...f, week_num: parseInt(e.target.value) || '' }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Цаг</Form.Label>
                  <Form.Control
                    type="number" min="0" value={form.hours}
                    onChange={e => setForm(f => ({ ...f, hours: parseInt(e.target.value) || 0 }))}
                  />
                  <Form.Text className="text-muted">0 = default</Form.Text>
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

      <ArticleImproveModal
        show={!!improveTopic}
        onHide={() => { setImproveTopic(null); setImproveArticleUuid(null); }}
        topic={improveTopic}
        articleUuid={improveArticleUuid}
        onApplied={() => load()}
      />
    </>
  );
}

// ─── ҮНДСЭН ХУУДАС ──────────────────────────────────────────────────────────

function CurriculumAdminPage() {
  const [programs, setPrograms] = useState([]);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    svc.getPrograms().then(res => {
      setPrograms(res.data);
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
          <Tabs defaultActiveKey="programs" className="mb-3">
            <Tab eventKey="programs" title="Хөтөлбөрүүд">
              <ProgramsTab />
            </Tab>
            <Tab eventKey="topics" title="Долоо хоногийн сэдвүүд">
              <WeeklyTopicsTab programs={programs} />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CurriculumAdminPage;
