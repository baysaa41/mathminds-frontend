// src/pages/TermsPage.jsx
// Үйлчилгээний нөхцөл хуудас

import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { FileText } from 'lucide-react';

export default function TermsPage() {
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
              <FileText size={48} className="text-primary mb-3" />
              <h1 className="h2 fw-bold mb-2">Үйлчилгээний нөхцөл</h1>
              <p className="text-muted">Сүүлд шинэчлэгдсэн: 2025 оны 11-р сар</p>
            </div>

            <div className="terms-content">
              <section className="mb-4">
                <h2 className="h4 mb-3">1. Үйлчилгээний тухай</h2>
                <p className="text-muted">
                  MathMinds нь математикийн боловсрол, суралцахуйг дэмжих зорилготой онлайн платформ
                  юм. Энэхүү үйлчилгээний нөхцөл нь таны платформыг ашиглахтай холбоотой эрх,
                  үүргийг тодорхойлно.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">2. Хэрэглэгчийн бүртгэл</h2>
                <p className="text-muted mb-2">
                  Платформыг ашиглахын тулд бүртгэл үүсгэх шаардлагатай. Та дараах зүйлсийг зөвшөөрч
                  байна:
                </p>
                <ul className="text-muted">
                  <li>Үнэн зөв мэдээлэл өгөх</li>
                  <li>Нэвтрэх мэдээллээ нууцлах</li>
                  <li>Бүртгэлээрээ хийгдэх бүх үйлдлийг хариуцах</li>
                  <li>Эрх зөрчигдсөн тохиолдолд нэн даруй мэдэгдэх</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">3. Контент ба оюуны өмч</h2>
                <p className="text-muted mb-2">
                  Платформ дээр байршуулсан бүх контент (нийтлэл, бодлого, томьёо, тест гэх мэт)
                  таны өөрийнх хэвээр үлдэнэ. Гэвч та дараах эрхийг MathMinds-д олгож байна:
                </p>
                <ul className="text-muted">
                  <li>Контентыг платформ дээр харуулах, хуваалцах эрх</li>
                  <li>Боловсролын зорилгоор ашиглах эрх</li>
                  <li>Шаардлагатай тохиолдолд хянах, устгах эрх</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">4. Хориглох зүйлс</h2>
                <p className="text-muted mb-2">Платформыг ашиглахдаа дараах зүйлсийг хориглоно:</p>
                <ul className="text-muted">
                  <li>Хууль бус, доромжилсон, заналхийлсэн контент нийтлэх</li>
                  <li>Бусдын эрхийг зөрчих, хууран мэхлэх</li>
                  <li>Вирус, хортой програм тараах</li>
                  <li>Системд халдлага хийх оролдлого</li>
                  <li>Спам, сурталчилгаа хэт их нийтлэх</li>
                </ul>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">5. Зоос ба худалдан авалт</h2>
                <p className="text-muted">
                  Платформ дээрх зоос (gold/silver/bronze) нь виртуал валют юм. Зоосыг бодлогын санд
                  бодлого нэмэх зэргээр платформыг хөгжүүлэхэд оролцох эсвэл худалдан авах
                  боломжтой. Худалдан авсан зоосыг буцаан олгохгүй болохыг анхаарна уу.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">6. Клуб ба гишүүнчлэл</h2>
                <p className="text-muted">
                  Клубын үүсгэгч, админууд нь клубынхаа агуулга, гишүүдийг удирдах бүрэн эрхтэй.
                  MathMinds нь зөрчил гарсан тохиолдолд клубыг хаах эрхтэй.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">7. Үйлчилгээний өөрчлөлт, зогсоох</h2>
                <p className="text-muted">
                  MathMinds нь ямар ч үед үйлчилгээг өөрчлөх, түр хугацаагаар зогсоох эсвэл бүрмөсөн
                  зогсоох эрхтэй. Бид чадах бүхнээ хийж урьдчилан мэдэгдэх болно.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">8. Хариуцлагын хязгаарлалт</h2>
                <p className="text-muted">
                  MathMinds нь үйлчилгээг "байгаа байдлаар ашиглах нөхцөлийн" (as-is) үндсэн дээр
                  өгч байна. Платформын ашиглалтаас үүдэн гарсан аливаа хохирлыг бид хариуцахгүй.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">9. Нөхцлийн өөрчлөлт</h2>
                <p className="text-muted">
                  Бид энэхүү үйлчилгээний нөхцлийг хугацаа хэмжээгээр шинэчлэх эрхтэй. Томоохон
                  өөрчлөлтийн талаар урьдчилан мэдэгдэнэ. Үргэлжлүүлэн ашиглах нь шинэчлэгдсэн
                  нөхцлийг зөвшөөрч байгаа гэсэн үг.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h4 mb-3">10. Холбоо барих</h2>
                <p className="text-muted">
                  Үйлчилгээний нөхцөлтэй холбоотой асуултаа baysa@mathminds.club хаягаар ирүүлнэ уу.
                </p>
              </section>
            </div>

            <hr className="my-4" />

            <div className="text-center text-muted small">
              <p className="mb-0">
                Энэхүү үйлчилгээний нөхцөл MathMinds платформын бүх хэрэглэгчдэд хүчинтэй.
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
