// frontend/src/pages/PasswordResetRequestPage.jsx (ӨӨРЧЛӨГДСӨН)

import { useState } from 'react';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

const PasswordResetRequestPage = () => {
  // Зөвхөн username-г ашиглана
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Хэрэглэгчийн нэр оруулсан эсэхийг шалгах
    if (!username) {
      setError('Хэрэглэгчийн нэрээ оруулна уу.');
      setLoading(false);
      return;
    }

    try {
      await apiClient.post('/users/api/password/reset/request/', {
        // Backend одоо зөвхөн 'username' талбарыг хүлээн авна
        username: username,
      });

      setSuccess(true);
      setUsername(''); // Амжилттай бол талбарыг цэвэрлэх
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Сэргээх хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.'
      );
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        }}
      >
        <Card.Header
          className="text-center py-4 border-0"
          style={{ backgroundColor: '#f8f9fa', borderRadius: '16px 16px 0 0' }}
        >
          <h4 className="mb-0 fw-bold text-primary">Нууц үг сэргээх</h4>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}
          {success ? (
            <Alert variant="success" className="text-center">
              Нууц үг сэргээх линкийг таны бүртгэлтэй и-мэйл хаяг руу илгээлээ. И-мэйлээ шалгана уу.
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <p className="text-muted small mb-3">
                Бүртгэлтэй **хэрэглэгчийн нэрээ** оруулна уу. Бид таны бүртгэлтэй и-мэйл хаяг руу
                нууц үг сэргээх линк илгээнэ.
              </p>

              <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label className="small fw-semibold">Хэрэглэгчийн нэр</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Хэрэглэгчийн нэр"
                  required
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-3"
                disabled={loading}
                style={{
                  height: '50px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                }}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Илгээж байна...
                  </>
                ) : (
                  'Сэргээх холбоос илгээх'
                )}
              </Button>
            </Form>
          )}

          {/* Буцах холбоос */}
          <div className="text-center mt-4">
            <a href="/login" className="text-decoration-none small text-primary">
              ← Нэвтрэх хуудас руу буцах
            </a>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PasswordResetRequestPage;
