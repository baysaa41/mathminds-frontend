// src/pages/ClaimPage.jsx
// Олимпиадын имэйлийн link: /r#<token>. Token нь fragment-д тул сервер рүү URL-аар очихгүй;
// API-д body-гоор илгээнэ. Нэг link = нэг сурагчийн нэг бүртгэл.

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getRegistrationAccess, claimRegistrationAccess, fmtDate, REG_STATUS } from '../services/olympiadService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

function ClaimPage() {
  const { hash } = useLocation();
  const token = hash.replace(/^#/, '');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Link буруу байна. Имэйл дэх link-ийг бүтнээр нь нээнэ үү.');
      return;
    }
    getRegistrationAccess(token)
      .then((data) => {
        // Аль хэдийн миний account-д байгаа бол шууд бүртгэл рүү
        if (data.owned_by_me) navigate(`/my-olympiads/${data.registration_id}`, { replace: true });
        else setInfo(data);
      })
      .catch((err) => setError(err.response?.data?.error || 'Link хүчингүй эсвэл хугацаа нь дууссан байна.'));
  }, [token, user, navigate]);

  // Нэвтэрсэн / account үүсгэсний дараа энэ хуудас руу буцна
  const goLogin = () => { setPostLoginRedirect(`/r#${token}`); navigate('/login'); };
  const goRegister = () => { setPostLoginRedirect(`/r#${token}`); navigate('/register', { state: { prefill: info.prefill } }); };

  const claim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const data = await claimRegistrationAccess(token);
      navigate(`/my-olympiads/${data.registration_id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Account-д нэмэхэд алдаа гарлаа');
      setClaiming(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 560 }}>
      <Card>
        <Card.Body className="p-4">
          <div className="text-muted small mb-2">MathMinds · Олимпиадын бүртгэл</div>
          {error && <Alert variant="danger">{error}</Alert>}
          {!info && !error && <div className="text-center py-4"><Spinner animation="border" /></div>}
          {!info && error && <Link to="/">Нүүр хуудас руу</Link>}
          {info && (
            <>
              <h4 className="mb-1">{info.student_name}</h4>
              <div className="mb-3">
                <strong>{info.olympiad_title}</strong>
                <div className="small text-muted">
                  {fmtDate(info.exam_start)}{info.venue ? ` · ${info.venue}` : ''}
                </div>
                <div className="mt-2">
                  <Badge bg={REG_STATUS[info.status][0]}>{REG_STATUS[info.status][1]}</Badge>
                  {info.participant_no && <span className="ms-2">Оролцогчийн дугаар: <strong>{info.participant_no}</strong></span>}
                  {info.class_room && <span className="ms-2">Шалгалт өгөх анги: <strong>{info.class_room}</strong></span>}
                  {info.seat_no && <span className="ms-2">Суудал: <strong>{info.seat_no}</strong></span>}
                </div>
              </div>

              {info.claimed ? (
                <>
                  <Alert variant="secondary" className="small">
                    Энэ сурагчийн бүртгэл өөр MathMinds account-тай холбогдсон байна. Хэрэв тэр account таных бол
                    түүгээрээ нэвтэрнэ үү.
                  </Alert>
                  {!user && <Button onClick={goLogin}>Нэвтрэх</Button>}
                </>
              ) : user ? (
                <>
                  <p className="small">
                    Энэ бүртгэлийг таны account-д (<strong>@{user.username}</strong>) нэмбэл тухайн сурагчийн бүх
                    олимпиадын бүртгэл, оноо, материал «Миний олимпиадууд» хэсэгт харагдана. Эцэг эх бол хэд хэдэн
                    хүүхдээ нэг account-д нэмж болно.
                  </p>
                  <Button className="w-100" onClick={claim} disabled={claiming}>
                    {claiming ? <Spinner size="sm" animation="border" /> : `${info.student_name}-г миний account-д нэмэх`}
                  </Button>
                  <div className="small text-muted mt-2">Энэ таны account биш бол гараад зөв account-аараа нэвтэрнэ үү.</div>
                </>
              ) : (
                <>
                  <p className="small">
                    Бүртгэлээ удирдах, оноо, материалаа харахын тулд MathMinds account-аар нэвтэрнэ үү.
                    Account байхгүй бол шинээр үүсгэнэ — сурагчийн мэдээллээр урьдчилан бөглөгдөнө.
                  </p>
                  <div className="d-flex gap-2">
                    <Button className="flex-fill" onClick={goRegister}>Account үүсгэх</Button>
                    <Button className="flex-fill" variant="outline-primary" onClick={goLogin}>Нэвтрэх</Button>
                  </div>
                  <div className="small text-muted mt-2">
                    Нууц үгээ мартсан бол <Link to="/password-reset">энд</Link> имэйл хаягаа оруулж сэргээнэ.
                  </div>
                </>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ClaimPage;
