// /board-sso?return=https://board.mathminds.club/…
//
// Board апп руу MathMinds-ийн нэвтрэлтийг дамжуулах гарц:
//   нэвтрээгүй бол /login руу (нэвтэрсний дараа энэ хуудас руу буцаж ирнэ),
//   нэвтэрсэн бол one-time код авч board руу `#sso=<code>`-той шилжинэ.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig.js';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';
import { sanitizeBoardReturn } from '../utils/boardSso';

export default function BoardSsoPage() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const started = useRef(false);

  const returnUrl = sanitizeBoardReturn(params.get('return'));
  const nextPath = `/board-sso?return=${encodeURIComponent(returnUrl)}`;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Нэвтрэлтийн дараа энэ хуудас руу буцаж ирнэ (MMO/Google/нууц үг бүгд ажиллана).
      setPostLoginRedirect(nextPath);
      navigate('/login', { replace: true });
      return;
    }

    if (started.current) return;
    started.current = true;

    apiClient
      .post('/users/api/board-sso/code/')
      .then(({ data }) => {
        const url = new URL(returnUrl);
        url.hash = `sso=${data.code}`;
        window.location.replace(url.toString());
      })
      .catch(() => {
        setError('Самбар руу нэвтрэх код үүсгэж чадсангүй. Дахин оролдоно уу.');
      });
  }, [loading, user, navigate, nextPath, returnUrl]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 gap-3">
      {error ? (
        <>
          <p className="text-danger mb-0">{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Дахин оролдох
          </button>
        </>
      ) : (
        <>
          <div className="spinner-border text-primary" role="status" />
          <p className="text-muted mb-0">Самбар руу нэвтрэлт дамжуулж байна…</p>
        </>
      )}
    </div>
  );
}
