// src/components/olympiad/GradingTeamPanel.jsx
// Координаторын баг: хэрэглэгч нэмэх, бодлого оноох (засагч / ахлагч), гол координатор томилох, хэн хэдийг тавьсан.
// Гол координатор бүгдийг, бодлогын ахлагч зөвхөн өөрийн ахалдаг бодлогуудын «засагч» оноолтыг өөрчилнө.
// Ангилал бүр өөр бодлоготой тул оноолт ангилал тус бүрээр (problems: {ангилалын id: [бодлого №]}).

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, ListGroup, Spinner, Table } from 'react-bootstrap';
import {
  addGrader, apiErrorText, fmtDate, getGradingTeam, removeGrader, searchGradingUsers, updateGrader,
} from '../../services/olympiadService';

const toggle = (list, n) => (list.includes(n) ? list.filter((x) => x !== n) : [...list, n].sort((a, b) => a - b));

function ProblemChips({ value, all, editable, onChange, variant }) {
  return (
    <div className="d-flex gap-1 flex-wrap">
      {all.map((n) => (
        <Button key={n} size="sm" style={{ minWidth: 34, padding: '0 6px' }} disabled={!editable(n)}
                variant={value.includes(n) ? variant : 'outline-secondary'} onClick={() => onChange(toggle(value, n))}>{n}</Button>
      ))}
    </div>
  );
}

export default function GradingTeamPanel({ slug, isManager, ledByCat }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);

  const load = useCallback(() => getGradingTeam(slug).then(setTeam)
    .catch((e) => setError(apiErrorText(e.response?.data, 'Ачаалахад алдаа гарлаа'))), [slug]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return undefined; }
    const t = setTimeout(() => searchGradingUsers(slug, q.trim()).then(setFound).catch(() => setFound([])), 300);
    return () => clearTimeout(t);
  }, [q, slug]);

  const run = async (fn) => {
    setError(null);
    try { setTeam(await fn()); } catch (e) { setError(apiErrorText(e.response?.data, 'Алдаа гарлаа')); }
  };

  if (!team) return error ? <Alert variant="danger">{error}</Alert> : <Spinner animation="border" size="sm" />;
  const cats = team.categories;
  const multi = cats.length > 1;
  const canAssign = (catId, n) => isManager || (ledByCat[catId] || []).includes(n);
  const range = (c) => Array.from({ length: c.problem_count }, (_, i) => i + 1);
  // Ахлагч шинэ хүнийг өөрийн ахалдаг бодлогуудад (ангилал бүрээр) засагчаар нэмнэ
  const ledAssignment = Object.fromEntries(Object.entries(ledByCat).filter(([, v]) => v.length));

  // Нэг баганы (засагч / ахлагч) ангилал бүрийн бодлогын товчнууд
  const cell = (g, field, variant, editableFor) => cats.map((c) => (
    <div key={c.id} className={multi ? 'mb-1' : ''}>
      {multi && <div className="small text-muted">{c.name}</div>}
      <ProblemChips value={(g[field] || {})[c.id] || []} all={range(c)} editable={(n) => editableFor(c.id, n)} variant={variant}
                    onChange={(v) => run(() => updateGrader(slug, g.id, { [field]: { [c.id]: v } }))} />
    </div>
  ));
  const scoredText = (g) => Object.entries(g.scored).flatMap(([cid, per]) => {
    const name = multi ? `${cats.find((c) => String(c.id) === cid)?.name || ''} ` : '';
    return Object.entries(per).map(([n, count]) => `${name}№${n}: ${count}`);
  }).join(', ');

  return (
    <>
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      <Card className="mb-3">
        <Card.Header>Координатор нэмэх</Card.Header>
        <Card.Body>
          <Form.Control placeholder="Нэр, username эсвэл имэйлээр хайх (2+ тэмдэгт)" value={q} onChange={(e) => setQ(e.target.value)} />
          {found.length > 0 && (
            <ListGroup className="mt-2">
              {found.map((u) => (
                <ListGroup.Item key={u.id} className="d-flex justify-content-between align-items-center">
                  <span>{u.name} <span className="text-muted small">@{u.username} {u.email}</span></span>
                  <Button size="sm" onClick={() => run(async () => {
                    const r = await addGrader(slug, { user_id: u.id, problems: isManager ? {} : ledAssignment });
                    setQ(''); setFound([]);
                    return r;
                  })}>Нэмэх</Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          {!isManager && <div className="small text-muted mt-2">Та шинэ хүнийг зөвхөн өөрийн ахалдаг бодлогод засагчаар нэмнэ.</div>}
          {isManager && multi && <div className="small text-muted mt-2">Ангилал бүр өөр бодлоготой тул бодлогыг ангилал тус бүрээр онооно.</div>}
        </Card.Body>
      </Card>
      <div className="table-responsive">
        <Table size="sm" bordered className="align-middle">
          <thead>
            <tr><th>Координатор</th><th>Засагч (бодлого)</th>{isManager && <th>Ахлагч (бодлого)</th>}<th>Тавьсан оноо</th><th>Сүүлд</th>{isManager && <th />}</tr>
          </thead>
          <tbody>
            {team.graders.map((g) => (
              <tr key={g.id}>
                <td>
                  <div className="fw-semibold">{g.name}</div>
                  <div className="small text-muted">@{g.username}</div>
                  {isManager ? (
                    <Form.Check type="switch" label="Гол координатор" checked={g.is_head}
                                onChange={(e) => run(() => updateGrader(slug, g.id, { is_head: e.target.checked }))} />
                  ) : g.is_head && <Badge bg="dark">Гол</Badge>}
                </td>
                <td>
                  {g.is_head ? <span className="text-muted small">бүх бодлого</span> : cell(g, 'problems', 'primary', canAssign)}
                </td>
                {isManager && (
                  <td>{g.is_head ? null : cell(g, 'lead_problems', 'warning', () => true)}</td>
                )}
                <td className="small">
                  {g.total_scored} {g.total_scored > 0 && <span className="text-muted">({scoredText(g)})</span>}
                </td>
                <td className="small">{g.last_at ? fmtDate(g.last_at) : '—'}</td>
                {isManager && (
                  <td><Button size="sm" variant="outline-danger" onClick={() => { if (window.confirm(`${g.name}-г хасах уу?`)) run(() => removeGrader(slug, g.id)); }}>Хасах</Button></td>
                )}
              </tr>
            ))}
            {!team.graders.length && <tr><td colSpan={6} className="text-muted text-center">Координатор алга.</td></tr>}
          </tbody>
        </Table>
      </div>
    </>
  );
}
