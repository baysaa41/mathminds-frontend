// src/pages/MembershipGuidePage.jsx
// Гишүүнчлэлийн эрх авах, клубт элсэх заавар

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import {
  CreditCard,
  Users,
  Coins,
  QrCode,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  Star,
  Shield,
  BookOpen,
} from 'lucide-react';

const MembershipGuidePage = () => {
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <HelpCircle size={48} className="text-primary mb-3" />
        <h2 className="mb-3">Гишүүнчлэлийн эрх авах заавар</h2>
        <p className="text-muted lead">
          MathMinds.club дээр гишүүнчлэлийн эрх худалдаж авч, клубуудад элсэх заавар
        </p>
      </div>

      {/* Гишүүнчлэлийн давуу талууд */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <Star size={20} className="me-2" />
            Гишүүнчлэлийн давуу талууд
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            <Col md={4}>
              <div className="text-center p-3">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                  <Users size={32} className="text-success" />
                </div>
                <h6>Клубд элсэх, клуб үүсгэх</h6>
                <p className="text-muted small mb-0">
                  Гишүүнчлэлийн эрхтэй хэрэглэгчид клубд элсэх, өөрийн клуб үүсгэх, хувийн контент үүсгэх эрхтэй болно.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                  <Shield size={32} className="text-primary" />
                </div>
                <h6>Нээлттэй клубуудад үнэгүй</h6>
                <p className="text-muted small mb-0">
                  Гишүүд сайтын зүгээс явуулж буй бүх нээлттэй клубд нэмэлт төлбөргүй элсэнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                  <BookOpen size={32} className="text-info" />
                </div>
                <h6>Онлайн уулзалт</h6>
                <p className="text-muted small mb-0">
                  Сайтаас олимпиадын анхан, дунд болон ЭЕШ-ийн бэлтгэл клубуудыг ажлуулж долоо хоног бүр онлайн уулзалт явуулж байна.
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Алхам алхмаар заавар */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0">Гишүүнчлэлийн эрх авах алхамууд</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-column gap-4">
            {/* Алхам 1 */}
            <div className="d-flex gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 48, height: 48, fontSize: 18, fontWeight: 'bold' }}
              >
                1
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-2">Гишүүнчлэлийн багц сонгох</h5>
                <p className="text-muted mb-3">
                  <Link to="/membership" className="text-decoration-none fw-semibold">
                    Гишүүнчлэлийн багцууд
                  </Link>{' '}
                  хуудаснаас өөрт тохирох багцыг сонгоно уу.
                </p>
                <Alert variant="info" className="mb-3">
                  <small>
                    <strong>Зөвлөгөө:</strong> Урт хугацааны багц авах нь илүү хэмнэлттэй!
                  </small>
                </Alert>
                <Link to="/membership" className="btn btn-primary">
                  <CreditCard size={16} className="me-2" />
                  Багц харах
                  <ChevronRight size={16} className="ms-1" />
                </Link>
              </div>
            </div>

            {/* Алхам 2 */}
            <div className="d-flex gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 48, height: 48, fontSize: 18, fontWeight: 'bold' }}
              >
                2
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-2">QPay-ээр төлбөр төлөх</h5>
                <p className="text-muted mb-3">
                  Багцаа сонгосны дараа QPay QR код гарна. Та өөрийн банкны аппликейшнээр QR кодыг уншуулж төлбөрөө төлнө үү.
                </p>
                <div className="bg-light p-3 rounded">
                  <div className="d-flex align-items-center gap-3">
                    <QrCode size={40} className="text-primary" />
                    <div>
                      <h6 className="mb-1">QPay дэмжигдсэн банкууд:</h6>
                      <p className="text-muted small mb-0">
                        Хаан банк, Хас банк, Голомт банк, ТДБ, Худалдаа хөгжлийн банк, Төрийн банк гэх мэт бүх банкууд
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Алхам 3 */}
            <div className="d-flex gap-3">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 48, height: 48, fontSize: 18, fontWeight: 'bold' }}
              >
                3
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-2">Урамшууллын зэс зоос авах</h5>
                <p className="text-muted mb-3">
                  Төлбөр амжилттай болсны дараа таны данс руу урамшууллын зэс зоос автоматаар орно.
                  Зэс зоосоор онлайн дэлгүүрээс нэмэлтээр гишүүнчлэлийн эрх, ном зэргийг худалдан авч болно.
                </p>
                <div className="d-flex align-items-center gap-2 text-success">
                  <CheckCircle size={20} />
                  <span>Төлбөр баталгаажсан даруйд зоос орно</span>
                </div>
              </div>
            </div>

            {/* Алхам 4 */}
            <div className="d-flex gap-3">
              <div
                className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 48, height: 48, fontSize: 18, fontWeight: 'bold' }}
              >
                4
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-2">Клубт элсэх</h5>
                <p className="text-muted mb-3">
                  Одоо та хүссэн клубдаа элсэж болно! Нээлттэй клубд
                  "Клуб элсэх" товчийг дараад шууд элсэнэ, хаалттай клубд багшаас авсан код, эсвэл онлайн дэлгүүрээс
                  эрх худалдан авч элсэнэ.
                </p>
                <Link to="/clubs" className="btn btn-success">
                  <Users size={16} className="me-2" />
                  Клубууд үзэх
                  <ChevronRight size={16} className="ms-1" />
                </Link>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Түгээмэл асуултууд */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0">Түгээмэл асуултууд</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex flex-column gap-4">
            <div>
              <h6 className="text-primary">Нээлттэй клуб гэж юу вэ?</h6>
              <p className="text-muted mb-0">
                Нээлттэй клуб гэдэг нь сайтын зүгээс явуулж буй клубууд юм. Гишүүнчлэлийн эрхтэй бүх хэрэглэгчид
                нээлттэй клубуудад нэмэлт төлбөргүй элсэх боломжтой. 2025-2026 оны хичээлийн жилд Олимпиадын анхан болон дунд шат,
                ЭЕШ-д бэлдэх нээлттэй клуб ажлуулж, долоо хоног бүр онлайн уулзалт зохион байгуулж байна.
              </p>
            </div>
            <div>
              <h6 className="text-primary">Хаалттай клубд хэрхэн элсэх вэ?</h6>
              <p className="text-muted mb-0">
                Багшаас авсан бүртгэлийн кодоор үнэгүй элсэж болно. Эсвэл онлайн
                дэлгүүрээс тухайн клубд элсэх эрх худалдаж авна.
              </p>
            </div>
            <div>
              <h6 className="text-primary">Гишүүнчлэлийн хугацаа дуусвал яах вэ?</h6>
              <p className="text-muted mb-0">
                Гишүүнчлэлийн эрхийн хугацаа дуусахад клубын гишүүнчлэл түр зогсоно.
                Шинэ гишүүнчлэлийн багц авснаар үргэлжлүүлэн суралцах боломжтой.
              </p>
            </div>
            <div>
              <h6 className="text-primary">Буцаан олголт авч болох уу?</h6>
              <p className="text-muted mb-0">
                Гишүүнчлэлийн төлбөр буцаагдахгүй. Худалдан авахаасаа өмнө багцын нөхцөлийг сайтар уншина уу.
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Холбоо барих */}
      <Card className="shadow-sm">
        <Card.Body className="text-center py-4">
          <Shield size={32} className="text-primary mb-3" />
          <h5>Тусламж хэрэгтэй юу?</h5>
          <p className="text-muted mb-3">
            Асуулт байвал бидэнтэй холбогдоно уу.
          </p>
          <Button variant="outline-primary" href="mailto:baysa@mathminds.club">
            baysa@mathminds.club
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MembershipGuidePage;
