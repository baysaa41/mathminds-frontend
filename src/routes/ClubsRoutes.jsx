// src/routes/ClubsRoutes.jsx (эсвэл App.jsx-д нэмэх)
// Клубын route-уудын тохиргоо

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClubsList from '../pages/ClubsList';
import ClubsMine from '../pages/ClubsMine.jsx';
import ClubDetail from '../pages/ClubDetail';
import CreateClub from '../pages/CreateClub';

const ClubsRoutes = () => {
    return (
        <Routes>
            {/* Клубуудын жагсаалт */}
            <Route path="/" element={<ClubsList />} />

            <Route path="/mine/:username" element={<ClubsMine />} />

            {/* Шинэ клуб үүсгэх */}
            <Route path="/create" element={<CreateClub />} />

            {/* Клубын дэлгэрэнгүй */}
            <Route path="/:id" element={<ClubDetail />} />
        </Routes>
    );
};

export default ClubsRoutes;