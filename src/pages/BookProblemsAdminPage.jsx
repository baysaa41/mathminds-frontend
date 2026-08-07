// frontend/src/pages/BookProblemsAdminPage.jsx
// Admin: ЭЕШ бэлтгэлийн 5 номын (book1/book2/book3/geometry/probstat) жишээ болон
// AI-аар үүсгэсэн дасгал бодлогуудыг харах, /problem/:uuid/edit хуудсаар засах.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import {
  Container, Card, Spinner, Form, Row, Col, Badge, Pagination, InputGroup, Button, Modal, Alert, Dropdown,
} from 'react-bootstrap';
import { Search, X, Pencil, ArrowLeft, Sparkles, Wand2, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { mathJaxConfig } from '../mathjax.config.js';
import { API_ENDPOINTS } from '../constants/api.js';

const TRADITIONAL_TYPE = 0;
const VERIFIED_FILTER_STORAGE_KEY = 'eesh_book_verified_filter';

const EXERCISE_REGEN_STYLES = [
  { key: 'match_example', label: 'Жишээтэй адилхан' },
  { key: 'concise', label: 'Товч' },
  { key: 'standard', label: 'Стандарт' },
  { key: 'step_by_step', label: 'Алхамчилсан' },
];

const EXAMPLE_REGEN_STYLES = [
  { key: 'concise', label: 'Товч' },
  { key: 'standard', label: 'Стандарт' },
  { key: 'detailed', label: 'Дэлгэрэнгүй' },
];

const PAGE_SIZE = 20;

const BOOKS = [
  { key: 'book1', label: 'Ном 1', hint: 'Сэргээн санах / Ойлгох' },
  { key: 'book2', label: 'Ном 2', hint: 'Хэрэглэх' },
  { key: 'book3', label: 'Ном 3', hint: 'Хэрэглэхээс дээш түвшин' },
  { key: 'geometry', label: 'Геометр', hint: 'Бүх түвшин' },
  { key: 'probstat', label: 'Магадлал статистик', hint: 'Бүх түвшин' },
];

function ChoicesInline({ choices }) {
  if (!choices || choices.length === 0) return null;
  return (
    <div
      className="d-flex flex-nowrap align-items-center gap-3 mt-1 mb-1"
      style={{ fontSize: 13, overflowX: 'auto' }}
    >
      {choices.map((c) => (
        <span
          key={c.label}
          className="d-inline-flex align-items-center gap-1 flex-shrink-0"
        >
          <strong>{c.label})</strong>
          <LivePreview content={c.value} />
        </span>
      ))}
    </div>
  );
}

