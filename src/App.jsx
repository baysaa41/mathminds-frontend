// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout болон үндсэн хуудсууд
import Layout from './components/Layout';
import Feed from './components/Feed';
import BookmarksPage from './pages/BookmarksPage.jsx'; //
import ArticleDetailPage from './pages/ArticleDetailPage.jsx'; // <<< 1. ШИНЭЭР ИМПОРТ ХИЙХ

// Нэвтрэх болон бусад хуудсууд
import UnifiedLoginPage from './pages/UnifiedLoginPage.jsx';
import CallbackPage from './pages/CallbackPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';

// Хамгаалалт
import ProtectedRoute from './components/ProtectedRoute'; //

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. Нийтийн (Public) хуудсууд */}
                <Route path="/welcome" element={<HomePage />} />
                <Route path="/login" element={<UnifiedLoginPage />} />
                <Route path="/callback" element={<CallbackPage />} />

                {/* 2. Хамгаалагдсан (Protected) хуудсууд */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    {/* Layout-н <Outlet /> дотор харагдах хуудсууд: */}

                    <Route index element={<Feed />} />
                    <Route path="bookmarks" element={<BookmarksPage />} />

                    {/* >>> 2. ЭНЭ МӨРИЙГ НЭМНЭ <<<
                      /article/:id зам руу ороход ArticleDetailPage-г дуудна.
                      :id нь dynamic parameter буюу ямар ч өгүүллийн дугаар байж болно.
                    */}
                    <Route path="article/:id" element={<ArticleDetailPage />} />

                    {/* LeftSidebar.jsx доторх бусад холбоосууд */}
                    <Route path="problems" element={<div>Бодлогын сан (үүсгэх)</div>} />
                    <Route path="quizzes" element={<div>Тестийн сан (үүсгэх)</div>} />
                    <Route path="formulas" element={<div>Томьёоны сан (үүсгэх)</div>} />
                    <Route path="profile" element={<div>Профайл (үүсгэх)</div>} />
                </Route>

                {/* ... (Бусад route-ууд: /dashboard, * г.м) ... */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;