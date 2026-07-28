// src/components/quizEdit/AddProblemModal.jsx
// QuizEditPage-ийн "Бодлого нэмэх" modal — өөрийн хайлт/pagination state-тэй

import { useState, useCallback, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import apiClient from '../../api/axiosConfig.js';
import { rawText } from './problemFormat.js';
import { ProblemTypeFilter } from './ProblemTypeFilter.jsx';

export function AddProblemModal({ show, onHide, selectedProblems, onAddProblem }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const loadMoreRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const fetchProblems = useCallback(async (q, tf, isNew = false) => {
    loadingMoreRef.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const params = { search: q, page_size: 10 };
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

  // Modal нээгдэх бүрд шинээр хайлт эхлүүлэх
  useEffect(() => {
    if (show) {
      setQuery('');
      setTypeFilter('');
      setProblems([]);
      setNextPageUrl(null);
      setLoadError(null);
      fetchProblems('', '', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

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
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Бодлогын сангаас сонгох</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: '60vh' }}>
        <Form onSubmit={(e) => { e.preventDefault(); fetchProblems(query, typeFilter, true); }}>
          <InputGroup className="mb-2">
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
        </Form>

        <ProblemTypeFilter
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); fetchProblems(query, v, true); }}
        />

        {loadError && <Alert variant="danger">{loadError}</Alert>}

        <ListGroup variant="flush">
          {problems.length > 0
            ? problems.map((problem) => {
                const isAdded = selectedProblems.some((p) => p.id === problem.id);
                return (
                  <ListGroup.Item key={problem.id} className="d-flex align-items-center gap-2 py-2">
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-semibold text-truncate">{rawText(problem.title) || `Бодлого #${problem.id}`}</div>
                      {problem.statement && (
                        <div className="text-muted small text-truncate">{rawText(problem.statement)}</div>
                      )}
                    </div>
                    <Button
                      variant={isAdded ? 'success' : 'outline-primary'}
                      size="sm"
                      onClick={() => onAddProblem(problem)}
                      disabled={isAdded}
                      className="flex-shrink-0"
                    >
                      {isAdded ? <><i className="bi bi-check-lg" /> Нэмэгдсэн</> : 'Нэмэх'}
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
