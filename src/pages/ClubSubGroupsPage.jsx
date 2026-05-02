// ClubSubGroupsPage — клубын дэд бүлгүүд удирдах
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import { Users, Plus, Pencil, Trash2, UserPlus, UserMinus, Wand2 } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import EmptyState from '../components/common/EmptyState';

const COLOR_OPTIONS = [
  { value: 'primary',   label: 'Цэнхэр'  },
  { value: 'success',   label: 'Ногоон'   },
  { value: 'danger',    label: 'Улаан'    },
  { value: 'warning',   label: 'Шар'      },
  { value: 'info',      label: 'Цайвар'   },
  { value: 'secondary', label: 'Саарал'   },
];

const Avatar = ({ user, size = 28 }) => {
  const init = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase();
  if (user.picture_url) {
    return (
      <img src={user.picture_url} alt="" className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover' }} />
    );
  }
  return (
    <div className={`rounded-circle bg-${user._color || 'secondary'} d-flex align-items-center justify-content-center text-white flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {init}
    </div>
  );
};

const displayName = (u) =>
  u.last_name ? `${u.last_name} ${u.first_name}`.trim() : u.first_name || u.username;

// ── Дэд бүлэг үүсгэх/засах modal ──────────────────────────────
const SubGroupFormModal = ({ show, onHide, clubId, subgroup, onSaved }) => {
  const [form, setForm] = useState({ name: '', description: '', color: 'primary', order: 0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (show) {
      setForm(subgroup
        ? { name: subgroup.name, description: subgroup.description, color: subgroup.color, order: subgroup.order }
        : { name: '', description: '', color: 'primary', order: 0 }
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
        <Form.Group>
          <Form.Label className="small fw-medium">Эрэмбэ</Form.Label>
          <Form.Control type="number" size="sm" style={{ width: 90 }} value={form.order}
            onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
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

// ── Гишүүд нэмэх modal ─────────────────────────────────────────
const AddMembersModal = ({ show, onHide, subgroup, clubMembers, onAdded }) => {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { if (show) { setSelected([]); setSearch(''); } }, [show]);

  const currentIds = new Set((subgroup?.members || []).map(m => m.id));
  const available = clubMembers.filter(m =>
    !currentIds.has(m.id) &&
    (search === '' ||
      `${m.last_name} ${m.first_name} ${m.username}`.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id) => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]
  );
  const toggleAll = () =>
    setSelected(selected.length === available.length ? [] : available.map(m => m.id));

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      const res = await apiClient.post(
        `/api/club-subgroups/${subgroup.id}/add_members/`,
        { user_ids: selected }
      );
      onAdded(res.data.subgroup);
      onHide();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          Гишүүд нэмэх — <Badge bg={subgroup?.color || 'secondary'}>{subgroup?.name}</Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control size="sm" placeholder="Нэрээр хайх..." className="mb-2"
          value={search} onChange={e => setSearch(e.target.value)} />
        {available.length === 0 ? (
          <div className="text-muted small text-center py-3">
            {search ? 'Тохирох гишүүн олдсонгүй' : 'Нэмэх гишүүн байхгүй'}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted">{available.length} гишүүн</span>
              <Button variant="link" size="sm" className="p-0 small" onClick={toggleAll}>
                {selected.length === available.length ? 'Бүгдийг болих' : 'Бүгдийг сонгох'}
              </Button>
            </div>
            <ListGroup variant="flush" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {available.map(m => (
                <ListGroup.Item key={m.id} action onClick={() => toggle(m.id)}
                  className="d-flex align-items-center gap-2 py-1 px-2">
                  <Form.Check type="checkbox" checked={selected.includes(m.id)} readOnly />
                  <Avatar user={m} size={26} />
                  <div className="small">
                    <div className="fw-medium">{displayName(m)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>@{m.username}</div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>Болих</Button>
        <Button variant="primary" size="sm" onClick={handleAdd}
          disabled={saving || !selected.length}>
          {saving
            ? <Spinner animation="border" size="sm" />
            : <><UserPlus size={14} className="me-1" />{selected.length} гишүүн нэмэх</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const METHOD_OPTIONS = [
  {
    value: 'answer',
    label: 'Хариултын ижил төстэй байдлаар (LCA)',
    desc: 'Latent Class Analysis — хариултын хэлбэрт тулгуурлан ойролцоо хариулт өгсөн сурагчдыг нэг бүлэгт хуваана. Тус бүлгийн сул тал болон санал болгосон дасгалыг харуулна.',
  },
  {
    value: 'score',
    label: 'Оноогоор',
    desc: 'Дүнгээр нь эрэмбэлж тэнцүү тооны сурагчдыг бүлэгт хуваана.',
  },
];

// ── Дүнгийн дагуу автоматаар хуваах modal ─────────────────────
const AutoGroupModal = ({ show, onHide, clubId, onDone }) => {
  const [assignments, setAssignments] = useState([]);
  const [loadingAsgn, setLoadingAsgn] = useState(false);
  const [form, setForm] = useState({
    assignment_id: '',
    n_groups: 3,
    name_prefix: 'Бүлэг',
    replace_existing: false,
    method: 'answer',
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!show || !clubId) return;
    setResult(null); setErr('');
    setForm(f => ({ ...f, assignment_id: '', n_groups: 3, name_prefix: 'Бүлэг', replace_existing: false, method: 'answer' }));
    setLoadingAsgn(true);
    apiClient.get('/api/club-assignments/', { params: { club: clubId } })
      .then(res => setAssignments(res.data.results || res.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAsgn(false));
  }, [show, clubId]);

  const handleRun = async () => {
    if (!form.assignment_id) { setErr('Даалгавар сонгоно уу.'); return; }
    setSaving(true); setErr(''); setResult(null);
    try {
      const res = await apiClient.post(
        `/api/club-assignments/${form.assignment_id}/auto_group/`,
        {
          n_groups: form.n_groups,
          name_prefix: form.name_prefix,
          replace_existing: form.replace_existing,
          method: form.method,
        }
      );
      setResult(res.data);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (result) onDone();
    onHide();
  };

  const selectedMethod = METHOD_OPTIONS.find(m => m.value === form.method);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 d-flex align-items-center gap-2">
          <Wand2 size={16} />Автоматаар дэд бүлэгт хуваах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {result ? (
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            <div className="text-success small mb-3 fw-medium">
              {result.groups} бүлэг амжилттай үүсгэгдлээ
              {result.method === 'answer' ? ' (LCA — хариултын ижил төстэй байдлаар)' : ' (оноогоор)'}.
            </div>
            <div className="d-flex flex-column gap-3">
              {result.created.map(g => (
                <div key={g.id} className="border rounded p-3">
                  {/* Бүлгийн гарчиг */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold small">{g.name}</span>
                    <div className="d-flex gap-2 align-items-center">
                      {g.score_range && (
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {g.score_range[0]}–{g.score_range[1]} оноо
                        </span>
                      )}
                      {g.profile?.correct_rate != null && (
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {Math.round(g.profile.correct_rate * 100)}% зөв
                        </span>
                      )}
                      <Badge bg="secondary">{g.count} гишүүн</Badge>
                    </div>
                  </div>

                  {/* Сул тал */}
                  {g.profile?.weak_categories?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Сул тал:</div>
                      <div className="d-flex gap-1 flex-wrap">
                        {g.profile.weak_categories.map(cat => (
                          <Badge key={cat.id} bg={cat.color || 'secondary'}
                            style={{ fontSize: '0.68rem' }}>
                            {cat.name_mn || cat.name} — {Math.round(cat.fail_rate * 100)}% буруу
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Санал болгосон дасгал */}
                  {g.profile?.recommended_quizzes?.length > 0 && (
                    <div>
                      <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Санал болгосон дасгал:</div>
                      <div className="d-flex flex-column gap-1">
                        {g.profile.recommended_quizzes.map(q => (
                          <div key={q.quiz_id}
                            className="d-flex align-items-center justify-content-between bg-light rounded px-2 py-1">
                            <span style={{ fontSize: '0.72rem' }} className="text-truncate me-2">{q.title}</span>
                            <Badge bg="info" text="dark" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                              {Math.round(q.coverage * 100)}% хамрах
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {g.profile && !g.profile.weak_categories?.length && (
                    <div className="text-muted small">Тодорхой сул тал илрэлгүй.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Арга сонгох */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">Хуваах арга</Form.Label>
              <div className="d-flex flex-column gap-2">
                {METHOD_OPTIONS.map(opt => (
                  <label key={opt.value}
                    className={`border rounded p-2 d-flex gap-2 align-items-start ${form.method === opt.value ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer' }}>
                    <Form.Check type="radio" name="method" value={opt.value}
                      checked={form.method === opt.value}
                      onChange={() => setForm(f => ({ ...f, method: opt.value }))}
                      className="mt-0 flex-shrink-0" />
                    <div>
                      <div className="small fw-medium">{opt.label}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Form.Group>

            {/* Даалгавар */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">Даалгавар <span className="text-danger">*</span></Form.Label>
              {loadingAsgn
                ? <div className="small text-muted">Ачааллаж байна...</div>
                : (
                  <Form.Select size="sm" value={form.assignment_id}
                    onChange={e => setForm(f => ({ ...f, assignment_id: e.target.value }))}>
                    <option value="">— Сонгох —</option>
                    {assignments.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </Form.Select>
                )}
            </Form.Group>

            {/* Бүлгийн тоо */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">Бүлгийн тоо</Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Range min={2} max={10} value={form.n_groups}
                  onChange={e => setForm(f => ({ ...f, n_groups: parseInt(e.target.value) }))}
                  style={{ flex: 1 }} />
                <Badge bg="primary" style={{ minWidth: 32, fontSize: '0.9rem' }}>{form.n_groups}</Badge>
              </div>
              <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                {selectedMethod?.value === 'answer'
                  ? `Ойролцоо хариулт өгсөн сурагчдыг ${form.n_groups} кластерт хуваана.`
                  : `Сурагчдыг оноогоор нь ${form.n_groups} тэнцүү хэсэгт хуваана.`}
              </Form.Text>
            </Form.Group>

            {/* Нэрийн угтвар */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-medium">Бүлгийн нэрийн угтвар</Form.Label>
              <Form.Control size="sm" value={form.name_prefix}
                onChange={e => setForm(f => ({ ...f, name_prefix: e.target.value }))}
                placeholder="жишээ: Бүлэг, А, Cluster..." />
              <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                "{form.name_prefix || 'Бүлэг'} 1", "{form.name_prefix || 'Бүлэг'} 2"...
              </Form.Text>
            </Form.Group>

            <Form.Check type="switch" id="replace-existing"
              label="Одоо байгаа дэд бүлгүүдийг устгаж дахин үүсгэх"
              checked={form.replace_existing}
              onChange={e => setForm(f => ({ ...f, replace_existing: e.target.checked }))}
              className="small" />

            {err && <div className="text-danger small mt-2">{err}</div>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          {result ? 'Хаах' : 'Болих'}
        </Button>
        {!result && (
          <Button variant="primary" size="sm" onClick={handleRun} disabled={saving}>
            {saving
              ? <Spinner animation="border" size="sm" />
              : <><Wand2 size={14} className="me-1" />Хуваах</>}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

// ── Үндсэн хуудас ───────────────────────────────────────────────
const ClubSubGroupsPage = () => {
  const { clubData, isTeacherOrAdmin, showToast } = useOutletContext();
  const clubId = clubData?.id;

  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // идэвхтэй дэд бүлэг

  // Modals
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [addMembersModal, setAddMembersModal] = useState(false);
  const [autoGroupModal, setAutoGroupModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  // Клубын бүх гишүүд (нэмэх modal-д ашиглана)
  const clubMembers = clubData?.members || [];

  const fetchSubgroups = useCallback(async () => {
    if (!clubId) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/api/club-subgroups/', { params: { club: clubId } });
      const list = res.data.results || res.data || [];
      setSubgroups(list);
      // Сонгосон бүлгийг дахин татах
      if (selected) {
        const fresh = list.find(g => g.id === selected.id);
        setSelected(fresh || list[0] || null);
      } else if (list.length) {
        setSelected(list[0]);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [clubId]);

  // Дэлгэрэнгүй (members-тэй) татах
  const fetchDetail = useCallback(async (id) => {
    try {
      const res = await apiClient.get(`/api/club-subgroups/${id}/`);
      setSelected(res.data);
      setSubgroups(prev => prev.map(g => g.id === id ? res.data : g));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSubgroups(); }, [fetchSubgroups]);

  const handleSelectGroup = (g) => {
    setSelected(g);
    if (!g.members) fetchDetail(g.id);
  };

  const handleSaved = (data) => {
    setSubgroups(prev => {
      const idx = prev.findIndex(g => g.id === data.id);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = data; return next;
      }
      return [...prev, data];
    });
    if (!selected || data.id === selected?.id) setSelected(data);
    showToast?.('Амжилттай хадгалагдлаа', 'success');
  };

  const handleDelete = async (g) => {
    if (!window.confirm(`"${g.name}" дэд бүлгийг устгахдаа итгэлтэй байна уу?`)) return;
    try {
      await apiClient.delete(`/api/club-subgroups/${g.id}/`);
      const next = subgroups.filter(s => s.id !== g.id);
      setSubgroups(next);
      if (selected?.id === g.id) setSelected(next[0] || null);
      showToast?.('Устгагдлаа', 'success');
    } catch { showToast?.('Алдаа гарлаа', 'danger'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!selected) return;
    setRemovingId(userId);
    try {
      const res = await apiClient.post(
        `/api/club-subgroups/${selected.id}/remove_member/`,
        { user_id: userId }
      );
      setSelected(res.data);
      setSubgroups(prev => prev.map(g => g.id === res.data.id ? res.data : g));
    } catch { showToast?.('Алдаа гарлаа', 'danger'); }
    finally { setRemovingId(null); }
  };

  // Бүлэгт орогдоогүй гишүүдийн тоо
  const ungroupedCount = (() => {
    const inGroup = new Set(subgroups.flatMap(g => (g.members || []).map(m => m.id)));
    return clubMembers.filter(m => !inGroup.has(m.id)).length;
  })();

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <Users size={18} />
          Дэд бүлгүүд
          {ungroupedCount > 0 && (
            <Badge bg="light" text="secondary" className="border small fw-normal">
              {ungroupedCount} бүлэггүй гишүүн
            </Badge>
          )}
        </h5>
        {isTeacherOrAdmin && (
          <Stack direction="horizontal" gap={2}>
            <Button variant="outline-primary" size="sm"
              onClick={() => setAutoGroupModal(true)}>
              <Wand2 size={14} className="me-1" />Дүнгээр хуваах
            </Button>
            <Button variant="primary" size="sm"
              onClick={() => { setEditTarget(null); setFormModal(true); }}>
              <Plus size={14} className="me-1" />Бүлэг нэмэх
            </Button>
          </Stack>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
      ) : subgroups.length === 0 ? (
        <EmptyState icon={Users} title="Дэд бүлэг байхгүй"
          message={isTeacherOrAdmin ? '"Бүлэг нэмэх" товчоор шинэ бүлэг үүсгэнэ үү.' : 'Одоогоор дэд бүлэг байхгүй байна.'} />
      ) : (
        <div className="row g-3">
          {/* Зүүн: бүлгүүдийн жагсаалт */}
          <div className="col-12 col-md-4 col-lg-3">
            <ListGroup>
              {subgroups.map(g => (
                <ListGroup.Item key={g.id} action active={selected?.id === g.id}
                  onClick={() => handleSelectGroup(g)}
                  className="d-flex align-items-center justify-content-between gap-2 py-2">
                  <div className="d-flex align-items-center gap-2 flex-grow-1 min-width-0">
                    <span className={`badge bg-${g.color} flex-shrink-0`}
                      style={{ width: 10, height: 10, borderRadius: '50%', padding: 0 }}>&nbsp;</span>
                    <div className="text-truncate">
                      <div className="small fw-semibold">{g.name}</div>
                      {g.description && (
                        <div className="text-truncate" style={{ fontSize: '0.7rem', opacity: 0.75 }}>
                          {g.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge bg={selected?.id === g.id ? 'light' : g.color}
                    text={selected?.id === g.id ? 'dark' : undefined}
                    className="flex-shrink-0">
                    {g.member_count}
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>

          {/* Баруун: сонгосон бүлгийн гишүүд */}
          <div className="col-12 col-md-8 col-lg-9">
            {selected ? (
              <Card>
                <Card.Header className="bg-white d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg={selected.color} className="fs-6 px-3 py-1">{selected.name}</Badge>
                    {selected.description && (
                      <span className="text-muted small">{selected.description}</span>
                    )}
                  </div>
                  {isTeacherOrAdmin && (
                    <Stack direction="horizontal" gap={1}>
                      <Button variant="outline-primary" size="sm"
                        onClick={() => { setAddMembersModal(true); }}>
                        <UserPlus size={14} className="me-1" />Нэмэх
                      </Button>
                      <Button variant="outline-secondary" size="sm"
                        onClick={() => { setEditTarget(selected); setFormModal(true); }}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="outline-danger" size="sm"
                        onClick={() => handleDelete(selected)}>
                        <Trash2 size={14} />
                      </Button>
                    </Stack>
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  {!selected.members ? (
                    <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
                  ) : selected.members.length === 0 ? (
                    <div className="text-center text-muted small py-4">
                      Гишүүн байхгүй байна.
                    </div>
                  ) : (
                    <div className="row g-0">
                      {selected.members.map((m, idx) => (
                        <div key={m.id} className="col-12">
                          <div className={`d-flex align-items-center gap-2 p-2 ${idx % 2 === 0 ? '' : ''}`}
                            style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <Avatar user={m} size={32} />
                            <div className="flex-grow-1 min-width-0">
                              <div className="small fw-medium text-truncate">{displayName(m)}</div>
                              <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
                                @{m.username}
                              </div>
                            </div>
                            {isTeacherOrAdmin && (
                              <Button variant="link" size="sm" className="text-danger p-0 flex-shrink-0"
                                onClick={() => handleRemoveMember(m.id)}
                                disabled={removingId === m.id} title="Хасах">
                                {removingId === m.id
                                  ? <Spinner animation="border" size="sm" />
                                  : <UserMinus size={14} />}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
                {selected.members?.length > 0 && (
                  <Card.Footer className="bg-white text-muted small">
                    Нийт {selected.members.length} гишүүн
                  </Card.Footer>
                )}
              </Card>
            ) : (
              <div className="text-center text-muted py-5 small">Бүлэг сонгоно уу</div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <SubGroupFormModal
        show={formModal}
        onHide={() => setFormModal(false)}
        clubId={clubId}
        subgroup={editTarget}
        onSaved={handleSaved}
      />
      <AddMembersModal
        show={addMembersModal}
        onHide={() => setAddMembersModal(false)}
        subgroup={selected}
        clubMembers={clubMembers}
        onAdded={(updated) => {
          setSelected(updated);
          setSubgroups(prev => prev.map(g => g.id === updated.id ? updated : g));
        }}
      />
      <AutoGroupModal
        show={autoGroupModal}
        onHide={() => setAutoGroupModal(false)}
        clubId={clubId}
        onDone={() => { fetchSubgroups(); showToast?.('Дэд бүлгүүд үүсгэгдлээ', 'success'); }}
      />
    </div>
  );
};

export default ClubSubGroupsPage;
