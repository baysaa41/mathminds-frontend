// src/pages/AIGuidePage.jsx
// AI багш нартай хэрхэн харилцах заавар хуудас

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import {
  Bot,
  Lightbulb,
  Sparkles,
  FileText,
  PenTool,
  ListChecks,
  ArrowRightLeft,
  Wand2,
  BookOpen,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Zap,
  ClipboardCheck,
  Tags,
} from 'lucide-react';

/* ── tiny icon circle helper ── */
const IconCircle = ({ Icon, color = 'primary', size = 64, iconSize = 32 }) => (
  <div
    className={`bg-${color} bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3`}
    style={{ width: size, height: size }}
  >
    <Icon size={iconSize} className={`text-${color}`} />
  </div>
);

/* ── numbered step card ── */
const Step = ({ number, title, children }) => (
  <div className="d-flex gap-3 mb-4">
    <div>
      <div
        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
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

const AIGuidePage = () => {
  return (
    <Container className="py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <Bot size={48} className="text-primary mb-3" />
        <h2 className="mb-3">AI багш нартай хэрхэн харилцах заавар</h2>
        <p className="text-muted lead">
          MathMinds платформ дээрх AI-д суурилсан бүх боломжуудыг хэрхэн ашиглах талаар
        </p>
        <Link to="/solver" className="btn btn-primary btn-lg">
          <Zap size={20} className="me-2" />
          AI Шийдэгч нээх
        </Link>
      </div>

      {/* Ерөнхий танилцуулга */}
      <Alert variant="info" className="mb-4 d-flex align-items-start gap-2">
        <Lightbulb size={20} className="mt-1 flex-shrink-0" />
        <div>
          <strong>AI багш нар</strong> нь DeepSeek, Gemini 2.5, GPT-4o загваруудад суурилсан
          бөгөөд бодлого бодох, бодолт шалгах, өгүүлэл бичих, тест бэлдэх зэрэг олон зүйлд
          тусална. AI-ийн хариултыг заавал өөрөө шалгаж, баталгаажуулаарай.
        </div>
      </Alert>

      {/* ── Боломжуудын тойм ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <Sparkles size={20} className="me-2" />
            AI-ийн боломжууд
          </h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-4">
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={Zap} color="primary" />
                <h6>AI Streaming чат</h6>
                <p className="text-muted small mb-0">
                  AI-тай шууд чатлаж, бодлого бодуулна. Хариу бодит цагт (streaming) ирнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={PenTool} color="info" />
                <h6>AI бодолт үүсгэх</h6>
                <p className="text-muted small mb-0">
                  Бодлогод зөвлөгөө (hint) болон бүрэн бодолт автоматаар үүсгэнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={Wand2} color="warning" />
                <h6>Бодолт сайжруулах</h6>
                <p className="text-muted small mb-0">
                  Бодолтыг дэлгэрүүлэх, товчлох, алдаа засах горимуудаар сайжруулна.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={ClipboardCheck} color="secondary" />
                <h6>Бодолтын үнэлгээ</h6>
                <p className="text-muted small mb-0">
                  AI бодолтыг шалгаж, математикийн үнэлгээ (note) үүсгэнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={ArrowRightLeft} color="danger" />
                <h6>Сонголттой болгох</h6>
                <p className="text-muted small mb-0">
                  Энгийн бодлогыг AI ашиглан сонголттой (multiple-choice) бодлого руу хөрвүүлнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={FileText} color="info" />
                <h6>Өгүүлэл бичүүлэх</h6>
                <p className="text-muted small mb-0">
                  Сэдэв өгөхөд AI боловсролын өгүүлэл бичиж, засварлахад тусална.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={Tags} color="success" />
                <h6>Хураангуй, гарчиг</h6>
                <p className="text-muted small mb-0">
                  Бодлогын AI хураангуй, гарчиг, математикийн ангилал автоматаар үүсгэнэ.
                </p>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center p-3">
                <IconCircle Icon={BookOpen} color="warning" />
                <h6>AI хамтарсан бодолт</h6>
                <p className="text-muted small mb-0">
                  AI-тай чатлах хэлбэрээр хамтран бодлого бодно. Багш нарт зориулсан.
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── 1. AI Streaming чат ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <Zap size={20} className="me-2 text-primary" />
            1. AI Streaming чат
            <Badge bg="primary" className="ms-2">
              /solver
            </Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            AI-тай шууд чатлаж, математикийн бодлого бодуулах, тайлбар авах боломжтой.
            Хариу бодит цагт (streaming) ирэх тул хүлээх шаардлагагүй.
          </p>

          <h6 className="mt-3 mb-2">Боломжит загварууд:</h6>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {[
              ['DeepSeek Chat', 'primary'],
              ['DeepSeek Reasoner', 'dark'],
              ['Gemini 2.5 Flash', 'success'],
              ['Gemini 2.5 Pro', 'info'],
              ['GPT-4o', 'warning'],
            ].map(([name, color]) => (
              <Badge key={name} bg={color}>
                {name}
              </Badge>
            ))}
          </div>

          <h6 className="mt-3 mb-2">Ашиглах алхам:</h6>
          <Step number={1} title="Solver хуудас руу орно">
            Цэсний <strong>&quot;AI Шийдэгч&quot;</strong> товчоор <code>/solver</code>{' '}
            хуудас руу орно.
          </Step>
          <Step number={2} title="Загвар сонгоно">
            Dropdown-оос хүссэн AI загвараа сонгоно. DeepSeek Reasoner нь хүнд бодлогод
            илүү тохиромжтой.
          </Step>
          <Step number={3} title="Бодлогоо бичнэ">
            Бодлогын текстээ бичээд илгээнэ. LaTeX бичиглэл дэмжинэ.
          </Step>
          <Step number={4} title="Хариу бодит цагт ирнэ">
            AI хариу streaming хэлбэрээр шууд ирнэ. Хуулах товч ашиглаж болно.
          </Step>

          <Alert variant="light" className="border mt-3 small">
            <strong>Зөвлөгөө:</strong> LaTeX код үүсгэх горим ашиглаж, гаралтыг шууд
            хуулж ашиглах боломжтой.
          </Alert>
        </Card.Body>
      </Card>

      {/* ── 2. AI хамтарсан бодолт ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <BookOpen size={20} className="me-2 text-primary" />
            2. AI хамтарсан бодолт
            <Badge bg="secondary" className="ms-2">
              Багш нар
            </Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Бодлогын дэлгэрэнгүй хуудаснаас <strong>&quot;AI хамтарсан бодолт&quot;</strong>{' '}
            товч дарахад шинэ цонхонд (<code>_blank</code>) нээгдэнэ.
            AI-тай чатлах хэлбэрээр хамтран бодлого бодно.
          </p>

          <h6 className="mt-3 mb-2">Боломжит загварууд:</h6>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {[
              ['Gemini', 'primary'],
              ['GPT-4o', 'success'],
              ['DeepSeek', 'info'],
            ].map(([name, color]) => (
              <Badge key={name} bg={color}>
                {name}
              </Badge>
            ))}
          </div>

          <h6 className="mt-3 mb-2">Боломжит командууд:</h6>
          <Row className="g-2 mb-3">
            {[
              ['Бодлогыг бод', 'AI бүтэн бодолт бичнэ'],
              ['Санаа өг', 'Арга, стратеги санал болгоно'],
              ['Бодолтыг шалга', 'Өмнөх бодолтыг нягтална'],
              ['Эмх цэгцтэй бич', 'Бодолтыг цэгцтэй болгоно'],
              ['Алдааг засна', 'Алдааг олж засна'],
              ['Товч дүгнэлт', 'Товчхон хувилбар гаргана'],
              ['Өөр арга', 'Альтернатив бодолт санал болгоно'],
            ].map(([label, desc]) => (
              <Col xs={6} md={4} lg={3} key={label}>
                <div className="border rounded p-2 h-100">
                  <Badge bg="outline-primary" className="border text-primary mb-1">
                    {label}
                  </Badge>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {desc}
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <p className="small text-muted">
            Та мөн чөлөөтэй бичиж AI-д хүсэлт илгээж болно. Жишээ нь:{' '}
            <em>&quot;Энэ бодлогыг индукцийн аргаар бодож үзээч&quot;</em>.
          </p>

          <Alert variant="light" className="border small">
            <strong>Хадгалах:</strong> Чатын явцад гарсан бодолтыг{' '}
            <strong>&quot;Хадгалах&quot;</strong> самбараар бодлогын бодолт болгон хадгалж болно.
          </Alert>
        </Card.Body>
      </Card>

      {/* ── 4. AI бодолт үүсгэх ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <PenTool size={20} className="me-2 text-info" />
            3. AI бодолт автоматаар үүсгэх
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Бодлогын дэлгэрэнгүй хуудсанд <strong>&quot;AI бодолт&quot;</strong> товч
            дарахад AI зөвлөгөө (hint) болон бүрэн бодолтыг автоматаар үүсгэнэ.
          </p>

          <Step number={1} title="Бодлогын хуудас руу орно">
            <code>/problem/[uuid]</code> хуудсанд очно.
          </Step>
          <Step number={2} title="&quot;AI бодолт&quot; товч дарна">
            AI бодолт үүсгэхийг хүсвэл товч дарна. Хэдэн секундын дотор бодолт бэлэн болно.
          </Step>
          <Step number={3} title="Шалгах, засварлах">
            Үүссэн бодолтыг уншиж, шаардлагатай бол засварлаарай.
          </Step>
        </Card.Body>
      </Card>

      {/* ── 5. Бодолт сайжруулах ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <Wand2 size={20} className="me-2 text-warning" />
            4. Бодолт сайжруулах
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Бодолт засварлах хуудаснаас (<code>/solution/[uuid]/edit</code>) AI-аар сайжруулж
            болно. Гурван горим байна:
          </p>
          <Row className="g-3 mb-3">
            <Col md={4}>
              <Card className="h-100 border-success">
                <Card.Body className="text-center">
                  <Badge bg="success" className="mb-2">
                    Дэлгэрүүлэх
                  </Badge>
                  <p className="small text-muted mb-0">
                    Завсрын алхмууд нэмж, тайлбарыг нарийвчилна. Сурагчдад ойлгомжтой
                    болгоход тохиромжтой.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                  <Badge bg="primary" className="mb-2">
                    Товчлох
                  </Badge>
                  <p className="small text-muted mb-0">
                    Давхардсан тайлбар, шаардлагагүй алхмыг хасч товч болгоно.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-danger">
                <Card.Body className="text-center">
                  <Badge bg="danger" className="mb-2">
                    Алдаа засах
                  </Badge>
                  <p className="small text-muted mb-0">
                    Математикийн алдаа, логикийн цоорхойг олж засна.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Alert variant="light" className="border small">
            <strong>Нэмэлт тайлбар:</strong> Горим сонгохдоо нэмэлт тайлбар бичиж болно.
            Жишээ нь: <em>&quot;3-р алхмыг илүү нарийн тайлбарла&quot;</em>. AI таны тайлбарыг
            харгалзан сайжруулна.
          </Alert>
        </Card.Body>
      </Card>

      {/* ── 5. Сонголттой бодлого болгох ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <ArrowRightLeft size={20} className="me-2 text-danger" />
            5. Сонголттой бодлого болгох
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Энгийн бодлогыг (<em>type: traditional</em>) AI ашиглан сонголттой
            (multiple-choice) бодлого руу хөрвүүлнэ.
          </p>
          <Step number={1} title="Бодлого засварлах хуудас руу орно">
            <code>/problem/[uuid]/edit</code> хуудсанд очно.
          </Step>
          <Step number={2} title="&quot;Сонголттой болгох&quot; товч дарна">
            AI 5 хариулт (1 зөв, 4 буруу) үүсгэж, шинэ сонголттой бодлого нээнэ.
          </Step>
          <Step number={3} title="Шинэ бодлого шалгана">
            Хариултуудыг нягтлан шалгаж, шаардлагатай бол засварлаарай.
          </Step>
        </Card.Body>
      </Card>

      {/* ── 6. Өгүүлэл бичүүлэх ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <FileText size={20} className="me-2 text-info" />
            6. AI-аар өгүүлэл бичүүлэх, сайжруулах
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Өгүүлэл засварлах хуудаснаас (<code>/article/[uuid]/edit</code>) AI-аар контент
            үүсгэж, сайжруулж болно.
          </p>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <div className="border rounded p-3 h-100">
                <h6>
                  <Sparkles size={16} className="me-1 text-warning" />
                  Контент үүсгэх
                </h6>
                <p className="small text-muted mb-0">
                  Сэдэв эсвэл гарчиг өгөхөд AI бүтэн өгүүлэл (гарчиг, хураангуй, агуулга)
                  үүсгэнэ. Хадгалахаасаа өмнө шалгаарай.
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-3 h-100">
                <h6>
                  <Wand2 size={16} className="me-1 text-primary" />
                  Сайжруулах
                </h6>
                <p className="small text-muted mb-0">
                  Одоо байгаа өгүүллийг AI-аар сайжруулна. Юу өөрчлөхийг хүсэж байгаагаа
                  бичнэ. Жишээ нь: <em>&quot;Жишээ нэмж өг&quot;</em>.
                </p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ── 7. Хураангуй, гарчиг ── */}
      <Card className="shadow-sm mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <ListChecks size={20} className="me-2 text-secondary" />
            7. AI хураангуй ба гарчиг үүсгэх
          </h5>
        </Card.Header>
        <Card.Body>
          <p>
            Бодлого засварлах хуудаснаас AI-аар хураангуй, гарчиг, математикийн ангилал
            автоматаар үүсгэнэ. Энэ нь бодлогыг хайх, ангилахад тусална.
          </p>
        </Card.Body>
      </Card>

      {/* ── Анхааруулга ── */}
      <Card className="shadow-sm mb-4 border-warning">
        <Card.Header className="bg-warning bg-opacity-10">
          <h5 className="mb-0 d-flex align-items-center">
            <AlertTriangle size={20} className="me-2 text-warning" />
            Анхаарах зүйлс
          </h5>
        </Card.Header>
        <Card.Body>
          <ul className="mb-0">
            <li className="mb-2">
              <strong>AI алдаа гаргаж болно.</strong> Бодолт, өгүүлэл зэргийг заавал өөрөө
              шалгаж баталгаажуулаарай. Ялангуяа олимпиадын хүнд бодлогуудад AI алдаатай хариу
              өгөх магадлал өндөр.
            </li>
            <li className="mb-2">
              <strong>LaTeX бичиглэл.</strong> AI хариултууд LaTeX форматтай байна. Хэрэв
              томьёо буруу харагдвал засварлах хуудаснаас засаарай.
            </li>
            <li className="mb-2">
              <strong>AI бодолт = &quot;mathminds&quot;.</strong> AI-ийн үүсгэсэн бодолтын
              зохиогч нь &quot;mathminds&quot; гэж тэмдэглэгдэнэ.
            </li>
            <li>
              <strong>Хязгаарлалт.</strong> AI нь зураг, графикийг &quot;уншиж&quot; чаддаггүй
              тул зөвхөн текст/томьёо хэлбэрээр оруулсан бодлогод илүү сайн ажиллана.
            </li>
          </ul>
        </Card.Body>
      </Card>

      {/* ── Түгээмэл асуултууд ── */}
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
              'AI бодолт үүсгэхэд төлбөртэй юу?',
              'Үгүй, гишүүнчлэлийн эрхтэй хэрэглэгчид AI боломжуудыг нэмэлт төлбөргүй ашиглах боломжтой.',
            ],
            [
              'Аль AI загвар илүү сайн вэ?',
              'DeepSeek, Gemini, GPT-4o тус бүр давуу талтай. Олимпиадын бодлогод олон загварыг туршиж үзээрэй.',
            ],
            [
              'AI бодолтыг засварлаж болох уу?',
              'Тийм, AI үүсгэсэн бодолтыг чөлөөтэй засварлаж болно. Засварлах хуудсанд очоод өөрчлөөрэй.',
            ],
            [
              'AI хариу удаан ирвэл?',
              'AI хариу ихэвчлэн 5-15 секундын дотор ирнэ. Хэрэв удаан байвал хуудсаа дахин ачаалаарай.',
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
      <div className="text-center mt-4 mb-3">
        <Link to="/solver" className="btn btn-primary me-2">
          <Zap size={16} className="me-1" />
          AI Streaming чат руу очих
        </Link>
        <Link to="/info/membership-guide" className="btn btn-outline-secondary">
          Гишүүнчлэлийн заавар
        </Link>
      </div>
    </Container>
  );
};

export default AIGuidePage;
