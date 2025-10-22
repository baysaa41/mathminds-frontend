// frontend/src/components/Layout.jsx

// (!!!) useState болон useEffect-г import хийнэ
import { useState, useEffect } from 'react';
// (!!!) Импортын замыг засварласан
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

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

    // (!!!) Гарчгийг state болгож, өөрчлөх функц (setPageTitle) үүсгэнэ
    const [pageTitle, setPageTitle] = useState('Нүүр');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // (!!!) Route өөрчлөгдөх бүрт статик гарчгуудыг шинэчилнэ
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') {
            setPageTitle('Нүүр');
        } else if (path === '/bookmarks') {
            setPageTitle('Хадгалсан');
        } else if (path.startsWith('/profile')) {
            setPageTitle('Профайл');
        }
        // '/article/' энд байхгүйг анхаарна уу.
        // Учир нь ArticleDetailPage өөрөө гарчгаа тохируулна.
    }, [location.pathname]); // URL өөрчлөгдөх бүрт ажиллана

    return (
        <Container fluid="lg" className="bg-white shadow-sm min-vh-100 p-0">
            <Row className="g-0" style={{ height: '100vh', overflow: 'hidden' }}>

                <Col md={3} xl={2} className="border-end d-none d-md-block p-0">
                    <LeftSidebar />
                </Col>

                <Col md={9} xl={7} className="border-end" style={{ height: '100vh', overflowY: 'auto' }}>
                    <Navbar className="bg-white bg-opacity-90 border-bottom px-3 py-2 position-sticky top-0" style={{ zIndex: 100 }}>
                        <Navbar.Brand as="h1" className="h5 mb-0 fw-bold">
                            {/* (!!!) Гарчгийг state-ээс уншина */}
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

                    {/* (!!!) setPageTitle функцийг хүүхэд компонент (Outlet) руу дамжуулна */}
                    <Outlet context={{ setPageTitle }} />

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

