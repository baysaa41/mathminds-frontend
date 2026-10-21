// src/pages/MyOlympiadRegistrationPage.jsx
// Миний сурагчийн нэг олимпиадын бүртгэл: мэдээлэл, хуваарь, төлбөр, оноо, дүн, материал, бодолт хамгаалах

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Table, Button, Badge, Spinner, Alert, Form, Tabs, Tab } from 'react-bootstrap';
import RegistrationPayment from '../components/RegistrationPayment';
import { MyDefenseTab, MyMaterialsTab, MyResultsTab, MyScoresTab } from '../components/olympiad/MyResultTabs';
import useSiteGrades from '../hooks/useSiteGrades';
import { getMeRegistration, updateMeRegistration, paymentRequestFor, transferUnderReview, fmtDate, fmtRange, REG_STATUS,
  apiErrorText, categoryFitsGrade, bestCategoryForGrade } from '../services/olympiadService';

function MyOlympiadRegistrationPage() {
  const { id } = useParams();
  // ?tab=scores|results|materials|defense — tab бүр холбоосоор нээгдэнэ
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'info';
  const [reg, setReg] = useState(null);
  const [error, setError] = useState(null);
  const [payReq, setPayReq] = useState(null);
  const siteGrades = useSiteGrades();
  const [edit, setEdit] = useState(null);  // {olympiad_category, grade} — анги, ангилал засах үед
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [defendProblem, setDefendProblem] = useState(null);  // «Хамгаалах» дарсан бодлого

  const load = useCallback(() => {
    getMeRegistration(id).then(setReg).catch(() => setError('Бүртгэл олдсонгүй'));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!reg) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  const o = reg.olympiad;
  const fee = Number(reg.fee || 0);
  const cats = o.categories || [];
  const editCat = cats.find((c) => String(c.id) === String(edit?.olympiad_category));
  // Анги хязгааргүй; ангилал ангиасаа хамаарна — анги солиход тохирохгүй болсон ангилалыг шилжүүлнэ
  const changeGrade = (grade) => {
    const fits = editCat && categoryFitsGrade(editCat, grade);
    const best = bestCategoryForGrade(cats, grade);
    setEdit({ ...edit, grade, olympiad_category: fits ? edit.olympiad_category : (best ? best.id : edit.olympiad_category) });
  };

  const startEdit = () => {
    setEditError(null);
    setEdit({ olympiad_category: reg.olympiad_category ?? '', grade: reg.grade ?? '' });
  };
  const save = async () => {
    setSaving(true);
    setEditError(null);
    try {
      const noGrade = editCat && editCat.grade_from === null;
      setReg({ ...reg, ...(await updateMeRegistration(reg.id, {
        olympiad_category: edit.olympiad_category === '' ? null : Number(edit.olympiad_category),
        grade: noGrade || edit.grade === '' ? null : Number(edit.grade),
      })) });
      setEdit(null);
    } catch (err) {
      const d = err.response?.data;
      setEditError(apiErrorText(d, 'Хадгалахад алдаа гарлаа'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      {reg.viewing_as_admin ? (
        <Alert variant="warning" className="py-2 small">
          <b>Админ харагдац</b> — {reg.student_name}-ийн яг харж буй хуудас (зөвхөн унших; төлөх, засах, хамгаалах үйлдэл идэвхгүй).
          {' '}<Link to={`/admin/olympiads/${o.slug}`}>← Админ</Link>
        </Alert>
      ) : <Link to="/my-olympiads" className="small">← Миний олимпиадууд</Link>}
      <h3 className="mt-2 mb-0">{o.title}</h3>
      <div className="text-muted mb-3">{reg.student_name}{reg.last_name_latin ? ` · ${reg.last_name_latin} ${reg.first_name_latin}` : ''}</div>

      <Tabs activeKey={tab} onSelect={(k) => setSearchParams(k === 'info' ? {} : { tab: k })} className="mb-3">
        <Tab eventKey="info" title="Мэдээлэл">
      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <Badge bg={REG_STATUS[reg.status][0]}>{REG_STATUS[reg.status][1]}</Badge>
            {reg.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
          </div>
          {reg.status === 'PENDING' && fee > 0 && !reg.viewing_as_admin && (
            transferUnderReview(reg)
              ? <Badge bg="info">Дансаар шилжүүлсэн — админ шалгаж байна ({reg.bank_transfer.reference})</Badge>
              : (
                <Button size="sm" onClick={() => setPayReq(paymentRequestFor(reg))}>
              Бүртгэлийн хураамж төлөх ({fee.toLocaleString()}₮)
                </Button>
              )
          )}
        </Card.Body>
        <Table size="sm" className="mb-0">
          <tbody>
            <tr><td className="text-muted">MMO ID</td><td>{reg.mmo_id ?? '-'}</td></tr>
            {edit ? (
              <tr>
                <td className="text-muted">Ангилал / Анги</td>
                <td>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {cats.length > 0 && (
                      <Form.Select size="sm" style={{ maxWidth: 260 }} value={edit.olympiad_category}
                                   onChange={(e) => setEdit({ ...edit, olympiad_category: e.target.value })}>
                        {/* Анги ≤ дээд хязгаар (өгсөж орж болно) */}
                        {cats.filter((c) => categoryFitsGrade(c, edit.grade) || String(c.id) === String(edit.olympiad_category))
                          .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Form.Select>
                    )}
                    {!(editCat && editCat.grade_from === null) && (
                      <Form.Select size="sm" style={{ maxWidth: 160 }} value={edit.grade}
                                   onChange={(e) => changeGrade(e.target.value)}>
                        <option value="">— Анги —</option>
                        {siteGrades.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </Form.Select>
                    )}
                    <Button size="sm" onClick={save} disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Хадгалах'}</Button>
                    <Button size="sm" variant="link" onClick={() => setEdit(null)}>Болих</Button>
                  </div>
                  {editError && <Alert variant="danger" className="py-1 px-2 mt-2 mb-0 small">{editError}</Alert>}
                </td>
              </tr>
            ) : (<>
              <tr>
                <td className="text-muted">Ангилал</td>
                <td>
                  {reg.olympiad_category_name || '-'}
                  {reg.can_edit && <Button size="sm" variant="link" className="py-0" onClick={startEdit}>Анги, ангилал засах</Button>}
                </td>
              </tr>
              <tr><td className="text-muted">Анги</td><td>{reg.grade ? reg.grade_label : '-'}</td></tr>
            </>)}
            <tr><td className="text-muted">Сургууль</td><td>{reg.school}</td></tr>
            <tr><td className="text-muted">Олимпиадын хугацаа</td><td>{fmtRange(o.exam_start, o.exam_end)}{o.venue ? ` · ${o.venue}` : ''}</td></tr>
            {reg.class_room && <tr><td className="text-muted">Шалгалт өгөх анги</td><td><strong>{reg.class_room}</strong></td></tr>}
            {reg.seat_no && <tr><td className="text-muted">Суудлын дугаар</td><td><strong>{reg.seat_no}</strong></td></tr>}
          </tbody>
        </Table>
      </Card>

      {o.schedule?.length > 0 && (
        <Card className="mb-3">
          <Card.Header>Хуваарь</Card.Header>
          <Table size="sm" className="mb-0">
            <tbody>
              {o.schedule.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.starts_at)}{s.ends_at ? ` – ${fmtDate(s.ends_at)}` : ''}</td>
                  <td><strong>{s.title}</strong>{s.description && <div className="small text-muted">{s.description}</div>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Link to={`/olympiads/${o.slug}`} className="small">Олимпиадын бүртгэл →</Link>
        </Tab>
        <Tab eventKey="scores" title="Миний оноо">
          <MyScoresTab registrationId={reg.id} active={tab === 'scores'}
                       onDefend={(n) => { setDefendProblem(n); setSearchParams({ tab: 'defense' }); }} />
        </Tab>
        <Tab eventKey="results" title="Дүнгийн хуудас">
          <MyResultsTab registrationId={reg.id} active={tab === 'results'} />
        </Tab>
        <Tab eventKey="materials" title="Материал">
          <MyMaterialsTab registrationId={reg.id} active={tab === 'materials'} readOnly={!!reg.viewing_as_admin} />
        </Tab>
        <Tab eventKey="defense" title="Бодолт хамгаалах">
          <MyDefenseTab registrationId={reg.id} active={tab === 'defense'} problemCount={cats.find((c) => c.id === reg.olympiad_category)?.problem_count || o.problem_count}
                        initialProblem={defendProblem} />
        </Tab>
      </Tabs>

      <RegistrationPayment request={payReq} onClose={() => setPayReq(null)} onChanged={load} />
    </Container>
  );
}

export default MyOlympiadRegistrationPage;
