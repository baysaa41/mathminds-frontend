// frontend/src/components/Layout.jsx

import { useState, useEffect, useRef } from 'react';
import RightSidebar from '../components/RightSidebar';
import JoinClubModal from '../components/JoinClubModal';
import ScrollRestoration from '../components/ScrollRestoration';
import AppHeader from './AppHeader';
import MaintenanceBanner from './MaintenanceBanner';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { ChevronRight, PanelRight } from 'lucide-react';

const SIDEBAR_HIDDEN_KEY = 'rightSidebarHidden_v2'; // v2: default нь collapsed болсон тул хуучин утгыг үл тооцно
const LG_BREAKPOINT = 992; // Bootstrap 'lg' — доор нь баганууд аль хэдийн stack хийгддэг тул hide/show toggle шаардлагагүй

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainScrollRef = useRef(null);

  const [sidebarHidden, setSidebarHidden] = useState(
    () => localStorage.getItem(SIDEBAR_HIDDEN_KEY) !== '0'
  );
  const toggleSidebar = (hidden) => {
    setSidebarHidden(hidden);
    localStorage.setItem(SIDEBAR_HIDDEN_KEY, hidden ? '1' : '0');
  };

  // mobile/tablet дээр sidebar аль хэдийн feed-ийн доор stack хийгддэг тул
  // desktop-д хийсэн 'нуух' сонголт мобайл дээр sidebar-ыг харагдахгүй болгож,
  // буцаах товч ч байхгүй болох (dead-end) эрсдэлээс сэргийлнэ.
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= LG_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= LG_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // mobile/tablet дээр sidebar-ыг feed-ийн доор stack хийхийн оронд Offcanvas
  // drawer-аар нээдэг болгосон — эх feed-ийг бүхэлд нь гүйлгэх шаардлагагүй.
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [location.pathname]);

  const [clubData, setClubData] = useState(null);
  const [problemNavData, setProblemNavData] = useState(null);
  const [, setClubActions] = useState(null);
  const [, setIsTeacherOrAdmin] = useState(false);
  const [, setIsCreator] = useState(false);
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const setPageTitle = (title) => {
    const ignoreTitles = ['Нүүр', 'Алдаа'];
    if (title && !ignoreTitles.includes(title)) {
      window.dispatchEvent(
        new CustomEvent('pagetitleupdate', {
          detail: { path: location.pathname, title },
        })
      );
    }
  };

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('pathnamechange', {
        detail: { path: location.pathname },
      })
    );
  }, [location.pathname]);

  useEffect(() => {
    const path = location.pathname;
    if (!path.match(/^\/clubs\/\d+/)) {
      setClubData(null);
      setClubActions(null);
      setIsTeacherOrAdmin(false);
      setIsCreator(false);
      setNewTeacherUsername('');
      setAddingTeacher(false);
    }
  }, [location.pathname]);

  const handleJoinSuccess = (joinedClub) => {
    setShowJoinModal(false);
    if (joinedClub?.id) navigate(`/clubs/${joinedClub.id}`);
  };

  const forcedFullWidth =
    location.pathname === '/messages' ||
    location.pathname === '/solver' ||
    location.pathname.startsWith('/quiz/') ||
    location.pathname.startsWith('/admin/emails') ||
    /^\/clubs\/\d+\/assignments\/\d+\/leaderboard/.test(location.pathname) ||
    /^\/clubs\/\d+\/group-report/.test(location.pathname) ||
    /^\/clubs\/\d+\/report\//.test(location.pathname);
  // Feed нь x.com шиг баганын ирмэг хүртэл (edge-to-edge) мөрүүдээс тогтоно —
  // Layout-ийн p-3 padding-ийг эндүүрэхгүй. Padding-ийг постын мөр өөрөө
  // дотроо (12px 16px) авдаг. Right sidebar хэвээрээ харагдана.
  const isFeedRoute = location.pathname === '/feed' || location.pathname === '/';
  const sidebarCollapsed = sidebarHidden && !forcedFullWidth && isDesktop;
  // sidebar нуугдсан үед гол багана 12 багана эзэлнэ, гэхдээ энэ бол зөвхөн
  // тусгай (messages/solver/quiz гэх мэт) хуудсуудад зориулсан edge-to-edge
  // fluid горим биш — Container/inner div-ийн fluid байдал зөвхөн
  // forcedFullWidth-ээс хамаарна.
  const noSidebarColumn = forcedFullWidth || sidebarCollapsed;

  return (
    <div className="min-vh-100 d-flex flex-column">
      <MaintenanceBanner />
      <AppHeader />

      {/* Main Content Area */}
      <Container className="flex-grow-1">
        <Row className="g-0 h-100">
          <Col
            lg={noSidebarColumn ? 12 : 9}
            xl={noSidebarColumn ? 12 : 8}
            className={noSidebarColumn ? '' : 'border-end'}
          >
            <div
              ref={mainScrollRef}
              style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}
              className={
                location.pathname === '/solver' || isFeedRoute
                  ? 'p-0'
                  : forcedFullWidth
                    ? 'container-fluid'
                    : 'p-3'
              }
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
                  setProblemNavData,
                }}
              />
            </div>
          </Col>

          {isDesktop && !forcedFullWidth && !sidebarCollapsed && (
            <Col lg={3} xl={4} className="bg-light">
              <div style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }} className="p-3">
                <RightSidebar
                  clubData={clubData}
                  problemNavData={problemNavData}
                  onHide={() => toggleSidebar(true)}
                />
              </div>
            </Col>
          )}
        </Row>
      </Container>

      {isDesktop && !forcedFullWidth && sidebarCollapsed && (
        <button
          type="button"
          onClick={() => toggleSidebar(false)}
          className="btn btn-light border position-fixed d-flex align-items-center"
          title="Хажуу самбарыг харуулах"
          style={{
            right: 0,
            top: '70px',
            width: 'auto',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            zIndex: 10,
          }}
        >
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
        </button>
      )}

      {!isDesktop && !forcedFullWidth && (
        <button
          type="button"
          onClick={() => setShowMobileSidebar(true)}
          className="btn btn-light border position-fixed d-flex align-items-center"
          title="Хажуу цэс нээх"
          style={{
            right: 0,
            top: '70px',
            width: 'auto',
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            zIndex: 10,
          }}
        >
          <PanelRight size={16} />
        </button>
      )}

      <Offcanvas
        show={showMobileSidebar}
        onHide={() => setShowMobileSidebar(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Хажуу цэс</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <RightSidebar clubData={clubData} problemNavData={problemNavData} />
        </Offcanvas.Body>
      </Offcanvas>

      <JoinClubModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
};

export default Layout;
