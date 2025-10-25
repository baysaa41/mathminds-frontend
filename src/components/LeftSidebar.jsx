// frontend/src/components/LeftSidebar.jsx
// (!!! ШИНЭЧИЛСЭН: "Өгүүллийн сан" нэмсэн)

import { useAuth } from '../context/AuthContext';
import {
    Home,
    Bookmark,
    User,
    BookOpen,      // Бодлогын сан
    ClipboardList, // Тестийн сан
    Calculator,    // Томьёоны сан
    FileText       // (!!!) Өгүүллийн сан
} from 'lucide-react';
import Nav from 'react-bootstrap/Nav';
import { useLocation } from 'react-router-dom';

const LeftSidebar = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Идэвхтэй цэсийг тодорхойлох
    const isActive = (path) => location.pathname === path;

    return (
        <div className="p-3 d-flex flex-column sidebar-container">
            <div>
                {/* Лого */}
                <div className="mb-4 d-flex align-items-center">
                    <h2 className="h4 fw-bold text-primary mb-0">MathMinds.club</h2>
                </div>

                {/* Nav компонентыг ашиглан цэс үүсгэнэ */}
                <Nav variant="pills" className="flex-column nav-pills-custom" activeKey={location.pathname}>
                    {/* Үндсэн цэс */}
                    <Nav.Item>
                        <Nav.Link
                            href="/"
                            active={isActive('/')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Home size={18} />
                            Нүүр хуудас
                        </Nav.Link>
                    </Nav.Item>

                    <Nav.Item>
                        <Nav.Link
                            href="/bookmarks"
                            active={isActive('/bookmarks')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Bookmark size={18} />
                            Хадгалсан
                        </Nav.Link>
                    </Nav.Item>

                    {/* Хэсэг тусгаарлагч */}
                    <div className="my-2 border-top"></div>

                    {/* Агуулгын сангууд */}
                    <div className="small text-muted mb-1 px-2 fw-semibold">АГУУЛГА</div>

                    {/* (!!!) ШИНЭ ЦЭС: Өгүүллийн сан */}
                    <Nav.Item>
                        <Nav.Link
                            href="/articles"
                            active={isActive('/articles')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <FileText size={18} />
                            Өгүүллийн сан
                        </Nav.Link>
                    </Nav.Item>

                    <Nav.Item>
                        <Nav.Link
                            href="/problems"
                            active={isActive('/problems')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <BookOpen size={18} />
                            Бодлогын сан
                        </Nav.Link>
                    </Nav.Item>

                    <Nav.Item>
                        <Nav.Link
                            href="/quizzes"
                            active={isActive('/quizzes')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <ClipboardList size={18} />
                            Тестийн сан
                        </Nav.Link>
                    </Nav.Item>

                    <Nav.Item>
                        <Nav.Link
                            href="/formulas"
                            active={isActive('/formulas')}
                            className="d-flex align-items-center gap-2 mb-1 fw-medium"
                        >
                            <Calculator size={18} />
                            Томьёоны сан
                        </Nav.Link>
                    </Nav.Item>

                    {/* Хэсэг тусгаарлагч */}
                    <div className="my-2 border-top"></div>

                    {/* Хэрэглэгч */}
                    <Nav.Item>
                        <Nav.Link
                            href="/profile"
                            disabled
                            className="d-flex align-items-center gap-2 fw-medium"
                        >
                            <User size={18} />
                            Профайл
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>

            {/* Хэрэглэгчийн мэдээлэл доод хэсэгт */}
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