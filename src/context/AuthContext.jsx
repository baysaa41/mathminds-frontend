// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('mathmindsUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));

    useEffect(() => {
        if (token) {
            localStorage.setItem('authToken', token);
            apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
        } else {
            localStorage.removeItem('authToken');
            delete apiClient.defaults.headers.common['Authorization'];
        }

        if (user) {
            localStorage.setItem('mathmindsUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('mathmindsUser');
        }
    }, [token, user]);

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const logout = async () => {
        try {
            // Backend API дуудаж token устгах
            await apiClient.post('/users/api/logout/');
        } catch (error) {
            console.error('Logout API error:', error);
            // Алдаа гарсан ч frontend дээрээс гарна
        } finally {
            // Frontend state цэвэрлэх
            setUser(null);
            setToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};