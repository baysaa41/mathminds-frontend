// src/pages/PrivacyPage.jsx
// Нууцлалын бодлого хуудас

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
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
            <div className="text-center mb-5">
              <Shield size={48} className="text-success mb-3" />
              <h1 className="h2 fw-bold mb-2">Нууцлалын бодлого</h1>
              <p className="text-muted">Сүүлд шинэчлэгдсэн: 2025 оны 11-р сар</p>
            </div>

            <div className="privacy-content">
              <section className="mb-4">
                <h2 className="h4 mb-3">1. Ерөнхий мэдээлэл</h2>
                <p className="text-muted">
                  MathMinds нь таны хувийн мэдээллийг хамгаалах, нууцлалыг эрхэмлэдэг. Энэхүү
                  нууцлалын бодлого нь бид ямар мэдээлэл цуглуулж, хэрхэн ашиглаж, хамгаалж байгааг
                  тайлбарлана.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">2. Цуглуулах мэдээлэл</h2>
                <p className="text-muted mb-2">Бид дараах төрлийн мэдээллийг цуглуулж болно:</p>

                <h5 className="h6 mt-3 mb-2">2.1 Бүртгэлийн мэдээлэл</h5>
                <ul className="text-muted">
                  <li>Нэр (нэр, эцгийн нэр, овог)</li>
                  <li>Имэйл хаяг</li>
                  <li>Хэрэглэгчийн нэр</li>
                  <li>Нууц үг (шифрлэгдсэн)</li>
                  <li>Үүрэг (сурагч/багш/эцэг эх)</li>
                </ul>

                <h5 className="h6 mt-3 mb-2">2.2 Профайлын мэдээлэл</h5>
                <ul className="text-muted">
                  <li>Профайл зураг</li>
                  <li>Био/танилцуулга</li>
                  <li>Төрсөн огноо</li>
                  <li>Холбоо барих мэдээлэл</li>
                </ul>

                <h5 className="h6 mt-3 mb-2">2.3 Үйл ажиллагааны мэдээлэл</h5>
                <ul className="text-muted">
                  <li>Нийтлэл, сэтгэгдэл, хариулт</li>
                  <li>Бодсон бодлого, өгсөн тестийн үр дүн</li>
                  <li>Олсон зоос, амжилт</li>
                  <li>Элссэн клубууд</li>
                </ul>

                <h5 className="h6 mt-3 mb-2">2.4 Техникийн мэдээлэл</h5>
                <ul className="text-muted">
                  <li>IP хаяг</li>
                  <li>Хөтчийн төрөл</li>
                  <li>Төхөөрөмжийн мэдээлэл</li>
                  <li>Нэвтэрсэн огноо, цаг</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">3. Мэдээлэл ашиглах арга зам</h2>
                <p className="text-muted mb-2">Бид таны мэдээллийг дараах зорилгоор ашиглана:</p>
                <ul className="text-muted">
                  <li>Үйлчилгээ үзүүлэх, хэрэглэгчийн туршлага сайжруулах</li>
                  <li>Контент санал болгох, персонализацийн</li>
                  <li>Статистик, тайлан гаргах</li>
                  <li>Мэдэгдэл илгээх (тохиргоонд нийцүүлэн)</li>
                  <li>Аюулгүй байдал хангах, хууль ёсоор ажиллах</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">4. Мэдээлэл хуваалцах</h2>
                <p className="text-muted mb-2">
                  Бид таны хувийн мэдээллийг гуравдагч этгээдэд борлуулахгүй. Гэвч дараах тохиолдолд
                  хуваалцаж болно:
                </p>
                <ul className="text-muted">
                  <li>
                    <strong>Хэрэглэгчдийн хооронд:</strong> Та нийтлэсэн контент, профайлын нийтийн
                    мэдээлэл бусад хэрэглэгчдэд харагдана
                  </li>
                  <li>
                    <strong>Үйлчилгээ үзүүлэгчид:</strong> Hosting, analytics, төлбөрийн системтэй
                    хамтрагчид (AWS, QPay гэх мэт)
                  </li>
                  <li>
                    <strong>Хууль эрх зүйн шаардлага:</strong> Шүүхийн шийдвэр, эрх бүхий
                    байгууллагын хүсэлтээр
                  </li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">5. Мэдээлэл хадгалах хугацаа</h2>
                <p className="text-muted">
                  Бид таны мэдээллийг үйлчилгээ үзүүлэхэд шаардлагатай хугацаанд хадгална. Та
                  бүртгэлээ устгавал ихэнх хувийн мэдээллийг устгах боловч зарим статистик, архивын
                  өгөгдөл үлдэж болно.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">6. Аюулгүй байдал</h2>
                <p className="text-muted">
                  Бид таны мэдээллийг хамгаалахын тулд дараах арга хэмжээ авдаг:
                </p>
                <ul className="text-muted">
                  <li>Нууц үг шифрлэлт (bcrypt hashing)</li>
                  <li>HTTPS протокол ашиглах</li>
                  <li>Нэвтрэх эрхийн удирдлага (JWT token)</li>
                  <li>Өгөгдлийн санг хамгаалсан серверт байршуулах</li>
                  <li>Тогтмол аюулгүй байдлын шинжилгээ</li>
                </ul>
                <p className="text-muted mt-2">
                  Гэсэн хэдий ч 100% аюулгүй гэсэн систем байхгүй гэдгийг анхаарна уу.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">7. Таны эрх</h2>
                <p className="text-muted mb-2">Та өөрийн хувийн мэдээллийн талаар дараах эрхтэй:</p>
                <ul className="text-muted">
                  <li>
                    <strong>Харах эрх:</strong> Профайл хуудсан дээрээс өөрийн мэдээллээ харах
                  </li>
                  <li>
                    <strong>Засварлах эрх:</strong> Профайл засварлах хуудсанаас мэдээллээ шинэчлэх
                  </li>
                  <li>
                    <strong>Устгах эрх:</strong> Бүртгэлээ устгах (тохиргооноос)
                  </li>
                  <li>
                    <strong>Татгалзах эрх:</strong> Мэдэгдэл, имэйл хүлээн авахаас татгалзах
                  </li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">8. Cookies ба хянах технологи</h2>
                <p className="text-muted">
                  Бид cookie болон localStorage ашиглан таны нэвтрэх горимыг (JWT token) хадгална.
                  Та хөтчийнхөө тохиргооноос cookie-г идэвхгүй болгож болно.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">9. Хүүхдийн нууцлал</h2>
                <p className="text-muted">
                  Манай платформыг бүх насны хүмүүс ашиглаж болно. Гэвч 13 нас хүрээгүй хүүхдээс
                  эцэг эхийн зөвшөөрөл шаарддаг. Эцэг эхчүүд хүүхдийнхээ өгөгдлийг хянах, устгах
                  эрхтэй.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">10. Өөрчлөлт</h2>
                <p className="text-muted">
                  Бид энэхүү нууцлалын бодлогыг шинэчилж болно. Томоохон өөрчлөлтийн тухай имэйлээр
                  мэдэгдэнэ. "Сүүлд шинэчлэгдсэн" огноог шалгана уу.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">11. Холбоо барих</h2>
                <p className="text-muted">
                  Нууцлалын талаар асуулт, санал байвал бидэнтэй холбогдоно уу. Та мөн өөрийн
                  өгөгдлийн талаар лавлах, засварлах, устгах хүсэлт гаргаж болно. Асуулт гарвал
                  бидэнтэй baysa@mathminds.club хаягаар холбогдоно уу.
                </p>
              </section>
            </div>

            <hr className="my-4" />

            <div className="text-center text-muted small">
              <p className="mb-0">Таны мэдээлллийн нууцлал бидний нэн тэргүүний зорилго.</p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
