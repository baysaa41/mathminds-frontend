// frontend/src/pages/MathTermsPage.jsx

import { useState, useEffect, useCallback } from 'react';
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

const EMPTY_FORM = {
  subject: 'math',
  correct_mn: '',
  incorrect_variants: '',
  note: '',
  is_active: true,
};

function MathTermsPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchTerms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (filterSubject) params.subject = filterSubject;
      if (filterActive !== '') params.is_active = filterActive;
      const res = await apiClient.get('/api/integral/math-terms/', { params });
      const data = res.data.results ?? res.data;
      setTerms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Нэр томьёоны жагсаалтыг ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [search, filterSubject, filterActive]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  const openCreate = () => {
    setEditingTerm(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (term) => {
    setEditingTerm(term);
    setForm({
      subject: term.subject,
      correct_mn: term.correct_mn,
      incorrect_variants: term.incorrect_variants,
      note: term.note || '',
      is_active: term.is_active,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.correct_mn.trim()) {
      setFormError('Зөв нэр томьёо оруулна уу.');
      return;
    }
    if (!form.incorrect_variants.trim()) {
      setFormError('Буруу хувилбар оруулна уу.');
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (editingTerm) {
        await apiClient.patch(`/api/integral/math-terms/${editingTerm.id}/`, form);
      } else {
        await apiClient.post('/api/integral/math-terms/', form);
      }
      setShowModal(false);
      await fetchTerms();
    } catch (err) {
      const detail = err.response?.data?.detail || JSON.stringify(err.response?.data);
      setFormError(detail || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (term) => {
    try {
      setTogglingId(term.id);
      await apiClient.post(`/api/integral/math-terms/${term.id}/toggle_active/`);
      setTerms((prev) =>
        prev.map((t) => (t.id === term.id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch {
      alert('Төлөв өөрчлөхөд алдаа гарлаа.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (term) => {
    if (!window.confirm(`"${term.correct_mn}" нэр томьёог устгах уу?`)) return;
    try {
      setDeletingId(term.id);
      await apiClient.delete(`/api/integral/math-terms/${term.id}/`);
      setTerms((prev) => prev.filter((t) => t.id !== term.id));
    } catch {
      alert('Устгахад алдаа гарлаа.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="mb-0">Нэр томьёо</h2>
          <small className="text-muted">AI багш ашиглах зөв/буруу нэр томьёоны жагсаалт</small>
        </div>
        <div className="d-flex gap-2">
          <Link to="/dashboard" className="btn btn-outline-secondary btn-sm">
            ← Dashboard
          </Link>
          <Button size="sm" onClick={openCreate} style={{ backgroundColor: '#fd7e14', border: 'none' }}>
            + Нэмэх
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-2">
          <Row className="g-2 align-items-end">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text>Хайх</InputGroup.Text>
                <Form.Control
                  placeholder="Нэр томьёо хайх..."
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
              <Form.Select size="sm" value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
                <option value="">Бүх төлөв</option>
                <option value="true">Идэвхтэй</option>
                <option value="false">Идэвхгүй</option>
              </Form.Select>
            </Col>
            <Col md={1}>
              <Button size="sm" variant="outline-secondary" onClick={() => { setSearch(''); setFilterSubject(''); setFilterActive(''); }}>
                Цэвэрлэх
              </Button>
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
          ) : terms.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p className="mb-2">Нэр томьёо олдсонгүй.</p>
              <Button size="sm" onClick={openCreate} style={{ backgroundColor: '#fd7e14', border: 'none' }}>
                Анхны нэр томьёо нэмэх
              </Button>
            </div>
          ) : (
            <Table hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 100 }}>Хичээл</th>
                  <th>Зөв нэр томьёо</th>
                  <th>Буруу хувилбарууд</th>
                  <th>Тайлбар</th>
                  <th style={{ width: 90 }}>Төлөв</th>
                  <th style={{ width: 130 }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} className={term.is_active ? '' : 'text-muted'}>
                    <td>
                      <Badge bg="secondary" className="fw-normal">
                        {term.subject_display}
                      </Badge>
                    </td>
                    <td className="fw-semibold">{term.correct_mn}</td>
                    <td>
                      {term.incorrect_variants.split('\n').filter(Boolean).map((v, i) => (
                        <Badge key={i} bg="danger" className="me-1 fw-normal">{v.trim()}</Badge>
                      ))}
                    </td>
                    <td className="text-muted small">{term.note || '—'}</td>
                    <td>
                      <Badge bg={term.is_active ? 'success' : 'secondary'}>
                        {term.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => openEdit(term)}
                          title="Засах"
                        >
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant={term.is_active ? 'outline-secondary' : 'outline-success'}
                          onClick={() => handleToggleActive(term)}
                          disabled={togglingId === term.id}
                          title={term.is_active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                        >
                          {togglingId === term.id ? '…' : term.is_active ? '⏸' : '▶'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(term)}
                          disabled={deletingId === term.id}
                          title="Устгах"
                        >
                          {deletingId === term.id ? '…' : '🗑'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
        {!loading && terms.length > 0 && (
          <Card.Footer className="text-muted small">
            Нийт {terms.length} нэр томьёо
          </Card.Footer>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTerm ? 'Нэр томьёо засах' : 'Шинэ нэр томьёо нэмэх'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form>
            <Row className="g-3">
              <Col md={6}>
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
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Зөв Монгол нэр томьёо <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={form.correct_mn}
                    onChange={(e) => setForm({ ...form, correct_mn: e.target.value })}
                    placeholder="жишээ: үржигдэхүүнд задлах"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Буруу хэрэглэгддэг хувилбарууд <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.incorrect_variants}
                    onChange={(e) => setForm({ ...form, incorrect_variants: e.target.value })}
                    placeholder={'Мөр бүрт нэг хувилбар:\nхүчин зүйлд задлах\nфакторизаци хийх'}
                  />
                  <Form.Text className="text-muted">Мөр бүрт нэг буруу хувилбар бичнэ.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Тайлбар / жишээ</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Нэмэлт тайлбар эсвэл контекст жишээ (заавал биш)"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Check
                  type="switch"
                  label="Идэвхтэй (AI prompt-д оруулна)"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Болих</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: '#fd7e14', border: 'none' }}
          >
            {saving ? <Spinner size="sm" animation="border" className="me-1" /> : null}
            {editingTerm ? 'Хадгалах' : 'Нэмэх'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MathTermsPage;
