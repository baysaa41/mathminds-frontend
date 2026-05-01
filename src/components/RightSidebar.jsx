// frontend/src/components/RightSidebar.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import Stack from 'react-bootstrap/Stack';
import ClubMenuWidget from './ClubMenuWidget';
import ClubPaymentInfoWidget from './ClubPaymentInfoWidget';
import TrendingPostsWidget from './TrendingPostsWidget';
import ExerciseDatesWidget from './ExerciseDatesWidget';
import SearchWidget from './SearchWidget';
import MyClubsWidget from './MyClubsWidget';

const RightSidebar = ({ clubData = null }) => {
  const location = useLocation();
  const isClubsPage = location.pathname.startsWith('/clubs');
  const isExercisesPage = /^\/clubs\/(\d+)\/exercises/.test(location.pathname);
  const exercisesClubId = isExercisesPage
    ? location.pathname.match(/^\/clubs\/(\d+)\/exercises/)?.[1]
    : null;

  return (
    <Stack gap={3}>
      {!clubData && <SearchWidget />}
      {!clubData && <MyClubsWidget />}
      {clubData && <ClubMenuWidget club={clubData} />}
      {clubData && clubData.club_type === 'STUDY' && <ClubPaymentInfoWidget club={clubData} />}
      {isExercisesPage && exercisesClubId && (
        <ExerciseDatesWidget clubId={exercisesClubId} />
      )}
      {!clubData && !isClubsPage && <TrendingPostsWidget />}
    </Stack>
  );
};

export default RightSidebar;
