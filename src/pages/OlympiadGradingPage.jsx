// src/pages/OlympiadGradingPage.jsx
// Координаторын онлайн засвар: нэг бодлогын оролцогч бүрийн скан бодолтыг Viewer.js-ээр (томруулах, эргүүлэх)
// үзэж, хажууд нь оноо + тайлбар тавина. Бодолт хамгаалах хүсэлтийг мөн энд хянаж дахин дүгнэнэ.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Container, Form, ListGroup, Modal, ProgressBar, Row, Spinner, Tab, Tabs } from 'react-bootstrap';
import GradingTeamPanel from '../components/olympiad/GradingTeamPanel';
import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
import authService from '../services/authService';
import {
  apiErrorText, confirmAllGrading, decideGradingDefense, DEFENSE_STATUS, getGradingDefenses, getGradingMaterials,
  getGradingOverview, getGradingProblem, saveGradingScore,
} from '../services/olympiadService';

const isPdf = (url) => /\.pdf(\?|$)/i.test(url || '');
const validScore = (v, max) => {
  const t = String(v).trim().replace(',', '.');
  if (t === '') return true;
  const n = Number(t);
  return !Number.isNaN(n) && n >= 0 && n <= max;
};
const norm = (v) => String(v).trim().replace(',', '.');

// Нэг оролцогчийн хуудсуудыг inline viewer-т харуулна (toolbar: zoom, 1:1, эргүүлэх, өмнөх/дараах хуудас)
function ScanViewer({ pages, label }) {
  const ref = useRef(null);
  const images = pages.filter((p) => !isPdf(p.url));
  const pdfs = pages.filter((p) => isPdf(p.url));
  useEffect(() => {
    if (!ref.current || !images.length) return undefined;
    const viewer = new Viewer(ref.current, {
      inline: true, navbar: images.length > 1, title: false, zoomRatio: 0.3, maxZoomRatio: 12, keyboard: false,
      toolbar: { zoomIn: 1, zoomOut: 1, oneToOne: 1, reset: 1, prev: 1, play: 0, next: 1, rotateLeft: 1, rotateRight: 1,
        flipHorizontal: 0, flipVertical: 0 },
    });
    return () => viewer.destroy();
  }, [images.map((p) => p.url).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="grading-viewer border rounded" style={{ height: '72vh', minHeight: 360, position: 'relative' }}>
        <ul ref={ref} className="d-none">
          {images.map((p, i) => <li key={p.url}><img src={p.url} alt={`${label} · хуудас ${p.page_no ?? i + 1}`} /></li>)}
        </ul>
      </div>
      {pdfs.map((p) => <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="d-block mt-1">PDF нээх</a>)}
      {!pages.length && <div className="text-muted p-3">Скан алга.</div>}
    </>
  );
}

// Засалтын схем: тухайн бодлогод холбогдсон + ерөнхий. Зураг/PDF-г modal дотор, бусдыг шинэ цонхонд нээнэ.
function MarkingSchemeButton({ materials, problemNo, categoryId }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const list = materials.filter((m) => (m.category == null || m.category === categoryId)
    && (m.problem_no == null || m.problem_no === problemNo));
  if (!list.length) return <Button size="sm" variant="outline-secondary" disabled>Засалтын схем алга</Button>;
  const m = picked || list[0];
  const href = m.file_url || m.url;
  const isImg = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(href || '');
  return (
    <>
      <Button size="sm" variant="outline-primary" onClick={() => { setPicked(null); setOpen(true); }}>📋 Засалтын схем</Button>
      <Modal show={open} onHide={() => setOpen(false)} size="xl" fullscreen="lg-down">
        <Modal.Header closeButton>
          <Modal.Title className="h6">Бодлого {problemNo} · засалтын схем</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {list.length > 1 && (
            <ButtonGroup size="sm" className="mb-2 flex-wrap">
              {list.map((x) => (
                <Button key={x.id} variant={x.id === m.id ? 'primary' : 'outline-primary'} onClick={() => setPicked(x)}>
                  {x.title}{x.problem_no == null ? ' (ерөнхий)' : ''}
                </Button>
              ))}
            </ButtonGroup>
          )}
          {isImg ? <img src={href} alt={m.title} className="img-fluid" />
            : <iframe title={m.title} src={href} style={{ width: '100%', height: '75vh', border: 0 }} />}
          <a href={href} target="_blank" rel="noreferrer" className="d-block mt-2 small">Шинэ цонхонд нээх ↗</a>
        </Modal.Body>
      </Modal>
    </>
  );
}

function ProblemGrader({ slug, problemNo, categoryId, max, onProgress, isManager, published }) {
  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const scoreRef = useRef(null);

  useEffect(() => {
    setData(null); setIdx(0); setError(null);
    getGradingProblem(slug, problemNo, categoryId).then(setData).catch((e) => setError(apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа')));
  }, [slug, problemNo, categoryId]);

  const items = useMemo(() => (data?.items || []).filter((it) => !onlyOpen || it.score === null || it.score === undefined), [data, onlyOpen]);
  const cur = items[Math.min(idx, items.length - 1)];
  useEffect(() => {
    setScore(cur && cur.score != null ? String(cur.score) : '');
    setComment(cur?.comment || '');
    scoreRef.current?.focus();
  }, [cur?.registration_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const locked = Boolean(data?.confirmed) || (published && !isManager);
  const dirty = cur && (norm(score) !== (cur.score != null ? String(cur.score) : '') || comment.trim() !== (cur.comment || ''));

  const save = useCallback(async (goNext) => {
    if (!cur) return;
    if (!validScore(score, max)) { setError(`Оноо 0–${max} хооронд байна`); return; }
    setBusy(true); setError(null);
    try {
      const r = await saveGradingScore(slug, { registration_id: cur.registration_id, problem_no: problemNo,
        score: norm(score), comment: comment.trim() });
      setData((d) => ({ ...d, items: d.items.map((it) => (it.registration_id === cur.registration_id
        ? { ...it, score: r.score, comment: r.comment, graded_by: r.graded_by } : it)) }));
      onProgress();
      if (goNext) setIdx((i) => Math.min(i + 1, items.length - 1));
    } catch (e) {
      setError(apiErrorText(e.response?.data, 'Хадгалахад алдаа гарлаа'));
    } finally { setBusy(false); }
  }, [cur, score, comment, max, slug, problemNo, items.length, onProgress]);

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); save(true); }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
  };

  if (error && !data) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <div className="py-4 text-center"><Spinner animation="border" size="sm" /></div>;
  if (!data.items.length) return <Alert variant="light">Энэ бодлогод скан хийгдсэн бодолт алга.</Alert>;

  return (
    <Row className="g-3" onKeyDown={onKey}>
      <Col lg={8}>
        {cur ? <ScanViewer key={cur.registration_id} pages={cur.pages} label={`№${cur.participant_no} · Бодлого ${problemNo}`} /> : null}
      </Col>
      <Col lg={4}>
        <Card className="mb-3">
          <Card.Body>
            {cur ? (
              <>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-semibold fs-5">№{cur.participant_no}{cur.full_name ? ` ${cur.full_name}` : ''}</div>
                    <div className="small text-muted">{cur.category} · {cur.pages.length} хуудас</div>
                  </div>
                  <div className="text-muted small">{items.indexOf(cur) + 1} / {items.length}</div>
                </div>
                {cur.defense_status && <Alert variant="warning" className="py-1 small">
                  Бодолт хамгаалах хүсэлттэй: {DEFENSE_STATUS[cur.defense_status]?.[1] || cur.defense_status}</Alert>}
                <Form.Label className="small mb-1">Оноо (0–{max})</Form.Label>
                <Form.Control ref={scoreRef} value={score} inputMode="decimal" disabled={locked} isInvalid={!validScore(score, max)}
                              onChange={(e) => setScore(e.target.value)} className="mb-2" />
                <div className="d-flex flex-wrap gap-1 mb-2">
                  {Array.from({ length: Math.min(max, 10) + 1 }, (_, i) => i).map((n) => (
                    <Button key={n} size="sm" disabled={locked} variant={norm(score) === String(n) ? 'primary' : 'outline-secondary'}
                            onClick={() => setScore(String(n))}>{n}</Button>
                  ))}
                </div>
                <Form.Label className="small mb-1">Тайлбар (дотоод — сурагчид харагдахгүй)</Form.Label>
                <Form.Control as="textarea" rows={3} value={comment} disabled={locked} maxLength={2000}
                              placeholder="Жишээ: лемм нотлоогүй, −1 тооцооллын алдаа" onChange={(e) => setComment(e.target.value)} />
                {error && <Alert variant="danger" className="py-1 small mt-2 mb-0">{error}</Alert>}
                {cur.graded_by && <div className="small text-muted mt-2">Оноо тавьсан: {cur.graded_by}</div>}
                {data.confirmed && <Alert variant="success" className="py-1 small mt-2 mb-0">
                  Энэ бодлого баталгаажсан ({data.confirmed_by}) — засахын тулд ахлагч баталгаажуулалтыг буцаана.</Alert>}
                {!data.confirmed && locked && <Alert variant="secondary" className="py-1 small mt-2 mb-0">Дүн нийтлэгдсэн — оноог зөвхөн гол координатор өөрчилнө. «Бодолт хамгаалах» таб-аар шийднэ.</Alert>}
                <div className="d-flex gap-2 mt-3">
                  <Button variant="outline-secondary" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(i - 1, 0))}>←</Button>
                  <Button className="flex-grow-1" disabled={busy || locked || !dirty && cur.score != null} onClick={() => save(true)}>
                    {busy ? <Spinner size="sm" animation="border" /> : 'Хадгалаад дараагийн →'}
                  </Button>
                  <Button variant="outline-secondary" disabled={idx >= items.length - 1} onClick={() => setIdx((i) => Math.min(i + 1, items.length - 1))}>→</Button>
                </div>
                <div className="small text-muted mt-2">Enter — хадгалаад дараагийн, Alt+←/→ — шилжих</div>
              </>
            ) : <div className="text-muted">Оноогүй бодолт үлдсэнгүй 🎉</div>}
          </Card.Body>
        </Card>
        <Form.Check type="switch" label="Зөвхөн оноогүйг" checked={onlyOpen} onChange={(e) => { setOnlyOpen(e.target.checked); setIdx(0); }} className="mb-2" />
        <ListGroup style={{ maxHeight: '32vh', overflowY: 'auto' }}>
          {items.map((it, i) => (
            <ListGroup.Item key={it.registration_id} action active={cur && it.registration_id === cur.registration_id}
                            onClick={() => setIdx(i)} className="d-flex justify-content-between py-1">
              <span>№{it.participant_no}{it.full_name ? ` ${it.full_name}` : ''}</span>
              <span title={it.graded_by || ''}>{it.defense_status && <Badge bg="warning" text="dark" className="me-1">!</Badge>}
                {it.score != null ? <Badge bg="success">{it.score}</Badge> : <Badge bg="light" text="dark" className="border">—</Badge>}</span>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Col>
    </Row>
  );
}

function DefensePanel({ slug, max, onChanged }) {
  const [status, setStatus] = useState('open');
  const [list, setList] = useState(null);
  const [form, setForm] = useState({});  // id → {response, new_score}
  const [error, setError] = useState(null);
  const load = useCallback(() => getGradingDefenses(slug, status).then(setList)
    .catch((e) => setError(apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа'))), [slug, status]);
  useEffect(() => { setList(null); load(); }, [load]);

  const decide = async (r, st) => {
    const f = form[r.id] || {};
    setError(null);
    try {
      await decideGradingDefense(slug, r.id, { status: st, response: f.response || '', new_score: norm(f.new_score ?? '') });
      await load(); onChanged();
    } catch (e) { setError(apiErrorText(e.response?.data, 'Шийдэхэд алдаа гарлаа')); }
  };
  const set = (id, k, v) => setForm((s) => ({ ...s, [id]: { ...s[id], [k]: v } }));

  if (!list) return error ? <Alert variant="danger">{error}</Alert> : <Spinner animation="border" size="sm" />;
  return (
    <>
      <Form.Select size="sm" style={{ maxWidth: 220 }} className="mb-3" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="open">Шийдэгдээгүй</option><option value="ACCEPTED">Хүлээн авсан</option>
        <option value="REJECTED">Татгалзсан</option><option value="">Бүгд</option>
      </Form.Select>
      {error && <Alert variant="danger">{error}</Alert>}
      {!list.length && <Alert variant="light">Хүсэлт алга.</Alert>}
      {list.map((r) => {
        const done = r.status === 'ACCEPTED' || r.status === 'REJECTED';
        const f = form[r.id] || {};
        return (
          <Card key={r.id} className="mb-3">
            <Card.Header className="d-flex justify-content-between">
              <span>№{r.participant_no}{r.full_name ? ` ${r.full_name}` : ''} · Бодлого {r.problem_no} · одоогийн оноо <b>{r.current_score ?? '—'}</b></span>
              <Badge bg={done ? 'secondary' : 'warning'} text={done ? undefined : 'dark'}>{DEFENSE_STATUS[r.status]?.[1] || r.status}</Badge>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col lg={7}><ScanViewer pages={(r.sheet_images || []).map((url) => ({ url }))} label={`№${r.participant_no} · Бодлого ${r.problem_no}`} /></Col>
                <Col lg={5}>
                  <div className="small text-muted">Сурагчийн тайлбар</div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{r.reason}</p>
                  {r.attachments?.map((a) => <a key={a.id || a.url} href={a.url} target="_blank" rel="noreferrer" className="d-block small">Хавсралт</a>)}
                  {done ? (
                    <Alert variant="light" className="border">Хариу: {r.response}<br />Оноо: {r.score_before ?? '—'} → {r.score_after ?? '—'}</Alert>
                  ) : (
                    <>
                      <Form.Control as="textarea" rows={3} className="mb-2" placeholder="Хариу тайлбар (сурагчид харагдана)"
                                    value={f.response || ''} onChange={(e) => set(r.id, 'response', e.target.value)} />
                      <Form.Control className="mb-2" placeholder={`Шинэ оноо (0–${max}) — зөвхөн хүлээн авахад`} inputMode="decimal"
                                    value={f.new_score ?? ''} isInvalid={!validScore(f.new_score ?? '', max)}
                                    onChange={(e) => set(r.id, 'new_score', e.target.value)} />
                      <div className="d-flex gap-2">
                        <Button variant="success" onClick={() => decide(r, 'ACCEPTED')}>Хүлээн авах</Button>
                        <Button variant="outline-danger" onClick={() => decide(r, 'REJECTED')}>Татгалзах</Button>
                        {r.status === 'SUBMITTED' && <Button variant="outline-secondary" onClick={() => decide(r, 'IN_REVIEW')}>Хянаж байна</Button>}
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        );
      })}
    </>
  );
}

export default function OlympiadGradingPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [ov, setOv] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => getGradingOverview(slug).then(setOv)
    .catch((e) => setError(e.response?.status === 403 ? 'Та энэ олимпиадын координатор биш байна.'
      : apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа'))), [slug]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { getGradingMaterials(slug).then(setMaterials).catch(() => {}); }, [slug]);

  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!ov) return <div className="py-5 text-center"><Spinner animation="border" /></div>;
  const cats = ov.categories.filter((c) => c.problems.length);
  if (!cats.length) return <Container className="py-4"><Alert variant="info">Танд засах бодлого оноогдоогүй байна. Гол координатортой холбогдоно уу.</Alert></Container>;

  // Ангилал бүр өөр бодлоготой: эхлээд ангилал, дараа нь тэр ангилалын бодлого
  const allProblems = cats.flatMap((c) => c.problems);
  const canTeam = ov.is_manager || allProblems.some((p) => p.can_lead);
  const tab = params.get('tab') || 'grade';
  const category = cats.find((c) => c.id === Number(params.get('c')))
    || cats.find((c) => c.problems.some((p) => p.graded < p.total)) || cats[0];
  const problems = category.problems;
  const problemNo = Number(params.get('p')) || problems.find((p) => p.graded < p.total)?.problem_no || problems[0].problem_no;
  const cur = problems.find((p) => p.problem_no === problemNo) || problems[0];
  const setP = (n, c = category.id) => setParams({ tab: 'grade', c: String(c), p: String(n) });
  const setCat = (c) => {
    const next = cats.find((x) => x.id === c);
    setP(next.problems.find((p) => p.graded < p.total)?.problem_no || next.problems[0].problem_no, c);
  };
  const allConfirmed = allProblems.every((p) => p.confirmed);
  const ledByCat = Object.fromEntries(ov.categories.map((c) => [c.id, c.problems.filter((p) => p.can_lead).map((p) => p.problem_no)]));

  const confirmAll = async (confirm) => {
    setBusy(true); setMsg(null);
    try {
      await confirmAllGrading(slug, { confirm });
      setMsg(confirm ? 'Бүх бодлого баталгаажлаа.' : 'Баталгаажуулалт бүгд буцлаа.');
      await refresh();
    } catch (e) {
      const d = e.response?.data;
      if (confirm && d?.incomplete && window.confirm(`${d.error}\n\nОноо дутуу байсан ч бүгдийг баталгаажуулах уу?`)) {
        try { await confirmAllGrading(slug, { confirm: true, force: true }); setMsg('Бүх бодлого баталгаажлаа (дутуу оноотой).'); await refresh(); }
        catch (e2) { setMsg(apiErrorText(e2.response?.data, 'Алдаа гарлаа')); }
      } else setMsg(apiErrorText(d, 'Алдаа гарлаа'));
    } finally { setBusy(false); }
  };

  return (
    <Container fluid className="py-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <h1 className="h4 mb-0">{ov.title} · Засвар <Badge bg="light" text="dark" className="border fs-6">{{ staff: 'Админ', head: 'Гол координатор', lead: 'Бодлогын ахлагч', grader: 'Засагч' }[ov.role]}</Badge></h1>
        <div className="d-flex gap-2 align-items-center">
          {ov.is_manager && (
            <Button variant={allConfirmed ? 'outline-secondary' : 'success'} disabled={busy} onClick={() => confirmAll(!allConfirmed)}>
              {allConfirmed ? 'Баталгаажуулалт бүгдийг буцаах' : '✓ Бүгдийг баталгаажуулах'}
            </Button>
          )}
          {authService.getUser()?.is_staff && <Link to={`/admin/olympiads/${slug}`}>← Админ</Link>}
        </div>
      </div>
      {msg && <Alert variant="info" dismissible onClose={() => setMsg(null)} className="py-2">{msg}</Alert>}
      <Tabs activeKey={tab} onSelect={(k) => setParams(k === 'grade' ? { c: String(category.id), p: String(problemNo) } : { tab: k })} className="mb-3">
        <Tab eventKey="grade" title="Оноо тавих">
          {cats.length > 1 && (
            <ButtonGroup size="sm" className="mb-3 flex-wrap">
              {cats.map((c) => {
                const done = c.problems.reduce((a, p) => a + p.graded, 0);
                const all = c.problems.reduce((a, p) => a + p.total, 0);
                return (
                  <Button key={c.id} variant={c.id === category.id ? 'dark' : 'outline-dark'} onClick={() => setCat(c.id)}>
                    {c.name} <span className="opacity-75">· {c.problem_count} бодлого · {done}/{all}</span>
                  </Button>
                );
              })}
            </ButtonGroup>
          )}
          <div className="d-flex gap-2 flex-wrap mb-3">
            {problems.map((p) => (
              <Button key={p.problem_no} variant={p.problem_no === problemNo ? 'primary' : 'outline-primary'} onClick={() => setP(p.problem_no)}>
                Бодлого {p.problem_no} {p.confirmed && '✓'}
                <div style={{ fontSize: 11 }}>{p.graded}/{p.total}</div>
                <ProgressBar now={p.total ? (100 * p.graded) / p.total : 0} style={{ height: 3 }} />
              </Button>
            ))}
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center mb-3 small">
            <MarkingSchemeButton materials={materials} problemNo={problemNo} categoryId={category.id} />
            {cur.leads?.length > 0 && <span className="text-muted">Ахлагч: {cur.leads.join(', ')}</span>}
            {cur.can_lead && <Link to={`/olympiads/${slug}/grade/problems/${problemNo}?c=${category.id}`}>Бодлогын координац →</Link>}
          </div>
          {tab === 'grade' && <ProblemGrader slug={slug} problemNo={problemNo} categoryId={category.id} max={ov.max_score} onProgress={refresh}
                                              isManager={ov.is_manager} published={ov.results_published} />}
        </Tab>
        <Tab eventKey="defense" title="Бодолт хамгаалах">
          {tab === 'defense' && <DefensePanel slug={slug} max={ov.max_score} onChanged={refresh} />}
        </Tab>
        {canTeam && (
          <Tab eventKey="team" title="Координаторууд">
            {tab === 'team' && <GradingTeamPanel slug={slug} isManager={ov.is_manager} ledByCat={ledByCat} />}
          </Tab>
        )}
      </Tabs>
    </Container>
  );
}
