// frontend/src/components/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/axiosConfig.js';
import authService from '../services/authService.js';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

const LoginPage = () => {
  // --- (!!!) ЗАСВАР: 'email' state-г 'username' болгов ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Django Backend нэвтрэх
  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- (!!!) ЗАСВАР: API руу 'username' илгээнэ ---
      const response = await apiClient.post('/users/api/login/', {
        username: username, // 'email'-г 'username' болгож өөрчилсөн
        password: password,
      });

      const { token, user } = response.data;
      login(user, token);
      navigate('/');
    } catch (err) {
      // --- (!!!) ЗАСВАР: Алдааны мсж ---
      if (err.response?.data?.detail) {
        // SimpleJWT-н анхдагч алдаа
        setError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна.');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // MMO OAuth нэвтрэх
  const handleMMOLogin = async () => {
    try {
      setError('');
      await authService.login();
    } catch (err) {
      setError('MMO нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.');
      console.error('MMO login error:', err);
    }
  };

  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        className="shadow-lg border-0"
        style={{
          maxWidth: '440px',
          width: '100%',
          borderRadius: '16px',
        }}
      >
        <Card.Body className="p-5">
          {/* Лого & Гарчиг */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <span className="text-white fw-bold" style={{ fontSize: '28px' }}>
                ∑
              </span>
            </div>
            <h2 className="fw-bold text-dark mb-1">MathMinds.Club</h2>
            <p className="text-muted small fst-italic mb-0">Where every mind counts.</p>
          </div>

          {/* Алдааны мэдэгдэл */}
          {error && (
            <Alert variant="danger" className="py-2 small">
              {error}
            </Alert>
          )}

          {/* MMO OAuth Товч */}
          <Button
            onClick={handleMMOLogin}
            variant="outline-primary"
            className="w-100 py-2 mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
            style={{ borderRadius: '8px' }}
          >
            <span style={{ fontSize: '18px' }}>🏆</span>
            MMO данс ашиглан нэвтрэх
          </Button>

          {/* Тусгаарлагч */}
          <div className="position-relative my-4">
            <hr className="m-0" />
            <div
              className="position-absolute top-50 start-50 translate-middle bg-white px-3"
              style={{ fontSize: '14px' }}
            >
              <span className="text-muted">эсвэл</span>
            </div>
          </div>

          {/* Username/Password Form */}
          {/* --- (!!!) ЗАСВАР: onSubmit-г өөрчилсөн --- */}
          <form onSubmit={handleUsernameLogin}>
            <div className="mb-3">
              {/* --- (!!!) ЗАСВАР: UI Текст --- */}
              <label className="small fw-semibold text-secondary mb-1">Хэрэглэгчийн нэр</label>
              <input
                // --- (!!!) ЗАСВАР: type, placeholder, value, onChange ---
                type="text"
                className="form-control"
                placeholder="таны нэвтрэх нэр"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div className="mb-4">
              <label className="small fw-semibold text-secondary mb-1">Нууц үг</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-100 py-2 fw-semibold"
              disabled={loading}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Нэвтэрч байна...
                </>
              ) : (
                'Нэвтрэх'
              )}
            </Button>
          </form>

          {/* Нууц үг сэргээх холбоос */}
          <div className="text-center mt-3">
            <a href="/password-reset" className="text-decoration-none small text-primary">
              Нууц үгээ мартсан уу?
            </a>
          </div>

          {/* Бүртгүүлэх холбоос */}
          <div className="text-center mt-2">
            <span className="small text-muted">
              Шинэ хэрэглэгч үү?{' '}
              <a href="/register" className="text-primary text-decoration-none fw-semibold">
                Бүртгүүлэх
              </a>
            </span>
          </div>
        </Card.Body>

        {/* Footer - Танилцуулга, Үйлчилгээний нөхцөл, Нууцлалын бодлого */}
        <Card.Footer
          className="text-center bg-light border-0"
          style={{ borderRadius: '0 0 16px 16px', paddingTop: '1rem', paddingBottom: '1rem' }}
        >
          <div className="d-flex justify-content-center gap-2 flex-wrap" style={{ lineHeight: '1.2' }}>
            <a href="/about" className="text-decoration-none small text-muted">
              Танилцуулга
            </a>
            <span className="text-muted small">•</span>
            <a href="/terms" className="text-decoration-none small text-muted">
              Үйлчилгээний нөхцөл
            </a>
            <span className="text-muted small">•</span>
            <a href="/privacy" className="text-decoration-none small text-muted">
              Нууцлалын бодлого
            </a>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default LoginPage;
