// src/components/olympiad/RegistrationGuide.jsx
// Олимпиадын бүртгэлийн алхам алхмаар заавар — төлбөр, дансны тохиргооноос хамааран алхмууд өөрчлөгдөнө.
// Холбоо барих утас зааврын төгсгөлд.

import React from 'react';
import { Accordion } from 'react-bootstrap';

function ContactPhones({ phones }) {
  const list = (phones || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="mt-2 pt-2 border-top">
      <span className="text-muted">Асуух зүйл байвал холбогдох утас: </span>
      {list.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && ', '}
          <a href={`tel:${p.replace(/[^\d+]/g, '')}`} className="fw-semibold">{p}</a>
        </React.Fragment>
      ))}
    </div>
  );
}

function RegistrationGuide({ olympiad, defaultOpen }) {
  const paid = Number(olympiad.fee || 0) > 0;
  const steps = [
    <><strong>Өөрийгөө</strong> эсвэл <strong>өөр сурагч</strong> бүртгүүлэхээ сонгоно.</>,
    <>Өөр сурагч бол сурагчийн <strong>имэйл эсвэл MMO ID</strong>-аар хайна. Олдвол жагсаалтаас сонгоно, олдохгүй бол
      «Шинэ сурагч»-аар мэдээллийг нь бөглөнө. Нэг имэйлийг хэд хэдэн сурагч (ах дүүс) ашиглаж болно.</>,
    <><strong>Латин овог, нэр</strong>-ийг гадаад паспорттой тулгаж шалгаад «Латин нэр зөв гэдгийг шалгасан»-ыг
      чагтална — англиар сертификат хэвлэхэд ашиглана.</>,
    <>Аймаг/дүүрэг, сургууль, <strong>оролцох ангилал</strong>, ангиа сонгоно.</>,
    paid
      ? <>Сурагч бүрийг <strong>«Бүртгэлийн дэвтэрт нэмэх»</strong>-ээр нэмнэ. Олон сурагч бүртгэж байгаа бол бүгдийг
        нэмчихээд төлбөрийг дараа нь нэг дор төлж болно.</>
      : <>«Бүртгүүлэх» товч дарахад бүртгэл шууд баталгаажна.</>,
    paid && (
      <>«Бүртгэлийн дэвтэр»-ээс бүртгэлүүдээ сонгоод <strong>{Number(olympiad.fee).toLocaleString()}₮</strong>-өөр
        (сурагч бүрт) төлнө: <strong>QPay</strong>
        {olympiad.bank_transfer_available && <> эсвэл <strong>дансаар</strong> — гүйлгээний утгад харуулсан
          <strong> OLY-…</strong> кодыг заавал бичиж, шилжүүлсний дараа «Шилжүүлсэн» товчийг дарна</>}.</>
    ),
    paid && <>Төлбөр төлөгдсөн бүртгэл л <strong>баталгаажна</strong> — оролцогчийн дугаар олгогдож, сурагчид имэйл очно.
      Бүртгэл дуусахаас өмнө төлнө үү.</>,
    <>Сурагчид имэйлээр ирсэн link-ээр бүртгэлээ өөрийн MathMinds account-д нэмж, дараа нь оноо, материалаа харна.</>,
  ].filter(Boolean);

  return (
    <Accordion defaultActiveKey={defaultOpen ? 'guide' : undefined} className="mb-3">
      <Accordion.Item eventKey="guide">
        <Accordion.Header>Бүртгэлийн заавар</Accordion.Header>
        <Accordion.Body className="small">
          <ol className="mb-0 ps-3">
            {steps.map((s, i) => <li key={i} className="mb-1">{s}</li>)}
          </ol>
          <ContactPhones phones={olympiad.contact_phone} />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}

export default RegistrationGuide;
