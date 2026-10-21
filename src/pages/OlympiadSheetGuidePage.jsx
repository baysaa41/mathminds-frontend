// src/pages/OlympiadSheetGuidePage.jsx
// Бодолтын хуудас бөглөх заавар: хуудасны хэсгүүд, зөв бөглөх алхам, бодит скан дээрх нийтлэг алдаа, шалгах жагсаалт

import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Card, Col, Container, Form, Row } from 'react-bootstrap';

const IMG = '/olympiad-guide';

const Pic = ({ src, alt, caption, tag, w = 760, h = 229 }) => (
  <figure className="m-0">
    <img src={`${IMG}/${src}.jpg`} alt={alt} width={w} height={h} loading="lazy" className="img-fluid border rounded bg-white" />
    {caption && (
      <figcaption className="small text-muted mt-1">
        {tag === 'ok' && <Badge bg="success" className="me-1">ЗӨВ</Badge>}
        {tag === 'no' && <Badge bg="danger" className="me-1">АЛДАА</Badge>}
        {caption}
      </figcaption>
    )}
  </figure>
);

const How = ({ children }) => (
  <Alert variant="success" className="py-2 px-3 small mb-0"><strong>Зөв:</strong> {children}</Alert>
);

const Mistake = ({ title, stat, children }) => (
  <article className="border-top pt-4 mb-4">
    <h3 className="h5 fw-bold mb-1"><Badge bg="danger" className="me-2 align-middle">АЛДАА</Badge>{title}</h3>
    <p className="small text-muted mb-2">{stat}</p>
    <div className="d-flex flex-column gap-3">{children}</div>
  </article>
);

const LEGEND = [
  ['1', 'Оролцогчийн мэдээлэл', 'Овог, нэр, ангилалаа бичнэ.'],
  ['2', 'Бодлого', 'Энэ хуудсан дээр бодож буй бодлогын дугаарыг будна.'],
  ['3', 'Хуудас', 'Тухайн бодлогын хэддэх хуудас болохыг будна.'],
  ['4', 'Хяналтын хэсэг', 'Таны хувийн код. Гар бүү хүр.'],
];

const CHECKS = [
  ['Цаас бүр дээр овог, нэр, ангилал бичсэн.'],
  ['Цаас бүр дээр нэг л бодлого бичсэн, бодлогын нэг бөмбөлөг дүүрэн буджээ.'],
  ['Хуудасны дугаар бодлого бүр дээр 1-ээс эхэлсэн (бодлого 2-ын эхний цаас бас хуудас 1).'],
  ['Хар эсвэл хөх тосон бал, бөмбөлөг бүхлдээ дүүрсэн (дугуйлсан, цайвар биш).'],
  ['Хяналтын хэсэгт гар хүрээгүй. Нэмэлт хуудсанд 6 нүдийг яг дуурайлсан.'],
  ['Энгийн цаас хавсаргаагүй, бүх цаас олимпиадын хуудас.'],
];

