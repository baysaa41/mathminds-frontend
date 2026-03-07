// frontend/src/components/Layout.jsx

import { useState, useEffect, useRef } from 'react';
import RightSidebar from '../components/RightSidebar';
import DrawingOverlay from '../components/DrawingOverlay';
import JoinClubModal from '../components/JoinClubModal';
import ScrollRestoration from '../components/ScrollRestoration';
import AppHeader from './AppHeader';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

import { MathJaxContext } from 'better-react-mathjax';
import { mathJaxConfig } from '../mathjax.config.js';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const Layout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainScrollRef = useRef(null);

  const [clubData, setClubData] = useState(null);
  const [, setClubActions] = useState(null);
  const [, setIsTeacherOrAdmin] = useState(false);
  const [, setIsCreator] = useState(false);
  const [newTeacherUsername, setNewTeacherUsername] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const setPageTitle = (title) => {
    const ignoreTitles = ['Нүүр', 'Алдаа'];
    if (title && !ignoreTitles.includes(title)) {
      window.dispatchEvent(new CustomEvent('pagetitleupdate', {
        detail: { path: location.pathname, title }
      }));
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pathnamechange', {
      detail: { path: location.pathname }
    }));
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

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <div className="min-vh-100 d-flex flex-column">
        <AppHeader />

        {/* Main Content Area */}
        <Container className="flex-grow-1">
          <Row className="g-0 h-100">
            {(() => {
              const fullWidth =
                location.pathname === '/messages' ||
                location.pathname === '/ai-chat' ||
                location.pathname === '/solver' ||
                location.pathname.startsWith('/quiz/');
              return (
                <Col lg={fullWidth ? 12 : 9} xl={fullWidth ? 12 : 8}
                  className={fullWidth ? '' : 'border-end'}>
                  <div
                    ref={mainScrollRef}
                    style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }}
                    className={location.pathname === '/solver' ? 'p-0' : 'p-3'}
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
              );
            })()}

            {location.pathname !== '/messages' &&
              location.pathname !== '/ai-chat' &&
              location.pathname !== '/solver' &&
              !location.pathname.startsWith('/quiz/') && (
              <Col lg={3} xl={4} className="bg-light">
                <div style={{ height: 'calc(100vh - 60px)', overflowY: 'auto' }} className="p-3">
                  <RightSidebar clubData={clubData} />
                </div>
              </Col>
            )}
          </Row>
        </Container>

        <JoinClubModal
          show={showJoinModal}
          onHide={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />

        <DrawingOverlay />
      </div>
    </MathJaxContext>
  );
};

export default Layout;
