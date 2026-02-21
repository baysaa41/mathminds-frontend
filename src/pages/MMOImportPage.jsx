import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { Download, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MMOImportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(null); // olympiad ID being imported
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importedQuizId, setImportedQuizId] = useState(null);

  // Check if user is staff
  useEffect(() => {
    if (!user?.is_staff) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch olympiads on mount
  useEffect(() => {
    fetchOlympiads();
  }, []);

  const fetchOlympiads = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/integral/mmo-import/olympiads/');
      setOlympiads(response.data.results || []);
    } catch (err) {
      setError('Олимпиадууд татахад алдаа гарлаа: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (olympiadId) => {
    if (importing) return; // Prevent multiple imports at once

    try {
      setImporting(olympiadId);
      setError('');
      setSuccess('');
      setImportedQuizId(null);

      const response = await apiClient.post('/api/integral/mmo-import/import/', {
        olympiad_id: olympiadId
      });

      const { quiz_id, quiz_title, quiz_created, imported, updated, total } = response.data;

      setSuccess(
        `${quiz_created ? 'Шинэ quiz үүссэн' : 'Quiz шинэчлэгдсэн'}: "${quiz_title}". ` +
        `Бодлого: ${imported} шинэ, ${updated} шинэчлэгдсэн, нийт ${total}.`
      );
      setImportedQuizId(quiz_id);

      // Refresh olympiads list to update "imported" badge
      fetchOlympiads();
    } catch (err) {
      setError('Импортлоход алдаа гарлаа: ' + (err.response?.data?.error || err.message));
    } finally {
      setImporting(null);
    }
  };

  if (!user?.is_staff) {
    return null;
  }

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">
                <Download size={24} className="me-2" />
                MMO.mn Олимпиад Импортлох
              </h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">
                MMO.mn сайтаас олимпиадын бодлогуудыг татаж, автоматаар Quiz үүсгэнэ.
                Нэг олимпиад = нэг Quiz. Бодлогууд уламжлалт хэлбэрээр хадгалагдана.
              </p>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  <XCircle size={20} className="me-2" />
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                  <CheckCircle size={20} className="me-2" />
                  {success}
                  {importedQuizId && (
                    <div className="mt-2">
                      <Link to={`/quizzes/${importedQuizId}`} className="btn btn-sm btn-outline-success">
                        <ExternalLink size={16} className="me-1" />
                        Quiz-г үзэх
                      </Link>
                    </div>
                  )}
                </Alert>
              )}

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Ачааллаж байна...</p>
                </div>
              )}

              {!loading && olympiads.length > 0 && (
                <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
                  <Table striped bordered hover>
                    <thead className="sticky-top bg-white">
                      <tr>
                        <th style={{ width: '60px' }}>Жил</th>
                        <th>Олимпиад</th>
                        <th style={{ width: '150px' }}>Шат</th>
                        <th style={{ width: '120px' }}>Төрөл</th>
                        <th style={{ width: '100px' }}>Бодлого</th>
                        <th style={{ width: '100px' }}>Төлөв</th>
                        <th style={{ width: '150px' }}>Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody>
                      {olympiads.map((olympiad) => (
                        <tr key={olympiad.id}>
                          <td>{olympiad.school_year}</td>
                          <td>
                            <div><strong>{olympiad.name}</strong></div>
                            {olympiad.level && (
                              <small className="text-muted">{olympiad.level.name}</small>
                            )}
                          </td>
                          <td>
                            <Badge bg={
                              olympiad.round >= 4 ? 'danger' :
                              olympiad.round >= 2 ? 'warning' : 'secondary'
                            }>
                              {olympiad.round_name}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={olympiad.type === 0 ? 'primary' : 'info'}>
                              {olympiad.type_name}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Badge bg="secondary">{olympiad.problem_count}</Badge>
                          </td>
                          <td>
                            {olympiad.imported ? (
                              <Badge bg="success">
                                <CheckCircle size={14} className="me-1" />
                                Татсан
                              </Badge>
                            ) : (
                              <Badge bg="light" text="dark">Шинэ</Badge>
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant={olympiad.imported ? 'outline-primary' : 'success'}
                              disabled={importing !== null}
                              onClick={() => handleImport(olympiad.id)}
                            >
                              {importing === olympiad.id ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" />
                                  Татаж байна...
                                </>
                              ) : (
                                <>
                                  <Download size={16} className="me-1" />
                                  {olympiad.imported ? 'Дахин татах' : 'Импортлох'}
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {!loading && olympiads.length === 0 && (
                <Alert variant="info">
                  Олимпиад олдсонгүй. MMO API холбогдож чадсангүй эсвэл бодлого бүхий олимпиад байхгүй байна.
                </Alert>
              )}
            </Card.Body>
          </Card>

          {/* Instructions */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Хэрхэн ажилладаг:</h5>
              <ol>
                <li>Олимпиад сонгоод "Импортлох" товч дарна</li>
                <li>Системимпортлох олимпиадын нэрээр шинэ <strong>Quiz үүсгэнэ</strong></li>
                <li>Бүх бодлогууд <strong>уламжлалт (type=0)</strong> хэлбэрээр хадгалагдана</li>
                <li><code>numerical_answer</code> болон <code>numerical_answer2</code> нь <code>answer</code> талбарт хадгалагдана</li>
                <li>Бодлогын дараалал (order) хадгалагдана</li>
                <li>Quiz автоматаар <strong>нийтлэгдэнэ</strong> (is_published=True)</li>
                <li>Хэрэв давхар импортлох юм бол бодлогууд <strong>update хийгдэнэ</strong></li>
              </ol>

              <Alert variant="info" className="mb-0 mt-3">
                <strong>Анхаар:</strong> Олимпиадын нэрэнд <code>[MMO-{'{'}id{'}'}]</code> тэмдэг орсон байх ёстой.
                Энэ нь давхцлаас сэргийлэх зориулалттай.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MMOImportPage;
