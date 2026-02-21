// src/components/AdminRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * AdminRoute - Admin эсвэл Teacher нарт л хандах боломжтой route
 * @param {boolean} allowTeacher - Teacher нарт хандах эрх олгох эсэх (анхдагч: false)
 */
function AdminRoute({ children, allowTeacher = false }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
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
