// src/components/olympiad/RosterStats.jsx
// Бүртгүүлсэн сурагчдын статистик — шүүлттэй жагсаалтаас тооцно; мөр дээр дарвал тухайн шүүлтийг тавина

import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Table, Button } from 'react-bootstrap';
import { REG_STATUS } from '../../services/olympiadService';

const countBy = (rows, key) => {
  const m = new Map();
  rows.forEach((r) => { const k = key(r) || '—'; m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'mn'));
};

function StatTable({ title, data, total, limit, onPick }) {
  const [all, setAll] = useState(false);
  const shown = limit && !all ? data.slice(0, limit) : data;
  return (
    <div>
      <div className="fw-semibold small mb-1">{title} <span className="text-muted">({data.length})</span></div>
      <Table size="sm" borderless className="small mb-1">
        <tbody>
          {shown.map(([k, n]) => (
            <tr key={k}>
              <td>
                {onPick && k !== '—'
                  ? <Button variant="link" size="sm" className="p-0 text-start small" onClick={() => onPick(k)}>{k}</Button>
                  : k}
              </td>
              <td className="text-end text-nowrap" style={{ width: '1%' }}>
                {n} <span className="text-muted">({Math.round((n / total) * 100)}%)</span>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {limit && data.length > limit && (
        <Button variant="link" size="sm" className="p-0 small" onClick={() => setAll((v) => !v)}>
          {all ? 'Хураах' : `Бүгдийг харах (${data.length})`}
        </Button>
      )}
    </div>
  );
}

function RosterStats({ rows, isStaff, onPickCategory, onPickProvince, onPickSchool }) {
  const [open, setOpen] = useState(false);
  const stats = useMemo(() => ({
    categories: countBy(rows, (r) => r.olympiad_category_name),
    grades: countBy(rows, (r) => r.grade_label).sort((a, b) => (parseInt(a[0], 10) || 99) - (parseInt(b[0], 10) || 99)),
    provinces: countBy(rows, (r) => r.province),
    schools: countBy(rows, (r) => r.school),
    statuses: countBy(rows, (r) => (r.fee_waived ? 'Төлбөрөөс чөлөөлсөн' : REG_STATUS[r.status]?.[1] || r.status)),
  }), [rows]);

  if (rows.length === 0) return null;
  const total = rows.length;

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span className="fw-semibold">
          Статистик: {total} сурагч · {stats.provinces.length} аймаг/дүүрэг · {stats.schools.length} сургууль
        </span>
        <Button size="sm" variant="outline-secondary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Хураах' : 'Дэлгэрэнгүй'}
        </Button>
      </Card.Header>
      {open && (
        <Card.Body>
          <Row className="g-4">
            {isStaff && <Col md={6} lg={3}><StatTable title="Төлөв" data={stats.statuses} total={total} /></Col>}
            {stats.categories.length > 1 && (
              <Col md={6} lg={3}><StatTable title="Ангилал" data={stats.categories} total={total} onPick={onPickCategory} /></Col>
            )}
            <Col md={6} lg={3}><StatTable title="Анги" data={stats.grades} total={total} /></Col>
            <Col md={6} lg={3}>
              <StatTable title="Аймаг/Дүүрэг" data={stats.provinces} total={total} limit={10} onPick={onPickProvince} />
            </Col>
            <Col md={6} lg={3}>
              <StatTable title="Сургууль" data={stats.schools} total={total} limit={10} onPick={onPickSchool} />
            </Col>
          </Row>
        </Card.Body>
      )}
    </Card>
  );
}

export default RosterStats;
