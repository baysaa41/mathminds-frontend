// src/pages/EfficiencyReportPage.jsx
// Системийн үр ашгийн тайлан — платформын идэвх ба бодит ЭЕШ-ийн дүнгийн хамаарал

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import { TrendingUp, Repeat, Target, Percent, ArrowRight, ArrowLeft, Clock } from 'lucide-react';

const MOCK_TESTS = [
  { label: '№01', score: 18.2, participants: 65, x: 90, y: 141.5 },
  { label: '№02', score: 20.7, participants: 51, x: 260, y: 134.8 },
  { label: '№03', score: 26.6, participants: 32, x: 430, y: 119.1 },
  { label: '№04', score: 40.0, participants: 41, x: 600, y: 83.3 },
  { label: '№05', score: 47.6, participants: 25, x: 770, y: 63.1 },
];

const PARTICIPATION_GROUPS = [
  { label: '1 сорилго', score: 439, share: '10.8%', heightPct: 77.6, opacity: 0.45 },
  { label: '2 сорилго', score: 485, share: '29.2%', heightPct: 85.7, opacity: 0.6 },
  { label: '3 сорилго', score: 426, share: '7.7%', heightPct: 75.3, opacity: 0.75 },
  { label: '4 сорилго', score: 459, share: '24.6%', heightPct: 81.1, opacity: 0.88 },
  { label: '5 (бүрэн)', score: 566, share: '27.7%', heightPct: 100, opacity: 1 },
];

const EXERCISE_GROUPS = [
  { label: '0 (огт бодоогүй)', score: 452, widthPct: 74.5, opacity: 0.45 },
  { label: '1–30 дасгал', score: 521, widthPct: 85.8, opacity: 0.6 },
  { label: '31–60 дасгал', score: 487, widthPct: 80.2, opacity: 0.75 },
  { label: '61–120 дасгал', score: 607, widthPct: 100, opacity: 1 },
  { label: '120+ дасгал', score: 578, widthPct: 95.2, opacity: 0.9 },
];

const SCORE_BANDS = [
  { label: 'Тэргүүлэгч · Х.оноо ≥ 600', count: 10, share: 15.4, variant: 'success' },
  { label: 'Дундаж · Х.оноо 400–599', count: 43, share: 66.2, variant: 'warning' },
  { label: 'Эрсдэлтэй · Х.оноо < 400', count: 12, share: 18.5, variant: 'danger' },
];

const CORRELATIONS = [
  { label: 'Мок сорилгын дундаж гүйцэтгэл (Амжилт %)', aScore: '0.61', xScore: '0.51' },
  { label: 'Хариулсан дасгалын тоо', aScore: '0.49', xScore: '0.44' },
  { label: 'Оролцсон сорилгын тоо (1–5)', aScore: '—', xScore: '0.35' },
];

const SCHOOLS = [
  { name: 'Сургууль 1', before: { year: '2025', rank: '11 / 13', avg: 453.1 }, after: { year: '2026 (урьдчилсан)', rank: '7 / 14', avg: 487.5 }, delta: '+7.6%' },
  { name: 'Сургууль 2', before: { year: '2025', rank: '8 / 13', avg: 480.9 }, after: { year: '2026 (урьдчилсан)', rank: '4 / 14', avg: 494.9 }, delta: '+2.9%' },
];

const NEXT_STEPS = [
  'Дасгал бодлого огт ашиглаагүй 58.5% сурагчийг платформд татан оролцуулах кампанит ажил — бодит үр дүнгийн жишээг харуулж урамшуулах.',
  'Эрсдэлтэй бүлгийн (Х.оноо <400) сурагчдад тусгайлсан нэмэлт хичээл, бага бүлгийн тогтмол дадлага зохион байгуулах.',
  'Тэргүүлэгч бүлгийн сурагчдад илүү өндөр түвшний, өрсөлдөөнт контент бэлдэж, суралцахуйн замналыг тэдэнд тохируулан өргөжүүлэх.',
  'Ирэх ангиудад мок сорилго, дасгал бодлогын хөтөлбөрийг эрт эхлүүлж, өгөгдлийн бүртгэлийн чанарыг тогтмол цэвэрлэх дэг журам нэвтрүүлэх.',
];

