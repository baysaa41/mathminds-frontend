// src/components/olympiad/AdminResultPanels.jsx
// Олимпиадын админ: оноо оруулах (хүснэгт + CSV), дүн нийтлэх, дүнгийн хуудас, материал, бодолт хамгаалах хүсэлт

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row, Spinner, Table } from 'react-bootstrap';
import ResultsTable from './ResultsTable';
import {
  apiErrorText, createAdminMaterial, decideDefenseRequest, DEFENSE_STATUS, deleteAdminMaterial, fmtDate, fmtScore,
  getAdminDefenseRequests, getAdminMaterials, getAdminResults, getAdminScores, importScoresCsv, publishResults,
  saveAdminScores, setMaxScore, updateAdminMaterial,
} from '../../services/olympiadService';

const Loading = () => <div className="py-4 text-center"><Spinner animation="border" size="sm" /></div>;
const cellKey = (regId, n) => `${regId}:${n}`;
// Шалгах: хоосон эсвэл 0..max, таслал/цэг бутархай
const validScore = (v, max) => {
  const t = String(v).trim().replace(',', '.');
  if (t === '') return true;
  const n = Number(t);
  return !Number.isNaN(n) && n >= 0 && n <= max;
};

// ── Оноо ────────────────────────────────────────────────────────────────────

