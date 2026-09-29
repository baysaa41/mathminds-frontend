// src/pages/OlympiadAdminPage.jsx
// Админ: QR хуудас хэвлэх, сканнердсан материал upload хийх (S3)

import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, ProgressBar, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { generateSheets, uploadSheetImages, getUploadedImages } from '../services/olympiadService';

const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });

function OlympiadAdminPage() {
  const { slug } = useParams();
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [images, setImages] = useState([]);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadImages = useCallback(
    () => getUploadedImages(slug).then(setImages).catch(() => {}),
    [slug],
  );
  useEffect(() => { loadImages(); }, [loadImages]);

  const onGenerate = async () => {
    setBusy(true); setError(null);
    try {
      const r = await generateSheets(slug);
      setMsg(`${r.sheets} бодолтын хуудас бэлэн боллоо.`);
    } catch { setError('Хуудас үүсгэхэд алдаа гарлаа'); } finally { setBusy(false); }
  };

  const onUpload = async () => {
    setBusy(true); setError(null); setResult(null); setProgress(0);
    try {
      const r = await uploadSheetImages(slug, [...files].sort(naturalSort), setProgress);
      setResult(r); setFiles([]); loadImages();
    } catch (err) {
      setError(err.response?.data?.error || 'Upload хийхэд алдаа гарлаа');
    } finally { setBusy(false); setProgress(null); }
  };

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/olympiads" className="small">← Олимпиад</Link>
      <h3 className="mt-2">Олимпиадын админ</h3>
      {msg && <Alert variant="success" dismissible onClose={() => setMsg(null)}>{msg}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-3">
        <Card.Header>1. QR-тай бодолтын хуудас хэвлэх</Card.Header>
        <Card.Body>
          <p className="small text-muted">Төлбөр төлсөн сурагч бүрт бодлого бүрээр тусдаа QR-тай хуудас үүснэ.</p>
          <Button variant="outline-primary" className="me-2" onClick={onGenerate} disabled={busy}>Хуудас үүсгэх</Button>
          <Button as={Link} to={`/admin/olympiads/${slug}/print`} variant="primary">Хэвлэх харагдац</Button>
        </Card.Body>
      </Card>

      <Card className="mb-3">
        <Card.Header>2. Сканнердсан материал upload (AWS S3)</Card.Header>
        <Card.Body>
          <p className="small text-muted">
            Зураг эсвэл PDF-г дарааллаар нь сонгоно. QR-тай хуудас нь сурагч/бодлогыг автоматаар танина,
            дараагийн QR-гүй хуудсууд түүнд хавсарна. Файлууд нэрээр нь эрэмбэлэгдэнэ.
          </p>
          <input type="file" multiple accept="image/*,.pdf" className="form-control mb-2"
                 onChange={(e) => setFiles([...e.target.files])} />
          <Button onClick={onUpload} disabled={busy || files.length === 0}>
            {busy ? <Spinner size="sm" animation="border" /> : `Upload (${files.length})`}
          </Button>
          {progress !== null && <ProgressBar className="mt-2" now={progress} label={`${progress}%`} />}
          {result && (
            <Alert variant={result.unmatched ? 'warning' : 'success'} className="mt-3 mb-0">
              Нийт {result.total} хуудас: {result.matched} холбогдсон, {result.unmatched} холбогдоогүй.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Upload хийсэн зургууд ({images.length})</Card.Header>
        <Card.Body>
          <Row className="g-2">
            {images.map((im) => (
              <Col xs={6} md={3} key={im.id}>
                <a href={im.url} target="_blank" rel="noreferrer">
                  <img src={im.url} alt="" className="img-fluid border" style={{ maxHeight: 140, objectFit: 'cover', width: '100%' }} />
                </a>
                <div className="small mt-1">
                  {im.sheet_label ? <>{im.has_qr && <Badge bg="success" className="me-1">QR</Badge>}{im.sheet_label}</> : <Badge bg="warning">Холбогдоогүй</Badge>}
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default OlympiadAdminPage;
