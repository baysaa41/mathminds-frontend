// src/pages/CallbackPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext'; // <<< 1. AuthContext-г ИМПОРТЛОХ

function CallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { login } = useAuth(); // <<< 2. useAuth-с login функцийг авах

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
                // 3. authService-с user болон token-г хамт буцаадаг байх ёстой
                const { user, token } = await authService.handleCallback(code, state);

                console.log('Login successful:', user);

                if (user && token) {
                    // 4. CONTEXT-Г ШИНЭЧЛЭХ (Энэ алга байсан)
                    // Энэ нь LeftSidebar дээр мэдээллийг харуулна
                    login(user, token);

                    // 5. Home хуудас руу redirect
                    navigate('/');
                } else {
                    throw new Error("Auth service-с хэрэглэгч эсвэл токен олдсонгүй.");
                }

            } catch (err) {
                console.error('Auth error:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        handleAuth();
    }, [searchParams, navigate, login]); // <<< 6. login-г dependency array-д нэмэх

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