// frontend/src/pages/ProgramDetailPage.jsx
import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { GraduationCap, Bot, Users } from 'lucide-react';
import useProgramProgress from '../hooks/useProgramProgress';
import ProgramProgressPanel from '../components/ProgramProgressPanel';
import { remindProgramTopics } from '../services/curriculumService';

/**
 * Хөтөлбөрийн тусдаа хуудас — "Клубын хөтөлбөр" болон "Миний хөтөлбөр" хоёулаа
 * эндээс ирнэ (хуваалцсан "хөтөлбөрийн үндсэн хуудас"): суралцах (сэдэв бүрийн
 * шалгах тест), үр дүн (mastery явц) болон AI багштай чат эхлүүлэх бүгд эндээс
 * хийгдэнэ. `?club=<id>` query байвал клубын контекстээс ирснийг илтгэнэ — клубын
 * зааж буй долоо хоногийг (club_week) мэдээллийн зорилгоор нэмж харуулна, сурагчийн
 * өөрийн явцыг (чөлөөт хурд) хязгаарлахгүй.
 */
const ProgramDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('club');
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState(null);

  const {
    loading,
    error,
    data,
    generatingReview,
    requestReviewQuiz,
  } = useProgramProgress(id);

  const goToQuiz = (quiz) => {
    if (quiz) navigate(`/quiz/${quiz.quiz_uuid}`);
  };

  const goToTopic = (topicId) => {
    const suffix = clubId ? `?club=${clubId}` : '';
    navigate(`/programs/${id}/topics/${topicId}${suffix}`);
  };

  const handleChatWithTeacher = async () => {
    setChatting(true);
    setChatError(null);
    try {
      const result = await remindProgramTopics(id);
      navigate(`/messages/conversation/${result.conversation_uuid}`);
    } catch {
      setChatError('AI багштай холбогдоход алдаа гарлаа.');
    } finally {
      setChatting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '760px' }}>
      <Breadcrumb listProps={{ className: 'mb-3' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        {clubId && (
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/clubs/${clubId}/curriculum` }}>
            Клуб
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item active>{data?.program?.name || 'Хөтөлбөр'}</Breadcrumb.Item>
      </Breadcrumb>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <h4 className="d-flex align-items-center gap-2 mb-0">
            <GraduationCap size={22} className="text-primary" />
            {data?.program?.name || (loading ? 'Ачааллаж байна...' : 'Хөтөлбөр')}
            {data?.program?.grade && <Badge bg="secondary">{data.program.grade}-р анги</Badge>}
          </h4>
          <Button variant="outline-primary" onClick={handleChatWithTeacher} disabled={chatting}>
            {chatting ? (
              <Spinner as="span" size="sm" className="me-1" />
            ) : (
              <Bot size={16} className="me-1" />
            )}
            AI багштай ярилцах
          </Button>
        </Card.Body>
      </Card>

      {chatError && <Alert variant="danger" className="py-2 small">{chatError}</Alert>}

      {data?.club_week && data.club_week !== data.my_week && (
        <Alert variant="light" className="py-2 small border d-flex align-items-center gap-2">
          <Users size={14} className="text-muted" />
          Клуб яг одоо <strong>{data.club_week}-р долоо хоногийг</strong> хичээллэж байна. Та өөрийн
          хурдаараа урагшлах/ноцрох боломжтой — энэ таны хувийн явцад нөлөөлөхгүй.
        </Alert>
      )}

      <ProgramProgressPanel
        loading={loading}
        error={error}
        data={data}
        onTopicClick={goToTopic}
        generatingReview={generatingReview}
        onReviewQuiz={async () => goToQuiz(await requestReviewQuiz())}
      />
    </Container>
  );
};

export default ProgramDetailPage;
