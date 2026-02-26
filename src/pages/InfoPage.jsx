// src/pages/InfoPage.jsx
// "Мэдээлэл" хуудас — зүүн sidebar цэстэй, Outlet-ээр дотоод хуудсуудыг харуулна

import React from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { Info, HelpCircle, Globe, Users } from 'lucide-react';

import Navbar from 'react-bootstrap/Navbar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';

const MENU_ITEMS = [
  { path: '/info/about',            label: 'Танилцуулга',  Icon: Info       },
  { path: '/info/membership-guide', label: 'Гишүүнчлэл',  Icon: HelpCircle },
  { path: '/info/nomads360',        label: 'Nomads 360°', Icon: Globe      },
  { path: '/info/teachers',         label: 'Багш нар',    Icon: Users      },
];

function InfoPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="d-flex flex-column vh-100">

      {/* Top Navbar */}
      <Navbar bg="white" className="border-bottom shadow-sm px-3" style={{ zIndex: 10 }}>
        <Navbar.Brand
          className="d-flex align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <i className="bi bi-info-circle text-primary me-2 fs-4"></i>
          <span className="fw-bold">Танилцуулга</span>
        </Navbar.Brand>

        <Button
          variant="outline-secondary"
          size="sm"
          className="ms-auto"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-1"></i>Буцах
        </Button>
      </Navbar>

      {/* Main */}
      <div className="flex-grow-1 overflow-hidden">
        <Row className="g-0 h-100">

          {/* Left Sidebar */}
          <Col md={3} lg={2} className="border-end bg-light h-100 overflow-auto d-none d-md-block">
            <div className="p-3">
              <h6 className="text-uppercase text-muted small fw-bold mb-2">
                <i className="bi bi-list me-1"></i>Цэс
              </h6>
              <ListGroup variant="flush">
                {MENU_ITEMS.map(({ path, label, Icon }) => (
                  <ListGroup.Item
                    key={path}
                    action
                    active={location.pathname === path}
                    as={Link}
                    to={path}
                    className="py-2 px-3 small d-flex align-items-center gap-2"
                  >
                    <Icon size={15} />
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
              {MENU_ITEMS.map(({ path, label, Icon }) => (
                <Button
                  key={path}
                  as={Link}
                  to={path}
                  variant={location.pathname === path ? 'primary' : 'outline-secondary'}
                  size="sm"
                  className="text-nowrap d-flex align-items-center gap-1"
                >
                  <Icon size={14} />
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

export default InfoPage;
