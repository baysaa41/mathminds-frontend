// frontend/src/pages/QuizGenerateCurriculumPage.jsx

import React, { useState, useEffect, useRef } from 'react';
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
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import { Sparkles, BookOpen } from 'lucide-react';

const LEVELS = [
  { id: 1, name: 'Сэргээн санах' },
  { id: 2, name: 'Ойлгох' },
  { id: 3, name: 'Хэрэглэх' },
  { id: 4, name: 'Задлан шинжлэх' },
  { id: 5, name: 'Үнэлэх' },
  { id: 6, name: 'Бүтээх' },
];

export default function QuizGenerateCurriculumPage() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  const [programId, setProgramId] = useState('');
  const [startWeek, setStartWeek] = useState(1);
  const [endWeek, setEndWeek] = useState(4);
  const [levelId, setLevelId] = useState('');
  const [mcCount, setMcCount] = useState(3);
  const [fitbCount, setFitbCount] = useState(2);
  const [quizTitle, setQuizTitle] = useState('');

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    apiClient.get('/api/curriculum/programs/')
      .then(r => setPrograms(r.data || []))
      .catch(() => setPrograms([]))
      .finally(() => setLoadingPrograms(false));
    return () => clearInterval(pollRef.current);
  }, []);

  const selectedProgram = programs.find(p => String(p.id) === String(programId));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!programId) return;
    setError(null);
    setGenerating(true);
    setProgress({ current: 0, total: mcCount + fitbCount, step: 'Эхлүүлж байна...' });

    try {
      const res = await apiClient.post('/api/integral/quizzes/generate_from_curriculum/', {
        program_id: Number(programId),
        start_week: Number(startWeek),
        end_week: Number(endWeek),
        level_id: levelId ? Number(levelId) : null,
        mc_count: Number(mcCount),
        fitb_count: Number(fitbCount),
        quiz_title: quizTitle.trim() || null,
      });
      const { task_id, total } = res.data;
      setProgress(p => ({ ...p, total }));

      pollRef.current = setInterval(async () => {
        try {
          const sr = await apiClient.get(`/api/integral/quizzes/task-status/${task_id}/`);
          const { state, current, total: t, problem_title, new_uuid, error: taskErr } = sr.data;
          if (state === 'PROGRESS') {
            setProgress({ current: current || 0, total: t || total, step: problem_title || '' });
          } else if (state === 'SUCCESS') {
            clearInterval(pollRef.current);
            navigate(`/quiz/${new_uuid}/edit`);
          } else if (state === 'FAILURE') {
            clearInterval(pollRef.current);
            setError(taskErr || 'Quiz үүсгэхэд алдаа гарлаа.');
            setGenerating(false);
          }
        } catch {
          // poll дахин оролдоно
        }
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Quiz үүсгэхэд алдаа гарлаа.';
      setError(msg);
      setGenerating(false);
    }
  };

  const progressPct = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Container className="py-4" style={{ maxWidth: 640 }}>
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

      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleGenerate}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Хөтөлбөр</Form.Label>
              {loadingPrograms ? (
                <div className="text-muted small">Хөтөлбөр ачаалж байна...</div>
              ) : (
                <Form.Select
                  value={programId}
                  onChange={e => setProgramId(e.target.value)}
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

            <Row className="mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Эхлэх долоо хоног</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    max={52}
                    value={startWeek}
                    onChange={e => setStartWeek(Number(e.target.value))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Дуусах долоо хоног</Form.Label>
                  <Form.Control
                    type="number"
                    min={startWeek}
                    max={52}
                    value={endWeek}
                    onChange={e => setEndWeek(Number(e.target.value))}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {selectedProgram && (
              <div className="mb-3 small text-muted">
                Долоо хоног {startWeek}–{endWeek} ({endWeek - startWeek + 1} долоо хоног)
              </div>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Хүндрэлийн түвшин</Form.Label>
              <Form.Select value={levelId} onChange={e => setLevelId(e.target.value)}>
                <option value="">— Автоматаар —</option>
                {LEVELS.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="fw-medium">Сонгох тест (MC)</Form.Label>
                  <Form.Control
                    type="number"
                    min={0}
                    max={15}
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
                    max={15}
                    value={fitbCount}
                    onChange={e => setFitbCount(Number(e.target.value))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="mb-3 small text-muted">
              Нийт: {mcCount + fitbCount} бодлого (хамгийн ихдээ 20)
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Тестийн гарчиг <span className="text-muted">(заавал биш)</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Хоосон бол AI автоматаар гарчиг үүсгэнэ"
                value={quizTitle}
                onChange={e => setQuizTitle(e.target.value)}
                maxLength={120}
              />
            </Form.Group>

            {generating && (
              <div className="mb-4">
                <div className="d-flex justify-content-between small text-muted mb-1">
                  <span>
                    {progress.step || 'AI бодлого үүсгэж байна...'}
                  </span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <ProgressBar
                  now={progressPct}
                  animated
                  striped
                  variant="primary"
                  style={{ height: 8 }}
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={generating || !programId || mcCount + fitbCount === 0 || mcCount + fitbCount > 20}
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
    </Container>
  );
}
