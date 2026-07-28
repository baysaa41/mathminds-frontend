// src/components/quizEdit/ReplaceProblemModal.jsx
// QuizEditPage-ийн "Бодлого солих" modal — өөрийн хайлт/pagination state-тэй

import { useState, useCallback, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ArrowLeftRight } from 'lucide-react';
import apiClient from '../../api/axiosConfig.js';
import { rawText } from './problemFormat.js';
import { ProblemMeta } from './problemDisplay.jsx';
import { ProblemTypeFilter } from './ProblemTypeFilter.jsx';

export function ReplaceProblemModal({
  replacingIndex, replacingProblem, selectedProblems, mathCategories, onHide, onReplace,
}) {
  const [query, setQuery] = useState('');
  const [catId, setCatId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const fetchProblems = useCallback(async (q, cat, tf, isNew = false) => {
    loadingMoreRef.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const params = { search: q, page_size: 10 };
      if (cat) params.math_category = cat;
      if (tf !== '') params.type = tf;
      const res = await apiClient.get('/api/integral/problems/', { params });
      if (res.data && Array.isArray(res.data.results)) {
        setProblems((prev) => isNew ? res.data.results : [...prev, ...res.data.results]);
        setNextPageUrl(res.data.next);
      }
    } catch {
      setLoadError('Бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
      setTimeout(() => { loadingMoreRef.current = false; }, 300);
    }
  }, []);

  // Modal нээгдэх бүрд (солигдох бодлого өөрчлөгдөх бүрд) шинээр хайлт эхлүүлэх,
  // солигдох бодлогын категори/төрлөөр анхны шүүлтүүрийг тохируулна
  useEffect(() => {
    if (replacingIndex === null) return;
    const cat = replacingProblem?.category?.id ?? '';
    const tf = replacingProblem?.type != null ? String(replacingProblem.type) : '';
    setQuery('');
    setCatId(String(cat));
    setTypeFilter(tf);
    setProblems([]);
    setNextPageUrl(null);
    setLoadError(null);
    fetchProblems('', String(cat), tf, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replacingIndex]);

  const handleLoadMore = useCallback(async () => {
    if (!nextPageUrl || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoading(true);
    try {
      const res = await apiClient.get(nextPageUrl);
      if (res.data && Array.isArray(res.data.results)) {
        setProblems((prev) => [...prev, ...res.data.results]);
        setNextPageUrl(res.data.next);
      }
    } catch {
      setLoadError('Нэмэлт бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
      setTimeout(() => { loadingMoreRef.current = false; }, 300);
    }
  }, [nextPageUrl]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageUrl && !loadingMoreRef.current)
          handleLoadMore();
      },
      { threshold: 1.0 }
    );
    const el = loadMoreRef.current;
    if (el) obs.observe(el);
    return () => { if (el) obs.unobserve(el); };
  }, [nextPageUrl, handleLoadMore]);

  return (
    <Modal show={replacingIndex !== null} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          <ArrowLeftRight size={16} className="me-2 text-info" />
          {replacingProblem
            ? <>
                <span className="text-muted fw-normal">{replacingIndex + 1}. бодлогыг солих: </span>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                  {replacingProblem.title || `Бодлого #${replacingProblem.id}`}
                </span>
              </>
            : 'Бодлого солих'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '60vh' }}>

        {/* Одоогийн бодлогын мэдээлэл */}
        {replacingProblem && (
          <Alert variant="light" className="py-2 small mb-3 border">
            <strong>Одоогийн бодлого:</strong>
            <ProblemMeta problem={replacingProblem} />
          </Alert>
        )}

        {/* Хайлт + Категори шүүлтүүр */}
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProblems(query, catId, typeFilter, true);
          }}
        >
          <Row className="g-2 mb-2">
            <Col>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Гарчиг, агуулгаар хайх..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner as="span" size="sm" /> : 'Хайх'}
                </Button>
              </InputGroup>
            </Col>
            <Col xs="auto">
              <Form.Select
                value={catId}
                style={{ minWidth: 160 }}
                onChange={(e) => {
                  setCatId(e.target.value);
                  fetchProblems(query, e.target.value, typeFilter, true);
                }}
              >
                <option value="">Бүх категори</option>
                {mathCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_mn || cat.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Form>

        <ProblemTypeFilter
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); fetchProblems(query, catId, v, true); }}
        />

        {loadError && <Alert variant="danger">{loadError}</Alert>}

        <ListGroup variant="flush">
          {problems.length > 0
            ? problems.map((problem) => {
                const isCurrent = replacingProblem?.id === problem.id;
                const isElsewhere = !isCurrent && selectedProblems.some((p) => p.id === problem.id);
                return (
                  <ListGroup.Item
                    key={problem.id}
                    className="d-flex align-items-center gap-2 py-2"
                    style={isCurrent ? { background: '#f0f7ff' } : undefined}
                  >
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-semibold text-truncate">{rawText(problem.title) || `Бодлого #${problem.id}`}</div>
                      {problem.statement && (
                        <div className="text-muted small text-truncate">{rawText(problem.statement)}</div>
                      )}
                    </div>
                    <Button
                      variant={isCurrent ? 'secondary' : isElsewhere ? 'outline-secondary' : 'outline-info'}
                      size="sm"
                      onClick={() => !isCurrent && !isElsewhere && onReplace(problem)}
                      disabled={isCurrent || isElsewhere}
                      className="flex-shrink-0"
                      title={
                        isCurrent ? 'Одоогийн бодлого' :
                        isElsewhere ? 'Аль хэдийн тестэд байна' : 'Энэ бодлогоор солих'
                      }
                    >
                      {isCurrent
                        ? 'Одоогийн'
                        : isElsewhere
                        ? 'Байна'
                        : <><ArrowLeftRight size={13} className="me-1" />Солих</>}
                    </Button>
                  </ListGroup.Item>
                );
              })
            : !loading && (
                <div className="text-center text-muted p-3">Хайлтын үр дүн олдсонгүй.</div>
              )}
          <div ref={loadMoreRef} style={{ height: 20 }} />
          {loading && (
            <div className="text-center py-3">
              <Spinner as="span" animation="border" size="sm" />
              <span className="ms-2">Ачааллаж байна...</span>
            </div>
          )}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Хаах</Button>
      </Modal.Footer>
    </Modal>
  );
}
