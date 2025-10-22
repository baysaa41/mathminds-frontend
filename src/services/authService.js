// src/services/authService.js (БҮРЭН ЗАСВАРЛАСАН)

const MMO_CONFIG = {
    clientId: 'nzkWGrkfUnGyeyerGo3XkZlRKlhmSTnVmGcYJWC9',
    authorizationUrl: 'https://www.mmo.mn/o/authorize/',
    tokenUrl: 'https://www.mmo.mn/o/token/',
    redirectUri: 'http://localhost:5173/callback',
    scope: 'profile',
};

const BACKEND_URL = 'http://127.0.0.1:8000';

class AuthService {

    // PKCE helper функцууд
    async generatePKCE() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const codeVerifier = this.base64URLEncode(array);

        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const codeChallenge = this.base64URLEncode(new Uint8Array(hashBuffer));

        return { codeVerifier, codeChallenge };
    }

    base64URLEncode(buffer) {
        const base64 = btoa(String.fromCharCode(...buffer));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    generateState() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }

    // Login эхлүүлэх
    async login() {
        try {
            console.log('🔐 Starting login...');

            const { codeVerifier, codeChallenge } = await this.generatePKCE();
            const state = this.generateState();

            sessionStorage.setItem('code_verifier', codeVerifier);
            sessionStorage.setItem('oauth_state', state);

            console.log('✅ Saved to sessionStorage:');
            console.log('  code_verifier:', codeVerifier.slice(0, 20) + '...');
            console.log('  oauth_state:', state.slice(0, 20) + '...');

            const params = new URLSearchParams({
                response_type: 'code',
                client_id: MMO_CONFIG.clientId,
                redirect_uri: MMO_CONFIG.redirectUri,
                scope: MMO_CONFIG.scope,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: state,
            });

            const authUrl = `${MMO_CONFIG.authorizationUrl}?${params.toString()}`;
            console.log('🔗 Redirecting to:', authUrl);

            window.location.href = authUrl;
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    }

    // Callback шийдэх
    async handleCallback(code, state) {
        console.log('\n' + '='.repeat(60));
        console.log('📥 handleCallback called');
        console.log('  Code:', code);
        console.log('  State from URL:', state);

        const savedState = sessionStorage.getItem('oauth_state');
        const codeVerifier = sessionStorage.getItem('code_verifier');

        console.log('  Saved state:', savedState);
        console.log('  Saved verifier:', codeVerifier ? codeVerifier.slice(0, 20) + '...' : 'null');
        console.log('='.repeat(60));

        if (!savedState) {
            console.error('❌ No saved state in sessionStorage!');
            throw new Error('Session expired. Please log in again.');
        }

        if (state !== savedState) {
            console.error('❌ State mismatch!');
            console.error('  Expected:', savedState);
            console.error('  Received:', state);
            throw new Error('Invalid state parameter. Please try logging in again.');
        }

        console.log('✅ State verified!');

        if (!codeVerifier) {
            console.error('❌ No code verifier!');
            throw new Error('Missing code verifier. Please try logging in again.');
        }

        try {
            // --- 1. ОРХИГДСОН FETCH ДУУДЛАГЫГ НЭМСЭН ---
            // Энэ нь таны backend-н exchange_code руу хандана
            const response = await fetch(`${BACKEND_URL}/users/api/exchange-code/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    code_verifier: codeVerifier,
                    redirect_uri: MMO_CONFIG.redirectUri
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to exchange code');
            }
            // ---------------------------------------------

            // Backend-с ирсэн хариу (token, refresh, user)
            const data = await response.json();

            console.log('✅ Backend response received:');
            console.log('  Token:', data.token ? data.token.slice(0, 20) + '...' : 'null');
            console.log('  User data:', data.user);

            // Token хадгалах
            // "access_token" түлхүүр үгээр хадгалж байна (бусад функцтэй нийцүүлсэн)
            localStorage.setItem('access_token', data.token);
            if (data.refresh) {
                localStorage.setItem('refresh_token', data.refresh);
            }
            localStorage.setItem('user', JSON.stringify(data.user));

            // OAuth cleanup
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('oauth_state');
            console.log('✅ Login successful!');

            // CallbackPage рүү хэрэглэгч болон токеныг буцаана
            // Энэ нь AuthContext-г шинэчлэхэд ашиглагдана
            return { user: data.user, token: data.token };

        } catch (error) {
            console.error('❌ Callback error:', error);
            sessionStorage.removeItem('code_verifier');
            sessionStorage.removeItem('oauth_state');
            throw error;
        }
    }

    // Одоогийн хэрэглэгч
    async getCurrentUser() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('ℹ️ No access token found');
            return null;
        }

        try {
            console.log('👤 Verifying token with backend...');

            // Энэ замыг /users/api/current-user/ болгож өөрчилсөн
            // (Таны api_views.py дахь current_user функц)
            const response = await fetch(`${BACKEND_URL}/users/api/current-user/`, {
                headers: {
                    // SimpleJWT нь "Bearer" ашигладаг
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                console.log('❌ Token invalid, logging out');
                this.logout();
                return null;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch user');
            }

            const data = await response.json();

            // Хэрэглэгчийн мэдээллийг localStorage-д шинэчлэх
            localStorage.setItem('user', JSON.stringify(data));
            return data;

        } catch (error) {
            console.error('❌ Get user error:', error);
            // Сүлжээний алдаа гарсан ч logout хийхгүй байх нь дээр
            // this.logout();
            return null;
        }
    }

    // Logout
    logout() {
        console.log('🚪 Logging out...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('code_verifier');
        sessionStorage.removeItem('oauth_state');
    }

    // Нэвтэрсэн эсэхийг шалгах
    isAuthenticated() {
        const hasToken = !!localStorage.getItem('access_token');
        // console.log('🔍 isAuthenticated:', hasToken); // (Хэт олон лог хэвлэх тул comment болгов)
        return hasToken;
    }

    // Token авах
    getToken() {
        return localStorage.getItem('access_token');
    }

    // Хэрэглэгч авах
    getUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            // console.log('ℹ️ No user in localStorage');
            return null;
        }

        try {
            const user = JSON.parse(userStr);
            // console.log('✅ User from localStorage:', user);
            return user;
        } catch (error) {
            console.error('❌ Error parsing user:', error);
            return null;
        }
    }
}

export default new AuthService();