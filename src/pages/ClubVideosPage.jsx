// Club Videos Page
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClubVideosWidget from '../components/ClubVideosWidget';

const ClubVideosPage = () => {
  const { clubData, clubActions, isTeacherOrAdmin } = useOutletContext();
  return (
    <div className="container-fluid">
      <h4 className="mb-3">Бичлэг хичээл</h4>
      <ClubVideosWidget club={clubData} onUpdate={clubActions?.onUpdate} isTeacherOrAdmin={isTeacherOrAdmin} />
    </div>
  );
};

export default ClubVideosPage;
