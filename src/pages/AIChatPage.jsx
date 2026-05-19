// frontend/src/pages/AIChatPage.jsx
// AI багш нарын танилцуулга хуудас — багшаа сонгоод чат руу шилжинэ.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import apiClient from '../api/axiosConfig';
import { createConversation } from '../services/conversationService';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import { BotMessageSquare, MessageCircle, Zap } from 'lucide-react';

const SUBJECT_LABELS = {
  math: 'Математик',
  physics: 'Физик',
  chemistry: 'Хими',
  biology: 'Биологи',
  all: 'Бүх хичээл',
};

const LEVEL_LABELS = {
  elementary: 'Бага анги',
  middle: 'Дунд анги',
  high: 'Ахлах анги',
  university: 'Их дээд сургууль',
  all: 'Бүх түвшин',
};

const ROLE_LABELS = {
  teacher: 'Багш',
  student: 'Сурагч',
};

const AIChatPage = () => {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await apiClient.get('/users/api/ai-teachers/');
        setTeachers(response.data);
      } catch (err) {
        console.error('AI багш нар ачаалахад алдаа:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const handleSelectTeacher = async (username) => {
    if (starting) return;
    setStarting(username);
    try {
      // Conversation үүсгэх/олох (backend get_or_create хийнэ)
      const conv = await createConversation(username);
      navigate('/ai-chat/messages', {
        state: { conversationUuid: conv.uuid },
      });
    } catch (err) {
      console.error('Conversation үүсгэхэд алдаа:', err);
      setStarting(null);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <AppHeader />

      <Container className="flex-grow-1 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <BotMessageSquare size={28} className="text-primary" />
            <h3 className="mb-0 fw-bold">AI Багш нар</h3>
          </div>
          <p className="text-muted mb-3">
            Хичээлийн AI багшаа сонгоод асуултаа асуугаарай. Хичээлийн аль ч сэдвээр тусламж авах боломжтой.
          </p>
          <a href="/solver" className="btn btn-outline-primary btn-sm">
            <Zap size={16} className="me-1" />
            AI Шийдэгч
          </a>
        </div>

        {/* Teacher Cards */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <BotMessageSquare size={48} className="mb-3 opacity-50" />
            <p>AI багш одоогоор байхгүй байна.</p>
          </div>
        ) : (
          <Row className="g-3 justify-content-center">
            {teachers.map((teacher) => (
              <Col key={teacher.id} xs={12} sm={6} md={4} lg={3}>
                <div
                  className="card h-100 border shadow-sm"
                  style={{ cursor: starting ? 'wait' : 'pointer', transition: 'box-shadow 0.2s' }}
                  onClick={() => handleSelectTeacher(teacher.username)}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = ''}
                >
                  <div className="card-body text-center p-3">
                    <div className="mb-3">
                      {teacher.picture_url ? (
                        <img
                          src={teacher.picture_url}
                          alt={teacher.name_mn}
                          className="rounded-circle"
                          style={{ width: 72, height: 72, objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto"
                          style={{ width: 72, height: 72 }}
                        >
                          <BotMessageSquare size={32} className="text-primary" />
                        </div>
                      )}
                    </div>

                    <h6 className="fw-bold mb-1">{teacher.name_mn}</h6>

                    <div className="d-flex flex-wrap gap-1 justify-content-center mb-2">
                      <Badge bg="primary" className="fw-normal">
                        {SUBJECT_LABELS[teacher.subject] || teacher.subject}
                      </Badge>
                      <Badge bg="secondary" className="fw-normal">
                        {LEVEL_LABELS[teacher.level] || teacher.level}
                      </Badge>
                    </div>

                    {teacher.bio && (
                      <p className="text-muted small mb-1">{teacher.bio}</p>
                    )}
                    {teacher.teaching_style && (
                      <p className="text-muted small mb-0 fst-italic">{teacher.teaching_style}</p>
                    )}

                    {starting === teacher.username && (
                      <div className="mt-2">
                        <Spinner animation="border" size="sm" variant="primary" />
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-transparent border-top-0 text-center pb-3">
                    <small className="text-primary fw-semibold">
                      <MessageCircle size={14} className="me-1" />
                      Яриа эхлүүлэх
                    </small>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default AIChatPage;
