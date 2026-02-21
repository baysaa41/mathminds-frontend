// Club Exams Page
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClubExamsWidget from '../components/ClubExamsWidget';

const ClubExamsPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin } = useOutletContext();
  return (
    <div className="container-fluid">
      <h4 className="mb-3">Шалгалт ба ахиц</h4>
      <ClubExamsWidget club={clubData} onUpdate={clubActions?.onUpdate} isTeacherOrAdmin={isTeacherOrAdmin} />
    </div>
  );
};

export default ClubExamsPage;
