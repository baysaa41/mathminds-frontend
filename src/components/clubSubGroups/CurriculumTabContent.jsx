// src/components/clubSubGroups/CurriculumTabContent.jsx
// ClubSubGroupsPage-ийн "Хөтөлбөр" табын агуулга (state-гүй, зөвхөн props хүлээж авдаг)

import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import {
  GraduationCap, CalendarDays, FileText, X, RotateCcw, Target, Sparkles, Plus,
} from 'lucide-react';
import { resolveResourceHref } from '../../utils/resourceLink';
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_COLORS } from './constants.js';

export function CurriculumTabContent({
  isTeacherOrAdmin,
  programsInfo,
  addablePrograms,
  weeklyTopics,
  topicsLoading,
  selectedProgramId,
  setSelectedProgramId,
  startDate,
  setStartDate,
  addingProgram,
  onAddProgram,
  onRemoveProgram,
  onSetWeek,
  onResetAutoWeek,
  onOpenAutoObjectives,
}) {
  return (
    <Card.Body className="p-3">

      {/* Хөтөлбөр удирдлага (багш) */}
      {isTeacherOrAdmin && (
        <div className="mb-3">
          <div className="fw-medium small mb-2 d-flex align-items-center gap-1">
            <GraduationCap size={14} />Хөтөлбөрүүд
          </div>
          {programsInfo.length > 0 && (
            <div className="mb-2">
              {programsInfo.map(p => (
                <div key={p.id} className="border rounded p-2 mb-2">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-medium small">{p.name}</span>
                      <Badge bg="secondary" className="small">{p.grade}-р анги</Badge>
                      {p.academic_year && <span className="small text-muted">{p.academic_year}</span>}
                    </div>
                    <Button variant="outline-danger" size="sm" className="py-0 px-1"
                      onClick={() => onRemoveProgram(p.id, p.name)}>
                      <X size={13} />
                    </Button>
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="small text-muted">
                      Эхэлсэн: {new Date(p.start_date).toLocaleDateString('mn-MN')}
                    </span>
                    <span className="text-muted">·</span>
                    <Form.Select size="sm" style={{ maxWidth: 260 }}
                      value={p.current_week}
                      onChange={e => onSetWeek(p.id, parseInt(e.target.value))}>
                      {(() => {
                        const pt = weeklyTopics.filter(w => w.program_id === p.id);
                        if (!pt.length) return <option value={p.current_week}>{p.current_week}-р долоо хоног</option>;
                        return pt.map(w => (
                          <option key={w.week_num} value={w.week_num}>
                            {w.week_num}-р долоо хоног{w.topic ? ` — ${w.topic}` : ''}
                          </option>
                        ));
                      })()}
                    </Form.Select>
                    {!p.is_auto_week && (
                      <Button variant="outline-info" size="sm" className="py-0 px-1"
                        onClick={() => onResetAutoWeek(p.id)}>
                        <RotateCcw size={12} className="me-1" />
                        <span className="small">Автомат</span>
                      </Button>
                    )}
                    {p.is_auto_week && <span className="small text-muted">(автомат)</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {addablePrograms.length > 0 && (
            <div className="d-flex gap-2 flex-wrap">
              <Form.Select size="sm" style={{ maxWidth: 280 }}
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}>
                <option value="">— Хөтөлбөр сонгох —</option>
                {addablePrograms.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.grade}-р анги — {p.name}
                    {p.academic_year ? ` (${p.academic_year})` : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Control type="date" size="sm" style={{ maxWidth: 150 }}
                value={startDate} onChange={e => setStartDate(e.target.value)} />
              <Button variant="primary" size="sm"
                onClick={onAddProgram}
                disabled={!selectedProgramId || addingProgram}>
                {addingProgram
                  ? <Spinner animation="border" size="sm" />
                  : <><Plus size={13} className="me-1" />Нэмэх</>}
              </Button>
            </div>
          )}
          {programsInfo.length === 0 && addablePrograms.length === 0 && (
            <p className="text-muted small mb-0">Нэмэх боломжтой хөтөлбөр байхгүй байна.</p>
          )}
        </div>
      )}

      {/* Долоо хоногийн сэдвүүд */}
      {programsInfo.length > 0 && (
        <div>
          <div className="fw-medium small mb-2 d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center gap-1">
              <CalendarDays size={14} />Долоо хоногийн сэдвүүд
            </span>
            {isTeacherOrAdmin && (
              <Button variant="outline-primary" size="sm" className="py-0 px-2"
                onClick={onOpenAutoObjectives}>
                <Sparkles size={12} className="me-1" />AI зорилго
              </Button>
            )}
          </div>
          {topicsLoading ? (
            <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
          ) : weeklyTopics.length === 0 ? (
            <div className="text-center py-3 text-muted small">Сэдэв тохируулагдаагүй байна</div>
          ) : (
            <ListGroup variant="flush" className="border rounded">
              {weeklyTopics.map((w, idx) => {
                const key = `${w.program_id}-${w.week_num}`;
                return (
                  <ListGroup.Item key={`${key}-${idx}`}
                    className={`py-2 px-3 ${w.is_current ? 'bg-success bg-opacity-10' : ''}`}>
                    <div className="d-flex align-items-start gap-2">
                      <span className={`small fw-semibold flex-shrink-0 ${w.is_current ? 'text-success' : w.is_past ? 'text-muted' : ''}`}
                        style={{ minWidth: '2.5rem' }}>
                        {w.week_num}-р
                      </span>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {w.topic
                            ? <span className={`small ${w.is_past ? 'text-muted' : ''}`}>{w.topic}</span>
                            : <span className="small text-muted fst-italic">Сэдэв байхгүй</span>}
                          {w.is_current && <Badge bg="success" className="small">Одоо</Badge>}
                          {w.hours > 0 && <span className="small text-muted">({w.hours} цаг)</span>}
                          {programsInfo.length > 1 && w.program_name && (
                            <Badge bg="light" text="dark" className="small">{w.program_name}</Badge>
                          )}
                        </div>
                        {w.objectives?.length > 0 && (
                          <Accordion flush className="mt-1">
                            <Accordion.Item eventKey={key} className="border-0 bg-transparent">
                              <Accordion.Header className="p-0">
                                <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                  <Target size={10} />Зорилт ({w.objectives.length})
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
                        {w.resources?.length > 0 && (
                          <div className="mt-1 d-flex flex-wrap gap-1">
                            {w.resources.map(r => {
                              const { to, external } = resolveResourceHref(r.url);
                              const LinkTag = external ? 'a' : Link;
                              const linkProp = external ? { href: to, target: '_blank', rel: 'noopener noreferrer' } : { to };
                              return (
                                <LinkTag key={r.id} {...linkProp} className="text-decoration-none">
                                  <Badge bg={RESOURCE_TYPE_COLORS[r.resource_type] || 'info'}
                                    className="small fw-normal d-inline-flex align-items-center gap-1">
                                    <FileText size={10} />
                                    <span className="fw-semibold">{RESOURCE_TYPE_LABELS[r.resource_type] || r.resource_type}:</span>
                                    {r.title.length > 40 ? r.title.slice(0, 40) + '...' : r.title}
                                  </Badge>
                                </LinkTag>
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
        </div>
      )}

      {/* Гишүүдэд: хөтөлбөр байхгүй */}
      {!isTeacherOrAdmin && programsInfo.length === 0 && (
        <div className="text-center text-muted small py-4">
          Энэ дэд бүлэгт хөтөлбөр тохируулагдаагүй байна.
        </div>
      )}
    </Card.Body>
  );
}
