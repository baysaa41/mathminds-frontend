// frontend/src/pages/QuizLeaderboardPage.jsx
// Тестийн дүнгийн жагсаалт — оноогоор эрэмбэлсэн

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import UserAvatar from '../components/UserAvatar.jsx';
import UserName from '../components/UserName.jsx';

import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import Stack from 'react-bootstrap/Stack';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const ROW_BG = { 1: 'table-warning', 2: 'table-light', 3: 'table-light' };

const formatTime = (seconds) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ц ${m}м`;
  return `${m}м ${s}с`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('mn-MN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const QuizLeaderboardPage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [quizRes, lbRes] = await Promise.all([
          apiClient.get(`/api/integral/quizzes/${uuid}/`),
          apiClient.get(`/api/integral/quizzes/${uuid}/leaderboard/`),
        ]);
        setQuiz(quizRes.data);
        setSheets(lbRes.data);
        setPageTitle(`Дүн: ${quizRes.data.title}`);
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
    return () => setPageTitle('Нүүр');
  }, [uuid, setPageTitle]);

  // Rank тооцоо: ижил оноотой сурагчид ижил зэрэгтэй
  const ranked = useMemo(() => {
    let rank = 1;
    return sheets.map((sheet, idx) => {
      if (idx > 0 && sheet.score < sheets[idx - 1].score) rank = idx + 1;
      return { ...sheet, rank };
    });
  }, [sheets]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ranked;
    const q = search.toLowerCase();
    return ranked.filter((s) => {
      const name = `${s.student?.last_name || ''} ${s.student?.first_name || ''} ${s.student?.username || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [ranked, search]);

  // Статистик
  const stats = useMemo(() => {
    if (!sheets.length) return null;
    const scores = sheets.map((s) => s.score || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    return { count: sheets.length, avg: avg.toFixed(1), max, min };
  }, [sheets]);

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
        <AppBreadcrumb items={[{ label: 'Тестүүд', to: '/quizzes' }, { label: 'Дүнгийн жагсаалт' }]} />
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '1000px' }}>
      <AppBreadcrumb className="mb-3" items={[
        { label: 'Тестүүд', to: '/quizzes' },
        { label: quiz?.title || uuid, to: `/quiz/${uuid}` },
        { label: 'Дүнгийн жагсаалт' },
      ]} />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="mb-0">
          <i className="bi bi-trophy-fill me-2 text-warning"></i>
          Дүнгийн жагсаалт
        </h4>
        <Stack direction="horizontal" gap={2}>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/quiz/${uuid}/student-answers`)}
          >
            <i className="bi bi-people me-1"></i>
            Бүх хариулт
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/quiz/${uuid}`)}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Тест руу буцах
          </Button>
        </Stack>
      </div>

      {/* Статистик */}
      {stats && (
        <Card className="mb-4 border-warning">
          <Card.Body>
            <Stack direction="horizontal" gap={4} className="flex-wrap justify-content-around">
              <div className="text-center">
                <div className="fs-2 fw-bold text-primary">{stats.count}</div>
                <div className="text-muted small">Нийт оролцогч</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-success">{stats.max}</div>
                <div className="text-muted small">Хамгийн өндөр</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-info">{stats.avg}</div>
                <div className="text-muted small">Дундаж оноо</div>
              </div>
              <div className="text-center">
                <div className="fs-2 fw-bold text-secondary">{stats.min}</div>
                <div className="text-muted small">Хамгийн бага</div>
              </div>
            </Stack>
          </Card.Body>
        </Card>
      )}

      {sheets.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">Дууссан оролдлого байхгүй байна.</p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header>
            <Stack direction="horizontal" gap={2}>
              <span className="fw-semibold">
                <i className="bi bi-list-ol me-2"></i>
                Оноогоор эрэмбэлсэн ({sheets.length})
              </span>
              <div className="ms-auto" style={{ width: '220px' }}>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Нэрээр хайх..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <Button variant="outline-secondary" onClick={() => setSearch('')}>
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </InputGroup>
              </div>
            </Stack>
          </Card.Header>

          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }} className="text-center">Зэрэг</th>
                  <th>Сурагч</th>
                  <th className="text-end">Оноо</th>
                  <th className="text-center d-none d-md-table-cell">Хариулт</th>
                  <th className="text-center d-none d-lg-table-cell">Хугацаа</th>
                  <th className="text-center d-none d-lg-table-cell">Дууссан</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sheet) => (
                  <tr key={sheet.id} className={ROW_BG[sheet.rank] || ''}>
                    <td className="text-center fw-bold fs-5">
                      {MEDAL[sheet.rank] || (
                        <span className="text-muted">{sheet.rank}</span>
                      )}
                    </td>
                    <td>
                      <Stack direction="horizontal" gap={2}>
                        <UserAvatar user={sheet.student} size={32} />
                        <div>
                          <div className="fw-semibold">
                            <UserName user={sheet.student} />
                          </div>
                          <div className="text-muted small">@{sheet.student?.username}</div>
                        </div>
                      </Stack>
                    </td>
                    <td className="text-end">
                      <span
                        className={`fw-bold fs-5 ${
                          sheet.rank === 1 ? 'text-warning' :
                          sheet.rank === 2 ? 'text-secondary' :
                          sheet.rank === 3 ? 'text-danger' : ''
                        }`}
                      >
                        {sheet.score ?? 0}
                      </span>
                    </td>
                    <td className="text-center d-none d-md-table-cell">
                      <Badge bg="light" text="dark" className="border">
                        {sheet.answers_count ?? 0}
                      </Badge>
                    </td>
                    <td className="text-center small text-muted d-none d-lg-table-cell">
                      {formatTime(sheet.total_time_spent)}
                    </td>
                    <td className="text-center small text-muted d-none d-lg-table-cell">
                      {formatDate(sheet.finished_at)}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/quiz/${uuid}/result/${sheet.id}`)}
                        title="Хариулт харах"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      "{search}" хайлтанд тохирох сурагч олдсонгүй
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default QuizLeaderboardPage;
