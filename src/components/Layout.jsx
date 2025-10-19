// frontend/src/components/Layout.jsx

import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom'; // useLocation нэмсэн

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Одоогийн route-г авах

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Route-аас хамааран гарчиг тодорхойлох
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Нүүр';
        if (path === '/bookmarks') return 'Хадгалсан';
        if (path.startsWith('/article/')) return 'Өгүүлэл';
        if (path.startsWith('/profile')) return 'Профайл';
        return 'Нүүр';
    };

    return (
        <Container fluid="lg" className="bg-white shadow-sm min-vh-100 p-0">
            <Row className="g-0" style={{ height: '100vh', overflow: 'hidden' }}>

                <Col md={3} xl={2} className="border-end d-none d-md-block p-0">
                    <LeftSidebar />
                </Col>

                <Col md={9} xl={7} className="border-end" style={{ height: '100vh', overflowY: 'auto' }}>
                    <Navbar className="bg-white bg-opacity-90 border-bottom px-3 py-2 position-sticky top-0" style={{ zIndex: 100 }}>
                        <Navbar.Brand as="h1" className="h5 mb-0 fw-bold">
                            {getPageTitle()}
                        </Navbar.Brand>
                        <Navbar.Collapse className="justify-content-end">
                            {user && (
                                <div className='d-flex align-items-center gap-2'>
                                    <span className='fw-semibold text-secondary me-2'>
                                        {user.first_name || user.email}
                                    </span>
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline-danger"
                                        size="sm">
                                        Гарах
                                    </Button>
                                </div>
                            )}
                        </Navbar.Collapse>
                    </Navbar>

                    {/* Энд Feed эсвэл BookmarksPage гэх мэт хүүхэд route-ийн компонент харагдана */}
                    <Outlet />

                </Col>

                <Col xl={3} className="d-none d-xl-block p-0">
                    <div className="sidebar-container">
                        <RightSidebar />
                    </div>
                </Col>

            </Row>
        </Container>
    );
};

export default Layout;