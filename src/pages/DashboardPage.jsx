// src/pages/DashboardPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import {
  Download,
  FileText,
  FileUp,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  BookOpen,
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
            <Link to="/" className="btn btn-outline-secondary btn-sm">
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

        {/* Багш нар */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-info">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <Users size={40} className="text-info" />
              </div>
              <Card.Title>Шилдэг Багш Нар</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Багш нарын жагсаалт, шинэ багш нэмэх болон засварлах.
              </Card.Text>
              <Link to="/teachers" className="btn btn-info">
                <Users size={18} className="me-2" />
                Жагсаалт үзэх
              </Link>
            </Card.Body>
          </Card>
        </Col>

        {/* Платформын статистик */}
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm border-warning">
            <Card.Body className="d-flex flex-column">
              <div className="mb-3">
                <TrendingUp size={40} className="text-warning" />
              </div>
              <Card.Title>Статистик</Card.Title>
              <Card.Text className="text-muted flex-grow-1">
                Системийн үйл ажиллагаа, хэрэглэгчдийн статистик харах.
              </Card.Text>
              <Button variant="warning" disabled>
                <TrendingUp size={18} className="me-2" />
                Удахгүй
              </Button>
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
