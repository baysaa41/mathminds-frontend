// frontend/src/components/LeftSidebar.jsx

import { useAuth } from '../context/AuthContext';
import { Home, Bookmark, User } from 'lucide-react'; // Icon-уудыг хэвээр үлдээнэ
import Nav from 'react-bootstrap/Nav'; // Bootstrap Nav компонентыг импорт хийнэ
import Image from 'react-bootstrap/Image'; // Зураг харуулахад (жишээ лого)

const LeftSidebar = () => {
    const { user } = useAuth();

    // Идэвхтэй цэсийг тодорхойлох (дараа нь react-router-dom-ийн NavLink ашиглан сайжруулж болно)
    const isActive = (path) => window.location.pathname === path;

    return (
        // Bootstrap классуудыг ашиглан зай авалт, хүрээ, байрлалыг тохируулна
        <div className="p-3 border-end d-flex flex-column h-100"> {/* h-100 нь өндрийг дүүргэнэ */}
            <div> {/* Дээд хэсэг */}
                <div className="mb-4 d-flex align-items-center">
                    {/* <Image src="/logo.png" roundedCircle width={40} height={40} className="me-2" /> */} {/* Хэрэв лого байгаа бол */}
                    <h2 className="h4 fw-bold text-primary mb-0">Mathminds</h2>
                </div>

                {/* Nav компонентыг ашиглан цэс үүсгэнэ */}
                <Nav variant="pills" className="flex-column nav-pills-custom" activeKey={window.location.pathname}>
                    <Nav.Item>
                        {/* Nav.Link нь идэвхтэй үедээ автоматаар тодорно */}
                        <Nav.Link href="/" active={isActive('/')} className="d-flex align-items-center gap-2 mb-1 fw-medium">
                            <Home size={18} />
                            Нүүр хуудас
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="/bookmarks" disabled /* eventKey="/bookmarks" */ active={isActive('/bookmarks')} className="d-flex align-items-center gap-2 mb-1 fw-medium">
                            <Bookmark size={18} />
                            Хадгалсан
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link href="/profile" disabled /* eventKey="/profile" */ active={isActive('/profile')} className="d-flex align-items-center gap-2 fw-medium">
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

// --- Нэмэлт загварчлал (Заавал биш) ---
// Хэрэв та цэсний active болон hover өнгийг өөрчлөхийг хүсвэл
// frontend/src/index.css файлд дараах кодыг нэмж болно:

/*
.nav-pills-custom .nav-link {
  color: #495057; // Энгийн үеийн өнгө
  font-weight: 500;
}
.nav-pills-custom .nav-link:hover {
  background-color: #e9ecef; // Hover үеийн фон
}
.nav-pills-custom .nav-link.active {
  background-color: #e7f1ff !important; // Active үеийн фон (Bootstrap-г дарахын тулд !important)
  color: #0d6efd !important; // Active үеийн текст өнгө
  font-weight: 600;
}
.nav-pills-custom .nav-link.disabled {
   color: #adb5bd; // Идэвхгүй линкний өнгө
   pointer-events: none;
   cursor: default;
   background-color: transparent;
}
*/