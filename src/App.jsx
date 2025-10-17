// frontend/src/App.jsx (Сайжруулсан Routing Бүтэц)

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import ArticleDetailPage from './components/ArticleDetailPage';
import ArticleEditPage from './components/ArticleEditPage';
import Feed from './components/Feed'; // <-- Feed-г энд импорт хийнэ
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
}

function App() {
    return (
        <Routes>
            {/* Нэвтрэх хуудас (Public) */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />

            {/* Нэвтэрсэн хэрэглэгчийн үндсэн хэсэг (Layout дотор) */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout /> {/* Эцэг Route */}
                    </ProtectedRoute>
                }
            >
                {/* Layout дотор харагдах хүүхэд Route-ууд */}
                <Route index element={<Feed />} /> {/* "/" замд Feed-г харуулна (index route) */}
                <Route path="article/:articleId" element={<ArticleDetailPage />} /> {/* "/article/:id" замд */}
                <Route path="article/:articleId/edit" element={<ArticleEditPage />} />
                {/* <Route path="problem/:problemId" element={<ProblemDetailPage />} /> */} {/* Ирээдүйд нэмэх */}
                {/* <Route path="profile/:userId" element={<ProfilePage />} /> */} {/* Ирээдүйд нэмэх */}
                {/* Бусад Layout дотор харагдах хуудсууд */}
            </Route>

            {/* Өөр Layout-гүй хуудсууд байвал энд нэмж болно */}
            {/* <Route path="/about" element={<AboutPage />} /> */}

        </Routes>
    );
}

export default App;