// src/components/PublicOrAppLayout.jsx
// Нэвтрэлтгүй үзэж болох хуудсууд (олимпиад): нэвтэрсэн бол ердийн Layout, үгүй бол энгийн нийтийн толгой.
// Layout-ийн header/sidebar нэвтрэлт шаардсан API дууддаг — 401 нь /login руу шилжүүлдэг тул зочинд ашиглахгүй.

import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import Layout from './Layout';
import AppHeader from './AppHeader';
import authService from '../services/authService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

function PublicShell() {
  const location = useLocation();
  const navigate = useNavigate();
  // Нэвтэрсний дараа яг энэ хуудас руу буцна
  const go = (path) => { setPostLoginRedirect(location.pathname + location.search); navigate(path); };
  // Мэдээлэл (/info) хуудсуудтай ижил: AppHeader + доор нь нэвтрэх мөр
  return (
    <div className="d-flex flex-column vh-100">
      <AppHeader />
      <div className="border-bottom bg-light">
        <Container fluid className="px-md-4 py-2 d-flex justify-content-end align-items-center gap-2" style={{ maxWidth: 1400 }}>
          <span className="small text-muted me-auto">Бүртгүүлэх, төлбөр төлөхийн тулд нэвтэрнэ үү.</span>
          <Button size="sm" variant="outline-primary" onClick={() => go('/login')}>Нэвтрэх</Button>
          <Button size="sm" onClick={() => go('/register')}>Бүртгүүлэх</Button>
        </Container>
      </div>
      <div className="flex-grow-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

function PublicOrAppLayout() {
  return authService.isAuthenticated() ? <Layout /> : <PublicShell />;
}

export default PublicOrAppLayout;
