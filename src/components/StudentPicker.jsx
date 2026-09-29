// src/components/StudentPicker.jsx
// Имэйл / MMO ID-аар олдсон сурагчид (profile), account-ууд, MMO-гийн хэрэглэгчээс сонгох, эсвэл «Шинэ сурагч».
// candidates: [{id, user_id, source: 'profile'|'user'|'mmo', mmo_id, display_name, grade, school, phone_tail, has_account, already_registered}]
// value/onChange: profile-ийн id (тоо), account бол 'user-<id>', MMO-оос бол 'mmo-<id>', шинэ бол 'new'

import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { candidateKey } from '../services/olympiadService';

function StudentPicker({ candidates, value, onChange }) {
  return (
    <ListGroup className="mb-2">
      {candidates.map((c) => (
        <ListGroup.Item
          key={candidateKey(c)} action type="button" active={value === candidateKey(c)}
          onClick={() => onChange(candidateKey(c))} className="d-flex justify-content-between align-items-center"
        >
          <div>
            <div className="fw-semibold">{c.display_name}</div>
            <div className="small">
              {[c.grade && (c.grade_label || `${c.grade}-р анги`), c.school, c.phone_tail && `Утас: ${c.phone_tail}`, c.mmo_id && `MMO ID: ${c.mmo_id}`]
                .filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="text-end">
            {/* Өөр ангилалд бүртгүүлж болох тул сонгохыг хориглохгүй */}
            {c.already_registered && (
              <Badge bg="secondary">Бүртгэлтэй{c.registered_categories?.length ? `: ${c.registered_categories.join(', ')}` : ''}</Badge>
            )}
            {!c.already_registered && c.has_account && c.source !== 'user' && <Badge bg="light" text="dark" className="border">Account-тай</Badge>}
            {c.source === 'user' && <Badge bg="light" text="dark" className="border">MathMinds account</Badge>}
            {c.source === 'mmo' && <Badge bg="info">MMO-оос</Badge>}
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
