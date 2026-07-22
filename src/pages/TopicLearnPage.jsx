// frontend/src/pages/TopicLearnPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Accordion from 'react-bootstrap/Accordion';
import { FileText, ListChecks, GraduationCap, ArrowLeft, ArrowRight, BookOpen, Target, Check, Star, Search } from 'lucide-react';
import { getWeeklyTopicLearn, getTopicCheckQuiz } from '../services/clubsService';
import ObjectiveLessonPanel from '../components/ObjectiveLessonPanel';
import TopicPracticeChat from '../components/TopicPracticeChat';
import { resolveResourceHref } from '../utils/resourceLink';

const RESOURCE_TYPE_LABELS = {
  article: 'Өгүүлэл',
  problem: 'Бодлого',
  pdf: 'PDF',
  link: 'Линк',
  video: 'Видео',
  quiz: 'Quiz',
};

const RESOURCE_TYPE_COLORS = {
  problem: 'secondary',
  article: 'danger',
  quiz: 'success',
  pdf: 'dark',
  video: 'primary',
  link: 'warning',
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180000;

/**
 * Клубын хөтөлбөр болон Миний хөтөлбөр хоёулаа энд ирнэ: тухайн долоо хоногийн
 * сэдвийн зорилт, эх сурвалж, санал болгох бодлого, эзэмшилт харуулж, эцэст нь
 * шалгах тест рүү шилжүүлнэ. `?club=<id>` query байвал "клуб руу буцах" харагдана.
 */
const TopicLearnPage = () => {
  const { programId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('club');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [activeObjectiveKey, setActiveObjectiveKey] = useState('0');
  const [deliveredIds, setDeliveredIds] = useState(() => new Set());

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    setActiveObjectiveKey('0');
    setDeliveredIds(new Set());
    getWeeklyTopicLearn(topicId)
      .then(setData)
      .catch(() => setError('Сэдвийн мэдээлэл татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuiz = async () => {
    setGeneratingQuiz(true);
    setError(null);
    try {
      const deadline = Date.now() + POLL_TIMEOUT_MS;
      let result = await getTopicCheckQuiz(topicId);
      while (result.status !== 'ready') {
        if (Date.now() > deadline) throw new Error('timeout');
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        result = await getTopicCheckQuiz(topicId);
      }
      navigate(`/quiz/${result.quiz_uuid}`);
    } catch {
      setError('Тест үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const backToProgramTo = clubId ? `/programs/${programId}?club=${clubId}` : `/programs/${programId}`;

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" size="sm" />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="py-4" style={{ maxWidth: '720px' }}>
        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
      </Container>
    );
  }

  const { weekly_topic: topic, objectives, resources, mastery, has_check_quiz, prev_topic, next_topic } = data;
  const masteryPct = Math.round((mastery?.mastery_score || 0) * 100);
  const starCount = Math.round(masteryPct / 20);
  const articleResources = resources?.filter((r) => r.resource_type === 'article') || [];
  const topicLinkTo = (t) => (clubId ? `/programs/${programId}/topics/${t.id}?club=${clubId}` : `/programs/${programId}/topics/${t.id}`);
  const lessonComplete = objectives?.length > 0 && objectives.every((o) => deliveredIds.has(o.id));

  const handleObjectiveDelivered = (objectiveId) => {
    setDeliveredIds((prev) => (prev.has(objectiveId) ? prev : new Set(prev).add(objectiveId)));
  };

  return (
    <Container className="py-4" style={{ maxWidth: '720px' }}>
      <Breadcrumb listProps={{ className: 'mb-3' }}>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Нүүр</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: backToProgramTo }}>Хөтөлбөр</Breadcrumb.Item>
        <Breadcrumb.Item active>{topic.topic}</Breadcrumb.Item>
      </Breadcrumb>

      {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <div className="text-muted small">{topic.week_num}-р долоо хоног</div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="mb-0">{topic.topic}</h4>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(topic.topic)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted"
              title="Google-ээс хайх"
            >
              <Search size={16} />
            </a>
          </div>
          <div className="d-flex align-items-center gap-1 mb-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < starCount ? 'text-warning' : 'text-muted'}
                fill={i < starCount ? 'currentColor' : 'none'}
              />
            ))}
            {mastery?.problems_attempted > 0 && (
              <span className="text-muted small ms-1">
                {mastery.problems_correct}/{mastery.problems_attempted} зөв
              </span>
            )}
          </div>

          {topic.description && <p className="text-muted mt-2 mb-0">{topic.description}</p>}

          {objectives?.length > 0 && (
            <div className="mt-3">
              <div className="text-muted small mb-1 d-flex align-items-center gap-1">
                <Target size={14} /> Суралцахуйн зорилтууд
              </div>
              <ul className="mb-0 ps-3 small">
                {objectives.map((o) => (
                  <li key={o.id} className={deliveredIds.has(o.id) ? 'text-success' : undefined}>
                    {o.text} {deliveredIds.has(o.id) && <Check size={12} className="ms-1" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h6 className="mb-0 fw-bold"><GraduationCap size={16} className="me-2" />Хичээл</h6>
        </Card.Header>
        <Card.Body>
          {articleResources.length > 0 && (
            <div className="mb-3 pb-3 border-bottom">
              <div className="text-muted small mb-1">Холбоотой өгүүлэл</div>
              <div className="d-flex flex-wrap gap-2">
                {articleResources.map((r) => {
                  const { to, external } = resolveResourceHref(r.url);
                  const LinkTag = external ? 'a' : Link;
                  const linkProp = external ? { href: to } : { to };
                  return (
                    <LinkTag
                      key={r.id}
                      {...linkProp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none d-flex align-items-center gap-1 small"
                    >
                      <BookOpen size={14} /> {r.title}
                    </LinkTag>
                  );
                })}
              </div>
            </div>
          )}

          {objectives?.length > 0 ? (
            <Accordion activeKey={activeObjectiveKey} onSelect={(key) => setActiveObjectiveKey(key)}>
              {objectives.map((o, idx) => (
                <Accordion.Item eventKey={String(idx)} key={o.id}>
                  <Accordion.Header>
                    <span className="d-flex align-items-center gap-2">
                      {deliveredIds.has(o.id) && <Check size={14} className="text-success" />}
                      {idx + 1}. {o.text}
                    </span>
                  </Accordion.Header>
                  <Accordion.Body>
                    {activeObjectiveKey === String(idx) && (
                      <ObjectiveLessonPanel
                        objective={o}
                        hasNext={idx < objectives.length - 1}
                        onNext={() => setActiveObjectiveKey(String(idx + 1))}
                        onDelivered={handleObjectiveDelivered}
                      />
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted small mb-0">Энэ сэдэвт суралцахуйн зорилт бүртгэгдээгүй байна.</p>
          )}

          {lessonComplete && (
            <div className="text-center mt-3 pt-3 border-top">
              <div className="text-muted small mb-2">Хичээл дууслаа — сурсанаа шалгах уу?</div>
              <Button
                variant={has_check_quiz ? 'outline-success' : 'outline-primary'}
                onClick={handleQuiz}
                disabled={generatingQuiz}
              >
                {generatingQuiz ? (
                  <><Spinner as="span" size="sm" className="me-1" />Бэлдэж байна...</>
                ) : has_check_quiz ? 'Тест бодох' : 'Тест үүсгэх'}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {resources?.length > 0 && (
        <Card className="border-0 shadow-sm mb-3">
          <Card.Header className="bg-white border-bottom">
            <h6 className="mb-0 fw-bold"><FileText size={16} className="me-2" />Эх сурвалж</h6>
          </Card.Header>
          <Card.Body className="d-flex flex-wrap gap-2">
            {resources.map((r) => {
              const { to, external } = resolveResourceHref(r.url);
              const LinkTag = external ? 'a' : Link;
              const linkProp = external ? { href: to, target: '_blank', rel: 'noopener noreferrer' } : { to };
              return (
                <LinkTag key={r.id} {...linkProp} className="text-decoration-none">
                  <Badge bg={RESOURCE_TYPE_COLORS[r.resource_type] || 'info'} className="fw-normal">
                    {RESOURCE_TYPE_LABELS[r.resource_type] || r.resource_type}: {r.title}
                  </Badge>
                </LinkTag>
              );
            })}
          </Card.Body>
        </Card>
      )}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Header className="bg-white border-bottom">
          <h6 className="mb-0 fw-bold"><ListChecks size={16} className="me-2" />Дасгал бодлого</h6>
        </Card.Header>
        <Card.Body>
          <TopicPracticeChat weeklyTopicId={topicId} />
        </Card.Body>
      </Card>

      {(prev_topic || next_topic) && (
        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          {prev_topic ? (
            <Link to={topicLinkTo(prev_topic)} className="text-decoration-none small d-flex align-items-center gap-1">
              <ArrowLeft size={14} /> {prev_topic.topic}
            </Link>
          ) : <span />}
          {next_topic ? (
            <Link to={topicLinkTo(next_topic)} className="text-decoration-none small d-flex align-items-center gap-1">
              {next_topic.topic} <ArrowRight size={14} />
            </Link>
          ) : <span />}
        </div>
      )}
    </Container>
  );
};

export default TopicLearnPage;