function ConvertToMCInPlaceModal({ show, onHide, onConfirm, title, id }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <Wand2 size={20} className="me-2 text-warning" />
          Сонгох тест болгож хувиргах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          AI ашиглан <b>{title || `Бодлого #${id}`}</b> бодлогыг{' '}
          <b>яг үүн дээр нь</b> (клон үүсгэлгүйгээр) <b>5 сонгох хариулттай</b> болгож хувиргана.
        </p>
        <Alert variant="warning" className="py-2 mb-0">
          Клон хийхгүй — энэ бодлогын одоогийн бодолт, хариулт AI-аар үүсгэсэн шинэ
          хувилбараар дарагдана. Номын бодлого дахин компайлагдахад шинэ агуулга орно.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <X size={16} className="me-2" />
          Цуцлах
        </Button>
        <Button variant="warning" onClick={onConfirm}>
          <Wand2 size={16} className="me-2" />
          Хувиргах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function ConvertToMCButton({ item, onConverted }) {
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  if (item.type !== TRADITIONAL_TYPE) return null;

  const handleConfirm = async () => {
    setShowModal(false);
    setConverting(true);
    setError(null);
    try {
      const res = await apiClient.post(
        `${API_ENDPOINTS.INTEGRAL.PROBLEMS}${item.uuid}/convert-to-mc-in-place/`
      );
      setDone(true);
      onConverted(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Сонгох тест болгоход алдаа гарлаа.');
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline-secondary"
        className="d-inline-flex align-items-center gap-1 py-0 px-2 flex-shrink-0"
        onClick={() => setShowModal(true)}
        disabled={converting}
        title="AI ашиглан энэ бодлогыг яг үүн дээр нь (клонгүйгээр) сонгох тест болгож хувиргах"
      >
        {converting ? <Spinner size="sm" animation="border" /> : <Wand2 size={13} />}
        Сонгох тест болгох
      </Button>
      {error && <span className="text-danger small ms-1">{error}</span>}
      {done && !error && <span className="text-success small ms-1">Хувирлаа</span>}
      <ConvertToMCInPlaceModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title={item.title}
        id={item.id}
      />
    </>
  );
}

function RegenerateSolutionDropdown({ item, styles, onRegenerated, label = 'Бодолт дахин үүсгэх' }) {
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState(null);
  const [regenStyleLabel, setRegenStyleLabel] = useState(null);

  const handleRegenerate = async (styleKey, styleLabel) => {
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await apiClient.post(
        `${API_ENDPOINTS.INTEGRAL.PROBLEMS}${item.uuid}/regenerate-eesh-solution/`,
        { style: styleKey }
      );
      onRegenerated({
        hint: res.data.hint,
        solution: res.data.solution,
        solution_uuid: res.data.solution_uuid,
        linked_formulas: res.data.linked_formulas,
      });
      setRegenStyleLabel(styleLabel);
    } catch (err) {
      setRegenError(err.response?.data?.error || 'Бодолт үүсгэхэд алдаа гарлаа.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-warning"
          size="sm"
          disabled={regenerating}
          className="d-inline-flex align-items-center gap-1 py-0 px-2"
          title="Сонгосон хэв маягаар AI-аар бодолт дахин бичих"
        >
          {regenerating ? <Spinner size="sm" animation="border" /> : <Sparkles size={12} />}
          {label}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {styles.map((s) => (
            <Dropdown.Item key={s.key} onClick={() => handleRegenerate(s.key, s.label)}>
              {s.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      {regenError && <span className="text-danger small">{regenError}</span>}
      {regenStyleLabel && !regenError && (
        <span className="text-success small">Шинэчлэгдлээ ({regenStyleLabel})</span>
      )}
    </div>
  );
}

function VerifyToggle({ uuid, verified, onToggled, cascadeLabel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.post(
        `${API_ENDPOINTS.INTEGRAL.PROBLEMS}${uuid}/set-verified/`,
        { verified: !verified, cascade: true }
      );
      onToggled(res.data);
    } catch {
      setError('Алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="d-inline-flex align-items-center gap-1">
      <Button
        size="sm"
        variant={verified ? 'success' : 'outline-secondary'}
        className="d-inline-flex align-items-center gap-1 py-0 px-2"
        onClick={handleToggle}
        disabled={busy}
        title={
          verified
            ? 'Дахин дарж баталгаажуулалтыг цуцлах'
            : `Баталгаажуулах${cascadeLabel ? ` (${cascadeLabel})` : ''}`
        }
      >
        {busy ? (
          <Spinner size="sm" animation="border" />
        ) : verified ? (
          <CheckCircle2 size={13} />
        ) : (
          <Circle size={13} />
        )}
        {verified ? 'Баталгаажсан' : 'Баталгаажуулах'}
      </Button>
      {error && <span className="text-danger small">{error}</span>}
    </div>
  );
}

function ReloadButton({ uuid, onReloaded }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleReload = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}${uuid}/eesh-book-detail/`);
      onReloaded(res.data);
    } catch {
      setError('Алдаа гарлаа.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="d-inline-flex align-items-center gap-1">
      <Button
        size="sm"
        variant="outline-secondary"
        className="d-inline-flex align-items-center py-0 px-2 flex-shrink-0"
        onClick={handleReload}
        disabled={busy}
        title="Гараар засварласны дараа энэ картыг дахин ачаалах"
      >
        {busy ? <Spinner size="sm" animation="border" /> : <RefreshCw size={13} />}
      </Button>
      {error && <span className="text-danger small">{error}</span>}
    </div>
  );
}

function ExampleCard({ item, exampleNumber, verifiedOverrides, onVerifyChange }) {
  const [override, setOverride] = useState(null);
  const d = override ? { ...item, ...override } : item;
  const verified = verifiedOverrides[item.id] ?? item.is_verified;

  return (
    <div>
      {/* Номын цэнхэр гарчгийн зурвасын хэв маягтай толгой */}
      <div
        className="d-flex justify-content-between align-items-center px-2 py-1 mb-2"
        style={{ background: '#0d3b8c', color: '#fff', fontSize: 13 }}
      >
        <span className="fw-semibold">
          Жишээ бодлого {exampleNumber} <span className="text-white-50">#{item.id}</span>
        </span>
        <span>{d.stars}</span>
      </div>

      <div className="d-flex justify-content-between align-items-start gap-2 mb-1 px-1">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {d.category && (
            <span className="badge" style={{ backgroundColor: d.category.color || '#6c757d' }}>
              {d.category.name_mn || d.category.name}
            </span>
          )}
          <Badge bg="light" text="dark" className="border">
            {d.level_name || '—'}
          </Badge>
          <Badge bg="light" text="dark" className="border">
            {d.type_display}
          </Badge>
          {!d.is_public && <Badge bg="secondary">Хувийн</Badge>}
          <VerifyToggle
            uuid={item.uuid}
            verified={verified}
            cascadeLabel="жишээ + дасгалууд"
            onToggled={onVerifyChange}
          />
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <ConvertToMCButton item={d} onConverted={(data) => setOverride(data)} />
          <a
            href={`/problem/${item.uuid}/edit`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-primary py-0 px-2 flex-shrink-0"
            title="Шинэ таб дээр засах"
          >
            <Pencil size={13} />
          </a>
          <ReloadButton uuid={item.uuid} onReloaded={setOverride} />
        </div>
      </div>

      <div className="px-1" style={{ fontSize: 13, overflowWrap: 'break-word' }}>
        {d.title && <div className="fw-semibold mb-1">{d.title}</div>}
        <LivePreview content={d.statement} />
        <ChoicesInline choices={d.choices} />
      </div>

      <div className="px-1 mt-2">
        <RegenerateSolutionDropdown
          item={item}
          styles={EXAMPLE_REGEN_STYLES}
          onRegenerated={(data) => setOverride((o) => ({ ...o, ...data }))}
        />
      </div>

      {d.hint && (
        <div className="mx-1 mt-2 p-2" style={{ background: '#fff3e6', borderLeft: '3px solid #cc7a00', fontSize: 13 }}>
          <div className="fw-bold mb-1" style={{ color: '#cc7a00' }}>CHART — Гол санаа</div>
          <LivePreview content={d.hint} />
        </div>
      )}

      {d.solution && (
        <div className="mx-1 mt-2 p-2" style={{ background: '#eefaf0', borderLeft: '3px solid #2e8b40', fontSize: 13 }}>
          <div className="fw-bold mb-1" style={{ color: '#2e8b40' }}>Бодолт</div>
          <LivePreview content={d.solution} />
          {d.solution_uuid && (
            <a
              href={`/solution/${d.solution_uuid}/edit`}
              target="_blank"
              rel="noreferrer"
              className="small d-inline-flex align-items-center gap-1 mt-1"
            >
              <Pencil size={11} /> Бодолтыг засах
            </a>
          )}
          {d.linked_formulas?.length > 0 && (
            <div className="mt-2 pt-2 border-top">
              <span className="text-muted">Холбогдсон томьёо: </span>
              {d.linked_formulas.map((f, i) => (
                <span key={f.id}>
                  {i > 0 && ', '}
                  <a href={`/formula/${f.uuid}`} target="_blank" rel="noreferrer">{f.title}</a>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ item, exerciseNumber, verifiedOverrides, onVerifyChange }) {
  const [override, setOverride] = useState(null);
  const d = override ? { ...item, ...override } : item;
  const verified = verifiedOverrides[item.id] ?? item.is_verified;

  return (
    <div className="ps-3 mt-2 border-start border-2 border-warning-subtle" style={{ fontSize: 13 }}>
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span>
          <strong>Дасгал {exerciseNumber}.</strong>{' '}
          <span className="small text-muted">#{item.id}</span>{' '}
          <VerifyToggle uuid={item.uuid} verified={verified} onToggled={onVerifyChange} />
        </span>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <ConvertToMCButton item={d} onConverted={(data) => setOverride((o) => ({ ...o, ...data }))} />
          <a
            href={`/problem/${item.uuid}/edit`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm btn-outline-primary py-0 px-2 flex-shrink-0"
            title="Шинэ таб дээр засах"
          >
            <Pencil size={13} />
          </a>
          <ReloadButton uuid={item.uuid} onReloaded={setOverride} />
        </div>
      </div>
      <LivePreview content={d.statement} />
      <ChoicesInline choices={d.choices} />
      {d.answer && (
        <div className="mt-1"><em>Хариулт:</em> <LivePreview content={d.answer} /></div>
      )}

      <div className="mt-2">
        <RegenerateSolutionDropdown
          item={item}
          styles={EXERCISE_REGEN_STYLES}
          onRegenerated={(data) => setOverride((o) => ({ ...o, ...data }))}
        />
      </div>

      {d.solution && (
        <div className="mt-2 p-2" style={{ background: '#eefaf0', borderLeft: '3px solid #2e8b40' }}>
          <div className="fw-bold mb-1" style={{ color: '#2e8b40' }}>Бодолт</div>
          <LivePreview content={d.solution} />
          {d.solution_uuid && (
            <a
              href={`/solution/${d.solution_uuid}/edit`}
              target="_blank"
              rel="noreferrer"
              className="small d-inline-flex align-items-center gap-1 mt-1"
            >
              <Pencil size={11} /> Бодолтыг засах
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookProblemsAdminPage() {
  const [bookKey, setBookKey] = useState('book1');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(
    () => localStorage.getItem(VERIFIED_FILTER_STORAGE_KEY) || 'all'
  );
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [unverifiedCount, setUnverifiedCount] = useState(0);
  const [verifiedOverrides, setVerifiedOverrides] = useState({});

  const handleVerifyChange = (data) => {
    const changedIds = new Set([data.id, ...(data.cascaded_ids || [])]);

    setVerifiedOverrides((prev) => {
      const next = { ...prev, [data.id]: data.is_verified };
      for (const cid of data.cascaded_ids || []) next[cid] = data.is_verified;
      return next;
    });
    const delta = (data.cascaded_ids?.length || 0) + 1;
    setVerifiedCount((c) => (data.is_verified ? c + delta : Math.max(0, c - delta)));
    setUnverifiedCount((c) => (data.is_verified ? Math.max(0, c - delta) : c + delta));

    // Идэвхтэй шүүлтүүр "Бүгд" биш үед, шинэ баталгаажуулалтын төлөв шүүлтүүрт
    // тохирохгүй бол мөрийг (жишээ + касказ хийсэн дасгалуудыг, эсвэл ганц дасгалыг) жагсаалтаас нуана.
    if (verifiedFilter === 'all') return;
    const matchesFilter = (verifiedFilter === 'true') === data.is_verified;
    if (matchesFilter) return;

    setItems((prevItems) => {
      let removedExamples = 0;
      const next = prevItems
        .map((item) => {
          if (changedIds.has(item.id)) {
            removedExamples += 1;
            return null;
          }
          if (item.variants?.some((v) => changedIds.has(v.id))) {
            return { ...item, variants: item.variants.filter((v) => !changedIds.has(v.id)) };
          }
          return item;
        })
        .filter(Boolean);
      if (removedExamples) setTotalCount((c) => Math.max(0, c - removedExamples));
      return next;
    });
  };

  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.INTEGRAL.MATH_CATEGORIES, { params: { has_problems: true } })
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const loadResults = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { book: bookKey, page, page_size: PAGE_SIZE };
        if (categoryId) params.category = categoryId;
        if (search) params.search = search;
        if (verifiedFilter !== 'all') params.verified = verifiedFilter;

        const res = await apiClient.get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}eesh-book-problems/`, { params });
        setItems(res.data.results || []);
        setTotalCount(res.data.count || 0);
        setVerifiedCount(res.data.verified_count || 0);
        setUnverifiedCount(res.data.unverified_count || 0);
        setCurrentPage(page);
      } catch {
        setError('Мэдээлэл татахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    },
    [bookKey, categoryId, search, verifiedFilter]
  );

  useEffect(() => {
    loadResults(1);
  }, [loadResults]);

  const handleVerifiedFilterChange = (key) => {
    setVerifiedFilter(key);
    localStorage.setItem(VERIFIED_FILTER_STORAGE_KEY, key);
  };

  const handleSearchInput = (val) => {
    setInputVal(val);
    clearTimeout(handleSearchInput._t);
    handleSearchInput._t = setTimeout(() => setSearch(val.trim()), 500);
  };

  const clearSearch = () => {
    setInputVal('');
    setSearch('');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (currentPage >= totalPages - 3) {
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Container fluid className="py-4" style={{ maxWidth: 1100 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Link to="/admin" className="btn btn-sm btn-outline-secondary">
              <ArrowLeft size={15} className="me-1" />
              Буцах
            </Link>
            <h4 className="fw-bold mb-0">ЭЕШ бэлтгэлийн номын бодлого засах</h4>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="secondary">{totalCount.toLocaleString()} жишээ бодлого</Badge>
            <Badge bg="success">{verifiedCount.toLocaleString()} баталгаажсан</Badge>
            <Badge bg="light" text="dark" className="border">
              {unverifiedCount.toLocaleString()} баталгаажаагүй
            </Badge>
          </div>
        </div>

        {/* Ном сонгох */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {BOOKS.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={bookKey === b.key ? 'primary' : 'outline-secondary'}
              onClick={() => setBookKey(b.key)}
            >
              {b.label}
              <span className="d-none d-md-inline"> — {b.hint}</span>
            </Button>
          ))}
        </div>

        {/* Шүүлтүүр */}
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body className="py-3 px-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} md={6}>
                <Form.Label className="small text-muted mb-1">Хайх</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <Search size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Гарчиг, өгүүлбэрээр хайх..."
                    value={inputVal}
                    onChange={(e) => handleSearchInput(e.target.value)}
                  />
                  {inputVal && (
                    <InputGroup.Text style={{ cursor: 'pointer' }} onClick={clearSearch}>
                      <X size={14} />
                    </InputGroup.Text>
                  )}
                </InputGroup>
              </Col>
              <Col xs={12} md={6}>
                <Form.Label className="small text-muted mb-1">Сэдэв (ангилал)</Form.Label>
                <Form.Select size="sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">— Бүгд —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_mn || c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12}>
                <Form.Label className="small text-muted mb-1">Баталгаажуулалт</Form.Label>
                <div className="d-flex gap-2">
                  {[
                    { key: 'all', label: 'Бүгд' },
                    { key: 'true', label: 'Баталгаажсан' },
                    { key: 'false', label: 'Баталгаажаагүй' },
                  ].map((f) => (
                    <Button
                      key={f.key}
                      size="sm"
                      variant={verifiedFilter === f.key ? 'primary' : 'outline-secondary'}
                      onClick={() => handleVerifiedFilterChange(f.key)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Жагсаалт */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {error && <div className="p-3 text-danger small">{error}</div>}

            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5 gap-2">
                <Spinner animation="border" size="sm" />
                <span className="text-muted">Уншиж байна...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-5 text-muted">Шүүлтэд тохирох бодлого олдсонгүй.</div>
            ) : (
              <div className="d-flex flex-column">
                {items.map((item, idx) => (
                  <div
                    key={item.uuid}
                    className={`p-3 ${idx > 0 ? 'border-top' : ''}`}
                  >
                    <ExampleCard
                      item={item}
                      exampleNumber={(currentPage - 1) * PAGE_SIZE + idx + 1}
                      verifiedOverrides={verifiedOverrides}
                      onVerifyChange={handleVerifyChange}
                    />
                    {item.variants && item.variants.length > 0 && (
                      <div className="d-flex flex-column">
                        {item.variants.map((v, vIdx) => (
                          <ExerciseRow
                            key={v.uuid}
                            item={v}
                            exerciseNumber={(item.exercise_start || 1) + vIdx}
                            verifiedOverrides={verifiedOverrides}
                            onVerifyChange={handleVerifyChange}
                          />
                        ))}
                      </div>
                    )}
                    {(!item.variants || item.variants.length < 2) && (
                      <div className="ps-3 small text-muted mt-1">
                        ({item.variants ? item.variants.length : 0}/2 дасгал бодлого)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>

          {totalPages > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3 bg-light flex-wrap gap-2">
              <span className="small text-muted">
                Нийт {totalCount.toLocaleString()} жишээ бодлогоос {(currentPage - 1) * PAGE_SIZE + 1}
                –{Math.min(currentPage * PAGE_SIZE, totalCount)}
              </span>
              <Pagination size="sm" className="mb-0">
                <Pagination.Prev disabled={currentPage === 1} onClick={() => loadResults(currentPage - 1)} />
                {pageNumbers().map((p, i) =>
                  p === '…' ? (
                    <Pagination.Ellipsis key={`e${i}`} disabled />
                  ) : (
                    <Pagination.Item key={p} active={p === currentPage} onClick={() => loadResults(p)}>
                      {p}
                    </Pagination.Item>
                  )
                )}
                <Pagination.Next disabled={currentPage === totalPages} onClick={() => loadResults(currentPage + 1)} />
              </Pagination>
            </Card.Footer>
          )}
        </Card>
      </Container>
    </MathJaxContext>
  );
}
