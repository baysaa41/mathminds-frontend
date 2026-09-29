// src/pages/OlympiadAdminPage.jsx
// Админ: QR хуудас хэвлэх, скан upload (S3), оноо, дүн нийтлэх, материал, бодолт хамгаалах хүсэлт

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert, ProgressBar, Row, Col, Spinner, Badge, Tabs, Tab, Form } from 'react-bootstrap';
import { generateSheets, uploadSheetImages, getUploadedImages, getUploadBatch, downloadSheetsPdf, getOlympiad,
  sheetFilterParams } from '../services/olympiadService';
import { AdminDefensePanel, AdminMaterialsPanel, AdminResultsPanel, AdminScoresPanel } from '../components/olympiad/AdminResultPanels';
import { AdminSheetGallery } from '../components/olympiad/SheetPosts';

const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY_FILTERS = { category: '', problem: '', last_name: '', first_name: '' };

function OlympiadAdminPage() {
  const { slug } = useParams();
  // ?tab=scores|results|materials|defense
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'sheets';
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(null);  // background боловсруулалтын явц
  const [images, setImages] = useState([]);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadImages = useCallback(
    () => getUploadedImages(slug).then(setImages).catch(() => {}),
    [slug],
  );
  useEffect(() => { if (tab === 'sheets') loadImages(); }, [tab, loadImages]);

  // Хуудасны шүүлтүүр — «Хуудас үүсгэх», «Хэвлэх харагдац», «PDF татах» гурвуулаа ашиглана
  const [olympiad, setOlympiad] = useState(null);
  // Шүүлтүүр хуудасны state-д хадгалагдана (URL/query-д биш). «Хэвлэх харагдац» руу router state-ээр дамжиж,
  // «Буцах»-аар буцаж ирнэ — хуудсаас гарч ороход хэвээр
  const location = useLocation();
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, ...(location.state?.sheetFilters || {}) }));
  useEffect(() => { getOlympiad(slug).then(setOlympiad).catch(() => {}); }, [slug]);
  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const filtered = Object.keys(sheetFilterParams(filters)).length > 0;

  const onGenerate = async () => {
    setBusy(true); setError(null);
    try {
      const r = await generateSheets(slug, filters);
      setMsg(r.participants === 0
        ? 'Шүүлтүүрт тохирох баталгаажсан оролцогч алга.'
        : `${r.participants} оролцогч · ${r.sheets} бодолтын хуудас бэлэн${r.created
          ? ` (шинээр ${r.created} үүслээ)` : ' — бүгд өмнө нь үүссэн байсан'}.`);
    } catch { setError('Хуудас үүсгэхэд алдаа гарлаа'); } finally { setBusy(false); }
  };

  const onDownloadPdf = async () => {
    setBusy(true); setError(null);
    try {
      await downloadSheetsPdf(slug, filters);
    } catch (err) {
      // blob хариу тул алдааны JSON-ыг уншина
      const text = err.response?.data instanceof Blob ? await err.response.data.text() : '';
      let msgText = 'PDF үүсгэхэд алдаа гарлаа';
      try { msgText = JSON.parse(text).error || msgText; } catch { /* JSON биш */ }
      setError(msgText);
    } finally { setBusy(false); }
  };

  // Файл илгээгдмэгц (202) сервер хуудсуудыг background-д боловсруулна — явцыг шалгаж харуулна
  const onUpload = async () => {
    setBusy(true); setError(null); setResult(null); setProgress(0); setProcessing(null);
    try {
      let b = await uploadSheetImages(slug, [...files].sort(naturalSort), setProgress);
      setFiles([]); setProgress(null);
      while (b.status === 'PENDING' || b.status === 'PROCESSING') {
        setProcessing(b);
        await sleep(1500);
        b = await getUploadBatch(slug, b.batch);
      }
      setProcessing(null);
      if (b.status === 'FAILED') setError(`Боловсруулахад алдаа гарлаа: ${b.error || ''}`);
      else setResult(b);
      loadImages();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload хийхэд алдаа гарлаа');
    } finally { setBusy(false); setProgress(null); setProcessing(null); }
  };

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/olympiads" className="small">← Олимпиад</Link>
      <h3 className="mt-2">Олимпиадын админ</h3>

      <Tabs activeKey={tab} onSelect={(k) => setSearchParams(k === 'sheets' ? {} : { tab: k })} className="mb-3">
        <Tab eventKey="sheets" title="Хуудас, скан">
      {msg && <Alert variant="success" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-3">
        <Card.Header>1. QR-тай бодолтын хуудас хэвлэх</Card.Header>
        <Card.Body>
          <p className="small text-muted">Төлбөр төлсөн сурагч бүрт бодлого бүрээр тусдаа QR-тай хуудас үүснэ.</p>
          <Row className="g-2 mb-3">
            <Col xs={6} md={3}>
              <Form.Select size="sm" value={filters.category} onChange={setFilter('category')} aria-label="Ангилал">
                <option value="">Бүх ангилал</option>
                {(olympiad?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Control size="sm" value={filters.problem} onChange={setFilter('problem')} aria-label="Бодлого"
                            placeholder={`Бодлого: 1,3 (хоосон — бүгд${olympiad ? `, 1–${olympiad.problem_count}` : ''})`}
                            isInvalid={!/^[\d,\s]*$/.test(filters.problem)} />
            </Col>
            <Col xs={6} md={3}>
              <Form.Control size="sm" placeholder="Овог" value={filters.last_name} onChange={setFilter('last_name')} />
            </Col>
            <Col xs={6} md={2}>
              <Form.Control size="sm" placeholder="Нэр" value={filters.first_name} onChange={setFilter('first_name')} />
            </Col>
            <Col xs={12} md={1} className="d-grid">
              <Button size="sm" variant="outline-secondary" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!filtered}>
                Цуцлах
              </Button>
            </Col>
          </Row>
          {filtered && (
            <div className="small text-muted mb-2">
              Шүүлтүүр идэвхтэй — зөвхөн тохирох оролцогч{filters.problem ? `, бодлого ${filters.problem}` : ''}.
            </div>
          )}
          <Button variant="outline-primary" className="me-2" onClick={onGenerate} disabled={busy}>Хуудас үүсгэх</Button>
          <Button as={Link} to={`/admin/olympiads/${slug}/print`} state={{ sheetFilters: filters }} variant="primary"
                  className="me-2">Хэвлэх харагдац</Button>
          <Button variant="success" onClick={onDownloadPdf} disabled={busy}>
            {busy ? <Spinner size="sm" animation="border" /> : 'PDF татах'}
          </Button>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>2. Сканнердсан материал upload (AWS S3)</Card.Header>
        <Card.Body>
          <p className="small text-muted">
            Зураг эсвэл PDF-г дарааллаар нь сонгоно. QR-тай хуудас нь сурагч/бодлогыг автоматаар танина,
            дараагийн QR-гүй хуудсууд түүнд хавсарна. Файлууд нэрээр нь эрэмбэлэгдэнэ. Өмнө upload хийсэн яг ижил
            хуудсыг дахин хадгалахгүй — андуурч давтан upload хийсэн ч давхардахгүй.
          </p>
          <input type="file" multiple accept="image/*,.pdf" className="form-control mb-2"
                 onChange={(e) => setFiles([...e.target.files])} />
          <Button onClick={onUpload} disabled={busy || files.length === 0}>
            {busy ? <Spinner size="sm" animation="border" /> : `Upload (${files.length})`}
          </Button>
          {progress !== null && (
            <div className="mt-2">
              <div className="small text-muted">Файл илгээж байна…</div>
              <ProgressBar now={progress} label={`${progress}%`} />
            </div>
          )}
          {processing && (
            <div className="mt-2">
              <div className="small text-muted">
                {processing.total_pages
                  ? `Боловсруулж байна: ${processing.processed_pages} / ${processing.total_pages} хуудас (QR унших, хадгалах)`
                  : 'Дараалалд хүлээж байна…'}
              </div>
              <ProgressBar animated variant="info"
                           now={processing.total_pages ? (100 * processing.processed_pages) / processing.total_pages : 100} />
              <div className="small text-muted mt-1">Хуудсыг хаасан ч боловсруулалт үргэлжилнэ.</div>
            </div>
          )}
          {result && (
            <Alert variant={result.unmatched ? 'warning' : 'success'} className="mt-3 mb-0">
              Нийт {result.total_pages} хуудас: {result.matched} холбогдсон, {result.unmatched} холбогдоогүй
              {result.duplicates > 0 && `, ${result.duplicates} давхар хуудсыг алгассан (өмнө upload хийгдсэн)`}.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Бодолтын хуудсууд — бодлого бүрээр ({images.length} хуудас)</Card.Header>
        <Card.Body>
          <AdminSheetGallery images={images} />
        </Card.Body>
      </Card>
        </Tab>
        <Tab eventKey="scores" title="Оноо">
          <AdminScoresPanel slug={slug} active={tab === 'scores'} />
        </Tab>
        <Tab eventKey="results" title="Дүнгийн хуудас">
          <AdminResultsPanel slug={slug} active={tab === 'results'} />
        </Tab>
        <Tab eventKey="materials" title="Материал">
          <AdminMaterialsPanel slug={slug} active={tab === 'materials'} />
        </Tab>
        <Tab eventKey="defense" title="Бодолт хамгаалах">
          <AdminDefensePanel slug={slug} active={tab === 'defense'} />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default OlympiadAdminPage;
