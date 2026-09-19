// src/pages/DashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
  Download,
  Trophy,
  FileText,
  FileUp,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  BookOpen,
  ShoppingCart,
  Terminal,
  Mail,
  Bot,
  Languages,
  Sparkles,
  Cpu,
  Brain,
  GraduationCap,
  ClipboardList,
  Library,
  Search,
} from 'lucide-react';
import authService from '../services/authService';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Ачааллаж байна...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h1 className="mb-0">Admin Dashboard</h1>
            <Link to="/feed" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-house me-1"></i>
              Үндсэн хуудас
            </Link>
          </div>
          <Card className="shadow-sm">
            <Card.Body>
              <h4>Сайн байна уу, {user.name}! 👋</h4>
              <p className="text-muted mb-2">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-muted mb-0">
                <strong>MMO ID:</strong> {user.mmo_id}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* MMO Импорт */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-primary">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Download size={40} className="text-primary" />
              </div>
              <Card.Title>MMO Олимпиад Импортлох</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                MMO.mn сайтаас олимпиадын бодлогуудыг автоматаар татаж, системд нэмнэ.
              </Card.Text>
              <Link to="/admin/mmo-import" className="btn btn-primary">
                <Download size={18} className="me-2" />
                Импортлох
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Баримт бичгээс импортлох */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-purple" style={{ borderColor: '#6f42c1' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <FileUp size={40} style={{ color: '#6f42c1' }} />
              </div>
              <Card.Title>Баримтаас Бодлого Импортлох</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                PDF, зураг, Word файлаас бодлогуудыг Gemini AI ашиглан таньж импортлох.
              </Card.Text>
              <Link to="/admin/doc-import" className="btn" style={{ backgroundColor: '#6f42c1', color: '#fff' }}>
                <FileUp size={18} className="me-2" />
                Импортлох
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Олимпиад */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Trophy size={40} style={{ color: '#fd7e14' }} />
              </div>
              <Card.Title>Олимпиад Зохион Байгуулах</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Олимпиад үүсгэх, бүртгэл ба төлбөр хянах, QR бодолтын хуудас хэвлэх, сканнердсан материал upload хийх.
              </Card.Text>
              <Link to="/admin/olympiads" className="btn" style={{ backgroundColor: '#fd7e14', color: '#fff' }}>
                <Trophy size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Тайлангууд */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-success">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <FileText size={40} className="text-success" />
              </div>
              <Card.Title>Тайлангууд</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Системийн тайлан, статистик болон reported content-үүдийг харах.
              </Card.Text>
              <Link to="/reports" className="btn btn-success">
                <FileText size={18} className="me-2" />
                Тайлан үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Хичээлийн хөтөлбөр */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0d6efd' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <BookOpen size={40} className="text-primary" />
              </div>
              <Card.Title>Хичээлийн хөтөлбөр</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Хөтөлбөр, хичээлийн жил, долоо хоногийн сэдэв болон суралцахуйн зорилтуудыг удирдах.
              </Card.Text>
              <Link to="/admin/curriculum" className="btn btn-primary">
                <BookOpen size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Curriculum тест үүсгэх */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#8b5cf6' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Sparkles size={40} style={{ color: '#8b5cf6' }} />
              </div>
              <Card.Title>AI-р Тест Үүсгэх</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Curriculum хөтөлбөрийн дагуу долоо хоног, хүндрэлийн түвшин сонгон сонгох болон нөхөх бодлоготой тест үүсгэнэ.
              </Card.Text>
              <Link to="/quiz/generate-curriculum" className="btn" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                <Sparkles size={18} className="me-2" />
                Тест үүсгэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Хэрэглэгчид */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-info">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Users size={40} className="text-info" />
              </div>
              <Card.Title>Хэрэглэгчид</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Бүртгэлтэй хэрэглэгчдийн жагсаалт, гишүүнчлэл болон үүргийн мэдээлэл.
              </Card.Text>
              <Link to="/admin/all-users" className="btn btn-info text-white">
                <Users size={18} className="me-2" />
                Жагсаалт үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Багш нар */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0dcaf0' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Users size={40} style={{ color: '#0dcaf0' }} />
              </div>
              <Card.Title>Шилдэг Багш Нар</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Багш нарын жагсаалт, шинэ багш нэмэх болон засварлах.
              </Card.Text>
              <Link to="/teachers" className="btn btn-outline-info">
                <Users size={18} className="me-2" />
                Жагсаалт үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Борлуулалтын статистик */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-warning">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <ShoppingCart size={40} className="text-warning" />
              </div>
              <Card.Title>Борлуулалтын Статистик</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Бүтээгдэхүүний зарагдсан тоо, QPay гүйлгээний статистик харах.
              </Card.Text>
              <Link to="/admin/sales-stats" className="btn btn-warning">
                <ShoppingCart size={18} className="me-2" />
                Статистик үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Django Commands */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#20c997' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Terminal size={40} style={{ color: '#20c997' }} />
              </div>
              <Card.Title>Django Commands</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                23 management command-ын заавар: бодлого импорт, AI боловсруулалт, гишүүнчлэл, төлбөр.
              </Card.Text>
              <Link to="/admin/commands" className="btn" style={{ backgroundColor: '#20c997', color: '#fff' }}>
                <Terminal size={18} className="me-2" />
                Заавар үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* AI Ярилцлагууд */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0ea5e9' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Bot size={40} style={{ color: '#0ea5e9' }} />
              </div>
              <Card.Title>AI Багштай Ярилцлагууд</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Хэрэглэгчид AI багштай хийсэн ярилцлагуудын жагсаалт, хайлт.
              </Card.Text>
              <Link to="/admin/ai-conversations" className="btn" style={{ backgroundColor: '#0ea5e9', color: '#fff' }}>
                <Bot size={18} className="me-2" />
                Харах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* AI Загварууд */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#8b5cf6' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Cpu size={40} style={{ color: '#8b5cf6' }} />
              </div>
              <Card.Title>AI Загварууд</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                DeepSeek, Gemini, Claude, ChatGPT — систем ямар AI загвар хаана ашигладгийн тайлбар.
              </Card.Text>
              <Link to="/admin/ai-models" className="btn" style={{ backgroundColor: '#8b5cf6', color: '#fff' }}>
                <Cpu size={18} className="me-2" />
                Харах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* AI Сургалтын Систем */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#6366f1' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Brain size={40} style={{ color: '#6366f1' }} />
              </div>
              <Card.Title>AI Сургалтын Систем</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Mastery, SM-2 давталт, StudyPlan, AI шалгах, AI хайлт — адаптив сургалтын 5 модуль хэрхэн ажилладгийн тайлбар.
              </Card.Text>
              <Link to="/admin/ai-learning-system" className="btn" style={{ backgroundColor: '#6366f1', color: '#fff' }}>
                <Brain size={18} className="me-2" />
                Харах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* AI Багш нар */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0ea5e9' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <GraduationCap size={40} style={{ color: '#0ea5e9' }} />
              </div>
              <Card.Title>AI Багш нар</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Хичээл, түвшин тус бүрийн AI багшийн профайл, системийн промпт засах.
              </Card.Text>
              <Link
                to="/admin/ai-teachers"
                className="btn"
                style={{ backgroundColor: '#0ea5e9', color: '#fff' }}
              >
                <GraduationCap size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Нэр томьёо */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#fd7e14' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Languages size={40} style={{ color: '#fd7e14' }} />
              </div>
              <Card.Title>Нэр томьёо</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                AI багш ашиглах зөв/буруу нэр томьёоны жагсаалт. Шинэ нэр томьёо нэмэх, засварлах.
              </Card.Text>
              <Link
                to="/admin/math-terms"
                className="btn"
                style={{ backgroundColor: '#fd7e14', color: '#fff' }}
              >
                <Languages size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* ЭЕШ дүн */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0d6efd' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <span style={{ fontSize: 40, lineHeight: 1 }}>🏆</span>
              </div>
              <Card.Title>ЭЕШ 2026 дүн</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                list.eec.mn-аас татсан элсэлтийн ерөнхий шалгалтын дүн мэдээ.
              </Card.Text>
              <div className="d-flex gap-2">
                <Link to="/admin/eec-results" className="btn btn-primary btn-sm">
                  Жагсаалт
                </Link>
                <Link to="/admin/eec-stats" className="btn btn-outline-primary btn-sm">
                  Статистик
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* ЭЕШ жишиг бодлого */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#e8a700' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <ClipboardList size={40} style={{ color: '#e8a700' }} />
              </div>
              <Card.Title>ЭЕШ жишиг бодлого</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                "ЭЕШ жишиг" keyword-той бодлогуудыг жагсаалтаар харах, шүүх, олноор нь засах.
              </Card.Text>
              <Link
                to="/admin/eesh-jishig"
                className="btn"
                style={{ backgroundColor: '#e8a700', color: '#000' }}
              >
                <ClipboardList size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* ЭЕШ бэлтгэлийн ном */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#20c997' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Library size={40} style={{ color: '#20c997' }} />
              </div>
              <Card.Title>ЭЕШ бэлтгэлийн ном</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                5 номын жишээ, дасгал бодлогуудыг ном тус бүрээр харах, засах.
              </Card.Text>
              <Link
                to="/admin/eesh-books"
                className="btn"
                style={{ backgroundColor: '#20c997', color: '#000' }}
              >
                <Library size={18} className="me-2" />
                Удирдах
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* ЭЕШ жишээ бодлого — эх сурвалжаар шүүх (Django-д server-rendered хуудас, SPA route биш тул энгийн <a href>) */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#0dcaf0' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Search size={40} style={{ color: '#0dcaf0' }} />
              </div>
              <Card.Title>Жишээ бодлого — эх сурвалж</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                ЭЕШ жишээ бодлогуудыг эх PDF файл, дугаар, ном, сэдвээр шүүж харах.
              </Card.Text>
              <a
                href="https://api.mathminds.club/books/eesh-source-browser/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ backgroundColor: '#0dcaf0', color: '#000' }}
              >
                <Search size={18} className="me-2" />
                Харах
              </a>
            </Card.Body>
          </Card>
        </Col>

        {/* Email Campaigns */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm" style={{ borderColor: '#6610f2' }}>
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Mail size={40} style={{ color: '#6610f2' }} />
              </div>
              <Card.Title>Email Campaigns</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Бүртгэлтэй хэрэглэгчид, гишүүд, клубын гишүүд рүү имэйл илгээх.
              </Card.Text>
              <Link to="/admin/emails" className="btn" style={{ backgroundColor: '#6610f2', color: '#fff' }}>
                <Mail size={18} className="me-2" />
                Имэйл илгээх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Тохиргоо */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-secondary">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Settings size={40} className="text-secondary" />
              </div>
              <Card.Title>Систем Тохиргоо</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Системийн тохиргоо, хэрэглэгчдийн эрх зэрэг удирдах.
              </Card.Text>
              <Button variant="secondary" disabled>
                <Settings size={18} className="me-2" />
                Удахгүй
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm border-danger">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-1">Системээс гарах</h5>
                <p className="text-muted mb-0 small">Таны сесс дуусгах</p>
              </div>
              <Button variant="danger" onClick={handleLogout}>
                <LogOut size={18} className="me-2" />
                Гарах
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default DashboardPage;
