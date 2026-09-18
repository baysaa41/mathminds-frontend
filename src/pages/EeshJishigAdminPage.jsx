// frontend/src/pages/EeshJishigAdminPage.jsx
// Admin: зөвхөн "ЭЕШ жишиг" keyword-той бодлогуудыг жагсаалт хэлбэрээр харах,
// төрөл/сэдэв/хүндрэлээр шүүх, олноор нь (bulk) сэдэв/хүндрэл/хичээл/нийтлэх төлөв солих.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Card, Table, Spinner, Form, Row, Col, Badge, Pagination, InputGroup, Button, Alert, Modal,
} from 'react-bootstrap';
import { Search, X, Pencil, ArrowLeft, SearchCheck } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { API_ENDPOINTS } from '../constants/api.js';

const EESH_KEYWORD = 'ЭЕШ жишиг';
const PAGE_SIZE = 50;

const SUBJECTS = [
  { value: '', label: 'Бүгд' },
  { value: 'math', label: 'Математик' },
  { value: 'physics', label: 'Физик' },
  { value: 'chemistry', label: 'Хими' },
  { value: 'biology', label: 'Биологи' },
];

const PROBLEM_TYPES = [
  { value: '0', label: 'Уламжлалт' },
  { value: '1', label: 'Сонгох тест' },
  { value: '4', label: 'Нөхөх тест' },
];

const PROBLEM_LEVELS = [
  { value: '1', label: 'Сэргээн санах' },
  { value: '2', label: 'Ойлгох' },
  { value: '3', label: 'Хэрэглэх' },
  { value: '4', label: 'Задлан шинжлэх' },
  { value: '5', label: 'Үнэлэх' },
  { value: '6', label: 'Бүтээх' },
];