function LineChart() {
  const points = MOCK_TESTS.map((t) => `${t.x},${t.y}`).join(' ');
  const areaPath = `M ${MOCK_TESTS.map((t) => `${t.x},${t.y}`).join(' L ')} L ${MOCK_TESTS[MOCK_TESTS.length - 1].x},190 L ${MOCK_TESTS[0].x},190 Z`;

  return (
    <svg
      viewBox="0 0 860 250"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Мок сорилгын дундаж оноо 5 сорилгын турш 18.2-с 47.6 хүртэл өссөн"
      style={{ width: '100%', height: 'auto' }}
    >
      <line x1="40" y1="30" x2="840" y2="30" stroke="#e9ecef" strokeWidth="1" />
      <line x1="40" y1="83.3" x2="840" y2="83.3" stroke="#e9ecef" strokeWidth="1" />
      <line x1="40" y1="136.7" x2="840" y2="136.7" stroke="#e9ecef" strokeWidth="1" />
      <line x1="40" y1="190" x2="840" y2="190" stroke="#adb5bd" strokeWidth="1" />
      <text x="30" y="34" textAnchor="end" fontSize="11" fill="#6c757d">60</text>
      <text x="30" y="87.3" textAnchor="end" fontSize="11" fill="#6c757d">40</text>
      <text x="30" y="140.7" textAnchor="end" fontSize="11" fill="#6c757d">20</text>
      <text x="30" y="194" textAnchor="end" fontSize="11" fill="#6c757d">0</text>

      <path d={areaPath} fill="var(--bs-primary, #0d6efd)" opacity="0.1" />
      <polyline points={points} fill="none" stroke="var(--bs-primary, #0d6efd)" strokeWidth="2" />

      {MOCK_TESTS.map((t) => (
        <circle key={t.label} cx={t.x} cy={t.y} r="5" fill="var(--bs-primary, #0d6efd)" stroke="#fff" strokeWidth="2" />
      ))}
      {MOCK_TESTS.map((t) => (
        <text key={`v-${t.label}`} x={t.x} y={t.y - 15} textAnchor="middle" fontSize="12" fontWeight="600" fill="#212529">
          {t.score.toFixed(1)}
        </text>
      ))}
      {MOCK_TESTS.map((t) => (
        <text key={`l-${t.label}`} x={t.x} y="208" textAnchor="middle" fontSize="11" fill="#6c757d">
          Сорилго {t.label}
        </text>
      ))}
      {MOCK_TESTS.map((t) => (
        <text key={`s-${t.label}`} x={t.x} y="224" textAnchor="middle" fontSize="10.5" fill="#adb5bd">
          {t.participants} сурагч
        </text>
      ))}
    </svg>
  );
}

