import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Users, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyClubs } from '../services/clubsService';

const MyClubsWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchClubs = async () => {
      try {
        const data = await getMyClubs(user.username);
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data.results || [];
          list.sort((a, b) =>
            (b.members_count ?? b.member_count ?? 0) - (a.members_count ?? a.member_count ?? 0)
          );
          setClubs(list);
        }
      } catch (err) {
        console.error('MyClubsWidget: failed to fetch clubs', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClubs();
    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex align-items-center">
            <Users size={20} className="text-primary me-2" />
            <strong>Миний клубууд</strong>
          </div>
        </Card.Header>
        <Card.Body className="text-center py-3">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Users size={20} className="text-primary me-2" />
            <strong>Миний клубууд</strong>
          </div>
          <Link to="/clubs" className="text-decoration-none" style={{ fontSize: '0.8rem' }}>
            Бүгд
          </Link>
        </div>
      </Card.Header>
      {clubs.length === 0 ? (
        <Card.Body className="text-center py-3">
          <p className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>
            Клуб байхгүй байна
          </p>
          <Link to="/clubs" className="btn btn-sm btn-outline-primary">
            <Plus size={14} className="me-1" />
            Клуб нэгдэх
          </Link>
        </Card.Body>
      ) : (
        <ListGroup variant="flush">
          {clubs.map((club) => (
            <ListGroup.Item
              key={club.id}
              as={Link}
              to={`/clubs/${club.id}`}
              action
              className="d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none"
              style={{ fontSize: '0.8rem' }}
            >
              <span className="text-truncate me-2" style={{ minWidth: 0 }}>
                {club.name}
              </span>
              <Badge bg="light" text="dark" className="flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                {club.members_count || club.member_count || ''}
              </Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Card>
  );
};

export default MyClubsWidget;
