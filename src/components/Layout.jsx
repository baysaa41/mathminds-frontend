// frontend/src/components/Layout.jsx (Сайжруулсан)

import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
// import Feed from './Feed'; // <-- Feed-г эндээс импорт хийх шаардлагагүй болно
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom'; // <-- Outlet-г импорт хийнэ

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Container fluid="lg" className="bg-white shadow-sm min-vh-100 p-0">
            <Row className="g-0">

                <Col md={3} xl={2} className="border-end d-none d-md-block">
                    <LeftSidebar />
                </Col>

                <Col md={9} xl={7} className="border-end min-vh-100">
                    <Navbar sticky="top" className="bg-white bg-opacity-90 border-bottom px-3 py-2">
                        {/* ... Navbar-ийн бусад код хэвээрээ ... */}
                        <Navbar.Brand as="h1" className="h5 mb-0 fw-bold">Нүүр</Navbar.Brand>
                        <Navbar.Collapse className="justify-content-end">
                            {user && (
                                <div className='d-flex align-items-center gap-2'>
                                    <span className='fw-semibold text-secondary me-2'>{user.first_name || user.email}</span>
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

                    {/* --- ЭНЭ ХЭСГИЙГ ӨӨРЧИЛСӨН --- */}
                    {/* Энд Feed эсвэл ArticleDetailPage гэх мэт хүүхэд route-ийн компонент харагдана */}
                    <Outlet />
                    {/* --- ӨӨРЧЛӨЛТ ДУУССАН --- */}

                </Col>

                <Col xl={3} className="d-none d-xl-block">
                    <RightSidebar />
                </Col>

            </Row>
        </Container>
    );
};

export default Layout;