// src/components/olympiad/UnmatchedSheets.jsx
// Код танигдаагүй (холбогдоогүй) хуудсууд: зургийг харж, гараар бичсэн овог/нэр/ангиар бүртгэл хайгаад
// сонгосон хуудсуудыг тухайн оролцогч + бодлогод холбоно.

import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, ListGroup, Row, Spinner } from 'react-bootstrap';
import { assignImage, findRegistrations } from '../../services/olympiadService';
import { SheetViewer } from './SheetPosts';

const EMPTY = { category: '', last_name: '', first_name: '' };

export default function UnmatchedSheets({ slug, olympiad, images, onAssigned }) {
  const [picked, setPicked] = useState([]);          // сонгосон зургийн id-ууд
  const [filters, setFilters] = useState(EMPTY);
  const [found, setFound] = useState(null);          // хайлтын үр дүн (null = хайгаагүй)
  const [reg, setReg] = useState(null);
  const [problem, setProblem] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  // Аль ч хүнтэй холбогдоогүй хуудас л — оролцогч нь тодорхой (ноорог) хуудсыг энд харуулахгүй, оролцогч өөрөө харна
  const unmatched = images.filter((im) => im.sheet == null && !im.draft_registration);
  if (!unmatched.length) return null;

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  const search = async (e) => {
    e?.preventDefault();
    setError(null); setReg(null);
    setBusy(true);
    try { setFound(await findRegistrations(slug, filters)); }
    catch { setError('Хайлт амжилтгүй боллоо.'); }
    finally { setBusy(false); }
  };

  const assign = async () => {
    setError(null); setMsg(null);
    setBusy(true);
    try {
      for (const id of picked) await assignImage(id, reg.id, Number(problem));  // eslint-disable-line no-await-in-loop
      setMsg(`${picked.length} хуудсыг ${reg.last_name} ${reg.first_name} (#${reg.participant_no}), бодлого ${problem}-д холболоо.`);
      setPicked([]); setReg(null);
      await onAssigned();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Холбох үед алдаа гарлаа.');
    } finally { setBusy(false); }
  };

  const problems = Array.from({ length: olympiad?.problem_count || 8 }, (_, i) => i + 1);
  return (
    <Card className="mb-3 border-warning">
      <Card.Header>⚠️ Холбогдоогүй хуудас ({unmatched.length}) — гараар холбох</Card.Header>
      <Card.Body>
        <div className="small text-muted mb-2">
          Код танигдаагүй хуудсыг томруулж үзээд гараар бичсэн овог, нэр, ангиар доор хайж, холбох хуудсуудаа сонгоно.
        </div>
        <SheetViewer depsKey={unmatched.map((u) => u.id).join('|')}>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {unmatched.map((im) => (
              <label key={im.id} className="border rounded p-1 text-center" style={{ width: 130, cursor: 'pointer' }}>
                <img src={im.url} alt={`Холбогдоогүй хуудас ${im.order + 1}`} loading="lazy" style={{ width: '100%', height: 150, objectFit: 'cover', objectPosition: 'top' }} />
                <Form.Check type="checkbox" className="mt-1" label={`№${im.order + 1}`} checked={picked.includes(im.id)}
                            onChange={() => toggle(im.id)} />
              </label>
            ))}
          </div>
        </SheetViewer>

        <Form onSubmit={search}>
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Select size="sm" value={filters.category} onChange={setFilter('category')} aria-label="Ангилал">
                <option value="">Бүх ангилал</option>
                {(olympiad?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}><Form.Control size="sm" placeholder="Овог" value={filters.last_name} onChange={setFilter('last_name')} /></Col>
            <Col md={3}><Form.Control size="sm" placeholder="Нэр" value={filters.first_name} onChange={setFilter('first_name')} /></Col>
            <Col md={3}><Button type="submit" size="sm" disabled={busy}>{busy ? <Spinner size="sm" animation="border" /> : 'Хайх'}</Button></Col>
          </Row>
        </Form>

        {found && (
          <ListGroup className="mt-2" style={{ maxHeight: 240, overflowY: 'auto' }}>
            {found.length === 0 && <ListGroup.Item className="text-muted small">Олдсонгүй.</ListGroup.Item>}
            {found.map((r) => (
              <ListGroup.Item key={r.id} action active={reg?.id === r.id} onClick={() => setReg(r)} className="small">
                #{r.participant_no} · {r.last_name} {r.first_name} · {r.category} · {r.school}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        {found?.length >= 30 && <div className="small text-muted mt-1">Эхний 30-ыг харуулав — шүүлтүүрийг нарийсгана уу.</div>}

        {reg && (
          <div className="d-flex gap-2 align-items-center mt-3 flex-wrap">
            <span className="small">Сонгосон: <b>#{reg.participant_no} {reg.last_name} {reg.first_name}</b></span>
            <Form.Select size="sm" style={{ width: 130 }} value={problem} onChange={(e) => setProblem(e.target.value)} aria-label="Бодлого">
              {problems.map((p) => <option key={p} value={p}>Бодлого {p}</option>)}
            </Form.Select>
            <Button size="sm" variant="success" disabled={busy || !picked.length} onClick={assign}>
              {picked.length ? `${picked.length} хуудсыг холбох` : 'Хуудас сонгоно уу'}
            </Button>
          </div>
        )}
        {error && <Alert variant="danger" className="mt-2 mb-0 py-1">{error}</Alert>}
        {msg && <Alert variant="success" className="mt-2 mb-0 py-1">{msg}</Alert>}
      </Card.Body>
    </Card>
  );
}
