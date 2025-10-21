// src/components/LoginButton.jsx

import React from 'react';
import authService from '../services/authService';

function LoginButton() {
    const handleLogin = () => {
        authService.login();
    };

    return (
        <button
            onClick={handleLogin}
            style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
            }}
        >
            🔐 MMO-оор нэвтрэх
        </button>
    );
}

export default LoginButton;