// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    // Нэвтэрсний дараа энэ хуудас руу буцна
    setPostLoginRedirect(location.pathname + location.search + location.hash);
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
