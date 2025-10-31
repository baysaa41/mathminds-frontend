// src/App.jsx (FOLLOW ЗАМУУДТАЙ ШИНЭЧИЛСЭН)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Layout болон үндсэн хуудсууд
import Layout from './components/Layout';
import Feed from './components/Feed';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ArticleDetailPage from './pages/ArticleDetailPage.jsx';
import ArticleEditPage from './pages/ArticleEditPage.jsx';
import ArticlesPage from './pages/ArticlesPage.jsx';

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

// (!!!) ШИНЭ: Followers/Following хуудсууд
import FollowersPage from './pages/FollowersPage.jsx';
import FollowingPage from './pages/FollowingPage.jsx';

// Coin хуудсууд
import CoinTransferPage from './pages/CoinTransferPage.jsx';

// КЛУБ / БҮЛГИЙН ХУУДСУУД
import ClubsRoutes from './routes/ClubsRoutes';

// Нэвтрэх болон бусад хуудсууд
import UnifiedLoginPage from './pages/UnifiedLoginPage.jsx';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';

// Хамгаалалт
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/welcome" element={<HomePage />} />
                <Route path="/login" element={<UnifiedLoginPage />} />
                <Route path="/callback" element={<CallbackPage />} />

                {/* Хамгаалагдсан хуудсууд - Layout дотор */}
                <Route path="/" element={ <ProtectedRoute><Layout /></ProtectedRoute> }>
                    {/* Үндсэн хуудас */}
                    <Route index element={<Feed />} />
                    <Route path="bookmarks" element={<BookmarksPage />} />

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

                    {/* Профайл хуудсууд */}
                    <Route path="profile" element={<MyProfileRedirect />} />
                    <Route path="profile/:username" element={<ProfilePage />} />
                    <Route path="profile/edit" element={<ProfileEditPage />} />

                    {/* (!!!) ШИНЭ ЗАМУУД: Followers/Following */}
                    <Route path="profile/:username/followers" element={<FollowersPage />} />
                    <Route path="profile/:username/following" element={<FollowingPage />} />

                    {/* Coin шилжүүлэх */}
                    <Route path="coins/transfer" element={<CoinTransferPage />} />

                    {/* КЛУБ / БҮЛЭГ */}
                    <Route path="/clubs/*" element={<ClubsRoutes />} />

                </Route>

                {/* Dashboard - Layout-аас гадуур */}
                <Route path="/dashboard" element={ <ProtectedRoute><DashboardPage /></ProtectedRoute> } />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;