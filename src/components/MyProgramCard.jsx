// frontend/src/components/MyProgramCard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { GraduationCap, Plus } from 'lucide-react';
import apiClient from '../api/axiosConfig';

/**
 * Сурагчийн ӨӨРӨӨ сонгосон хөтөлбөрүүдийн жагсаалт widget (sidebar) — клубын
 * гишүүнчлэлээр автоматаар холбогдсон хөтөлбөрүүдийг ЗОРИУДААР харуулахгүй
 * (`?self_only=true`, `curriculum/views.py:MyProgramsView`) — тэдгээрт клубын
 * хөтөлбөрийн цэснээс (ClubCurriculumPage) хандана.
 * - Дарахад тухайн хөтөлбөрийн тусдаа хуудас (/programs/:id) руу шилжинэ —
 *   суралцах, үр дүн, AI багштай чатлах бүгд тэндээс эхэлнэ.
 * - Хөтөлбөр нэмэх/цуцлах нь профайл засах хуудаснаас хийгдэнэ (тэнд бүх
 *   хөтөлбөр, клубтой холбоотойг оруулаад, харагдана — өөрчлөгдөөгүй).
 * MyClubsWidget/TrendingPostsWidget-тэй ижил Card.Header + ListGroup дизайн ашиглана.
 */
const MyProgramCard = () => {
  const [loading, setLoading] = useState(true);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyProgram();
  }, []);

  const fetchMyProgram = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/curriculum/my-programs/', {
        params: { self_only: true },
      });
      const enrollments = data || [];
      setEnrolledPrograms(enrollments.map((e) => ({ ...e, week: null, topics: [] })));
      enrollments.forEach((e) => fetchCurrentWeek(e.program.id));
    } catch {
      setError('Хөтөлбөрийн мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentWeek = async (programId) => {
    try {
      const { data } = await apiClient.get('/api/curriculum/current-week/', {
        params: { program: programId },
      });
      setEnrolledPrograms((prev) =>
        prev.map((ep) =>
          ep.program.id === programId ? { ...ep, week: data.week, topics: data.topics || [] } : ep
        )
      );
    } catch {
      // Долоо хоногийн мэдээлэл заавал биш тул урсгалыг блоклохгүй
    }
  };

  const header = (
    <Card.Header className="bg-white border-bottom">
      <div className="d-flex align-items-center">
        <GraduationCap className="text-primary me-2" size={20} />
        <strong>Миний хөтөлбөр</strong>
      </div>
    </Card.Header>
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        {header}
        <Card.Body className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  const hasEnrolledPrograms = enrolledPrograms.length > 0;

  return (
    <Card className="border-0 shadow-sm">
      {header}

      {error && (
        <div className="px-3 pt-2">
          <div className="text-danger small">{error}</div>
        </div>
      )}

      {!hasEnrolledPrograms && (
        <Card.Body className="text-center py-3" style={{ fontSize: '0.85rem' }}>
          <p className="text-muted mb-2">Идэвхтэй хөтөлбөр олдсонгүй.</p>
          <Link to="/profile/edit" className="btn btn-sm btn-outline-primary">
            <Plus size={14} className="me-1" />
            Хөтөлбөр нэмэх
          </Link>
        </Card.Body>
      )}

      {hasEnrolledPrograms && (
        <ListGroup variant="flush">
          {enrolledPrograms.map((ep) => (
            <ListGroup.Item
              key={ep.id}
              as={Link}
              to={`/programs/${ep.program.id}`}
              action
              className="py-2 px-3 text-decoration-none"
              style={{ fontSize: '0.8rem' }}
            >
              <div className="text-truncate">
                <span className="fw-semibold">{ep.program.name}</span>
                <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.65rem' }}>
                  {ep.program.grade}-р анги
                </Badge>
              </div>

              {ep.week ? (
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  {ep.week.week_num}-р долоо хоног:{' '}
                  {ep.topics.length > 0 ? (
                    <span className="fw-semibold">{ep.topics[0].topic}</span>
                  ) : (
                    'төлөвлөсөн сэдэв алга'
                  )}
                </div>
              ) : (
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  Одоогийн долоо хоногийн мэдээлэл алга.
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      {hasEnrolledPrograms && (
        <div className="px-3 py-2 border-top">
          <Link to="/profile/edit" className="small text-decoration-none">
            <Plus size={12} className="me-1" />
            Хөтөлбөр нэмэх
          </Link>
        </div>
      )}
    </Card>
  );
};

export default MyProgramCard;
