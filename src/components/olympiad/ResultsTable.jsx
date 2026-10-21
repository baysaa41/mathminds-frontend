// src/components/olympiad/ResultsTable.jsx
// Дүнгийн хуудас: ангилал бүрээр байр, бодлого бүрийн оноо. highlightId — тухайн бүртгэлийн мөрийг тодруулна

import React from 'react';
import { Card, Table, Badge } from 'react-bootstrap';
import { fmtScore } from '../../services/olympiadService';

function ResultsTable({ categories, problemCount, highlightId }) {
  if (!categories?.length) return <div className="text-muted small">Баталгаажсан оролцогч алга.</div>;
  return categories.map((g) => {
    const problems = Array.from({ length: g.problem_count ?? problemCount }, (_, i) => i + 1);  // ангилал бүр өөр бодлоготой
    return (
    <Card key={g.category || '-'} className="mb-3">
      <Card.Header className="d-flex justify-content-between">
        <strong>{g.category || 'Ангилалгүй'}</strong>
        <span className="small text-muted">{g.ranked_count} оролцогч</span>
      </Card.Header>
      <div className="table-responsive">
        <Table size="sm" hover className="mb-0 align-middle">
          <thead>
            <tr>
              <th style={{ width: 56 }}>Байр</th>
              <th style={{ width: 64 }}>№</th>
              <th>Овог нэр</th>
              <th className="d-none d-md-table-cell">Сургууль</th>
              {problems.map((n) => <th key={n} className="text-center">P{n}</th>)}
              <th className="text-center">Нийт</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.registration_id} className={r.registration_id === highlightId ? 'table-warning fw-semibold' : ''}>
                <td>{r.rank ?? <Badge bg="light" text="dark">Ирээгүй</Badge>}</td>
                <td>{r.participant_no}</td>
                <td>{r.full_name}</td>
                <td className="d-none d-md-table-cell small">{r.school}</td>
                {r.scores.map((s, i) => <td key={i} className="text-center">{fmtScore(s)}</td>)}
                <td className="text-center fw-semibold">{r.rank === null ? '–' : fmtScore(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
    );
  });
}

export default ResultsTable;
