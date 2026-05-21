// frontend/src/pages/QuizEditPage.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';
import LivePreview from '../components/LivePreview.jsx';
import { MathJax } from 'better-react-mathjax';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import InputGroup from 'react-bootstrap/InputGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { Edit3, Save, X, FileText, AlignLeft, Clock, GraduationCap, PlusCircle, Sparkles, Trash2, ArrowLeftRight, Download, Wand2, Copy } from 'lucide-react';

// ── Бодлогын төрөл ──────────────────────────────────────────────
const PROBLEM_TYPE_LABELS = { 0: 'Уламжлалт', 1: 'Сонгох', 4: 'Нөхөх' };
const PROBLEM_TYPE_COLORS = { 0: '#6c757d', 1: '#0d6efd', 4: '#198754' };

// Modal хайлтад plain текст харуулах — $ тэмдэг хасна (MathJax trigger болохоос сэргийлнэ)
const rawText = (text, maxLen = 160) => {
  if (!text) return '';
  return text
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
};

// ── Бодлогын мөр (selected list болон modal аль алинд) ──────────
const ProblemMeta = ({ problem }) => (
  <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
    {problem.type !== undefined && problem.type !== null && (
      <span
        className="badge"
        style={{ backgroundColor: PROBLEM_TYPE_COLORS[problem.type] ?? '#6c757d', fontSize: '0.68rem' }}
      >
        {PROBLEM_TYPE_LABELS[problem.type] ?? 'Тодорхойгүй'}
      </span>
    )}
    {problem.ai_summary ? (
      <span className="text-muted small">
        <Sparkles size={11} className="me-1 text-warning" />
        {problem.ai_summary}
      </span>
    ) : (
      <span className="text-secondary fst-italic small">
        <Sparkles size={11} className="me-1 text-secondary" />
        AI summary байхгүй
      </span>
    )}
    {problem.math_category && (
      <span
        className="badge ms-1"
        style={{ backgroundColor: problem.math_category.color || '#6c757d', fontSize: '0.68rem' }}
      >
        {problem.math_category.name_mn || problem.math_category.name}
      </span>
    )}
  </div>
);

// ── Бодлогын бүрэн харагдац (QuizTakePage-тай адил) ─────────────
// React.memo: problem prop өөрчлөгдөөгүй бол LivePreview дахин render болохгүй
const ProblemBodyPreview = React.memo(({ problem }) => (
  <div>
    <div className="fw-semibold mb-1">
      <LivePreview content={problem.title || `Бодлого #${problem.id}`} />
    </div>
    {problem.statement && (
      <div className="mb-2" style={{ fontSize: '0.92rem' }}>
        <LivePreview content={problem.statement} />
      </div>
    )}
    {problem.type === 1 && problem.choices?.length > 0 && (
      <div className="mb-2">
        {[...problem.choices].sort((a, b) => a.label.localeCompare(b.label)).map((choice) => (
          <div key={choice.id} className="d-flex align-items-baseline gap-2 mb-1" style={{ fontSize: '0.88rem' }}>
            <i className="bi bi-circle flex-shrink-0 text-secondary" style={{ fontSize: '0.65rem' }} />
            <LivePreview content={`${choice.label}: ${choice.value}`} />
          </div>
        ))}
      </div>
    )}
    {problem.type === 4 && problem.choices?.length > 0 && (
      <div className="mb-2">
        {[...problem.choices].sort((a, b) => a.label.localeCompare(b.label)).map((choice) => (
          <div key={choice.id} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.88rem' }}>
            <span className="badge bg-secondary flex-shrink-0" style={{ minWidth: 36 }}>
              <LivePreview content={choice.label} />
            </span>
            <span className="border-bottom border-2 border-secondary d-inline-block text-muted"
              style={{ minWidth: 80 }}>
            </span>
          </div>
        ))}
      </div>
    )}
    <ProblemMeta problem={problem} />
  </div>
));

