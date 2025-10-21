// src/pages/DashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function DashboardPage() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                navigate('/login');
            }
        };

        loadUser();
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Dashboard</h1>
            <div style={{
                border: '1px solid #ddd',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '500px'
            }}>
                <h2>Сайн байна уу, {user.name}!</h2>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>MMO ID:</strong> {user.mmo_id}</p>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '10px',
                    }}
                >
                    Гарах
                </button>
            </div>
        </div>
    );
}

export default DashboardPage;