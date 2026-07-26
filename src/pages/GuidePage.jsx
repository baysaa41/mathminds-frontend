// src/pages/GuidePage.jsx
// Сайтыг хэрхэн ашиглах вэ — сурагч, багш, эцэг эх тус бүрд зориулсан заавар

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import {
  Compass,
  UserCog,
  GraduationCap,
  ClipboardList,
  Heart,
  Repeat,
  ListChecks,
  Target,
  BookOpen,
  Users,
  Copy,
  KeyRound,
  Mail,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

const IconCircle = ({ Icon, color = 'primary', size = 64, iconSize = 32 }) => (
  <div
    className={`bg-${color} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
    style={{ width: size, height: size }}
  >
    <Icon size={iconSize} className={`text-${color}`} />
  </div>
);

const Step = ({ number, title, children, color = 'primary' }) => (
  <div className="d-flex gap-3 mb-4">
    <div>
      <div
        className={`bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center fw-bold`}
        style={{ width: 36, height: 36, minWidth: 36 }}
      >
        {number}
      </div>
    </div>
    <div>
      <h6 className="mb-1">{title}</h6>
      <div className="text-muted small">{children}</div>
    </div>
  </div>
);

const GuidePage = () => {
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <Compass size={48} className="text-primary mb-3" />
        <h2 className="mb-3">Сайтыг хэрхэн ашиглах вэ</h2>
        <p className="text-muted lead">
          MathMinds-ийг сурагч, багш, эцэг эхийн аль ч байр сууринаас хэрхэн ашиглахыг доор
          алхам алхмаар тайлбарлав.
        </p>
      </div>

      {/* Эхлэх */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <UserCog size={20} className="me-2" />
            Эхлэх
          </h5>
        </Card.Header>
        <Card.Body>
          <Step number={1} title="Бүртгүүлэх эсвэл нэвтрэх">
            Имэйл эсвэл MMO.mn акаунтаар шууд нэвтэрч болно.
          </Step>
          <Step number={2} title="Профайлаа тохируулах">
            <Link to="/profile/edit">Профайл засах</Link> хуудаснаас нэр, анги/зэрэг, зурган
            дүрсээ оруулаад, <strong>Үндсэн үүрэг</strong> (Сурагч / Багш / Эцэг эх / Бусад)
            талбараас өөрт тохирох сонголтоо хийнэ. Энэ сонголт танд аль хэсэг харагдахыг
            тодорхойлно.
          </Step>
          <Step number={3} title="Өөрт тохирсон хэсэгрүү орох">
            Доорх 3 хэсгийн аль тохирохыг сонгож уншаарай.
          </Step>
        </Card.Body>
      </Card>

      {/* Сурагчид */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-success text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <GraduationCap size={20} className="me-2" />
            Сурагчид зориулсан
            <Badge bg="light" text="dark" className="ms-2">/dashboard</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-4 mb-4">
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={Repeat} color="success" />
                <h6>Давталт</h6>
                <p className="text-muted small mb-0">
                  Зөв бодсон бодлогууд тогтмол давтамжтайгаар сануулагдана — өдөр бүр хэдэн
                  бодлого давтахаа "Миний өдөр" хуудаснаас харна.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={ListChecks} color="primary" />
                <h6>7 хоногийн төлөвлөгөө</h6>
                <p className="text-muted small mb-0">
                  Таны түвшинд тохирсон сэдвүүдээр AI автоматаар долоо хоног бүр шинэ
                  төлөвлөгөө гаргаж өгнө.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={Target} color="warning" />
                <h6>Дараагийн сэдэв</h6>
                <p className="text-muted small mb-0">
                  Сул талыг илрүүлж, юуг дараа нь судлах нь зохимжтойг санал болгоно.
                </p>
              </div>
            </Col>
          </Row>

          <Step number={1} title="Контентоос судлах" color="success">
            Цэсний <strong>Контентийн сан</strong>-аас бодлого, томьёо, өгүүлэл, тест үзэж
            болно.
          </Step>
          <Step number={2} title="Клубт элсэх" color="success">
            Багшаас авсан бүртгэлийн кодоор <strong>Клубууд</strong> хэсгээс клубтаа элсэнэ.
          </Step>
          <Step number={3} title='"Миний өдөр" хуудсаа тогтмол шалгах' color="success">
            <Link to="/dashboard">Миний өдөр</Link> хуудаснаас өнөөдрийн давталт, 7 хоногийн
            төлөвлөгөө, сүүлийн quiz үр дүн, клубын дөхөж буй даалгавраа нэг дороос харна.
            Давтах ёстой бодлоготой үед цэсэн дэх багшийн зурагны хажуугийн улаан тоо танд
            сануулна.
          </Step>
          <Step number={4} title="Тест, даалгавар өгөх" color="success">
            Клубоос өгсөн даалгавар, quiz-ийг цагтаа гүйцэтгэж дүнгээ шалгана.
          </Step>
          <Step number={5} title="Эцэг эхтэй холбогдох код хуваалцах" color="success">
            "Миний өдөр" хуудасны доод хэсэгт таны хувийн код харагдана. Энэ кодыг эцэг
            эхдээ өгснөөр тэд таны явцыг хянах боломжтой болно.
          </Step>
        </Card.Body>
      </Card>

      {/* Багшид */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-info text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <ClipboardList size={20} className="me-2" />
            Багшид зориулсан
            <Badge bg="light" text="dark" className="ms-2">/teacher-dashboard</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <Step number={1} title="Клуб үүсгэх" color="info">
            <strong>Клубууд → Клуб үүсгэх</strong>-ээр анги, бүлгээ үүсгэнэ. Клуб бүр өөрийн
            бүртгэлийн кодтой байна.
          </Step>
          <Step number={2} title="Гишүүн урих" color="info">
            Бүртгэлийн кодыг сурагчиддаа өгөх эсвэл клубын тохиргооноос урилга илгээнэ.
          </Step>
          <Step number={3} title="Даалгавар, сорил нэмэх" color="info">
            Клубын <strong>Даалгавар</strong> хэсгээс шинэ quiz эсвэл даалгавар үүсгэж,
            эцсийн хугацаа тавина.
          </Step>
          <Step number={4} title="Хяналтын самбараа шалгах" color="info">
            <Link to="/teacher-dashboard">Хяналтын самбар</Link>-аас бүх клубынхаа шалгах
            ёстой ажил, дэмжлэг хэрэгтэй (сул талтай) сурагчдыг нэг дороос харна. Шалгах
            ёстой ажил байвал цэсэнд улаан тоогоор сануулна.
          </Step>
          <Step number={5} title="Тайлан гаргах" color="info">
            Клуб доторх <strong>Оноо</strong> болон сурагч тус бүрийн тайлангаас нарийвчилсан
            гүйцэтгэлийг харна.
          </Step>

          <Alert variant="light" className="border small mt-3">
            AI-аар даалгавар шалгуулах, бодлого зохиох зэрэг нэмэлт боломжийн талаар{' '}
            <Link to="/info/ai-guide">AI заавар</Link> хуудаснаас дэлгэрэнгүй үзнэ үү.
          </Alert>
        </Card.Body>
      </Card>

      {/* Эцэг эхэд */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <Heart size={20} className="me-2" />
            Эцэг эхэд зориулсан
            <Badge bg="light" text="dark" className="ms-2">/parent-dashboard</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <Step number={1} title='Профайлаасаа "Эцэг эх" сонгох' color="danger">
            <Link to="/profile/edit">Профайл засах</Link> хуудсанд <strong>Үндсэн үүрэг</strong>{' '}
            талбараас <strong>Эцэг эх</strong>-ийг сонгоно.
          </Step>
          <Step number={2} title="Хүүхдээсээ кодыг авах" color="danger">
            Хүүхэд тань "Миний өдөр" хуудасныхаа доод хэсгээс өөрийн хувийн кодыг
            <Copy size={14} className="mx-1" />
            хуулж танд илгээнэ.
          </Step>
          <Step number={3} title="Кодоор холбогдох" color="danger">
            <Link to="/parent-dashboard">Хүүхдийн явц</Link> хуудсанд орж, авсан кодоо
            <KeyRound size={14} className="mx-1" />
            оруулж холбогдоно. Нэгээс олон хүүхэдтэй бол тус бүрийн кодоор дахин холбогдож
            болно.
          </Step>
          <Step number={4} title="Явцыг хянах" color="danger">
            Хүүхдийнхээ давталтын байдал, 7 хоногийн төлөвлөгөө, сүүлийн шалгалтын дүн,
            клубын даалгаврыг зөвхөн уншиж харна — засах эрхгүй.
          </Step>
          <Step number={5} title="Долоо хоног тутмын имэйл тайлан" color="danger">
            <Mail size={14} className="me-1" />
            Долоо хоног бүрийн Даваа гарагт хүүхдийнхээ товч явцын тайланг имэйлээр хүлээн
            авна.
          </Step>
        </Card.Body>
      </Card>

      {/* Түгээмэл асуултууд */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <CheckCircle size={20} className="me-2 text-success" />
            Түгээмэл асуултууд
          </h5>
        </Card.Header>
        <Card.Body>
          {[
            [
              'Миний үүргийг дараа өөрчилж болох уу?',
              'Тийм. Профайл засах хуудаснаас хүссэн үедээ Сурагч/Багш/Эцэг эх/Бусад хооронд солих боломжтой.',
            ],
            [
              'Нэг эцэг эх хэд хэдэн хүүхэдтэй холбогдож болох уу?',
              'Болно. Хүүхэд бүр өөрийн гэсэн тусдаа код үүсгэдэг тул хэдэн ч хүүхдийн кодыг дараалан оруулж холбогдож болно.',
            ],
            [
              'Код хаанаас олох вэ?',
              'Сурагч "Миний өдөр" (/dashboard) хуудасныхаа доод хэсэгт байрлах "Эцэг эхтэй холбогдох код" картаас өөрийн кодоо олно.',
            ],
            [
              'Багш эсвэл эцэг эх сурагчийн мэдээллийг засаж болох уу?',
              'Үгүй. Багш, эцэг эхийн хуудсууд бүгд зөвхөн уншиж харах горимтой — сурагчийн өгөгдлийг зөвхөн тухайн сурагч өөрчилнө.',
            ],
          ].map(([q, a], i) => (
            <div key={i} className={i < 3 ? 'mb-3 pb-3 border-bottom' : ''}>
              <h6 className="mb-1">
                <ChevronRight size={14} className="me-1 text-primary" />
                {q}
              </h6>
              <p className="text-muted small mb-0 ms-3">{a}</p>
            </div>
          ))}
        </Card.Body>
      </Card>

      {/* Холбоосууд */}
      <div className="text-center mt-4 mb-3 d-flex flex-wrap justify-content-center gap-2">
        <Link to="/dashboard" className="btn btn-success">
          <GraduationCap size={16} className="me-1" />
          Миний өдөр
        </Link>
        <Link to="/teacher-dashboard" className="btn btn-info text-white">
          <ClipboardList size={16} className="me-1" />
          Багшийн хяналтын самбар
        </Link>
        <Link to="/parent-dashboard" className="btn btn-danger">
          <Heart size={16} className="me-1" />
          Хүүхдийн явц
        </Link>
        <Link to="/info/ai-guide" className="btn btn-outline-secondary">
          <Users size={16} className="me-1" />
          AI заавар
        </Link>
      </div>
    </Container>
  );
};

export default GuidePage;
