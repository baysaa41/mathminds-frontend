// src/components/AppHeader.jsx
// Логин хуудаснаас бусад бүх хуудсанд ашиглагдах нийтлэг header.

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPrivateMessagesCount } from '../services/notificationService';
import NotificationBell from './NotificationBell';

import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Badge from 'react-bootstrap/Badge';

import {
  Users,
  BookMarked,
  ShoppingCart,
  User as UserIcon,
  List,
  Calculator,
  Info,
  MessageCircle,
  BotMessageSquare,
  PenLine,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSidebar, setShowSidebar] = useState(false);
  const [privateMessagesCount, setPrivateMessagesCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try { setPrivateMessagesCount(await getPrivateMessagesCount()); } catch { /* ignore */ }
    };
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Route өөрчлөгдөхөд sidebar хаах
  useEffect(() => { setShowSidebar(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleOpenDraw = () => {
    navigate('/draw', {
      state: { pageUrl: location.pathname },
    });
  };

  const close = () => setShowSidebar(false);

  return (
    <>
      <Navbar
        bg="white"
        expand="lg"
        className="border-bottom shadow-sm py-2 sticky-top"
        style={{ zIndex: 1000 }}
      >
        <Container fluid>
          {/* Brand */}
          <Navbar.Brand
            as={Link}
            to="/"
            className="fw-bold text-primary d-flex align-items-center"
          >
            <span className="d-none d-sm-inline">MathMinds.Club</span>
          </Navbar.Brand>

          {/* Back / Forward */}
          <div className="d-flex gap-1 me-2">
            <Button
              variant="outline-secondary" size="sm"
              className="py-0 px-1"
              onClick={() => window.history.back()}
              title="Буцах"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline-secondary" size="sm"
              className="py-0 px-1"
              onClick={() => window.history.forward()}
              title="Урагш"
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Mobile toggle */}
          <Navbar.Toggle aria-controls="main-navbar" onClick={() => setShowSidebar(true)} />

          {/* Desktop nav */}
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/content/browse" className="d-flex align-items-center">
                <i className="bi bi-collection me-1"></i>
                <span>Контентийн сан</span>
              </Nav.Link>
              <Nav.Link as={Link} to="/clubs/browse" className="d-flex align-items-center">
                <Users size={18} className="me-1" />
                <span>Клубууд</span>
              </Nav.Link>
              <Nav.Link as={Link} to="/info" className="d-flex align-items-center">
                <Info size={18} className="me-1" />
                <span>Танилцуулга</span>
              </Nav.Link>
            </Nav>

            {user && (
              <Nav className="ms-auto">
                <div className="d-flex align-items-center gap-2">
                  <NotificationBell />

                  <Button as={Link} to="/products" variant="outline-success" size="sm"
                    className="d-flex align-items-center">
                    <ShoppingCart size={16} className="me-1" />
                    <span className="d-none d-lg-inline">Дэлгүүр</span>
                  </Button>

                  <Dropdown align="end">
                    <Dropdown.Toggle variant="outline-primary" size="sm"
                      className="d-flex align-items-center">
                      <UserIcon size={16} className="me-1" />
                      <span className="d-none d-md-inline">
                        {user.first_name || user.username}
                      </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to={`/profile/${user.username}`}>
                        <UserIcon size={16} className="me-2" />Профайл
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/bookmarks">
                        <BookMarked size={16} className="me-2" />Хадгалсан
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/messages"
                        className="d-flex align-items-center justify-content-between">
                        <span><MessageCircle size={16} className="me-2" />Хувийн мессеж</span>
                        {privateMessagesCount > 0 && (
                          <Badge bg="danger" pill>{privateMessagesCount}</Badge>
                        )}
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/ai-chat">
                        <BotMessageSquare size={16} className="me-2" />AI Багш нар
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/my-purchases">
                        <ShoppingCart size={16} className="me-2" />Миний худалдан авалт
                      </Dropdown.Item>
                      <Dropdown.Item onClick={handleOpenDraw}>
                        <PenLine size={16} className="me-2" />Зурах
                      </Dropdown.Item>
                      {user.is_staff && (
                        <>
                          <Dropdown.Divider />
                          <Dropdown.Item as={Link} to="/admin" className="text-primary fw-bold">
                            <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
                          </Dropdown.Item>
                        </>
                      )}
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={handleLogout} className="text-danger">
                        <i className="bi bi-box-arrow-right me-2"></i>Гарах
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </Nav>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Mobile Offcanvas sidebar */}
      <Offcanvas show={showSidebar} onHide={close} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="fw-bold text-primary">
            <Calculator size={24} className="me-2" />
            MathMinds
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/content/browse" onClick={close}>
              <i className="bi bi-collection me-2"></i>Контентийн сан
            </Nav.Link>

            <div className="mt-3 mb-1 px-3 text-muted small">Клубууд</div>
            {user && (
              <Nav.Link as={Link} to="/clubs/browse?view=mine" onClick={close}>
                <Users size={18} className="me-2" />Миний клуб
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/clubs/browse" onClick={close}>
              <List size={18} className="me-2" />Бүх клуб
            </Nav.Link>
            {user && (
              <Nav.Link as={Link} to="/teacher-invitations" onClick={close}>
                <i className="bi bi-envelope me-2"></i>Багшийн урилга
              </Nav.Link>
            )}

            {user && (
              <>
                <div className="mt-3 mb-1 px-3 text-muted small">Хувийн</div>
                <Nav.Link as={Link} to={`/profile/${user.username}`} onClick={close}>
                  <UserIcon size={18} className="me-2" />Профайл
                </Nav.Link>
                <Nav.Link as={Link} to="/bookmarks" onClick={close}>
                  <BookMarked size={18} className="me-2" />Хадгалсан
                </Nav.Link>
                <Nav.Link as={Link} to="/messages" onClick={close}
                  className="d-flex align-items-center justify-content-between">
                  <span><MessageCircle size={18} className="me-2" />Хувийн мессеж</span>
                  {privateMessagesCount > 0 && (
                    <Badge bg="danger" pill>{privateMessagesCount}</Badge>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} to="/ai-chat" onClick={close}>
                  <BotMessageSquare size={18} className="me-2" />AI Багш нар
                </Nav.Link>
                <Nav.Link as={Link} to="/products" onClick={close}>
                  <ShoppingCart size={18} className="me-2" />Дэлгүүр
                </Nav.Link>
                <Nav.Link as={Link} to="/my-purchases" onClick={close}>
                  <i className="bi bi-bag-check me-2"></i>Миний худалдан авалт
                </Nav.Link>
                {user.is_staff && (
                  <>
                    <div className="mt-3 mb-1 px-3 text-muted small">Admin</div>
                    <Nav.Link as={Link} to="/admin" onClick={close} className="text-primary fw-bold">
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </Nav.Link>
                  </>
                )}
              </>
            )}

            <div className="mt-3 mb-1 px-3 text-muted small">Танилцуулга</div>
            <Nav.Link as={Link} to="/info/about" onClick={close}>
              <i className="bi bi-info-circle me-2"></i>Танилцуулга
            </Nav.Link>
            <Nav.Link as={Link} to="/info/teachers" onClick={close}>
              <Users size={18} className="me-2" />Багш нар
            </Nav.Link>
            <Nav.Link as={Link} to="/info/membership-guide" onClick={close}>
              <i className="bi bi-question-circle me-2"></i>Гишүүнчлэл, клубт элсэх
            </Nav.Link>
            <Nav.Link as={Link} to="/info/nomads360" onClick={close}>
              <i className="bi bi-globe me-2"></i>Nomads 360°
            </Nav.Link>
            <Nav.Link as={Link} to="/terms" onClick={close}>
              <i className="bi bi-file-text me-2"></i>Үйлчилгээний нөхцөл
            </Nav.Link>
            <Nav.Link as={Link} to="/privacy" onClick={close}>
              <i className="bi bi-shield-check me-2"></i>Нууцлалын бодлого
            </Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