export default function EeshJishigAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Шүүлтүүр
  const [subject, setSubject] = useState('');
  const [types, setTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [sourceQuiz, setSourceQuiz] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);

  const [categories, setCategories] = useState([]);
  const [sourceQuizzes, setSourceQuizzes] = useState([]);

  // Сонголт (bulk)
  const [selected, setSelected] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkLevel, setBulkLevel] = useState('');
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkPublic, setBulkPublic] = useState('');
  const [applying, setApplying] = useState(false);
  const [bulkMsg, setBulkMsg] = useState(null);

  // Төстэй бодлого хайх
  const [similarTarget, setSimilarTarget] = useState(null);
  const [similarResults, setSimilarResults] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState(null);

  useEffect(() => {
    apiClient
      .get(API_ENDPOINTS.INTEGRAL.MATH_CATEGORIES, { params: { has_problems: true } })
      .then((res) => setCategories(res.data))
      .catch(() => {});
    apiClient
      .get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}source-quizzes/`)
      .then((res) => setSourceQuizzes(res.data))
      .catch(() => {});
  }, []);

  const loadResults = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = { keyword: EESH_KEYWORD, page, page_size: PAGE_SIZE, ordering: 'id' };
        if (subject) params.subject = subject;
        if (types.length > 0) params.type = types.join(',');
        if (levels.length > 0) params.level = levels.join(',');
        if (categoryId) params.category = categoryId;
        if (sourceQuiz) params.source_quiz = sourceQuiz;
        if (search) params.search = search;

        const res = await apiClient.get(API_ENDPOINTS.INTEGRAL.PROBLEMS, { params });
        setItems(res.data.results || []);
        setTotalCount(res.data.count || 0);
        setCurrentPage(page);
      } catch {
        setError('Мэдээлэл татахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    },
    [subject, types, levels, categoryId, sourceQuiz, search]
  );

  // Шүүлтүүр өөрчлөгдөх бүрт эхний хуудсыг ачаалж, сонголтыг цэвэрлэнэ
  useEffect(() => {
    setSelected(new Set());
    loadResults(1);
  }, [loadResults]);

  const handleSearchInput = (val) => {
    setInputVal(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 500);
  };

  const clearSearch = () => {
    setInputVal('');
    setSearch('');
  };

  const toggleType = (val) => {
    setTypes((prev) => (prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]));
  };

  const toggleLevel = (val) => {
    setLevels((prev) => (prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val]));
  };

  const toggleSelect = (uuid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (items.length > 0 && items.every((it) => prev.has(it.uuid))) return new Set();
      const next = new Set(prev);
      items.forEach((it) => next.add(it.uuid));
      return next;
    });
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

  const applyBulk = async () => {
    if (selected.size === 0) return;
    const payload = { ids: Array.from(selected) };
    if (bulkCategory) payload.category = Number(bulkCategory);
    if (bulkLevel) payload.level = Number(bulkLevel);
    if (bulkSubject) payload.subject = bulkSubject;
    if (bulkPublic) payload.is_public = bulkPublic === 'true';

    if (Object.keys(payload).length === 1) {
      setBulkMsg({ type: 'warning', text: 'Өөрчлөх утга сонгоно уу.' });
      return;
    }

    setApplying(true);
    setBulkMsg(null);
    try {
      const res = await apiClient.post(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}bulk-update/`, payload);
      setBulkMsg({ type: 'success', text: `${res.data.updated} бодлого шинэчлэгдлээ.` });
      setBulkCategory('');
      setBulkLevel('');
      setBulkSubject('');
      setBulkPublic('');
      setSelected(new Set());
      loadResults(currentPage);
    } catch {
      setBulkMsg({ type: 'danger', text: 'Шинэчлэхэд алдаа гарлаа.' });
    } finally {
      setApplying(false);
    }
  };

  const allSelectedOnPage = items.length > 0 && items.every((it) => selected.has(it.uuid));

  const openSimilarModal = async (item) => {
    setSimilarTarget(item);
    setSimilarResults(null);
    setSimilarError(null);
    setSimilarLoading(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}${item.uuid}/similar/`);
      setSimilarResults(res.data.results || []);
    } catch {
      setSimilarError('Төстэй бодлого хайхад алдаа гарлаа.');
    } finally {
      setSimilarLoading(false);
    }
  };

  const closeSimilarModal = () => {
    setSimilarTarget(null);
    setSimilarResults(null);
    setSimilarError(null);
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: 1200 }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin" className="btn btn-sm btn-outline-secondary">
            <ArrowLeft size={15} className="me-1" />
            Буцах
          </Link>
          <h4 className="fw-bold mb-0">ЭЕШ жишиг бодлого засах</h4>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/admin/eesh-jishig-summary" className="btn btn-sm btn-outline-secondary">
            Summary →
          </Link>
          <Badge bg="secondary">{totalCount.toLocaleString()} бодлого</Badge>
        </div>
      </div>

      {/* Шүүлтүүр */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="py-3 px-3">
          <Row className="g-2 align-items-end mb-2">
            <Col xs={12} md={3}>
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
            <Col xs={12} md={3}>
              <Form.Label className="small text-muted mb-1">Хичээл</Form.Label>
              <Form.Select
                size="sm"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (e.target.value && e.target.value !== 'math') setCategoryId('');
                }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={3}>
              <Form.Label className="small text-muted mb-1">Сэдэв (ангилал)</Form.Label>
              <Form.Select
                size="sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!!subject && subject !== 'math'}
              >
                <option value="">— Бүгд —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_mn || c.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={3}>
              <Form.Label className="small text-muted mb-1">Эх сурвалж</Form.Label>
              <Form.Select size="sm" value={sourceQuiz} onChange={(e) => setSourceQuiz(e.target.value)}>
                <option value="">— Бүгд —</option>
                {sourceQuizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row className="g-2">
            <Col xs={12} md={6}>
              <Form.Label className="small text-muted mb-1">Төрөл</Form.Label>
              <div className="d-flex flex-wrap gap-1">
                {PROBLEM_TYPES.map((t) => (
                  <Button
                    key={t.value}
                    size="sm"
                    variant={types.includes(t.value) ? 'primary' : 'outline-secondary'}
                    onClick={() => toggleType(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </Col>
            <Col xs={12} md={6}>
              <Form.Label className="small text-muted mb-1">Хүндрэл</Form.Label>
              <div className="d-flex flex-wrap gap-1">
                {PROBLEM_LEVELS.map((l) => (
                  <Button
                    key={l.value}
                    size="sm"
                    variant={levels.includes(l.value) ? 'warning' : 'outline-secondary'}
                    onClick={() => toggleLevel(l.value)}
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <Card className="mb-3 border-primary shadow-sm">
          <Card.Body className="py-2 px-3">
            <Row className="g-2 align-items-end">
              <Col xs={12} md="auto" className="fw-semibold text-primary">
                {selected.size} сонгогдсон
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Сэдэв</Form.Label>
                <Form.Select size="sm" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)}>
                  <option value="">— Өөрчлөхгүй —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_mn || c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Хүндрэл</Form.Label>
                <Form.Select size="sm" value={bulkLevel} onChange={(e) => setBulkLevel(e.target.value)}>
                  <option value="">— Өөрчлөхгүй —</option>
                  {PROBLEM_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Хичээл</Form.Label>
                <Form.Select size="sm" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)}>
                  <option value="">— Өөрчлөхгүй —</option>
                  {SUBJECTS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small text-muted mb-1">Нийтлэх</Form.Label>
                <Form.Select size="sm" value={bulkPublic} onChange={(e) => setBulkPublic(e.target.value)}>
                  <option value="">— Өөрчлөхгүй —</option>
                  <option value="true">Нийтэд харагдана</option>
                  <option value="false">Хувийн</option>
                </Form.Select>
              </Col>
              <Col xs={6} md="auto">
                <Button size="sm" variant="primary" onClick={applyBulk} disabled={applying}>
                  {applying ? <Spinner animation="border" size="sm" /> : 'Хэрэглэх'}
                </Button>
              </Col>
              <Col xs={6} md="auto">
                <Button size="sm" variant="outline-secondary" onClick={() => setSelected(new Set())}>
                  Цуцлах
                </Button>
              </Col>
            </Row>
            {bulkMsg && (
              <Alert variant={bulkMsg.type} className="mt-2 mb-0 py-1 px-2 small">
                {bulkMsg.text}
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

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
            <Table hover responsive className="mb-0 align-middle" size="sm">
              <thead style={{ backgroundColor: '#212529', color: '#fff' }}>
                <tr>
                  <th className="px-3" style={{ width: 40 }}>
                    <Form.Check type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Гарчиг / Өгүүлбэр</th>
                  <th style={{ width: 130 }}>Сэдэв</th>
                  <th style={{ width: 110 }}>Хүндрэл</th>
                  <th style={{ width: 110 }}>Төрөл</th>
                  <th className="text-center" style={{ width: 90 }}>
                    Төлөв
                  </th>
                  <th className="text-center" style={{ width: 90 }}>
                    Үйлдэл
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  return (
                    <tr key={item.uuid}>
                      <td className="px-3">
                        <Form.Check
                          type="checkbox"
                          checked={selected.has(item.uuid)}
                          onChange={() => toggleSelect(item.uuid)}
                        />
                      </td>
                      <td className="small text-muted">#{item.id}</td>
                      <td style={{ minWidth: 320 }}>
                        <div style={{ maxWidth: 480, overflowX: 'auto' }}>
                          <div className="fw-semibold small mb-1">{item.title || `Бодлого #${item.id}`}</div>
                          <div style={{ fontSize: 13, overflowWrap: 'break-word' }}>
                            <LivePreview content={item.statement} />
                          </div>
                        </div>
                      </td>
                      <td className="small">
                        {item.category ? (
                          <span
                            className="badge"
                            style={{ backgroundColor: item.category.color || '#6c757d' }}
                          >
                            {item.category.name_mn || item.category.name}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="small">{item.level_name || <span className="text-muted">—</span>}</td>
                      <td className="small">{item.type_display || '—'}</td>
                      <td className="text-center">
                        {item.is_public ? (
                          <Badge bg="success">Нийтэд</Badge>
                        ) : (
                          <Badge bg="secondary">Хувийн</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <a
                            href={`/problem/${item.uuid}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-outline-primary py-0 px-2"
                            title="Шинэ таб дээр засах"
                          >
                            <Pencil size={13} />
                          </a>
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="py-0 px-2"
                            title="Системээс төстэй бодлого хайх"
                            onClick={() => openSimilarModal(item)}
                          >
                            <SearchCheck size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>

        {totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3 bg-light flex-wrap gap-2">
            <span className="small text-muted">
              Нийт {totalCount.toLocaleString()} бодлогоос {(currentPage - 1) * PAGE_SIZE + 1}
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

      {/* Төстэй бодлого хайх modal */}
      <Modal show={!!similarTarget} onHide={closeSimilarModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5">Системээс төстэй бодлого хайх</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {similarLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
            </div>
          ) : similarError ? (
            <Alert variant="danger" className="mb-0">
              {similarError}
            </Alert>
          ) : similarResults && similarResults.length === 0 ? (
            <Alert variant="secondary" className="mb-0">
              Төстэй бодлого олдсонгүй.
            </Alert>
          ) : similarResults ? (
            <div className="d-flex flex-column gap-3">
              {similarResults.map((r) => (
                <div key={r.uuid} className="border rounded p-2">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="fw-semibold small">{r.title || `Бодлого #${r.id}`}</div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={r.similarity >= 0.6 ? 'success' : r.similarity >= 0.4 ? 'warning' : 'secondary'}>
                        {Math.round(r.similarity * 100)}%
                      </Badge>
                      <a
                        href={`/problem/${r.uuid}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-primary py-0 px-2"
                        title="Шинэ таб дээр нээх"
                      >
                        <Pencil size={12} />
                      </a>
                    </div>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <LivePreview content={r.statement} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={closeSimilarModal}>
            Хаах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
