import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Users, ClipboardList, AlertTriangle, Radar, Sparkles, ChevronRight } from 'lucide-react';
import { getTeacherDashboard, searchTeacherStudents } from '../services/clubService';
import MathText from '../components/MathText';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('mn-MN') : '—';

const masteryColor = (score) => score >= 0.3 ? '#fd7e14' : '#dc3545';

const ClubsCard = ({ clubs }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <Users size={15} />
      <span>Миний клубууд</span>
    </div>
    {clubs.length === 0 ? (
      <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
        Одоогоор удирдаж буй клуб алга
      </div>
    ) : (
      <div className="list-group list-group-flush">
        {clubs.map((c) => (
          <Link key={c.id} to={`/clubs/${c.id}`}
            className="list-group-item list-group-item-action p-0 border-0 border-top">
            <div className="d-flex align-items-center justify-content-between py-2 px-3">
              <span className="fw-medium" style={{ fontSize: '0.85rem' }}>{c.name}</span>
              <Badge bg="secondary" style={{ fontSize: '0.68rem' }}>{c.members_count} гишүүн</Badge>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

const StudentReportSearchCard = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      searchTeacherStudents(term)
        .then((d) => { if (!cancelled) setResults(d.results || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q]);

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <Radar size={15} />
        <span>Сурагчийн чадварын тайлан</span>
      </div>
      <div className="card-body py-2">
        <input
          id="teacher-student-search"
          type="search"
          className="form-control form-control-sm"
          placeholder="Сурагчийн нэр эсвэл username (2+ тэмдэгт)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {searching && <div className="px-3 pb-2 text-muted" style={{ fontSize: '0.75rem' }}>Хайж байна...</div>}
      {!searching && q.trim().length >= 2 && results.length === 0 && (
        <div className="px-3 pb-2 text-muted" style={{ fontSize: '0.78rem' }}>Таны клубын сурагч олдсонгүй</div>
      )}
      {results.length > 0 && (
        <div className="list-group list-group-flush">
          {results.map((s) => (
            <Link key={s.username} to={`/teacher-dashboard/students/${encodeURIComponent(s.username)}`}
              className="list-group-item list-group-item-action border-0 border-top py-2 px-3">
              <span className="fw-medium" style={{ fontSize: '0.85rem' }}>{s.name}</span>
              <span className="text-muted ms-2" style={{ fontSize: '0.72rem' }}>@{s.username}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const UngradedCard = ({ count, submissions }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <ClipboardList size={15} />
      <span>Шалгах ёстой</span>
      {count > 0 && <Badge bg="danger" pill>{count}</Badge>}
    </div>
    {submissions.length === 0 ? (
      <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
        Шалгах ёстой даалгавар алга 🎉
      </div>
    ) : (
      <div className="list-group list-group-flush">
        {submissions.map((s) => (
          <Link key={s.id} to={`/clubs/${s.club_id}/assignments/${s.assignment_id}`}
            className="list-group-item list-group-item-action p-0 border-0 border-top">
            <div className="d-flex align-items-center justify-content-between py-2 px-3">
              <div>
                <div className="fw-medium" style={{ fontSize: '0.85rem' }}>{s.assignment_title}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {s.student_name} · {s.club_name}
                </div>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{fmtDate(s.submitted_at)}</span>
            </div>
          </Link>
        ))}
        {count > submissions.length && (
          <div className="text-muted text-center py-2" style={{ fontSize: '0.75rem' }}>
            ... нийт {count} шалгах ёстой даалгавраас эхний {submissions.length}
          </div>
        )}
      </div>
    )}
  </div>
);

const WeakStudentsCard = ({ students }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
      <AlertTriangle size={15} />
      <span>Дэмжлэг хэрэгтэй сурагчид</span>
    </div>
    {students.length === 0 ? (
      <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
        Одоогоор сул тал илрээгүй байна
      </div>
    ) : (
      <div className="list-group list-group-flush">
        {students.map((s, i) => (
          <div key={`${s.student_username}-${s.topic_name}-${i}`}
            className="d-flex align-items-center justify-content-between py-2 px-3 border-top">
            <div>
              <Link to={`/teacher-dashboard/students/${encodeURIComponent(s.student_username)}`}
                className="fw-medium text-decoration-none" style={{ fontSize: '0.85rem' }}>
                {s.student_name}
              </Link>
              <MathText as="div" className="text-muted" style={{ fontSize: '0.72rem' }}>{s.topic_name}</MathText>
            </div>
            <span className="fw-semibold" style={{ fontSize: '0.85rem', color: masteryColor(s.mastery_score) }}>
              {Math.round(s.mastery_score * 100)}%
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DailyProblemsLinkCard = () => (
  <Link to="/teacher-dashboard/daily" className="card border-0 shadow-sm mb-3 text-decoration-none">
    <div className="card-body py-2 px-3 d-flex align-items-center gap-2">
      <Sparkles size={15} className="text-primary" />
      <div className="flex-grow-1">
        <div className="fw-semibold text-body" style={{ fontSize: '0.85rem' }}>Сурагчдын өдрийн бодлого</div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          Клуб, дэд бүлгээр болон сурагч тус бүрээр — хэн хэдийг бодсон, аль бодлого хүндрэлтэй байна
        </div>
      </div>
      <ChevronRight size={16} className="text-muted" />
    </div>
  </Link>
);

const TeacherDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    getTeacherDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  if (error) return <div className="py-3 text-danger small">{error}</div>;
  if (!data) return null;

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      <h5 className="fw-bold mb-3">Багшийн хяналтын самбар</h5>

      <DailyProblemsLinkCard />
      <StudentReportSearchCard />
      <UngradedCard count={data.ungraded_count} submissions={data.ungraded_submissions} />
      <WeakStudentsCard students={data.weak_students} />
      <ClubsCard clubs={data.clubs} />
    </div>
  );
};

export default TeacherDashboardPage;
