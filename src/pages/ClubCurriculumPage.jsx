// Club Curriculum Page — Multiple programs with start_date & current_week
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import { CalendarDays, GraduationCap, Sparkles, Plus, X, RotateCcw, FileText, Send, Target, Wand2 } from 'lucide-react';
import Modal from 'react-bootstrap/Modal';
import { generateWeeklyArticle, getWeeklyTopics, getPrograms, addProgram, removeProgram, setWeek } from '../services/clubsService';
import apiClient from '../api/axiosConfig';

const RESOURCE_TYPE_LABELS = {
  article: 'Өгүүлэл',
  problem: 'Бодлого',
  pdf: 'PDF',
  link: 'Линк',
  video: 'Видео',
  quiz: 'Quiz',
};

const RESOURCE_TYPE_COLORS = {
  problem: 'secondary',
  formula: 'info',
  article: 'danger',
  quiz: 'success',
  pdf: 'dark',
  video: 'primary',
  link: 'warning',
};

const ClubCurriculumPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin, showToast } = useOutletContext();
  const [generatingKey, setGeneratingKey] = useState(null); // "programId-weekNum"
  const [weeklyTopics, setWeeklyTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [allPrograms, setAllPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [addingProgram, setAddingProgram] = useState(false);
  const [startDate, setStartDate] = useState('');

  // Хөтөлбөр үүсгэх modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({ program_name: '', grade: '', weeks_count: 8, hours_per_week: 2, start_date: '' });
  const [generating, setGenerating] = useState(false);

  const programsInfo = clubData?.curriculum_programs_info || [];

  const fetchTopics = () => {
    if (!clubData?.id || programsInfo.length === 0) return;
    setTopicsLoading(true);
    getWeeklyTopics(clubData.id)
      .then(setWeeklyTopics)
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  };

  useEffect(() => {
    fetchTopics();
  }, [clubData?.id, programsInfo.length]);

  useEffect(() => {
    if (isTeacherOrAdmin) {
      getPrograms().then(setAllPrograms).catch(() => {});
    }
  }, [isTeacherOrAdmin]);

  const addablePrograms = allPrograms.filter(
    p => !programsInfo.some(pi => pi.id === p.id)
  );

  const handleAddProgram = async () => {
    if (!selectedProgramId) return;
    try {
      setAddingProgram(true);
      await addProgram(clubData.id, parseInt(selectedProgramId));
      if (startDate) {
        await setWeek(clubData.id, { program_id: parseInt(selectedProgramId), start_date: startDate });
      }
      showToast?.('Хөтөлбөр амжилттай нэмэгдлээ', 'success');
      setSelectedProgramId('');
      setStartDate('');
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Хөтөлбөр нэмэхэд алдаа гарлаа', 'danger');
    } finally {
      setAddingProgram(false);
    }
  };

  const handleRemoveProgram = async (programId, programName) => {
    if (!window.confirm(`"${programName}" хөтөлбөрийг хасахдаа итгэлтэй байна уу?`)) return;
    try {
      await removeProgram(clubData.id, programId);
      showToast?.('Хөтөлбөр амжилттай хасагдлаа', 'success');
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Хөтөлбөр хасахад алдаа гарлаа', 'danger');
    }
  };

  const handleSetWeek = async (programId, weekNum) => {
    try {
      await setWeek(clubData.id, { program_id: programId, current_week: weekNum });
      showToast?.(`${weekNum}-р долоо хоног руу амжилттай шилжлээ`, 'success');
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Долоо хоног өөрчлөхөд алдаа гарлаа', 'danger');
    }
  };

  const handleResetAutoWeek = async (programId) => {
    try {
      await setWeek(clubData.id, { program_id: programId, is_auto_week: true });
      showToast?.('Автомат горимд шилжлээ', 'success');
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Алдаа гарлаа', 'danger');
    }
  };

  const handleGenerateCurriculum = async () => {
    if (!genForm.program_name.trim() || !genForm.grade) return;
    setGenerating(true);
    try {
      const payload = {
        program_name: genForm.program_name.trim(),
        grade: parseInt(genForm.grade),
        weeks_count: genForm.weeks_count,
        hours_per_week: genForm.hours_per_week,
      };
      if (genForm.start_date) payload.start_date = genForm.start_date;
      await apiClient.post(`/api/clubs/${clubData.id}/generate_curriculum/`, payload);
      showToast?.('Хөтөлбөр амжилттай үүсгэгдлээ!', 'success');
      setShowGenModal(false);
      setGenForm({ program_name: '', grade: '', weeks_count: 8, hours_per_week: 2, start_date: '' });
      clubActions?.onUpdate?.();
      fetchTopics();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'Хөтөлбөр үүсгэхэд алдаа гарлаа', 'danger');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateArticle = async (w) => {
    const hasArticle = w.resources?.some(r => r.resource_type === 'article');
    const msg = hasArticle
      ? `«${w.topic}» өгүүллийг клубд нийтлэх үү?`
      : `${w.week_num}-р долоо хоногийн «${w.topic}» сэдвээр AI өгүүлэл бэлдэж клубд нийтлэх үү?\n\nЭнэ хэдэн секунд болно.`;
    if (!window.confirm(msg)) return;
    const key = `${w.program_id}-${w.week_num}`;
    try {
      setGeneratingKey(key);
      const result = await generateWeeklyArticle(clubData.id, {
        programId: w.program_id,
        weekNum: w.week_num,
      });
      showToast?.(result.detail || 'AI өгүүлэл амжилттай нийтлэгдлээ!', 'success');
      fetchTopics();
      clubActions?.onUpdate?.();
    } catch (err) {
      showToast?.(err.response?.data?.detail || 'AI өгүүлэл үүсгэхэд алдаа гарлаа', 'danger');
    } finally {
      setGeneratingKey(null);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Хөтөлбөр</h4>
        {isTeacherOrAdmin && (
          <Button variant="primary" size="sm" onClick={() => setShowGenModal(true)}>
            <Wand2 size={14} className="me-1" />Хөтөлбөр үүсгэх
          </Button>
        )}
      </div>

      {/* Хөтөлбөр нэмэх/хасах (багш нарт) */}
      {isTeacherOrAdmin && (
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-white border-bottom">
            <h6 className="mb-0 fw-bold">
              <GraduationCap size={16} className="me-2" />
              Сургалтын хөтөлбөрүүд ({programsInfo.length})
            </h6>
          </Card.Header>
          <Card.Body>
            {programsInfo.length > 0 ? (
              <div className="mb-3">
                {programsInfo.map(p => (
                  <div key={p.id} className="border rounded p-2 mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-medium">{p.name}</span>
                        <Badge bg="secondary" className="small">{p.grade}-р анги</Badge>
                        {p.academic_year && <span className="small text-muted">{p.academic_year}</span>}
                        {p.hours_per_week && <span className="small text-muted">{p.hours_per_week} цаг/7хон</span>}
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveProgram(p.id, p.name)}
                        title="Хөтөлбөр хасах"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="small text-muted">
                        Эхэлсэн: {new Date(p.start_date).toLocaleDateString('mn-MN')}
                      </span>
                      <span className="small text-muted">·</span>
                      <Form.Select
                        size="sm"
                        style={{ maxWidth: '280px' }}
                        value={p.current_week}
                        onChange={(e) => handleSetWeek(p.id, parseInt(e.target.value))}
                      >
                        {(() => {
                          const programTopics = weeklyTopics.filter(w => w.program_id === p.id);
                          if (programTopics.length === 0) {
                            return <option value={p.current_week}>{p.current_week}-р долоо хоног</option>;
                          }
                          return programTopics.map(w => (
                            <option key={w.week_num} value={w.week_num}>
                              {w.week_num}-р долоо хоног{w.topic ? ` — ${w.topic}` : ''}
                            </option>
                          ));
                        })()}
                      </Form.Select>
                      {!p.is_auto_week && (
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="py-0 px-1"
                          onClick={() => handleResetAutoWeek(p.id)}
                          title="Автомат горимд шилжих"
                        >
                          <RotateCcw size={12} className="me-1" />
                          <span className="small">Автомат</span>
                        </Button>
                      )}
                      {p.is_auto_week && (
                        <span className="small text-muted">(автомат)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-3">Хөтөлбөр нэмэгдээгүй байна</p>
            )}

            {addablePrograms.length > 0 && (
              <div className="d-flex gap-2 flex-wrap">
                <Form.Select
                  size="sm"
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  style={{ maxWidth: '300px' }}
                >
                  <option value="">— Хөтөлбөр сонгох —</option>
                  {addablePrograms.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.grade}-р анги — {p.name}
                      {p.academic_year ? ` (${p.academic_year})` : ''}
                      {p.hours_per_week ? ` · ${p.hours_per_week} цаг/7хон` : ''}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="date"
                  size="sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Эхлэх огноо"
                  style={{ maxWidth: '160px' }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddProgram}
                  disabled={!selectedProgramId || addingProgram}
                >
                  {addingProgram ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <><Plus size={14} className="me-1" />Нэмэх</>
                  )}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Хөтөлбөрүүдийн мэдээлэл (гишүүдэд) */}
      {!isTeacherOrAdmin && programsInfo.length > 0 && (
        <Card className="shadow-sm mb-3 border-primary border-opacity-25">
          <Card.Body>
            {programsInfo.map(p => (
              <div key={p.id} className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <GraduationCap size={16} className="text-primary" />
                <span className="fw-semibold">{p.name}</span>
                <Badge bg="secondary" className="small">{p.grade}-р анги</Badge>
                <Badge bg="primary" className="small">{p.current_week}-р долоо хоног</Badge>
                {p.hours_per_week && <span className="small text-muted">· {p.hours_per_week} цаг/7 хоног</span>}
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Долоо хоногийн сэдвүүд (AI товч + resources) */}
      {programsInfo.length > 0 && (
        <Card className="shadow-sm mb-3">
          <Card.Header className="bg-white border-bottom">
            <h6 className="mb-0 fw-bold">
              <CalendarDays size={16} className="me-2" />
              Долоо хоногийн сэдвүүд
            </h6>
          </Card.Header>
          <Card.Body className="p-0">
            {topicsLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
              </div>
            ) : weeklyTopics.length === 0 ? (
              <div className="text-center py-3 text-muted small">
                Сэдэв тохируулагдаагүй байна
              </div>
            ) : (
              <ListGroup variant="flush">
                {weeklyTopics.map((w, idx) => {
                  const key = `${w.program_id}-${w.week_num}`;
                  const isGenerating = generatingKey === key;
                  return (
                    <ListGroup.Item
                      key={`${w.program_id || ''}-${w.week_num}-${idx}`}
                      className={`py-2 px-3 ${w.is_current ? 'bg-success bg-opacity-10' : ''}`}
                    >
                      <div className="d-flex align-items-start gap-2">
                        <span className={`small fw-semibold flex-shrink-0 ${w.is_current ? 'text-success' : w.is_past ? 'text-muted' : ''}`}
                          style={{ minWidth: '2.5rem' }}>
                          {w.week_num}-р
                        </span>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {w.topic ? (
                                <span className={`small ${w.is_past ? 'text-muted' : ''}`}>{w.topic}</span>
                              ) : (
                                <span className="small text-muted fst-italic">Сэдэв байхгүй</span>
                              )}
                              {w.is_current && <Badge bg="success" className="small">Одоо</Badge>}
                              {w.hours > 0 && (
                                <span className="small text-muted">({w.hours} цаг)</span>
                              )}
                              {programsInfo.length > 1 && w.program_name && (
                                <Badge bg="light" text="dark" className="small">{w.program_name}</Badge>
                              )}
                            </div>
                            {/* AI өгүүлэл үүсгэх / нийтлэх товч (багшид) */}
                            {isTeacherOrAdmin && w.topic && (() => {
                              const hasArticle = w.resources?.some(r => r.resource_type === 'article');
                              return (
                                <Button
                                  variant={hasArticle ? 'outline-success' : 'outline-primary'}
                                  size="sm"
                                  className="py-0 px-2"
                                  onClick={() => handleGenerateArticle(w)}
                                  disabled={isGenerating || generatingKey !== null}
                                  title={hasArticle ? 'Клубд нийтлэх' : 'AI өгүүлэл үүсгэж нийтлэх'}
                                >
                                  {isGenerating ? (
                                    <Spinner animation="border" size="sm" />
                                  ) : hasArticle ? (
                                    <Send size={12} />
                                  ) : (
                                    <Sparkles size={12} />
                                  )}
                                </Button>
                              );
                            })()}
                          </div>
                          {/* Суралцахуйн зорилтууд */}
                          {w.objectives && w.objectives.length > 0 && (
                            <Accordion flush className="mt-1 objectives-accordion">
                              <Accordion.Item eventKey={key} className="border-0 bg-transparent">
                                <Accordion.Header className="p-0">
                                  <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                    <Target size={10} />
                                    Зорилт ({w.objectives.length})
                                  </span>
                                </Accordion.Header>
                                <Accordion.Body className="p-0 pt-1 ps-2">
                                  <ul className="list-unstyled mb-0">
                                    {w.objectives.map((obj, i) => (
                                      <li key={i} className="small text-muted mb-1 d-flex align-items-start gap-1">
                                        <span className="text-success flex-shrink-0">•</span>
                                        <span>{obj}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </Accordion.Body>
                              </Accordion.Item>
                            </Accordion>
                          )}
                          {/* Resources */}
                          {w.resources && w.resources.length > 0 && (
                            <div className="mt-1 d-flex flex-wrap gap-1">
                              {w.resources.map(r => {
                                const bgColor = RESOURCE_TYPE_COLORS[r.resource_type] || 'info';
                                const typeLabel = RESOURCE_TYPE_LABELS[r.resource_type] || r.resource_type;
                                return (
                                  <Link
                                    key={r.id}
                                    to={r.url}
                                    className="text-decoration-none"
                                  >
                                    <Badge bg={bgColor} className="small fw-normal d-inline-flex align-items-center gap-1">
                                      <FileText size={10} />
                                      <span className="fw-semibold">{typeLabel}:</span>
                                      {r.title.length > 40 ? r.title.slice(0, 40) + '...' : r.title}
                                    </Badge>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}

      {/* ── Хөтөлбөр үүсгэх Modal ── */}
      <Modal show={showGenModal} onHide={() => setShowGenModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 d-flex align-items-center gap-2">
            <Wand2 size={16} />AI хөтөлбөр үүсгэх
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Хөтөлбөрийн нэр</Form.Label>
            <Form.Control
              size="sm"
              placeholder="жишээ: Математик"
              value={genForm.program_name}
              onChange={e => setGenForm(f => ({ ...f, program_name: e.target.value }))}
            />
          </Form.Group>
          <div className="d-flex gap-2 mb-3">
            <Form.Group style={{ flex: 1 }}>
              <Form.Label className="small fw-medium">Анги</Form.Label>
              <Form.Select size="sm" value={genForm.grade}
                onChange={e => setGenForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">— Анги сонгох —</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g}-р анги</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ flex: 1 }}>
              <Form.Label className="small fw-medium">Цаг/7хоног</Form.Label>
              <Form.Control
                type="number" size="sm" min={1} max={10}
                value={genForm.hours_per_week}
                onChange={e => setGenForm(f => ({ ...f, hours_per_week: parseInt(e.target.value) || 2 }))}
              />
            </Form.Group>
          </div>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-medium">Долоо хоногийн тоо: <strong>{genForm.weeks_count}</strong></Form.Label>
            <Form.Range min={1} max={32} value={genForm.weeks_count}
              onChange={e => setGenForm(f => ({ ...f, weeks_count: parseInt(e.target.value) }))} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label className="small fw-medium">Эхлэх огноо</Form.Label>
            <Form.Control
              type="date" size="sm"
              value={genForm.start_date}
              onChange={e => setGenForm(f => ({ ...f, start_date: e.target.value }))}
            />
          </Form.Group>
          <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
            AI {genForm.weeks_count} долоо хоногийн сэдэв болон суралцахуйн зорилго боловсруулна. Хэсэг хугацаа шаардагдана.
          </Form.Text>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowGenModal(false)}>Болих</Button>
          <Button
            variant="primary" size="sm"
            onClick={handleGenerateCurriculum}
            disabled={generating || !genForm.program_name.trim() || !genForm.grade}
          >
            {generating ? (
              <><Spinner animation="border" size="sm" className="me-1" />Боловсруулж байна...</>
            ) : (
              <><Wand2 size={14} className="me-1" />Үүсгэх</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClubCurriculumPage;
