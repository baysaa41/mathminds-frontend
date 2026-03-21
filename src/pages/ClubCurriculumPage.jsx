// Club Curriculum Page — Multiple programs with start_date & current_week
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import { CalendarDays, GraduationCap, Sparkles, Plus, X, RotateCcw, FileText, ExternalLink } from 'lucide-react';
import { generateWeeklyArticle, getWeeklyTopics, getPrograms, addProgram, removeProgram, setWeek } from '../services/clubsService';

const RESOURCE_TYPE_LABELS = {
  article: 'Өгүүлэл',
  problem: 'Бодлого',
  pdf: 'PDF',
  link: 'Линк',
  video: 'Видео',
  quiz: 'Quiz',
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

  const handleGenerateArticle = async (w) => {
    if (!window.confirm(
      `${w.week_num}-р долоо хоногийн «${w.topic}» сэдвээр AI өгүүлэл бэлдэж клубд нийтлэх үү?\n\nЭнэ хэдэн секунд болно.`
    )) return;
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
      <h4 className="mb-3">Хөтөлбөр</h4>

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
                            {/* AI өгүүлэл үүсгэх товч (багшид) */}
                            {isTeacherOrAdmin && w.topic && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="py-0 px-2"
                                onClick={() => handleGenerateArticle(w)}
                                disabled={isGenerating || generatingKey !== null}
                                title="AI өгүүлэл үүсгэх"
                              >
                                {isGenerating ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                              </Button>
                            )}
                          </div>
                          {/* Resources */}
                          {w.resources && w.resources.length > 0 && (
                            <div className="mt-1 d-flex flex-wrap gap-1">
                              {w.resources.map(r => (
                                <Link
                                  key={r.id}
                                  to={r.url}
                                  className="text-decoration-none"
                                >
                                  <Badge bg="info" className="small fw-normal d-inline-flex align-items-center gap-1">
                                    <FileText size={10} />
                                    {r.title.length > 40 ? r.title.slice(0, 40) + '...' : r.title}
                                  </Badge>
                                </Link>
                              ))}
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

    </div>
  );
};

export default ClubCurriculumPage;
