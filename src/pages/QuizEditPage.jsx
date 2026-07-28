// frontend/src/pages/QuizEditPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { Edit3 } from 'lucide-react';

import { QuizProblemsList } from '../components/quizEdit/QuizProblemsList.jsx';
import { QuizInfoSidebar } from '../components/quizEdit/QuizInfoSidebar.jsx';
import { DeleteQuizModal } from '../components/quizEdit/DeleteQuizModal.jsx';
import { PublishedWarningModal } from '../components/quizEdit/PublishedWarningModal.jsx';
import { AddProblemModal } from '../components/quizEdit/AddProblemModal.jsx';
import { ReplaceProblemModal } from '../components/quizEdit/ReplaceProblemModal.jsx';
import { GenerateSimilarModal } from '../components/quizEdit/GenerateSimilarModal.jsx';
import { ShuffleChoicePositionsModal } from '../components/quizEdit/ShuffleChoicePositionsModal.jsx';

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

  // ── Auto-save state ───────────────────────────────────────────
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState(null);

  // ── AI Summary state ──────────────────────────────────────────
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState({ current: 0, total: 0 });

  // ── Math categories (нэг удаа fetch) ─────────────────────────
  const [mathCategories, setMathCategories] = useState([]);

  // ── "Бодлого нэмэх" Modal ─────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);

  // ── "Солих" Modal ─────────────────────────────────────────────
  const [replacingIndex, setReplacingIndex] = useState(null);   // солигдох бодлогын index
  const replacingProblem = replacingIndex !== null ? selectedProblems[replacingIndex] : null;

  // ── "Зөв хариултын байрлал жигдлэх" Modal (зөвхөн is_staff) ────
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleResult, setShuffleResult] = useState(null);
  const [shuffleError, setShuffleError] = useState(null);

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
        const res = await apiClient.get('/api/integral/math-categories/', {
          params: { has_problems: true },
        });
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
        if (data.category) updates.category = data.category;
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

  const handleSimilarSuccess = (newUuid) => {
    setShowGenerateSimilarModal(false);
    navigate(`/quiz/${newUuid}/edit`);
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

  const handleAddProblem = (problem) => {
    if (!selectedProblems.find((p) => p.id === problem.id))
      setSelectedProblems((prev) => [...prev, problem]);
  };

  const handleOpenReplaceModal = (index) => {
    setReplacingIndex(index);
  };

  const handleCloseReplaceModal = () => {
    setReplacingIndex(null);
  };

  const handleReplaceProblem = async (newProblem) => {
    if (replacingIndex === null) return;
    const existsElsewhere = selectedProblems.some(
      (p, i) => p.id === newProblem.id && i !== replacingIndex
    );
    if (existsElsewhere) return;

    const newProblems = [...selectedProblems];
    newProblems[replacingIndex] = newProblem;
    setSelectedProblems(newProblems);
    handleCloseReplaceModal();

    setAutoSaving(true);
    setAutoSaveError(null);
    try {
      await apiClient.patch(`/api/integral/quizzes/${id}/`, {
        problems: newProblems.map((p) => p.uuid),
      });
    } catch {
      setAutoSaveError('Хадгалахад алдаа гарлаа.');
    } finally {
      setAutoSaving(false);
    }
  };

  // ── Зөв хариултын байрлал жигдлэх (зөвхөн is_staff) ────────────
  const handleOpenShuffleModal = () => {
    setShuffleResult(null);
    setShuffleError(null);
    setShowShuffleModal(true);
  };

  const handleCloseShuffleModal = () => {
    if (isShuffling) return;
    setShowShuffleModal(false);
  };

  const handleConfirmShuffle = async () => {
    setIsShuffling(true);
    setShuffleError(null);
    try {
      const res = await apiClient.post(`/api/integral/quizzes/${id}/shuffle-choice-positions/`);
      setShuffleResult(res.data);
      // Бодлогуудын сонголтын байрлал өөрчлөгдсөн тул тестийн мэдээллийг дахин татна
      const quizRes = await apiClient.get(`/api/integral/quizzes/${id}/`);
      setSelectedProblems(quizRes.data.problems || []);
    } catch (err) {
      setShuffleError(err.response?.data?.error || 'Байрлал жигдлэхэд алдаа гарлаа.');
    } finally {
      setIsShuffling(false);
    }
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
            <QuizProblemsList
              selectedProblems={selectedProblems}
              autoSaving={autoSaving}
              autoSaveError={autoSaveError}
              generatingAll={generatingAll}
              generateAllProgress={generateAllProgress}
              generatingSummaryFor={generatingSummaryFor}
              saving={saving}
              warningAcknowledged={warningAcknowledged}
              wasInitiallyPublic={wasInitiallyPublic}
              user={user}
              onDragEnd={handleDragEnd}
              onGenerateAllMissing={handleGenerateAllMissing}
              onGenerateSummary={handleGenerateSummary}
              onOpenReplaceModal={handleOpenReplaceModal}
              onRemoveProblem={handleRemoveProblem}
              onShowAddModal={() => setShowAddModal(true)}
              onShowShuffleChoicePositionsModal={handleOpenShuffleModal}
            />
          </Col>

          {/* ── Баруун тал: Тестийн мэдээлэл ── */}
          <Col lg={4}>
            <QuizInfoSidebar
              title={title} setTitle={setTitle}
              description={description} setDescription={setDescription}
              defaultTimeLimit={defaultTimeLimit} setDefaultTimeLimit={setDefaultTimeLimit}
              gradeId={gradeId} setGradeId={setGradeId}
              grades={grades}
              isPublic={isPublic} setIsPublic={setIsPublic}
              saving={saving}
              warningAcknowledged={warningAcknowledged}
              wasInitiallyPublic={wasInitiallyPublic}
              error={error}
              selectedProblemsCount={selectedProblems.length}
              exportingLatex={exportingLatex}
              cloning={cloning}
              isDeleting={isDeleting}
              onExportLatex={handleExportLatex}
              onClone={handleClone}
              onShowGenerateSimilar={() => setShowGenerateSimilarModal(true)}
              onCancel={() => navigate(`/quiz/${id}`)}
              onShowDeleteModal={() => setShowDeleteModal(true)}
            />
          </Col>
        </Row>
      </Form>

      <DeleteQuizModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={originalTitle}
      />

      <PublishedWarningModal
        show={showPublishedWarning}
        onBack={() => navigate(`/quiz/${id}`)}
        onAcknowledge={() => { setShowPublishedWarning(false); setWarningAcknowledged(true); }}
      />

      <AddProblemModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        selectedProblems={selectedProblems}
        onAddProblem={handleAddProblem}
      />

      <GenerateSimilarModal
        show={showGenerateSimilarModal}
        onHide={() => setShowGenerateSimilarModal(false)}
        quizId={id}
        problemCount={selectedProblems.length}
        onSuccess={handleSimilarSuccess}
      />

      <ReplaceProblemModal
        replacingIndex={replacingIndex}
        replacingProblem={replacingProblem}
        selectedProblems={selectedProblems}
        mathCategories={mathCategories}
        onHide={handleCloseReplaceModal}
        onReplace={handleReplaceProblem}
      />

      <ShuffleChoicePositionsModal
        show={showShuffleModal}
        onHide={handleCloseShuffleModal}
        onConfirm={handleConfirmShuffle}
        isShuffling={isShuffling}
        result={shuffleResult}
        error={shuffleError}
      />
    </Container>
  );
};

export default QuizEditPage;
