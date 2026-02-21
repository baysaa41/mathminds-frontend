// Club Quizzes Page
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClubQuizzesWidget from '../components/ClubQuizzesWidget';

const ClubQuizzesPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin } = useOutletContext();
  return (
    <div className="container-fluid">
      <h4 className="mb-3">Сорил, тестүүд</h4>
      <ClubQuizzesWidget club={clubData} onUpdate={clubActions?.onUpdate} isTeacherOrAdmin={isTeacherOrAdmin} />
    </div>
  );
};

export default ClubQuizzesPage;
