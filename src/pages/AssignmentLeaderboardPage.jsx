// AssignmentLeaderboardPage — даалгаврын дүнгийн жагсаалт
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import Stack from 'react-bootstrap/Stack';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { ArrowLeft, Trophy, Search } from 'lucide-react';
import apiClient from '../api/axiosConfig';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

const STATUS_CONFIG = {
  not_started: { label: 'Эхлээгүй',      bg: 'secondary' },
  in_progress:  { label: 'Явагдаж байна', bg: 'warning'   },
  submitted:    { label: 'Илгээсэн',      bg: 'info'       },
  graded:       { label: 'Үнэлэгдсэн',   bg: 'success'    },
};

const Avatar = ({ student, size = 32 }) => {
  const initials = (student.first_name?.[0] || student.username?.[0] || '?').toUpperCase();
  if (student.picture_url) {
    return (
      <img
        src={student.picture_url}
        alt=""
        className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  }
  return (
    <div
      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
};

const AssignmentLeaderboardPage = () => {
  const { assignmentId } = useParams();
  const { clubData, isTeacherOrAdmin } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { assignment, results }
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/club-assignments/${assignmentId}/leaderboard/`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assignmentId]);

  // Ижил оноотой сурагчид ижил зэрэгтэй
  const ranked = useMemo(() => {
    if (!data?.results) return [];
    const withScore = data.results.filter(r => r.score != null);
    const noScore   = data.results.filter(r => r.score == null);
    let rank = 1;
    const rankedWithScore = withScore.map((r, idx) => {
      if (idx > 0 && r.score < withScore[idx - 1].score) rank = idx + 1;
      return { ...r, rank };
    });
    return [...rankedWithScore, ...noScore.map(r => ({ ...r, rank: null }))];
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return ranked;
    const q = search.toLowerCase();
    return ranked.filter(r => {
      const name = `${r.student.last_name} ${r.student.first_name} ${r.student.username}`.toLowerCase();
      return name.includes(q);
    });
  }, [ranked, search]);

  // Статистик
  const stats = useMemo(() => {
    if (!data?.results?.length) return null;
    const all = data.results;
    const scored = all.filter(r => r.score != null);
    const submitted = all.filter(r => ['submitted', 'graded'].includes(r.status));
    const avg = scored.length
      ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1)
      : null;
    const max = scored.length ? Math.max(...scored.map(r => r.score)) : null;
    return {
      total: all.length,
      submitted: submitted.length,
      scored: scored.length,
      avg,
      max,
      pct: all.length ? Math.round((submitted.length / all.length) * 100) : 0,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-3">
        <div className="text-danger small mb-2">{error}</div>
        <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="me-1" />Буцах
        </Button>
      </div>
    );
  }

  const assignment = data?.assignment;
  const maxScore = assignment?.max_score;

  return (
    <div className="container-fluid px-0">
      {/* Толгой */}
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate(`/clubs/${clubData?.id}/assignments/${assignmentId}`)}
        >
          <ArrowLeft size={14} className="me-1" />Буцах
        </Button>
        <h5 className="mb-0 d-flex align-items-center gap-2">
          <Trophy size={18} className="text-warning" />
          Дүнгийн жагсаалт
        </h5>
        {assignment?.title && (
          <span className="text-muted small">— {assignment.title}</span>
        )}
      </div>

      {/* Статистик */}
      {stats && (
        <Card className="mb-3 border-warning">
          <Card.Body className="py-2">
            <div className="d-flex gap-4 flex-wrap align-items-center">
              <div className="text-center">
                <div className="fw-bold fs-5 text-primary">{stats.total}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Нийт гишүүн</div>
              </div>
              <div className="text-center">
                <div className="fw-bold fs-5 text-success">{stats.submitted}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Илгээсэн</div>
              </div>
              {stats.avg != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-info">{stats.avg}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Дундаж</div>
                </div>
              )}
              {stats.max != null && (
                <div className="text-center">
                  <div className="fw-bold fs-5 text-warning">{stats.max}{maxScore ? `/${maxScore}` : ''}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Өндөр оноо</div>
                </div>
              )}
              <div className="flex-grow-1" style={{ minWidth: '120px' }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                  Хамрагдалт {stats.pct}%
                </div>
                <ProgressBar
                  now={stats.pct}
                  variant="success"
                  style={{ height: '6px' }}
                />
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Жагсаалт */}
      <Card>
        <Card.Header className="bg-white py-2">
          <Stack direction="horizontal" gap={2}>
            <span className="small fw-semibold">Оноогоор эрэмбэлсэн ({ranked.length})</span>
            <div className="ms-auto" style={{ width: '200px' }}>
              <InputGroup size="sm">
                <InputGroup.Text><Search size={12} /></InputGroup.Text>
                <Form.Control
                  placeholder="Нэрээр хайх..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch('')}>✕</Button>
                )}
              </InputGroup>
            </div>
          </Stack>
        </Card.Header>

        {filtered.length === 0 ? (
          <Card.Body className="text-center text-muted small py-3">
            {search ? `"${search}" хайлтанд тохирох сурагч олдсонгүй` : 'Жагсаалт хоосон байна'}
          </Card.Body>
        ) : (
          <Table hover responsive size="sm" className="mb-0 align-middle">
            <thead className="table-light">
              <tr className="small">
                <th style={{ width: '52px' }} className="text-center">Зэрэг</th>
                <th>Сурагч</th>
                <th className="text-center">Төлөв</th>
                <th className="text-end">Оноо</th>
                {maxScore && <th className="d-none d-md-table-cell" style={{ width: '120px' }}></th>}
                {isTeacherOrAdmin && (
                  <th style={{ width: '70px' }}></th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const si = STATUS_CONFIG[r.status] || STATUS_CONFIG.not_started;
                const scorePct = maxScore && r.score != null
                  ? Math.round((r.score / maxScore) * 100)
                  : null;
                const hasResult = r.answer_sheet_id && ['submitted', 'graded'].includes(r.status);

                return (
                  <tr
                    key={r.student.id}
                    className={
                      r.rank === 1 ? 'table-warning' :
                      r.rank === 2 || r.rank === 3 ? 'table-light' : ''
                    }
                  >
                    {/* Зэрэг */}
                    <td className="text-center fw-bold">
                      {r.rank != null ? (
                        MEDAL[r.rank] || <span className="text-muted">{r.rank}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Сурагч */}
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar student={r.student} size={28} />
                        <div>
                          <div className="small fw-medium">
                            {r.student.last_name
                              ? `${r.student.last_name} ${r.student.first_name}`.trim()
                              : r.student.first_name || r.student.username}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            @{r.student.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Төлөв */}
                    <td className="text-center">
                      <div className="d-flex flex-column align-items-center gap-1">
                        <Badge bg={si.bg} className="small">{si.label}</Badge>
                        {r.source === 'answer_sheet' && (
                          <Badge bg="light" text="secondary" className="border"
                            style={{ fontSize: '0.6rem' }} title="Excel/import-с оруулсан оноо">
                            import
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Оноо */}
                    <td className="text-end">
                      {r.score != null ? (
                        <span className={`fw-bold ${r.rank === 1 ? 'text-warning' : ''}`}>
                          {r.score}
                          {maxScore ? <span className="text-muted fw-normal">/{maxScore}</span> : ''}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    {/* Progress bar (md+) */}
                    {maxScore && (
                      <td className="d-none d-md-table-cell">
                        {scorePct != null && (
                          <ProgressBar
                            now={scorePct}
                            style={{ height: '6px' }}
                            variant={scorePct >= 80 ? 'success' : scorePct >= 50 ? 'warning' : 'danger'}
                          />
                        )}
                      </td>
                    )}

                    {/* Үр дүн харах (багш) */}
                    {isTeacherOrAdmin && (
                      <td>
                        {hasResult && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="py-0 px-2"
                            onClick={() =>
                              navigate(
                                `/quiz/${encodeURIComponent(
                                  data.assignment?.quiz_uuid || ''
                                )}/result/${r.answer_sheet_id}`
                              )
                            }
                            title="Дэлгэрэнгүй харах"
                          >
                            👁
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AssignmentLeaderboardPage;
