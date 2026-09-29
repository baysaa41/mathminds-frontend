// src/components/olympiad/MyResultTabs.jsx
// «Миний бүртгэл» хуудасны tab-ууд: оноо, дүнгийн хуудас, материал, бодолт хамгаалах

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap';
import ResultsTable from './ResultsTable';
import { SheetPost, SheetViewer } from './SheetPosts';
import {
  apiErrorText, createDefenseRequest, DEFENSE_STATUS, fmtDate, fmtScore, getMeDefenseRequests, getMeMaterials,
  getMeResults, getMeScores, timeUntil, withdrawDefenseRequest,
} from '../../services/olympiadService';

const Loading = () => <div className="py-4 text-center"><Spinner animation="border" size="sm" /></div>;

const NotPublished = () => (
  <Alert variant="light" className="border">
    <div className="fw-semibold mb-1">Дүн нийтлэгдээгүй байна</div>
    <div className="small">Дүн нийтлэгдсэний дараа энд харагдана.</div>
  </Alert>
);

// Tab нээгдэх үед л ачаална (active=false үед хүсэлт явуулахгүй)
function useTabData(active, fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    return fetcher().then(setData).catch((e) => setError(apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа')));
  }, [fetcher]);
  useEffect(() => { if (active && data === null) load(); }, [active, data, load]);
  return { data, error, reload: load };
}