export default function EfficiencyReportPage() {
  return (
    <div className="bg-light min-vh-100 py-5">
      <Container style={{ maxWidth: 980 }}>
        <div className="mb-4">
          <Button variant="link" as={Link} to="/info/about" className="p-0 text-decoration-none">
            <ArrowLeft size={16} className="me-2" />
            Танилцуулга руу буцах
          </Button>
        </div>

        {/* Header */}
        <div className="mb-5">
          <p className="text-primary fw-bold text-uppercase small mb-2" style={{ letterSpacing: '0.06em' }}>
            MathMinds.club — Үр ашгийн тайлан
          </p>
          <h1 className="display-6 fw-bold mb-3">
            Тогтмол дадлага бодит ЭЕШ-ийн дүнд шууд, хэмжигдэхүйц нөлөө үзүүлж байна
          </h1>
          <p className="lead text-muted mb-2" style={{ maxWidth: 700 }}>
            2026 оны ЭЕШ-д суудсан 12-р ангийн 65 сурагчийн 5 удаагийн мок сорилго, платформ дээрх
            дасгал бодлогын гүйцэтгэл, мөн бодит ЭЕШ-ийн эцсийн онооны хамаарлыг задлан шинжилсэн дүн.
          </p>
          <p className="text-muted small d-flex align-items-center gap-2 mb-2">
            <Clock size={15} className="text-primary flex-shrink-0" />
            Бэлтгэлийн хугацаа: <strong className="text-body">2 сар</strong> (5 удаагийн мок сорилгын үе шат)
          </p>
          <p className="text-muted small" style={{ maxWidth: 700 }}>
            Тайланд сургууль, сум, аймгийн нэр болон сурагчийн хувийн мэдээллийг оруулаагүй — зөвхөн
            нэгтгэсэн тоон үзүүлэлт харуулав.
          </p>
        </div>

        {/* Stat tiles */}
        <Row className="g-3 mb-5">
          <Col md={3} sm={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <TrendingUp size={28} className="text-primary mb-2" />
                <h3 className="h2 fw-bold mb-1">2.6×</h3>
                <p className="text-muted small mb-0">
                  Мок сорилгын дундаж гүйцэтгэл I → V сорилгод нэмэгдсэн (18.2 → 47.6 / 100)
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <Repeat size={28} className="text-success mb-2" />
                <h3 className="h2 fw-bold mb-1">+29%</h3>
                <p className="text-muted small mb-0">
                  Бүх 5 сорилгод тогтмол оролцсон сурагчдын бодит ЭЕШ дундаж, ганц удаа оролцсон
                  бүлэгтэй харьцуулахад
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <Target size={28} className="text-warning mb-2" />
                <h3 className="h2 fw-bold mb-1">+31%</h3>
                <p className="text-muted small mb-0">
                  Дасгал бодлого идэвхтэй бодсон сурагчдын бодит ЭЕШ дундаж, огт бодоогүй бүлэгтэй
                  харьцуулахад
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <Percent size={28} className="text-info mb-2" />
                <h3 className="h2 fw-bold mb-1">r = 0.61</h3>
                <p className="text-muted small mb-0">
                  Мок сорилгын гүйцэтгэл ба бодит ЭЕШ-ийн онооны хоорондын корреляц
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* 1. Progression */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">1. Сорилго дараалан авах тусам гүйцэтгэл тогтвортой өссөн</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            2 сарын хугацаанд явагдсан 5 удаагийн мок сорилгын дундаж оноог (100 онооноос) харьцуулбал
            тасралтгүй өсөлт ажиглагдсан. Тоо доор нь бол тухайн сорилгод оролцсон сурагчдын тоо —
            сүүлийн сорилгуудад оролцогчийн тоо цөөрсөн тул өсөлтийн нэг хэсэг нь "илүү идэвхтэй сурагчид үлдсэн"
            эффектээс шалтгаалж болзошгүй.
          </p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <LineChart />
              <p className="text-muted small mt-3 mb-0">
                Эхний 4 сорилгын дундаж хэмжээст оноо 419 → 492 → 550 → 591 болж өссөн; V сорилгын
                хэмжээст оноо одоогоор тооцоогдоогүй байна.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 2. Participation */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">2. Тогтмол оролцоо — амжилтын хамгийн хүчтэй хүчин зүйл</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            65 сурагчийг 5 мок сорилгоос хэдэд нь оролцсоноор нь бүлэглэж, тэдний бодит ЭЕШ-ийн
            хэмжээст оноотой (Х.оноо) харьцуулбал. Өнгөний гүн хэдэн сорилгод оролцсоныг илэрхийлнэ.
          </p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <div className="d-flex align-items-end gap-3" style={{ height: 200 }}>
                {PARTICIPATION_GROUPS.map((g) => (
                  <div key={g.label} className="flex-fill d-flex flex-column align-items-center justify-content-end h-100">
                    <div className="fw-bold small mb-1">{g.score}</div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 48,
                        height: `${g.heightPct}%`,
                        backgroundColor: 'var(--bs-primary, #0d6efd)',
                        opacity: g.opacity,
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                    <div className="text-muted small mt-2 text-center">{g.label}</div>
                    <div className="text-muted text-center" style={{ fontSize: 11 }}>{g.share}</div>
                  </div>
                ))}
              </div>
              <p className="text-muted small mt-4 mb-0">
                Бүх 5 сорилгод тогтмол оролцсон 18 сурагчийн (27.7%) бодит ЭЕШ дундаж оноо бусад бүх
                бүлгээс тод давуу — ганц удаа оролцсон бүлгээс 127 нэгжээр (+29%), ангийн ерөнхий
                дунджаас (491.6) 74 нэгжээр өндөр байна.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 3. Exercise activity */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">3. Дасгал бодлогын идэвх — шууд хэмжигдэхүйц үр өгөөж</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            Платформ дээр хариулсан дасгалын тоогоор бүлэглэж, бодит ЭЕШ-ийн дундаж оноотой
            харьцуулбал (корреляц 0.44).
          </p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              {EXERCISE_GROUPS.map((g) => (
                <div key={g.label} className="d-flex align-items-center gap-3 mb-3">
                  <div className="text-muted small text-end" style={{ width: 150, flexShrink: 0 }}>{g.label}</div>
                  <div style={{ flex: 1, height: 22, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${g.widthPct}%`,
                        height: '100%',
                        backgroundColor: 'var(--bs-primary, #0d6efd)',
                        opacity: g.opacity,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <div className="fw-bold small text-end" style={{ width: 44, flexShrink: 0 }}>{g.score}</div>
                </div>
              ))}
              <p className="text-muted small mt-3 mb-0">
                Дасгал бодоогүй бүлгийн дундаж (452) хамгийн бага байсан бол 61-с дээш хариулт өгсөн
                сурагчдын дундаж 578–607 хооронд байна — идэвхтэй хэрэглэгчид +31% өндөр дүн
                үзүүлсэн. Гэсэн хэдий ч 65 сурагчийн 38 нь (58.5%) нэг ч дасгал бодоогүй хэвээр байгаа
                нь платформын хамрагдалт нэмэгдэх зайтай гэдгийг харуулж байна.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 4. Top scorers */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-3">4. Тэргүүлэгч сурагчдын дийлэнх нь платформыг идэвхтэй ашигласан</h2>
          <Card className="border-0" style={{ backgroundColor: 'rgba(25,135,84,0.08)' }}>
            <Card.Body className="p-4 d-flex align-items-start gap-3">
              <div className="fw-bold text-success flex-shrink-0" style={{ fontSize: 32, minWidth: 90 }}>80%</div>
              <p className="text-muted mb-0">
                Хамгийн өндөр бодит дүн авсан (Х.оноо ≥600) 10 сурагчийн <strong className="text-body">80% нь</strong>{' '}
                платформ дээр дасгал бодож байсан — ердөө 20% нь дасгал бодоогүй. Энэ нь ангийн
                ерөнхий дунджаас (58.5% дасгал бодоогүй, өөрөөр хэлбэл ердөө 41.5% ашигласан) эрс
                ялгаатай — платформын идэвхтэй хэрэглээ өндөр амжилттай сурагчдын дунд давамгайлж
                байна.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 5. Score bands */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">5. Оноогийн бүлэглэл — эрсдэлтэй бүлгийг тодорхойлох боломж</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            65 сурагчийг бодит Х.оноогоор нь гурван бүлэгт хуваахад тэргүүлэгч, дундаж, эрсдэлтэй
            бүлгүүд ялгарч байна.
          </p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              {SCORE_BANDS.map((b) => (
                <div key={b.label} className="d-flex align-items-center gap-3 mb-3">
                  <span
                    className={`badge bg-${b.variant}-subtle text-${b.variant}-emphasis`}
                    style={{ width: 210, flexShrink: 0, textAlign: 'left', fontWeight: 600, padding: '6px 10px' }}
                  >
                    {b.label}
                  </span>
                  <div style={{ flex: 1, height: 22, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      className={`bg-${b.variant}`}
                      style={{ width: `${b.share}%`, height: '100%', borderRadius: 4 }}
                    />
                  </div>
                  <div className="text-muted small text-end" style={{ width: 110, flexShrink: 0 }}>
                    <strong className="text-body">{b.count}</strong> сурагч · {b.share}%
                  </div>
                </div>
              ))}
              <p className="text-muted small mt-3 mb-0">
                Эрсдэлтэй бүлгийн 12 сурагчийн 92% нь нэг ч дасгал бодоогүй байсан бөгөөд ихэнх нь мок
                сорилгод ч цөөн удаа оролцсон — платформын хамрагдалт өсөх тусам энэ бүлэг цаг
                хугацааны туршид багасах боломжтойг өмнөх хэсгүүдийн хамаарал харуулж байна.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 6. Correlations */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">6. Хамаарлын шинжилгээ</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            Платформ дээрх бэлтгэлийн үзүүлэлтүүд бодит ЭЕШ-ийн онооны хоёр төрлийн онооны (А.оноо,
            Х.оноо) аль алитай нь эерэг, дунд зэргийн хүчтэй хамааралтай байна.
          </p>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table className="mb-0" responsive>
                <thead>
                  <tr>
                    <th className="ps-4">Үзүүлэлт</th>
                    <th className="text-end">ЭЕШ А.оноотой корреляц</th>
                    <th className="text-end pe-4">ЭЕШ Х.оноотой корреляц</th>
                  </tr>
                </thead>
                <tbody>
                  {CORRELATIONS.map((c) => (
                    <tr key={c.label}>
                      <td className="ps-4">{c.label}</td>
                      <td className="text-end fw-semibold">{c.aScore}</td>
                      <td className="text-end pe-4 fw-semibold">{c.xScore}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="text-muted small p-4 pt-3 mb-0">
                Мок сорилгын гүйцэтгэл нь бодит гүйцэтгэлийг хамгийн сайн урьдчилан харуулж байгаа
                боловч хамаарал төгс биш (0.61) — платформ дээрх идэвх нь амжилтад чухал ч цорын ганц
                хүчин зүйл биш юм.
              </p>
            </Card.Body>
          </Card>
        </section>

        {/* 7. Regional ranking */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-1">7. Бүсийн жагсаалтад гарсан ахиц</h2>
          <p className="text-muted small mb-3" style={{ maxWidth: 680 }}>
            Платформыг ашигласан хоёр сургуулийн бүсийн (аймгийн) жагсаалт дахь байрлалыг 2025 ба
            2026 оны хооронд харьцуулбал. 2026 оны дүн урьдчилсан байгаа тул эцсийн дүнгээс бага зэрэг
            өөрчлөгдөж болзошгүй.
          </p>
          <Row className="g-3">
            {SCHOOLS.map((s) => (
              <Col md={6} key={s.name}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4">
                    <p className="text-muted text-uppercase small fw-bold mb-3" style={{ letterSpacing: '0.04em' }}>
                      {s.name}
                    </p>
                    <div className="d-flex align-items-center gap-2">
                      <div className="flex-fill text-center bg-light rounded p-3">
                        <div className="text-muted" style={{ fontSize: 11 }}>{s.before.year}</div>
                        <div className="h5 fw-bold mb-0">{s.before.rank}</div>
                        <div className="text-muted small">дундаж {s.before.avg}</div>
                      </div>
                      <ArrowRight className="text-success flex-shrink-0" size={20} />
                      <div className="flex-fill text-center bg-light rounded p-3">
                        <div className="text-muted" style={{ fontSize: 11 }}>{s.after.year}</div>
                        <div className="h5 fw-bold mb-0">{s.after.rank}</div>
                        <div className="text-muted small">дундаж {s.after.avg}</div>
                      </div>
                    </div>
                    <p className="text-success fw-semibold small text-center mt-3 mb-0">
                      ▲ 4 байраар ахисан · дундаж оноо {s.delta}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          <p className="text-muted small mt-3 mb-0">
            2025 онд хоёр сургууль хоёул бүсийн дунджаас (494.8) доогуур байсан бол 2026 оны
            урьдчилсан дүнгээр (бүсийн дундаж, өмнөх оны төгсөгчийг хасаад 481.4) хоёулаа дунджаас
            дээгүүр гарсан байна.
          </p>
        </section>

        {/* Data quality note */}
        <section className="mb-5">
          <Card className="border-dashed border-0" style={{ border: '1px dashed #dee2e6' }}>
            <Card.Body className="p-4">
              <h3 className="text-muted text-uppercase small fw-bold mb-3" style={{ letterSpacing: '0.04em' }}>
                Дата чанарын тэмдэглэл
              </h3>
              <ul className="text-muted small mb-0 ps-3">
                <li className="mb-2">2026 оны бүсийн жагсаалт "урьдчилсан дүн" тул эцсийн дүнгээс бага зэрэг зөрүүтэй байж болно.</li>
                <li className="mb-2">Дасгалын хариултын тоо 120-с давсан цөөн тохиолдол ажиглагдсан — давтан оролдлого (retry) тоологдсон эсэхийг тодруулах шаардлагатай.</li>
                <li className="mb-2">Сорилго №03 ба №04-ийн оролцогчийн тоо буурах ёстой атлаа №04-т илүү олон хүн оролцсон нь бүртгэлийн зөрүү байж болзошгүй.</li>
                <li className="mb-0">Цөөн сурагчийн хувьд мок болон бодит дүн хооронд том зөрүү ажиглагдсан (сэтгэл зүйн дарамт, эрүүл мэнд, эсвэл өгөгдлийн дутуу бүртгэл байж болзошгүй) — эдгээрийг нэгтгэсэн тоон дүнд оруулсан ч тус тусад нь баталгаажуулаагүй болно.</li>
              </ul>
            </Card.Body>
          </Card>
        </section>

        {/* Next steps */}
        <section className="mb-5">
          <h2 className="h4 fw-bold mb-3">Дараагийн алхам</h2>
          <Row className="g-3">
            {NEXT_STEPS.map((step, idx) => (
              <Col md={6} key={idx}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="p-4">
                    <div className="text-primary fw-bold small mb-2">{String(idx + 1).padStart(2, '0')}</div>
                    <p className="text-muted small mb-0">{step}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <p className="text-muted small border-top pt-4" style={{ maxWidth: 700 }}>
          Эх сурвалж: MathMinds.club платформын дасгал бодлого, мок сорилгын гүйцэтгэлийн өгөгдөл ба
          12-р ангийн сурагчдын бодитоор өгсөн ЭЕШ-ийн математикийн А.оноо, Х.оноо (2025–2026), 2 сарын
          хугацаанд явагдсан бэлтгэлийн үе шат. Тайланд сургууль, сум, аймгийн нэр болон сурагчийн
          хувийн мэдээллийг зориудаар оруулаагүй болно.
        </p>
      </Container>
    </div>
  );
}
