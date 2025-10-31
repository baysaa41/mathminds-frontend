// frontend/src/context/AuthContext.jsx (БҮРЭН ЗАСВАРЛАСАН)

import React, { createContext, useState, useContext, useEffect } from 'react';
// 1. apiClient-г эндээс УСТГАСАН. (axiosConfig.js үүнийг хариуцна)
// 2. authService-г импортлох
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // 3. State-г эхлүүлэхдээ ЗӨВ түлхүүрүүдийг ашиглана ('access_token' ба 'user')
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user'); // 'mathmindsUser' биш
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('access_token')); // 'authToken' биш

    // Апп-г ачаалахад хэрэглэгч баталгаажсан эсэхийг шалгах state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Энэ useEffect нь зөвхөн апп-г анх ачаалахад хэрэглэгчийн
        // мэдээллийг backend-с шалгаж, state-г тохируулна.
        const verifyUser = async () => {
            const currentToken = authService.getToken(); //
            if (currentToken) {
                try {
                    // authService.getCurrentUser() нь /api/auth/me/ руу хандаж
                    // токеныг шалгаад, шинэ хэрэглэгчийн мэдээлэл авна.
                    const userData = await authService.getCurrentUser();
                    if (userData) {
                        setUser(userData);
                        setToken(currentToken);
                    } else {
                        // Токен хүчингүй (жишээ нь, хугацаа нь дууссан)
                        authService.logout();
                        setUser(null);
                        setToken(null);
                    }
                } catch (error) {
                    console.error("Хэрэглэгч шалгах үед алдаа:", error);
                    authService.logout();
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        };

        verifyUser();
    }, []);

    // 4. apiClient-н толгойг тохируулдаг useEffect-г БҮРЭН УСТГАСАН.
    // Энэ үйлдлийг axiosConfig.js доторх interceptor хийж байгаа.

    // 5. 'login' функцийг ЗАСВАРЛАСАН
    const login = (userData, userToken) => {
        // И-мэйлээр нэвтрэх үед
        // localStorage-г ЗӨВ түлхүүрээр хадгалах
        localStorage.setItem('access_token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // React-н state-г шинэчлэх
        setUser(userData);
        setToken(userToken);
    };

    // 6. 'logout' функцийг ЗАСВАРЛАСАН
    const logout = () => {
        // authService нь localStorage-н бүх түлхүүрийг цэвэрлэнэ
        authService.logout();

        // React-н state-г цэвэрлэх
        setUser(null);
        setToken(null);
    };

    // (!!!) -----------------------------------------------
    // (!!!) --- ШИНЭЭР НЭМСЭН ФУНКЦ ---
    // (!!!) --- ProfileEditPage.jsx-с дуудагдана ---
    // (!!!) -----------------------------------------------
    const updateUser = (newUserData) => {
        if (!newUserData) {
            console.warn("AuthContext: updateUser-г null мэдээллээр дуудлаа.");
            return;
        }

        // 1. authService-г ашиглан localStorage-г шинэчлэх
        // (Энэ нь таны `authService.js`-д байгаа функц)
        authService.updateUser(newUserData);

        // 2. React-н дотоод state-г шинэчлэх
        setUser(newUserData);
    };

    // Апп-г шалгаж дуустал юу ч харуулахгүй (хамгаалалт)
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <span>Ачааллаж байна...</span>
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                updateUser, // (!!!) ЭНЭ ФУНКЦИЙГ ЭНД НЭМСЭН
                isAuthenticated: !!token,
                loading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};