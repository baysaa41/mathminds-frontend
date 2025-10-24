// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout болон үндсэн хуудсууд
import Layout from './components/Layout';
import Feed from './components/Feed';
import BookmarksPage from './pages/BookmarksPage.jsx';
import ArticleDetailPage from './pages/ArticleDetailPage.jsx';
import ArticleEditPage from './pages/ArticleEditPage.jsx';

// Problem хуудсууд
import ProblemDetailPage from './pages/ProblemDetailPage.jsx';
import ProblemEditPage from './pages/ProblemEditPage.jsx';
import ProblemsPage from './pages/ProblemsPage.jsx';
import SolutionEditPage from './pages/SolutionEditPage.jsx'; // (!!!) ШИНЭ

// Formula хуудсууд
import FormulasPage from './pages/FormulasPage.jsx';
import FormulaEditPage from './pages/FormulaEditPage.jsx';
// (!!!) 1. FormulaDetailPage-г импортлох
import FormulaDetailPage from './pages/FormulaDetailPage.jsx';

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
                {/* ... (Public routes хэвээрээ) ... */}
                <Route path="/welcome" element={<HomePage />} />
                <Route path="/login" element={<UnifiedLoginPage />} />
                <Route path="/callback" element={<CallbackPage />} />

                {/* Хамгаалагдсан хуудсууд */}
                <Route path="/" element={ <ProtectedRoute><Layout /></ProtectedRoute> }>
                    <Route index element={<Feed />} />
                    <Route path="bookmarks" element={<BookmarksPage />} />
                    <Route path="article/:id" element={<ArticleDetailPage />} />
                    <Route path="article/:id/edit" element={<ArticleEditPage />} />
                    <Route path="problem/:id" element={<ProblemDetailPage />} />
                    <Route path="problem/:id/edit" element={<ProblemEditPage />} />
                    <Route path="problem/:id/solutions/edit" element={<SolutionEditPage />} /> {/* (!!!) ШИНЭ */}
                    <Route path="problems" element={<ProblemsPage />} />

                    {/* Formula хуудсууд */}
                    <Route path="formulas" element={<FormulasPage />} />
                    {/* (!!!) 2. Дэлгэрэнгүй замыг нэмэх */}
                    <Route path="formula/:id" element={<FormulaDetailPage />} />
                    <Route path="formula/:id/edit" element={<FormulaEditPage />} />

                    <Route path="quizzes" element={<div>Тестийн сан (үүсгэх)</div>} />
                    <Route path="profile" element={<div>Профайл (үүсгэх)</div>} />
                </Route>

                {/* ... (Бусад route-ууд хэвээрээ) ... */}
                <Route path="/dashboard" element={ <ProtectedRoute><DashboardPage /></ProtectedRoute> } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;