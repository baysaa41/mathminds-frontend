// frontend/src/components/MyProgramCard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';
import { getMyClubs, getClubDetail, getProgramTeacher } from '../services/clubsService';
import { createConversation } from '../services/conversationService';

/**
 * Сурагч өөрийн сонгосон хөтөлбөрийн дагуу суралцах карт.
 * - Хөтөлбөр сонгоогүй бол идэвхтэй хөтөлбөрүүдээс сонгуулна.
 * - Сонгосон бол энэ долоо хоногийн сэдвүүдийг харуулна.
 * - Үүнээс гадна гишүүн болсон клубуудад холбогдсон хөтөлбөрүүдийг давхар харуулна.
 * - Хөтөлбөр бүрийн ард "AI багштай ярилцах" товч байрлана — тухайн хөтөлбөрт
 *   зориулсан AI багштай (шаардлагатай бол автоматаар үүсгэгдэнэ) чат эхлүүлнэ.
 */
const MyProgramCard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [week, setWeek] = useState(null);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState(null);
  const [clubPrograms, setClubPrograms] = useState([]);
  const [chattingProgramId, setChattingProgramId] = useState(null);

  useEffect(() => {
    fetchMyProgram();
    fetchClubPrograms();
  }, []);

  const fetchClubPrograms = async () => {
    try {
      const clubsData = await getMyClubs();
      const clubs = clubsData?.results || clubsData || [];
      const details = await Promise.all(
        clubs.map((c) => getClubDetail(c.id).catch(() => null))
      );
      const withPrograms = details
        .filter((d) => d && (d.curriculum_programs_info || []).length > 0)
        .map((d) => ({
          id: d.id,
          name: d.name,
          programs: d.curriculum_programs_info,
          weekTopics: d.current_week_topics || [],
        }));
      setClubPrograms(withPrograms);
    } catch {
      // Клубын хөтөлбөрийн мэдээлэл заавал биш тул үндсэн урсгалыг блоклохгүй
    }
  };

  const fetchMyProgram = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/curriculum/my-programs/');
      const active = (data || [])[0];
      if (active) {
        setProgram(active.program);
        fetchCurrentWeek(active.program.id);
      } else {
        setProgram(null);
        fetchPrograms();
      }
    } catch {
      setError('Хөтөлбөрийн мэдээлэл татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const { data } = await apiClient.get('/api/curriculum/programs/');
      setPrograms(data || []);
    } catch {
      setError('Хөтөлбөрийн жагсаалт татахад алдаа гарлаа.');
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchCurrentWeek = async (programId) => {
    try {
      const { data } = await apiClient.get('/api/curriculum/current-week/', {
        params: { program: programId },
      });
      setWeek(data.week);
      setTopics(data.topics || []);
    } catch {
      // Долоо хоногийн мэдээлэл заавал биш тул урсгалыг блоклохгүй
    }
  };

  const handleSelectProgram = async (programId) => {
    setEnrolling(true);
    setError(null);
    try {
      await apiClient.post('/api/curriculum/my-programs/', { program_id: programId });
      await fetchMyProgram();
    } catch {
      setError('Хөтөлбөр сонгоход алдаа гарлаа.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleChatWithProgramTeacher = async (programId) => {
    setChattingProgramId(programId);
    setError(null);
    try {
      const teacher = await getProgramTeacher(programId);
      const conversation = await createConversation(teacher.username);
      navigate(`/messages/conversation/${conversation.uuid}`);
    } catch {
      setError('AI багштай холбогдоход алдаа гарлаа.');
    } finally {
      setChattingProgramId(null);
    }
  };

  const renderChatButton = (programId) => (
    <Button
      type="button"
      size="sm"
      variant="outline-primary"
      onClick={() => handleChatWithProgramTeacher(programId)}
      disabled={chattingProgramId === programId}
    >
      {chattingProgramId === programId ? (
        <Spinner as="span" size="sm" className="me-1" />
      ) : (
        <i className="bi bi-robot me-1"></i>
      )}
      AI багштай ярилцах
    </Button>
  );

  if (loading) {
    return (
      <Card className="p-3 mb-3 mx-3 shadow-sm text-center">
        <Spinner animation="border" size="sm" />
      </Card>
    );
  }

  return (
    <Card className="p-3 mb-3 mx-3 shadow-sm">
      {error && (
        <Alert variant="danger" className="py-2 small mb-2">
          {error}
        </Alert>
      )}

      {!program ? (
        <>
          <Card.Title className="h6 mb-2">
            <i className="bi bi-mortarboard me-1"></i>
            Хөтөлбөрөө сонгоорой
          </Card.Title>
          {loadingPrograms ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-muted small">Идэвхтэй хөтөлбөр олдсонгүй.</div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {programs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="btn btn-outline-secondary text-start"
                  onClick={() => handleSelectProgram(p.id)}
                  disabled={enrolling}
                >
                  <span className="fw-bold d-block">{p.name}</span>
                  <span className="text-muted small">
                    {p.grade}-р анги{p.academic_year ? ` · ${p.academic_year}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <Card.Title className="h6 mb-1">
              <i className="bi bi-mortarboard me-1"></i>
              {program.name}
              <Badge bg="secondary" className="ms-2">
                {program.grade}-р анги
              </Badge>
            </Card.Title>
            {renderChatButton(program.id)}
          </div>
          {week ? (
            <div className="mt-2">
              <div className="small text-muted mb-1">
                {week.week_num}-р долоо хоног ({week.start_date} – {week.end_date})
              </div>
              {topics.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {topics.map((t, i) => (
                    <li key={i} className="mb-1">
                      <span className="fw-semibold">{t.topic}</span>
                      {t.description && <div className="text-muted small">{t.description}</div>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted small">Энэ долоо хоногт төлөвлөсөн сэдэв алга.</div>
              )}
            </div>
          ) : (
            <div className="text-muted small mt-2">Одоогийн долоо хоногийн мэдээлэл алга.</div>
          )}
        </>
      )}

      {clubPrograms.length > 0 && (
        <div className={program ? 'mt-3 pt-3 border-top' : 'mt-3'}>
          <div className="small text-muted fw-semibold mb-2">Клубын хөтөлбөрүүд</div>
          {clubPrograms.map((cp) => (
            <div key={cp.id} className="mb-3">
              <div className="fw-semibold small mb-1">
                <i className="bi bi-people me-1"></i>
                {cp.name}
              </div>
              {cp.programs.map((p) => {
                const weekTopic = cp.weekTopics.find((t) => t.program_id === p.id);
                return (
                  <div
                    key={p.id}
                    className="d-flex justify-content-between align-items-start flex-wrap gap-2 ps-3 mb-1"
                  >
                    <div>
                      <div className="small">{p.name}</div>
                      {weekTopic ? (
                        <div className="text-muted small">
                          {weekTopic.week_num}-р долоо хоног: <span className="fw-semibold">{weekTopic.topic}</span>
                        </div>
                      ) : (
                        <div className="text-muted small">Энэ долоо хоногт төлөвлөсөн сэдэв алга.</div>
                      )}
                    </div>
                    {renderChatButton(p.id)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyProgramCard;
