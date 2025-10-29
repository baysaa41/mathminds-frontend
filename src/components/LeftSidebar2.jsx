// frontend/src/components/LeftSidebar.jsx (БҮРЭН ШИНЭЧИЛСЭН)

import { useAuth } from '../context/AuthContext';
import {
    Home,
    Bookmark,
    User,
    BookOpen,
    ClipboardList,
    Calculator,
    FileText
} from 'lucide-react';
import Nav from 'react-bootstrap/Nav';
import { useLocation } from 'react-router-dom';
// (!!!) 1. LinkContainer импортлох
import { LinkContainer } from 'react-router-bootstrap';

const LeftSidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Идэвхтэй цэсийг тодорхойлох
    const isActive = (path) => location.pathname === path;
    const isProfileActive = () => location.pathname.startsWith('/profile');

    return (
        <div className="p-3 d-flex flex-column sidebar-container">
            <div>
                <div className="mb-4 d-flex align-items-center">
                    <h2 className="h4 fw-bold text-primary mb-0">MathMinds.club</h2>
                </div>

                <Nav variant="pills" className="flex-column nav-pills-custom" activeKey={location.pathname}>
                    {/* (!!!) 2. Бүх холбоосыг LinkContainer-р бүрэх */}
                    <LinkContainer to="/">
                        <Nav.Link
                            active={isActive('/')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Home size={18} />
                            Нүүр хуудас
                        </Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/bookmarks">
                        <Nav.Link
                            active={isActive('/bookmarks')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Bookmark size={18} />
                            Хадгалсан
                        </Nav.Link>
                    </LinkContainer>

                    <div className="my-2 border-top"></div>
                    <div className="small text-muted mb-1 px-2 fw-semibold">АГУУЛГА</div>

                    <LinkContainer to="/articles">
                        <Nav.Link
                            active={isActive('/articles')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <FileText size={18} />
                            Өгүүллийн сан
                        </Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/problems">
                        <Nav.Link
                            active={isActive('/problems')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <BookOpen size={18} />
                            Бодлогын сан
                        </Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/quizzes">
                        <Nav.Link
                            active={isActive('/quizzes')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <ClipboardList size={18} />
                            Тестийн сан
                        </Nav.Link>
                    </LinkContainer>

                    <LinkContainer to="/formulas">
                        <Nav.Link
                            active={isActive('/formulas')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Calculator size={18} />
                            Томьёоны сан
                        </Nav.Link>
                    </LinkContainer>

                    <div className="my-2 border-top"></div>

                    {/* (!!!) 3. Профайл холбоосыг идэвхжүүлэх */}
                    {/* Энэ нь /profile рүү үсрэх бөгөөд /profile-г бид MyProfileRedirect болгоно */}
                    <LinkContainer to="/profile">
                        <Nav.Link
                            active={isProfileActive()}
                            className="d-flex align-items-center gap-2 fw-medium"
                        >
                            <User size={18} />
                            Профайл
                        </Nav.Link>
                    </LinkContainer>
                </Nav>
            </div>

            {user && (
                <div className="mt-auto pt-3 border-top">
                    <p className="fw-bold mb-0 text-dark">{user.first_name || 'User'}</p>
                    <p className="text-muted small mb-0">{user.email}</p>
                </div>
            )}
        </div>
    );
};

export default LeftSidebar;