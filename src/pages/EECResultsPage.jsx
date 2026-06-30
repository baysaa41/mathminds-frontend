// frontend/src/pages/EECResultsPage.jsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Container, Card, Table, Spinner, Form, Row, Col, Badge, Pagination, InputGroup,
} from 'react-bootstrap';
import { Search, X, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

const GRADE_BG = {
  A: '#198754', 'A-': '#20a060',
  B: '#0d6efd', 'B+': '#0b5ed7', 'B-': '#4a90d9',
  C: '#ffc107', 'C+': '#e0a800', 'C-': '#d4a800',
  D: '#6c757d',
  F: '#dc3545',
};

function gradeStyle(g = '') {
  const t = g.trim();
  const bg = GRADE_BG[t] || (t.startsWith('A') ? '#198754' : t.startsWith('B') ? '#0d6efd' : '#6c757d');
  return { backgroundColor: bg, color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 13, fontWeight: 600 };
}

const PAGE_SIZE = 50;

export default function EECResultsPage() {
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [aimag, setAimag]   = useState('');
  const [buleg, setBuleg]   = useState('');
  const [search, setSearch] = useState('');
  const [inputVal, setInputVal] = useState('');

  // Meta
  const [availableAimags, setAvailableAimags] = useState([]);
  const [availableBulegs, setAvailableBulegs] = useState([]);
  const [totalAll, setTotalAll] = useState(0);
  const [uniqueStudents, setUniqueStudents] = useState(0);

  const searchTimer = useRef(null);

  // Мета татах
  useEffect(() => {
    apiClient.get('/api/integral/eec-results/meta/').then(res => {
      setAvailableAimags(res.data.aimags || []);
      setAvailableBulegs(res.data.bulegs || []);
      setTotalAll(res.data.total || 0);
      setUniqueStudents(res.data.unique_students || 0);
    }).catch(() => {});
  }, []);

  const loadResults = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
      if (aimag)  params.set('aimag', aimag);
      if (buleg)  params.set('buleg', buleg);
      if (search) params.set('search', search);

      const res = await apiClient.get(`/api/integral/eec-results/?${params}`);
      setResults(res.data.results || []);
      setTotalCount(res.data.count || 0);
      setCurrentPage(page);
    } catch {
      setError('Мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  }, [aimag, buleg, search]);

  // Анх болон filter өөрчлөгдөхөд
  useEffect(() => {
    loadResults(1);
  }, [loadResults]);

  // Search debounce
  const handleSearchInput = (val) => {
    setInputVal(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val.trim()), 500);
  };

  const clearSearch = () => {
    setInputVal('');
    setSearch('');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Pagination: дээд тал 7 товч
  const pageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (currentPage >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', currentPage - 1, currentPage, currentPage + 1, '…', totalPages];
  };

  return (
    <Container fluid className="py-4" style={{ maxWidth: 1100 }}>
      {/* Гарчиг */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold mb-0">ЭЕШ 2026 — Дүн мэдээ</h4>
        <Link to="/admin/eec-stats" className="btn btn-sm btn-outline-secondary">
          <BarChart2 size={15} className="me-1" />
          Аймгийн статистик
        </Link>
      </div>

      {/* Статистик карт */}
      {totalAll > 0 && (
        <Row className="g-3 mb-3">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center py-2">
              <div className="fs-4 fw-bold text-primary">{uniqueStudents.toLocaleString()}</div>
              <div className="small text-muted">Сурагч</div>
              <div className="text-muted" style={{ fontSize: 11 }}>бүртгэлийн дугаараар</div>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center py-2">
              <div className="fs-4 fw-bold text-secondary">{totalAll.toLocaleString()}</div>
              <div className="small text-muted">Нийт дүн</div>
              <div className="text-muted" style={{ fontSize: 11 }}>аймаг × бүлэг</div>
            </Card>
          </Col>
          {totalCount !== totalAll && totalCount > 0 && (
            <Col xs={6} md={3}>
              <Card className="border-0 shadow-sm text-center py-2">
                <div className="fs-4 fw-bold text-success">{totalCount.toLocaleString()}</div>
                <div className="small text-muted">Шүүлтийн үр дүн</div>
                <div className="text-muted" style={{ fontSize: 11 }}>одоогийн шүүлт</div>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Шүүлтүүр */}
      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body className="py-2 px-3">
          <Row className="g-2 align-items-end">
            <Col xs={12} sm={4} md={3}>
              <Form.Label className="small text-muted mb-1">Аймаг / Хот</Form.Label>
              <Form.Select size="sm" value={aimag} onChange={e => { setAimag(e.target.value); }}>
                <option value="">— Бүгд —</option>
                {availableAimags.map(a => <option key={a} value={a}>{a}</option>)}
              </Form.Select>
            </Col>
            <Col xs={12} sm={4} md={3}>
              <Form.Label className="small text-muted mb-1">ЭШ-ын бүлэг</Form.Label>
              <Form.Select size="sm" value={buleg} onChange={e => { setBuleg(e.target.value); }}>
                <option value="">— Бүгд —</option>
                {availableBulegs.map(b => <option key={b} value={b}>{b}</option>)}
              </Form.Select>
            </Col>
            <Col xs={12} sm={4} md={4}>
              <Form.Label className="small text-muted mb-1">Бүртгэлийн дугаараар хайх</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Жишээ: 262101286"
                  value={inputVal}
                  onChange={e => handleSearchInput(e.target.value)}
                />
                {inputVal && (
                  <InputGroup.Text
                    style={{ cursor: 'pointer' }}
                    onClick={clearSearch}
                  >
                    <X size={14} />
                  </InputGroup.Text>
                )}
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Хүснэгт */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {error && <div className="p-3 text-danger small">{error}</div>}

          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5 gap-2">
              <Spinner animation="border" size="sm" />
              <span className="text-muted">Уншиж байна...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-5 text-muted">
              {totalAll === 0
                ? 'Мэдээлэл байхгүй. Эхлээд import хийнэ үү: python manage.py import_eec_results --all'
                : 'Шүүлтэд тохирох дүн олдсонгүй.'}
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle" size="sm">
              <thead style={{ backgroundColor: '#212529', color: '#fff' }}>
                <tr>
                  <th className="px-3" style={{ width: 60 }}>#</th>
                  <th style={{ width: 80 }}>Байр</th>
                  <th>Бүртгэлийн дугаар</th>
                  <th>Аймаг / Хот</th>
                  <th>ЭШ-ын бүлэг</th>
                  <th className="text-center" style={{ width: 80 }}>А.Оноо</th>
                  <th className="text-center" style={{ width: 80 }}>Х.Оноо</th>
                  <th className="text-center" style={{ width: 80 }}>Про %</th>
                  <th className="text-center" style={{ width: 70 }}>А.Ч.И</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const raw   = row.raw_data || {};
                  const rank  = raw['Байр']                  || row.number   || '—';
                  const reg   = raw['Бүртгэлийн дугаар']    || row.register || '—';
                  const aOnoo = raw['А.Оноо']  ?? row.score ?? '—';
                  const hOnoo = raw['Х.Оноо']               || '—';
                  const pro   = raw['Про']                   || '—';
                  const achi  = (raw['А.Ч.И'] || '').trim();
                  const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <tr key={row.id}>
                      <td className="px-3 text-muted small">{rowNum}</td>
                      <td className="text-muted small">{rank}</td>
                      <td
                        className="font-monospace fw-semibold text-primary"
                        style={{ cursor: 'pointer' }}
                        title="Дарж хайх"
                        onClick={() => { setInputVal(reg); setSearch(reg); }}
                      >{reg}</td>
                      <td className="small">{row.aimag}</td>
                      <td className="small text-muted">{row.buleg}</td>
                      <td className="text-center fw-bold">{aOnoo}</td>
                      <td className="text-center small">{hOnoo}</td>
                      <td className="text-center small text-muted">{pro}</td>
                      <td className="text-center">
                        {achi
                          ? <span style={gradeStyle(achi)}>{achi}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card.Footer className="d-flex justify-content-between align-items-center py-2 px-3 bg-light">
            <span className="small text-muted">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} / {totalCount.toLocaleString()}
            </span>
            <Pagination size="sm" className="mb-0">
              <Pagination.Prev disabled={currentPage === 1} onClick={() => loadResults(currentPage - 1)} />
              {pageNumbers().map((p, i) =>
                p === '…'
                  ? <Pagination.Ellipsis key={`e${i}`} disabled />
                  : <Pagination.Item key={p} active={p === currentPage} onClick={() => loadResults(p)}>{p}</Pagination.Item>
              )}
              <Pagination.Next disabled={currentPage === totalPages} onClick={() => loadResults(currentPage + 1)} />
            </Pagination>
          </Card.Footer>
        )}
      </Card>
    </Container>
  );
}
