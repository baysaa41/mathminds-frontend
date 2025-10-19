// frontend/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import ArticleDetailPage from './components/ArticleDetailPage';
import ArticleEditPage from './components/ArticleEditPage';
import Feed from './components/Feed';
import BookmarksPage from './components/BookmarksPage'; // <-- Шинэ импорт
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
                        <Layout />
                    </ProtectedRoute>
                }
            >
                {/* Layout дотор харагдах хүүхэд Route-ууд */}
                <Route index element={<Feed />} />
                <Route path="bookmarks" element={<BookmarksPage />} /> {/* <-- Шинэ route */}
                <Route path="article/:articleId" element={<ArticleDetailPage />} />
                <Route path="article/:articleId/edit" element={<ArticleEditPage />} />
                {/* Ирээдүйд нэмэх бусад route-ууд */}
                {/* <Route path="problem/:problemId" element={<ProblemDetailPage />} /> */}
                {/* <Route path="profile/:userId" element={<ProfilePage />} /> */}
            </Route>
        </Routes>
    );
}

export default App;