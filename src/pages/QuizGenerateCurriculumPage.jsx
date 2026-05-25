import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Modal from 'react-bootstrap/Modal';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import { Sparkles, BookOpen, CheckSquare, Square, Save, Trash2 } from 'lucide-react';

const LEVELS = [
  { id: 1, name: 'Сэргээн санах' },
  { id: 2, name: 'Ойлгох' },
  { id: 3, name: 'Хэрэглэх' },
  { id: 4, name: 'Задлан шинжлэх' },
  { id: 5, name: 'Үнэлэх' },
  { id: 6, name: 'Бүтээх' },
];

function defaultScores(mcCount, fitbCount) {
  return [
    ...Array(mcCount).fill(2),
    ...Array(fitbCount).fill(7),
  ];
}

export default function QuizGenerateCurriculumPage() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [templates, setTemplates] = useState([]);

  const [programId, setProgramId] = useState('');
  const [weeklyTopics, setWeeklyTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState(new Set());
  const [levelId, setLevelId] = useState('');
  const [mcCount, setMcCount] = useState(5);
  const [fitbCount, setFitbCount] = useState(3);
  const [quizTitle, setQuizTitle] = useState('');
  const [useCustomScores, setUseCustomScores] = useState(false);
  const [customScores, setCustomScores] = useState(defaultScores(5, 3));

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // Save template modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const pendingTaskRef = useRef(null);

  const fetchTemplates = useCallback(() => {
    apiClient.get('/api/integral/quiz-generate-templates/')
      .then(r => setTemplates(r.data?.results || r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.get('/api/curriculum/programs/')
      .then(r => setPrograms(r.data || []))
      .catch(() => setPrograms([]))
      .finally(() => setLoadingPrograms(false));
    fetchTemplates();
    return () => clearInterval(pollRef.current);
  }, [fetchTemplates]);

  useEffect(() => {
    if (!programId) {
      setWeeklyTopics([]);
      setSelectedWeeks(new Set());
      return;
    }
    setLoadingTopics(true);
    apiClient.get('/api/curriculum/admin/weekly-topics/', { params: { program: programId } })
      .then(r => {
        const topics = r.data || [];
        setWeeklyTopics(topics);
        setSelectedWeeks(prev => {
          const available = new Set(topics.map(t => t.week_num));
          return new Set([...prev].filter(w => available.has(w)));
        });
      })
      .catch(() => setWeeklyTopics([]))
      .finally(() => setLoadingTopics(false));
  }, [programId]);

  // customScores array-г mcCount/fitbCount өөрчлөгдөхөд тохируулах
  useEffect(() => {
    setCustomScores(prev => {
      const total = mcCount + fitbCount;
      const next = Array(total).fill(0).map((_, i) => {
        if (prev[i] !== undefined) return prev[i];
        return i < mcCount ? 2 : 7;
      });
      return next;
    });
  }, [mcCount, fitbCount]);

  const toggleWeek = (weekNum) => {
    setSelectedWeeks(prev => {
      const next = new Set(prev);
      next.has(weekNum) ? next.delete(weekNum) : next.add(weekNum);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedWeeks.size === weeklyTopics.length) {
      setSelectedWeeks(new Set());
    } else {
      setSelectedWeeks(new Set(weeklyTopics.map(t => t.week_num)));
    }
  };

  const loadTemplate = (tpl) => {
    if (!tpl) return;
    setProgramId(String(tpl.program_id || ''));
    setSelectedWeeks(new Set(tpl.week_nums || []));
    setLevelId(String(tpl.level_id || ''));
    setMcCount(tpl.mc_count ?? 5);
    setFitbCount(tpl.fitb_count ?? 3);
    setQuizTitle(tpl.quiz_title || '');
    if (tpl.custom_scores && tpl.custom_scores.length > 0) {
      setUseCustomScores(true);
      setCustomScores(tpl.custom_scores);
    } else {
      setUseCustomScores(false);
      setCustomScores(defaultScores(tpl.mc_count ?? 5, tpl.fitb_count ?? 3));
    }
  };

  const deleteTemplate = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Загварыг устгах уу?')) return;
    await apiClient.delete(`/api/integral/quiz-generate-templates/${id}/`);
    fetchTemplates();
  };

  const totalProblems = mcCount + fitbCount;
  const canSubmit = programId && selectedWeeks.size > 0 && totalProblems > 0 && totalProblems <= 40;

  const startPolling = (task_id, total) => {
    pollRef.current = setInterval(async () => {
      try {
        const sr = await apiClient.get(`/api/integral/quizzes/task-status/${task_id}/`);
        const { state, current, total: t, problem_title, new_uuid, error: taskErr } = sr.data;
        if (state === 'PROGRESS') {
          setProgress({ current: current || 0, total: t || total, step: problem_title || '' });
        } else if (state === 'SUCCESS') {
          clearInterval(pollRef.current);
          setGenerating(false);
          pendingTaskRef.current = { new_uuid };
          setShowSaveModal(true);
        } else if (state === 'FAILURE') {
          clearInterval(pollRef.current);
          setError(taskErr || 'Quiz үүсгэхэд алдаа гарлаа.');
          setGenerating(false);
        }
      } catch {
        // poll дахин оролдоно
      }
    }, 3000);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setGenerating(true);
    setProgress({ current: 0, total: totalProblems, step: 'Эхлүүлж байна...' });

    try {
      const res = await apiClient.post('/api/integral/quizzes/generate_from_curriculum/', {
        program_id: Number(programId),
        week_nums: [...selectedWeeks].sort((a, b) => a - b),
        level_id: levelId ? Number(levelId) : null,
        mc_count: Number(mcCount),
        fitb_count: Number(fitbCount),
        quiz_title: quizTitle.trim() || null,
        custom_scores: useCustomScores ? customScores : null,
      });
      const { task_id, total } = res.data;
      setProgress(p => ({ ...p, total }));
      startPolling(task_id, total);
    } catch (err) {
      const msg = err.response?.data?.error || 'Quiz үүсгэхэд алдаа гарлаа.';
      setError(msg);
      setGenerating(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await apiClient.post('/api/integral/quiz-generate-templates/', {
        name: templateName.trim(),
        program_id: Number(programId),
        week_nums: [...selectedWeeks].sort((a, b) => a - b),
        level_id: levelId ? Number(levelId) : null,
        mc_count: Number(mcCount),
        fitb_count: Number(fitbCount),
        quiz_title: quizTitle.trim() || '',
        custom_scores: useCustomScores ? customScores : null,
      });
      fetchTemplates();
    } catch {
      // алдаа үл тоомсорло
    } finally {
      setSavingTemplate(false);
      setShowSaveModal(false);
      setTemplateName('');
      if (pendingTaskRef.current?.new_uuid) {
        navigate(`/quiz/${pendingTaskRef.current.new_uuid}/edit`);
      }
    }
  };

  const handleSkipSave = () => {
    setShowSaveModal(false);
    if (pendingTaskRef.current?.new_uuid) {
      navigate(`/quiz/${pendingTaskRef.current.new_uuid}/edit`);
    }
  };

  const progressPct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const allSelected = weeklyTopics.length > 0 && selectedWeeks.size === weeklyTopics.length;

  const selectedProgram = programs.find(p => String(p.id) === String(programId));

  return (
    <Container className="py-4" style={{ maxWidth: 680 }}>
      <AppBreadcrumb
        items={[
          { label: 'Тестүүд', href: '/quizzes' },
          { label: 'Curriculum-с үүсгэх' },
        ]}
      />

      <h4 className="mb-1 fw-semibold d-flex align-items-center gap-2">
        <BookOpen size={20} className="text-primary" />
        Curriculum-с тест үүсгэх
      </h4>
      <p className="text-muted small mb-4">
        Хөтөлбөрийн сэдвүүдийн дагуу сонгох болон нөхөх бодлоготой тест AI-р үүсгэнэ.
      </p>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Хадгалсан загварууд */}
      {templates.length > 0 && (
        <Card className="shadow-sm mb-3">
          <Card.Body className="py-2 px-3">
            <div className="small fw-medium text-muted mb-2">Хадгалсан загварууд</div>
            <div className="d-flex flex-wrap gap-2">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  className="d-flex align-items-center gap-1 border rounded px-2 py-1"
                  style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                  onClick={() => loadTemplate(tpl)}
                >
                  <span>{tpl.name}</span>
                  <button
                    className="btn btn-link p-0 text-danger"
                    style={{ fontSize: '0.75rem', lineHeight: 1 }}
                    onClick={(e) => deleteTemplate(tpl.id, e)}
                    title="Устгах"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleGenerate}>

            {/* Хөтөлбөр */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Хөтөлбөр</Form.Label>
              {loadingPrograms ? (
                <div className="text-muted small">Хөтөлбөр ачаалж байна...</div>
              ) : (
                <Form.Select
                  value={programId}
                  onChange={e => { setProgramId(e.target.value); setSelectedWeeks(new Set()); }}
                  required
                >
                  <option value="">— Хөтөлбөр сонгох —</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.grade}-р анги — {p.name}
                    </option>
                  ))}
                </Form.Select>
              )}
            </Form.Group>

            {/* Долоо хоногийн сэдвүүд */}
            {programId && (
              <Form.Group className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <Form.Label className="fw-medium mb-0">Долоо хоногийн сэдвүүд</Form.Label>
                  {weeklyTopics.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-decoration-none"
                      onClick={toggleAll}
                    >
                      {allSelected ? (
                        <><CheckSquare size={14} className="me-1" />Бүгдийг болиулах</>
                      ) : (
                        <><Square size={14} className="me-1" />Бүгдийг сонгох</>
                      )}
                    </Button>
                  )}
                </div>

                {loadingTopics ? (
                  <div className="text-muted small d-flex align-items-center gap-2">
                    <Spinner size="sm" /> Сэдвүүд ачаалж байна...
                  </div>
                ) : weeklyTopics.length === 0 ? (
                  <div className="text-muted small">Энэ хөтөлбөрт сэдэв олдсонгүй.</div>
                ) : (
                  <div className="border rounded" style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {weeklyTopics.map((t, i) => {
                      const checked = selectedWeeks.has(t.week_num);
                      return (
                        <label
                          key={t.id}
                          className={`d-flex align-items-start gap-2 px-3 py-2 mb-0 ${
                            i < weeklyTopics.length - 1 ? 'border-bottom' : ''
                          } ${checked ? 'bg-primary bg-opacity-10' : ''}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <Form.Check
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleWeek(t.week_num)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="lh-sm">
                            <span className="text-muted small me-2">
                              {t.week_num}-р долоо хоног
                            </span>
                            <span className="fw-medium small">{t.topic}</span>
                            {t.description && (
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {t.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {selectedWeeks.size > 0 && (
                  <div className="text-muted small mt-1">
                    {selectedWeeks.size} долоо хоног сонгогдсон
                  </div>
                )}
              </Form.Group>
            )}

            {/* Хүндрэлийн түвшин */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Хүндрэлийн түвшин</Form.Label>
              <Form.Select value={levelId} onChange={e => setLevelId(e.target.value)}>
                <option value="">— Автоматаар —</option>
                {LEVELS.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Бодлогын тоо */}
            <Row className="mb-2">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Сонгох тест (MC)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={36}
                    value={mcCount}
                    onChange={e => setMcCount(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Нөхөх тест (FITB)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={40}
                    value={fitbCount}
                    onChange={e => setFitbCount(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="mb-3 small text-muted">
              Нийт: {totalProblems} бодлого (хамгийн ихдээ 40)
            </div>

            {/* Custom оноо */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="use-custom-scores"
                label="Custom оноо тохируулах"
                checked={useCustomScores}
                onChange={e => setUseCustomScores(e.target.checked)}
                className="fw-medium"
              />
              {useCustomScores && totalProblems > 0 && (
                <div className="mt-2 border rounded p-3">
                  <div className="small text-muted mb-2">
                    Бодлого бүрийн оноо (MC default=2, FITB default=7)
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {customScores.map((score, idx) => {
                      const isFitb = idx >= mcCount;
                      return (
                        <div key={idx} style={{ width: 80 }}>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {isFitb ? `FITB ${idx - mcCount + 1}` : `MC ${idx + 1}`}
                          </div>
                          <Form.Control
                            type="number"
                            min={1}
                            max={20}
                            size="sm"
                            value={score}
                            onChange={e => {
                              const v = Number(e.target.value);
                              setCustomScores(prev => {
                                const next = [...prev];
                                next[idx] = v;
                                return next;
                              });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="small text-muted mt-2">
                    Нийт оноо: {customScores.reduce((s, v) => s + (v || 0), 0)}
                  </div>
                </div>
              )}
            </Form.Group>

            {/* Гарчиг */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">
                Тестийн гарчиг <span className="text-muted">(заавал биш)</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Хоосон бол AI автоматаар гарчиг үүсгэнэ"
                value={quizTitle}
                onChange={e => setQuizTitle(e.target.value)}
                maxLength={120}
              />
            </Form.Group>

            {/* Progress */}
            {generating && (
              <div className="mb-4">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>{progress.step || 'AI бодлого үүсгэж байна...'}</span>
                  <span>
                    {progress.current > 0
                      ? `${progress.current} / ${progress.total}`
                      : 'Хүлээж байна...'}
                  </span>
                </div>
                <ProgressBar
                  now={progress.current > 0 ? progressPct : 100}
                  animated
                  striped
                  variant={progress.current > 0 ? 'primary' : 'info'}
                  style={{ height: 8 }}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={generating || !canSubmit}
              className="w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {generating ? (
                <>
                  <Spinner size="sm" />
                  Үүсгэж байна...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI-р тест үүсгэх
                </>
              )}
            </Button>

          </Form>
        </Card.Body>
      </Card>

      {/* Загвар хадгалах modal */}
      <Modal show={showSaveModal} onHide={handleSkipSave} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-semibold d-flex align-items-center gap-2">
            <Save size={16} />
            Загвар болгон хадгалах уу?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            Энэ тохиргоог загвар болгон хадгалбал дараагийн удаа хурдан ашиглаж болно.
          </p>
          <Form.Group>
            <Form.Label className="small fw-medium">Загварын нэр</Form.Label>
            <Form.Control
              type="text"
              placeholder="Жишээ: 10-р анги долоо хоног 1-4"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              maxLength={120}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTemplate(); }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={handleSkipSave}>
            Хадгалахгүй
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveTemplate}
            disabled={savingTemplate || !templateName.trim()}
          >
            {savingTemplate ? <Spinner size="sm" /> : <><Save size={14} className="me-1" />Хадгалах</>}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
