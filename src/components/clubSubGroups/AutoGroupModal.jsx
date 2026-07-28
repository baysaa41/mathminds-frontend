// src/components/clubSubGroups/AutoGroupModal.jsx
// Дүнгийн дагуу автоматаар дэд бүлэгт хуваах modal

import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Wand2, GraduationCap } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { METHOD_OPTIONS } from './constants.js';

export const AutoGroupModal = ({ show, onHide, clubId, onDone }) => {
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
    setForm(f => ({
      ...f,
      assignment_id: '', n_groups: 3, name_prefix: 'Бүлэг',
      replace_existing: false, method: 'answer',
    }));
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
      const payload = {
        n_groups: form.n_groups,
        name_prefix: form.name_prefix,
        replace_existing: form.replace_existing,
        method: form.method,
      };
      const res = await apiClient.post(
        `/api/club-assignments/${form.assignment_id}/auto_group/`,
        payload,
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

                  {/* Хөтөлбөрийн үр дүн */}
                  {g.curriculum && (
                    <div className="mt-2 pt-2 border-top">
                      <div className="text-muted mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                        <GraduationCap size={11} />{g.curriculum.program}
                      </div>
                      {g.curriculum.weeks?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {g.curriculum.weeks.map(w => (
                            <Badge key={w.week_num} bg="success" style={{ fontSize: '0.65rem' }}>
                              {w.week_num}-р 7 хоног: {w.objectives_added} зорилго
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted small">Хөтөлбөрт тохирох сэдэв олдсонгүй.</div>
                      )}
                    </div>
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
              className="small mb-3" />

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
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Хуваж байна...
              </>
            ) : (
              <><Wand2 size={14} className="me-1" />Хуваах</>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
