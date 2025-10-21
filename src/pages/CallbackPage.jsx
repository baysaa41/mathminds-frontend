// src/pages/CallbackPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

function CallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuth = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');

            if (error) {
                setError(searchParams.get('error_description') || error);
                setLoading(false);
                return;
            }

            if (!code) {
                setError('No authorization code received');
                setLoading(false);
                return;
            }

            try {
                const user = await authService.handleCallback(code, state);
                console.log('Login successful:', user);

                // Home хуудас руу redirect
                navigate('/');
            } catch (err) {
                console.error('Auth error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        handleAuth();
    }, [searchParams, navigate]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Нэвтэрч байна...</h2>
                <p>Түр хүлээнэ үү</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                <h2>❌ Алдаа гарлаа</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')}>Буцах</button>
            </div>
        );
    }

    return null;
}

export default CallbackPage;