// frontend/src/pages/AITeachersAdminPage.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import apiClient from '../api/axiosConfig';

const SUBJECT_CHOICES = [
  { value: 'math', label: 'Математик' },
  { value: 'physics', label: 'Физик' },
  { value: 'chemistry', label: 'Хими' },
  { value: 'biology', label: 'Биологи' },
  { value: 'all', label: 'Бүх хичээл' },
];

const LEVEL_CHOICES = [
  { value: 'elementary', label: 'Бага анги (1-5)' },
  { value: 'middle', label: 'Дунд анги (6-9)' },
  { value: 'high', label: 'Ахлах анги (10-12)' },
  { value: 'university', label: 'Их дээд сургууль' },
  { value: 'all', label: 'Бүх түвшин' },
];

const ROLE_CHOICES = [
  { value: 'teacher', label: 'Багш' },
  { value: 'student', label: 'Сурагч' },
];

const ENGINE_CHOICES = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI ChatGPT' },
  { value: 'anthropic', label: 'Anthropic Claude' },
];

const choiceLabel = (choices, value) => choices.find((c) => c.value === value)?.label || value;

function AITeachersAdminPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [togglingId, setTogglingId] = useState(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/users/api/admin/ai-teachers/');
      const data = res.data.results ?? res.data;
      setTeachers(Array.isArray(data) ? data : []);
    } catch {
      setError('AI багш нарын жагсаалтыг ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (q && !`${t.name_mn} ${t.username}`.toLowerCase().includes(q)) return false;
      if (filterSubject && t.subject !== filterSubject) return false;
      if (filterLevel && t.level !== filterLevel) return false;
      if (filterActive !== '' && String(t.is_active) !== filterActive) return false;
      return true;
    });
  }, [teachers, search, filterSubject, filterLevel, filterActive]);

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      name_mn: teacher.name_mn,
      subject: teacher.subject,
      level: teacher.level,
      role: teacher.role,
      engine: teacher.engine,
      bio: teacher.bio || '',
      teaching_style: teacher.teaching_style || '',
      system_prompt: teacher.system_prompt || '',
      can_favorite: teacher.can_favorite,
      is_active: teacher.is_active,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name_mn.trim()) {
      setFormError('Багшийн нэрийг оруулна уу.');
      return;
    }
    if (!form.system_prompt.trim()) {
      setFormError('Системийн промпт хоосон байж болохгүй.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      await apiClient.patch(`/users/api/admin/ai-teachers/${editingTeacher.id}/`, form);
      setShowModal(false);
      await fetchTeachers();
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      setFormError(detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (teacher) => {
    try {
      setTogglingId(teacher.id);
      await apiClient.patch(`/users/api/admin/ai-teachers/${teacher.id}/`, {
        is_active: !teacher.is_active,
      });
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch {
      alert('Төлөв өөрчлөхөд алдаа гарлаа.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0">AI Багш нар</h2>
          <small className="text-muted">Хичээл, түвшин тус бүрийн AI багшийн профайл, системийн промпт засах</small>
        </div>
        <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
          ← Dashboard
        </Link>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-end">
            <Col md={4}>
              <InputGroup size="sm">
                <InputGroup.Text>Хайх</InputGroup.Text>
                <Form.Control
                  placeholder="Нэр, username хайх..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                <option value="">Бүх хичээл</option>
                {SUBJECT_CHOICES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                <option value="">Бүх түвшин</option>
                {LEVEL_CHOICES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
                <option value="">Бүх төлөв</option>
                <option value="true">Идэвхтэй</option>
                <option value="false">Идэвхгүй</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="warning" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-0">AI багш олдсонгүй.</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Багш</th>
                  <th style={{ width: 110 }}>Хичээл</th>
                  <th style={{ width: 140 }}>Түвшин</th>
                  <th style={{ width: 90 }}>Дүр</th>
                  <th style={{ width: 110 }}>Engine</th>
                  <th>Хөтөлбөр</th>
                  <th style={{ width: 90 }}>Төлөв</th>
                  <th style={{ width: 110 }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className={t.is_active ? '' : 'text-muted'}>
                    <td>
                      <div className="fw-semibold">{t.name_mn}</div>
                      <div className="small text-muted">@{t.username}</div>
                    </td>
                    <td>
                      <Badge bg="secondary" className="fw-normal">{t.subject_display}</Badge>
                    </td>
                    <td>
                      <Badge bg="info" className="fw-normal text-dark">{t.level_display}</Badge>
                    </td>
                    <td className="small">{choiceLabel(ROLE_CHOICES, t.role)}</td>
                    <td className="small">{choiceLabel(ENGINE_CHOICES, t.engine)}</td>
                    <td className="small text-muted">{t.program_name || '—'}</td>
                    <td>
                      <Badge bg={t.is_active ? 'success' : 'secondary'}>
                        {t.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(t)}
                          title="Засах"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant={t.is_active ? 'outline-secondary' : 'outline-success'}
                          onClick={() => handleToggleActive(t)}
                          disabled={togglingId === t.id}
                          title={t.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        >
                          {togglingId === t.id ? '…' : t.is_active ? '⏸' : '▶'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {!loading && filteredTeachers.length > 0 && (
          <Card.Footer className="text-muted small">
            Нийт {filteredTeachers.length} AI багш
          </Card.Footer>
        )}
      </Card>

      {/* Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTeacher ? `${editingTeacher.name_mn} засах` : 'AI багш засах'}
            {editingTeacher && (
              <span className="text-muted small ms-2">@{editingTeacher.username}</span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          {form && (
            <Form>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Нэр <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      value={form.name_mn}
                      onChange={(e) => setForm({ ...form, name_mn: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Хичээл</Form.Label>
                    <Form.Select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    >
                      {SUBJECT_CHOICES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Түвшин</Form.Label>
                    <Form.Select
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                    >
                      {LEVEL_CHOICES.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Дүр</Form.Label>
                    <Form.Select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLE_CHOICES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>AI Engine</Form.Label>
                    <Form.Select
                      value={form.engine}
                      onChange={(e) => setForm({ ...form, engine: e.target.value })}
                    >
                      {ENGINE_CHOICES.map((e2) => (
                        <option key={e2.value} value={e2.value}>{e2.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex flex-column justify-content-end">
                  <Form.Check
                    type="switch"
                    label="Идэвхтэй"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <Form.Check
                    type="switch"
                    label="Фав дарах эрх"
                    checked={form.can_favorite}
                    onChange={(e) => setForm({ ...form, can_favorite: e.target.checked })}
                  />
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Танилцуулга (bio)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Хэрэглэгчид харагдах товч танилцуулга (заавал биш)"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Арга барил (teaching_style)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={form.teaching_style}
                      onChange={(e) => setForm({ ...form, teaching_style: e.target.value })}
                      placeholder="Заах арга барилын товч тэмдэглэл (заавал биш)"
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Системийн промпт <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={12}
                      className="font-monospace"
                      style={{ fontSize: '0.85rem' }}
                      value={form.system_prompt}
                      onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                    />
                    <Form.Text className="text-muted">
                      AI-д дамжуулах зарчим, формат гэх мэт бүрэн системийн промпт.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Болих</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: '#0ea5e9', border: 'none' }}
          >
            {saving ? <Spinner size="sm" animation="border" className="me-1" /> : null}
            Хадгалах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AITeachersAdminPage;
