// frontend/src/pages/QuizStudentAnswersPage.jsx
// Тестэд хариулсан сурагчдын жагсаалт харах хуудас (зохиогчид зориулсан)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import UserAvatar from '../components/UserAvatar.jsx';
import UserName from '../components/UserName.jsx';

import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import Table from 'react-bootstrap/Table';
import Stack from 'react-bootstrap/Stack';
import ProgressBar from 'react-bootstrap/ProgressBar';

const STATUS_CONFIG = {
  completed:   { label: 'Дууссан',    variant: 'success',   icon: 'bi-check-circle-fill' },
  in_progress: { label: 'Явагдаж байна', variant: 'primary', icon: 'bi-play-circle-fill' },
  paused:      { label: 'Түр зогссон', variant: 'warning',  icon: 'bi-pause-circle-fill' },
  not_started: { label: 'Эхлээгүй',   variant: 'secondary', icon: 'bi-circle' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  return (
    <Badge bg={cfg.variant} className="d-inline-flex align-items-center gap-1">
      <i className={`bi ${cfg.icon}`}></i>
      {cfg.label}
    </Badge>
  );
};

const formatTime = (seconds) => {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}м ${secs}с`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const QuizStudentAnswersPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [quizRes, sheetsRes] = await Promise.all([
          apiClient.get(`/api/integral/quizzes/${uuid}/`),
          apiClient.get(`/api/integral/quizzes/${uuid}/student-answers/`),
        ]);

        setQuiz(quizRes.data);
        setSheets(sheetsRes.data);
        setPageTitle(`Сурагчдын хариулт: ${quizRes.data.title}`);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Та энэ тестийн зохиогч биш тул харах эрхгүй.');
        } else {
          setError('Мэдээлэл ачааллахад алдаа гарлаа.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      setPageTitle('Нүүр');
    };
  }, [uuid, setPageTitle]);

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
        <AppBreadcrumb items={[{ label: 'Тестүүд', to: '/quizzes' }, { label: 'Сурагчдын хариулт' }]} />
      </Container>
    );
  }

  if (!quiz) return null;

  const totalProblems = quiz.problems?.length || quiz.problems_count || 0;

  // Статистик — зөвхөн дууссан sheet-нүүдийн оноогоор тооцно
  const completedSheets = sheets.filter((s) => s.status === 'completed');
  const inProgressCount = sheets.filter((s) => s.status === 'in_progress' || s.status === 'paused').length;
  const avgScore =
    completedSheets.length > 0
      ? Math.round(
          completedSheets.reduce((s, sh) => s + (sh.score || 0), 0) / completedSheets.length
        )
      : 0;
  const topScore = completedSheets.reduce((m, sh) => Math.max(m, sh.score || 0), 0);

  return (
    <Container className="py-4" style={{ maxWidth: '1000px' }}>
      <AppBreadcrumb className="mb-3" items={[
        { label: 'Тестүүд', to: '/quizzes' },
        { label: quiz.title, to: `/quiz/${uuid}` },
        { label: 'Сурагчдын хариулт' },
      ]} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">
          <i className="bi bi-people-fill me-2 text-primary"></i>
          Сурагчдын хариулт
        </h4>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/quiz/${uuid}`)}>
          <i className="bi bi-arrow-left me-1"></i>
          Тест руу буцах
        </Button>
      </div>

      {/* Ерөнхий статистик */}
      <Card className="mb-4">
        <Card.Header>
          <h6 className="mb-0">
            <i className="bi bi-bar-chart-fill me-2"></i>
            Ерөнхий статистик
          </h6>
        </Card.Header>
        <Card.Body>
          <Stack direction="horizontal" gap={4} className="flex-wrap">
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-primary">{sheets.length}</div>
              <div className="text-muted small">Нийт оролцсон</div>
            </div>
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-success">{completedSheets.length}</div>
              <div className="text-muted small">Дууссан</div>
            </div>
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-warning">{inProgressCount}</div>
              <div className="text-muted small">Явагдаж байна</div>
            </div>
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-info">{avgScore}</div>
              <div className="text-muted small">Дундаж оноо</div>
            </div>
            <div className="text-center px-3">
              <div className="fs-3 fw-bold text-danger">{topScore}</div>
              <div className="text-muted small">Өндөр оноо</div>
            </div>
          </Stack>
        </Card.Body>
      </Card>

      {/* Сурагчдын жагсаалт */}
      {sheets.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">Одоогоор ямар ч сурагч тест эхлээгүй байна.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <h6 className="mb-0">
              <i className="bi bi-list-check me-2"></i>
              Жагсаалт ({sheets.length})
            </h6>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Сурагч</th>
                  <th>Төлөв</th>
                  <th>Хариулсан</th>
                  <th>Оноо</th>
                  <th>Эхэлсэн</th>
                  <th>Дууссан</th>
                  <th>Хугацаа</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sheets.map((sheet, idx) => {
                  const answered = sheet.answers_count || 0;
                  const pct = totalProblems > 0 ? Math.round((answered / totalProblems) * 100) : 0;
                  const isCompleted = sheet.status === 'completed';

                  return (
                    <tr key={sheet.id}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <Stack direction="horizontal" gap={2}>
                          <UserAvatar user={sheet.student} size={32} />
                          <div>
                            <div><UserName user={sheet.student} /></div>
                            <div className="text-muted small">@{sheet.student?.username}</div>
                          </div>
                        </Stack>
                      </td>
                      <td>
                        <StatusBadge status={sheet.status} />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ProgressBar
                            now={pct}
                            style={{ width: '70px', height: '6px' }}
                            variant={isCompleted ? 'success' : 'info'}
                          />
                          <span className="small text-muted">{answered}/{totalProblems}</span>
                        </div>
                      </td>
                      <td>
                        {isCompleted ? (
                          <strong className="text-success">{sheet.score ?? 0}</strong>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td className="small text-muted">{formatDate(sheet.started_at)}</td>
                      <td className="small text-muted">{formatDate(sheet.finished_at)}</td>
                      <td className="small text-muted">
                        {isCompleted ? formatTime(sheet.total_time_spent) : '—'}
                      </td>
                      <td>
                        {isCompleted ? (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/quiz/${uuid}/result/${sheet.id}`)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Харах
                          </Button>
                        ) : (
                          <span className="text-muted small">
                            <i className={`bi ${STATUS_CONFIG[sheet.status]?.icon} me-1`}></i>
                            {answered} хариулсан
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default QuizStudentAnswersPage;
