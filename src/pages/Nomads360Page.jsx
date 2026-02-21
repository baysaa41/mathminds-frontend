// src/pages/Nomads360Page.jsx
// Nomads 360° хөтөлбөрийн танилцуулга

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import { Globe, Target, Users, BookOpen, TrendingUp, Award, Mail, Phone } from 'lucide-react';

export default function Nomads360Page() {
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

        <Card className="shadow-sm border-0">
          <Card.Body className="p-4 p-md-5">
            {/* Header */}
            <div className="text-center mb-5">
              <Globe size={56} className="text-primary mb-3" />
              <h1 className="display-5 fw-bold mb-3">Nomads 360°</h1>
              <p className="lead text-primary fw-semibold">Хамтдаа, хязгаарыг давъя</p>
              <p className="text-muted fs-5">
                Nomads 360° бол байршил үл харгалзан Монголын хүүхдүүдэд шилдэг багш, шилдэг сургалт,
                гүнзгийрүүлсэн шинжлэх ухааны мэдлэг, олимпиадын бэлтгэл, хувь хүний хөгжил–ийг
                нэг цогц системд санал болгодог боловсролын хөтөлбөр юм.
              </p>
            </div>

            {/* Нэг өгүүлбэрээр */}
            <div className="text-center mb-5 p-4 bg-primary bg-opacity-10 rounded">
              <h3 className="h4 text-primary mb-2">Нэг өгүүлбэрээр</h3>
              <p className="h5 mb-0">"Шилдэг боловсролыг — хаанаас ч, хэнд ч."</p>
              <p className="text-muted small mt-2 mb-0">Хөтөлбөрийн гол зорилго</p>
            </div>

            <div className="nomads-content">
              {/* Ямар асуудлыг шийддэг вэ? */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <Target className="text-danger me-2" size={28} />
                  <h2 className="h3 mb-0">Ямар асуудлыг шийддэг вэ?</h2>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="h-100 border-start border-danger border-3">
                      <Card.Body>
                        <p className="mb-0">
                          ✗ Авьяаслаг болон тусгай хэрэгцээтэй хүүхдэд тохирох хөтөлбөр дутмаг
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-danger border-3">
                      <Card.Body>
                        <p className="mb-0">
                          ✗ ЕБС-ийн хөтөлбөр авьяастайд уйтгартай, ахиц удаан
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-danger border-3">
                      <Card.Body>
                        <p className="mb-0">
                          ✗ Олимпиад, гүнзгийрүүлсэн сургалтын багшийн хомсдол
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-danger border-3">
                      <Card.Body>
                        <p className="mb-0">
                          ✗ Байгалийн ухааны цогц хөтөлбөр байхгүй
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Манай Шийдэл */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <BookOpen className="text-success me-2" size={28} />
                  <h2 className="h3 mb-0">Манай Шийдэл</h2>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="h-100 border-start border-success border-3 bg-success bg-opacity-10">
                      <Card.Body>
                        <p className="mb-0">
                          ✓ Орчин үеийн онлайн платформ
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-success border-3 bg-success bg-opacity-10">
                      <Card.Body>
                        <p className="mb-0">
                          ✓ Шилдэг багш нарын сургалтыг хаанаас ч авах боломж
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-success border-3 bg-success bg-opacity-10">
                      <Card.Body>
                        <p className="mb-0">
                          ✓ Гүнзгийрүүлсэн + олимпиадын бэлтгэлийн хосолсон хөтөлбөр
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border-start border-success border-3 bg-success bg-opacity-10">
                      <Card.Body>
                        <p className="mb-0">
                          ✓ Тэтгэлэг + зөвлөгөө + контент бүхий нэгдсэн экосистем
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Онцлог */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <Award className="text-warning me-2" size={28} />
                  <h2 className="h3 mb-0">Онцлог</h2>
                </div>
                <ul className="list-unstyled">
                  <li className="mb-2 d-flex align-items-start">
                    <Badge bg="warning" className="me-2 mt-1">1</Badge>
                    <span>Суурь шинжлэх ухааны цогц мэдлэг</span>
                  </li>
                  <li className="mb-2 d-flex align-items-start">
                    <Badge bg="warning" className="me-2 mt-1">2</Badge>
                    <span>Монголын нүүдэлчний гүн ухаан, өв соёлтой хослуулсан</span>
                  </li>
                  <li className="mb-2 d-flex align-items-start">
                    <Badge bg="warning" className="me-2 mt-1">3</Badge>
                    <span>Хувь хүний хөгжилд чиглэсэн ур чадварын сургалт</span>
                  </li>
                </ul>
              </section>

              {/* Давуу тал */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <TrendingUp className="text-info me-2" size={28} />
                  <h2 className="h3 mb-0">Давуу тал</h2>
                </div>
                <Row className="g-3">
                  <Col md={4}>
                    <Card className="h-100 text-center border-info">
                      <Card.Body>
                        <Globe size={40} className="text-info mb-2" />
                        <h5 className="h6 fw-bold">Хаанаас ч суралцах боломж</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 text-center border-info">
                      <Card.Body>
                        <BookOpen size={40} className="text-info mb-2" />
                        <h5 className="h6 fw-bold">Уян хатан хөтөлбөр</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 text-center border-info">
                      <Card.Body>
                        <Users size={40} className="text-info mb-2" />
                        <h5 className="h6 fw-bold">Шилдэг зөвлөх баг</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Хэнд зориулав? */}
              <section className="mb-5">
                <div className="d-flex align-items-center mb-3">
                  <Users className="text-primary me-2" size={28} />
                  <h2 className="h3 mb-0">Хэнд зориулав?</h2>
                </div>
                <Card className="border-primary">
                  <Card.Body>
                    <p className="mb-2">
                      <strong>12–18 насны авьяаслаг, сурах эрмэлзэлтэй хүүхдүүд</strong>
                    </p>
                    <p className="text-muted mb-2">
                      <strong>Элсэлтийн шалгуур:</strong> эссэ, олимпиад/амжилт, нийгмийн идэвх
                    </p>
                    <p className="text-success mb-0">
                      <strong>Шилдэг оролцогчдод тэтгэлэг санал болгоно</strong>
                    </p>
                  </Card.Body>
                </Card>
              </section>

              {/* Хөтөлбөрийн бүтэц */}
              <section className="mb-5">
                <h2 className="h3 mb-3">Хөтөлбөрийн бүтэц</h2>
                <p className="text-muted mb-3">Судлагдахуун бүр гурван түвшинд явна:</p>
                <Row className="g-3">
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center">
                        <div className="badge bg-primary rounded-circle p-3 mb-3">
                          <span className="h4 mb-0">1</span>
                        </div>
                        <h5 className="fw-bold">Анхан шат</h5>
                        <p className="text-muted small mb-0">Үндсэн ойлголт, суурь мэдлэг</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center">
                        <div className="badge bg-success rounded-circle p-3 mb-3">
                          <span className="h4 mb-0">2</span>
                        </div>
                        <h5 className="fw-bold">Дунд шат</h5>
                        <p className="text-muted small mb-0">Гүнзгийрүүлсэн судалгаа</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center">
                        <div className="badge bg-danger rounded-circle p-3 mb-3">
                          <span className="h4 mb-0">3</span>
                        </div>
                        <h5 className="fw-bold">Ахисан шат</h5>
                        <p className="text-muted small mb-0">Олимпиадын бэлтгэл</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Хүлээгдэж буй үр дүн */}
              <section className="mb-5">
                <h2 className="h3 mb-3">Хүлээгдэж буй үр дүн</h2>
                <ul className="text-muted">
                  <li className="mb-2">
                    Шинжлэх ухаанд гүн ойлголттой, асуудалд шинжлэх ухаанч ханддаг болно
                  </li>
                  <li className="mb-2">
                    Хот–хөдөөгийн боловсролын тэгш боломж сайжирна
                  </li>
                  <li className="mb-2">
                    Олон улсын олимпиад, тэмцээнд амжилтад хүрэх суурь тавигдана
                  </li>
                  <li className="mb-2">
                    Асуудал шийдвэрлэгч, бүтээлч иргэдийг төлөвшинө
                  </li>
                </ul>
              </section>

              {/* Төсөв ба хөрөнгө оруулалт */}
              <section className="mb-5">
                <h2 className="h3 mb-3">Төсөв ба хөрөнгө оруулалтын бүтэц</h2>
                <Card className="bg-light border-0">
                  <Card.Body>
                    <p className="h5 mb-3">
                      <strong>Жилийн төсөв:</strong> <span className="text-primary">300 сая төгрөг</span>
                    </p>
                    <p className="mb-2"><strong>Зардлын бүтэц:</strong></p>
                    <Row className="g-2">
                      <Col xs={6} md={3}>
                        <div className="p-3 bg-white rounded text-center">
                          <div className="fw-bold text-primary">40%</div>
                          <small className="text-muted">Багшийн цалин</small>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="p-3 bg-white rounded text-center">
                          <div className="fw-bold text-success">25%</div>
                          <small className="text-muted">Систем хөгжүүлэлт</small>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="p-3 bg-white rounded text-center">
                          <div className="fw-bold text-warning">20%</div>
                          <small className="text-muted">Тэтгэлэг</small>
                        </div>
                      </Col>
                      <Col xs={6} md={3}>
                        <div className="p-3 bg-white rounded text-center">
                          <div className="fw-bold text-info">15%</div>
                          <small className="text-muted">Менежмент</small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </section>

              {/* Хамтран ажиллах боломж */}
              <section className="mb-5">
                <h2 className="h3 mb-3">Хамтран ажиллах боломж</h2>
                <Row className="g-3">
                  <Col md={4}>
                    <Card className="h-100 text-center border-0 shadow-sm">
                      <Card.Body>
                        <Award size={40} className="text-warning mb-2" />
                        <h5 className="h6 fw-bold">Нэрэмжит тэтгэлэг</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 text-center border-0 shadow-sm">
                      <Card.Body>
                        <BookOpen size={40} className="text-info mb-2" />
                        <h5 className="h6 fw-bold">Контент хамтран бүтээх</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="h-100 text-center border-0 shadow-sm">
                      <Card.Body>
                        <Users size={40} className="text-success mb-2" />
                        <h5 className="h6 fw-bold">Сурталчилгааны түншлэл</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Холбоо барих */}
              <section>
                <h2 className="h3 mb-3">Холбоо барих</h2>
                <Card className="border-primary">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <Mail className="text-primary me-2" size={24} />
                      <a href="mailto:baysa@mathminds.club" className="text-decoration-none">
                        baysa@mathminds.club
                      </a>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                      <Phone className="text-primary me-2" size={24} />
                      <div>
                        <a href="tel:+97695320036" className="text-decoration-none d-block">
                          +976-95320036
                        </a>
                        <a href="tel:+97696660036" className="text-decoration-none d-block">
                          +976-96660036
                        </a>
                      </div>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-facebook text-primary me-2" style={{ fontSize: '24px' }}></i>
                      <a
                        href="https://www.facebook.com/Nomads360d"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        @Nomads360d
                      </a>
                    </div>
                  </Card.Body>
                </Card>
              </section>
            </div>

            <hr className="my-4" />

            <div className="text-center text-muted small">
              <p className="mb-0">
                Nomads 360° – Хамтдаа, хязгаарыг давъя. Шилдэг боловсролыг хаанаас ч, хэнд ч.
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
