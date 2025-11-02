// frontend/src/components/RightSidebar.jsx
// (!!! ШИНЭЧИЛСЭН: TrendingPostsWidget-г тусад нь гаргаж, widget-үүдийг эрэмбэлсэн)

import React from 'react';
import Stack from 'react-bootstrap/Stack'; // (!!!) 1. Widget-үүдийг эрэмбэлэхэд ашиглах
import LatexTutorialWidget from './LatexTutorialWidget';
import TrendingPostsWidget from './TrendingPostsWidget'; // (!!!) 2. Шинэ компонентыг импортлох

const RightSidebar = () => {

    return (
        // (!!!) 4. Stack ашиглан widget-үүдийг хооронд нь зайтай жагсаах
        <Stack gap={3}>

            {/* 1. Trending Widget */}
            <TrendingPostsWidget />

            {/* 2. LaTeX зөвлөгөөний Widget */}
            <LatexTutorialWidget />

        </Stack>
    );
};

export default RightSidebar;