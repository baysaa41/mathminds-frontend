// src/routes/ClubsRoutes.jsx
// Клубын route-уудын тохиргоо

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ClubDetail from '../pages/ClubDetail';
import ClubInfoPage from '../pages/ClubInfoPage';
import ClubCurriculumPage from '../pages/ClubCurriculumPage';
import ClubDiscussionPage from '../pages/ClubDiscussionPage';
import ClubVideosPage from '../pages/ClubVideosPage';
import ClubMediaPage from '../pages/ClubMediaPage';
import ClubAssignmentsPage from '../pages/ClubAssignmentsPage';
import ClubLessonsPage from '../pages/ClubLessonsPage';
import ClubExercisesPage from '../pages/ClubExercisesPage';
import ClubQuizzesPage from '../pages/ClubQuizzesPage';
import ClubExamsPage from '../pages/ClubExamsPage';
import ClubMembersPage from '../pages/ClubMembersPage';
import ClubFilesPage from '../pages/ClubFilesPage';
import CreateClub from '../pages/CreateClub';

const ClubsRoutes = () => {
  return (
    <Routes>
      {/* Клубуудын жагсаалт → fullscreen browse хуудас руу чиглүүлэх */}
      <Route path="/" element={<Navigate to="/clubs/browse" replace />} />

      {/* Шинэ клуб үүсгэх */}
      <Route path="create" element={<CreateClub />} />

      {/* Клубын дэлгэрэнгүй with nested routes */}
      <Route path=":id" element={<ClubDetail />}>
        <Route index element={<ClubInfoPage />} />
        <Route path="info" element={<ClubInfoPage forceInfo />} />
        <Route path="discussions" element={<ClubDiscussionPage />} />
        <Route path="curriculum" element={<ClubCurriculumPage />} />
        <Route path="videos" element={<ClubVideosPage />} />
        <Route path="media" element={<ClubMediaPage />} />
        <Route path="files" element={<ClubFilesPage />} />
        <Route path="lessons" element={<ClubLessonsPage />} />
        <Route path="exercises" element={<ClubExercisesPage />} />
        <Route path="assignments" element={<ClubAssignmentsPage />} />
        <Route path="quizzes" element={<ClubQuizzesPage />} />
        <Route path="exams" element={<ClubExamsPage />} />
        <Route path="members" element={<ClubMembersPage />} />
      </Route>
    </Routes>
  );
};

export default ClubsRoutes;
