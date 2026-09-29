// src/pages/OlympiadRosterPage.jsx
// Бүртгүүлсэн оролцогчдын жагсаалт

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Table, Form, Spinner, Alert, Badge, Row, Col, Button } from 'react-bootstrap';
import { getRoster, approveRegistration, removeAdminRegistration } from '../services/olympiadService';
import RegistrationEditModal from '../components/RegistrationEditModal';
import { useAuth } from '../context/AuthContext';

function OlympiadRosterPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [school, setSchool] = useState('');
  const [category, setCategory] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getRoster(slug)
      .then(setRows)
      .catch(() => setError('Жагсаалт татахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, [slug]);

  const approve = async (r) => {
    if (!window.confirm(`${r.full_name}-ийн бүртгэлийг төлбөрөөс чөлөөлж баталгаажуулах уу?`)) return;
    try {
      await approveRegistration(r.id);
      setRows(await getRoster(slug)); // дугаар шинээр оноогдсон тул дахин татна
    } catch (err) {
      setError(err.response?.data?.error || 'Баталгаажуулахад алдаа гарлаа');
    }
  };

  // Жагсаалтаас хасах — бүртгэл цуцлагдана (төлбөр, хуудас хадгалагдана; сурагч дахин бүртгүүлж болно)
  const remove = async (r) => {
    if (!window.confirm(`${r.full_name}-ийн бүртгэлийг жагсаалтаас хасах уу? (Бүртгэл цуцлагдана)`)) return;
    try {
      await removeAdminRegistration(r.id);
      setRows((rs) => rs.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(err.response?.data?.error || 'Хасахад алдаа гарлаа');
    }
  };

  const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort((x, y) => x.localeCompare(y, 'mn'));
  const provinces = useMemo(() => uniq(rows.map((r) => r.province)), [rows]);
  // Аймаг сонгосон бол сургуулийн жагсаалт зөвхөн тухайн аймгийнх
  const schools = useMemo(
    () => uniq(rows.filter((r) => !province || r.province === province).map((r) => r.school)),
    [rows, province],
  );

  const categories = useMemo(() => uniq(rows.map((r) => r.olympiad_category_name)), [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!onlyMine || r.is_mine)
      && (!province || r.province === province)
      && (!school || r.school === school)
      && (!category || r.olympiad_category_name === category)
      && (!s || `${r.full_name} ${r.province} ${r.school}`.toLowerCase().includes(s)));
  }, [rows, q, province, school, category, onlyMine]);
  const hasMine = rows.some((r) => r.is_mine);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to={`/olympiads/${slug}`} className="small">← Олимпиад</Link>
      <h3 className="mt-2">Бүртгэлийн жагсаалт <small className="text-muted">({filtered.length}{filtered.length !== rows.length ? ` / ${rows.length}` : ''})</small></h3>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-2 mb-3">
        {categories.length > 0 && (
          <Col md={3}>
            <Form.Select aria-label="Ангилал" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Бүх ангилал</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Col>
        )}
        <Col md={3}>
          <Form.Select aria-label="Аймаг/Дүүрэг" value={province} onChange={(e) => { setProvince(e.target.value); setSchool(''); }}>
            <option value="">Бүх аймаг/дүүрэг</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select aria-label="Сургууль" value={school} onChange={(e) => setSchool(e.target.value)}>
            <option value="">Бүх сургууль</option>
            {schools.map((n) => <option key={n} value={n}>{n}</option>)}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Control placeholder="Нэр, сургуулиар хайх" value={q} onChange={(e) => setQ(e.target.value)} />
        </Col>
      </Row>
      {hasMine && (
        <Form.Check
          type="switch" id="only-mine" className="mb-3" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)}
          label="Зөвхөн миний бүртгэсэн хүмүүс (өөрөө болон бусдыг)"
        />
      )}
      <Table striped hover size="sm" responsive>
        <thead><tr><th>№</th><th>Овог нэр</th>{user?.is_staff && <th>MMO ID</th>}<th>Аймаг/Дүүрэг</th><th>Сургууль</th><th>Ангилал</th><th>Анги</th>{user?.is_staff && <th>Бүртгэсэн</th>}{user?.is_staff && <th>Төлөв</th>}{user?.is_staff && <th />}</tr></thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={`${r.participant_no}-${i}`}>
              <td>{r.participant_no ?? '-'}</td><td>{r.full_name}{r.full_name_latin && <div className="small text-muted">{r.full_name_latin}</div>}</td>{user?.is_staff && <td>{r.mmo_id ?? '-'}</td>}<td>{r.province}</td><td>{r.school}</td><td>{r.olympiad_category_name ?? '-'}</td><td>{r.olympiad_category_name && r.grade_label === r.olympiad_category_name ? '-' : r.grade_label}</td>
              {user?.is_staff && <td>{r.registered_by_name ?? '-'}</td>}
              {user?.is_staff && (
                <td>
                  <Badge bg={r.status === 'PAID' ? 'success' : 'warning'}>{r.status}</Badge>
                  {r.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                </td>
              )}
              {user?.is_staff && (
                <td className="text-end">
                  <div className="d-flex gap-1 justify-content-end flex-wrap">
                    {r.status === 'PENDING' && (
                      <Button size="sm" variant="outline-success" onClick={() => approve(r)}>Батлах (төлбөргүй)</Button>
                    )}
                    <Button size="sm" variant="outline-primary" onClick={() => setEditingId(r.id)}>Засах</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => remove(r)}>Хасах</Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {filtered.length === 0 && <Alert variant="info">Жагсаалт хоосон байна.</Alert>}
      {user?.is_staff && (
        <RegistrationEditModal
          registrationId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={async () => { setEditingId(null); setRows(await getRoster(slug)); }}
        />
      )}
    </Container>
  );
}

export default OlympiadRosterPage;
