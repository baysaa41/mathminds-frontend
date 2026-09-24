import React, { useState, useEffect, useCallback } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { UserPlus } from 'lucide-react';
import { getChildren, linkChild, getChildDashboard } from '../services/parentService';
import {
  ReviewCard, StudyPlanCard, DailyRecommendationCard, NextTopicCard, RecentQuizzesCard, UpcomingAssignmentsCard,
} from '../components/dashboard/DashboardCards';

const SUBJECTS = [
  { code: 'math', label: 'Математик' },
  { code: 'physics', label: 'Физик' },
  { code: 'chemistry', label: 'Хими' },
  { code: 'biology', label: 'Биологи' },
];

const LinkChildForm = ({ onLinked }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError(null);
    linkChild(code.trim().toUpperCase())
      .then(onLinked)
      .catch((err) => setError(err.response?.data?.detail || 'Код буруу байна.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white fw-semibold py-2 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <UserPlus size={15} />
        <span>Хүүхэдтэй холбогдох</span>
      </div>
      <div className="card-body py-3">
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          Хүүхдийнхээ "Миний өдөр" хуудаснаас авсан кодыг оруулна уу.
        </p>
        <Form onSubmit={submit} className="d-flex gap-2">
          <Form.Control
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Жишээ: Y6MKO25Z"
            style={{ maxWidth: 220, textTransform: 'uppercase' }}
          />
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? <Spinner animation="border" size="sm" /> : 'Холбох'}
          </Button>
        </Form>
        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    </div>
  );
};

const ParentDashboardPage = () => {
  const [children, setChildren] = useState(null);
  const [activeChild, setActiveChild] = useState(null);
  const [subject, setSubject] = useState('math');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [childrenError, setChildrenError] = useState(null);

  const loadChildren = useCallback(() => {
    getChildren()
      .then((list) => {
        setChildren(list);
        if (list.length > 0) setActiveChild((prev) => prev || list[0].username);
      })
      .catch((err) => {
        setChildrenError(err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.');
        setChildren([]);
      });
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  useEffect(() => {
    if (!activeChild) return;
    setLoading(true);
    setError(null);
    getChildDashboard(activeChild, subject)
      .then(setData)
      .catch((err) => setError(err.response?.data?.error || err.response?.data?.detail || 'Мэдээлэл ачааллахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [activeChild, subject]);

  if (children === null) {
    return <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
  }

  return (
    <div className="py-3" style={{ maxWidth: 800 }}>
      <h5 className="fw-bold mb-3">Хүүхдийн явц</h5>

      {childrenError ? (
        <div className="text-danger small">{childrenError}</div>
      ) : children.length === 0 ? (
        <>
          <Alert variant="light" className="border" style={{ fontSize: '0.85rem' }}>
            Одоогоор хүүхэдтэй холбогдоогүй байна.
          </Alert>
          <LinkChildForm onLinked={loadChildren} />
        </>
      ) : (
        <>
          {children.length > 1 && (
            <Nav variant="pills" className="mb-2 gap-2" activeKey={activeChild} onSelect={setActiveChild}>
              {children.map((c) => (
                <Nav.Item key={c.username}>
                  <Nav.Link eventKey={c.username} style={{ fontSize: '0.82rem' }}>{c.name}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          )}

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
              <DailyRecommendationCard recommendation={data.daily_recommendations} />
              <ReviewCard review={data.review} />
              <StudyPlanCard plan={data.study_plan} />
              <NextTopicCard topic={data.next_topic} />
              <RecentQuizzesCard quizzes={data.recent_quizzes} />
              <UpcomingAssignmentsCard assignments={data.upcoming_assignments} />
            </>
          )}

          <LinkChildForm onLinked={loadChildren} />
        </>
      )}
    </div>
  );
};

export default ParentDashboardPage;
