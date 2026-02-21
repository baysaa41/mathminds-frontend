// Club Curriculum Page
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClubCurriculumWidget from '../components/ClubCurriculumWidget';

const ClubCurriculumPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin } = useOutletContext();
  return (
    <div className="container-fluid">
      <h4 className="mb-3">Хөтөлбөр</h4>
      <ClubCurriculumWidget club={clubData} onUpdate={clubActions?.onUpdate} isTeacherOrAdmin={isTeacherOrAdmin} />
    </div>
  );
};

export default ClubCurriculumPage;
