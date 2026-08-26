// src/components/HomeRedirect.jsx
// "/" хаягт хэрэглэгчийн site_role-д тохирсон dashboard руу чиглүүлэх,
// тохирох dashboard байхгүй бол feed харуулах.

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';
import Feed from './Feed';

function HomeRedirect() {
  const user = authService.getUser();

  if (user?.is_staff) {
    return <Navigate to="/admin" replace />;
  }
  if (user?.site_role === 'TEACHER') {
    return <Navigate to="/teacher-dashboard" replace />;
  }
  if (user?.site_role === 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.site_role === 'PARENT') {
    return <Navigate to="/parent-dashboard" replace />;
  }

  return <Feed />;
}

export default HomeRedirect;
