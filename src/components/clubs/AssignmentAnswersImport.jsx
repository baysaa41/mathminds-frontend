// AssignmentAnswersImport.jsx
// Даалгаврын хариулт Excel-ээр татах/оруулах компонент
import React, { useState, useEffect, useRef } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import { Download, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

const AssignmentAnswersImport = ({ assignmentId, clubId }) => {
  const [subgroups, setSubgroups] = useState([]);
  const [selectedSubgroup, setSelectedSubgroup] = useState('');
  const [importing, setImporting] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  // Дэд бүлгүүдийг ачаалах
  useEffect(() => {
    if (!clubId) return;
    apiClient.get('/api/club-subgroups/', { params: { club: clubId } })
      .then(r => setSubgroups(r.data.results || r.data || []))
      .catch(() => {});
  }, [clubId]);

  // Excel загвар татах
  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedSubgroup) params.append('subgroup_id', selectedSubgroup);
    const url = `${apiClient.defaults.baseURL}/api/club-assignments/${assignmentId}/export_answers_excel/?${params.toString()}`;
    // JWT token авна
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    // fetch-ээр татна (token шаардлагатай учир)
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Татахад алдаа гарлаа');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `assignment_${assignmentId}_answers.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => setImportError(err.message));
  };

  // File сонгох
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
    setImportResult(null);
    setImportError('');
  };

  // Import илгээх
  const handleImport = async () => {
    if (!selectedFile) {
      setImportError('Файл сонгоно уу.');
      return;
    }
    setImporting(true);
    setImportResult(null);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dry_run', dryRun ? 'true' : 'false');
      if (selectedSubgroup) formData.append('subgroup_id', selectedSubgroup);

      const res = await apiClient.post(
        `/api/club-assignments/${assignmentId}/import_answers_excel/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setImportResult(res.data);
    } catch (err) {
      setImportError(err.response?.data?.detail || 'Алдаа гарлаа. Файлаа шалгана уу.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mt-3">
      {/* ── Export хэсэг ── */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom py-2">
          <div className="d-flex align-items-center gap-2">
            <Download size={16} className="text-primary" />
            <span className="fw-semibold small">Excel загвар татах</span>
          </div>
        </Card.Header>
        <Card.Body className="py-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Form.Select
              size="sm"
              style={{ maxWidth: 180 }}
              value={selectedSubgroup}
              onChange={e => setSelectedSubgroup(e.target.value)}
            >
              <option value="">Бүгд</option>
              {subgroups.map(sg => (
                <option key={sg.id} value={sg.id}>{sg.name}</option>
              ))}
            </Form.Select>
            <Button variant="outline-primary" size="sm" onClick={handleExport}>
              <Download size={14} className="me-1" />Татах
            </Button>
            <span className="text-muted small">
              Загварыг татаж, хариулт бөглөөд дараа нь оруулна уу.
            </span>
          </div>
        </Card.Body>
      </Card>

      {/* ── Import хэсэг ── */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom py-2">
          <div className="d-flex align-items-center gap-2">
            <Upload size={16} className="text-success" />
            <span className="fw-semibold small">Хариулт оруулах</span>
          </div>
        </Card.Header>
        <Card.Body className="py-3">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
            <div>
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
                Файл сонгох
              </Button>
              {selectedFile && (
                <span className="ms-2 small text-muted">{selectedFile.name}</span>
              )}
            </div>
            <Form.Check
              type="checkbox"
              id="dry-run-check"
              label={<span className="small">Dry run (зөвхөн шалгах)</span>}
              checked={dryRun}
              onChange={e => setDryRun(e.target.checked)}
            />
            <Button
              variant="success"
              size="sm"
              onClick={handleImport}
              disabled={importing || !selectedFile}
            >
              {importing
                ? <Spinner animation="border" size="sm" />
                : <><Upload size={14} className="me-1" />Оруулах</>}
            </Button>
          </div>

          {importError && (
            <Alert variant="danger" className="small py-2 mb-2">
              <AlertTriangle size={14} className="me-1" />{importError}
            </Alert>
          )}

          {importResult && (
            <>
              <Alert
                variant={importResult.dry_run ? 'warning' : 'success'}
                className="small py-2 mb-2"
              >
                <CheckCircle size={14} className="me-1" />
                {importResult.dry_run ? 'Dry run — DB-д өөрчлөлт хийгдсэнгүй. ' : ''}
                <strong>{importResult.imported}</strong> оруулсан,{' '}
                <strong>{importResult.skipped}</strong> алгасав.
              </Alert>

              {importResult.errors?.length > 0 && (
                <div className="mb-2">
                  <div className="small fw-semibold text-danger mb-1">Алдааны жагсаалт:</div>
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="small text-danger">
                      Мөр {e.row}: {e.username} — {e.reason}
                    </div>
                  ))}
                </div>
              )}

              {importResult.results?.length > 0 && (
                <Table responsive hover size="sm" className="mb-0 small">
                  <thead>
                    <tr>
                      <th>Нэр</th>
                      <th className="text-center">Оноо</th>
                      <th className="text-center">Нийт</th>
                      <th className="text-center">Төлөв</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.results.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name || r.username}</td>
                        <td className="text-center">
                          {r.score != null ? r.score : '—'}
                        </td>
                        <td className="text-center">
                          {r.max_score != null ? r.max_score : '—'}
                        </td>
                        <td className="text-center">
                          {r.status === 'imported'
                            ? <Badge bg="success"><CheckCircle size={10} className="me-1" />оруулсан</Badge>
                            : <Badge bg="danger"><AlertTriangle size={10} className="me-1" />алдаа</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AssignmentAnswersImport;
