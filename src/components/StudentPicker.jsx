// src/components/StudentPicker.jsx
// Имэйлээр олдсон сурагчдаас (нэр далдлагдсан) сонгох, эсвэл «Шинэ сурагч».
// candidates: [{id, masked_name, grade, school, phone_tail, has_account, already_registered}]

import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';

function StudentPicker({ candidates, value, onChange }) {
  return (
    <ListGroup className="mb-2">
      {candidates.map((c) => (
        <ListGroup.Item
          key={c.id} action type="button" disabled={c.already_registered} active={value === c.id}
          onClick={() => onChange(c.id)} className="d-flex justify-content-between align-items-center"
        >
          <div>
            <div className="fw-semibold">{c.masked_name}</div>
            <div className="small">
              {[c.grade && `${c.grade}-р анги`, c.school, c.phone_tail && `Утас: ${c.phone_tail}`].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="text-end">
            {c.already_registered && <Badge bg="secondary">Энэ олимпиадад бүртгэгдсэн</Badge>}
            {!c.already_registered && c.has_account && <Badge bg="light" text="dark" className="border">Account-тай</Badge>}
          </div>
        </ListGroup.Item>
      ))}
      <ListGroup.Item action type="button" active={value === 'new'} onClick={() => onChange('new')}>
        <span className="fw-semibold">+ Шинэ сурагч</span>
        <span className="small ms-2">(жагсаалтад байхгүй)</span>
      </ListGroup.Item>
    </ListGroup>
  );
}

export default StudentPicker;
