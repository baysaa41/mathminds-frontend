// src/pages/AboutPage.jsx
// Танилцуулга хуудас

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Users, Trophy, Target, Heart, Zap, BookOpen, Repeat, ClipboardList, Compass, TrendingUp } from 'lucide-react';
import apiClient from '../api/axiosConfig';

export default function AboutPage() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get('/api/integral/statistics/');
      console.log('Statistics response:', response.data);
      setStatistics(response.data);
    } catch (error) {
      console.error('Статистик татахад алдаа:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        {/* Back button */}
        <div className="mb-4">
          <Button variant="link" as={Link} to="/" className="p-0 text-decoration-none">
            <i className="bi bi-arrow-left me-2"></i>
            Нүүр хуудас руу буцах
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">MathMinds.Club</h1>
          <p className="lead text-primary mb-2">
            <em>Where every mind counts</em>
          </p>
          <p className="text-muted mb-2">Математикийн боловсролыг дэмжих, суралцагчдыг хөгжүүлэх</p>
          <p className="text-muted small">
            <em>integral.mn Монгол Бодлогын Сан дээр суурилсан</em>
          </p>
        </div>

        {/* Statistics Section */}
        {loading ? (
          <div className="text-center mb-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          statistics && (
            <Row className="g-4 mb-5">
              <Col md={3} sm={6}>
                <Card className="shadow-sm border-0 text-center h-100">
                  <Card.Body className="p-4">
                    <i className="bi bi-puzzle fs-1 text-primary mb-2"></i>
                    <h3 className="h2 fw-bold text-primary mb-1">
                      {statistics.total_problems?.toLocaleString() || 0}
                    </h3>
                    <p className="text-muted small mb-0">Нийт бодлого</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="shadow-sm border-0 text-center h-100">
                  <Card.Body className="p-4">
                    <i className="bi bi-check-circle fs-1 text-success mb-2"></i>
                    <h3 className="h2 fw-bold text-success mb-1">
                      {statistics.problems_with_solutions?.toLocaleString() || 0}
                    </h3>
                    <p className="text-muted small mb-0">Бодолттой бодлого</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="shadow-sm border-0 text-center h-100">
                  <Card.Body className="p-4">
                    <i className="bi bi-infinity fs-1 text-info mb-2"></i>
                    <h3 className="h2 fw-bold text-info mb-1">
                      {statistics.total_formulas?.toLocaleString() || 0}
                    </h3>
                    <p className="text-muted small mb-0">Томъёо тодорхойлолт</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3} sm={6}>
                <Card className="shadow-sm border-0 text-center h-100">
                  <Card.Body className="p-4">
                    <i className="bi bi-patch-check fs-1 text-warning mb-2"></i>
                    <h3 className="h2 fw-bold text-warning mb-1">
                      {statistics.total_quizzes?.toLocaleString() || 0}
                    </h3>
                    <p className="text-muted small mb-0">Нийт тест</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        )}

        {/* Efficiency report CTA */}
        <Row className="mb-5">
          <Col lg={10} className="mx-auto">
            <Card className="shadow-sm border-0 bg-white">
              <Card.Body className="p-4 d-flex flex-column flex-md-row align-items-md-center gap-3">
                <TrendingUp size={40} className="text-primary flex-shrink-0" />
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-1">Платформ бодит үр дүнд хэрхэн нөлөөлж байна вэ?</h5>
                  <p className="text-muted small mb-0">
                    2026 оны ЭЕШ-ийн бэлтгэлийн явцад платформын идэвх бодит дүнд хэрхэн нөлөөлснийг
                    харуулсан тоон тайлан — сорилгын гүйцэтгэлийн өсөлт, тогтмол дадлагын үр өгөөж,
                    хамаарлын шинжилгээ.
                  </p>
                </div>
                <Link to="/info/results" className="btn btn-primary text-nowrap">
                  Тайланг үзэх
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Mission */}
        <div className="text-center mb-4">
          <h2 className="h3 fw-bold">Яагаад MathMinds вэ?</h2>
        </div>
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Target size={48} className="text-primary" />
                </div>
                <h5 className="fw-bold mb-3">Математикийн боловсролыг дэмжих</h5>
                <p className="text-muted small mb-0">
                  Суралцагчид, багш нар, сурагчдад математикийн мэдлэгээ хуваалцах, бие биенээсээ
                  суралцах орчинг бүрдүүлнэ.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <BookOpen size={48} className="text-success" />
                </div>
                <h5 className="fw-bold mb-3">Сайн багшийг таны дэргэд</h5>
                <p className="text-muted small mb-0">
                  Онлайн платформоор дамжуулан бүх суралцагч чанартай боловсрол, туршлагатай багш
                  нарын зөвлөгөө хүртэх боломжтой.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Trophy size={48} className="text-warning" />
                </div>
                <h5 className="fw-bold mb-3">Олимпиадын багш нар</h5>
                <p className="text-muted small mb-0">
                  Олимпиадын хорооны гишүүд, олон улсын медальтан сурагчид, туршлагатай багш нар
                  идэвхтэй оролцож, мэдлэг туршлагаа хуваалцана.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Features */}
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <BookOpen size={48} className="text-primary" />
                </div>
                <h5 className="fw-bold mb-3">Контент & Материал</h5>
                <p className="text-muted small mb-0">
                  Олон төрлийн бодлого, томьёо, нийтлэл, тест зэргийг судлаарай. LaTeX дэмжлэгтэй
                  математикийн томъёог харуулах боломжтой.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Users size={48} className="text-success" />
                </div>
                <h5 className="fw-bold mb-3">Клуб & Хамтын ажиллагаа</h5>
                <p className="text-muted small mb-0">
                  Клуб үүсгэж, гишүүд элсүүлж, хамтдаа суралцаарай. Багш нар өөрийн анги, бүлгийнхээ
                  үйл ажиллагааг зохион байгуулж болно.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Trophy size={48} className="text-warning" />
                </div>
                <h5 className="fw-bold mb-3">Үнэлгээ & Урамшуулал</h5>
                <p className="text-muted small mb-0">
                  Бодлого бодож, тест өгч, алтан/мөнгөн/хүрэл зоос цуглуулаарай. Амжилтаа бусадтай
                  хуваалцаарай.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Адаптив сургалт */}
        <div className="text-center mb-4">
          <h2 className="h3 fw-bold">Хувь хүнд тохирсон сургалт</h2>
          <p className="text-muted">Сурагч, багш, эцэг эх — гурвуулаа өөрийн хэсэгтэй</p>
        </div>
        <Row className="g-4 mb-5">
          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Repeat size={48} className="text-success" />
                </div>
                <h5 className="fw-bold mb-3">Сурагчийн "Миний өдөр"</h5>
                <p className="text-muted small mb-0">
                  Өдөр тутмын давталт, 7 хоногийн хувийн сургалтын төлөвлөгөө, дараагийн
                  санал болгож буй сэдвийг нэг дороос харна.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <ClipboardList size={48} className="text-info" />
                </div>
                <h5 className="fw-bold mb-3">Багшийн хяналтын самбар</h5>
                <p className="text-muted small mb-0">
                  Бүх клубынхаа шалгах ёстой ажил, дэмжлэг хэрэгтэй сурагчдыг нэг дороос
                  хянана.
                </p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 shadow-sm border-0 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <Heart size={48} className="text-danger" />
                </div>
                <h5 className="fw-bold mb-3">Эцэг эхийн хяналт</h5>
                <p className="text-muted small mb-0">
                  Хүүхдийнхээ явцыг код оруулж холбогдоод зөвхөн уншиж хянана, долоо хоног
                  тутам имэйл тайлан авна.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="text-center mb-5">
          <Link to="/info/guide" className="btn btn-outline-primary">
            <Compass size={16} className="me-2" />
            Дэлгэрэнгүй ашиглах заавар үзэх
          </Link>
        </div>

        {/* Values */}
        <Row className="mb-5">
          <Col lg={8} className="mx-auto">
            <h2 className="h4 text-center mb-4">Бидний эрхэмлэх зүйлс</h2>
            <Row className="g-3">
              <Col md={6}>
                <Card className="border-0 bg-white shadow-sm">
                  <Card.Body className="d-flex align-items-start">
                    <Heart size={24} className="text-danger me-3 flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold mb-1">Суралцагч төвтэй</h6>
                      <p className="text-muted small mb-0">
                        Суралцагчдын хэрэгцээ, ахиц дэвшил бидний үндсэн зорилт
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-0 bg-white shadow-sm">
                  <Card.Body className="d-flex align-items-start">
                    <Zap size={24} className="text-primary me-3 flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold mb-1">Инновац</h6>
                      <p className="text-muted small mb-0">
                        Сурах, заах арга барилыг шинэчлэн сайжруулах
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-0 bg-white shadow-sm">
                  <Card.Body className="d-flex align-items-start">
                    <Users size={24} className="text-success me-3 flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold mb-1">Хамтын ажиллагаа</h6>
                      <p className="text-muted small mb-0">Нэгдсэн хүчээр илүү их зүйлд хүрэх</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="border-0 bg-white shadow-sm">
                  <Card.Body className="d-flex align-items-start">
                    <Target size={24} className="text-warning me-3 flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold mb-1">Чанартай контент</h6>
                      <p className="text-muted small mb-0">
                        Баталгаат, үр дүнтэй сургалтын материал
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* CTA */}
        <Row>
          <Col lg={6} className="mx-auto text-center">
            <Card className="shadow-sm border-0 bg-primary text-white">
              <Card.Body className="p-4">
                <h3 className="h5 mb-3">Манай хамт олонд нэгдээрэй!</h3>
                <p className="mb-0">Математикийн аялалаа эхлүүлж, мэдлэгээ хөгжүүлээрэй.</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
