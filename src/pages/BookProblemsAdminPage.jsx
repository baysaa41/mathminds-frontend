// frontend/src/pages/BookProblemsAdminPage.jsx
// Admin: ЭЕШ бэлтгэлийн 5 номын (book1/book2/book3/geometry/probstat) жишээ болон
// AI-аар үүсгэсэн дасгал бодлогуудыг харах, /problem/:uuid/edit хуудсаар засах.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import {
  Container, Card, Spinner, Form, Row, Col, Badge, Pagination, InputGroup, Button,
} from 'react-bootstrap';
import { Search, X, Pencil, ArrowLeft } from 'lucide-react';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { mathJaxConfig } from '../mathjax.config.js';
import { API_ENDPOINTS } from '../constants/api.js';

const PAGE_SIZE = 20;

const BOOKS = [
  { key: 'book1', label: 'Ном 1', hint: 'Сэргээн санах / Ойлгох' },
  { key: 'book2', label: 'Ном 2', hint: 'Ойлгох / Хэрэглэх' },
  { key: 'book3', label: 'Ном 3', hint: 'Хэрэглэх ба түүнээс дээш' },
  { key: 'geometry', label: 'Геометр', hint: 'Бүх түвшин' },
  { key: 'probstat', label: 'Магадлал статистик', hint: 'Бүх түвшин' },
];

function ProblemRow({ item, variant = false }) {
  return (
    <div className={variant ? 'ps-3 border-start border-2 border-warning-subtle' : ''}>
      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="small text-muted">#{item.id}</span>
          {!variant && item.category && (
            <span className="badge" style={{ backgroundColor: item.category.color || '#6c757d' }}>
              {item.category.name_mn || item.category.name}
            </span>
          )}
          <Badge bg="light" text="dark" className="border">
            {item.level_name || '—'}
          </Badge>
          <Badge bg="light" text="dark" className="border">
            {item.type_display}
          </Badge>
          {!item.is_public && <Badge bg="secondary">Хувийн</Badge>}
        </div>
        <a
          href={`/problem/${item.uuid}/edit`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline-primary py-0 px-2 flex-shrink-0"
          title="Шинэ таб дээр засах"
        >
          <Pencil size={13} />
        </a>
      </div>
      {item.title && <div className="fw-semibold small mb-1">{item.title}</div>}
      <div style={{ fontSize: 13, overflowWrap: 'break-word' }}>
        <LivePreview content={item.statement} />
      </div>
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

        const res = await apiClient.get(`${API_ENDPOINTS.INTEGRAL.PROBLEMS}eesh-book-problems/`, { params });
        setItems(res.data.results || []);
        setTotalCount(res.data.count || 0);
        setCurrentPage(page);
      } catch {
        setError('Мэдээлэл татахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    },
    [bookKey, categoryId, search]
  );

  useEffect(() => {
    loadResults(1);
  }, [loadResults]);

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
          <Badge bg="secondary">{totalCount.toLocaleString()} жишээ бодлого</Badge>
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
                    <ProblemRow item={item} />
                    {item.variants && item.variants.length > 0 && (
                      <div className="mt-2 d-flex flex-column gap-2">
                        {item.variants.map((v) => (
                          <ProblemRow key={v.uuid} item={v} variant />
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
