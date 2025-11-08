// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Layout болон үндсэн хуудсууд
import Layout from './components/Layout';
import Feed from './components/Feed';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ArticleDetailPage from './pages/ArticleDetailPage.jsx';
import ArticleEditPage from './pages/ArticleEditPage.jsx';
import ArticlesPage from './pages/ArticlesPage.jsx';

// Post дэлгэрэнгүй хуудас
import PostDetailPage from './pages/PostDetailPage.jsx';

// Problem хуудсууд
import ProblemDetailPage from './pages/ProblemDetailPage.jsx';
import ProblemEditPage from './pages/ProblemEditPage.jsx';
import ProblemsPage from './pages/ProblemsPage.jsx';
import SolutionEditPage from './pages/SolutionEditPage.jsx';

// Formula хуудсууд
import FormulasPage from './pages/FormulasPage.jsx';
import FormulaEditPage from './pages/FormulaEditPage.jsx';
import FormulaDetailPage from './pages/FormulaDetailPage.jsx';

// Quiz хуудсууд
import QuizzesPage from './pages/QuizzesPage.jsx';
import QuizDetailPage from './pages/QuizDetailPage.jsx';
import QuizEditPage from './pages/QuizEditPage.jsx';

// Профайл хуудсууд
import ProfilePage from './pages/ProfilePage.jsx';
import MyProfileRedirect from './pages/MyProfileRedirect.jsx';
import ProfileEditPage from './pages/ProfileEditPage.jsx';

// Followers/Following хуудсууд
import FollowersPage from './pages/FollowersPage.jsx';
import FollowingPage from './pages/FollowingPage.jsx';

// Coin хуудсууд
import CoinTransferPage from './pages/CoinTransferPage.jsx';

// Клуб / бүлгийн хуудсууд
import ClubsList from './pages/ClubsList.jsx';

// Нэвтрэх болон бусад хуудсууд
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import PasswordResetRequestPage from './pages/PasswordResetRequestPage.jsx';
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage.jsx';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';

// QPAY-н хуудас
import ProductListPage from './pages/ProductListPage.jsx';

// Хамгаалалт
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/password-reset" element={<PasswordResetRequestPage />} />
            <Route path="/password-reset/confirm/:uidb64/:token" element={<PasswordResetConfirmPage />} />
            <Route path="/callback" element={<CallbackPage />} />

            {/* Хамгаалагдсан хуудсууд - Layout дотор */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Үндсэн feed */}
                <Route index element={<Feed />} />
                <Route path="bookmarks" element={<BookmarksPage />} />

                {/* Post дэлгэрэнгүй */}
                <Route path="post/:postId" element={<PostDetailPage />} />

                {/* Article хуудсууд */}
                <Route path="article/:id" element={<ArticleDetailPage />} />
                <Route path="article/:id/edit" element={<ArticleEditPage />} />
                <Route path="articles" element={<ArticlesPage />} />

                {/* Problem хуудсууд */}
                <Route path="problem/:id" element={<ProblemDetailPage />} />
                <Route path="problem/:id/edit" element={<ProblemEditPage />} />
                <Route path="problem/:id/solution/edit" element={<SolutionEditPage />} />
                <Route path="problems" element={<ProblemsPage />} />

                {/* Formula хуудсууд */}
                <Route path="formulas" element={<FormulasPage />} />
                <Route path="formula/:id" element={<FormulaDetailPage />} />
                <Route path="formula/:id/edit" element={<FormulaEditPage />} />

                {/* Тестүүд */}
                <Route path="quizzes" element={<QuizzesPage />} />
                <Route path="quiz/:id" element={<QuizDetailPage />} />
                <Route path="quiz/:id/edit" element={<QuizEditPage />} />

                {/* Профайл */}
                <Route path="profile" element={<MyProfileRedirect />} />
                <Route path="profile/:username" element={<ProfilePage />} />
                <Route path="profile/edit" element={<ProfileEditPage />} />
                <Route path="profile/:username/followers" element={<FollowersPage />} />
                <Route path="profile/:username/following" element={<FollowingPage />} />

                {/* Coin шилжүүлэх */}
                <Route path="coins/transfer" element={<CoinTransferPage />} />

                {/* Клубууд */}
                <Route path="clubs" element={<ClubsList />} />

                {/* Products */}
                <Route path="products" element={<ProductListPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
