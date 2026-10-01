// src/pages/InfoPage.jsx
// "Мэдээлэл" хуудас — зүүн sidebar цэстэй, Outlet-ээр дотоод хуудсуудыг харуулна

import React from 'react';
import { useLocation, Outlet, Link } from 'react-router-dom';
import { Info, Compass, HelpCircle, Globe, Users, Bot, TrendingUp } from 'lucide-react';
import AppHeader from '../components/AppHeader';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';

const MENU_ITEMS = [
  { path: '/info/about',            label: 'Танилцуулга',  Icon: Info       },
  { path: '/info/results',          label: 'Үр ашгийн тайлан', Icon: TrendingUp },
  { path: '/info/guide',            label: 'Заавар',       Icon: Compass    },
  { path: '/info/membership-guide', label: 'Гишүүнчлэл',  Icon: HelpCircle },
  { path: '/info/ai-guide',         label: 'AI заавар',   Icon: Bot        },
  { path: '/info/nomads360',        label: 'Nomads 360°', Icon: Globe      },
  { path: '/info/teachers',         label: 'Багш нар',    Icon: Users      },
];

// Сурталчилгааны хоёр Facebook хуудас
const FACEBOOK_PAGES = [
  { href: 'https://www.facebook.com/integral.mn', label: 'Интеграл — ЭЕШ, бодлогын сан' },
  { href: 'https://www.facebook.com/nomads360d',  label: 'Nomads 360° — олимпиад, байгалийн ухаан' },
];

function InfoPage() {
  const location = useLocation();

  return (
    <div className="d-flex flex-column vh-100">

      <AppHeader />

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

              <h6 className="text-uppercase text-muted small fw-bold mt-4 mb-2">
                <i className="bi bi-facebook me-1"></i>Биднийг дагаарай
              </h6>
              {FACEBOOK_PAGES.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-block small text-decoration-none py-1"
                >
                  {label}
                </a>
              ))}
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

            {/* Mobile-д sidebar харагдахгүй тул FB холбоосыг доор нь */}
            <div className="d-md-none border-top px-3 py-3 small">
              <i className="bi bi-facebook text-primary me-1"></i>
              {FACEBOOK_PAGES.map(({ href, label }, i) => (
                <React.Fragment key={href}>
                  {i > 0 && ' · '}
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                    {label.split(' — ')[0]}
                  </a>
                </React.Fragment>
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default InfoPage;
