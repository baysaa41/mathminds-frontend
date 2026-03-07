// src/pages/StoreLayout.jsx
// Дэлгүүрийн хуудсуудад нийтлэг layout — зүүн sidebar + Outlet

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';

const MENU_ITEMS = [
  { path: '/products',     label: 'Бүтээгдэхүүн',  icon: 'bi-shop'         },
  { path: '/cart',         label: 'Сагс',           icon: 'bi-cart'         },
  { path: '/my-purchases', label: 'Худалдан авалт', icon: 'bi-bag-check'    },
];

function isActive(itemPath, currentPath) {
  if (itemPath === '/products') {
    return currentPath === '/products' || currentPath.startsWith('/products/');
  }
  if (itemPath === '/my-purchases') {
    return currentPath === '/my-purchases' || currentPath.startsWith('/purchases/');
  }
  return currentPath === itemPath;
}

function StoreLayout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column vh-100">

      <AppHeader />

      <div className="flex-grow-1 overflow-hidden">
        <Row className="g-0 h-100">

          {/* Left Sidebar */}
          <Col md={3} lg={2} className="border-end bg-light h-100 overflow-auto d-none d-md-block">
            <div className="p-3">

              {/* Зоосны данс */}
              {user && (
                <div className="mb-3 p-2 bg-white rounded border small">
                  <div className="text-muted fw-bold text-uppercase mb-1" style={{ fontSize: '0.7rem' }}>
                    Таны данс
                  </div>
                  <div className="d-flex flex-column gap-1">
                    <span>🥈 <strong>{user.silver_coins ?? 0}</strong> мөнгөн зоос</span>
                    <span>🥉 <strong>{user.copper_coins ?? 0}</strong> хүрэл зоос</span>
                  </div>
                </div>
              )}

              <h6 className="text-uppercase text-muted small fw-bold mb-2">
                <i className="bi bi-shop me-1"></i>Цэс
              </h6>
              <ListGroup variant="flush">
                {MENU_ITEMS.map(({ path, label, icon }) => (
                  <ListGroup.Item
                    key={path}
                    action
                    active={isActive(path, location.pathname)}
                    as={Link}
                    to={path}
                    className="py-2 px-3 small d-flex align-items-center gap-2"
                  >
                    <i className={`bi ${icon}`}></i>
                    {label}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>

          {/* Main Content */}
          <Col md={9} lg={10} className="h-100 overflow-auto">
            {/* Mobile nav */}
            <div className="d-md-none border-bottom px-3 py-2 bg-white d-flex gap-2 overflow-auto">
              {MENU_ITEMS.map(({ path, label, icon }) => (
                <Button
                  key={path}
                  as={Link}
                  to={path}
                  variant={isActive(path, location.pathname) ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="text-nowrap"
                >
                  <i className={`bi ${icon} me-1`}></i>
                  {label}
                </Button>
              ))}
            </div>

            <Outlet />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default StoreLayout;
