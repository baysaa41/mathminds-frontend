import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { ArrowLeft, CheckCircle2, Circle, Flame } from 'lucide-react';
import { getTeacherStudentReport, getTeacherStudentDaily } from '../services/clubService';
import MathText from '../components/MathText';
import RadarChart from '../components/charts/RadarChart';
import { f1, buildSkillRadarAxes, skillRadarAriaLabel } from '../components/charts/skillRadarAxes';
const diffText = (v, peer) => {
  if (v == null || peer == null) return '—';
  const d = v - peer;
  return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`;
};

const StatusBadge = ({ attempted, reliable }) => {
  if (reliable) return <Badge bg="primary" style={{ fontSize: '0.68rem' }}>Найдвартай</Badge>;
  if (attempted > 0) return <Badge bg="warning" text="dark" style={{ fontSize: '0.68rem' }}>Дата хангалтгүй</Badge>;
  return <Badge bg="secondary" style={{ fontSize: '0.68rem' }}>Хариулт алга</Badge>;
};

// Сурагчийн сүүлийн 7 хоногийн "Өдрийн 5 бодлого"
const DailyHistoryCard = ({ username }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getTeacherStudentDaily(username, 7).then(setData).catch(() => setError(true));
  }, [username]);

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <span>Өдрийн бодлого — сүүлийн 7 хоног</span>
        {data?.streak > 0 && (
          <Badge bg="warning" text="dark" className="ms-auto d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
            <Flame size={12} /> {data.streak} өдөр дараалан бодлоо
          </Badge>
        )}
      </div>
      {error && <div className="card-body text-danger small">Ачааллахад алдаа гарлаа.</div>}
      {!error && !data && <div className="card-body text-center"><Spinner animation="border" size="sm" /></div>}
      {data && data.history.length === 0 && (
        <div className="card-body text-muted text-center py-3" style={{ fontSize: '0.82rem' }}>
          Сүүлийн 7 хоногт өдрийн бодлого үүсээгүй
        </div>
      )}
      {data && data.history.length > 0 && (
        <div className="list-group list-group-flush">
          {data.history.map((day) => (
            <div key={day.date} className="list-group-item border-0 border-top py-2">
              <div className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.8rem' }}>
                <span className="fw-semibold">{new Date(`${day.date}T00:00:00`).toLocaleDateString('mn-MN')}</span>
                <Badge bg={day.total && day.done === day.total ? 'success' : day.done ? 'primary' : 'secondary'}
                  style={{ fontSize: '0.68rem' }}>
                  {day.done}/{day.total}
                </Badge>
              </div>
              {day.items.length === 0 ? (
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Санал болгох бодлого олдоогүй</div>
              ) : day.items.map((it) => (
                <Link key={it.problem_id} to={`/problem/${it.problem_uuid}`}
                  className="d-flex align-items-center gap-2 text-decoration-none text-body py-1" style={{ fontSize: '0.8rem' }}>
                  {it.status === 'done'
                    ? <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                    : <Circle size={14} className="text-muted flex-shrink-0" />}
                  <MathText>{it.title}</MathText>
                  {it.category_mn && <span className="badge bg-light text-dark border ms-auto" style={{ fontSize: '0.65rem' }}>{it.category_mn}</span>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TeacherStudentReportPage = () => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTeacherStudentReport(username)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail || 'Тайлан ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  if (error) {
    return (
      <div className="py-3">
        <Link to="/teacher-dashboard" className="small text-decoration-none"><ArrowLeft size={14} /> Багшийн самбар</Link>
        <div className="text-danger small mt-3">{error}</div>
      </div>
    );
  }
  if (!data) return null;

  const { axes, totals, min_reliable: minReliable, peer_students: peerStudents } = data;
  const chartAxes = buildSkillRadarAxes(axes, minReliable);
  const reliableCount = axes.filter((a) => a.reliable).length;
  const ariaLabel = skillRadarAriaLabel(axes);

  return (
    <div className="py-3" style={{ maxWidth: 960 }}>
      <Link to="/teacher-dashboard" className="small text-decoration-none">
        <ArrowLeft size={14} /> Багшийн самбар
      </Link>
      <h5 className="fw-bold mt-2 mb-1">{data.student.name}</h5>
      <div className="text-muted small mb-3">
        Сэдвийн чадварын тайлан · {data.peer_clubs.map((c) => c.name).join(', ')}
      </div>

      <div className="row g-2 mb-3">
        {[
          { n: totals.attempted, l: 'Хариулсан бодлого' },
          { n: `${totals.correct} (${f1(totals.pct)})`, l: 'Зөв хариулсан' },
          { n: f1(totals.peer_pct), l: `Үе тэнгийн дундаж (${peerStudents} сурагч)` },
          { n: `${reliableCount} / ${axes.length}`, l: 'Найдвартай дүгнэх сэдэв' },
        ].map((s) => (
          <div key={s.l} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body py-2 px-3">
                <div className="fw-bold" style={{ fontSize: '1.25rem' }}>{s.n}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{s.l}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>
          Сэдэв тус бүрийн зөв хариултын хувь
        </div>
        <div className="card-body">
          <RadarChart
            axes={chartAxes}
            ariaLabel={ariaLabel}
            seriesName={data.student.name}
            peerName="Үе тэнгийн дундаж"
          />
          <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
            Тэнхлэг бүр 0–100%. <b>n</b> нь хариулсан бодлогын тоо. Хоосон тойрог бол {minReliable}-аас цөөн бодлогын
            хувь тул хэлбэрт итгэж болохгүй.
          </p>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-header bg-white fw-semibold py-2" style={{ fontSize: '0.85rem' }}>Нарийвчилсан тоо</div>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0" style={{ fontSize: '0.82rem', minWidth: 620 }}>
            <thead className="text-muted">
              <tr>
                <th>Сэдэв</th>
                <th className="text-end">Бодсон</th>
                <th className="text-end">Зөв</th>
                <th className="text-end">Зөв хувь</th>
                <th className="text-end">Үе тэнгийн дундаж</th>
                <th className="text-end">Зөрүү</th>
                <th>Найдвартай эсэх</th>
              </tr>
            </thead>
            <tbody>
              {axes.map((a) => (
                <tr key={a.key} className={a.attempted === 0 ? 'text-muted' : ''}>
                  <td>{a.label}</td>
                  <td className="text-end">{a.attempted}</td>
                  <td className="text-end">{a.pct == null ? '—' : a.correct}</td>
                  <td className="text-end">{f1(a.pct)}</td>
                  <td className="text-end">{f1(a.peer_pct)}</td>
                  <td className="text-end">{diffText(a.pct, a.peer_pct)}</td>
                  <td><StatusBadge attempted={a.attempted} reliable={a.reliable} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="fw-semibold">
              <tr>
                <td>Нийт</td>
                <td className="text-end">{totals.attempted}</td>
                <td className="text-end">{totals.correct}</td>
                <td className="text-end">{f1(totals.pct)}</td>
                <td className="text-end">{f1(totals.peer_pct)}</td>
                <td className="text-end">{diffText(totals.pct, totals.peer_pct)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <DailyHistoryCard username={username} />

      <p className="text-muted" style={{ fontSize: '0.75rem' }}>
        Эх сурвалж: шалгалт, клубын даалгаврын шалгагдсан хариулт. Үе тэнгийн дундаж нь энэ сурагчийн бөглөсөн
        шалгалтуудыг бөглөсөн клубын бусад гишүүдийн хариултаас тооцсон. AI чатын хариулт ({data.ai_chat_answers}) тайланд
        ороогүй. Тайлан зөвхөн багшид харагдана.
      </p>
    </div>
  );
};

export default TeacherStudentReportPage;
