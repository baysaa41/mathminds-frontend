// src/pages/CreateClub.jsx
// ✅ ШИНЭ: Клуб үүсгэх хуудас
// ✅ ЗАСВАР: Syntax-н алдааг зассан (Container-н хаалт)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { ArrowLeft, PlusCircle } from 'lucide-react';

// ✅ Service-г ашиглах
import clubsService, { formatErrorMessage } from '../services/clubsService'; //

const CreateClub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clubType, setClubType] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clubData = { name, description, club_type: clubType };
      const newClub = await clubsService.createClub(clubData); //

      if (newClub && newClub.id) {
        console.log('Клуб амжилттай үүслээ, ID:', newClub.id);
        navigate(`/clubs/${newClub.id}`); //
      } else {
        throw new Error('Клуб үүссэн ч ID-г буцаасангүй.');
      }
    } catch (err) {
      console.error('Клуб үүсгэхэд алдаа гарлаа:', err);
      setError(formatErrorMessage(err)); //
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: '700px' }}>
      {/* Буцах товч */}
      <Button
        variant="link"
        onClick={() => navigate(user?.username ? `/clubs/user/${user.username}` : '/clubs')} // "Миний клубууд" руу буцах
        className="p-0 text-decoration-none mb-3"
      >
        <ArrowLeft size={16} className="me-2" />
        Миний клубууд руу буцах
      </Button>

      <Card className="shadow-sm">
        <Card.Header className="p-4">
          <h1 className="h3 mb-0">Шинэ клуб үүсгэх</h1>
          <p className="text-muted mb-0">Сурагчдаа удирдах шинэ бүлгээ үүсгэнэ үү.</p>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="clubName">
              <Form.Label>Клубын нэр</Form.Label>
              <Form.Control
                type="text"
                placeholder="Жишээ: 12А ангийн математик"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="clubDescription">
              <Form.Label>Товч тайлбар (заавал биш)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Жишээ: Энэ бүлэгт ЭЕШ-д бэлдэх бодлогууд орно."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="clubType">
              <Form.Label>Клубын төрөл</Form.Label>
              <Form.Select
                value={clubType}
                onChange={(e) => setClubType(e.target.value)}
              >
                <option value="PUBLIC">Нээлттэй клуб</option>
                <option value="CLOSED">Хаалттай клуб</option>
                <option value="STUDY">Суралцах клуб</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Нээлттэй - Хэн ч элсэж болно, Хаалттай - Урилгаар элсэнэ, Суралцах - Хичээл заах клуб
              </Form.Text>
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading || !name.trim()} size="lg">
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Үүсгэж байна...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} className="me-2" />
                    Үүсгэх
                  </>
                )}
              </Button>
            </div>
          </Form>
          {/* ✅ АЛДААГ ЗАССАН НЬ: </Card.Body> энд хаагдах ёстой */}
        </Card.Body>
        {/* ✅ АЛДААГ ЗАССАН НЬ: </Card> энд хаагдах ёстой */}
      </Card>
      {/* ✅ АЛДААГ ЗАССАН НЬ: </Container> энд хаагдах ёстой */}
    </Container>
  );
};

export default CreateClub;
