// src/components/docImport/JsonImportTab.jsx
// DocImportPage-ийн "JSON тест импорт" таб (import_problems management command-той ижил формат)

import { useState, useRef } from 'react';
import apiClient from '../../api/axiosConfig.js';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';

import { ACCEPTED_JSON, formatBytes } from './docImportUtils.js';

const JSON_OPTION_CHECKBOXES = [
  ['update_existing', 'Байгаа бодлогуудыг шинэчлэх (UUID)'],
  ['skip_solutions', 'Бодолтуудыг алгасах'],
  ['skip_keywords', 'Түлхүүр үгсийг алгасах'],
  ['no_quiz', 'Quiz үүсгэхгүй (JSON-д metadata байсан ч)'],
  ['dry_run', 'Туршилтын горим (өөрчлөлт хадгалахгүй)'],
];

export default function JsonImportTab() {
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonOptions, setJsonOptions] = useState({
    update_existing: false,
    skip_solutions: false,
    skip_keywords: false,
    no_quiz: false,
    dry_run: false,
    add_to_quiz: '',
    keyword: '',
    default_author: '',
  });
  const [jsonImporting, setJsonImporting] = useState(false);
  const [jsonResult, setJsonResult] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const jsonFileInputRef = useRef(null);

  const handleJsonFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) setJsonFile(f);
    e.target.value = '';
  };

  const handleJsonOptionChange = (key, val) => {
    setJsonOptions((prev) => ({ ...prev, [key]: val }));
  };

  const handleJsonImport = async () => {
    if (!jsonFile) return;
    setJsonImporting(true);
    setJsonError(null);
    setJsonResult(null);

    const formData = new FormData();
    formData.append('json_file', jsonFile);
    Object.entries(jsonOptions).forEach(([k, v]) => {
      if (v !== '' && v !== false && v !== null && v !== undefined) {
        formData.append(k, typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v));
      }
    });

    try {
      const res = await apiClient.post('/api/integral/doc-import/json-import/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJsonResult(res.data);
    } catch (err) {
      setJsonError(err.response?.data?.error || 'Импортлоход алдаа гарлаа.');
    } finally {
      setJsonImporting(false);
    }
  };

  return (
    <Row className="g-4">
      <Col lg={4}>
        <Card className="border-0 shadow-sm sticky-top" style={{ top: 80 }}>
          <Card.Body>
            <h6 className="fw-bold mb-3">JSON файл сонгох</h6>

            {/* JSON file drop area */}
            <div
              className="rounded p-4 text-center mb-3 border"
              style={{ borderStyle: 'dashed', cursor: 'pointer', borderWidth: 2 }}
              onClick={() => jsonFileInputRef.current?.click()}
            >
              <div className="fs-2">📋</div>
              {jsonFile ? (
                <>
                  <div className="fw-semibold text-success small text-truncate">{jsonFile.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{formatBytes(jsonFile.size)}</div>
                </>
              ) : (
                <>
                  <p className="mb-1 fw-semibold small">JSON файл сонгох</p>
                  <small className="text-muted">import_problems форматыг дэмжинэ</small>
                </>
              )}
            </div>
            <input
              ref={jsonFileInputRef}
              type="file"
              accept={ACCEPTED_JSON}
              className="d-none"
              onChange={handleJsonFileSelect}
            />

            {/* Options */}
            <div className="mb-3">
              <h6 className="fw-semibold small text-muted mb-2">ТОХИРГОО</h6>

              {JSON_OPTION_CHECKBOXES.map(([key, label]) => (
                <Form.Check
                  key={key}
                  type="checkbox"
                  id={`json-opt-${key}`}
                  label={label}
                  checked={!!jsonOptions[key]}
                  onChange={(e) => handleJsonOptionChange(key, e.target.checked)}
                  className="mb-2 small"
                />
              ))}

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold text-muted mb-1">
                  Quiz ID-д нэмэх (заавал биш)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="Quiz ID..."
                  value={jsonOptions.add_to_quiz}
                  onChange={(e) => handleJsonOptionChange('add_to_quiz', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold text-muted mb-1">
                  Нэмэлт түлхүүр үг (заавал биш, таслалаар)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="БҮТ1000, файл 1..."
                  value={jsonOptions.keyword}
                  onChange={(e) => handleJsonOptionChange('keyword', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold text-muted mb-1">
                  Default зохиогч (username, заавал биш)
                </Form.Label>
                <Form.Control
                  size="sm"
                  type="text"
                  placeholder="username..."
                  value={jsonOptions.default_author}
                  onChange={(e) => handleJsonOptionChange('default_author', e.target.value)}
                />
              </Form.Group>
            </div>

            {jsonOptions.dry_run && (
              <Alert variant="warning" className="py-2 small mb-3">
                Туршилтын горим — өөрчлөлт хадгалагдахгүй.
              </Alert>
            )}

            <Button
              variant={jsonOptions.dry_run ? 'warning' : 'success'}
              className="w-100"
              onClick={handleJsonImport}
              disabled={!jsonFile || jsonImporting}
            >
              {jsonImporting ? (
                <><Spinner as="span" size="sm" className="me-2" />Импортлож байна...</>
              ) : jsonOptions.dry_run ? (
                '🔍 Туршилтаар шалгах'
              ) : (
                '📥 JSON-аас импортлох'
              )}
            </Button>

            {jsonError && (
              <Alert variant="danger" className="mt-3 mb-0 small" dismissible onClose={() => setJsonError(null)}>
                {jsonError}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={8}>
        {!jsonResult && !jsonImporting && (
          <div className="text-center py-5 text-muted">
            <div className="fs-1 mb-3">📋</div>
            <h5>JSON файл сонгоод импортлоно уу</h5>
            <p className="small">
              <code>python manage.py import_problems</code> командын JSON форматыг дэмжинэ.<br />
              Массив <code>[...]</code> эсвэл <code>{`{"problems": [...], "quiz": {...}}`}</code> хэлбэр.
            </p>
          </div>
        )}

        {jsonImporting && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: 48, height: 48 }} />
            <p className="mt-3 fw-semibold">Импортлож байна...</p>
          </div>
        )}

        {jsonResult && (
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white fw-bold">
              {jsonResult.dry_run ? '🔍 Туршилтын үр дүн' : '✅ Импортын үр дүн'}
            </Card.Header>
            <Card.Body>
              <Row className="g-3 mb-3">
                {[
                  ['Нийт', jsonResult.total, 'secondary'],
                  ['Үүсгэв', jsonResult.created, 'success'],
                  ['Шинэчлэв', jsonResult.updated, 'primary'],
                  ['Алгасав', jsonResult.skipped, 'warning'],
                  ['Алдаа', jsonResult.errors?.length || 0, 'danger'],
                ].map(([label, val, color]) => (
                  <Col xs={6} sm={4} key={label}>
                    <div className={`text-center rounded p-2 bg-${color} bg-opacity-10 border border-${color} border-opacity-25`}>
                      <div className={`fs-4 fw-bold text-${color}`}>{val}</div>
                      <div className="small text-muted">{label}</div>
                    </div>
                  </Col>
                ))}
              </Row>

              {jsonResult.quiz && (
                <Alert variant="info" className="py-2 small">
                  {jsonResult.quiz.created ? '🆕 Шинэ quiz үүсгэв:' : '📚 Quiz-д нэмэв:'}{' '}
                  <strong>{jsonResult.quiz.title}</strong>{' '}
                  <span className="text-muted">(ID: {jsonResult.quiz.id})</span>
                </Alert>
              )}

              {jsonResult.errors?.length > 0 && (
                <Alert variant="danger" className="py-2 small mb-3">
                  <strong>Алдаанууд:</strong>
                  <ul className="mb-0 mt-1">
                    {jsonResult.errors.map((e, i) => (
                      <li key={i}>[{e.index}] {e.title} — {e.error}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {jsonResult.log?.length > 0 && (
                <div>
                  <div className="small fw-semibold text-muted mb-1">Дэлгэрэнгүй лог:</div>
                  <div
                    className="border rounded p-2 bg-light"
                    style={{ maxHeight: 300, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem' }}
                  >
                    {jsonResult.log.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}