export function AdminScoresPanel({ slug, active }) {
  const [grid, setGrid] = useState(null);
  const [edits, setEdits] = useState({});  // {"regId:n": "6.5"} — хадгалаагүй өөрчлөлт
  const [filter, setFilter] = useState({ q: '', category: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [csv, setCsv] = useState({ file: null, result: null });
  const [hours, setHours] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const load = useCallback(() => getAdminScores(slug).then((g) => {
    setGrid(g);
    setHours(String(g.defense_window_hours));
    setMaxInput(String(g.max_score));
  }).catch(() => setError('Оноо ачаалахад алдаа гарлаа')), [slug]);
  useEffect(() => { if (active && !grid) load(); }, [active, grid, load]);

  const categories = useMemo(() => [...new Set((grid?.rows || []).map((r) => r.category))].filter(Boolean), [grid]);
  const rows = useMemo(() => (grid?.rows || []).filter((r) => {
    const q = filter.q.trim().toLowerCase();
    return (!filter.category || r.category === filter.category)
      && (!q || String(r.participant_no).includes(q) || r.full_name.toLowerCase().includes(q));
  }), [grid, filter]);

  if (!grid) return error ? <Alert variant="danger">{error}</Alert> : <Loading />;
  const problems = Array.from({ length: grid.problem_count }, (_, i) => i + 1);
  const dirty = Object.keys(edits).length;
  const invalid = Object.values(edits).some((v) => !validScore(v, grid.max_score));
  const published = Boolean(grid.results_published_at);

  const setCell = (row, n, value) => {
    const k = cellKey(row.registration_id, n);
    const original = row.scores[n - 1] === null ? '' : String(row.scores[n - 1]);
    setEdits((e) => {
      const next = { ...e };
      if (value === original) delete next[k]; else next[k] = value;
      return next;
    });
  };

  const save = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const changes = Object.entries(edits).map(([k, v]) => {
        const [registration_id, problem_no] = k.split(':').map(Number);
        return { registration_id, problem_no, score: v.trim().replace(',', '.') };
      });
      const r = await saveAdminScores(slug, changes);
      setGrid(r); setEdits({});
      setMsg(`${r.changed} оноо хадгалагдлаа.`);
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Хадгалахад алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  const runCsv = async (dryRun) => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const r = await importScoresCsv(slug, csv.file, dryRun);
      setCsv({ ...csv, result: r });
      if (r.ok && !dryRun) {
        setMsg(`CSV: ${r.rows} оролцогч, ${r.changes} оноо шинэчлэгдлээ.`);
        setCsv({ file: null, result: null });
        setEdits({});
        await load();
      }
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'CSV уншихад алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  const saveMax = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      const g = await setMaxScore(slug, Number(maxInput));
      setGrid(g);
      setMsg(`Нэг бодлогын дээд оноо ${g.max_score} боллоо.`);
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Хадгалахад алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  const togglePublish = async () => {
    setBusy(true); setError(null); setMsg(null);
    try {
      setGrid(await publishResults(slug, !published, hours === '' ? undefined : Number(hours)));
      setMsg(published ? 'Дүнг нуулаа.' : 'Дүн нийтлэгдлээ — сурагчид оноогоо харж, хамгаалах хүсэлт гаргаж эхэлнэ.');
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  return (
    <>
      {msg && <Alert variant="success" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>Дүн нийтлэх</Card.Header>
            <Card.Body>
              <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
                <InputGroup size="sm" style={{ maxWidth: 260 }}>
                  <InputGroup.Text>Нэг бодлогын дээд оноо</InputGroup.Text>
                  <Form.Control type="number" min={1} max={100} value={maxInput}
                                onChange={(e) => setMaxInput(e.target.value)} />
                </InputGroup>
                <Button size="sm" variant="outline-primary" onClick={saveMax}
                        disabled={busy || dirty > 0 || !maxInput || Number(maxInput) === grid.max_score}>
                  Хадгалах
                </Button>
                <span className="small text-muted">Нийт: {grid.max_score * grid.problem_count}</span>
              </div>
              {published ? (
                <p className="small mb-2">
                  <Badge bg="success">Нийтлэгдсэн</Badge> {fmtDate(grid.results_published_at)} · бодолт хамгаалах
                  хүсэлт {fmtDate(grid.defense_deadline)} хүртэл.
                </p>
              ) : (
                <p className="small text-muted mb-2">
                  Нийтэлсний дараа сурагчид оноо, байраа харж, заасан хугацаанд бодолт хамгаалах хүсэлт гаргана.
                </p>
              )}
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <InputGroup size="sm" style={{ maxWidth: 230 }}>
                  <InputGroup.Text>Хамгаалах хугацаа</InputGroup.Text>
                  <Form.Control type="number" min={0} max={720} value={hours} onChange={(e) => setHours(e.target.value)} />
                  <InputGroup.Text>цаг</InputGroup.Text>
                </InputGroup>
                <Button size="sm" variant={published ? 'outline-danger' : 'success'} onClick={togglePublish}
                        disabled={busy || dirty > 0}>
                  {published ? 'Дүнг нуух' : 'Дүн нийтлэх'}
                </Button>
              </div>
              {dirty > 0 && <div className="small text-warning mt-1">Эхлээд өөрчлөлтөө хадгална уу.</div>}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>CSV-ээс оруулах</Card.Header>
            <Card.Body>
              <p className="small text-muted mb-2">
                Толгой мөр: <code>participant_no,p1,p2,…,p{grid.problem_count}</code>. Хоосон нүд — өөрчлөхгүй.
                Алдаатай мөр байвал юу ч хадгалахгүй.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <Form.Control size="sm" type="file" accept=".csv,text/csv" style={{ maxWidth: 260 }}
                              onChange={(e) => setCsv({ file: e.target.files[0] || null, result: null })} />
                <Button size="sm" variant="outline-primary" disabled={!csv.file || busy} onClick={() => runCsv(true)}>Шалгах</Button>
                <Button size="sm" disabled={!csv.result?.ok || busy} onClick={() => runCsv(false)}>Хадгалах</Button>
              </div>
              {csv.result && (csv.result.ok ? (
                <div className="small mt-2 text-success">
                  Алдаагүй: {csv.result.rows} оролцогч, {csv.result.changes} оноо өөрчлөгдөнө.
                </div>
              ) : (
                <Alert variant="danger" className="small mt-2 mb-0 py-2">
                  {csv.result.errors.slice(0, 20).map((e) => <div key={`${e.line}-${e.error}`}>Мөр {e.line}: {e.error}</div>)}
                  {csv.result.errors.length > 20 && <div>… нийт {csv.result.errors.length} алдаа</div>}
                </Alert>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header className="d-flex gap-2 flex-wrap align-items-center">
          <span className="me-auto">Оноо ({rows.length} / {grid.rows.length})</span>
          <Form.Control size="sm" placeholder="№ эсвэл нэр" style={{ maxWidth: 180 }} value={filter.q}
                        onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
          {categories.length > 1 && (
            <Form.Select size="sm" style={{ maxWidth: 200 }} value={filter.category}
                         onChange={(e) => setFilter({ ...filter, category: e.target.value })}>
              <option value="">Бүх ангилал</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          )}
          <Button size="sm" onClick={save} disabled={!dirty || invalid || busy}>
            {busy ? <Spinner size="sm" animation="border" /> : `Хадгалах${dirty ? ` (${dirty})` : ''}`}
          </Button>
          {dirty > 0 && <Button size="sm" variant="link" onClick={() => setEdits({})}>Болих</Button>}
        </Card.Header>
        <div className="table-responsive">
          <Table size="sm" className="mb-0 align-middle">
            <thead>
              <tr>
                <th>№</th><th>Овог нэр</th><th className="d-none d-lg-table-cell">Ангилал</th>
                {problems.map((n) => <th key={n} className="text-center">P{n}</th>)}
                <th className="text-center">Нийт</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.registration_id}>
                  <td>{r.participant_no}</td>
                  <td>{r.full_name}<div className="small text-muted d-lg-none">{r.category}</div></td>
                  <td className="d-none d-lg-table-cell small">{r.category}</td>
                  {problems.map((n) => {
                    const k = cellKey(r.registration_id, n);
                    const value = k in edits ? edits[k] : (r.scores[n - 1] ?? '');
                    const bad = k in edits && !validScore(edits[k], grid.max_score);
                    return (
                      <td key={n} className="text-center" style={{ minWidth: 64 }}>
                        <Form.Control size="sm" inputMode="decimal" value={value} isInvalid={bad}
                                      className={`text-center ${k in edits && !bad ? 'border-warning' : ''}`}
                                      onChange={(e) => setCell(r, n, e.target.value)} />
                      </td>
                    );
                  })}
                  <td className="text-center fw-semibold">{fmtScore(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  );
}

// ── Дүнгийн хуудас (нийтлээгүй ч админд) ───────────────────────────────────

export function AdminResultsPanel({ slug, active }) {
  const [data, setData] = useState(null);
  useEffect(() => { if (active) getAdminResults(slug).then(setData).catch(() => setData({ error: true })); }, [active, slug]);
  if (!data) return <Loading />;
  if (data.error) return <Alert variant="danger">Ачаалахад алдаа гарлаа</Alert>;
  return <ResultsTable categories={data.categories} problemCount={data.problem_count} />;
}

// ── Материал ────────────────────────────────────────────────────────────────

const KINDS = [['PROBLEMS', 'Бодлого'], ['SOLUTIONS', 'Бодолт'], ['RESULTS', 'Дүн'], ['OTHER', 'Бусад']];
const AUDIENCES = [['PARTICIPANTS', 'Зөвхөн оролцогчид'], ['ALL', 'Бүх хүн']];
// datetime-local input ↔ ISO (орон нутгийн цагаар)
const toLocalInput = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyMaterial = () => ({ title: '', kind: 'PROBLEMS', audience: 'PARTICIPANTS', url: '', file: null,
  visible_from: toLocalInput() });

export function AdminMaterialsPanel({ slug, active }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(emptyMaterial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => getAdminMaterials(slug).then(setItems).catch(() => setError('Ачаалахад алдаа гарлаа')), [slug]);
  useEffect(() => { if (active && !items) load(); }, [active, items, load]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await createAdminMaterial(slug, { ...form, visible_from: new Date(form.visible_from).toISOString() });
      setForm(emptyMaterial());
      e.target.reset();
      await load();
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Хадгалахад алдаа гарлаа'));
    } finally { setBusy(false); }
  };
  const patch = async (m, payload) => {
    try {
      const updated = await updateAdminMaterial(m.id, payload);
      setItems((list) => list.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) { setError(apiErrorText(err.response?.data, 'Хадгалахад алдаа гарлаа')); }
  };
  const remove = async (m) => {
    try {
      await deleteAdminMaterial(m.id);
      setItems((list) => list.filter((x) => x.id !== m.id));
    } catch { setError('Устгахад алдаа гарлаа'); }
  };

  if (!items) return error ? <Alert variant="danger">{error}</Alert> : <Loading />;
  const now = Date.now();
  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      <Card className="mb-3">
        <Card.Header>Материал нэмэх</Card.Header>
        <Card.Body>
          <Form onSubmit={submit}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control required placeholder="Гарчиг" value={form.title}
                              onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Col>
              <Col xs={6} md={2}>
                <Form.Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  {KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Form.Select>
              </Col>
              <Col xs={6} md={3}>
                <Form.Select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text className="small">Харагдах</InputGroup.Text>
                  <Form.Control type="datetime-local" value={form.visible_from}
                                onChange={(e) => setForm({ ...form, visible_from: e.target.value })} />
                </InputGroup>
              </Col>
              <Col md={5}>
                <Form.Control type="file" onChange={(e) => setForm({ ...form, file: e.target.files[0] || null })} />
              </Col>
              <Col md={5}>
                <Form.Control type="url" placeholder="эсвэл холбоос (https://…)" value={form.url}
                              onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </Col>
              <Col md={2}>
                <Button type="submit" className="w-100" disabled={busy || (!form.file && !form.url)}>
                  {busy ? <Spinner size="sm" animation="border" /> : 'Нэмэх'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Материалууд ({items.length})</Card.Header>
        <div className="table-responsive">
          <Table size="sm" className="mb-0 align-middle">
            <tbody>
              {items.length === 0 && <tr><td className="text-muted small p-3">Материал алга.</td></tr>}
              {items.map((m) => (
                <tr key={m.id}>
                  <td><Badge bg="secondary">{m.kind_label}</Badge></td>
                  <td><a href={m.file_url || m.url} target="_blank" rel="noreferrer">{m.title}</a></td>
                  <td>
                    <Form.Select size="sm" value={m.audience} onChange={(e) => patch(m, { audience: e.target.value })}>
                      {AUDIENCES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Form.Select>
                  </td>
                  <td className="small">
                    {new Date(m.visible_from).getTime() > now
                      ? <Badge bg="warning" text="dark">{fmtDate(m.visible_from)}-оос</Badge>
                      : <Badge bg="success">Харагдаж байна</Badge>}
                  </td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-danger" onClick={() => remove(m)}>Устгах</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  );
}

// ── Бодолт хамгаалах хүсэлт ─────────────────────────────────────────────────

function DefenseDecisionCard({ req, maxScore, onDecided }) {
  const [response, setResponse] = useState(req.response || '');
  const [newScore, setNewScore] = useState(req.current_score ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const decided = ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(req.status);

  const decide = async (status) => {
    setBusy(true); setError(null);
    try {
      onDecided(await decideDefenseRequest(req.id, {
        status, response, new_score: status === 'ACCEPTED' ? String(newScore).replace(',', '.') : undefined,
      }));
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between flex-wrap gap-1">
        <span>
          <strong>№{req.participant_no} {req.full_name}</strong> · Бодлого №{req.problem_no}
          {req.category && <span className="text-muted small"> · {req.category}</span>}
        </span>
        <span>
          <Badge bg={DEFENSE_STATUS[req.status][0]}>{req.status_label}</Badge>
          <span className="small text-muted ms-2">{fmtDate(req.created_at)}</span>
        </span>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          <Col md={6}>
            <div className="small text-muted">Сурагчийн тайлбар</div>
            <div className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{req.reason}</div>
            <div className="small">
              Оноо: {fmtScore(req.score_before)}
              {req.status === 'ACCEPTED' && <> → <strong>{fmtScore(req.score_after)}</strong></>}
              {!decided && <> · одоо: <strong>{fmtScore(req.current_score)}</strong></>}
            </div>
            {req.attachments.length > 0 && (
              <>
                <div className="small text-muted mt-2">Хавсралт</div>
                <div className="d-flex gap-2 flex-wrap">
                  {req.attachments.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="border" style={{ height: 90 }} /></a>
                  ))}
                </div>
              </>
            )}
          </Col>
          <Col md={6}>
            <div className="small text-muted">Скан хуудас</div>
            {req.sheet_images.length === 0 ? <div className="small text-muted">Скан алга</div> : (
              <div className="d-flex gap-2 flex-wrap">
                {req.sheet_images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="border" style={{ height: 120 }} /></a>
                ))}
              </div>
            )}
          </Col>
        </Row>
        {decided ? (
          req.response && (
            <Alert variant="light" className="border mt-3 mb-0 small">
              <div className="fw-semibold">Хариу{req.reviewed_by_name ? ` (${req.reviewed_by_name})` : ''}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{req.response}</div>
            </Alert>
          )
        ) : (
          <div className="mt-3">
            <Form.Control as="textarea" rows={2} placeholder="Хариу тайлбар (сурагчид имэйлээр очно)" value={response}
                          onChange={(e) => setResponse(e.target.value)} className="mb-2" />
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <InputGroup size="sm" style={{ maxWidth: 180 }}>
                <InputGroup.Text>Шинэ оноо</InputGroup.Text>
                <Form.Control inputMode="decimal" value={newScore} isInvalid={!validScore(newScore, maxScore)}
                              onChange={(e) => setNewScore(e.target.value)} />
              </InputGroup>
              <Button size="sm" variant="success" disabled={busy || !response.trim() || String(newScore).trim() === ''}
                      onClick={() => decide('ACCEPTED')}>Хүлээн авах</Button>
              <Button size="sm" variant="outline-danger" disabled={busy || !response.trim()}
                      onClick={() => decide('REJECTED')}>Татгалзах</Button>
              {req.status === 'SUBMITTED' && (
                <Button size="sm" variant="link" disabled={busy} onClick={() => decide('IN_REVIEW')}>Хянаж эхлэх</Button>
              )}
            </div>
            {error && <Alert variant="danger" className="small mt-2 mb-0 py-2">{error}</Alert>}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export function AdminDefensePanel({ slug, active, maxScore = 7 }) {
  const [status, setStatus] = useState('open');
  const [items, setItems] = useState(null);
  useEffect(() => {
    if (!active) return;
    setItems(null);
    getAdminDefenseRequests(slug, status).then(setItems).catch(() => setItems([]));
  }, [active, slug, status]);

  const onDecided = (updated) => setItems((list) => (
    status === 'open' && ['ACCEPTED', 'REJECTED'].includes(updated.status)
      ? list.filter((x) => x.id !== updated.id)
      : list.map((x) => (x.id === updated.id ? updated : x))
  ));

  return (
    <>
      <div className="d-flex gap-2 align-items-center mb-3">
        <Form.Select size="sm" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Шийдээгүй</option>
          <option value="ACCEPTED">Хүлээн авсан</option>
          <option value="REJECTED">Татгалзсан</option>
          <option value="WITHDRAWN">Цуцалсан</option>
          <option value="">Бүгд</option>
        </Form.Select>
        {items && <span className="small text-muted">{items.length} хүсэлт</span>}
      </div>
      {!items ? <Loading /> : items.length === 0
        ? <div className="text-muted small">Хүсэлт алга.</div>
        : items.map((r) => <DefenseDecisionCard key={r.id} req={r} maxScore={r.max_score ?? maxScore} onDecided={onDecided} />)}
    </>
  );
}
