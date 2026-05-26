// AssignmentFlexibleImportPage — Ханбогд / Remark форматаас хариулт оруулах (3 алхамт)
import React, { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import {
  Upload, CheckCircle, AlertTriangle, ArrowLeft,
  ArrowRight, FileSpreadsheet, Users, RefreshCw,
} from 'lucide-react';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import apiClient from '../api/axiosConfig';

const STEP_UPLOAD = 1;
const STEP_MATCH = 2;
const STEP_RESULT = 3;

const BADGE_COLOR = { high: 'success', med: 'warning', low: 'danger', none: 'secondary' };

function matchBadge(score) {
  if (score >= 0.9) return { color: 'success', label: 'Тааралдсан' };
  if (score >= 0.7) return { color: 'warning', label: 'Магадтай' };
  if (score > 0) return { color: 'danger', label: 'Эргэлзэлтэй' };
  return { color: 'secondary', label: 'Тааралдаагүй' };
}

const AssignmentFlexibleImportPage = () => {
  const { id: clubId, assignmentId } = useParams();
  const { clubData, showToast } = useOutletContext();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_UPLOAD);

  // Step 1 state
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef(null);

  // Preview data from backend
  const [preview, setPreview] = useState(null);       // full API response
  const [selectedSheet, setSelectedSheet] = useState('');

  // Step 2: overrides — {row_key: user_id | 'skip'}
  const [overrides, setOverrides] = useState({});
  const [memberSearch, setMemberSearch] = useState({});  // {row_key: search text}

  // Step 3 state
  const [importing, setImporting] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  // ── Step 1: Upload & Parse ────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f || null);
    setParseError('');
    setPreview(null);
    setOverrides({});
  };

  const handleParse = useCallback(async (sheetOverride) => {
    if (!file) return;
    setParsing(true);
    setParseError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (sheetOverride || selectedSheet) {
        fd.append('sheet_name', sheetOverride || selectedSheet);
      }
      const res = await apiClient.post(
        `/api/club-assignments/${assignmentId}/preview_flexible_excel/`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setPreview(res.data);
      setSelectedSheet(res.data.selected_sheet);
      setOverrides({});
      setStep(STEP_MATCH);
    } catch (err) {
      setParseError(err.response?.data?.detail || 'Файл задлахад алдаа гарлаа.');
    } finally {
      setParsing(false);
    }
  }, [file, selectedSheet, assignmentId]);

  const handleSheetChange = (sheetName) => {
    setSelectedSheet(sheetName);
    handleParse(sheetName);
  };

  // ── Step 2: Match Students ────────────────────────────────────────────────

  const setOverride = (rowKey, val) => {
    setOverrides(prev => ({ ...prev, [rowKey]: val }));
  };

  const effectiveUser = (s) => {
    const ov = overrides[s.row_key];
    if (ov === 'skip' || ov === '__pick') return null;
    if (ov) return ov;
    return s.matched_user?.id || null;
  };

  const readyCount = preview?.students?.filter(s => effectiveUser(s) !== null && overrides[s.row_key] !== 'skip').length || 0;
  const skipCount = preview?.students?.filter(s => overrides[s.row_key] === 'skip').length || 0;
  const unmatchedCount = preview?.students?.filter(s => !effectiveUser(s) && overrides[s.row_key] !== 'skip').length || 0;

  // ── Step 3: Import ────────────────────────────────────────────────────────

  const handleImport = async () => {
    setImporting(true);
    setImportError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sheet_name', selectedSheet);
      fd.append('dry_run', dryRun ? 'true' : 'false');
      fd.append('overrides', JSON.stringify(overrides));
      const res = await apiClient.post(
        `/api/club-assignments/${assignmentId}/import_flexible_excel/`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setImportResult(res.data);
      setStep(STEP_RESULT);
    } catch (err) {
      setImportError(err.response?.data?.detail || 'Оруулахад алдаа гарлаа.');
    } finally {
      setImporting(false);
    }
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const breadcrumbs = [
    { label: clubData?.name || 'Клуб', path: `/clubs/${clubId}` },
    { label: 'Даалгаврууд', path: `/clubs/${clubId}/assignments` },
    { label: 'Excel import', path: null },
  ];

  return (
    <div className="container-fluid py-3" style={{ maxWidth: 960 }}>
      <AppBreadcrumb items={breadcrumbs} />

      {/* Step indicator */}
      <div className="d-flex align-items-center gap-2 mb-4 small">
        {[
          { n: 1, label: 'Файл оруулах' },
          { n: 2, label: 'Сурагч тааруулах' },
          { n: 3, label: 'Дүн' },
        ].map(({ n, label }, i, arr) => (
          <React.Fragment key={n}>
            <span
              className={`d-flex align-items-center justify-content-center rounded-circle fw-bold`}
              style={{
                width: 28, height: 28, flexShrink: 0,
                background: step === n ? '#1E40AF' : step > n ? '#16a34a' : '#e5e7eb',
                color: step >= n ? '#fff' : '#6b7280',
              }}
            >
              {step > n ? <CheckCircle size={14} /> : n}
            </span>
            <span className={step === n ? 'fw-semibold text-dark' : 'text-muted'}>{label}</span>
            {i < arr.length - 1 && <span className="text-muted">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === STEP_UPLOAD && (
        <Card className="shadow-sm">
          <Card.Header className="bg-white border-bottom py-2">
            <div className="d-flex align-items-center gap-2">
              <FileSpreadsheet size={16} className="text-success" />
              <span className="fw-semibold small">Excel файл оруулах</span>
            </div>
          </Card.Header>
          <Card.Body>
            <p className="small text-muted mb-3">
              Дараах 2 форматыг дэмждэг:<br />
              <strong>1. Гараар бөглөсөн</strong> — ХАНБОГД-2 маягийн xlsx (олон sheet, монгол нэр)<br />
              <strong>2. Remark® OMR</strong> — Remark скан программын гаралт (Student Response Report sheet)
            </p>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="d-none"
                onChange={handleFileChange}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} className="me-1" />
                Файл сонгох
              </Button>
              {file && (
                <span className="small text-muted">
                  <FileSpreadsheet size={13} className="me-1 text-success" />
                  {file.name}
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                disabled={!file || parsing}
                onClick={() => handleParse()}
              >
                {parsing
                  ? <Spinner animation="border" size="sm" />
                  : <><ArrowRight size={14} className="me-1" />Задлах</>}
              </Button>
            </div>

            {parseError && (
              <Alert variant="danger" className="small py-2 mt-3">
                <AlertTriangle size={14} className="me-1" />{parseError}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── STEP 2: Match ── */}
      {step === STEP_MATCH && preview && (
        <>
          {/* Summary bar */}
          <Card className="shadow-sm mb-3">
            <Card.Body className="py-2 px-3">
              <div className="d-flex align-items-center gap-3 flex-wrap small">
                <span>
                  <Badge bg="secondary" className="me-1">{preview.format === 'remark' ? 'Remark' : 'Гараар'}</Badge>
                  Формат
                </span>
                {preview.available_sheets?.length > 1 && (
                  <Form.Select
                    size="sm"
                    style={{ maxWidth: 180 }}
                    value={selectedSheet}
                    onChange={e => handleSheetChange(e.target.value)}
                    disabled={parsing}
                  >
                    {preview.available_sheets.map(sh => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </Form.Select>
                )}
                {preview.available_sheets?.length === 1 && (
                  <span className="text-muted">Хуудас: <strong>{selectedSheet}</strong></span>
                )}
                <span>
                  Нийт: <strong>{preview.total}</strong>
                </span>
                <span className="text-success">
                  <CheckCircle size={13} className="me-1" />
                  Тааралдсан: <strong>{preview.matched}</strong>
                </span>
                {preview.unmatched > 0 && (
                  <span className="text-danger">
                    <AlertTriangle size={13} className="me-1" />
                    Тааралдаагүй: <strong>{preview.unmatched}</strong>
                  </span>
                )}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-auto"
                  onClick={() => { setStep(STEP_UPLOAD); setPreview(null); }}
                >
                  <ArrowLeft size={13} className="me-1" />Буцах
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Student matching table */}
          <Card className="shadow-sm mb-3">
            <Card.Header className="bg-white border-bottom py-2">
              <div className="d-flex align-items-center gap-2">
                <Users size={15} className="text-primary" />
                <span className="fw-semibold small">Сурагч тааруулах</span>
                <span className="text-muted small ms-auto">
                  Тааралдаагүй сурагчдыг гараар сонгоно уу
                </span>
              </div>
            </Card.Header>
            <div style={{ overflowX: 'auto' }}>
              <Table hover size="sm" className="mb-0 small align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Excel-н нэр</th>
                    <th>Анги</th>
                    <th>Тааралдсан хэрэглэгч</th>
                    <th style={{ width: 100 }}>Итгэлцэл</th>
                    <th style={{ width: 80 }}>Хариулт</th>
                    <th style={{ width: 90 }}>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.students.map((s, idx) => {
                    const ovVal = overrides[s.row_key];
                    const isSkipped = ovVal === 'skip';
                    const mb = matchBadge(s.match_score);
                    const resolvedId = effectiveUser(s);

                    return (
                      <tr key={s.row_key} className={isSkipped ? 'opacity-50' : ''}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <span className="fw-medium">{s.raw_name}</span>
                        </td>
                        <td className="text-muted">{s.class_group}</td>
                        <td>
                          {isSkipped ? (
                            <span className="text-muted fst-italic">Алгасах</span>
                          ) : ovVal ? (
                            <OverrideChip userId={ovVal} candidates={s.candidates} />
                          ) : s.matched_user ? (
                            <span>
                              {s.matched_user.name}
                              <span className="text-muted ms-1">@{s.matched_user.username}</span>
                              {s.match_score < 0.95 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 ms-2 small text-muted"
                                  style={{ fontSize: 11 }}
                                  onClick={() => setOverride(s.row_key, '__pick')}
                                >
                                  өөрчлөх
                                </Button>
                              )}
                            </span>
                          ) : ovVal === '__pick' ? (
                            <CandidatePicker
                              s={s}
                              clubId={clubId}
                              assignmentId={assignmentId}
                              onSelect={(uid) => setOverride(s.row_key, uid)}
                            />
                          ) : (
                            <CandidatePicker
                              s={s}
                              clubId={clubId}
                              assignmentId={assignmentId}
                              onSelect={(uid) => setOverride(s.row_key, uid)}
                            />
                          )}
                        </td>
                        <td>
                          <Badge bg={mb.color} className="small">{mb.label}</Badge>
                        </td>
                        <td className="text-center text-muted">
                          {Object.keys(s.mc_answers || {}).length + Object.keys(s.fill_answers || {}).length}
                        </td>
                        <td>
                          {!isSkipped ? (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="py-0 px-1"
                              style={{ fontSize: 11 }}
                              onClick={() => setOverride(s.row_key, 'skip')}
                            >
                              Алгасах
                            </Button>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="py-0 px-1"
                              style={{ fontSize: 11 }}
                              onClick={() => setOverride(s.row_key, undefined)}
                            >
                              <RefreshCw size={10} className="me-1" />Сэргээх
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* Action bar */}
          <Card className="shadow-sm">
            <Card.Body className="py-2 px-3">
              <div className="d-flex align-items-center gap-3 flex-wrap small">
                <span>
                  Оруулах: <strong className="text-success">{readyCount}</strong>
                </span>
                {skipCount > 0 && (
                  <span>Алгасах: <strong className="text-muted">{skipCount}</strong></span>
                )}
                {unmatchedCount > 0 && (
                  <span className="text-danger">
                    <AlertTriangle size={12} className="me-1" />
                    Тааруулаагүй: <strong>{unmatchedCount}</strong> (алгасагдана)
                  </span>
                )}
                <Form.Check
                  type="checkbox"
                  id="dry-run-flex"
                  label="Dry run (туршилт)"
                  checked={dryRun}
                  onChange={e => setDryRun(e.target.checked)}
                  className="ms-auto"
                />
                <Button
                  variant="success"
                  size="sm"
                  disabled={importing || readyCount === 0}
                  onClick={handleImport}
                >
                  {importing
                    ? <Spinner animation="border" size="sm" />
                    : <><Upload size={14} className="me-1" />{dryRun ? 'Туршилт хийх' : 'Оруулах'}</>}
                </Button>
              </div>
              {importError && (
                <Alert variant="danger" className="small py-2 mt-2 mb-0">
                  <AlertTriangle size={13} className="me-1" />{importError}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* ── STEP 3: Result ── */}
      {step === STEP_RESULT && importResult && (
        <Card className="shadow-sm">
          <Card.Header className="bg-white border-bottom py-2">
            <div className="d-flex align-items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              <span className="fw-semibold small">
                {importResult.dry_run ? 'Dry run — туршилт дууслаа' : 'Import амжилттай'}
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            <Alert
              variant={importResult.dry_run ? 'warning' : 'success'}
              className="small py-2 mb-3"
            >
              {importResult.dry_run && 'Dry run — DB-д өөрчлөлт хийгдсэнгүй. '}
              <strong>{importResult.imported}</strong> сурагчийн хариулт боловсруулсан,{' '}
              <strong>{importResult.skipped}</strong> алгасав.
            </Alert>

            {importResult.errors?.length > 0 && (
              <div className="mb-3">
                <p className="small fw-semibold text-danger mb-1">Алдааны жагсаалт:</p>
                {importResult.errors.map((e, i) => (
                  <div key={i} className="small text-danger">
                    {e.raw_name || e.row_key} — {e.reason}
                  </div>
                ))}
              </div>
            )}

            {importResult.results?.length > 0 && (
              <ResultsTable results={importResult.results} />
            )}

            <div className="d-flex gap-2 mt-3">
              {importResult.dry_run && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => { setDryRun(false); setStep(STEP_MATCH); setImportResult(null); }}
                >
                  <Upload size={14} className="me-1" />Жинхэнэ оруулах
                </Button>
              )}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => navigate(`/clubs/${clubId}/assignments/${assignmentId}`)}
              >
                <ArrowLeft size={14} className="me-1" />Даалгавар руу буцах
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

// ── Small helper components ───────────────────────────────────────────────────

function CandidatePicker({ s, onSelect }) {
  if (!s.candidates?.length) {
    return <span className="text-danger small">Тохирох хэрэглэгч байхгүй</span>;
  }
  return (
    <Form.Select
      size="sm"
      style={{ maxWidth: 240 }}
      value=""
      onChange={e => e.target.value && onSelect(Number(e.target.value))}
    >
      <option value="">— сонгох —</option>
      {s.candidates.map(c => (
        <option key={c.id} value={c.id}>
          {c.name} @{c.username} ({Math.round(c.score * 100)}%)
        </option>
      ))}
    </Form.Select>
  );
}

function OverrideChip({ userId, candidates }) {
  const found = candidates?.find(c => c.id === userId);
  return (
    <span className="text-success small">
      <CheckCircle size={12} className="me-1" />
      {found ? `${found.name} @${found.username}` : `ID:${userId}`}
    </span>
  );
}

// ── ResultsTable: per-student expandable answer detail ───────────────────────

const MC_COLS = 9; // МС хариулт нэг мөрт хэдэн нүд

function ResultsTable({ results }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table hover size="sm" className="small mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ width: 28 }}></th>
            <th>Нэр</th>
            <th>Хэрэглэгч</th>
            <th className="text-center">Оноо</th>
            <th className="text-center">Нийт</th>
            <th className="text-center">%</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <React.Fragment key={r.row_key}>
              <tr
                style={{ cursor: r.answers?.length ? 'pointer' : 'default' }}
                onClick={() => r.answers?.length && toggle(r.row_key)}
              >
                <td className="text-center text-muted" style={{ fontSize: 12 }}>
                  {r.answers?.length
                    ? (expanded[r.row_key] ? '▲' : '▼')
                    : ''}
                </td>
                <td className="fw-medium">{r.raw_name || r.name}</td>
                <td className="text-muted">@{r.username}</td>
                <td className="text-center fw-semibold">{r.score ?? '—'}</td>
                <td className="text-center text-muted">{r.max_score ?? '—'}</td>
                <td className="text-center">
                  {r.max_score
                    ? (
                      <Badge bg={r.score / r.max_score >= 0.5 ? 'success' : 'danger'}>
                        {Math.round((r.score / r.max_score) * 100)}%
                      </Badge>
                    ) : '—'}
                </td>
              </tr>
              {expanded[r.row_key] && r.answers?.length > 0 && (
                <tr>
                  <td colSpan={6} className="p-0 border-0">
                    <AnswerDetail answers={r.answers} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function AnswerDetail({ answers }) {
  const mcAnswers = answers.filter(a => a.type === 'mc').sort((a, b) => (a.order || 0) - (b.order || 0));
  const fillAnswers = answers.filter(a => a.type === 'fill');

  // Fill-г section-оор бүлэглэх
  const fillBySec = {};
  for (const a of fillAnswers) {
    const k = a.section ?? '?';
    if (!fillBySec[k]) fillBySec[k] = [];
    fillBySec[k].push(a);
  }

  return (
    <div className="px-3 py-2" style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
      {/* MC хариулт */}
      {mcAnswers.length > 0 && (
        <div className="mb-2">
          <p className="small fw-semibold text-muted mb-1">
            I хэсэг — Нэгдүгээр хэсэг ({mcAnswers.length} бодлого)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {mcAnswers.map(a => {
              const ok = a.user === a.correct;
              const noAns = !a.user;
              return (
                <div
                  key={a.order}
                  title={`${a.order}: таны хариулт ${a.user || '—'}, зөв ${a.correct || '—'}`}
                  style={{
                    width: 38,
                    textAlign: 'center',
                    padding: '2px 0',
                    borderRadius: 4,
                    fontSize: 11,
                    lineHeight: 1.4,
                    background: noAns ? '#f3f4f6' : ok ? '#dcfce7' : '#fee2e2',
                    color: noAns ? '#9ca3af' : ok ? '#15803d' : '#b91c1c',
                    border: `1px solid ${noAns ? '#e5e7eb' : ok ? '#86efac' : '#fca5a5'}`,
                  }}
                >
                  <div style={{ color: '#6b7280', fontSize: 10 }}>{a.order}</div>
                  <div style={{ fontWeight: 700 }}>{a.user || '·'}</div>
                  {!ok && !noAns && (
                    <div style={{ fontSize: 9, color: '#15803d' }}>{a.correct}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fill хариулт */}
      {Object.keys(fillBySec).length > 0 && (
        <div>
          <p className="small fw-semibold text-muted mb-1">II хэсэг — Хоёрдугаар хэсэг</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(fillBySec).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).map(([sec, items]) => (
              <div key={sec} style={{ minWidth: 160 }}>
                <div className="text-muted" style={{ fontSize: 11, marginBottom: 3 }}>
                  {sec} хэсэг
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {items.map(a => {
                    const ok = a.correct !== null && String(a.user) === String(a.correct);
                    const noAns = a.user === null || a.user === '';
                    return (
                      <div
                        key={a.label}
                        title={`${a.label}: таны ${a.user ?? '—'}, зөв ${a.correct ?? '—'} (${a.pts}/${a.max}оноо)`}
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          background: noAns ? '#f3f4f6' : ok ? '#dcfce7' : '#fee2e2',
                          color: noAns ? '#9ca3af' : ok ? '#15803d' : '#b91c1c',
                          border: `1px solid ${noAns ? '#e5e7eb' : ok ? '#86efac' : '#fca5a5'}`,
                        }}
                      >
                        <span style={{ color: '#6b7280', marginRight: 3 }}>{a.label}:</span>
                        <strong>{a.user ?? '·'}</strong>
                        {!ok && !noAns && a.correct !== null && (
                          <span style={{ color: '#15803d', marginLeft: 3, fontSize: 10 }}>
                            ({a.correct})
                          </span>
                        )}
                        <span style={{ color: '#9ca3af', marginLeft: 3, fontSize: 10 }}>
                          {a.pts}/{a.max}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentFlexibleImportPage;
