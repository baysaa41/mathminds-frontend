// src/pages/OlympiadAdminPage.jsx
// Админ: бодолтын хуудас үүсгэх (PDF), скан upload (S3), оноо, дүн нийтлэх, материал, бодолт хамгаалах хүсэлт

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert, ProgressBar, Row, Col, Spinner, Badge, Tabs, Tab, Form } from 'react-bootstrap';
import { startSheetsJob, getSheetsJob, uploadSheetImages, getUploadedImages, getUploadBatch, downloadSheetsPdf,
  getOlympiad, sheetFilterParams, countRegistrations } from '../services/olympiadService';
import { AdminDefensePanel, AdminMaterialsPanel, AdminResultsPanel, AdminScoresPanel } from '../components/olympiad/AdminResultPanels';
import { AdminSheetGallery } from '../components/olympiad/SheetPosts';
import UnmatchedSheets from '../components/olympiad/UnmatchedSheets';

const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMPTY_FILTERS = { category: '', last_name: '', first_name: '' };

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
  const [uploading, setUploading] = useState(false);

  const loadImages = useCallback(
    () => getUploadedImages(slug).then(setImages).catch(() => {}),
    [slug],
  );
  useEffect(() => { if (tab === 'sheets') loadImages(); }, [tab, loadImages]);

  // Бодолтын хуудас үүсгэх: шүүлтүүр → job (background) → бэлэн болмогц PDF татах товч идэвхжинэ
  const [olympiad, setOlympiad] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sheetsJob, setSheetsJob] = useState(null);   // {job, participants, skipped} — бэлэн болсон PDF
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  useEffect(() => { getOlympiad(slug).then(setOlympiad).catch(() => {}); }, [slug]);
  const setFilter = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setSheetsJob(null); };
  const filtered = Object.keys(sheetFilterParams(filters)).length > 0;

  // Шүүлтүүрт тохирох оролцогчдын урьдчилсан жагсаалт (дээд тал нь 30)
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      countRegistrations(slug, filters).then((r) => { if (alive) setPreview(r); }).catch(() => { if (alive) setPreview(null); });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [slug, filters]);

  const onGenerate = async () => {
    setGenerating(true); setError(null); setMsg(null); setSheetsJob(null);
    try {
      const started = await startSheetsJob(slug, filters);
      if (started.participants === 0) {
        setMsg(started.skipped
          ? `${started.skipped} оролцогчид дугаар олгогдоогүй/3255-аас их тул хуудас үүсгэх боломжгүй.`
          : 'Шүүлтүүрт тохирох баталгаажсан оролцогч алга.');
        return;
      }
      let st = started;
      do {
        await sleep(1200);
        if (!mounted.current) return;
        st = await getSheetsJob(slug, started.job);
      } while (st.status === 'PENDING' || st.status === 'PROCESSING');
      if (st.status === 'FAILED') { setError(`Хуудас үүсгэхэд алдаа гарлаа: ${st.error || ''}`); return; }
      setSheetsJob({ job: started.job, participants: st.participants, skipped: st.skipped });
      setMsg(`Хуудас бэлэн боллоо: хоосон загвар + ${st.participants} оролцогчийн хуудас.${st.skipped
        ? ` (${st.skipped} оролцогчид дугаар олгогдоогүй/3255-аас их тул орсонгүй.)` : ''} «PDF татах» товчийг дарна уу.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Хуудас үүсгэхэд алдаа гарлаа');
    } finally { if (mounted.current) setGenerating(false); }
  };

  const onDownloadPdf = async () => {
    setDownloading(true); setError(null);
    try {
      await downloadSheetsPdf(slug, sheetsJob.job);
    } catch (err) {
      // blob хариу тул алдааны JSON-ыг уншина
      const text = err.response?.data instanceof Blob ? await err.response.data.text() : '';
      let msgText = 'PDF татахад алдаа гарлаа';
      try { msgText = JSON.parse(text).error || msgText; } catch { /* JSON биш */ }
      setError(msgText);
      setSheetsJob(null);
    } finally { setDownloading(false); }
  };

  // Файл илгээгдмэгц (202) сервер хуудсуудыг background-д боловсруулна — явцыг шалгаж харуулна
  const onUpload = async () => {
    setUploading(true); setError(null); setResult(null); setProgress(0); setProcessing(null);
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
    } finally { setUploading(false); setProgress(null); setProcessing(null); }
  };

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/olympiads" className="small">← Олимпиад</Link>
      <h3 className="mt-2">Олимпиадын админ</h3>

      <Tabs activeKey={tab} onSelect={(k) => setSearchParams(k === 'sheets' ? {} : { tab: k })} className="mb-3">
        <Tab eventKey="sheets" title="Хуудас, скан">
      {msg && <Alert variant="success" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      <Card className="mb-3">
        <Card.Header>1. Бодолтын хуудас үүсгэх</Card.Header>
        <Card.Body>
          <p className="small text-muted">
            PDF-ийн эхний хуудас нь хоосон (нөхөөгүй) загвар. Дараа нь төлбөр төлсөн оролцогч бүрт нэг хуудас: овог нэр
            хэвлэгдсэн, хяналтын хэсэг нь тухайн оролцогчийн кодоор будагдсан, бодлого/хуудасны дугаар хоосон.
          </p>
          <Row className="g-2 mb-3">
            <Col xs={6} md={3}>
              <Form.Select size="sm" value={filters.category} onChange={setFilter('category')} aria-label="Ангилал">
                <option value="">Бүх ангилал</option>
                {(olympiad?.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Col>
            <Col xs={6} md={4}>
              <Form.Control size="sm" placeholder="Овог" value={filters.last_name} onChange={setFilter('last_name')} />
            </Col>
            <Col xs={6} md={3}>
              <Form.Control size="sm" placeholder="Нэр" value={filters.first_name} onChange={setFilter('first_name')} />
            </Col>
            <Col xs={12} md={1} className="d-grid">
              <Button size="sm" variant="outline-secondary" onClick={() => { setFilters(EMPTY_FILTERS); setSheetsJob(null); }} disabled={!filtered || generating}>
                Цуцлах
              </Button>
            </Col>
          </Row>
          {filtered && (
            <div className="small text-muted mb-2">
              Шүүлтүүр идэвхтэй — зөвхөн тохирох оролцогчдын хуудас үүснэ.
            </div>
          )}
          {preview && (
            <div className="small mb-3">
              <div className="text-muted mb-1">
                Шүүлтүүрт <b>{preview.total}</b> оролцогч олдлоо{preview.total > preview.results.length ? ` (эхний ${preview.results.length}-г харуулав)` : ''}
              </div>
              {preview.results.length > 0 && (
                <div style={{ maxHeight: 160, overflowY: 'auto' }} className="border rounded p-2">
                  {preview.results.map((r) => (
                    <div key={r.id}>
                      <span className="text-muted me-2">№{r.participant_no ?? '—'}</span>
                      {r.last_name} {r.first_name}
                      {r.category && <span className="text-muted"> · {r.category}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button variant="primary" className="me-2" onClick={onGenerate} disabled={generating}>
            {generating ? <><Spinner size="sm" animation="border" className="me-2" />Үүсгэж байна…</> : 'Хуудас үүсгэх'}
          </Button>
          <Button variant="success" onClick={onDownloadPdf} disabled={!sheetsJob || generating || downloading}>
            {downloading ? <Spinner size="sm" animation="border" /> : 'PDF татах'}
          </Button>
          {sheetsJob && <span className="small text-success ms-2">Бэлэн: {sheetsJob.participants + 1} хуудас</span>}
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>2. Сканнердсан материал upload (AWS S3)</Card.Header>
        <Card.Body>
          <p className="small text-muted">
            Зураг эсвэл PDF-г дарааллаар нь сонгоно. Хуудас дээрх хяналтын хэсгийн код сурагчийг, БОДЛОГО хэсэг
            бодлогыг автоматаар танина (хуучин QR-тай хуудсыг ч танина). Тэмдэггүй дараагийн зураг түүнд хавсарна. Файлууд нэрээр нь эрэмбэлэгдэнэ. Өмнө upload хийсэн яг ижил
            хуудсыг дахин хадгалахгүй — андуурч давтан upload хийсэн ч давхардахгүй.
          </p>
          <input type="file" multiple accept="image/*,.pdf" className="form-control mb-2"
                 onChange={(e) => setFiles([...e.target.files])} />
          <Button onClick={onUpload} disabled={uploading || files.length === 0}>
            {uploading ? <Spinner size="sm" animation="border" /> : `Upload (${files.length})`}
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
              {result.warnings?.length > 0 && (
                <div className="mt-2 small">
                  <strong>Хуудасны дугаарын анхааруулга:</strong>
                  <ul className="mb-0">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                </div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      <UnmatchedSheets slug={slug} olympiad={olympiad} images={images} onAssigned={loadImages} />

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
