// frontend/src/pages/PasswordResetConfirmPage.jsx (ӨӨРЧЛӨГДСӨН)

import { useState } from 'react'; // useEffect-г хасав
import { useParams } from 'react-router-dom';
import apiClient from '../api/axiosConfig';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Form from 'react-bootstrap/Form';

const PasswordResetConfirmPage = () => {
  // URL-ийн параметруудыг авах
  const { uidb64, token } = useParams();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Эхний ачааллаас токен зөв гэж үзнэ, Backend Confirm хийх үед шалгана
  const [tokenValid] = useState(true);
  const [username] = useState('Хэрэглэгч'); // Username-г backend-ээс шалгах логикийг хасав

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Нууц үг батлах нууц үгтэй таарахгүй байна.');
      return;
    }

    if (password.length < 8) {
      setError('Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/users/api/password/reset/confirm/', {
        // <--- API зам засварлагдсан
        uid: uidb64,
        token: token,
        new_password: password, // Backend-ийн хүлээн авах талбарын нэр
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Нууц үг солиход алдаа гарлаа. Линк буруу эсвэл хугацаа нь дууссан байж магадгүй.'
      );
      console.error('Password reset confirm error:', err);
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
          <h4 className="mb-0 fw-bold text-primary">Нууц үг шинэчлэх</h4>
        </Card.Header>
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {/* Токен шалгах хэсгийг энгийн болгож, шууд нууц үг солих форм харуулна */}
          {success ? (
            <Alert variant="success" className="text-center">
              Нууц үг амжилттай солигдлоо.{' '}
              <a href="/login" className="alert-link">
                Нэвтрэх хуудас
              </a>{' '}
              руу очино уу.
            </Alert>
          ) : (
            tokenValid && (
              <Form onSubmit={handlePasswordReset}>
                <p className="text-muted small mb-3">
                  {username}-д зориулсан нууц үгийг шинэчилнэ үү.
                </p>

                {/* Шинэ нууц үг */}
                <Form.Group className="mb-3" controlId="formNewPassword">
                  <Form.Label className="small fw-semibold">
                    Шинэ нууц үг (дор хаяж 8 тэмдэгт)
                  </Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Шинэ нууц үг"
                    required
                  />
                </Form.Group>

                {/* Нууц үг баталгаажуулах */}
                <Form.Group className="mb-4" controlId="formConfirmPassword">
                  <Form.Label className="small fw-semibold">Нууц үг баталгаажуулах</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Нууц үг баталгаажуулах"
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading || password.length < 8 || password !== passwordConfirm}
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
                      Хадгалж байна...
                    </>
                  ) : (
                    'Нууц үг солих'
                  )}
                </Button>
              </Form>
            )
          )}

          {/* Буцах холбоос */}
          {!success && (
            <div className="text-center mt-4">
              <a href="/login" className="text-decoration-none small text-primary">
                ← Нэвтрэх хуудас руу буцах
              </a>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PasswordResetConfirmPage;
