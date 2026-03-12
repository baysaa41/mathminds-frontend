// Club Curriculum Page
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import { BookOpen, CalendarDays, GraduationCap, Sparkles } from 'lucide-react';
import ClubCurriculumWidget from '../components/ClubCurriculumWidget';
import { generateWeeklyArticle, getWeeklyTopics } from '../services/clubsService';

const ClubCurriculumPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin, showToast } = useOutletContext();
  const [generating, setGenerating] = useState(false);
  const [weeklyTopics, setWeeklyTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  useEffect(() => {
    if (!clubData?.id || !clubData?.curriculum_program) return;
    setTopicsLoading(true);
    getWeeklyTopics(clubData.id)
      .then(setWeeklyTopics)
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  }, [clubData?.id, clubData?.curriculum_program]);

  const currentWeek = clubData?.current_week_topic;
  const programInfo = clubData?.curriculum_program_info;
  const academicYearInfo = clubData?.curriculum_academic_year_info;

  const handleGenerateArticle = async () => {
    if (!window.confirm(
      `${currentWeek.week_num}-р долоо хоногийн «${currentWeek.topic}» сэдвээр AI өгүүлэл бэлдэж клубд нийтлэх үү?\n\nЭнэ хэдэн секунд болно.`
    )) return;

    try {
      setGenerating(true);
      const result = await generateWeeklyArticle(clubData.id);
      showToast?.(result.detail || 'AI өгүүлэл амжилттай нийтлэгдлээ!', 'success');
      clubActions?.onUpdate?.();
    } catch (err) {
      const msg = err.response?.data?.detail || 'AI өгүүлэл үүсгэхэд алдаа гарлаа';
      showToast?.(msg, 'danger');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container-fluid">
      <h4 className="mb-3">Хөтөлбөр</h4>

      {/* Одоогийн долоо хоногийн сэдэв */}
      {programInfo && (
        <Card className="shadow-sm mb-3 border-primary border-opacity-25">
          <Card.Body>
            <div className="d-flex align-items-start gap-3">
              <div className="bg-primary bg-opacity-10 rounded p-2 flex-shrink-0">
                <GraduationCap size={24} className="text-primary" />
              </div>
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                  <span className="fw-semibold">{programInfo.name}</span>
                  <Badge bg="secondary" className="small">{programInfo.grade}-р анги</Badge>
                  {academicYearInfo && (
                    <span className="small text-muted">· {academicYearInfo.name}</span>
                  )}
                </div>
                {currentWeek ? (() => {
                  const fmt = (d) => new Date(d).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' });
                  return (
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <Badge bg="success" className="small">Одоо үзэж байна</Badge>
                        <span className="small text-muted fw-medium">{currentWeek.week_num}-р долоо хоног</span>
                        <span className="small text-muted">
                          <CalendarDays size={12} className="me-1" />
                          {fmt(currentWeek.start_date)} – {fmt(currentWeek.end_date)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <p className="mb-0 fw-medium">{currentWeek.topic}</p>
                        {isTeacherOrAdmin && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleGenerateArticle}
                            disabled={generating}
                          >
                            {generating ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Бэлдэж байна...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} className="me-1" />
                                AI өгүүлэл нийтлэх
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {currentWeek.description && (
                        <p className="mb-0 small text-muted mt-1">{currentWeek.description}</p>
                      )}
                    </div>
                  );
                })() : (
                  <p className="mb-0 small text-muted">Энэ долоо хоногийн сэдэв тохируулагдаагүй байна</p>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Бүх долоо хоногийн сэдвүүд */}
      {clubData?.curriculum_program && (
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
                {weeklyTopics.map((w) => (
                  <ListGroup.Item
                    key={w.week_num}
                    className={`py-2 px-3 ${w.is_current ? 'bg-success bg-opacity-10' : ''}`}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <span className={`small fw-semibold flex-shrink-0 ${w.is_current ? 'text-success' : w.is_past ? 'text-muted' : ''}`}
                        style={{ minWidth: '2.5rem' }}>
                        {w.week_num}-р
                      </span>
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {w.topic ? (
                            <span className={`small ${w.is_past ? 'text-muted' : ''}`}>{w.topic}</span>
                          ) : (
                            <span className="small text-muted fst-italic">Сэдэв байхгүй</span>
                          )}
                          {w.is_current && <Badge bg="success" className="small">Одоо</Badge>}
                        </div>
                        <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                          <CalendarDays size={10} className="me-1" />
                          {new Date(w.start_date).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                          {' – '}
                          {new Date(w.end_date).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}

      <ClubCurriculumWidget
        club={clubData}
        onUpdate={clubActions?.onUpdate}
        isTeacherOrAdmin={isTeacherOrAdmin}
      />
    </div>
  );
};

export default ClubCurriculumPage;
