// src/components/AdminRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

/**
 * AdminRoute - Admin эсвэл Teacher нарт л хандах боломжтой route
 * @param {boolean} allowTeacher - Teacher нарт хандах эрх олгох эсэх (анхдагч: false)
 */
function AdminRoute({ children, allowTeacher = false }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const location = useLocation();

  if (!isAuthenticated) {
    setPostLoginRedirect(location.pathname + location.search + location.hash);  // нэвтэрсний дараа буцна
    return <Navigate to="/login" replace />;
  }

  // Admin эсвэл (teacher дэмждэг бол teacher) шалгах
  const hasAccess = user.is_staff || (allowTeacher && user.site_role === 'TEACHER');

  if (!hasAccess) {
    // Эрх хүрэлцэхгүй бол нүүр хуудас руу шилжүүлэх
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