export function MyScoresTab({ registrationId, active, onDefend }) {
  const fetcher = useCallback(() => getMeScores(registrationId), [registrationId]);
  const { data, error } = useTabData(active, fetcher);
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Loading />;
  if (!data.published) return <NotPublished />;
  if (!data.problems) return <Alert variant="light" className="border">Баталгаажсан бүртгэлд л оноо харагдана.</Alert>;
  return (
    <>
      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="small text-muted">Нийт оноо</div>
            <div className="fs-3 fw-semibold">{fmtScore(data.total)}<span className="fs-6 text-muted"> / {data.max_total}</span></div>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card body className="text-center">
            <div className="small text-muted">Ангилал доторх байр</div>
            <div className="fs-3 fw-semibold">
              {data.rank ?? '–'}{data.rank_of ? <span className="fs-6 text-muted"> / {data.rank_of}</span> : null}
            </div>
          </Card>
        </Col>
      </Row>
      <Card className="mb-3">
        <Table size="sm" className="mb-0 align-middle">
          <thead><tr><th>Бодлого</th><th className="text-center">Оноо</th><th /></tr></thead>
          <tbody>
            {data.problems.map((p) => (
              <tr key={p.problem_no}>
                <td>Бодлого №{p.problem_no}</td>
                <td className="text-center">{fmtScore(p.score)} <span className="text-muted small">/ {p.max_score}</span></td>
                <td className="text-end">
                  {data.defense_open && p.score !== null && (
                    <Button size="sm" variant="link" className="py-0" onClick={() => onDefend(p.problem_no)}>Хамгаалах</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {data.defense_open && (
        <div className="small text-muted">
          Бодолт хамгаалах хүсэлт {fmtDate(data.defense_deadline)} хүртэл ({timeUntil(data.defense_deadline)} үлдсэн) гаргана.
        </div>
      )}
    </>
  );
}

export function MyResultsTab({ registrationId, active }) {
  const fetcher = useCallback(() => getMeResults(registrationId), [registrationId]);
  const { data, error } = useTabData(active, fetcher);
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Loading />;
  if (!data.published) return <NotPublished />;
  return <ResultsTable categories={data.categories} problemCount={data.problem_count} highlightId={data.registration_id} />;
}

export function MyMaterialsTab({ registrationId, active }) {
  const fetcher = useCallback(() => getMeMaterials(registrationId), [registrationId]);
  const { data, error } = useTabData(active, fetcher);
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Loading />;
  return (
    <>
      <Card className="mb-3">
        <Card.Header>Олимпиадын материал</Card.Header>
        {data.materials.length === 0 ? (
          <Card.Body className="text-muted small">Одоогоор материал нийтлэгдээгүй байна.</Card.Body>
        ) : (
          <Table size="sm" className="mb-0">
            <tbody>
              {data.materials.map((m) => (
                <tr key={m.id}>
                  <td style={{ width: 110 }}><Badge bg="secondary">{m.kind_label}</Badge></td>
                  <td>
                    <a href={m.file_url || m.url} target="_blank" rel="noreferrer">{m.title}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <h6 className="mt-2">Миний бодолтын хуудас (скан)</h6>
      {data.sheets.length === 0 ? (
        <div className="text-muted small">Скан хийгдсэн хуудас алга.</div>
      ) : (
        <SheetViewer depsKey={data.sheets.flatMap((sh) => sh.images).join('|')}>
          {data.sheets.map((sh) => (
            <SheetPost key={sh.problem_no} title={`Бодлого ${sh.problem_no}`} images={sh.images} />
          ))}
        </SheetViewer>
      )}
    </>
  );
}

export function MyDefenseTab({ registrationId, active, problemCount, initialProblem }) {
  const fetcher = useCallback(() => getMeDefenseRequests(registrationId), [registrationId]);
  const { data, error, reload } = useTabData(active, fetcher);
  const [form, setForm] = useState({ problem_no: '', reason: '', images: [] });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  // Онооны tab-аас «Хамгаалах» дарж ирэхэд бодлогыг сонгоно
  useEffect(() => {
    if (initialProblem) setForm((f) => ({ ...f, problem_no: String(initialProblem) }));
  }, [initialProblem]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Loading />;
  if (!data.published) return <NotPublished />;

  const taken = new Set(data.requests.filter((r) => r.status !== 'WITHDRAWN').map((r) => r.problem_no));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await createDefenseRequest(registrationId, { ...form, problem_no: Number(form.problem_no) });
      setForm({ problem_no: '', reason: '', images: [] });
      e.target.reset();
      await reload();
    } catch (err) {
      setFormError(apiErrorText(err.response?.data, 'Илгээхэд алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };
  const withdraw = async (id) => {
    try {
      await withdrawDefenseRequest(id);
      await reload();
    } catch (err) {
      setFormError(apiErrorText(err.response?.data, 'Цуцлахад алдаа гарлаа'));
    }
  };

  return (
    <>
      {data.defense_open ? (
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between flex-wrap gap-1">
            <span>Шинэ хүсэлт</span>
            <span className="small text-muted">
              {fmtDate(data.defense_deadline)} хүртэл · {timeUntil(data.defense_deadline)} үлдсэн
            </span>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={submit}>
              <Form.Group className="mb-2">
                <Form.Label className="small">Бодлого</Form.Label>
                <Form.Select value={form.problem_no} required style={{ maxWidth: 240 }}
                             onChange={(e) => setForm({ ...form, problem_no: e.target.value })}>
                  <option value="">— Сонгох —</option>
                  {Array.from({ length: problemCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} disabled={taken.has(n)}>
                      Бодлого №{n}{taken.has(n) ? ' (хүсэлт гаргасан)' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small">Тайлбар — аль алхамд оноо дутуу тавигдсан гэж үзэж байна вэ?</Form.Label>
                <Form.Control as="textarea" rows={4} required value={form.reason}
                              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small">Зураг (заавал биш, {data.max_attachments} хүртэл)</Form.Label>
                <Form.Control type="file" accept="image/*" multiple
                              onChange={(e) => setForm({ ...form, images: [...e.target.files].slice(0, data.max_attachments) })} />
              </Form.Group>
              {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
              <Button type="submit" disabled={busy}>{busy ? <Spinner size="sm" animation="border" /> : 'Хүсэлт илгээх'}</Button>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="light" className="border small">
          Бодолт хамгаалах хугацаа {data.defense_deadline ? `${fmtDate(data.defense_deadline)}-нд дууссан` : 'дууссан'}.
        </Alert>
      )}

      <h6>Миний хүсэлтүүд</h6>
      {data.requests.length === 0 ? (
        <div className="text-muted small">Хүсэлт гаргаагүй байна.</div>
      ) : data.requests.map((r) => (
        <Card key={r.id} className="mb-2">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <strong>Бодлого №{r.problem_no}</strong>{' '}
                <Badge bg={DEFENSE_STATUS[r.status][0]}>{r.status_label}</Badge>
                <div className="small text-muted">{fmtDate(r.created_at)}</div>
              </div>
              <div className="small">
                Оноо: {fmtScore(r.score_before)}
                {r.status === 'ACCEPTED' && <> → <strong>{fmtScore(r.score_after)}</strong></>}
              </div>
            </div>
            <div className="mt-2 small" style={{ whiteSpace: 'pre-wrap' }}>{r.reason}</div>
            {r.attachments.length > 0 && (
              <div className="d-flex gap-2 mt-2">
                {r.attachments.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt="" className="border" style={{ height: 64 }} />
                  </a>
                ))}
              </div>
            )}
            {r.response && (
              <Alert variant={r.status === 'ACCEPTED' ? 'success' : 'secondary'} className="mt-2 mb-0 py-2 small">
                <div className="fw-semibold">Хариу</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{r.response}</div>
              </Alert>
            )}
            {r.status === 'SUBMITTED' && (
              <Button size="sm" variant="outline-secondary" className="mt-2" onClick={() => withdraw(r.id)}>Цуцлах</Button>
            )}
          </Card.Body>
        </Card>
      ))}
    </>
  );
}
