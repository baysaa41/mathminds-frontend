// frontend/src/pages/QualityAuditReviewPage.jsx
// Admin: `audit_eesh_quality`-ийн гаргасан чанарын аудитын тайлангаас хамгийн муу
// оноотой бүлгийг дараалан (муу -> сайн) харуулж, бодлого/бодолт засах линкийг
// шууд өгнө (жинхэнэ засвар одоо байгаа /problem/:uuid/edit болон
// /solution/:uuid/edit хуудсан дээр хийгдэнэ).

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Card, Spinner, Form, Row, Col, Badge, Button, Alert, Table,
} from 'react-bootstrap';
import { ArrowLeft, ChevronRight, SkipForward, Pencil, CheckCircle2, Circle } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { API_ENDPOINTS } from '../constants/api.js';

const CRITERIA = [
  { key: 'correctness', label: 'Зөв эсэх' },
  { key: 'solution', label: 'Бодолт' },
  { key: 'clarity', label: 'Ойлгомж' },
  { key: 'mongolian', label: 'Монгол хэл' },
];

const BOOKS = [
  { key: '', label: 'Бүх ном' },
  { key: 'book1', label: 'Ном 1' },
  { key: 'book2', label: 'Ном 2' },
  { key: 'book3', label: 'Ном 3' },
  { key: 'geometry', label: 'Геометр' },
  { key: 'probstat', label: 'Магадлал статистик' },
];

function scoreBadgeVariant(score) {
  if (score == null) return 'light';
  if (score <= 1) return 'danger';
  if (score <= 2) return 'warning';
  return 'success';
}

