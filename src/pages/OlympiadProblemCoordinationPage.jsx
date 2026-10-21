// src/pages/OlympiadProblemCoordinationPage.jsx
// Нэг бодлогын координацийн хуудас (ахлагч / гол координатор): явц, хэн хэдийг тавьсан, онооны тархалт,
// өөрчлөлтийн түүх, засалтыг баталгаажуулах.

import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Container, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import authService from '../services/authService';
import { apiErrorText, confirmGradingProblem, fmtDate, getGradingCoordination } from '../services/olympiadService';

export default function OlympiadProblemCoordinationPage() {
  const { slug, n } = useParams();
  const [params] = useSearchParams();
  const problemNo = Number(n);
  const category = params.get('c') ?? undefined;  // ангилал бүр өөр бодлоготой — бодлого ангилалтай хамт тодорно
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => getGradingCoordination(slug, problemNo, category).then(setD)
    .catch((e) => setError(e.response?.status === 403 ? 'Та энэ бодлогын ахлагч биш байна.'
      : apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа'))), [slug, problemNo, category]);
  useEffect(() => { setD(null); load(); }, [load]);

  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!d) return <div className="py-5 text-center"><Spinner animation="border" /></div>;

  const left = d.total - d.graded;
  const confirm = async (on) => {
    setBusy(true); setError(null);
    try {
      try {
        await confirmGradingProblem(slug, problemNo, { category, confirm: on });
      } catch (e) {
        if (!(on && e.response?.data?.ungraded && window.confirm(`${e.response.data.error}. Дутуу байсан ч баталгаажуулах уу?`))) throw e;
        await confirmGradingProblem(slug, problemNo, { category, confirm: true, force: true });
      }
      await load();
    } catch (e) { setError(apiErrorText(e.response?.data, 'Алдаа гарлаа')); } finally { setBusy(false); }
  };
  const maxCount = Math.max(1, ...Object.values(d.distribution));

  return (
    <Container className="py-3">
      <div className="mb-2"><Link to={`/olympiads/${slug}/grade?c=${d.category_id}&p=${problemNo}`}>← Засвар руу</Link></div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">{d.category ? `${d.category} · ` : ''}Бодлого {problemNo} · координац {d.confirmed && <Badge bg="success">Баталгаажсан</Badge>}</h1>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-primary" to={`/olympiads/${slug}/grade?c=${d.category_id}&p=${problemNo}`}>Засах</Link>
          {d.confirmed
            ? <Button variant="outline-secondary" disabled={busy} onClick={() => confirm(false)}>Баталгаажуулалтыг буцаах</Button>
            : <Button variant="success" disabled={busy} onClick={() => confirm(true)}>✓ Баталгаажуулах</Button>}
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {d.confirmed && <Alert variant="success" className="py-2">
        {d.confirmed_by} баталгаажуулсан ({fmtDate(d.confirmed_at)}). Засагчид оноог өөрчилж чадахгүй.</Alert>}
      <Row className="g-3 mb-3">
        <Col md={6}>
          <Card className="h-100"><Card.Body>
            <div className="mb-1">Явц: <b>{d.graded}</b> / {d.total} {left > 0 && <span className="text-danger">({left} оноогүй)</span>}</div>
            <ProgressBar now={d.total ? (100 * d.graded) / d.total : 0} variant={left ? 'primary' : 'success'} />
            {d.pending_defense > 0 && <Alert variant="warning" className="py-1 small mt-3 mb-0">
              {d.pending_defense} бодолт хамгаалах хүсэлт шийдэгдээгүй.</Alert>}
            <div className="mt-3 small"><b>Ахлагч:</b> {d.leads.length ? d.leads.map((x) => x.name).join(', ') : '—'}</div>
            <div className="small"><b>Засагчид:</b> {d.assigned.length ? d.assigned.map((x) => x.name).join(', ') : '— (оноогоогүй)'}</div>
          </Card.Body></Card>
        </Col>
        <Col md={6}>
          <Card className="h-100"><Card.Header>Онооны тархалт (дээд {d.max_score})</Card.Header><Card.Body>
            {Object.keys(d.distribution).length === 0 && <span className="text-muted">Оноо алга.</span>}
            {Object.entries(d.distribution).map(([score, c]) => (
              <div key={score} className="d-flex align-items-center gap-2 small">
                <span style={{ width: 36 }} className="text-end">{score}</span>
                <div style={{ width: `${(100 * c) / maxCount}%`, minWidth: 4, height: 12 }} className="bg-primary rounded" />
                <span>{c}</span>
              </div>
            ))}
          </Card.Body></Card>
        </Col>
      </Row>
      <Card className="mb-3">
        <Card.Header>Хэн хэдийг тавьсан</Card.Header>
        <Table size="sm" className="mb-0">
          <thead><tr><th>Засагч</th><th>Тавьсан оноо</th><th>Сүүлд</th></tr></thead>
          <tbody>
            {d.graders.map((g) => <tr key={g.user_id ?? g.name}><td>{g.name}</td><td>{g.count}</td><td>{fmtDate(g.last_at)}</td></tr>)}
            {!d.graders.length && <tr><td colSpan={3} className="text-muted text-center">Одоогоор оноо тавиагүй.</td></tr>}
          </tbody>
        </Table>
      </Card>
      <Card>
        <Card.Header>Өөрчлөлтийн түүх (сүүлийн {d.log.length})</Card.Header>
        <div className="table-responsive" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <Table size="sm" className="mb-0">
            <thead><tr><th>Цаг</th><th>Оролцогч</th><th>Оноо</th><th>Хэн</th><th>Шалтгаан</th></tr></thead>
            <tbody>
              {d.log.map((l, i) => (
                <tr key={i}><td>{fmtDate(l.at)}</td><td>№{l.participant_no}</td><td>{l.old ?? '—'} → <b>{l.new}</b></td><td>{l.by || '—'}</td><td>{l.reason}</td></tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
}
