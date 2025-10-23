// frontend/src/components/Layout.jsx (БҮРЭН, ЗАСАГДСАН)

import { useState, useEffect } from 'react';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

// (!!!) 1. MathJaxContext-г импортлох
import { MathJaxContext } from 'better-react-mathjax';
// (!!!) 2. Тохиргоог импортлох (Хэрэв өөр байршилд хадгалсан бол замыг нь зөв тааруулна уу)
import { mathJaxConfig } from '../mathjax.config.js';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [pageTitle, setPageTitle] = useState('Нүүр');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const path = location.pathname;
        if (path === '/') {
            setPageTitle('Нүүр');
        } else if (path === '/bookmarks') {
            setPageTitle('Хадгалсан');
        } else if (path.startsWith('/profile')) {
            setPageTitle('Профайл');
        }
    }, [location.pathname]);

    return (
        // (!!!) 3. Бүх хуудсыг MathJaxContext-р бүрэх
        <MathJaxContext config={mathJaxConfig}>
            <Container fluid="lg" className="bg-white shadow-sm min-vh-100 p-0">
                <Row className="g-0" style={{ height: '100vh', overflow: 'hidden' }}>

                    <Col md={3} xl={2} className="border-end d-none d-md-block p-0">
                        <LeftSidebar />
                    </Col>

                    <Col md={9} xl={7} className="border-end" style={{ height: '100vh', overflowY: 'auto' }}>
                        <Navbar className="bg-white bg-opacity-90 border-bottom px-3 py-2 position-sticky top-0" style={{ zIndex: 100 }}>
                            <Navbar.Brand as="h1" className="h5 mb-0 fw-bold">
                                {pageTitle}
                            </Navbar.Brand>
                            <Navbar.Collapse className="justify-content-end">
                                {user && (
                                    <div className='d-flex align-items-center gap-2'>
                                        <span className='fw-semibold text-secondary me-2'>
                                            {user.first_name || user.email || user.username}
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

                        {/* (!!!) 4. Outlet одоо тохиргоог автоматаар өвлөнө */}
                        <Outlet context={{ setPageTitle }} />

                    </Col>

                    <Col xl={3} className="d-none d-xl-block p-0">
                        <div className="sidebar-container">
                            <RightSidebar />
                        </div>
                    </Col>

                </Row>
            </Container>
        </MathJaxContext>
    );
};

export default Layout;