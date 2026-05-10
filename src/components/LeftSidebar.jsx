// src/components/LeftSidebar.jsx
// (!!! ШИНЭ ФАЙЛ: "Клубууд" цэс нэмэгдсэн)

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';
import Image from 'react-bootstrap/Image';
import './LeftSidebar.css'; // (!!!) Таны өгсөн CSS файл

const LeftSidebar = () => {
  const { user } = useAuth();

  return (
    <Stack className="d-flex flex-column h-100 p-3">
      {/* Logo */}

      <div className="mb-4 d-flex align-items-center">
        <h2 className="h4 fw-bold text-primary mb-0">MathMinds.club</h2>
      </div>

      {/* Navigation */}
      <Nav className="nav-pills-custom flex-column mb-auto" as="nav">
        <Nav.Item>
          <Nav.Link as={NavLink} to="/" end className="d-flex align-items-center gap-2">
            <i className="bi bi-house fs-5"></i>
            <span>Нүүр</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/content/browse?type=articles" className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-text fs-5"></i>
            <span>Өгүүллүүд</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/content/browse?type=problems" className="d-flex align-items-center gap-2">
            <i className="bi bi-puzzle fs-5"></i>
            <span>Бодлогууд</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/content/browse?type=formulas" className="d-flex align-items-center gap-2">
            <i className="bi bi-infinity fs-5"></i>
            <span>Томьёо</span>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={NavLink} to="/content/browse?type=quizzes" className="d-flex align-items-center gap-2">
            <i className="bi bi-patch-check fs-5"></i>
            <span>Тестүүд</span>
          </Nav.Link>
        </Nav.Item>

        {/* (!!!) ШИНЭ ЦЭС: КЛУБУУД */}
        <Nav.Item>
          <Nav.Link as={NavLink} to="/clubs" className="d-flex align-items-center gap-2">
            <i className="bi bi-people fs-5"></i>
            <span>Клубууд</span>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link as={NavLink} to="/bookmarks" className="d-flex align-items-center gap-2">
            <i className="bi bi-bookmark fs-5"></i>
            <span>Хадгалсан</span>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link as={NavLink} to="/products" className="d-flex align-items-center gap-2">
            <i className="bi bi-shop fs-5"></i>
            <span>Онлайн дэлгүүр</span>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link as={NavLink} to="/reports" className="d-flex align-items-center gap-2">
            <i className="bi bi-flag fs-5"></i>
            <span>Тайлан</span>
          </Nav.Link>
        </Nav.Item>

        <hr />
        {/* (!!!) ШИНЭ ЦЭС: МИНИЙ ПРОФАЙЛ */}
        <Nav.Item>
          <Nav.Link as={NavLink} to="/profile" className="d-flex align-items-center gap-2">
            <i className="bi bi-person fs-5"></i>
            <span>Миний профайл</span>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* User Profile Footer */}
      {user && (
        <div className="mt-auto pt-3 border-top">
          <p className="fw-bold mb-0 text-dark">{user.first_name || 'User'}</p>
          <p className="text-muted small mb-0">@{user.username}</p>
        </div>
      )}
    </Stack>
  );
};

export default LeftSidebar;