function EvaluationPanel({ evaluations, index }) {
  const models = Object.keys(evaluations || {});
  if (models.length === 0) return null;
  return (
    <div className="mb-2">
      <Table size="sm" bordered className="mb-1" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>Модель</th>
            {CRITERIA.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const ev = evaluations[model] || {};
            const item = (ev.items || []).find((it) => it && it.index === index);
            if (ev.error) {
              return (
                <tr key={model}>
                  <td className="fw-semibold">{model}</td>
                  <td colSpan={4} className="text-danger">дуудлага амжилтгүй: {ev.error}</td>
                </tr>
              );
            }
            return (
              <tr key={model}>
                <td className="fw-semibold">{model}</td>
                {CRITERIA.map((c) => {
                  const score = item ? item[`${c.key}_score`] : null;
                  const comment = item ? item[`${c.key}_comment`] : null;
                  return (
                    <td key={c.key} title={comment || ''}>
                      <Badge bg={scoreBadgeVariant(score)}>{score ?? '—'}</Badge>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
      {models.map((model) => {
        const ev = evaluations[model] || {};
        const item = (ev.items || []).find((it) => it && it.index === index);
        if (!item) return null;
        return (
          <div key={model} className="small text-muted mb-1">
            <strong>{model}:</strong>{' '}
            {CRITERIA.map((c) => item[`${c.key}_comment`]).filter(Boolean).join(' | ')}
          </div>
        );
      })}
    </div>
  );
}

function VerifyToggle({ uuid, verified, onToggled }) {
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}${uuid}/set-verified/`, {
        verified: !verified, cascade: false,
      });
      onToggled(res.data.is_verified);
    } catch {
      // алдааг чимээгүй үл тоох — товч анхны төлөвдөө үлдэнэ
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      variant={verified ? 'success' : 'outline-secondary'}
      className="d-inline-flex align-items-center gap-1 py-0 px-2"
      onClick={handleToggle}
      disabled={busy}
    >
      {busy ? <Spinner size="sm" animation="border" /> : verified ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {verified ? 'Баталгаажсан' : 'Баталгаажуулах'}
    </Button>
  );
}

function ItemCard({ item }) {
  const { problem } = item;
  const [verified, setVerified] = useState(problem.is_verified);

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span>
          <strong>{item.role}</strong>{' '}
          <span className="text-muted small">#{problem.id}</span>
        </span>
        <div className="d-flex align-items-center gap-2">
          <a
            href={`/problem/${problem.uuid}/edit`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
          >
            <Pencil size={13} />
            Бодлого засах
          </a>
          {problem.solution ? (
            <a
              href={`/solution/${problem.solution.uuid}/edit`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
            >
              <Pencil size={13} />
              Бодолт засах
            </a>
          ) : (
            <a
              href={`/problem/${problem.uuid}/solution/new`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
            >
              <Pencil size={13} />
              Бодолт нэмэх
            </a>
          )}
          <VerifyToggle uuid={problem.uuid} verified={verified} onToggled={setVerified} />
        </div>
      </Card.Header>
      <Card.Body style={{ fontSize: 13 }}>
        <EvaluationPanel evaluations={item.groupEvaluations} index={item.index} />
        {problem.title && <div className="fw-semibold mb-1">{problem.title}</div>}
        <LivePreview content={problem.statement} />
      </Card.Body>
    </Card>
  );
}

function GroupReviewCard({ group, onNext }) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">
          Бүлэг #{group.template_id}{' '}
          <Badge bg={scoreBadgeVariant(group.min_score)}>min={group.min_score}</Badge>{' '}
          <span className="text-muted small">({group.book})</span>
        </h5>
        <Button variant="outline-secondary" size="sm" onClick={onNext}>
          <SkipForward size={14} className="me-1" />
          Дараах бүлэг
        </Button>
      </div>
      {group.items.map((item) => (
        <ItemCard key={item.problem.id} item={{ ...item, groupEvaluations: group.evaluations }} />
      ))}
    </div>
  );
}

export default function QualityAuditReviewPage() {
  const [reports, setReports] = useState([]);
  const [filename, setFilename] = useState('');
  const [bookFilter, setBookFilter] = useState('');
  const [hideVerified, setHideVerified] = useState(true);

  const [groups, setGroups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get(API_ENDPOINTS.INTEGRAL.QUALITY_AUDIT_REPORTS)
      .then((res) => {
        setReports(res.data || []);
        if (res.data && res.data.length > 0) setFilename(res.data[0].filename);
      })
      .catch(() => setError('Тайлангийн жагсаалт татахад алдаа гарлаа.'));
  }, []);

  const loadGroups = useCallback(() => {
    if (!filename) return;
    setLoading(true);
    setError(null);
    const params = { hide_verified: hideVerified };
    if (bookFilter) params.book = bookFilter;
    apiClient.get(API_ENDPOINTS.INTEGRAL.QUALITY_AUDIT_GROUPS(filename), { params })
      .then((res) => {
        setGroups(res.data.groups || []);
        setCurrentIndex(0);
      })
      .catch(() => setError('Бүлгүүд татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [filename, bookFilter, hideVerified]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const currentGroup = groups[currentIndex];

  return (
      <Container fluid className="py-4" style={{ maxWidth: 1000 }}>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <ArrowLeft size={15} className="me-1" />
            Буцах
          </Link>
          <h4 className="fw-bold mb-0">Чанарын аудит — муугаас засах</h4>
        </div>

        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="py-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} md={5}>
                <Form.Label className="small text-muted mb-1">Тайлан</Form.Label>
                <Form.Select size="sm" value={filename} onChange={(e) => setFilename(e.target.value)}>
                  {reports.map((r) => (
                    <option key={r.filename} value={r.filename}>
                      {r.filename} ({r.groups_evaluated} бүлэг, {r.books_checked?.join(',')})
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={3}>
                <Form.Label className="small text-muted mb-1">Ном</Form.Label>
                <Form.Select size="sm" value={bookFilter} onChange={(e) => setBookFilter(e.target.value)}>
                  {BOOKS.map((b) => (
                    <option key={b.key} value={b.key}>{b.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={4} className="d-flex align-items-center">
                <Form.Check
                  type="switch"
                  id="hide-verified-switch"
                  label="Баталгаажсаныг нуух"
                  checked={hideVerified}
                  onChange={(e) => setHideVerified(e.target.checked)}
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5 gap-2">
            <Spinner animation="border" size="sm" />
            <span className="text-muted">Уншиж байна...</span>
          </div>
        ) : groups.length === 0 ? (
          <Alert variant="success">Шүүлтэд тохирох (баталгаажаагүй) бүлэг олдсонгүй — бүгд цэвэрхэн байна!</Alert>
        ) : !currentGroup ? (
          <Alert variant="success">
            Бүх бүлэг ({groups.length}) харагдлаа — дуусгалаа!
          </Alert>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2 mb-3 small text-muted">
              <ChevronRight size={14} />
              Бүлэг {currentIndex + 1} / {groups.length}
            </div>
            <GroupReviewCard
              key={currentGroup.template_id}
              group={currentGroup}
              onNext={() => setCurrentIndex((i) => i + 1)}
            />
          </>
        )}
      </Container>
  );
}