const QuizEditPage = () => {
  const { uuid: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPageTitle } = useOutletContext() || {};

  // ── Тестийн үндсэн state ──────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [grades, setGrades] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [originalTitle, setOriginalTitle] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showPublishedWarning, setShowPublishedWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [wasInitiallyPublic, setWasInitiallyPublic] = useState(false);

  // ── AI Summary state ──────────────────────────────────────────
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState({ current: 0, total: 0 });

  // ── Math categories (нэг удаа fetch) ─────────────────────────
  const [mathCategories, setMathCategories] = useState([]);

  // ── "Бодлого нэмэх" Modal ─────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addTypeFilter, setAddTypeFilter] = useState('');
  const [addProblems, setAddProblems] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addNextPageUrl, setAddNextPageUrl] = useState(null);
  const [addLoadError, setAddLoadError] = useState(null);
  const addLoadMoreRef = useRef(null);
  const addLoadingMoreRef = useRef(false);

  // ── "Солих" Modal ─────────────────────────────────────────────
  const [replacingIndex, setReplacingIndex] = useState(null);   // солигдох бодлогын index
  const [replaceQuery, setReplaceQuery] = useState('');
  const [replaceCatId, setReplaceCatId] = useState('');
  const [replaceTypeFilter, setReplaceTypeFilter] = useState('');
  const [replaceProblems, setReplaceProblems] = useState([]);
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceNextPageUrl, setReplaceNextPageUrl] = useState(null);
  const [replaceLoadError, setReplaceLoadError] = useState(null);
  const replaceLoadMoreRef = useRef(null);
  const replaceLoadingMoreRef = useRef(false);

  const replacingProblem = replacingIndex !== null ? selectedProblems[replacingIndex] : null;

  // ── Анхны мэдээлэл татах ─────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const quizRes = await apiClient.get(`/api/integral/quizzes/${id}/`);
        const quizData = quizRes.data;

        if (!user || (!user.is_staff && (!quizData.author || user.id !== quizData.author.id))) {
          setError('Энэ тестийг засварлах эрх танд байхгүй байна.');
          setLoading(false);
          return;
        }

        setTitle(quizData.title || '');
        setOriginalTitle(quizData.title || '');
        setDescription(quizData.description || '');
        setIsPublic(quizData.is_public ?? false);
        setWasInitiallyPublic(quizData.is_public ?? false);
        if (quizData.is_public) setShowPublishedWarning(true);
        setDefaultTimeLimit(quizData.default_time_limit ?? '');
        setGradeId(quizData.grade?.id ?? '');
        setSelectedProblems(quizData.problems || []);
        const t = quizData.title || `Тест #${id}`;
        setPageTitle?.(`Тест засах · ${t}`);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Засварлах тест олдсонгүй.'
            : 'Тестийн мэдээллийг татахад алдаа гарлаа.'
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchGrades = async () => {
      try {
        const res = await apiClient.get('/api/integral/grades/');
        setGrades(Array.isArray(res.data) ? res.data : (res.data?.results || []));
      } catch { /* grades байхгүй ч үргэлжлүүлнэ */ }
    };

    const fetchMathCategories = async () => {
      try {
        const res = await apiClient.get('/api/integral/math-categories/');
        setMathCategories(Array.isArray(res.data) ? res.data : []);
      } catch { /* категори байхгүй ч үргэлжлүүлнэ */ }
    };

    fetchData();
    fetchGrades();
    fetchMathCategories();
  }, [id, user]);

  // ── Drag & Drop ───────────────────────────────────────────────
  const handleDragEnd = (result) => {
    if (!warningAcknowledged && wasInitiallyPublic) return;
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const arr = Array.from(selectedProblems);
    const [item] = arr.splice(source.index, 1);
    arr.splice(destination.index, 0, item);
    setSelectedProblems(arr);
  };

  // ── Хадгалах ─────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/api/integral/quizzes/${id}/`, {
        title,
        description,
        is_public: isPublic,
        default_time_limit: defaultTimeLimit !== '' ? Number(defaultTimeLimit) : null,
        grade: gradeId !== '' ? Number(gradeId) : null,
        problems: selectedProblems.map((p) => p.uuid),
      });
      navigate(`/quiz/${id}`);
    } catch (err) {
      setError('Тестийг хадгалахад алдаа гарлаа.');
      console.error(err);
      setSaving(false);
    }
  };

  // ── Устгах ───────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/integral/quizzes/${id}/`);
      navigate('/content/browse?type=quizzes');
    } catch {
      setError('Тестийг устгахад алдаа гарлаа.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── AI Summary ────────────────────────────────────────────────
  const applyGeneratedSummary = (problemId, data) => {
    setSelectedProblems((prev) =>
      prev.map((p) => {
        if (p.id !== problemId) return p;
        const updates = {};
        if (data.ai_summary) updates.ai_summary = data.ai_summary;
        if (data.math_category) updates.math_category = data.math_category;
        return { ...p, ...updates };
      })
    );
  };

  const handleGenerateSummary = async (problem) => {
    setGeneratingSummaryFor(problem.id);
    try {
      const res = await apiClient.post(`/api/integral/problems/${problem.uuid}/generate_summary/`);
      applyGeneratedSummary(problem.id, res.data);
    } catch (err) {
      console.error('AI summary error:', err);
    } finally {
      setGeneratingSummaryFor(null);
    }
  };

  const handleGenerateAllMissing = async () => {
    const missing = selectedProblems.filter((p) => !p.ai_summary);
    if (!missing.length) return;
    setGeneratingAll(true);
    setGenerateAllProgress({ current: 0, total: missing.length });
    for (let i = 0; i < missing.length; i++) {
      setGenerateAllProgress({ current: i + 1, total: missing.length });
      try {
        const res = await apiClient.post(`/api/integral/problems/${missing[i].uuid}/generate_summary/`);
        applyGeneratedSummary(missing[i].id, res.data);
      } catch (err) {
        console.error(`AI summary error for ${missing[i].id}:`, err);
      }
    }
    setGeneratingAll(false);
    setGenerateAllProgress({ current: 0, total: 0 });
  };

  // ── Selected problems удирдах ─────────────────────────────────
  const handleRemoveProblem = (problemId) => {
    setSelectedProblems((prev) => prev.filter((p) => p.id !== problemId));
  };

  // ── AI төстэй тест үүсгэх ─────────────────────────────────────
  const [showGenerateSimilarModal, setShowGenerateSimilarModal] = useState(false);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [generateSimilarError, setGenerateSimilarError] = useState(null);
  const [similarProgress, setSimilarProgress] = useState({ current: 0, total: 0, title: '' });
  const pollRef = useRef(null);

  const handleGenerateSimilar = async () => {
    setGeneratingSimilar(true);
    setGenerateSimilarError(null);
    setSimilarProgress({ current: 0, total: 0, title: '' });
    try {
      const res = await apiClient.post(`/api/integral/quizzes/${id}/generate_similar/`);
      const { task_id, total } = res.data;
      setSimilarProgress((p) => ({ ...p, total }));

      // Poll task status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiClient.get(
            `/api/integral/quizzes/task-status/${task_id}/`
          );
          const { state, current, total: t, problem_title, new_uuid, error } = statusRes.data;

          if (state === 'PROGRESS') {
            setSimilarProgress({ current: current + 1, total: t, title: problem_title || '' });
          } else if (state === 'SUCCESS') {
            clearInterval(pollRef.current);
            setShowGenerateSimilarModal(false);
            navigate(`/quiz/${new_uuid}/edit`);
          } else if (state === 'FAILURE') {
            clearInterval(pollRef.current);
            setGenerateSimilarError(error || 'AI тест үүсгэхэд алдаа гарлаа.');
            setGeneratingSimilar(false);
          }
        } catch {
          // poll алдаа — үргэлжлүүлнэ
        }
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'AI тест үүсгэхэд алдаа гарлаа.';
      setGenerateSimilarError(msg);
      setGeneratingSimilar(false);
    }
  };

  // Modal хаахад poll зогсоох (task background-д үргэлжилнэ)
  const handleCloseSimilarModal = () => {
    clearInterval(pollRef.current);
    setGeneratingSimilar(false);
    setShowGenerateSimilarModal(false);
  };

  // ── LaTeX экспорт ─────────────────────────────────────────────
  const [exportingLatex, setExportingLatex] = useState(false);

  const handleExportLatex = async () => {
    setExportingLatex(true);
    try {
      const response = await apiClient.get(`/api/integral/quizzes/${id}/export_latex/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename="(.+?)"/);
      link.setAttribute('download', match ? match[1] : 'quiz.tex');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('LaTeX export error:', err);
    } finally {
      setExportingLatex(false);
    }
  };

  // ── Хуулбар тест үүсгэх ──────────────────────────────────────
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await apiClient.post(`/api/integral/quizzes/${id}/clone/`);
      navigate(`/quiz/${res.data.new_uuid}/edit`);
    } catch (err) {
      setError(err.response?.data?.error || 'Тест хуулахад алдаа гарлаа.');
      setCloning(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // "БОДЛОГО НЭМЭХ" MODAL
  // ════════════════════════════════════════════════════════════
  const fetchAddProblems = useCallback(async (query, typeFilter, isNew = false) => {
    addLoadingMoreRef.current = true;
    setAddLoading(true);
    setAddLoadError(null);
    try {
      const params = { search: query, page_size: 10 };
      if (typeFilter !== '') params.type = typeFilter;
      const res = await apiClient.get('/api/integral/problems/', { params });
      if (res.data && Array.isArray(res.data.results)) {
        setAddProblems((prev) => isNew ? res.data.results : [...prev, ...res.data.results]);
        setAddNextPageUrl(res.data.next);
      }
    } catch {
      setAddLoadError('Бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setAddLoading(false);
      setTimeout(() => { addLoadingMoreRef.current = false; }, 300);
    }
  }, []);

  const handleShowAddModal = () => {
    setShowAddModal(true);
    setAddQuery('');
    setAddTypeFilter('');
    setAddProblems([]);
    setAddNextPageUrl(null);
    setAddLoadError(null);
    fetchAddProblems('', '', true);
  };

  const handleAddModalLoadMore = useCallback(async () => {
    if (!addNextPageUrl || addLoadingMoreRef.current) return;
    addLoadingMoreRef.current = true;
    setAddLoading(true);
    try {
      const res = await apiClient.get(addNextPageUrl);
      if (res.data && Array.isArray(res.data.results)) {
        setAddProblems((prev) => [...prev, ...res.data.results]);
        setAddNextPageUrl(res.data.next);
      }
    } catch {
      setAddLoadError('Нэмэлт бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setAddLoading(false);
      setTimeout(() => { addLoadingMoreRef.current = false; }, 300);
    }
  }, [addNextPageUrl]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && addNextPageUrl && !addLoadingMoreRef.current)
          handleAddModalLoadMore();
      },
      { threshold: 1.0 }
    );
    const el = addLoadMoreRef.current;
    if (el) obs.observe(el);
    return () => { if (el) obs.unobserve(el); };
  }, [addNextPageUrl, handleAddModalLoadMore]);

  const handleAddProblem = (problem) => {
    if (!selectedProblems.find((p) => p.id === problem.id))
      setSelectedProblems((prev) => [...prev, problem]);
  };

  // ════════════════════════════════════════════════════════════
  // "СОЛИХ" MODAL
  // ════════════════════════════════════════════════════════════
  const fetchReplaceProblems = useCallback(async (query, catId, typeFilter, isNew = false) => {
    replaceLoadingMoreRef.current = true;
    setReplaceLoading(true);
    setReplaceLoadError(null);
    try {
      const params = { search: query, page_size: 10 };
      if (catId) params.math_category = catId;
      if (typeFilter !== '') params.type = typeFilter;
      const res = await apiClient.get('/api/integral/problems/', { params });
      if (res.data && Array.isArray(res.data.results)) {
        setReplaceProblems((prev) => isNew ? res.data.results : [...prev, ...res.data.results]);
        setReplaceNextPageUrl(res.data.next);
      }
    } catch {
      setReplaceLoadError('Бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setReplaceLoading(false);
      setTimeout(() => { replaceLoadingMoreRef.current = false; }, 300);
    }
  }, []);

  const handleOpenReplaceModal = (index) => {
    const prob = selectedProblems[index];
    const catId = prob?.math_category?.id ?? '';
    const typeFilter = prob?.type != null ? String(prob.type) : '';
    setReplacingIndex(index);
    setReplaceQuery('');
    setReplaceCatId(String(catId));
    setReplaceTypeFilter(typeFilter);
    setReplaceProblems([]);
    setReplaceNextPageUrl(null);
    setReplaceLoadError(null);
    fetchReplaceProblems('', String(catId), typeFilter, true);
  };

  const handleCloseReplaceModal = () => {
    setReplacingIndex(null);
  };

  const handleReplaceModalLoadMore = useCallback(async () => {
    if (!replaceNextPageUrl || replaceLoadingMoreRef.current) return;
    replaceLoadingMoreRef.current = true;
    setReplaceLoading(true);
    try {
      const res = await apiClient.get(replaceNextPageUrl);
      if (res.data && Array.isArray(res.data.results)) {
        setReplaceProblems((prev) => [...prev, ...res.data.results]);
        setReplaceNextPageUrl(res.data.next);
      }
    } catch {
      setReplaceLoadError('Нэмэлт бодлого ачааллахад алдаа гарлаа.');
    } finally {
      setReplaceLoading(false);
      setTimeout(() => { replaceLoadingMoreRef.current = false; }, 300);
    }
  }, [replaceNextPageUrl]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && replaceNextPageUrl && !replaceLoadingMoreRef.current)
          handleReplaceModalLoadMore();
      },
      { threshold: 1.0 }
    );
    const el = replaceLoadMoreRef.current;
    if (el) obs.observe(el);
    return () => { if (el) obs.unobserve(el); };
  }, [replaceNextPageUrl, handleReplaceModalLoadMore]);

  const handleReplaceProblem = (newProblem) => {
    if (replacingIndex === null) return;
    // аль хэдийн байгаа бол солихгүй (өөр индекс дээр)
    const existsElsewhere = selectedProblems.some(
      (p, i) => p.id === newProblem.id && i !== replacingIndex
    );
    if (existsElsewhere) return;
    setSelectedProblems((prev) => {
      const arr = [...prev];
      arr[replacingIndex] = newProblem;
      return arr;
    });
    handleCloseReplaceModal();
  };

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <AppBreadcrumb items={[{ label: 'Тестүүд', to: '/quizzes' }, { label: 'Засварлах' }]} />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <AppBreadcrumb className="mb-3" items={[
        { label: 'Тестүүд', to: '/quizzes' },
        { label: originalTitle || 'Тест', to: `/quiz/${id}` },
        { label: 'Засварлах' },
      ]} />

      <h1 className="h3 fw-bold mb-4">
        <Edit3 size={24} className="me-2" />
        Тест засварлах
      </h1>

      <Form onSubmit={handleSave}>
        <Row>
          {/* ── Зүүн тал: Бодлогуудын жагсаалт ── */}
          <Col lg={8}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Card className="mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span>Тестэд багтсан бодлогууд ({selectedProblems.length})</span>
                  <div className="d-flex gap-2">
                    {selectedProblems.some((p) => !p.ai_summary) && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={handleGenerateAllMissing}
                        disabled={generatingAll || generatingSummaryFor !== null}
                        title="AI summary байхгүй бодлогуудыг бүгдийг тооцох"
                      >
                        {generatingAll ? (
                          <>
                            <Spinner as="span" size="sm" className="me-1" />
                            {generateAllProgress.current}/{generateAllProgress.total}
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="me-1" />
                            Бүгдийг тооцох ({selectedProblems.filter((p) => !p.ai_summary).length})
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleShowAddModal}
                      disabled={!warningAcknowledged && wasInitiallyPublic}
                    >
                      <PlusCircle size={16} className="me-1" />
                      Бодлого нэмэх
                    </Button>
                  </div>
                </Card.Header>

                <Droppable droppableId="selectedProblemsList">
                  {(provided) => (
                    <ListGroup variant="flush" ref={provided.innerRef} {...provided.droppableProps}>
                      {selectedProblems.length > 0 ? (
                        selectedProblems.map((problem, index) => (
                          <Draggable key={problem.id} draggableId={String(problem.id)} index={index}>
                            {(provided) => (
                              <ListGroup.Item
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="d-flex align-items-start gap-2 py-3"
                              >
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="px-1 text-muted flex-shrink-0 mt-1"
                                  title="Чирч эрэмбийг солих"
                                  style={{ cursor: 'grab' }}
                                >
                                  <i className="bi bi-grip-vertical" />
                                </div>

                                <span className="fw-bold flex-shrink-0 mt-1">{index + 1}.</span>

                                {/* Бодлогын бүрэн харагдац */}
                                <div className="flex-grow-1 min-width-0">
                                  <ProblemBodyPreview problem={problem} />
                                </div>

                                {/* AI Summary товч */}
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => handleGenerateSummary(problem)}
                                  disabled={saving || generatingSummaryFor !== null || generatingAll}
                                  title="AI summary үүсгэх"
                                  className="flex-shrink-0"
                                >
                                  {generatingSummaryFor === problem.id
                                    ? <Spinner as="span" size="sm" />
                                    : <Sparkles size={14} />}
                                </Button>

                                {/* Бодлого засах линк */}
                                {(user?.is_staff) && problem.uuid && (
                                  <Link
                                    to={`/problem/${problem.uuid}/edit`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-warning btn-sm flex-shrink-0"
                                    title="Бодлого засах"
                                  >
                                    <Edit3 size={14} />
                                  </Link>
                                )}

                                {/* Солих товч */}
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => handleOpenReplaceModal(index)}
                                  disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                                  title="Өөр бодлогоор солих"
                                  className="flex-shrink-0"
                                >
                                  <ArrowLeftRight size={14} />
                                </Button>

                                {/* Хасах товч */}
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveProblem(problem.id)}
                                  disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                                  className="flex-shrink-0"
                                >
                                  <i className="bi bi-trash" />
                                </Button>
                              </ListGroup.Item>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <ListGroup.Item>
                          <Alert variant="info" className="mb-0">
                            "Бодлого нэмэх" товчийг дарж тестээ бүрдүүлнэ үү.
                          </Alert>
                        </ListGroup.Item>
                      )}
                      {provided.placeholder}
                    </ListGroup>
                  )}
                </Droppable>
              </Card>
            </DragDropContext>
          </Col>

          {/* ── Баруун тал: Тестийн мэдээлэл ── */}
          <Col lg={4}>
            <Card className="mb-3">
              <Card.Header as="h6" className="fw-semibold">Тестийн мэдээлэл</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3" controlId="quizTitle">
                  <Form.Label className="fw-semibold small">
                    <FileText size={14} className="me-1" />Гарчиг
                  </Form.Label>
                  <Form.Control
                    type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizDescription">
                  <Form.Label className="fw-semibold small">
                    <AlignLeft size={14} className="me-1" />Тайлбар
                  </Form.Label>
                  <Form.Control
                    as="textarea" rows={3} value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                    placeholder="Тестийн дэлгэрэнгүй тайлбар, заавар..."
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizTimeLimit">
                  <Form.Label className="fw-semibold small">
                    <Clock size={14} className="me-1" />Хугацааны хязгаар (минут)
                  </Form.Label>
                  <Form.Control
                    type="number" min="1" max="300" value={defaultTimeLimit}
                    onChange={(e) => setDefaultTimeLimit(e.target.value)}
                    disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                    placeholder="Хоосон = хязгааргүй"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="quizGrade">
                  <Form.Label className="fw-semibold small">
                    <GraduationCap size={14} className="me-1" />Зорилтот анги
                  </Form.Label>
                  <Form.Select
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                  >
                    <option value="">— Ангигүй —</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.name || `${g.grade}-р анги`}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  type="switch" id="is-public-switch" label="Нийтэд харагдах"
                  checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}
                />
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={saving || (!warningAcknowledged && wasInitiallyPublic)}>
                    {saving ? (
                      <><Spinner as="span" animation="border" size="sm" className="me-2" />Хадгалж байна...</>
                    ) : (
                      <><Save size={16} className="me-2" />Хадгалах</>
                    )}
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() => { setGenerateSimilarError(null); setShowGenerateSimilarModal(true); }}
                    disabled={saving || selectedProblems.length === 0}
                    title="AI ашиглан энэ тесттэй төстэй шинэ тест үүсгэх"
                  >
                    <Wand2 size={16} className="me-2" />
                    AI төстэй тест үүсгэх
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={handleExportLatex}
                    disabled={exportingLatex || selectedProblems.length === 0}
                    title="Бодлогуудыг LaTeX файл болгон татах"
                  >
                    {exportingLatex ? (
                      <><Spinner as="span" animation="border" size="sm" className="me-2" />Бэлтгэж байна...</>
                    ) : (
                      <><Download size={16} className="me-2" />LaTeX татах (.tex)</>
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={handleClone}
                    disabled={cloning || saving}
                    title="Яг ижил бодлогуудтай хуулбар тест үүсгэх"
                  >
                    {cloning ? (
                      <><Spinner as="span" animation="border" size="sm" className="me-2" />Хуулж байна...</>
                    ) : (
                      <><Copy size={16} className="me-2" />Хуулбар үүсгэх</>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate(`/quiz/${id}`)} disabled={saving}>
                    <X size={16} className="me-2" />Цуцлах
                  </Button>
                  <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)} disabled={saving || isDeleting}>
                    <Trash2 size={16} className="me-2" />Устгах
                  </Button>
                </div>
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* ══ Устгах modal ══════════════════════════════════════════ */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Тест устгах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Та <b>{originalTitle || 'энэ тестийг'}</b> устгахдаа итгэлтэй байна уу?
          <br />
          <small className="text-muted">
            Хэрэв хэн нэгэн хариулсан бол тест устгагдахгүй, зохиогч нь хасагдана.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Цуцлах</Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner as="span" size="sm" className="me-2" /> : <Trash2 size={14} className="me-2" />}
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══ Нийтлэгдсэн тест засварлах анхааруулга ══════════════ */}
      <Modal show={showPublishedWarning} onHide={() => {}} backdrop="static" keyboard={false} centered>
        <Modal.Header className="bg-warning">
          <Modal.Title>⚠️ Анхааруулга</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">Энэ тест <strong>нийтлэгдсэн</strong> байна. Засварлах нь дараах нөлөөтэй:</p>
          <ul className="mb-3">
            <li>Тестийг өмнө нь бөглөсөн хэрэглэгчдийн хариулт өөрчлөгдөж болзошгүй</li>
            <li>Статистик, үр дүн буруу харагдаж болзошгүй</li>
            <li>Идэвхтэй тест бөглөж байгаа хүмүүст асуудал үүсгэж болзошгүй</li>
          </ul>
          <Alert variant="info" className="mb-0">
            <small>Хэрэв та зөвхөн алдаа засах гэж байгаа бол үргэлжлүүлж болно.</small>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => navigate(`/quiz/${id}`)}>Буцах</Button>
          <Button variant="warning" onClick={() => { setShowPublishedWarning(false); setWarningAcknowledged(true); }}>
            Ойлголоо, засварлах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══ Бодлого нэмэх modal ══════════════════════════════════ */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Бодлогын сангаас сонгох</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: '60vh' }}>
          <Form onSubmit={(e) => { e.preventDefault(); fetchAddProblems(addQuery, addTypeFilter, true); }}>
            <InputGroup className="mb-2">
              <Form.Control
                type="text"
                placeholder="Гарчиг, агуулгаар хайх..."
                value={addQuery}
                onChange={(e) => setAddQuery(e.target.value)}
              />
              <Button type="submit" variant="primary" disabled={addLoading}>
                {addLoading ? <Spinner as="span" size="sm" /> : 'Хайх'}
              </Button>
            </InputGroup>
          </Form>

          {/* Төрлийн фильтр */}
          <div className="btn-group btn-group-sm mb-3 w-100" role="group" aria-label="Бодлогын төрлөөр шүүх">
            {[
              { label: 'Бүгд', value: '' },
              { label: 'Сонгох', value: '1' },
              { label: 'Нөхөх', value: '4' },
              { label: 'Уламжлалт', value: '0' },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`btn ${addTypeFilter === value ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setAddTypeFilter(value);
                  fetchAddProblems(addQuery, value, true);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {addLoadError && <Alert variant="danger">{addLoadError}</Alert>}

          <ListGroup variant="flush">
            {addProblems.length > 0
              ? addProblems.map((problem) => {
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
                        onClick={() => handleAddProblem(problem)}
                        disabled={isAdded}
                        className="flex-shrink-0"
                      >
                        {isAdded ? <><i className="bi bi-check-lg" /> Нэмэгдсэн</> : 'Нэмэх'}
                      </Button>
                    </ListGroup.Item>
                  );
                })
              : !addLoading && (
                  <div className="text-center text-muted p-3">Хайлтын үр дүн олдсонгүй.</div>
                )}
            <div ref={addLoadMoreRef} style={{ height: 20 }} />
            {addLoading && (
              <div className="text-center py-3">
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Ачааллаж байна...</span>
              </div>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Хаах</Button>
        </Modal.Footer>
      </Modal>

      {/* ══ AI төстэй тест үүсгэх modal ══════════════════════════ */}
      <Modal
        show={showGenerateSimilarModal}
        onHide={handleCloseSimilarModal}
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="h6">
            <Wand2 size={16} className="me-2" />
            AI төстэй тест үүсгэх
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!generatingSimilar ? (
            <>
              <p className="mb-2">
                AI ашиглан энэ тестийн{' '}
                <strong>{selectedProblems.length} бодлого</strong> тус бүртэй{' '}
                <strong>төстэй, гэхдээ өөр</strong> бодлогуудаар шинэ ноорог тест үүсгэнэ.
              </p>
              <ul className="text-muted small mb-3">
                <li>Ижил математикийн ухагдахуун, арга ашиглана</li>
                <li>Тоо, нөхцөл нь өөр байна</li>
                <li>Бодлого тус бүрд бодолт үүсгэнэ</li>
                <li>Шинэ тест ноорог байдлаар нэн даруй нээгдэнэ</li>
              </ul>
            </>
          ) : (
            <div className="py-2">
              <div className="d-flex align-items-center mb-3">
                <Spinner animation="border" size="sm" className="me-2 text-primary" />
                <span className="text-primary fw-semibold">AI бодлого үүсгэж байна...</span>
              </div>
              {similarProgress.total > 0 && (
                <>
                  <div className="progress mb-2" style={{ height: 8 }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      style={{
                        width: `${Math.round((similarProgress.current / similarProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="text-muted small text-center">
                    {similarProgress.current}/{similarProgress.total} бодлого
                    {similarProgress.title && (
                      <span className="ms-2 fst-italic">— {similarProgress.title}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          {generateSimilarError && (
            <Alert variant="danger" className="mb-0 small mt-2">{generateSimilarError}</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseSimilarModal}
          >
            Цуцлах
          </Button>
          {!generatingSimilar && (
            <Button
              variant="primary"
              onClick={handleGenerateSimilar}
            >
              <Wand2 size={14} className="me-2" />
              Үүсгэх
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* ══ Солих modal ══════════════════════════════════════════ */}
      <Modal show={replacingIndex !== null} onHide={handleCloseReplaceModal} size="lg" scrollable>
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
              fetchReplaceProblems(replaceQuery, replaceCatId, replaceTypeFilter, true);
            }}
          >
            <Row className="g-2 mb-2">
              <Col>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Гарчиг, агуулгаар хайх..."
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                  />
                  <Button type="submit" variant="primary" disabled={replaceLoading}>
                    {replaceLoading ? <Spinner as="span" size="sm" /> : 'Хайх'}
                  </Button>
                </InputGroup>
              </Col>
              <Col xs="auto">
                <Form.Select
                  value={replaceCatId}
                  style={{ minWidth: 160 }}
                  onChange={(e) => {
                    setReplaceCatId(e.target.value);
                    fetchReplaceProblems(replaceQuery, e.target.value, replaceTypeFilter, true);
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

          {/* Төрлийн фильтр */}
          <div className="btn-group btn-group-sm mb-3 w-100" role="group" aria-label="Бодлогын төрлөөр шүүх">
            {[
              { label: 'Бүгд', value: '' },
              { label: 'Сонгох', value: '1' },
              { label: 'Нөхөх', value: '4' },
              { label: 'Уламжлалт', value: '0' },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                className={`btn ${replaceTypeFilter === value ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setReplaceTypeFilter(value);
                  fetchReplaceProblems(replaceQuery, replaceCatId, value, true);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {replaceLoadError && <Alert variant="danger">{replaceLoadError}</Alert>}

          <ListGroup variant="flush">
            {replaceProblems.length > 0
              ? replaceProblems.map((problem) => {
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
                        onClick={() => !isCurrent && !isElsewhere && handleReplaceProblem(problem)}
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
              : !replaceLoading && (
                  <div className="text-center text-muted p-3">Хайлтын үр дүн олдсонгүй.</div>
                )}
            <div ref={replaceLoadMoreRef} style={{ height: 20 }} />
            {replaceLoading && (
              <div className="text-center py-3">
                <Spinner as="span" animation="border" size="sm" />
                <span className="ms-2">Ачааллаж байна...</span>
              </div>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReplaceModal}>Хаах</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QuizEditPage;