function OlympiadSheetGuidePage() {
  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <Link to="/olympiads" className="small">← Олимпиадууд</Link>
      <h1 className="h2 fw-bold mt-2">Бодолтын хуудас бөглөх заавар</h1>
      <p className="text-muted fs-5 mb-3" style={{ maxWidth: '62ch' }}>
        Хуудас бүрийг скан хийж, бодлого болон хуудасны дугаараар нь компьютер өөрөө ялгадаг. Дугаарыг зөв будахад таны бодолт зөв бодлого дээр, зөв дарааллаар засагчид очно.
      </p>
      <Alert variant="info" className="mb-4">
        <strong>Алдсан ч хуудас алга болохгүй.</strong> Бүх хуудас хадгалагдсан байгаа. Дугаарыг буруу будвал хуудас «ноорог» болж, дараа нь шилжүүлэх хүсэлт өгч засна. Гэхдээ эхнээс нь зөв будсан нь хамгийн хурдан.
      </Alert>

      <section className="mb-5">
        <h2 className="h4 fw-bold border-top border-dark border-2 pt-3">Хуудасны 4 хэсэг</h2>
        <Pic src="fig_main" alt="Үндсэн бодолтын хуудасны толгой: 1 оролцогчийн мэдээлэл, 2 бодлого, 3 хуудас, 4 хяналтын хэсэг" w={1100} h={243}
             caption="Үндсэн хуудас. Хяналтын хэсгийн хар нүднүүд (код) хэвлэгдсэн байдаг." />
        <Row as="ul" className="list-unstyled g-3 my-2">
          {LEGEND.map(([n, t, d]) => (
            <Col as="li" key={n} xs={12} sm={6} className="d-flex gap-2">
              <span className="flex-none rounded-circle bg-danger text-white fw-bold text-center" style={{ width: 26, height: 26, lineHeight: '26px', flex: 'none' }}>{n}</span>
              <span><strong>{t}.</strong> {d}</span>
            </Col>
          ))}
        </Row>
        <Pic src="fig_extra" alt="Нэмэлт хоосон хуудасны толгой: хяналтын хэсэг хоосон" w={1100} h={243}
             caption="Нэмэлт (хоосон) хуудас. Хяналтын хэсэг хоосон байдаг. Үндсэн хуудасныхаа 6 нүдийг яг дуурайлган будна (4-р алхам)." />
      </section>

      <section className="mb-5">
        <h2 className="h4 fw-bold border-top border-dark border-2 pt-3">Зөв бөглөх 4 алхам</h2>
        <ol className="d-flex flex-column gap-3 ps-3 mb-3" style={{ maxWidth: '66ch' }}>
          <li>Харандаа биш, <strong>хар эсвэл хөх тосон балаар</strong> бөглө. Овог, нэр, ангилалаа бичнэ.</li>
          <li><strong>БОДЛОГО:</strong> одоо бодож буй бодлогынхоо дугаарыг <strong>нэг л бөмбөлөг, дүүрэн, бүдүүн</strong> буд.</li>
          <li><strong>ХУУДАС:</strong> тухайн бодлогын <strong>хэддэх хуудас</strong> болохыг буд. <strong className="text-primary">Бодлого бүр дээр 1-ээс шинээр эхэлнэ.</strong> Нэг бодлогод 9-өөс олон хуудас бол 8+1 (9-р хуудас), 8+2 (10-р хуудас) гэж хоёр бөмбөлөг буд.</li>
          <li><strong>ХЯНАЛТЫН ХЭСЭГ:</strong> үндсэн хуудсан дээр юу ч бүү хий. Хоосон нэмэлт хуудас авсан бол үндсэн хуудасныхаа <strong>6 нүдийг яг дуурайлган</strong> будаж, бодлого, хуудасны дугаараа мөн буд.</li>
        </ol>
        <Row className="g-3">
          <Col xs={12} md={6}><Pic src="ok_black" alt="Хар балаар дүүрэн будсан бодлого 1, хуудас 1" tag="ok" caption="Хар бал: бодлого 1, хуудас 1. Нэг бөмбөлөг, дүүрэн." /></Col>
          <Col xs={12} md={6}><Pic src="ok_blue" alt="Хөх балаар дүүрэн будсан бодлого 1, хуудас 1" tag="ok" caption="Хөх бал: бодлого 1, хуудас 1." /></Col>
        </Row>
      </section>

      <section className="mb-4">
        <h2 className="h4 fw-bold border-top border-dark border-2 pt-3">Нийтлэг алдаа</h2>
        <p className="text-muted small mb-4">
          Ираны геометрийн 13-р олимпиадын скан хийсэн 377 оролцогчийн 1,300 орчим хуудсанд тулгарсан алдаанууд. Зургууд бодит хуудаснаас (зөвхөн бөмбөлөг ба хяналтын хэсэг, нэргүй) авсан.
        </p>

        <Mistake title="Хуудасны дугаарыг бүх бодлогоор үргэлжлүүлэн будах"
                 stat="Хамгийн их тохиолдсон. Бодлогын 1,095 хуудасны 343-т (31%), 163 оролцогчид хуудасны дугаарын анхааруулга гарсан.">
          <p className="mb-0">Бодлого 1-д 1-р хуудас, бодлого 2-д <strong>2</strong>-р хуудас, бодлого 3-д <strong>3</strong>-р хуудас гэж бүх цаасыг үргэлжлүүлэн дугаарласан. Систем «бодлого 2: хуудас 2 байгаа боловч 1 дутуу» гэж анхааруулдаг.</p>
          <Row className="g-3">
            <Col xs={12} md={4}><Pic src="p1_page1" alt="Бодлого 1, хуудас 1" caption="Бодлого 1: хуудас 1" /></Col>
            <Col xs={12} md={4}><Pic src="p2_page2" alt="Бодлого 2, хуудас 2" caption="Бодлого 2: хуудас 2 ✕" /></Col>
            <Col xs={12} md={4}><Pic src="p3_page3" alt="Бодлого 3, хуудас 3" caption="Бодлого 3: хуудас 3 ✕" /></Col>
          </Row>
          <How>бодлого бүрийн эхний цаас <strong>хуудас 1</strong>. Нэг бодлогод хоёр цаас бичсэн бол хоёр дахь нь л хуудас 2.</How>
        </Mistake>

        <Mistake title="Бодлого болон хуудасны дугаарыг сэлгэх" stat="Түгээмэл: цаасны эхний хуудсыг 2, дараагийнхыг 1 гэж будах.">
          <p className="mb-0">Хоёр бодлогод тус бүр нэг хуудас бичсэн ч нэгэнд нь хуудас 2, нөгөөд нь хуудас 1 гэж буджээ. Хуудас алга болоогүй ч «1-р хуудас дутуу» гэсэн хуурамч анхааруулга гарна.</p>
          <Row className="g-3">
            <Col xs={12} md={6}><Pic src="p1_page2" alt="Бодлого 1, хуудас 2" caption="Бодлого 1: хуудас 2 ✕ (нэг л хуудас бичсэн)" /></Col>
            <Col xs={12} md={6}><Pic src="p2_page1" alt="Бодлого 2, хуудас 1" caption="Бодлого 2: хуудас 1 ✓" /></Col>
          </Row>
          <How>нэг бодлогод нэг л цаас бичсэн бол хуудас <strong>1</strong>.</How>
        </Mistake>

        <Mistake title="Бодлого, хуудасны дугаараа будаагүй" stat="40 хуудсанд бодлого, 81 хуудсанд хуудасны дугаар будагдаагүй.">
          <p className="mb-0">Бөмбөлөг хоосон байвал компьютер хуудас хэний, аль бодлогынх болохыг мэдэхгүй. Хуудас «ноорог» болж, админ гараар шалгах хүртэл хойш тавигдана.</p>
          <div style={{ maxWidth: 520 }}><Pic src="unfilled" alt="Бодлого, хуудасны бөмбөлөг огт будагдаагүй" caption="Бодлого, хуудас хоёулаа хоосон ✕" /></div>
          <How>цаас бүр дээр бодлого болон хуудасны нэг бөмбөлгийг буд, дараа нь шалга.</How>
        </Mistake>

        <Mistake title="Нэг хуудсан дээр хоёр бодлого бичих" stat="Хуудас бүр зөвхөн нэг бодлогод хамаарна. Хоёр бодлого бүхий хуудсыг дор хаяж 11 тохиолдолд олсон.">
          <p className="mb-0">Хоёр бодлогыг нэг цаасан дээр бичээд хоёр бөмбөлөг буджээ. Компьютер нэг хуудсыг нэг л бодлогод холбодог тул нөгөө нь дутуу болж харагдана. Доорх жишээнд «3)» ба «4)» нэг цаасан дээр байна.</p>
          <Row className="g-3">
            <Col xs={12} md={6}><Pic src="two_problems" alt="Бодлого 1 ба 2 хоёулаа будагдсан" caption="Хоёр бодлого зэрэг будсан ✕" /></Col>
            <Col xs={12} md={6}><Pic src="two_on_one_body" w={620} h={880} alt="Нэг хуудсан дээр бодлого 3 ба 4" caption="Нэг цаасан дээр «3)» ба «4)» ✕" /></Col>
          </Row>
          <How>бодлого бүрийг <strong>тусдаа цаасан дээр</strong> эхэл. Нэг цаас = нэг бодлого.</How>
        </Mistake>

        <Mistake title="Дугуйлсан, дарсан, цайвар будсан" stat="Компьютер зөвхөн хангалттай харанхуй, дүүрэн нүдийг таньдаг.">
          <Row className="g-3">
            <Col xs={12} sm={6} lg={3}><Pic src="circled" alt="Бөмбөлгийг дүүргэхийн оронд тойруулсан" caption="Тойруулсан ✕" /></Col>
            <Col xs={12} sm={6} lg={3}><Pic src="pink" alt="Цайвар ягаан балаар будсан" caption="Цайвар ягаан бал ✕" /></Col>
            <Col xs={12} sm={6} lg={3}><Pic src="pencil" alt="Цайвар харандаагаар будсан" caption="Цайвар харандаа ✕" /></Col>
            <Col xs={12} sm={6} lg={3}><Pic src="scribbled" alt="Дарж үгүйсгэсэн, хоёр бөмбөлөг будагдсан" caption="Дарж үгүйсгэсэн ✕" /></Col>
          </Row>
          <How>хар эсвэл хөх тосон балаар бөмбөлгийг <strong>бүхэлд нь дүүргэ</strong>. Алдсан бол шинэ цаас аваад дахин бөглө, дарж болихгүй.</How>
        </Mistake>

        <Mistake title="Хяналтын хэсэгт гар хүрэх" stat="8 хуудасны хяналтын хэсэг кодтой таараагүй тул таниулж чадаагүй.">
          <p className="mb-0">Хяналтын хэсэг нь таны хувийн код. Нэмж будах эсвэл арилгавал код өөрчлөгдөж хуудас хэний болохыг олохгүй болно. Хоосон нэмэлт хуудсан дээр 6 нүдийг дутуу эсвэл илүү будах нь мөн адил.</p>
          <div style={{ maxWidth: 520 }}><Pic src="control" alt="Хяналтын хэсэгт илүү нүд будагдсан" caption="Хяналтын хэсэгт нүд нэмж будсан ✕" /></div>
          <How>үндсэн хуудсанд хэвлэсэн нүднээс өөр юу ч бүү буд. Нэмэлт хуудсан дээр үндсэн хуудасныхаа 6 нүдийг ялгаагүй дуурайлга.</How>
        </Mistake>

        <Mistake title="Толгойгүй энгийн цаас хавсаргах" stat="60 орчим хуудас (4.6%) бодолтын хуудасны толгойгүй, энгийн цаас байсан.">
          <p className="mb-0">Толгойгүй цаас нь хэний хуудас болохыг ямар ч тэмдэг заадаггүй. Компьютер зөвхөн урд нь тааралдсан хуудсанд л хавсаргадаг тул алдаа гарах нь элбэг.</p>
          <div style={{ maxWidth: 520 }}><Pic src="plain_paper" alt="Хуудасны толгой байхгүй энгийн цаас" caption="Хуудасны толгой (бөмбөлөг, хяналтын хэсэг) огт байхгүй ✕" /></div>
          <How>бодолт дуусвал энгийн цаас биш, <strong>хоосон нэмэлт хуудас</strong> аваад толгойг нь бөглө.</How>
        </Mistake>
      </section>

      <section className="mb-5">
        <h2 className="h4 fw-bold border-top border-dark border-2 pt-3">Хуудсаа өгөхийн өмнө шалга</h2>
        <div className="d-flex flex-column gap-2">
          {CHECKS.map(([text], i) => (
            <Card key={text} body className="py-2">
              <Form.Check type="checkbox" id={`sheet-check-${i}`} label={text} />
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="h4 fw-bold border-top border-dark border-2 pt-3">Алдсан бол яах вэ</h2>
        <p style={{ maxWidth: '66ch' }}>Скан хийсний дараа MathMinds дээр өөрийн материалаа харж болно. Хуудас «ноорог» хэсэгт гарвал өөрөө бодлогоо сонгож шилжүүлэх хүсэлт өгнө.</p>
        <ol className="ps-3 d-flex flex-column gap-2" style={{ maxWidth: '66ch' }}>
          <li><Link to="/my-olympiads">Миний олимпиадууд</Link> → өөрийн бүртгэл → <strong>Материал</strong> таб.</li>
          <li><strong>«Бодлого нь тодорхойгүй хуудас»</strong> хэсэгт таных гэдэг нь тодорхой, гэхдээ аль бодлогынх нь танигдаагүй хуудас гарна. Бодлогоо сонгоод <strong>Хүсэлт</strong> дарна.</li>
          <li>Админ шалгаж баталмагц хуудас тэр бодлогын хуудас болно. Татгалзвал тайлбар харагдана, дахин хүсэлт өгч болно.</li>
        </ol>
        <p className="mb-0">Асуудал гарвал овог нэр, оролцогчийн дугаар, бодлогын дугаараа бичиж <strong>admin@mathminds.club</strong> хаяг руу бичнэ үү.</p>
      </section>

      <p className="small text-muted border-top pt-3">
        Тоо баримт: «Ираны геометрийн 13-р олимпиад»-ын скан хийсэн бодолтын хуудаснаас (377 оролцогч). Зургийн нэр, овгийг тайрч хассан.
      </p>
    </Container>
  );
}

export default OlympiadSheetGuidePage;
