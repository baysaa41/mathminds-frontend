// /board-logout?return=https://board.mathminds.club/…
//
// Board дээрх «Гарах» товч энэ хуудсаар дамжина: MathMinds-ийн session-ыг
// бодитоор устгаад board руу буцаана (эсрэг тохиолдолд board дахин SSO-оор
// шууд нэвтрээд, гарах үйлдэл хийгдээгүй мэт харагдана).
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeBoardReturn } from '../utils/boardSso';

export default function BoardLogoutPage() {
  const { logout, loading } = useAuth();
  const [params] = useSearchParams();
  const returnUrl = sanitizeBoardReturn(params.get('return'));

  useEffect(() => {
    if (loading) return;
    logout();
    window.location.replace(returnUrl);
  }, [loading, logout, returnUrl]);

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status" />
    </div>
  );
}
