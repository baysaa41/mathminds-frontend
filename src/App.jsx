// src/App.jsx

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig } from './mathjax.config.js';

// Critical components - loaded immediately
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LoadingState from './components/common/LoadingState';

// Lazy-loaded page components
const Feed = lazy(() => import('./components/Feed'));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'));
const ConversationViewPage = lazy(() => import('./pages/ConversationViewPage.jsx'));

// Articles
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage.jsx'));
const ArticleEditPage = lazy(() => import('./pages/ArticleEditPage.jsx'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage.jsx'));
const ArticlesBrowsePage = lazy(() => import('./pages/ArticlesBrowsePage.jsx'));

// Posts
const PostDetailPage = lazy(() => import('./pages/PostDetailPage.jsx'));

// AI Solver
const SolverPage = lazy(() => import('./pages/SolverPage.jsx'));
const AISolverPage = lazy(() => import('./pages/AISolverPage.jsx'));

// AI Chat

// Problems
const ProblemDetailPage = lazy(() => import('./pages/ProblemDetailPage.jsx'));
const ProblemEditPage = lazy(() => import('./pages/ProblemEditPage.jsx'));
const ProblemsPage = lazy(() => import('./pages/ProblemsPage.jsx'));
const ProblemsBrowsePage = lazy(() => import('./pages/ProblemsBrowsePage.jsx'));
const SolutionEditPage = lazy(() => import('./pages/SolutionEditPage.jsx'));
const SolutionDrawPage = lazy(() => import('./pages/SolutionDrawPage.jsx'));
const DrawPage = lazy(() => import('./pages/DrawPage.jsx'));

// Formulas
const FormulasPage = lazy(() => import('./pages/FormulasPage.jsx'));
const FormulasBrowsePage = lazy(() => import('./pages/FormulasBrowsePage.jsx'));
const FormulaEditPage = lazy(() => import('./pages/FormulaEditPage.jsx'));
const FormulaDetailPage = lazy(() => import('./pages/FormulaDetailPage.jsx'));
const LaTeXExamplesPage = lazy(() => import('./pages/LaTeXExamplesPage.jsx'));

// Quizzes
const QuizzesPage = lazy(() => import('./pages/QuizzesPage.jsx'));
const QuizzesBrowsePage = lazy(() => import('./pages/QuizzesBrowsePage.jsx'));
const ContentBrowsePage = lazy(() => import('./pages/ContentBrowsePage.jsx'));
const QuizDetailPage = lazy(() => import('./pages/QuizDetailPage.jsx'));
const QuizEditPage = lazy(() => import('./pages/QuizEditPage.jsx'));
const QuizTakePage = lazy(() => import('./pages/QuizTakePage.jsx'));
const QuizResultPage = lazy(() => import('./pages/QuizResultPage.jsx'));
const QuizStudentAnswersPage = lazy(() => import('./pages/QuizStudentAnswersPage.jsx'));
const QuizLeaderboardPage = lazy(() => import('./pages/QuizLeaderboardPage.jsx'));
const QuizGenerateCurriculumPage = lazy(() => import('./pages/QuizGenerateCurriculumPage.jsx'));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage.jsx'));
const TopicLearnPage = lazy(() => import('./pages/TopicLearnPage.jsx'));

// Profile
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const MyProfileRedirect = lazy(() => import('./pages/MyProfileRedirect.jsx'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage.jsx'));
const FollowersPage = lazy(() => import('./pages/FollowersPage.jsx'));
const FollowingPage = lazy(() => import('./pages/FollowingPage.jsx'));
const SuggestedUsersPage = lazy(() => import('./pages/SuggestedUsersPage.jsx'));

// Coins
const CoinTransferPage = lazy(() => import('./pages/CoinTransferPage.jsx'));

// Clubs
const ClubsRoutes = lazy(() => import('./routes/ClubsRoutes.jsx'));
const ClubsBrowsePage = lazy(() => import('./pages/ClubsBrowsePage.jsx'));
const TeacherInvitationsPage = lazy(() => import('./pages/TeacherInvitationsPage.jsx'));

// Auth & Public
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const PasswordResetRequestPage = lazy(() => import('./pages/PasswordResetRequestPage.jsx'));
const PasswordResetConfirmPage = lazy(() => import('./pages/PasswordResetConfirmPage.jsx'));
const CallbackPage = lazy(() => import('./pages/CallbackPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

// Info Pages
const InfoPage = lazy(() => import('./pages/InfoPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const TopTeachersPage = lazy(() => import('./pages/TopTeachersPage.jsx'));
const TeacherEditPage = lazy(() => import('./pages/TeacherEditPage.jsx'));
const Nomads360Page = lazy(() => import('./pages/Nomads360Page.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const MembershipGuidePage = lazy(() => import('./pages/MembershipGuidePage.jsx'));
const AIGuidePage = lazy(() => import('./pages/AIGuidePage.jsx'));

// Admin
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AIConversationsPage = lazy(() => import('./pages/AIConversationsPage.jsx'));
const AdminConversationPage = lazy(() => import('./pages/AdminConversationPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const MMOImportPage = lazy(() => import('./pages/MMOImportPage.jsx'));
const DocImportPage = lazy(() => import('./pages/DocImportPage.jsx'));
const AllUsersPage = lazy(() => import('./pages/AllUsersPage.jsx'));
const SalesStatsPage = lazy(() => import('./pages/SalesStatsPage.jsx'));
const CurriculumAdminPage = lazy(() => import('./pages/CurriculumAdminPage.jsx'));
const DjangoCommandsPage = lazy(() => import('./pages/DjangoCommandsPage.jsx'));
const AIModelsPage = lazy(() => import('./pages/AIModelsPage.jsx'));
const AILearningSystemPage = lazy(() => import('./pages/AILearningSystemPage.jsx'));
const MathTermsPage = lazy(() => import('./pages/MathTermsPage.jsx'));
const EECResultsPage = lazy(() => import('./pages/EECResultsPage.jsx'));
const EECStatsPage = lazy(() => import('./pages/EECStatsPage.jsx'));

// Email Campaigns
const EmailCampaignsPage = lazy(() => import('./pages/EmailCampaignsPage.jsx'));
const EmailCampaignCreatePage = lazy(() => import('./pages/EmailCampaignCreatePage.jsx'));
const EmailCampaignDetailPage = lazy(() => import('./pages/EmailCampaignDetailPage.jsx'));

// Products
const StoreLayout = lazy(() => import('./pages/StoreLayout.jsx'));
const ProductListPage = lazy(() => import('./pages/ProductListPage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const MyPurchasesPage = lazy(() => import('./pages/MyPurchasesPage.jsx'));
const MembershipPlansPage = lazy(() => import('./pages/MembershipPlansPage.jsx'));

function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        {/* Public routes */}
        <Route path="/welcome" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        {/* Нууц үг баталгаажуулах/шинэчлэх зам. uidb64 болон token-г URL-аас авна */}
        <Route path="/reset-password/:uidb64/:token" element={<PasswordResetConfirmPage />} />
        <Route path="/callback" element={<CallbackPage />} />

        {/* Нийтэд нээлттэй харилцан яриа харах */}
        <Route
          path="/messages/conversation/:conversationUuid"
          element={
            <MathJaxContext version={3} config={mathJaxConfig}>
              <ConversationViewPage />
            </MathJaxContext>
          }
        />

        {/* Info Pages - /info/* руу redirect */}
        <Route path="/about" element={<Navigate to="/info/about" replace />} />
        <Route path="/nomads360" element={<Navigate to="/info/nomads360" replace />} />
        <Route path="/membership-guide" element={<Navigate to="/info/membership-guide" replace />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/teachers" element={<Navigate to="/info/teachers" replace />} />

        {/* Хамгаалагдсан хуудсууд - Layout дотор */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Үндсэн feed */}
          <Route index element={<Feed />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="messages" element={<MessagesPage />} />

          {/* AI Ярилцлага Шийдэгч */}
          <Route path="solver" element={<SolverPage />} />

          {/* Post дэлгэрэнгүй */}
          <Route path="post/:postId" element={<PostDetailPage />} />

          {/* Article хуудсууд */}
          <Route path="article/:uuid" element={<ArticleDetailPage />} />
          <Route path="article/:uuid/edit" element={<ArticleEditPage />} />
          <Route path="articles" element={<Navigate to="/content/browse?type=articles" replace />} />

          {/* Problem хуудсууд */}
          <Route path="problem/:uuid" element={<ProblemDetailPage />} />
          <Route path="problem/:uuid/edit" element={<ProblemEditPage />} />
          <Route path="problem/:uuid/solution/new" element={<SolutionEditPage />} />
          <Route path="solution/:solutionUuid/edit" element={<SolutionEditPage />} />
          <Route path="problems" element={<Navigate to="/content/browse?type=problems" replace />} />

          {/* Formula хуудсууд */}
          <Route path="formulas" element={<Navigate to="/content/browse?type=formulas" replace />} />
          <Route path="formula/:uuid" element={<FormulaDetailPage />} />
          <Route path="formula/:uuid/edit" element={<FormulaEditPage />} />
          <Route path="latex-examples" element={<LaTeXExamplesPage />} />

          {/* Тестүүд */}
          <Route path="quizzes" element={<Navigate to="/content/browse?type=quizzes" replace />} />
          <Route path="quiz/:uuid" element={<QuizDetailPage />} />
          <Route path="quiz/:uuid/edit" element={<QuizEditPage />} />
          <Route path="quiz/:uuid/take" element={<QuizTakePage />} />
          <Route path="quiz/:quizUuid/result/:sheetId" element={<QuizResultPage />} />
          <Route path="quiz/:uuid/student-answers" element={<QuizStudentAnswersPage />} />
          <Route path="quiz/:uuid/leaderboard" element={<QuizLeaderboardPage />} />
          <Route path="quiz/generate-curriculum" element={<QuizGenerateCurriculumPage />} />

          {/* Хөтөлбөрийн дэлгэрэнгүй хуудас */}
          <Route path="programs/:id" element={<ProgramDetailPage />} />
          <Route path="programs/:programId/topics/:topicId" element={<TopicLearnPage />} />

          {/* Профайл */}
          <Route path="profile" element={<MyProfileRedirect />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="profile/edit" element={<ProfileEditPage />} />
          <Route path="profile/:username/followers" element={<FollowersPage />} />
          <Route path="profile/:username/following" element={<FollowingPage />} />
          <Route path="users/suggested" element={<SuggestedUsersPage />} />

          {/* Coin шилжүүлэх */}
          <Route path="coins/transfer" element={<CoinTransferPage />} />

          {/* Клубууд */}
          <Route path="clubs/*" element={<ClubsRoutes />} />

          {/* Багшийн урилгууд */}
          <Route path="teacher-invitations" element={<TeacherInvitationsPage />} />

          {/* Reports - Admin болон Teacher нар л хандах боломжтой */}
          <Route
            path="reports"
            element={
              <AdminRoute allowTeacher={true}>
                <ReportsPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* AI Багш нартай чат - Fullscreen */}
        <Route
          path="/ai-chat/messages"
          element={
            <ProtectedRoute>
              <MathJaxContext version={3} config={mathJaxConfig}>
                <MessagesPage aiOnly={true} />
              </MathJaxContext>
            </ProtectedRoute>
          }
        />

        {/* AI хамтарсан бодолт - Fullscreen, staff only */}
        <Route
          path="/problem/:uuid/ai-solve"
          element={
            <ProtectedRoute>
              <AISolverPage />
            </ProtectedRoute>
          }
        />

        {/* Бодолт зурах - Fullscreen Excalidraw */}
        <Route
          path="/problem/:uuid/draw"
          element={
            <ProtectedRoute>
              <SolutionDrawPage />
            </ProtectedRoute>
          }
        />

        {/* Ерөнхий зурах хуудас — аль ч хуудаснаас дуудагдах боломжтой */}
        <Route
          path="/draw"
          element={
            <ProtectedRoute>
              <DrawPage />
            </ProtectedRoute>
          }
        />

        {/* Бодлогын сан - Fullscreen browse */}
        <Route
          path="/problems/browse"
          element={
            <ProtectedRoute>
              <ProblemsBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Өгүүллийн сан - Fullscreen browse */}
        <Route
          path="/articles/browse"
          element={
            <ProtectedRoute>
              <ArticlesBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Томьёоны сан - Fullscreen browse */}
        <Route
          path="/formulas/browse"
          element={
            <ProtectedRoute>
              <FormulasBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Тестийн сан - Fullscreen browse */}
        <Route
          path="/quizzes/browse"
          element={
            <ProtectedRoute>
              <QuizzesBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Нэгдсэн контентийн сан */}
        <Route
          path="/content/browse"
          element={
            <ProtectedRoute>
              <ContentBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Клубуудын жагсаалт - Fullscreen browse */}
        <Route
          path="/clubs/browse"
          element={
            <ProtectedRoute>
              <ClubsBrowsePage />
            </ProtectedRoute>
          }
        />

        {/* Мэдээлэл хуудас - sidebar цэстэй */}
        <Route path="/info" element={<InfoPage />}>
          <Route index element={<Navigate to="/info/about" replace />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="membership-guide" element={<MembershipGuidePage />} />
          <Route path="ai-guide" element={<AIGuidePage />} />
          <Route path="nomads360" element={<Nomads360Page />} />
          <Route path="teachers" element={<TopTeachersPage />} />
        </Route>

        {/* E-commerce хуудсууд — StoreLayout sidebar-тай */}
        <Route
          element={
            <ProtectedRoute>
              <StoreLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/products"        element={<ProductListPage />} />
          <Route path="/products/:id"    element={<ProductDetailPage />} />
          <Route path="/cart"            element={<CartPage />} />
          <Route path="/checkout"        element={<CheckoutPage />} />
          <Route path="/my-purchases"    element={<MyPurchasesPage />} />
          <Route path="/purchases/:userId" element={<MyPurchasesPage />} />
        </Route>
        <Route
          path="/membership"
          element={
            <ProtectedRoute>
              <MembershipPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />

        {/* MMO Import - Staff only */}
        <Route
          path="/admin/mmo-import"
          element={
            <AdminRoute>
              <MMOImportPage />
            </AdminRoute>
          }
        />

        {/* Doc Import - Staff only */}
        <Route
          path="/admin/doc-import"
          element={
            <AdminRoute>
              <DocImportPage />
            </AdminRoute>
          }
        />

        {/* All Users - Staff only */}
        <Route
          path="/admin/all-users"
          element={
            <AdminRoute>
              <AllUsersPage />
            </AdminRoute>
          }
        />

        {/* Sales Stats - Staff only */}
        <Route
          path="/admin/sales-stats"
          element={
            <AdminRoute>
              <SalesStatsPage />
            </AdminRoute>
          }
        />

        {/* Curriculum Admin - Staff only */}
        <Route
          path="/admin/curriculum"
          element={
            <AdminRoute>
              <CurriculumAdminPage />
            </AdminRoute>
          }
        />

        {/* Django Commands - Staff only */}
        <Route
          path="/admin/commands"
          element={
            <AdminRoute>
              <DjangoCommandsPage />
            </AdminRoute>
          }
        />

        {/* AI Conversations - Staff only */}
        <Route
          path="/admin/ai-conversations"
          element={
            <AdminRoute>
              <AIConversationsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/conversation/:conversationUuid"
          element={
            <AdminRoute>
              <MathJaxContext version={3} config={mathJaxConfig}>
                <AdminConversationPage />
              </MathJaxContext>
            </AdminRoute>
          }
        />

        {/* AI Загварууд - Staff only */}
        <Route
          path="/admin/ai-models"
          element={
            <AdminRoute>
              <AIModelsPage />
            </AdminRoute>
          }
        />

        {/* AI Сургалтын Систем - Staff only */}
        <Route
          path="/admin/ai-learning-system"
          element={
            <AdminRoute>
              <AILearningSystemPage />
            </AdminRoute>
          }
        />

        {/* Math Terms - Staff only */}
        <Route
          path="/admin/math-terms"
          element={
            <AdminRoute>
              <MathTermsPage />
            </AdminRoute>
          }
        />

        {/* ЭЕШ дүн - Staff only */}
        <Route
          path="/admin/eec-results"
          element={
            <AdminRoute>
              <EECResultsPage />
            </AdminRoute>
          }
        />

        {/* ЭЕШ статистик - Staff only */}
        <Route
          path="/admin/eec-stats"
          element={
            <AdminRoute>
              <EECStatsPage />
            </AdminRoute>
          }
        />

        {/* Email Campaigns - Staff only */}
        <Route
          path="/admin/emails"
          element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }
        >
          <Route index element={<EmailCampaignsPage />} />
          <Route path="create" element={<EmailCampaignCreatePage />} />
          <Route path=":id" element={<EmailCampaignDetailPage />} />
        </Route>

        {/* Teacher Edit - Staff only */}
        <Route
          path="/teacher/new"
          element={
            <AdminRoute>
              <TeacherEditPage />
            </AdminRoute>
          }
        />
        <Route
          path="/teacher/:id/edit"
          element={
            <AdminRoute>
              <TeacherEditPage />
            </AdminRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
