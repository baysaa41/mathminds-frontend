import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { Users, Copy, Check } from 'lucide-react';
import { getStudentDashboard, startProblemChat, startMoreProblemsChat } from '../services/integralService';
import { getParentLinkCode } from '../services/parentService';
import {
  ReviewCard, StudyPlanCard, DailyRecommendationCard, NextTopicCard, RecentQuizzesCard, UpcomingAssignmentsCard,
} from '../components/dashboard/DashboardCards';


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
  // Одоогоор зөвхөн математик (Физик/Хими/Биологийн таб хасагдсан)
  const subject = 'math';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  // {list: 'daily'|'review', id} — хоёр жагсаалтын item id давхцаж болох тул ялгана
  const [chatLoading, setChatLoading] = useState(null);
  const [chatError, setChatError] = useState(null);
  const [moreLoading, setMoreLoading] = useState(false);

  const load = useCallback((subj) => {
    setLoading(true);
    setError(null);
    getStudentDashboard(subj)
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(subject); }, [subject, load]);

  const loadingIdFor = (list) => (chatLoading?.list === list ? chatLoading.id : null);

  // Өдрийн 5 бодлого болон "Давталт" хоёулаа ижил AI чатаар бодогдоно
  const handleSolveItem = (list) => async (item) => {
    if (chatLoading) return;
    setChatError(null);
    setChatLoading({ list, id: item.id });
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
      setChatLoading(null);
    }
  };

  // Өдрийн бодлого дууссаны дараа: өнөөдрийн чатыг нээж, MessagesPage нь
  // хувийн тохируулгатай (eesh-problems) бодлогыг widget-ээр илгээнэ.
  const handleMoreProblems = async () => {
    if (moreLoading) return;
    setChatError(null);
    setMoreLoading(true);
    try {
      const { conversation_uuid } = await startMoreProblemsChat(subject);
      navigate('/ai-chat/messages', {
        state: { conversationUuid: conversation_uuid, suggestProblem: true },
      });
    } catch (err) {
      setChatError(err.response?.data?.error || 'Чат эхлүүлэхэд алдаа гарлаа.');
      setMoreLoading(false);
    }
  };

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      <h5 className="fw-bold mb-3">Миний өдөр</h5>

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
            onItemClick={handleSolveItem('daily')}
            loadingItemId={loadingIdFor('daily')}
            onMoreProblems={subject === 'math' ? handleMoreProblems : null}
            moreLoading={moreLoading}
          />
          <ReviewCard
            review={data.review}
            onItemClick={handleSolveItem('review')}
            loadingItemId={loadingIdFor('review')}
          />
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
