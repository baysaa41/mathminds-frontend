// Club Assignments Page
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClubAssignmentsWidget from '../components/ClubAssignmentsWidget';

const ClubAssignmentsPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin } = useOutletContext();
  return (
    <div className="container-fluid">
      <h4 className="mb-3">Даалгавар</h4>
      <ClubAssignmentsWidget club={clubData} onUpdate={clubActions?.onUpdate} isTeacherOrAdmin={isTeacherOrAdmin} />
    </div>
  );
};

export default ClubAssignmentsPage;
