// src/pages/CallbackPage.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, ListGroup, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext'; // <<< 1. AuthContext-г ИМПОРТЛОХ
import { fmtDate } from '../services/olympiadService';
import { consumePostLoginRedirect } from '../utils/postLoginRedirect';

function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { login } = useAuth(); // <<< 2. useAuth-с login функцийг авах
  // Google: ижил имэйлтэй олон бүртгэл байвал хэрэглэгчээр сонгуулна
  const [accountChoice, setAccountChoice] = useState(null);
  const [choosing, setChoosing] = useState(null);

  // ⚠️ React Strict Mode давхар дуудалтаас хамгаалах
  const hasProcessed = useRef(false);

  useEffect(() => {
    // ⚠️ Хэрэв аль хэдийн боловсруулсан бол дахин бүү дуудагдуулаарай
    if (hasProcessed.current) {
      console.log('⚠️ OAuth callback already processed, skipping...');
      return;
    }

    const handleAuth = async () => {
      // ⚠️ Боловсруулж эхлэхэд тэмдэглэнэ
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setError(searchParams.get('error_description') || error);
        setLoading(false);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setLoading(false);
        return;
      }

      try {
        // 3. authService-с user болон token-г хамт буцаадаг байх ёстой
        const { user, token, accountChoice: choice } = await authService.handleCallback(code, state);
        if (choice) {
          setAccountChoice(choice);
          setLoading(false);
          return;
        }

        console.log('Login successful:', user);

        if (user && token) {
          // 4. CONTEXT-Г ШИНЭЧЛЭХ (Энэ алга байсан)
          // Энэ нь LeftSidebar дээр мэдээллийг харуулна
          login(user, token);

          // 5. Нэвтрэхээс өмнөх хуудас (жишээ нь имэйлийн link) эсвэл Home руу
          navigate(consumePostLoginRedirect('/'));
        } else {
          throw new Error('Auth service-с хэрэглэгч эсвэл токен олдсонгүй.');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    handleAuth();

    // ⚠️ Cleanup function байхгүй - hasProcessed хадгалагдана
  }, [searchParams, navigate, login]); // <<< 6. login-г dependency array-д нэмэх

  const choose = async (userId) => {
    setChoosing(userId);
    setError(null);
    try {
      const { user, token } = await authService.chooseGoogleAccount(accountChoice.token, userId);
      login(user, token);
      navigate(consumePostLoginRedirect('/'));
    } catch (err) {
      setError(err.message);
      setChoosing(null);
    }
  };

  if (accountChoice) {
    return (
      <Container className="py-5" style={{ maxWidth: 560 }}>
        <Card>
          <Card.Body>
            <h5>Аль бүртгэлээр нэвтрэх вэ?</h5>
            <p className="text-muted small mb-3">
              Энэ имэйл хаягтай хэд хэдэн MathMinds бүртгэл байна (жишээ нь нэг имэйлээр хэд хэдэн хүүхэд бүртгэгдсэн).
              Сонгосон бүртгэл таны Google данстай холбогдож, дараа нь шууд нэвтэрнэ.
            </p>
            {error && <Alert variant="danger">{error}</Alert>}
            <ListGroup className="mb-3">
              {accountChoice.accounts.map((a) => (
                <ListGroup.Item key={a.id} action disabled={choosing !== null} onClick={() => choose(a.id)}
                                className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-semibold">{a.full_name || a.username}</div>
                    <div className="small text-muted">
                      @{a.username}
                      {a.created && <> · Үүссэн: {fmtDate(a.created)}</>}
                      {' · '}{a.last_login ? `Сүүлд нэвтэрсэн: ${fmtDate(a.last_login)}` : 'Нэвтэрч байгаагүй'}
                    </div>
                    <div className="mt-1">
                      {a.has_mmo && <Badge bg="light" text="dark" className="border me-1">MMO</Badge>}
                      {a.olympiad_count > 0 && (
                        <Badge bg="light" text="dark" className="border">Олимпиадын бүртгэл: {a.olympiad_count}</Badge>
                      )}
                    </div>
                  </div>
                  {choosing === a.id && <Spinner size="sm" animation="border" />}
                </ListGroup.Item>
              ))}
            </ListGroup>
            <Button variant="outline-secondary" className="w-100" disabled={choosing !== null} onClick={() => choose('new')}>
              {choosing === 'new' ? <Spinner size="sm" animation="border" /> : 'Шинэ бүртгэл үүсгэх'}
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Нэвтэрч байна...</h2>
        <p>Түр хүлээнэ үү</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        <h2>❌ Алдаа гарлаа</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Буцах</button>
      </div>
    );
  }

  return null;
}

export default CallbackPage;
