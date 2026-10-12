// src/pages/OlympiadRosterPage.jsx
// Бүртгүүлсэн оролцогчдын жагсаалт

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Table, Form, Spinner, Alert, Badge, Row, Col, Button } from 'react-bootstrap';
import {
  getRoster, getOlympiad, approveRegistration, removeAdminRegistration, REG_STATUS, fmtRange, fmtDate, registrationCountdown,
} from '../services/olympiadService';
import RegistrationEditModal from '../components/RegistrationEditModal';
import BankTransferReviewModal from '../components/BankTransferReviewModal';
import RosterStats from '../components/olympiad/RosterStats';
import { useAuth } from '../context/AuthContext';

function OlympiadRosterPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [olympiad, setOlympiad] = useState(null);  // бүртгэлийн хугацааг харуулахад
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [school, setSchool] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');  // админ: PAID / PENDING / WAIVED (төлбөрөөс чөлөөлсөн)
  const [onlyMine, setOnlyMine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [reviewTransferId, setReviewTransferId] = useState(null);  // дансаар шилжүүлэг шалгах

  useEffect(() => {
    getRoster(slug)
      .then(setRows)
      .catch(() => setError('Жагсаалт татахад алдаа гарлаа'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    getOlympiad(slug).then(setOlympiad).catch(() => {});  // хугацаа харагдахгүй л болно
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
      && (!status || (status === 'WAIVED' ? r.fee_waived
        : status === 'BANK' ? r.bank_transfer?.status === 'SUBMITTED' && r.status === 'PENDING' : r.status === status))
      && (!s || `${r.full_name} ${r.province} ${r.school}`.toLowerCase().includes(s)));
  }, [rows, q, province, school, category, status, onlyMine]);
  const hasMine = rows.some((r) => r.is_mine);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to={`/olympiads/${slug}`} className="small">← Олимпиад</Link>
      <h3 className="mt-2">Бүртгэлийн жагсаалт <small className="text-muted">({filtered.length}{filtered.length !== rows.length ? ` / ${rows.length}` : ''})</small></h3>
      {olympiad?.registration_start && (() => {
        const c = registrationCountdown(olympiad.registration_start, olympiad.registration_end);
        return (
          <div className="small text-muted mb-3 d-flex flex-wrap align-items-center gap-2">
            <span>Бүртгэл: {fmtRange(olympiad.registration_start, olympiad.registration_end)}</span>
            <Badge bg={c.variant}>{c.text}</Badge>
          </div>
        );
      })()}
      {error && <Alert variant="danger">{error}</Alert>}
      <Row className="g-2 mb-3">
        {user?.is_staff && (
          <Col md>
            <Form.Select aria-label="Төлөв" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Бүх төлөв</option>
              <option value="PAID">{REG_STATUS.PAID[1]}</option>
              <option value="PENDING">{REG_STATUS.PENDING[1]}</option>
              <option value="WAIVED">Төлбөрөөс чөлөөлсөн</option>
              <option value="BANK">Дансаар: шалгах шаардлагатай</option>
            </Form.Select>
          </Col>
        )}
        {categories.length > 0 && (
          <Col md>
            <Form.Select aria-label="Ангилал" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Бүх ангилал</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </Col>
        )}
        <Col md>
          <Form.Select aria-label="Аймаг/Дүүрэг" value={province} onChange={(e) => { setProvince(e.target.value); setSchool(''); }}>
            <option value="">Бүх аймаг/дүүрэг</option>
            {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Select aria-label="Сургууль" value={school} onChange={(e) => setSchool(e.target.value)}>
            <option value="">Бүх сургууль</option>
            {schools.map((n) => <option key={n} value={n}>{n}</option>)}
          </Form.Select>
        </Col>
        <Col md>
          <Form.Control placeholder="Нэр, сургуулиар хайх" value={q} onChange={(e) => setQ(e.target.value)} />
        </Col>
      </Row>
      {hasMine && (
        <Form.Check
          type="switch" id="only-mine" className="mb-3" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)}
          label="Зөвхөн миний бүртгэсэн хүмүүс (өөрөө болон бусдыг)"
        />
      )}
      <RosterStats
        rows={filtered}
        isStaff={!!user?.is_staff}
        onPickCategory={setCategory}
        onPickProvince={(p) => { setProvince(p); setSchool(''); }}
        onPickSchool={(n) => { setProvince(''); setSchool(n); }}
      />
      <Table striped hover size="sm" responsive>
        <thead><tr><th>№</th><th>Овог нэр</th>{user?.is_staff && <th>MMO ID</th>}<th>Аймаг/Дүүрэг</th><th>Сургууль</th><th>Ангилал</th><th>Анги</th>{user?.is_staff && <th>Бүртгэсэн</th>}{user?.is_staff && <th>Бүртгүүлсэн огноо</th>}{user?.is_staff && <th>Төлөв</th>}{user?.is_staff && <th />}</tr></thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={`${r.participant_no}-${i}`}>
              <td>{r.participant_no ?? '-'}</td><td>{r.full_name}{r.full_name_latin && <div className="small text-muted">{r.full_name_latin}</div>}</td>{user?.is_staff && <td>{r.mmo_id ?? '-'}</td>}<td>{r.province}</td><td>{r.school}</td><td>{r.olympiad_category_name ?? '-'}</td><td>{r.olympiad_category_name && r.grade_label === r.olympiad_category_name ? '-' : r.grade_label}</td>
              {user?.is_staff && <td>{r.registered_by_name ?? '-'}</td>}
              {user?.is_staff && <td className="small text-nowrap">{fmtDate(r.created_at)}</td>}
              {user?.is_staff && (
                <td>
                  <Badge bg={REG_STATUS[r.status]?.[0] || 'secondary'}>{REG_STATUS[r.status]?.[1] || r.status}</Badge>
                  {r.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                  {r.bank_transfer && r.status !== 'PAID' && (
                    <Badge bg="light" text="dark" className="border ms-1">{r.bank_transfer.reference}: {r.bank_transfer.status_label}</Badge>
                  )}
                </td>
              )}
              {user?.is_staff && (
                <td className="text-end">
                  <div className="d-flex gap-1 justify-content-end flex-wrap">
                    {r.status === 'PENDING' && (
                      <Button size="sm" variant="outline-success" onClick={() => approve(r)}>Батлах (төлбөргүй)</Button>
                    )}
                    {r.bank_transfer?.status === 'SUBMITTED' && r.status === 'PENDING' && (
                      <Button size="sm" variant="warning" onClick={() => setReviewTransferId(r.bank_transfer.id)}>Дансаар: шалгах</Button>
                    )}
                    {r.bank_transfer?.status === 'AWAITING' && r.status === 'PENDING' && (
                      <Button size="sm" variant="outline-warning" onClick={() => setReviewTransferId(r.bank_transfer.id)}>Дансаар: баталгаажуулах</Button>
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
      {user?.is_staff && (
        <BankTransferReviewModal
          transferId={reviewTransferId}
          onClose={() => setReviewTransferId(null)}
          onDone={async () => { setReviewTransferId(null); setRows(await getRoster(slug)); }}
        />
      )}
    </Container>
  );
}

export default OlympiadRosterPage;
