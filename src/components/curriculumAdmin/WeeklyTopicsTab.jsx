// src/components/curriculumAdmin/WeeklyTopicsTab.jsx
// CurriculumAdminPage-ийн "Долоо хоногийн сэдвүүд" таб

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner, Collapse } from 'react-bootstrap';
import {
  Plus, Pencil, Trash2, BookOpen,
  ChevronDown, ChevronUp, Sparkles, FileText,
  MessageCircle, X as XIcon, Search,
} from 'lucide-react';
import * as svc from '../../services/curriculumAdminService';
import { resolveResourceHref } from '../../utils/resourceLink';
import ConfirmModal from './ConfirmModal.jsx';
import SaveButton from './SaveButton.jsx';
import ObjectivesEditor from './ObjectivesEditor.jsx';
import ResourcesEditor from './ResourcesEditor.jsx';
import ArticleImproveModal from './ArticleImproveModal.jsx';

export default function WeeklyTopicsTab({ programs }) {
  const [filterProgram, setFilterProgram] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState([]);
  const [globalResults, setGlobalResults] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [generatingId, setGeneratingId] = useState(null);
  const [improveTopic, setImproveTopic] = useState(null);
  const [improveArticleUuid, setImproveArticleUuid] = useState(null);

  const toggleExpand = (id) =>
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ week_num: '', hours: 0, program: '', topic: '', description: '', is_published: false });
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!filterProgram) return;
    setLoading(true);
    try {
      const params = { program: filterProgram };
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch {
      setError('Ачааллахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [filterProgram]);

  useEffect(() => { load(); }, [load]);

  // Global search: товч дарах эсвэл Enter дарахад хайна
  useEffect(() => {
    if (filterProgram || !searchQuery) { setGlobalResults([]); return; }
    setGlobalLoading(true);
    svc.getWeeklyTopics({ search: searchQuery })
      .then(res => setGlobalResults(res.data))
      .catch(() => setGlobalResults([]))
      .finally(() => setGlobalLoading(false));
  }, [searchQuery, filterProgram]);

  const handleGlobalSearch = () => {
    const q = searchText.trim();
    if (q) setSearchQuery(q);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleGlobalSearch(); }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchQuery('');
    setGlobalResults([]);
  };

  const openCreate = () => {
    setEditing(null);
    // Дараагийн долоо хоногийн дугаарыг автомат олох
    const maxWeekNum = topics.reduce((max, t) => Math.max(max, t.week_num || 0), 0);
    setForm({
      week_num: maxWeekNum + 1,
      hours: 0,
      program: filterProgram || '',
      topic: '',
      description: '',
      is_published: false,
    });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      week_num: t.week_num,
      hours: t.hours || 0,
      program: t.program,
      topic: t.topic,
      description: t.description,
      is_published: t.is_published,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await svc.updateWeeklyTopic(editing.id, form);
      else await svc.createWeeklyTopic(form);
      setShowModal(false);
      await load();
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await svc.deleteWeeklyTopic(confirmId);
      setConfirmId(null);
      await load();
    } catch {
      setError('Устгахад алдаа гарлаа');
    } finally {
      setDeleting(false);
    }
  };

  const refreshTopic = useCallback(async () => {
    try {
      const params = { program: filterProgram };
      const res = await svc.getWeeklyTopics(params);
      setTopics(res.data);
    } catch { /* ignore */ }
  }, [filterProgram]);

  const handleGenerateArticle = async (t) => {
    if (!window.confirm(
      `${t.week_num}-р долоо хоногийн «${t.topic}» сэдвээр AI өгүүлэл үүсгэх үү?\n\nПостлохгүй, зөвхөн өгүүлэл үүсгэнэ.`
    )) return;
    setGeneratingId(t.id);
    try {
      const res = await svc.generateArticle(t.id);
      setError('');
      await load();
      alert(res.data.detail || 'AI өгүүлэл амжилттай үүсгэгдлээ.');
    } catch (err) {
      setError(err.response?.data?.detail || 'AI өгүүлэл үүсгэхэд алдаа гарлаа');
    } finally {
      setGeneratingId(null);
    }
  };

  const selectedProgram = programs.find(p => String(p.id) === String(filterProgram));

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Row className="mb-3 g-2 align-items-end">
        <Col md={5}>
          <Form.Label className="small mb-1">Хөтөлбөр</Form.Label>
          <Form.Select size="sm" value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setSearchText(''); }}>
            <option value="">— сонгох —</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.grade}-р анги · {p.name}
                {p.academic_year ? ` (${p.academic_year})` : ''}
                {p.hours_per_week ? ` · ${p.hours_per_week} цаг/7хон` : ''}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label className="small mb-1">Хайх</Form.Label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white">
              <Search size={13} className="text-muted" />
            </span>
            <Form.Control
              size="sm"
              placeholder="Сэдвийн нэрээр хайх..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            {(searchText || searchQuery) && (
              <Button
                variant="outline-secondary" size="sm"
                onClick={handleClearSearch}
                title="Цэвэрлэх"
              >
                <XIcon size={12} />
              </Button>
            )}
            {!filterProgram && (
              <Button
                variant="outline-primary" size="sm"
                onClick={handleGlobalSearch}
                disabled={!searchText.trim()}
              >
                <Search size={13} />
              </Button>
            )}
          </div>
        </Col>
        <Col md="auto">
          <Button
            size="sm" variant="primary"
            onClick={openCreate}
            disabled={!filterProgram}
            title={!filterProgram ? 'Эхлээд хөтөлбөрийг сонгоно уу' : ''}
          >
            <Plus size={14} className="me-1" />Сэдэв нэмэх
          </Button>
        </Col>
      </Row>

      {/* Program info */}
      {selectedProgram && (
        <div className="small text-muted mb-2">
          {selectedProgram.hours_per_week} цаг/долоо хоног
          {selectedProgram.total_hours ? ` · Нийт ${selectedProgram.total_hours} цаг` : ''}
          {selectedProgram.academic_year ? ` · ${selectedProgram.academic_year}` : ''}
        </div>
      )}

      {/* No program selected — global search or prompt */}
      {!filterProgram && (
        <>
          {!searchQuery && (
            <div className="text-center text-muted py-5">
              <BookOpen size={40} className="mb-2 opacity-25" />
              <p>Хөтөлбөрийг сонгох эсвэл хайлт хийнэ үү</p>
            </div>
          )}
          {searchQuery && (
            <>
              {globalLoading && <div className="text-center py-3"><Spinner /></div>}
              {!globalLoading && (
                <>
                  <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">
                      <Search size={12} className="me-1" />
                      «{searchQuery}» — {globalResults.length} сэдэв олдлоо
                    </small>
                  </div>
                  {globalResults.length === 0 && (
                    <Alert variant="warning">Хайлтад тохирох сэдэв олдсонгүй.</Alert>
                  )}
                  <div className="d-flex flex-column gap-2">
                    {globalResults.map(t => {
                      const isOpen = !!expandedTopics[t.id];
                      return (
                        <Card key={t.id} className="border">
                          <div
                            className="d-flex align-items-center px-3 py-2 gap-2"
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={() => toggleExpand(t.id)}
                          >
                            <span className="text-muted flex-shrink-0">
                              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                            <Badge bg="secondary" className="flex-shrink-0">
                              {t.program_grade}-р анги
                            </Badge>
                            <Badge bg="light" text="dark" className="flex-shrink-0 border small">
                              {t.program_name}
                            </Badge>
                            <Badge bg="outline-secondary" className="flex-shrink-0 border text-muted">
                              {t.week_num}-р 7 хоног
                            </Badge>
                            <span className="flex-grow-1 text-truncate small fw-medium">{t.topic}</span>
                            <Badge
                              bg={t.is_published ? 'success' : 'warning'}
                              text={t.is_published ? undefined : 'dark'}
                              className="flex-shrink-0"
                            >
                              {t.is_published ? 'Нийтлэгдсэн' : 'Ноорог'}
                            </Badge>
                            <div className="flex-shrink-0 d-flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button size="sm" variant="outline-secondary" className="p-1"
                                onClick={() => openEdit(t)}>
                                <Pencil size={12} />
                              </Button>
                              <Button size="sm" variant="outline-danger" className="p-1"
                                onClick={() => setConfirmId(t.id)}>
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                          <Collapse in={isOpen}>
                            <div>
                              <Card.Body className="bg-light border-top pt-3">
                                {t.description && (
                                  <p className="text-muted small mb-3">{t.description}</p>
                                )}
                                <Row>
                                  <Col md={6}>
                                    <h6 className="small fw-bold text-uppercase text-muted mb-2">
                                      Суралцахуйн зорилтууд
                                    </h6>
                                    <ObjectivesEditor topicId={t.id} objectives={t.objectives} onRefresh={() => {
                                      svc.getWeeklyTopics({ search: searchQuery }).then(r => setGlobalResults(r.data)).catch(() => {});
                                    }} />
                                  </Col>
                                  <Col md={6}>
                                    <h6 className="small fw-bold text-uppercase text-muted mb-2">
                                      Материалууд
                                    </h6>
                                    <ResourcesEditor topicId={t.id} resources={t.resources} onRefresh={() => {
                                      svc.getWeeklyTopics({ search: searchQuery }).then(r => setGlobalResults(r.data)).catch(() => {});
                                    }} />
                                  </Col>
                                </Row>
                              </Card.Body>
                            </div>
                          </Collapse>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Topics list as Accordion */}
      {loading && <div className="text-center py-3"><Spinner /></div>}
      {!loading && filterProgram && (
        <>
          {(() => {
            const q = searchText.trim().toLowerCase();
            const filtered = q
              ? topics.filter(t =>
                  t.topic.toLowerCase().includes(q) ||
                  (t.description || '').toLowerCase().includes(q)
                )
              : topics;
            return (
              <>
                <div className="d-flex justify-content-between mb-2">
                  <small className="text-muted">
                    {q ? `${filtered.length} / ${topics.length} сэдэв` : `${topics.length} сэдэв`}
                  </small>
                </div>
                {topics.length === 0 && (
                  <Alert variant="info">Сонгосон хөтөлбөрт сэдэв байхгүй байна.</Alert>
                )}
                {topics.length > 0 && filtered.length === 0 && (
                  <Alert variant="warning">«{searchText}» хайлтаар сэдэв олдсонгүй.</Alert>
                )}
                <div className="d-flex flex-column gap-2">
                  {filtered.map(t => {
              const isOpen = !!expandedTopics[t.id];
              return (
                <Card key={t.id} className="border">
                  {/* Header */}
                  <div
                    className="d-flex align-items-center px-3 py-2 gap-2"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => toggleExpand(t.id)}
                  >
                    <span className="text-muted flex-shrink-0">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                    <Badge bg="secondary" className="flex-shrink-0">
                      {t.week_num}-р 7 хоног
                    </Badge>
                    {t.effective_hours > 0 && (
                      <Badge bg="outline-secondary" className="flex-shrink-0 border text-muted">
                        {t.effective_hours} цаг
                      </Badge>
                    )}
                    <span className="flex-grow-1 text-truncate small fw-medium">
                      {t.topic}
                    </span>
                    <Badge
                      bg={t.is_published ? 'success' : 'warning'}
                      text={t.is_published ? undefined : 'dark'}
                      className="flex-shrink-0"
                    >
                      {t.is_published ? 'Нийтлэгдсэн' : 'Ноорог'}
                    </Badge>
                    <div
                      className="flex-shrink-0 d-flex gap-1"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* AI өгүүлэл үүсгэх / сайжруулах */}
                      {t.topic && (() => {
                        const articleRes = t.resources?.find(r => r.resource_type === 'article');
                        if (articleRes) {
                          // Байгаа article → сайжруулах
                          const match = articleRes.url?.match(/\/articles?\/([a-f0-9-]+)/);
                          const uuid = match?.[1] || '';
                          return (
                            <Button
                              size="sm" variant="outline-info" className="p-1"
                              onClick={() => { setImproveTopic(t); setImproveArticleUuid(uuid); }}
                              title="AI сайжруулах"
                            >
                              <MessageCircle size={12} />
                            </Button>
                          );
                        }
                        // Article байхгүй → үүсгэх
                        return (
                          <Button
                            size="sm" variant="outline-primary" className="p-1"
                            onClick={() => handleGenerateArticle(t)}
                            disabled={generatingId !== null}
                            title="AI өгүүлэл үүсгэх"
                          >
                            {generatingId === t.id ? <Spinner size="sm" /> : <Sparkles size={12} />}
                          </Button>
                        );
                      })()}
                      <Button
                        size="sm" variant="outline-secondary" className="p-1"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil size={12} />
                      </Button>
                      <Button
                        size="sm" variant="outline-danger" className="p-1"
                        onClick={() => setConfirmId(t.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>

                  {/* Article resource badges */}
                  {t.resources?.filter(r => r.resource_type === 'article').length > 0 && (
                    <div className="px-3 pb-1 d-flex flex-wrap gap-1">
                      {t.resources.filter(r => r.resource_type === 'article').map(r => {
                        const { to, external } = resolveResourceHref(r.url);
                        const LinkTag = external ? 'a' : Link;
                        const linkProp = external ? { href: to, target: '_blank', rel: 'noopener noreferrer' } : { to };
                        return (
                          <LinkTag key={r.id} {...linkProp} className="text-decoration-none">
                            <Badge bg="info" className="small fw-normal d-inline-flex align-items-center gap-1">
                              <FileText size={10} />
                              {r.title.length > 50 ? r.title.slice(0, 50) + '...' : r.title}
                            </Badge>
                          </LinkTag>
                        );
                      })}
                    </div>
                  )}

                  <Collapse in={isOpen}>
                    <div>
                      <Card.Body className="bg-light border-top pt-3">
                        {t.description && (
                          <p className="text-muted small mb-3">{t.description}</p>
                        )}
                        <Row>
                          <Col md={6}>
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">
                              Суралцахуйн зорилтууд
                            </h6>
                            <ObjectivesEditor
                              topicId={t.id}
                              objectives={t.objectives}
                              onRefresh={refreshTopic}
                            />
                          </Col>
                          <Col md={6}>
                            <h6 className="small fw-bold text-uppercase text-muted mb-2">
                              Материалууд
                            </h6>
                            <ResourcesEditor
                              topicId={t.id}
                              resources={t.resources}
                              onRefresh={refreshTopic}
                            />
                          </Col>
                        </Row>
                      </Card.Body>
                    </div>
                  </Collapse>
                </Card>
              );
                  })}
                </div>
              </>
            );
          })()}
        </>
      )}

      {/* Topic Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Сэдэв засах' : 'Шинэ сэдэв'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Хөтөлбөр <span className="text-danger">*</span></Form.Label>
                  <Form.Select required value={form.program}
                    onChange={e => setForm(f => ({ ...f, program: e.target.value }))}>
                    <option value="">— сонгох —</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.grade}-р анги · {p.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>7 хоног # <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number" min="1" required value={form.week_num}
                    onChange={e => setForm(f => ({ ...f, week_num: parseInt(e.target.value) || '' }))}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Цаг</Form.Label>
                  <Form.Control
                    type="number" min="0" value={form.hours}
                    onChange={e => setForm(f => ({ ...f, hours: parseInt(e.target.value) || 0 }))}
                  />
                  <Form.Text className="text-muted">0 = default</Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Сэдэв <span className="text-danger">*</span></Form.Label>
              <Form.Control required value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="Тэгш өнцөгт гурвалжин" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тайлбар</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Form.Group>
            <Form.Check
              type="switch" id="topic-published" label="Нийтлэх"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Болих</Button>
            <SaveButton loading={saving} />
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmModal
        show={!!confirmId}
        message="Энэ сэдвийг бүх зорилт, материалын хамт устгах уу?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />

      <ArticleImproveModal
        show={!!improveTopic}
        onHide={() => { setImproveTopic(null); setImproveArticleUuid(null); }}
        topic={improveTopic}
        articleUuid={improveArticleUuid}
        onApplied={() => load()}
      />
    </>
  );
}
