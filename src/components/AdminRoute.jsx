// src/components/AdminRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

function AdminRoute({ children }) {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    if (!isAuthenticated || !user.is_staff) {
        console.log(user)
        console.log(user.is_staff)
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default AdminRoute;