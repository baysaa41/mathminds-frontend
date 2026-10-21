// src/components/olympiad/AdminSheetMoveRequests.jsx
// Оролцогчдын «ноорог хуудсыг бодлого руу шилжүүлэх» хүсэлтүүд: зургийг харж баталгаажуулна/татгалзана.

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { decideSheetMoveRequest, getAdminSheetMoveRequests } from '../../services/olympiadService';

export default function AdminSheetMoveRequests({ slug, onChanged }) {
  const [items, setItems] = useState(null);
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => getAdminSheetMoveRequests(slug).then(setItems).catch(() => setItems([])), [slug]);
  useEffect(() => { load(); }, [load]);

  const decide = async (r, decision) => {
    setBusy(r.id); setError(null); setMsg(null);
    try {
      await decideSheetMoveRequest(r.id, decision, notes[r.id] || '');
      setMsg(`№${r.participant_no} ${r.full_name}: бодлого ${r.to_problem} — ${decision === 'approve' ? 'батлагдлаа' : 'татгалзлаа'}.`);
      await load();
      if (onChanged) await onChanged();
    } catch (e) {
      setError(e?.response?.data?.error || 'Шийдвэр хадгалахад алдаа гарлаа.');
    } finally { setBusy(null); }
  };

  if (!items || !items.length) {
    return msg ? <Alert variant="success" className="mb-3 py-2">{msg}</Alert> : null;
  }
  return (
    <Card className="mb-3 border-info">
      <Card.Header>📨 Ноорог шилжүүлэх хүсэлт ({items.length})</Card.Header>
      <Card.Body>
        {msg && <Alert variant="success" className="py-1">{msg}</Alert>}
        {error && <Alert variant="danger" className="py-1">{error}</Alert>}
        <Row className="g-3">
          {items.map((r) => (
            <Col key={r.id} xs={12} md={6} lg={4}>
              <div className="border rounded p-2 h-100">
                <a href={r.image_url} target="_blank" rel="noreferrer">
                  <img src={r.image_url} alt="Ноорог хуудас" loading="lazy" className="img-fluid border rounded mb-2"
                       style={{ width: '100%', maxHeight: 240, objectFit: 'cover', objectPosition: 'top' }} />
                </a>
                <div className="small mb-1">
                  <b>№{r.participant_no} {r.full_name}</b> → <Badge bg="primary">Бодлого {r.to_problem}</Badge>
                </div>
                {r.note && <div className="small text-muted mb-1">«{r.note}»</div>}
                <Form.Control size="sm" className="mb-2" placeholder="Тайлбар (заавал биш)" value={notes[r.id] || ''}
                              onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} />
                <div className="d-flex gap-2">
                  <Button size="sm" variant="success" disabled={busy === r.id} onClick={() => decide(r, 'approve')}>Батлах</Button>
                  <Button size="sm" variant="outline-danger" disabled={busy === r.id} onClick={() => decide(r, 'reject')}>Татгалзах</Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}
