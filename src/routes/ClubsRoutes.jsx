// src/routes/ClubsRoutes.jsx
// Клубын route-уудын тохиргоо

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClubsList from '../pages/ClubsList';
import ClubsUser from '../pages/ClubsUser.jsx';
import ClubDetail from '../pages/ClubDetail';
import ClubInfoPage from '../pages/ClubInfoPage';
import ClubCurriculumPage from '../pages/ClubCurriculumPage';
import ClubDiscussionPage from '../pages/ClubDiscussionPage';
import ClubVideosPage from '../pages/ClubVideosPage';
import ClubMediaPage from '../pages/ClubMediaPage';
import ClubAssignmentsPage from '../pages/ClubAssignmentsPage';
import ClubQuizzesPage from '../pages/ClubQuizzesPage';
import ClubExamsPage from '../pages/ClubExamsPage';
import ClubMembersPage from '../pages/ClubMembersPage';
import CreateClub from '../pages/CreateClub';

const ClubsRoutes = () => {
  return (
    <Routes>
      {/* Клубуудын жагсаалт */}
      <Route path="/" element={<ClubsList />} />

      {/* Миний клубууд */}
      <Route path="user/:username" element={<ClubsUser />} />

      {/* Шинэ клуб үүсгэх */}
      <Route path="create" element={<CreateClub />} />

      {/* Клубын дэлгэрэнгүй with nested routes */}
      <Route path=":id" element={<ClubDetail />}>
        <Route index element={<ClubInfoPage />} />
        <Route path="discussions" element={<ClubDiscussionPage />} />
        <Route path="curriculum" element={<ClubCurriculumPage />} />
        <Route path="videos" element={<ClubVideosPage />} />
        <Route path="media" element={<ClubMediaPage />} />
        <Route path="assignments" element={<ClubAssignmentsPage />} />
        <Route path="quizzes" element={<ClubQuizzesPage />} />
        <Route path="exams" element={<ClubExamsPage />} />
        <Route path="members" element={<ClubMembersPage />} />
      </Route>
    </Routes>
  );
};

export default ClubsRoutes;
