// src/pages/DocImportPage.jsx
// Баримт бичгээс бодлогуудыг AI-аар таньж импортлох хуудас

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';

// ─── Constants ────────────────────────────────────────────────────────────

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.xlsx,.xls';
const MAX_FILE_MB = 20;

const PROBLEM_TYPES = [
  { value: 0, label: 'Уламжлалт' },
  { value: 1, label: 'Сонгох тест' },
  { value: 4, label: 'Нөхөх тест' },
];

const FILE_ICONS = {
  pdf: '📄',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', gif: '🖼️',
  docx: '📝', doc: '📝',
  xlsx: '📊', xls: '📊',
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function fileExt(name) {
  return name?.split('.').pop().toLowerCase() || '';
}

function fileIcon(name) {
  return FILE_ICONS[fileExt(name)] || '📎';
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let _keyCounter = 0;
function nextKey() {
  return ++_keyCounter;
}

// ─── ProblemCard component ─────────────────────────────────────────────────

function ProblemCard({ prob, index, onChange, onDelete, extractedImages, onImageAttach, onImageDetach }) {
  const [previewMode, setPreviewMode] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const update = (field, val) => onChange(index, { ...prob, [field]: val });

  const attachedImages = prob.images || [];
  const hasFigure = prob.has_figure;
  const needsFigure = hasFigure && attachedImages.length === 0;

  return (
    <Card className={`mb-3 shadow-sm border-0 ${needsFigure ? 'border-start border-warning border-3' : ''}`}>
      <Card.Header className="d-flex justify-content-between align-items-center py-2 bg-white border-bottom">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="primary" className="rounded-pill">#{index + 1}</Badge>
          {prob.source_number != null && (
            <span className="text-muted small">Бодлого {prob.source_number}</span>
          )}
          {hasFigure && (
            <Badge bg={needsFigure ? 'warning' : 'success'} text={needsFigure ? 'dark' : 'white'}>
              {needsFigure ? '⚠️ Зураг хавсаргаагүй' : '🖼 Зурагтай'}
            </Badge>
          )}
          <Form.Check
            type="switch"
            id={`pub-${prob._key}`}
            label="Нийтэд харагдах"
            checked={prob.is_public}
            onChange={(e) => update('is_public', e.target.checked)}
            className="mb-0 small"
          />
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant={previewMode ? 'primary' : 'outline-secondary'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '✏️ Засах' : '👁 Харах'}
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => onDelete(index)}>
            🗑
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Гарчиг */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small text-muted">ГАРЧИГ</Form.Label>
          <Form.Control
            size="sm"
            type="text"
            value={prob.title || ''}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Бодлогын гарчиг..."
          />
        </Form.Group>

        {/* Төрөл */}
        <Row className="mb-3 g-2">
          <Col xs={12} md={4}>
            <Form.Label className="fw-semibold small text-muted">ТӨРӨЛ</Form.Label>
            <Form.Select
              size="sm"
              value={prob.type}
              onChange={(e) => update('type', parseInt(e.target.value))}
            >
              {PROBLEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Form.Select>
          </Col>
          {prob.answer != null && (
            <Col xs={12} md={8}>
              <Form.Label className="fw-semibold small text-muted">ХАРИУЛТ / УТГА</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                value={prob.answer || ''}
                onChange={(e) => update('answer', e.target.value)}
                placeholder="Тооцоолсон хариулт (заавал биш)..."
              />
            </Col>
          )}
        </Row>

        {/* Statement */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="fw-semibold small text-muted mb-0">БОДЛОГЫН АГУУЛГА</Form.Label>
            {previewMode && <small className="text-muted">LaTeX урьдчилан харах</small>}
          </div>
          {previewMode ? (
            <div className="border rounded p-3 bg-light" style={{ minHeight: 80, fontSize: '0.9rem' }}>
              <LivePreview content={prob.statement} />
            </div>
          ) : (
            <Form.Control
              as="textarea"
              rows={4}
              value={prob.statement || ''}
              onChange={(e) => update('statement', e.target.value)}
              placeholder="Бодлогын текст (LaTeX дэмжинэ: $x^2$, $$\frac{a}{b}$$)..."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          )}
        </Form.Group>

        {/* Бодолт */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="fw-semibold small text-muted mb-0">
              БОДОЛТ <span className="text-muted fw-normal">(заавал биш)</span>
            </Form.Label>
          </div>
          {previewMode && prob.solution ? (
            <div className="border rounded p-3 bg-light" style={{ minHeight: 60, fontSize: '0.9rem' }}>
              <LivePreview content={prob.solution} />
            </div>
          ) : (
            <Form.Control
              as="textarea"
              rows={3}
              value={prob.solution || ''}
              onChange={(e) => update('solution', e.target.value)}
              placeholder="Бодолтын текст (LaTeX дэмжинэ)..."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          )}
        </Form.Group>

        {/* Хавсаргасан зурагнууд */}
        {attachedImages.length > 0 && (
          <div className="mb-3">
            <small className="text-muted fw-semibold d-block mb-2">ХАВСАРГАСАН ЗУРАГНУУД</small>
            <div className="d-flex flex-wrap gap-2">
              {attachedImages.map((img, ii) => (
                <div key={ii} className="position-relative">
                  <img
                    src={img}
                    alt={`img-${ii}`}
                    style={{
                      width: 80, height: 80, objectFit: 'contain',
                      borderRadius: 6, border: '1px solid #dee2e6',
                      background: '#f8f9fa', cursor: 'pointer',
                    }}
                    onClick={() => window.open(img, '_blank')}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0 p-0"
                    style={{ width: 20, height: 20, fontSize: 11, lineHeight: 1 }}
                    onClick={() => onImageDetach(index, ii)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Зураг хавсаргах товч */}
        {extractedImages && extractedImages.length > 0 && (
          <div className="d-flex gap-2 align-items-center">
            <Button
              size="sm"
              variant={needsFigure ? 'warning' : 'outline-secondary'}
              onClick={() => setShowImagePicker(true)}
            >
              🖼 {needsFigure ? 'Зураг хавсаргах (шаардлагатай)' : `Зураг нэмэх (${extractedImages.length} байна)`}
            </Button>
            {prob.figure_description && (
              <small className="text-muted fst-italic">{prob.figure_description}</small>
            )}
          </div>
        )}
      </Card.Body>

      {/* Image picker modal */}
      <Modal show={showImagePicker} onHide={() => setShowImagePicker(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Зураг сонгох — Бодлого #{index + 1}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {prob.figure_description && (
            <Alert variant="info" className="py-2 small mb-3">
              <strong>Зургийн тайлбар:</strong> {prob.figure_description}
            </Alert>
          )}
          <p className="text-muted small mb-3">
            Бодлогод хавсаргах зургийг дарж сонго. Дахин дарж арилгана.
          </p>
          <div className="d-flex flex-wrap gap-3">
            {extractedImages.map((img, ii) => {
              const attached = attachedImages.includes(img.data);
              const label = img.name || `Зураг ${ii + 1}`;
              return (
                <div key={img.data.slice(-30)} className="text-center" style={{ cursor: 'pointer', maxWidth: 160 }}>
                  <img
                    src={img.data}
                    alt={label}
                    style={{
                      width: 150, height: 150, objectFit: 'contain',
                      border: attached ? '3px solid #0d6efd' : '2px solid #dee2e6',
                      borderRadius: 8, background: '#f8f9fa',
                    }}
                    onClick={() => {
                      if (attached) {
                        const imgIdx = attachedImages.indexOf(img.data);
                        onImageDetach(index, imgIdx);
                      } else {
                        onImageAttach(index, img.data);
                      }
                    }}
                  />
                  <div className="small text-muted mt-1">
                    <span className="fw-semibold">{ii + 1}.</span> {label}
                    {attached && <Badge bg="primary" className="ms-1">✓</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowImagePicker(false)}>Болсон</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}

// ─── FileResultSection component ──────────────────────────────────────────

function FileResultSection({ result, onProblemsChange }) {
  if (result.error) {
    return (
      <Alert variant="danger">
        <strong>{result.filename}:</strong> {result.error}
      </Alert>
    );
  }

  const handleChange = (idx, updated) => {
    const newProbs = [...result.problems];
    newProbs[idx] = updated;
    onProblemsChange({ ...result, problems: newProbs });
  };

  const handleDelete = (idx) => {
    onProblemsChange({ ...result, problems: result.problems.filter((_, i) => i !== idx) });
  };

  const handleImageAttach = (probIdx, imgData) => {
    const newProbs = result.problems.map((p, i) =>
      i === probIdx ? { ...p, images: [...(p.images || []), imgData] } : p
    );
    onProblemsChange({ ...result, problems: newProbs });
  };

  const handleImageDetach = (probIdx, imgIdx) => {
    const newProbs = result.problems.map((p, i) =>
      i === probIdx
        ? { ...p, images: (p.images || []).filter((_, ii) => ii !== imgIdx) }
        : p
    );
    onProblemsChange({ ...result, problems: newProbs });
  };

  // Нийт зурагтай бодлогын тоо
  const figureCount = result.problems.filter((p) => p.has_figure).length;
  const attachedCount = result.problems.filter((p) => (p.images || []).length > 0).length;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <span className="fs-5">{fileIcon(result.filename)}</span>
        <div>
          <strong>{result.filename}</strong>
          {result.source && result.source !== result.filename && (
            <span className="text-muted ms-2 small">({result.source})</span>
          )}
        </div>
        <Badge bg={result.language === 'mongolian' ? 'success' : 'info'} className="ms-auto">
          {result.language === 'mongolian' ? '🇲🇳 Монгол' : '🇬🇧 Англи'}
        </Badge>
        <Badge bg="secondary">{result.problems.length} бодлого</Badge>
        {result.images?.length > 0 && (
          <Badge bg="warning" text="dark">🖼 {result.images.length} зураг</Badge>
        )}
        {figureCount > 0 && (
          <Badge bg={attachedCount >= figureCount ? 'success' : 'danger'}>
            {attachedCount}/{figureCount} зураг хавсарсан
          </Badge>
        )}
      </div>

      {result.problems.length === 0 ? (
        <Alert variant="warning">Бодлого олдсонгүй.</Alert>
      ) : (
        result.problems.map((prob, i) => (
          <ProblemCard
            key={prob._key}
            prob={prob}
            index={i}
            onChange={handleChange}
            onDelete={handleDelete}
            extractedImages={result.images || []}
            onImageAttach={handleImageAttach}
            onImageDetach={handleImageDetach}
          />
        ))
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DocImportPage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  // Түлхүүр үг
  const [keywordName, setKeywordName] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const keywordDebounceRef = useRef(null);

  const fileInputRef = useRef(null);

  // ── File selection ──────────────────────────────────────────────────────

  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter((f) => {
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`"${f.name}" файл ${MAX_FILE_MB}MB-аас их байна.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...valid.map((f) => ({ file: f, id: nextKey() }))]);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ── Keyword autocomplete ─────────────────────────────────────────────────

  const handleKeywordInput = (val) => {
    setKeywordName(val);
    setShowSuggestions(true);
    clearTimeout(keywordDebounceRef.current);
    if (val.trim().length < 2) {
      setKeywordSuggestions([]);
      return;
    }
    keywordDebounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/api/integral/keywords/search/?q=${encodeURIComponent(val.trim())}`);
        setKeywordSuggestions(res.data || []);
      } catch {
        setKeywordSuggestions([]);
      }
    }, 300);
  };

  const selectKeyword = (name) => {
    setKeywordName(name);
    setKeywordSuggestions([]);
    setShowSuggestions(false);
  };

  // ── Extract ─────────────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!files.length) return;
    setExtracting(true);
    setGlobalError(null);
    setSaveResult(null);
    setResults([]);

    const BATCH = 3;
    const newResults = [];

    for (let i = 0; i < files.length; i += BATCH) {
      const batch = files.slice(i, i + BATCH);
      const formData = new FormData();
      batch.forEach(({ file }) => formData.append('file', file));

      try {
        const res = await apiClient.post('/api/integral/doc-import/extract/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        for (const r of res.data.results || []) {
          // images давхардлыг data URL-ээр устгах
          if (Array.isArray(r.images)) {
            const seenData = new Set();
            r.images = r.images.filter((img) => {
              if (seenData.has(img.data)) return false;
              seenData.add(img.data);
              return true;
            });
          }
          for (const p of r.problems || []) {
            p._key = nextKey();
            // auto_images-ийг images болгон эхлэл утга болгох
            p.images = p.auto_images || [];
            delete p.auto_images;
            if (p.type === undefined) p.type = 0;
            if (p.is_public === undefined) p.is_public = false;
          }
          newResults.push(r);
        }
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Алдаа гарлаа';
        batch.forEach(({ file }) =>
          newResults.push({ filename: file.name, error: msg, problems: [], images: [] })
        );
      }
      setExtractProgress(Math.round(((i + BATCH) / files.length) * 100));
    }

    setResults(newResults);
    setExtracting(false);
    setExtractProgress(0);
  };

  // ── Results update ────────────────────────────────────────────────────────

  const handleResultChange = (idx, updated) => {
    setResults((prev) => prev.map((r, i) => (i === idx ? updated : r)));
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const allProblems = results.flatMap((r) =>
      (r.problems || []).map((p) => ({
        title: p.title,
        statement: p.statement,
        solution: p.solution || null,
        answer: p.answer || null,
        type: p.type ?? 0,
        is_public: !!p.is_public,
        images: p.images || [],
      }))
    );

    if (!allProblems.length) {
      setGlobalError('Хадгалах бодлого байхгүй.');
      return;
    }

    setSaving(true);
    setGlobalError(null);
    setSaveResult(null);

    try {
      const res = await apiClient.post('/api/integral/doc-import/save/', {
        problems: allProblems,
        keyword_name: keywordName.trim() || undefined,
      });
      setSaveResult(res.data);
      if (res.data.count > 0) {
        setResults([]);
        setFiles([]);
      }
    } catch (err) {
      setGlobalError(err.response?.data?.error || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  // ── Totals ───────────────────────────────────────────────────────────────

  const totalProblems = results.reduce((s, r) => s + (r.problems?.length || 0), 0);
  const totalImages = results.reduce((s, r) => s + (r.images?.length || 0), 0);
  const needsFigureCount = results.reduce(
    (s, r) => s + (r.problems || []).filter((p) => p.has_figure && !(p.images || []).length).length,
    0
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Container fluid className="py-4 px-4">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-decoration-none" onClick={() => navigate('/admin')}>
          ← Буцах
        </Button>
        <div>
          <h3 className="mb-0 fw-bold">📥 Баримт бичгийг импортлох</h3>
          <small className="text-muted">PDF, зураг, Word, Excel файлаас бодлогуудыг AI-аар таньж оруулна</small>
        </div>
      </div>

      <Row className="g-4">
        {/* Left: Upload area */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm sticky-top" style={{ top: 80 }}>
            <Card.Body>
              {/* Drop zone */}
              <div
                className={`rounded p-4 text-center mb-3 ${
                  dragging ? 'border border-primary bg-primary bg-opacity-10' : 'border border-dashed'
                }`}
                style={{ borderStyle: 'dashed', cursor: 'pointer', minHeight: 160, borderWidth: 2 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="fs-1">📂</div>
                <p className="mb-1 fw-semibold">Файлуудыг чирж тавь эсвэл дар</p>
                <small className="text-muted">PDF · JPG/PNG · DOCX · XLSX · Макс {MAX_FILE_MB}MB</small>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="d-none"
                onChange={handleFileInput}
              />

              {/* File list */}
              {files.length > 0 && (
                <div className="mb-3">
                  {files.map(({ file, id }) => (
                    <div key={id} className="d-flex align-items-center gap-2 py-2 border-bottom">
                      <span>{fileIcon(file.name)}</span>
                      <div className="flex-grow-1 min-width-0">
                        <div className="text-truncate small fw-semibold">{file.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{formatBytes(file.size)}</div>
                      </div>
                      <Button
                        size="sm" variant="outline-danger" className="p-0 px-1"
                        onClick={() => removeFile(id)}
                      >×</Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extract button */}
              <Button
                variant="primary"
                className="w-100 mb-2"
                onClick={handleExtract}
                disabled={!files.length || extracting || saving}
              >
                {extracting ? (
                  <><Spinner as="span" size="sm" className="me-2" />AI боловсруулж байна...</>
                ) : (
                  <><span className="me-2">🤖</span>Бодлогуудыг таних ({files.length} файл)</>
                )}
              </Button>

              {extracting && (
                <ProgressBar animated now={extractProgress || 20} className="mb-2" style={{ height: 6 }} />
              )}

              {/* Stats */}
              {results.length > 0 && (
                <div className="rounded bg-light p-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span>📋 Задлагдсан бодлого</span>
                    <strong>{totalProblems}</strong>
                  </div>
                  {totalImages > 0 && (
                    <div className="d-flex justify-content-between mb-1">
                      <span>🖼 Задлагдсан зураг</span>
                      <strong>{totalImages}</strong>
                    </div>
                  )}
                  {needsFigureCount > 0 && (
                    <div className="d-flex justify-content-between mb-1 text-warning">
                      <span>⚠️ Зураг хавсаргаагүй</span>
                      <strong>{needsFigureCount}</strong>
                    </div>
                  )}
                  <hr className="my-2" />

                  {/* Нийтлэг түлхүүр үг */}
                  <div className="mb-2 position-relative">
                    <Form.Label className="fw-semibold mb-1" style={{ fontSize: '0.75rem' }}>
                      🏷 ТҮЛХҮҮР ҮГ <span className="text-muted fw-normal">(заавал биш)</span>
                    </Form.Label>
                    <Form.Control
                      size="sm"
                      type="text"
                      value={keywordName}
                      onChange={(e) => handleKeywordInput(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      onFocus={() => keywordName.length >= 2 && setShowSuggestions(true)}
                      placeholder="Жишээ: БҮТ 1000, Бабинская..."
                    />
                    {showSuggestions && keywordSuggestions.length > 0 && (
                      <div
                        className="position-absolute w-100 bg-white border rounded shadow-sm"
                        style={{ zIndex: 100, top: '100%', maxHeight: 160, overflowY: 'auto' }}
                      >
                        {keywordSuggestions.map((kw) => (
                          <div
                            key={kw.id}
                            className="px-3 py-2 small"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={() => selectKeyword(kw.name)}
                            onMouseEnter={(e) => e.currentTarget.classList.add('bg-light')}
                            onMouseLeave={(e) => e.currentTarget.classList.remove('bg-light')}
                          >
                            {kw.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {keywordName.trim() && (
                      <div className="mt-1">
                        <Badge bg="info" text="dark" className="small">
                          🏷 {keywordName.trim()}
                        </Badge>
                        <span className="text-muted ms-1" style={{ fontSize: '0.7rem' }}>
                          бүх бодлогод нэмэгдэнэ
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="success"
                    className="w-100"
                    onClick={handleSave}
                    disabled={saving || totalProblems === 0}
                  >
                    {saving ? (
                      <><Spinner as="span" size="sm" className="me-2" />Хадгалж байна...</>
                    ) : (
                      <>💾 {totalProblems} бодлого хадгалах</>
                    )}
                  </Button>
                </div>
              )}

              {/* Save result */}
              {saveResult && (
                <Alert
                  variant={saveResult.count > 0 ? 'success' : 'warning'}
                  className="mt-3 mb-0"
                >
                  {saveResult.count > 0 ? (
                    <>
                      <strong>✅ {saveResult.count} бодлого хадгалагдлаа!</strong>
                      {saveResult.keyword && (
                        <div className="mt-1">
                          <Badge bg="info" text="dark">🏷 {saveResult.keyword.name}</Badge>
                          <span className="text-muted ms-1 small">түлхүүр үг нэмэгдлээ</span>
                        </div>
                      )}
                      <div className="mt-2">
                        {saveResult.saved.slice(0, 3).map((p) => (
                          <div key={p.id} className="small">
                            • <a href={`/problem/${p.uuid}`} target="_blank" rel="noreferrer">{p.title}</a>
                          </div>
                        ))}
                        {saveResult.saved.length > 3 && (
                          <div className="small text-muted">...болон {saveResult.saved.length - 3} бусад</div>
                        )}
                      </div>
                    </>
                  ) : 'Хадгалсан бодлого байхгүй.'}
                  {saveResult.errors?.length > 0 && (
                    <div className="mt-2 text-danger small">
                      ❌ {saveResult.errors.length} алдаа гарлаа.
                    </div>
                  )}
                </Alert>
              )}

              {globalError && (
                <Alert variant="danger" className="mt-3 mb-0" dismissible onClose={() => setGlobalError(null)}>
                  {globalError}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right: Results */}
        <Col lg={8}>
          {/* Empty state */}
          {!extracting && results.length === 0 && (
            <div className="text-center py-5 text-muted">
              <div className="fs-1 mb-3">🤖</div>
              <h5>Файл сонгоод "Бодлогуудыг таних" товчийг дарна уу</h5>
              <p className="small">
                Gemini AI таны файлаас бодлогуудыг автоматаар таньж,
                <br />LaTeX форматаар гарган харуулна.
              </p>
              <div className="d-flex justify-content-center flex-wrap gap-3 mt-3">
                {['📄 PDF', '🖼️ JPG / PNG', '📝 Word (.docx)', '📊 Excel (.xlsx)'].map((t) => (
                  <Badge key={t} bg="light" text="dark" className="px-3 py-2 border">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {extracting && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" style={{ width: 48, height: 48 }} />
              <p className="mt-3 fw-semibold">Gemini AI боловсруулж байна...</p>
              <p className="text-muted small">Бодлогуудыг таних · LaTeX хөрвүүлэх · Зурагнуудыг задлах</p>
            </div>
          )}

          {/* Results */}
          {!extracting && results.map((result, i) => (
            <FileResultSection
              key={i}
              result={result}
              onProblemsChange={(updated) => handleResultChange(i, updated)}
            />
          ))}
        </Col>
      </Row>
    </Container>
  );
}
