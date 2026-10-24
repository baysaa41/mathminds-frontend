// src/components/olympiad/ControlCodeLookup.jsx
// Админ: кодын дэвтэр (xlsx) татах + хяналтын хэсгийн 6 нүд (эсвэл «Код NNN»)-ээр оролцогч олох

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { downloadCodebook, lookupControlCode } from '../../services/olympiadService';

const ROWS = 4;
const COLS = 10;
const key = (r, c) => `${r}-${c}`;

// «2-5 2-7 3-5» эсвэл «25 27 35 … 210» -> [[2,5], ...]; буруу хэсэгтэй бол null
function parseCells(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  const cells = [];
  for (const t of tokens) {
    const m = t.match(/^(\d)[-.:/](\d{1,2})$/) || t.match(/^(\d)(\d{1,2})$/);
    if (!m) return null;
    const r = Number(m[1]);
    const c = Number(m[2]);
    if (r < 1 || r > ROWS || c < 1 || c > COLS) return null;
    cells.push([r, c]);
  }
  return cells;
}

function ControlCodeLookup({ slug }) {
  const [selected, setSelected] = useState(() => new Set());
  const [text, setText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cells = [...selected].map((k) => k.split('-').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const run = async (query) => {
    setLoading(true); setError(null);
    try {
      setResult(await lookupControlCode(slug, query));
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.error || 'Хайхад алдаа гарлаа');
    } finally { setLoading(false); }
  };

  // 4–8 нүд будагдсан бол автоматаар хайна (1-2 нүд зөрсөн ч хамгийн ойр кодыг олно)
  const cellsKey = cells.map(([r, c]) => key(r, c)).join(',');
  useEffect(() => {
    if (cells.length < 4 || cells.length > 8) { setResult(null); return undefined; }
    const t = setTimeout(() => run({ cells }), 250);
    return () => clearTimeout(t);
  }, [cellsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setCells = (list) => {
    setSelected(new Set(list.map(([r, c]) => key(r, c))));
    setText(list.map(([r, c]) => key(r, c)).join(' '));
  };
  const toggle = (r, c) => {
    const next = new Set(selected);
    if (next.has(key(r, c))) next.delete(key(r, c)); else next.add(key(r, c));
    setCells([...next].map((k) => k.split('-').map(Number)));
  };
  const onText = (e) => {
    setText(e.target.value);
    const parsed = parseCells(e.target.value);
    if (parsed) setSelected(new Set(parsed.map(([r, c]) => key(r, c))));
  };
  const onCode = (e) => {
    e.preventDefault();
    if (/^\d+$/.test(codeText.trim())) run({ code: Number(codeText.trim()) });
  };
  const onDownload = async () => {
    setDownloading(true); setError(null);
    try { await downloadCodebook(slug); } catch { setError('Кодын дэвтэр татахад алдаа гарлаа'); } finally { setDownloading(false); }
  };

  const missing = new Set((result?.missing || []).map(([r, c]) => key(r, c)));
  const extra = new Set((result?.extra || []).map(([r, c]) => key(r, c)));
  const cellStyle = (r, c) => {
    const k = key(r, c);
    let bg = 'transparent';
    let border = '#6c757d';
    if (extra.has(k)) { bg = '#f8d7da'; border = '#dc3545'; } else if (selected.has(k)) bg = '#555';
    if (missing.has(k)) border = '#dc3545';
    return {
      width: 30, height: 20, borderRadius: 6, border: `2px ${missing.has(k) ? 'dashed' : 'solid'} ${border}`,
      background: bg, padding: 0,
    };
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex flex-wrap align-items-center gap-2">
        <span>Кодын дэвтэр · хяналтын хэсгээр оролцогч олох</span>
        <Button size="sm" variant="outline-success" className="ms-auto" onClick={onDownload} disabled={downloading}>
          {downloading ? <Spinner size="sm" animation="border" /> : 'Кодын дэвтэр татах (xlsx)'}
        </Button>
      </Card.Header>
      <Card.Body>
        <p className="small text-muted">
          Кодын дэвтэрт дугаар олгогдсон оролцогч бүрийн код болон хяналтын хэсгийн 6 нүд «мөр-багана» хэлбэрээр байна.
          Доорх хүснэгтэд хуудсан дээрх будагдсан нүднүүдийг дарж эсвэл бичиж оруулна. 1–2 нүд зөрсөн ч хамгийн ойр кодыг
          олж, зөрсөн нүдийг улаанаар заана.
        </p>
        <Row className="g-3">
          <Col md="auto">
            <table className="small" style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
              <thead>
                <tr><th />{Array.from({ length: COLS }, (_, i) => <th key={i} className="text-center fw-normal">{i + 1}</th>)}</tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS }, (_, ri) => (
                  <tr key={ri}>
                    <th className="fw-normal pe-1">{ri + 1}</th>
                    {Array.from({ length: COLS }, (_, ci) => (
                      <td key={ci}>
                        <button type="button" aria-label={`Мөр ${ri + 1}, багана ${ci + 1}`}
                          aria-pressed={selected.has(key(ri + 1, ci + 1))}
                          style={cellStyle(ri + 1, ci + 1)} onClick={() => toggle(ri + 1, ci + 1)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="small text-muted mt-1">
              Будсан: {cells.length} / 6
              {cells.length > 0 && <Button size="sm" variant="link" className="py-0" onClick={() => setCells([])}>Цэвэрлэх</Button>}
            </div>
          </Col>
          <Col md>
            <Form.Group className="mb-2">
              <Form.Label className="small mb-1">6 нүд (мөр-багана)</Form.Label>
              <Form.Control size="sm" placeholder="2-5 2-7 3-5 3-9 4-3 4-7" value={text} onChange={onText}
                isInvalid={text.trim() !== '' && parseCells(text) === null} />
              <Form.Control.Feedback type="invalid">Жишээ: 2-5 2-7 3-5 (мөр 1–4, багана 1–10)</Form.Control.Feedback>
            </Form.Group>
            <Form onSubmit={onCode} className="d-flex gap-2 align-items-end mb-3">
              <Form.Group>
                <Form.Label className="small mb-1">Эсвэл хуудсан дээрх «Код NNN»</Form.Label>
                <Form.Control size="sm" inputMode="numeric" placeholder="976" value={codeText}
                  onChange={(e) => setCodeText(e.target.value)} style={{ width: 110 }} />
              </Form.Group>
              <Button size="sm" type="submit" disabled={!/^\d+$/.test(codeText.trim()) || loading}>Хайх</Button>
            </Form>
            {loading && <Spinner size="sm" animation="border" />}
            {error && <Alert variant="danger" className="py-2 small mb-0">{error}</Alert>}
            {result && !loading && (
              <div className="small">
                <div className="mb-1">
                  Код <b>{String(result.code).padStart(3, '0')}</b> · дугаар <b>№{result.participant_no}</b>
                  {' '}· нүд: {result.cells.map(([r, c]) => key(r, c)).join(' ')}
                  {(result.missing.length > 0 || result.extra.length > 0) && (
                    <Badge bg="warning" text="dark" className="ms-2">
                      Ойролцоо: {[result.missing.length && `${result.missing.length} дутуу`,
                        result.extra.length && `${result.extra.length} илүү`].filter(Boolean).join(', ')}
                    </Badge>
                  )}
                </div>
                {result.registrations.length === 0
                  ? <div className="text-muted">Энэ дугаартай бүртгэл энэ олимпиадад алга.</div>
                  : result.registrations.map((r) => (
                    <div key={r.id} className="border rounded p-2 mb-1">
                      <b>{r.last_name} {r.first_name}</b>
                      {r.status !== 'PAID' && <Badge bg="secondary" className="ms-2">{r.status_label}</Badge>}
                      <div className="text-muted">
                        {[r.school, r.grade && `${r.grade}-р анги`, r.category,
                          r.class_room && `Кабинет ${r.class_room}`, r.seat_no && `Суудал ${r.seat_no}`].filter(Boolean).join(' · ')}
                      </div>
                      <Link to={`/my-olympiads/${r.id}`} target="_blank">Оролцогчоор харах ↗</Link>
                    </div>
                  ))}
              </div>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

export default ControlCodeLookup;
