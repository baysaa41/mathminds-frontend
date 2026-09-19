// src/pages/OlympiadPrintPage.jsx
// Сурагч × бодлого бүрийн QR-тай бодолтын хуудас (A4, нэг хуудас = нэг бодлого)

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { getPrintSheets } from '../services/olympiadService';

const css = `
.sheet { page-break-after: always; break-after: page; height: 277mm; padding: 12mm; box-sizing: border-box; border: 1px solid #ddd; margin: 8px auto; width: 190mm; position: relative; background: #fff; color: #000; }
.sheet-head { display: flex; justify-content: space-between; align-items: flex-start; }
.sheet-qr { width: 38mm; height: 38mm; }
.sheet-lines { position: absolute; left: 12mm; right: 12mm; top: 62mm; bottom: 12mm; border: 1px dashed #aaa; }
@media print {
  .no-print { display: none !important; }
  .sheet { border: none; margin: 0; width: auto; }
  @page { size: A4; margin: 0; }
}
`;

function OlympiadPrintPage() {
  const { slug } = useParams();
  const [sheets, setSheets] = useState(null);

  useEffect(() => { getPrintSheets(slug).then(setSheets).catch(() => setSheets([])); }, [slug]);

  if (!sheets) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

  return (
    <div style={{ background: '#eee' }}>
      <style>{css}</style>
      <div className="no-print p-3 d-flex gap-2 align-items-center">
        <Link to={`/admin/olympiads/${slug}`}>← Буцах</Link>
        <button className="btn btn-primary btn-sm" onClick={async () => { await getPrintSheets(slug, true); window.print(); }}>
          Хэвлэх ({sheets.length} хуудас)
        </button>
      </div>
      {sheets.map((s) => (
        <div className="sheet" key={s.id}>
          <div className="sheet-head">
            <div>
              <div style={{ fontSize: '11pt' }}>Дугаар: <strong>{s.participant_no}</strong></div>
              <div style={{ fontSize: '16pt', fontWeight: 700 }}>{s.full_name}</div>
              <div style={{ fontSize: '11pt' }}>{s.school} · {s.grade}-р анги</div>
              <div style={{ fontSize: '20pt', fontWeight: 700, marginTop: 8 }}>Бодлого {s.problem_no}</div>
            </div>
            <img className="sheet-qr" src={s.qr} alt="QR" />
          </div>
          <div className="sheet-lines" />
        </div>
      ))}
      {sheets.length === 0 && <div className="p-5 text-center">Хэвлэх хуудас байхгүй. Эхлээд "Хуудас үүсгэх" дарна уу.</div>}
    </div>
  );
}

export default OlympiadPrintPage;
