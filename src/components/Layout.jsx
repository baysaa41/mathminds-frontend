// frontend/src/components/Layout.jsx - Modern Top Navigation Design

import { useState, useEffect, useRef } from 'react';
import RightSidebar from '../components/RightSidebar';
import DrawingOverlay from '../components/DrawingOverlay';
import NotificationBell from '../components/NotificationBell';
import JoinClubModal from '../components/JoinClubModal';
import ScrollRestoration from '../components/ScrollRestoration';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { getPrivateMessagesCount } from '../services/notificationService';

import { MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig } from '../mathjax.config.js';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import Badge from 'react-bootstrap/Badge';

// Icons
import {
  Home,
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
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll хийдэг элементийн ref-г үүсгэх
  const mainScrollRef = useRef(null);

  const [clubData, setClubData] = useState(null);
  const [, setClubActions] = useState(null);
  const [, setIsTeacherOrAdmin] = useState(false);
  const [, setIsCreator] = useState(false);
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [privateMessagesCount, setPrivateMessagesCount] = useState(0);

  // Хувийн мессежийн тоог авах
  const fetchPrivateMessagesCount = async () => {
    if (!user) return;
    try {
      const count = await getPrivateMessagesCount();
      setPrivateMessagesCount(count);
    } catch (error) {
      console.error('Failed to fetch private messages count:', error);
    }
  };

  // Хувийн мессежийн тоог 30 секунд тутамд шинэчлэх
  useEffect(() => {
    if (user) {
      fetchPrivateMessagesCount();
      const interval = setInterval(fetchPrivateMessagesCount, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenDraw = () => {
    window.dispatchEvent(
      new CustomEvent('openDrawingOverlay', {
        detail: { pageUrl: location.pathname },
      })
    );
  };

  const handleJoinSuccess = (joinedClub) => {
    setShowJoinModal(false);
    if (joinedClub?.id) {
      navigate(`/clubs/${joinedClub.id}`);
    }
  };

  const setPageTitle = (title) => {
    // Хуудсын жинхэнэ нэрийг RecentlyVisitedWidget-д дамжуулах
    const ignoreTitles = ['Нүүр', 'Алдаа'];
    if (title && !ignoreTitles.includes(title)) {
      window.dispatchEvent(new CustomEvent('pagetitleupdate', {
        detail: { path: location.pathname, title }
      }));
    }
  };

  // Бүх навигацийг автоматаар бүртгэх (RecentlyVisitedWidget-д зориулсан)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pathnamechange', {
      detail: { path: location.pathname }
    }));
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;

    // Reset club data when not on club detail page (including nested routes)
    if (!path.match(/^\/clubs\/\d+/)) {
      setClubData(null);
      setClubActions(null);
      setIsTeacherOrAdmin(false);
      setIsCreator(false);
      setNewTeacherUsername('');
      setAddingTeacher(false);
    }

    // Close mobile sidebar on navigation
    setShowSidebar(false);
  }, [location.pathname]);

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className="min-vh-100 d-flex flex-column">
        {/* Modern Top Navigation Bar */}
        <Navbar
          bg="white"
          expand="lg"
          className="border-bottom shadow-sm py-2 sticky-top"
          style={{ zIndex: 1000 }}
        >
          <Container fluid>
            {/* Logo/Brand with Home Icon */}
            <Navbar.Brand
              as={Link}
              to="/"
              className="fw-bold text-primary d-flex align-items-center"
            >
              <Home size={20} className="me-2" />
              <span className="d-none d-sm-inline">MathMinds.Club</span>
            </Navbar.Brand>

            {/* Mobile Menu Toggle */}
            <Navbar.Toggle aria-controls="main-navbar" onClick={() => setShowSidebar(true)} />

            {/* Main Navigation */}
            <Navbar.Collapse id="main-navbar">
              <Nav className="me-auto">
                {/* Контентийн сан */}
                <Nav.Link as={Link} to="/content/browse" className="d-flex align-items-center">
                  <i className="bi bi-collection me-1"></i>
                  <span>Контентийн сан</span>
                </Nav.Link>

                {/* Clubs */}
                <Nav.Link as={Link} to="/clubs/browse" className="d-flex align-items-center">
                  <Users size={18} className="me-1" />
                  <span>Клубууд</span>
                </Nav.Link>

                {/* Танилцуулга */}
                <Nav.Link as={Link} to="/info" className="d-flex align-items-center">
                  <Info size={18} className="me-1" />
                  <span>Танилцуулга</span>
                </Nav.Link>
              </Nav>

              {/* Right side - User menu */}
              {user && (
                <Nav className="ms-auto">
                  <div className="d-flex align-items-center gap-2">
                    <NotificationBell />

                    <Button
                      as={Link}
                      to="/products"
                      variant="outline-success"
                      size="sm"
                      className="d-flex align-items-center"
                    >
                      <ShoppingCart size={16} className="me-1" />
                      <span className="d-none d-lg-inline">Дэлгүүр</span>
                    </Button>

                    <Dropdown align="end">
                      <Dropdown.Toggle
                        variant="outline-primary"
                        size="sm"
                        className="d-flex align-items-center"
                      >
                        <UserIcon size={16} className="me-1" />
                        <span className="d-none d-md-inline">
                          {user.first_name || user.username}
                        </span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item as={Link} to={`/profile/${user.username}`}>
                          <UserIcon size={16} className="me-2" />
                          Профайл
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/bookmarks">
                          <BookMarked size={16} className="me-2" />
                          Хадгалсан
                        </Dropdown.Item>
                        <Dropdown.Item
                          as={Link}
                          to="/messages"
                          className="d-flex align-items-center justify-content-between"
                        >
                          <span>
                            <MessageCircle size={16} className="me-2" />
                            Хувийн мессеж
                          </span>
                          {privateMessagesCount > 0 && (
                            <Badge bg="danger" pill>
                              {privateMessagesCount}
                            </Badge>
                          )}
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/ai-chat">
                          <BotMessageSquare size={16} className="me-2" />
                          AI Багш нар
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/my-purchases">
                          <ShoppingCart size={16} className="me-2" />
                          Миний худалдан авалт
                        </Dropdown.Item>
                        <Dropdown.Item onClick={handleOpenDraw}>
                          <PenLine size={16} className="me-2" />
                          Зурах
                        </Dropdown.Item>
                        {user.is_staff && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item as={Link} to="/admin" className="text-primary fw-bold">
                              <i className="bi bi-speedometer2 me-2"></i>
                              Admin Dashboard
                            </Dropdown.Item>
                          </>
                        )}
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout} className="text-danger">
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Гарах
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Nav>
              )}
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Mobile Sidebar Offcanvas */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title className="fw-bold text-primary">
              <Calculator size={24} className="me-2" />
              MathMinds
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column">
              <Nav.Link as={Link} to="/content/browse" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-collection me-2"></i>
                Контентийн сан
              </Nav.Link>

              <div className="mt-3 mb-1 px-3 text-muted small">Клубууд</div>
              {user && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/clubs/browse?view=mine"
                    onClick={() => setShowSidebar(false)}
                  >
                    <Users size={18} className="me-2" />
                    Миний клуб
                  </Nav.Link>
                </>
              )}
              <Nav.Link as={Link} to="/clubs/browse" onClick={() => setShowSidebar(false)}>
                <List size={18} className="me-2" />
                Бүх клуб
              </Nav.Link>
              {user && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/teacher-invitations"
                    onClick={() => setShowSidebar(false)}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Багшийн урилга
                  </Nav.Link>

                  <div className="mt-3 mb-1 px-3 text-muted small">Хувийн</div>
                  <Nav.Link
                    as={Link}
                    to={`/profile/${user.username}`}
                    onClick={() => setShowSidebar(false)}
                  >
                    <UserIcon size={18} className="me-2" />
                    Профайл
                  </Nav.Link>
                  <Nav.Link as={Link} to="/bookmarks" onClick={() => setShowSidebar(false)}>
                    <BookMarked size={18} className="me-2" />
                    Хадгалсан
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/messages"
                    onClick={() => setShowSidebar(false)}
                    className="d-flex align-items-center justify-content-between"
                  >
                    <span>
                      <MessageCircle size={18} className="me-2" />
                      Хувийн мессеж
                    </span>
                    {privateMessagesCount > 0 && (
                      <Badge bg="danger" pill>
                        {privateMessagesCount}
                      </Badge>
                    )}
                  </Nav.Link>
                  <Nav.Link as={Link} to="/ai-chat" onClick={() => setShowSidebar(false)}>
                    <BotMessageSquare size={18} className="me-2" />
                    AI Багш нар
                  </Nav.Link>
                  <Nav.Link as={Link} to="/products" onClick={() => setShowSidebar(false)}>
                    <ShoppingCart size={18} className="me-2" />
                    Дэлгүүр
                  </Nav.Link>
                  <Nav.Link as={Link} to="/my-purchases" onClick={() => setShowSidebar(false)}>
                    <i className="bi bi-bag-check me-2"></i>
                    Миний худалдан авалт
                  </Nav.Link>

                  {user.is_staff && (
                    <>
                      <div className="mt-3 mb-1 px-3 text-muted small">Admin</div>
                      <Nav.Link
                        as={Link}
                        to="/admin"
                        onClick={() => setShowSidebar(false)}
                        className="text-primary fw-bold"
                      >
                        <i className="bi bi-speedometer2 me-2"></i>
                        Dashboard
                      </Nav.Link>
                    </>
                  )}
                </>
              )}

              <div className="mt-3 mb-1 px-3 text-muted small">Танилцуулга</div>
              <Nav.Link as={Link} to="/info/about" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-info-circle me-2"></i>
                Танилцуулга
              </Nav.Link>
              <Nav.Link as={Link} to="/info/teachers" onClick={() => setShowSidebar(false)}>
                <Users size={18} className="me-2" />
                Багш нар
              </Nav.Link>
              <Nav.Link as={Link} to="/info/membership-guide" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-question-circle me-2"></i>
                Гишүүнчлэл, клубт элсэх
              </Nav.Link>
              <Nav.Link as={Link} to="/info/nomads360" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-globe me-2"></i>
                Nomads 360°
              </Nav.Link>
              <Nav.Link as={Link} to="/terms" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-file-text me-2"></i>
                Үйлчилгээний нөхцөл
              </Nav.Link>
              <Nav.Link as={Link} to="/privacy" onClick={() => setShowSidebar(false)}>
                <i className="bi bi-shield-check me-2"></i>
                Нууцлалын бодлого
              </Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content Area */}
        <Container className="flex-grow-1">
          <Row className="g-0 h-100">
            {/* Main Content */}
            <Col
              lg={location.pathname === '/messages' || location.pathname === '/ai-chat' || location.pathname.startsWith('/quiz/') ? 12 : 9}
              xl={location.pathname === '/messages' || location.pathname === '/ai-chat' || location.pathname.startsWith('/quiz/') ? 12 : 8}
              className={location.pathname === '/messages' || location.pathname === '/ai-chat' || location.pathname.startsWith('/quiz/') ? '' : 'border-end'}
            >
              <div
                ref={mainScrollRef}
                style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}
                className="p-3"
              >
                <ScrollRestoration scrollRef={mainScrollRef} />
                <Outlet
                  context={{
                    setPageTitle,
                    setClubData,
                    setClubActions,
                    setIsTeacherOrAdmin,
                    setIsCreator,
                    newTeacherUsername,
                    setNewTeacherUsername,
                    addingTeacher,
                    setAddingTeacher,
                    mainScrollRef,
                  }}
                />
              </div>
            </Col>

            {/* Right Sidebar - Hide on messages, ai-chat and all quiz pages */}
            {location.pathname !== '/messages' && location.pathname !== '/ai-chat' && !location.pathname.startsWith('/quiz/') && (
              <Col lg={3} xl={4} className="bg-light">
                <div style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }} className="p-3">
                  <RightSidebar clubData={clubData} />
                </div>
              </Col>
            )}
          </Row>
        </Container>

        {/* Join Club Modal */}
        <JoinClubModal
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />

        {/* Global Drawing Overlay */}
        <DrawingOverlay />
      </div>
    </MathJaxContext>
  );
};

export default Layout;
