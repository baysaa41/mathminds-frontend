import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { Users, Copy, Check } from 'lucide-react';
import { getStudentDashboard, startProblemChat } from '../services/integralService';
import { getParentLinkCode } from '../services/parentService';
import {
  ReviewCard, StudyPlanCard, DailyRecommendationCard, NextTopicCard, RecentQuizzesCard, UpcomingAssignmentsCard,
} from '../components/dashboard/DashboardCards';

const SUBJECTS = [
  { code: 'math', label: 'Математик' },
  { code: 'physics', label: 'Физик' },
  { code: 'chemistry', label: 'Хими' },
  { code: 'biology', label: 'Биологи' },
];

const LinkCodeCard = () => {
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getParentLinkCode().then((data) => setCode(data.code)).catch(() => {});
  }, []);

  if (!code) return null;

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <Users size={15} />
        <span>Эцэг эхтэй холбогдох код</span>
      </div>
      <div className="card-body py-3 d-flex align-items-center justify-content-between">
        <div>
          <div className="fw-bold" style={{ fontSize: '1.1rem', letterSpacing: '0.1em' }}>{code}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            Энэ кодыг эцэг эхдээ өгснөөр таны явцыг хянах боломжтой болно
          </div>
        </div>
        <Button variant="outline-secondary" size="sm" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </div>
    </div>
  );
};

const MyDayPage = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('math');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [chatLoadingItemId, setChatLoadingItemId] = useState(null);
  const [chatError, setChatError] = useState(null);

  const load = useCallback((subj) => {
    setLoading(true);
    setError(null);
    getStudentDashboard(subj)
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(subject); }, [subject, load]);

  const handleSolveDailyItem = async (item) => {
    if (chatLoadingItemId) return;
    setChatError(null);
    setChatLoadingItemId(item.id);
    try {
      const { conversation_uuid, problems, current_index } = await startProblemChat(item.problem_id);
      navigate('/ai-chat/messages', {
        state: {
          conversationUuid: conversation_uuid,
          startExamProblems: problems,
          startExamIndex: current_index,
        },
      });
    } catch (err) {
      setChatError(err.response?.data?.error || 'Чат эхлүүлэхэд алдаа гарлаа.');
      setChatLoadingItemId(null);
    }
  };

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      <h5 className="fw-bold mb-3">Миний өдөр</h5>

      <Nav variant="pills" className="mb-3 gap-2" activeKey={subject} onSelect={setSubject}>
        {SUBJECTS.map((s) => (
          <Nav.Item key={s.code}>
            <Nav.Link eventKey={s.code} style={{ fontSize: '0.82rem' }}>{s.label}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {loading && (
        <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
      )}

      {!loading && error && (
        <div className="text-danger small">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          {chatError && (
            <Alert variant="danger" dismissible onClose={() => setChatError(null)} className="py-2 small">
              {chatError}
            </Alert>
          )}
          <DailyRecommendationCard
            recommendation={data.daily_recommendations}
            onItemClick={handleSolveDailyItem}
            loadingItemId={chatLoadingItemId}
          />
          <ReviewCard review={data.review} />
          <StudyPlanCard plan={data.study_plan} />
          <NextTopicCard topic={data.next_topic} />
          <RecentQuizzesCard quizzes={data.recent_quizzes} />
          <UpcomingAssignmentsCard assignments={data.upcoming_assignments} />
          <LinkCodeCard />
        </>
      )}
    </div>
  );
};

export default MyDayPage;
