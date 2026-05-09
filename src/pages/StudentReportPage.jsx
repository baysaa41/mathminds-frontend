import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Nav from 'react-bootstrap/Nav';
import { Dumbbell, Clock } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

const STATUS_CONFIG = {
  not_started: { label: 'Өгөөгүй',       bg: 'secondary' },
  in_progress:  { label: 'Явагдаж байна', bg: 'warning'   },
  submitted:    { label: 'Илгээсэн',      bg: 'info'      },
  graded:       { label: 'Үнэлэгдсэн',   bg: 'success'   },
};

const scoreColor = (score, max) => {
  if (score == null || !max) return '#6c757d';
  const pct = score / max;
  if (pct >= 0.8) return '#198754';
  if (pct >= 0.5) return '#fd7e14';
  return '#dc3545';
};

const Avatar = ({ student, size = 48 }) => {
  const init = (student.first_name?.[0] || student.username?.[0] || '?').toUpperCase();
  if (student.picture_url) {
    return (
      <img src={student.picture_url} alt=""
        className="rounded-circle flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover' }} />
    );
  }
  return (
    <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {init}
    </div>
  );
};

const displayName = (s) =>
  s.last_name ? `${s.last_name} ${s.first_name}`.trim() : s.first_name || s.username;

const SummaryCards = ({ summary }) => {
  const rateColor = summary.success_rate >= 80 ? '#198754'
    : summary.success_rate >= 50 ? '#fd7e14' : '#dc3545';
  return (
    <>
      <div className="row g-3 text-center">
        <div className="col-6 col-sm-3">
          <div className="fw-bold fs-4 text-primary">{summary.total}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Нийт даалгавар</div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="fw-bold fs-4 text-success">{summary.completed}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Гүйцэтгэсэн</div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="fw-bold fs-4 text-info">
            {summary.avg_score != null ? summary.avg_score : '—'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Дундаж оноо</div>
        </div>
        <div className="col-6 col-sm-3">
          <div className="fw-bold fs-4" style={{ color: summary.success_rate != null ? rateColor : '#6c757d' }}>
            {summary.success_rate != null ? `${summary.success_rate}%` : '—'}
          </div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Амжилтын хувь</div>
        </div>
      </div>
      {summary.total > 0 && (
        <div className="mt-3">
          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            <span>Хамрагдалт</span>
            <span>{summary.completed}/{summary.total} ({Math.round(summary.completed / summary.total * 100)}%)</span>
          </div>
          <ProgressBar
            now={Math.round(summary.completed / summary.total * 100)}
            variant="success"
            style={{ height: 6 }}
          />
        </div>
      )}
    </>
  );
};

const AssignmentsTable = ({ assignments, isTeacherOrAdmin, navigate }) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: '0.82rem' }}>
      <thead className="table-light">
        <tr>
          <th style={{ minWidth: 200 }}>Даалгавар</th>
          <th className="text-center" style={{ width: 100 }}>Оноо</th>
          <th className="text-center" style={{ width: 110 }}>Төлөв</th>
          <th className="text-center" style={{ width: 90 }}>Хугацаа</th>
          <th className="text-center" style={{ width: 110 }}>Огноо</th>
          {isTeacherOrAdmin && <th style={{ width: 60 }} />}
        </tr>
      </thead>
      <tbody>
        {assignments.length === 0 ? (
          <tr>
            <td colSpan={isTeacherOrAdmin ? 6 : 5} className="text-center text-muted py-4">
              Энэ хугацаанд гүйцэтгэсэн даалгавар байхгүй
            </td>
          </tr>
        ) : assignments.map(a => {
          const si = STATUS_CONFIG[a.status] || STATUS_CONFIG.not_started;
          const hasResult = a.answer_sheet_id && ['submitted', 'graded'].includes(a.status);
          const pct = a.score != null && a.max_score
            ? Math.min(100, Math.round(a.score / a.max_score * 100)) : null;

          return (
            <tr key={a.assignment_id}>
              <td className="ps-3">
                <div className="fw-medium">{a.title}</div>
                {a.teacher_comment && (
                  <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    💬 {a.teacher_comment}
                  </div>
                )}
              </td>
              <td className="text-center fw-semibold"
                style={{ color: scoreColor(a.score, a.max_score) }}>
                {a.score != null ? (
                  <>
                    {a.score}
                    <span className="text-muted fw-normal">/{a.max_score}</span>
                    {pct != null && (
                      <span className="ms-1 text-muted fw-normal" style={{ fontSize: '0.7rem' }}>
                        ({pct}%)
                      </span>
                    )}
                  </>
                ) : <span className="text-muted fw-normal">—</span>}
              </td>
              <td className="text-center">
                <Badge bg={si.bg} style={{ fontSize: '0.68rem' }}>{si.label}</Badge>
                {a.source === 'answer_sheet' && (
                  <div>
                    <Badge bg="light" text="secondary" className="border mt-1"
                      style={{ fontSize: '0.6rem' }}>import</Badge>
                  </div>
                )}
              </td>
              <td className="text-center text-muted" style={{ fontSize: '0.72rem' }}>
                {a.time_spent ? (
                  <span className="d-flex align-items-center justify-content-center gap-1">
                    <Clock size={11} />{fmtTime(a.time_spent)}
                  </span>
                ) : '—'}
              </td>
              <td className="text-center text-muted" style={{ fontSize: '0.72rem' }}>
                {a.submitted_at
                  ? new Date(a.submitted_at).toLocaleDateString('mn-MN')
                  : '—'}
              </td>
              {isTeacherOrAdmin && (
                <td className="text-center">
                  {hasResult && a.quiz_uuid && (
                    <Button variant="outline-primary" size="sm" className="py-0 px-1"
                      title="Дэлгэрэнгүй харах"
                      onClick={() => navigate(
                        `/quiz/${encodeURIComponent(a.quiz_uuid)}/result/${a.answer_sheet_id}`
                      )}>
                      👁
                    </Button>
                  )}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

function fmtTime(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}ц ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

const ExerciseSummaryCards = ({ summary }) => {
  const rateColor = summary.correct_rate == null ? '#6c757d'
    : summary.correct_rate >= 80 ? '#198754'
    : summary.correct_rate >= 50 ? '#fd7e14' : '#dc3545';
  return (
    <div className="row g-3 text-center">
      <div className="col-6 col-sm-3">
        <div className="fw-bold fs-4 text-primary">{summary.days}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Оролцсон өдөр</div>
      </div>
      <div className="col-6 col-sm-3">
        <div className="fw-bold fs-4 text-success">{summary.answered}</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Нийт хариулт</div>
      </div>
      <div className="col-6 col-sm-3">
        <div className="fw-bold fs-4" style={{ color: rateColor }}>
          {summary.correct_rate != null ? `${summary.correct_rate}%` : '—'}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Зөв хариултын %</div>
      </div>
      <div className="col-6 col-sm-3">
        <div className="fw-bold fs-4 text-info d-flex align-items-center justify-content-center gap-1">
          <Clock size={18} />{fmtTime(summary.total_time)}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Нийт хугацаа</div>
      </div>
    </div>
  );
};

const ExercisesTable = ({ byDate }) => (
  <div style={{ overflowX: 'auto' }}>
    <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: '0.82rem' }}>
      <thead className="table-light">
        <tr>
          <th>Огноо</th>
          <th className="text-center">Бодлого</th>
          <th className="text-center">Зөв</th>
          <th className="text-center">Амжилт</th>
          <th className="text-center">Хугацаа</th>
        </tr>
      </thead>
      <tbody>
        {byDate.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center text-muted py-4">
              Энэ хугацаанд дасгал хийгээгүй байна
            </td>
          </tr>
        ) : byDate.map(row => {
          const pct = row.answered > 0 ? Math.round(row.correct / row.answered * 100) : 0;
          const color = pct >= 80 ? '#198754' : pct >= 50 ? '#fd7e14' : '#dc3545';
          return (
            <tr key={row.date}>
              <td className="ps-3 fw-medium">{row.date}</td>
              <td className="text-center">
                {row.answered}
                <span className="text-muted">/{row.total_items}</span>
              </td>
              <td className="text-center text-success fw-semibold">{row.correct}</td>
              <td className="text-center">
                {row.answered > 0 ? (
                  <span style={{ color, fontWeight: 600 }}>{pct}%</span>
                ) : <span className="text-muted">—</span>}
              </td>
              <td className="text-center text-muted">{fmtTime(row.time_spent)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const StudentReportPage = () => {
  const { username } = useParams();
  const { clubData, isTeacherOrAdmin } = useOutletContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!clubData?.id || !username) return;
    setLoading(true);
    apiClient
      .get(`/api/clubs/${clubData.id}/member_report/`, { params: { username } })
      .then(res => setReport(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [clubData?.id, username]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;

  if (error) return (
    <div className="py-3">
      <AppBreadcrumb className="mb-2" items={[
        { label: clubData?.name || 'Клуб', to: `/clubs/${clubData?.id}` },
        { label: 'Гишүүд', to: `/clubs/${clubData?.id}/members` },
        { label: username },
      ]} />
      <div className="text-danger small">{error}</div>
    </div>
  );

  if (!report) return null;

  const { student, all_time, last_7_days } = report;
  const current = tab === 'all' ? all_time : last_7_days;

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      {/* Breadcrumb */}
      <AppBreadcrumb className="mb-3" items={[
        { label: clubData?.name || 'Клуб', to: `/clubs/${clubData?.id}` },
        { label: 'Гишүүд', to: `/clubs/${clubData?.id}/members` },
        { label: displayName(student) || username },
      ]} />

      {/* Сурагчийн мэдээлэл */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <Avatar student={student} size={52} />
          <div>
            <div className="fw-bold fs-6">{displayName(student)}</div>
            <div className="text-muted small">@{student.username}</div>
            {student.grade_name && (
              <Badge bg="light" text="dark" className="border mt-1" style={{ fontSize: '0.72rem' }}>
                {student.grade_name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tab */}
      <Nav variant="tabs" className="mb-0" activeKey={tab} onSelect={setTab}>
        <Nav.Item>
          <Nav.Link eventKey="all" style={{ fontSize: '0.85rem' }}>
            Нийт хугацаа
            <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>
              {all_time.summary.total}
            </Badge>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="week" style={{ fontSize: '0.85rem' }}>
            Сүүлийн 7 өдөр
            <Badge bg="primary" className="ms-2" style={{ fontSize: '0.65rem' }}>
              {last_7_days.summary.completed}
            </Badge>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Нийт статистик */}
      <div className="card border-warning border-top-0 rounded-top-0 mb-3">
        <div className="card-body py-3">
          <SummaryCards summary={current.summary} />
        </div>
      </div>

      {/* Даалгаврын дэлгэрэнгүй */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>
          {tab === 'all' ? 'Бүх даалгаврын дүн' : 'Сүүлийн 7 өдрийн дүн'}
        </div>
        <AssignmentsTable
          assignments={current.assignments}
          isTeacherOrAdmin={isTeacherOrAdmin}
          navigate={navigate}
        />
      </div>

      {/* Дасгалын статистик */}
      {current.exercises && (
        <>
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white py-2 d-flex align-items-center gap-2"
              style={{ fontSize: '0.85rem' }}>
              <Dumbbell size={15} />
              <span className="fw-semibold">Өдрийн дасгал</span>
              <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>
                {current.exercises.summary.days} өдөр
              </Badge>
            </div>
            <div className="card-body py-3">
              <ExerciseSummaryCards summary={current.exercises.summary} />
            </div>
          </div>

          {current.exercises.by_date.length > 0 && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>
                Өдөр тус бүрийн дасгал
              </div>
              <ExercisesTable byDate={current.exercises.by_date} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentReportPage;
