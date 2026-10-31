// src/components/docImport/AiImportTab.jsx
// DocImportPage-ийн "AI баримт импорт" таб

import { useState, useRef, useCallback } from 'react';
import apiClient from '../../api/axiosConfig.js';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';

import { ACCEPTED, MAX_FILE_MB, fileIcon, formatBytes, nextKey } from './docImportUtils.js';
import FileResultSection from './FileResultSection.jsx';

export default function AiImportTab() {
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

  return (
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
              DeepSeek AI таны файлаас бодлогуудыг автоматаар таньж,
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
            <p className="mt-3 fw-semibold">DeepSeek AI боловсруулж байна...</p>
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
  );
}
