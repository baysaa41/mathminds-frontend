// frontend/src/components/RightSidebar.jsx
// (!!! ШИНЭЧИЛСЭН: Клубын хуудсанд меню, бусад хуудсанд SuggestedUsers/Trending)

import React from 'react';
import { useLocation } from 'react-router-dom';
import Stack from 'react-bootstrap/Stack';
import ClubMenuWidget from './ClubMenuWidget';
import ClubPaymentInfoWidget from './ClubPaymentInfoWidget';
import TrendingPostsWidget from './TrendingPostsWidget';

import RecentlyVisitedWidget from './RecentlyVisitedWidget';
import SearchWidget from './SearchWidget';
import MyClubsWidget from './MyClubsWidget';

const RightSidebar = ({
  clubData = null
}) => {
  const location = useLocation();

  // Клубын хуудас эсэхийг шалгах
  const isClubsPage = location.pathname.startsWith('/clubs');

  return (
    <Stack gap={3}>
      {/* Search Widget (бүх хуудсанд) */}
      {!clubData && <SearchWidget />}

      {/* Миний клубууд (клубын дэлгэрэнгүй хуудас биш үед) */}
      {!clubData && <MyClubsWidget />}

      {/* Клубын цэс (зөвхөн clubs/:id хуудас дээр) */}
      {clubData && <ClubMenuWidget club={clubData} />}

      {/* Төлбөрийн мэдээлэл - зөвхөн STUDY клубт */}
      {clubData && clubData.club_type === 'STUDY' && <ClubPaymentInfoWidget club={clubData} />}

      {/* Сүүлд үзсэн холбоосууд */}
      <RecentlyVisitedWidget />

      {/* Trending Widget (клубын хуудас биш үед) */}
      {!clubData && !isClubsPage && <TrendingPostsWidget />}

    </Stack>
  );
};

export default RightSidebar;
