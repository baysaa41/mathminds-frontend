// frontend/src/components/ClassroomPosterCard.jsx
// Ангид өлгөх A0 постер: гишүүн бол шууд татна, үгүй бол гишүүнчлэл рүү (A0 нь гишүүнчлэлийн урамшуулал).
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import { Download, Lock } from 'lucide-react';
import authService from '../services/authService';
import { downloadClassroomPoster } from '../services/curriculumService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

const ClassroomPosterCard = ({ poster, showTopicLink = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const loggedIn = authService.isAuthenticated();

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadClassroomPoster(poster.id);
    } catch (err) {
      if (err.code === 'members_only') navigate('/membership?from=a0');
      else setError(err.error || 'Файл татахад алдаа гарлаа');
    } finally {
      setBusy(false);
    }
  };

  const goLogin = () => {
    setPostLoginRedirect(location.pathname + location.search);
    navigate('/login');
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      {poster.preview_url && (
        <Card.Img variant="top" src={poster.preview_url} alt={poster.title} loading="lazy"
                  style={{ aspectRatio: '1 / 1.414', objectFit: 'cover', objectPosition: 'top' }} />
      )}
      <Card.Body className="d-flex flex-column gap-2">
        <div className="d-flex gap-1 flex-wrap">
          <Badge bg="warning" text="dark">{poster.paper_size}</Badge>
          <Badge bg="light" text="dark">{poster.grade}-р анги · {poster.week_num}-р долоо хоног</Badge>
        </div>
        <div className="fw-semibold small">
          {showTopicLink ? (
            <Link to={`/programs/${poster.program_id}/topics/${poster.weekly_topic_id}`} className="text-decoration-none">
              {poster.title}
            </Link>
          ) : poster.title}
        </div>
        <div className="mt-auto">
          {poster.can_download ? (
            <Button size="sm" className="w-100" onClick={handleDownload} disabled={busy}>
              {busy ? <Spinner as="span" size="sm" /> : <><Download size={14} className="me-1" />{poster.paper_size} PDF татах</>}
            </Button>
          ) : loggedIn ? (
            <Button size="sm" variant="outline-primary" className="w-100" onClick={() => navigate('/membership?from=a0')}>
              <Lock size={14} className="me-1" />Гишүүн болж үнэгүй татах
            </Button>
          ) : (
            <Button size="sm" variant="outline-primary" className="w-100" onClick={goLogin}>
              <Lock size={14} className="me-1" />Нэвтэрч татах (гишүүдэд үнэгүй)
            </Button>
          )}
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ClassroomPosterCard;
