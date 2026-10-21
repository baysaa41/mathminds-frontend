// src/pages/OlympiadDetailPage.jsx
// Олимпиадын мэдээлэл, хуваарь, бүртгэл, төлбөр

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Table, Form, Button, ButtonGroup, ToggleButton, Alert, Spinner, Badge, Row, Col } from 'react-bootstrap';
import RegistrationPayment from '../components/RegistrationPayment';
import StudentPicker from '../components/StudentPicker';
import PublicMaterialsCard from '../components/olympiad/PublicMaterialsCard';
import RegistrationGuide from '../components/olympiad/RegistrationGuide';
import useSiteGrades from '../hooks/useSiteGrades';
import useNow from '../hooks/useNow';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';
import authService from '../services/authService';
import { apiErrorText, cancelRegistration, candidateKey, categoryLabel, categoryFitsGrade, bestCategoryForGrade, getOlympiad, getOlympiadMyRegistrations, approveRegistration, registerForOlympiad, paymentRequestFor, transferUnderReview, getPrefill, getProvinces, lookupStudents, fmtDate, fmtDuration, fmtRange, timeUntil, registrationCountdown } from '../services/olympiadService';
import { toLatin, LATIN_NAME_RE } from '../utils/transliterate';

const EMPTY_FORM = {
  register_for: 'self', waive_fee: false, category_id: '', last_name: '', first_name: '',
  last_name_latin: '', first_name_latin: '', province: '', school: '', grade: '', phone: '', email: '',
};

// Кирилл нэр өөрчлөгдөхөд латиныг дагуулж шинэчилнэ — хэрэглэгч латиныг гараар засаагүй бол.
const syncLatin = (prev, next) => {
  const auto = (k) => !prev[`${k}_latin`] || prev[`${k}_latin`] === toLatin(prev[k]);
  return {
    ...next,
    last_name_latin: auto('last_name') ? toLatin(next.last_name) : next.last_name_latin,
    first_name_latin: auto('first_name') ? toLatin(next.first_name) : next.first_name_latin,
  };
};

// Ангилалгүй олимпиадад сайтын ангиудын дараа нэмэгдэх тусгай сонголтууд
const SPECIAL_GRADE_OPTIONS = [
  { value: 'TEAM_TEACHER', label: 'Багийн багш' },
  { value: 'SHARED_TEACHER', label: 'Дундын багш' },
  { value: 'FREE', label: 'Чөлөөт' },
];

// Сурагчийн анги сонгосон ангилалын хязгаарт орох эсэх. Зөрвөл тайлбар, таарвал ''.
// Ангилалд өгсөж орж болно (доод хязгаараас доош анги), дээд хязгаараас давж болохгүй
const gradeMismatch = (cat, grade) => {
  if (!cat || cat.grade_from === null || !/^\d+$/.test(String(grade))) return '';
  const g = Number(grade);
  return g <= cat.grade_to
    ? '' : `${g}-р анги «${cat.name}» ангилалд оролцох боломжгүй (дээд хязгаар ${cat.grade_to}-р анги).`;
};

// Ангилал сонгоогүй бол ангид тохирох ангилалыг автоматаар санал болгоно. Сонгосон бол (гараар ч, автоматаар ч)
// хэрэглэгчийн сонголтыг хадгална — сольж болно.
const autoCategoryId = (cats, categoryId, grade) => {
  if (categoryId) return categoryId;
  const match = bestCategoryForGrade(cats, grade);
  return match ? String(match.id) : categoryId;
};

const STATUS_LABEL = {
  PENDING: ['warning', 'Төлбөр хүлээгдэж буй'],
  PAID: ['success', 'Бүртгэл баталгаажсан'],
  CANCELED: ['secondary', 'Цуцлагдсан'],
};

function OlympiadDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const siteGrades = useSiteGrades();
  const now = useNow();  // countdown бүртгэлийн хугацаанаас урт зогссон ч зөв байх
  const [olympiad, setOlympiad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oauthError, setOauthError] = useState(null);

  // Зочин: MMO/Google-ээр нэвтэрч, callback-ийн дараа энэ хуудас руу буцна
  const oauthLogin = async (provider) => {
    setOauthError(null);
    setPostLoginRedirect(`/olympiads/${slug}`);
    try {
      await (provider === 'google' ? authService.loginWithGoogle() : authService.login());
    } catch {
      setOauthError(`${provider === 'google' ? 'Google' : 'MMO'} нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.`);
    }
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [info, setInfo] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [payReq, setPayReq] = useState(null);  // төлбөрийн сонголт (QPay / данс)
  const [myRegs, setMyRegs] = useState([]);
  const [paySel, setPaySel] = useState(() => new Set());  // бөөнд төлөх бүртгэлийн id-ууд
  const [confirmCancel, setConfirmCancel] = useState(null);  // цуцлахыг баталгаажуулж буй бүртгэлийн id
  // «Өөр сурагч»: имэйлээр олдсон сурагчид (null — хайгаагүй) ба сонголт (id | 'new' | null)
  const [query, setQuery] = useState('');  // сурагчийн имэйл эсвэл MMO ID
  const [candidates, setCandidates] = useState(null);
  const [picked, setPicked] = useState(null);
  const [looking, setLooking] = useState(false);
  const [needEmail, setNeedEmail] = useState(false);  // MMO/profile-д имэйл байхгүй бол гараар
  const [latinConfirmed, setLatinConfirmed] = useState(false);
  const [myMmoId, setMyMmoId] = useState(null);
  // Сурагч өөр ангилалд бүртгэлтэй — хоёр ангилалд оролцох уу, эсвэл буруу ангилалыг засах уу гэж лавлана
  const [secondCat, setSecondCat] = useState(null);
  const [extraSelf, setExtraSelf] = useState(false);  // өөрийн бүртгэл баталгаажсан ч өөр ангилалд бүртгүүлэх  // «Өөрийгөө бүртгүүлэх»-д харуулах өөрийн MMO ID  // MMO ID-аар бүртгэхэд латин нэрийг баталгаажуулна

  const load = useCallback(async () => {
    try {
      const data = await getOlympiad(slug);
      setOlympiad(data);
      if (!user) return;  // зочин: нэвтрэлт шаардсан дуудлага хийхгүй (401 нь /login руу шилжүүлнэ)
      getOlympiadMyRegistrations(slug).then(setMyRegs).catch(() => setMyRegs([]));
      const r = data.my_registration;
      // «Өөр сурагч» горимд өөрийн мэдээллээр анкетыг бөглөхгүй (mmo_id бөглөгдвөл өөрийгөө бүртгэнэ)
      if (r) {
        setForm((f) => (f.register_for === 'other' ? f : {
          ...f, category_id: r.olympiad_category ? String(r.olympiad_category) : '', last_name: r.last_name, first_name: r.first_name,
          last_name_latin: r.last_name_latin || '', first_name_latin: r.first_name_latin || '', province: r.province,
          school: r.school, grade: r.category === 'STUDENT' ? String(r.grade ?? '') : r.category, phone: r.phone || '', email: r.email || '',
        }));
      }
      // Хоосон талбарыг нөхнө: өмнөх олимпиадын бүртгэл → өөрийн profile → MMO (MMO ID-тай бол) → account
      getPrefill().then((p) => { setMyMmoId(p.mmo_id || null); return p; }).then((p) => setForm((f) => {
        if (f.register_for === 'other') return f;
        const next = syncLatin(f, {
          ...f,
          last_name: f.last_name || p.last_name || '',
          first_name: f.first_name || p.first_name || '',
          province: f.province || p.province || '',
          school: f.school || p.school || '',
          phone: f.phone || p.phone || '',
          email: f.email || p.email || '',
          grade: f.grade || p.grade || '',
        });
        return {  // өмнөх бүртгэлийн (шалгагдсан) латин нэр автомат хөрвүүлгээс давуу
          ...next,
          category_id: autoCategoryId(data.categories, next.category_id, next.grade),
          last_name_latin: f.last_name_latin || p.last_name_latin || next.last_name_latin,
          first_name_latin: f.first_name_latin || p.first_name_latin || next.first_name_latin,
        };
      })).catch(() => {});
    } catch {
      setError('Олимпиад олдсонгүй');
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getProvinces().then(setProvinces).catch(() => {}); }, []);

  const reg = olympiad?.my_registration;
  const fee = Number(olympiad?.fee || 0);

  const startPayment = (registration) => setPayReq(paymentRequestFor(registration));
  // Бөөнд төлөх: дансаар шилжүүлээд шалгагдаж буйг дахин төлүүлэхгүй
  const payable = (r) => r.status === 'PENDING' && fee > 0 && !transferUnderReview(r);
  const payableRegs = myRegs.filter(payable);
  const selectedPay = payableRegs.filter((r) => paySel.has(r.id));
  const selectedTotal = selectedPay.reduce((sum, r) => sum + Number(r.fee || 0), 0);
  const payableTotal = payableRegs.reduce((sum, r) => sum + Number(r.fee || 0), 0);
  const togglePay = (id) => setPaySel((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAllPay = () => setPaySel(
    selectedPay.length === payableRegs.length ? new Set() : new Set(payableRegs.map((r) => r.id)));
  // Нэг олимпиадын бүртгэлүүд тул дансаар ч (нэг гүйлгээний утга) төлж болно
  const payBulk = () => setPayReq({ ...paymentRequestFor(selectedPay), transferId: null });

  const approve = async (r) => {
    if (!window.confirm(`${r.full_name}-ийн бүртгэлийг төлбөрөөс чөлөөлж баталгаажуулах уу?`)) return;
    setError(null);
    try {
      await approveRegistration(r.id);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Баталгаажуулахад алдаа гарлаа');
    }
  };

  const cancelReg = async (r) => {
    setError(null);
    try {
      await cancelRegistration(r.id);
      setConfirmCancel(null);
      setPaySel((prev) => { const next = new Set(prev); next.delete(r.id); return next; });
      setInfo(`${r.full_name}-ийн бүртгэлийг цуцаллаа.`);
      await load();
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Цуцлахад алдаа гарлаа'));
      setConfirmCancel(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const mismatch = gradeMismatch(selectedCat, form.grade);
    if (mismatch) {
      setError(mismatch);
      return;
    }
    if (forOther && !picked) {
      setError('Имэйл эсвэл MMO ID-аар хайгаад сурагчаа сонгоно уу.');
      return;
    }
    if ((!pickedChosen || latinMode)
        && (!LATIN_NAME_RE.test(form.last_name_latin.trim()) || !LATIN_NAME_RE.test(form.first_name_latin.trim()))) {
      setError('Латин овог, нэрийг зөвхөн латин үсгээр бичнэ үү.');
      return;
    }
    // Латин нэр засах талбар харагдаж буй бүх үед (MMO ID-аар эсвэл гараар бөглөхөд) заавал баталгаажуулна
    if ((latinMode || !pickedChosen) && !latinConfirmed) {
      setError('Латин нэрийг шалгаад «Латин нэр зөв» гэдгийг баталгаажуулна уу.');
      return;
    }
    await send({});
  };

  // extra: {confirm_second_category: true} эсвэл {replace_registration_id: id}
  const send = async (extra) => {
    setBusy(true);
    setError(null);
    setSecondCat(null);
    try {
      const payload = { ...form, ...extra };
      if (!payload.category_id) delete payload.category_id;
      if (!user?.is_staff) delete payload.waive_fee;
      if (noGrade) payload.grade = '';
      if (pickedExisting) {
        payload.student_id = picked;
        if (queryIsMmo) payload.mmo_id = Number(query.trim());  // сонгосон profile-ийг MMO ID-аар шалгана
      }
      if (pickedMmo) payload.mmo_id = Number(picked.slice(4));  // MMO-гийн мэдээллээр profile үүснэ
      if (pickedUser) payload.user_id = Number(picked.slice(5));  // account-ын мэдээллээр profile үүснэ
      if (pickedChosen) {
        // Нэрийг сонгосон сурагчийн profile/MMO-оос авна; латин нэр нь бүртгэгчийн баталгаажуулсан утгаар явна
        ['last_name', 'first_name'].forEach((k) => delete payload[k]);
      }
      const r = await registerForOlympiad(slug, payload);
      await load();
      setExtraSelf(false);
      setLatinConfirmed(false);  // дараагийн бүртгэлд дахин шалгуулна
      if (r.moved) setInfo(`Бүртгэлийг «${r.olympiad_category_name}» ангилал руу заслаа.`);
      else if (!r.is_mine) {
        setInfo(`${r.full_name} (№${r.participant_no ?? '-'}) бүртгэгдлээ. ${r.student_created
          ? 'Шинэ сурагч бүртгэгдлээ.' : 'Өмнөх бүртгэлтэй сурагчтай холбогдлоо.'}`);
      }
      // Өөрийгөө бүртгүүлбэл шууд төлнө; бусдыг бүртгэхэд төлбөрийг хойшлуулж, дараа нь бөөнд нь (нэг нэхэмжлэх /
      // нэг гүйлгээ) төлнө — сурагч бүрт төлбөрийн цонх гаргахгүй
      if (r.status === 'PENDING' && fee > 0 && r.is_mine) startPayment(r);
      else if (r.status === 'PENDING' && fee > 0) {
        setInfo((prev) => `${prev || ''} Төлбөрийг «Бүртгэлийн дэвтэр»-ээс бусадтай нь хамт бөөнд төлж болно.`.trim());
      }
      else if (form.waive_fee) setInfo('Төлбөргүйгээр бүртгэгдэж, баталгаажлаа.');
    } catch (err) {
      const d = err.response?.data;
      if (err.response?.status === 409 && d?.code === 'second_category') {
        setSecondCat(d);
        return;
      }
      if (d?.email && mmoMode) setNeedEmail(true);
      if (d?.existing_candidates) {  // ижил имэйл + овог нэртэй сурагч бий — шинээр үүсгэхгүй, сонгуулна
        setCandidates(d.existing_candidates);
        setPicked(null);
      }
      setError(apiErrorText(d, 'Бүртгэхэд алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  const findStudents = async () => {
    setLooking(true);
    setError(null);
    try {
      const q = query.trim();
      const rows = await lookupStudents(slug, q);
      setForm((f) => ({ ...f, email: q.includes('@') ? q : '' }));
      setCandidates(rows);
      if (rows.length) setPicked(null);
      else pickStudent('new');  // олдоогүй — хоосон маягтаар шинэ сурагч
    } catch (err) {
      const d = err.response?.data;
      setError(d?.query?.[0] || d?.detail || 'Хайхад алдаа гарлаа');
    } finally {
      setLooking(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setName = (k) => (e) => {
    setForm((f) => syncLatin(f, { ...f, [k]: e.target.value }));
    setLatinConfirmed(false);  // нэр өөрчлөгдвөл латин нэр дахин үүснэ — дахин шалгуулна
  };
  const setLatin = (k) => (e) => { set(k)(e); setLatinConfirmed(false); };

  // «Өөр сурагч» горимд өөрийн мэдээлэл үлдэхгүйгээр хоосон анкет; «Өөрийгөө» руу буцахад профайлаас дахин бөглөнө
  const setRegisterFor = (value) => {
    setError(null);
    setInfo(null);
    setForm((f) => ({ ...EMPTY_FORM, register_for: value, category_id: f.category_id }));
    setQuery('');
    setCandidates(null);
    setPicked(null);
    setLatinConfirmed(false);
    if (value === 'self') load();
  };
  // Сурагч сонгоход сургууль, анги, аймаг/дүүргийг бөглөнө (нэр, утас, имэйлийг хадгалах үед сервер нөхнө)
  const pickStudent = (key) => {
    setPicked(key);
    setNeedEmail(false);
    setLatinConfirmed(false);
    if (key === 'new') {
      // Шинэ сурагч: өмнө сонгосон сурагчийн мэдээлэл (латин нэр, сургууль, анги…) үлдэхгүй
      setForm((f) => ({
        ...f, last_name: '', first_name: '', last_name_latin: '', first_name_latin: '', province: '', school: '',
        grade: '', phone: '', email: queryIsEmail ? query.trim() : '',
      }));
      return;
    }
    const c = candidates?.find((x) => candidateKey(x) === key);
    if (!c) return;
    const grade = c.grade ? String(c.grade) : '';
    if (queryIsMmo) {
      // MMO ID-аар: анги MMO-оос тогтмол (засахгүй) — ангилалыг ангид тааруулна, дараа нь сольж болно
      setForm((f) => {
        const current = categories.find((x) => String(x.id) === f.category_id);
        const fits = current && (current.grade_from === null || !gradeMismatch(current, grade));
        return { ...f, school: c.school, province: c.province, grade,
          last_name_latin: c.last_name_latin || toLatin(c.last_name),
          first_name_latin: c.first_name_latin || toLatin(c.first_name),
          category_id: fits ? f.category_id : autoCategoryId(categories, '', grade) };
      });
      return;
    }
    setForm((f) => {
      // Зөвхөн сонгосон сурагчийн мэдээлэл — өмнө сонгосон сурагчийнх үлдэхгүй
      const g = grade;
      const current = categories.find((x) => String(x.id) === f.category_id);
      const keep = current && categoryFitsGrade(current, g) ? f.category_id : '';
      return { ...f, school: c.school || '', province: c.province || '', grade: g,
        last_name_latin: c.last_name_latin || toLatin(c.last_name || ''),
        first_name_latin: c.first_name_latin || toLatin(c.first_name || ''),
        category_id: autoCategoryId(categories, keep, g) };
    });
  };
  const pickedCandidate = candidates?.find((x) => candidateKey(x) === picked);

  const changeQuery = (e) => {
    setQuery(e.target.value);
    setNeedEmail(false);
    setCandidates(null);  // хайлт өөрчлөгдвөл дахин хайна
    setPicked(null);
  };
  const forOther = form.register_for === 'other';
  const queryIsEmail = query.includes('@');
  const queryIsMmo = /^\d+$/.test(query.trim());
  const pickedExisting = forOther && typeof picked === 'number';
  const pickedMmo = forOther && typeof picked === 'string' && picked.startsWith('mmo-');
  const pickedUser = forOther && typeof picked === 'string' && picked.startsWith('user-');
  const pickedChosen = pickedExisting || pickedMmo || pickedUser;  // нэр, холбоо барих мэдээллийг сервер нөхнө
  // MMO ID-аар сонгосон: бүртгэгч зөвхөн ангилал сонгоно; бусад мэдээллийг MMO/profile-оос сервер нөхнө
  const mmoMode = forOther && queryIsMmo && pickedChosen;
  // Имэйл эсвэл MMO ID-аар сонгосон сурагч: бүтэн нэрийг харуулж, латин нэрийг бүртгэгч шалгаж баталгаажуулна
  const latinMode = forOther && pickedChosen;
  const showDetails = !forOther || picked !== null;

  const formShown = !!olympiad?.registration_open && !(reg?.status === 'PAID' && !forOther);
  const categories = olympiad?.categories || [];
  const selectedCat = categories.find((c) => String(c.id) === form.category_id);
  const noGrade = !!selectedCat && selectedCat.grade_from === null; // багш, чөлөөт гэх мэт
  // Анги хязгааргүй (1–12); ангилалын сонголт ангиасаа хамаарна (анги ≤ дээд хязгаар)
  // Сайтын бүх ангийн сонголт (1–12, Оюутан, багш, Сонирхогч); ангилалгүй бол тусгай сонголтууд нэмэгдэнэ
  const gradeOptions = categories.length === 0 ? [...siteGrades, ...SPECIAL_GRADE_OPTIONS] : siteGrades;
  const categoryOptions = categories.filter((c) => categoryFitsGrade(c, form.grade));
  const setGrade = (e) => {
    const grade = e.target.value;
    setForm((f) => {
      const current = categories.find((c) => String(c.id) === f.category_id);
      // Одоогийн ангилал шинэ ангид тохирохгүй бол хамгийн тохирохыг сонгоно
      const keep = current && categoryFitsGrade(current, grade) ? f.category_id : '';
      return { ...f, grade, category_id: autoCategoryId(categories, keep, grade) };
    });
  };
  const setCategory = (e) => {
    setError(null);
    setForm((f) => ({ ...f, category_id: e.target.value }));
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!olympiad) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;

  // now-оос хамаарах утгууд — useNow() шинэчлэгдэх бүрд дахин тооцоологдоно
  const regCountdown = registrationCountdown(olympiad.registration_start, olympiad.registration_end, now);
  const regTimeLeft = timeUntil(olympiad.registration_end, now);
  const examDuration = fmtDuration(olympiad.exam_start, olympiad.exam_end);

  return (
    <Container fluid className="py-4 px-md-4" style={{ maxWidth: 1400 }}>
      <Link to="/olympiads" className="small">← Бүх олимпиад</Link>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mt-2">
        <h3 className="mb-0">{olympiad.title}</h3>
        {user?.is_staff && (
          <div className="d-flex gap-2">
            <Button as={Link} to={`/admin/olympiads/${slug}/edit`} size="sm" variant="outline-primary">Засах</Button>
            <Button as={Link} to={`/admin/olympiads/${slug}`} size="sm" variant="outline-dark">Админ</Button>
          </div>
        )}
      </div>
      {/* Ерөнхий мэдээлэл: олимпиадын хугацаа, газар, хэн оролцох, бүртгэлийн хугацаа, хуваарь */}
      <div className="small mt-1 mb-3">
        <div>
          <span className="text-muted">Олимпиад:</span> {fmtRange(olympiad.exam_start, olympiad.exam_end)}
          {examDuration && ` (${examDuration})`}
          {olympiad.venue ? ` · ${olympiad.venue}` : ''}
        </div>
        {categories.length > 0 && (
          <div>
            <span className="text-muted">Ангилал:</span> {categories.map(categoryLabel).join(', ')}
          </div>
        )}
        <div>
          <span className="text-muted">Бодлого:</span> {olympiad.problem_count}
          {olympiad.max_score_per_problem ? ` · нэг бодлогын дээд оноо ${olympiad.max_score_per_problem}` : ''}
        </div>
        <div>
          <span className="text-muted">Бүртгэл:</span> {fmtRange(olympiad.registration_start, olympiad.registration_end)}
          <Badge bg={regCountdown.variant} className="ms-2">{regCountdown.text}</Badge>
        </div>
        {olympiad.results_published_at && (
          <div>
            <span className="text-muted">Дүн:</span> {fmtDate(olympiad.results_published_at)}{' '}
            {olympiad.results_published ? 'гарсан' : 'гарна'}
            {olympiad.defense_window_hours
              ? ` · гарснаас хойш ${olympiad.defense_window_hours} цаг бодолт хамгаалах хүсэлт гаргана` : ''}
          </div>
        )}
        {olympiad.schedule.map((it) => (
          <div key={it.id}>
            <span className="text-muted">{it.title}:</span> {fmtRange(it.starts_at, it.ends_at)}
            {it.description && <span className="text-muted"> — {it.description}</span>}
          </div>
        ))}
      </div>

      {/* Админ бичсэн тайлбар — өмнө нь зөвхөн олимпиадын жагсаалтад харагддаг байсан */}
      {olympiad.description && (
        <div className="small mb-3" style={{ whiteSpace: 'pre-wrap' }}>{olympiad.description}</div>
      )}

      <PublicMaterialsCard slug={olympiad.slug} />

      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between">
          <span>Бүртгэл</span>
          <span>{fee > 0 ? `Төлбөр: ${fee.toLocaleString()}₮` : 'Үнэгүй'}</span>
        </Card.Header>
        <Card.Body>
          {/* Анх бүртгүүлж буй хүнд нээлттэй, бүртгэлтэй бол хураасан */}
          <RegistrationGuide key={myRegs.length ? 'has-regs' : 'no-regs'} olympiad={olympiad} defaultOpen={myRegs.length === 0} />
          {error && !(formShown && showDetails) && <Alert variant="danger">{error}</Alert>}
          {info && <Alert variant="info" dismissible onClose={() => setInfo(null)}>{info}</Alert>}
          {reg && (
            <Alert variant={STATUS_LABEL[reg.status][0]} className="d-flex justify-content-between align-items-center">
              <span>
                <Badge bg={STATUS_LABEL[reg.status][0]}>{STATUS_LABEL[reg.status][1]}</Badge>
                {reg.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                {reg.participant_no && <> · Дугаар: <strong>{reg.participant_no}</strong></>}
              </span>
              {reg.status === 'PENDING' && fee > 0 && (
                transferUnderReview(reg)
                  ? <Badge bg="info">Дансаар шилжүүлсэн — админ шалгаж байна ({reg.bank_transfer.reference})</Badge>
                  : <Button size="sm" onClick={() => startPayment(reg)}>Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах</Button>
              )}
            </Alert>
          )}
          {olympiad.registration_open && user && (
            <ButtonGroup className="w-100 mb-3">
              {[['self', 'Өөрийгөө бүртгүүлэх'], ['other', 'Өөр сурагч бүртгүүлэх']].map(([value, label]) => (
                <ToggleButton key={value} id={`register-for-${value}`} type="radio" variant="outline-primary"
                              name="register-for" value={value} checked={form.register_for === value}
                              onChange={() => setRegisterFor(value)}>
                  {label}
                </ToggleButton>
              ))}
            </ButtonGroup>
          )}
          {forOther && olympiad.registration_open && (
            <Alert variant="light" className="border small">
              Эхлээд сурагчийн имэйл эсвэл MMO ID-аар хайна уу — нэг имэйлийг хэд хэдэн сурагч (жишээ нь ах дүүс)
              ашиглаж болно. MMO ID-аар олдвол нэр, холбоо барих мэдээлэл MMO-оос автоматаар бөглөгдөнө.
              Өмнө бүртгэгдсэн бол жагсаалтаас сонгож, үгүй бол шинээр бүртгэнэ. Сурагчид имэйлээр мэдэгдэл очих бөгөөд
              тэр link-ээр бүртгэлээ харж, өөрийн account-д нэмнэ.
            </Alert>
          )}
          {!user && olympiad.registration_open ? (
            <div className="text-center py-3">
              <p className="mb-3">Олимпиадад бүртгүүлэхийн тулд MathMinds account-аараа нэвтэрнэ үү.</p>
              {oauthError && <Alert variant="danger" className="small">{oauthError}</Alert>}
              <div className="d-grid gap-2 mx-auto mb-3" style={{ maxWidth: 360 }}>
                <Button variant="outline-primary" className="fw-semibold" onClick={() => oauthLogin('mmo')}>
                  🏆 MMO данс ашиглан нэвтрэх
                </Button>
                {authService.isGoogleConfigured() && (
                  <Button variant="outline-secondary" className="fw-semibold" onClick={() => oauthLogin('google')}>
                    G&nbsp; Google данс ашиглан нэвтрэх
                  </Button>
                )}
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Button onClick={() => { setPostLoginRedirect(`/olympiads/${slug}`); navigate('/login'); }}>Нэвтрэх</Button>
                <Button variant="outline-primary" onClick={() => { setPostLoginRedirect(`/olympiads/${slug}`); navigate('/register'); }}>
                  Account үүсгэх
                </Button>
              </div>
            </div>
          ) : reg?.status === 'PAID' && !forOther && !extraSelf ? (olympiad.registration_open && (
            <Button variant="outline-primary" size="sm" onClick={() => setExtraSelf(true)}>
              Өөр ангилалд давхар бүртгүүлэх
            </Button>
          )) : olympiad.registration_open ? (
            <Form onSubmit={submit}>
              <Row className="g-2">
                {forOther && (
                  <Col md={12}>
                    <Form.Label>Сурагчийн имэйл эсвэл MMO ID</Form.Label>
                    <div className="input-group">
                      <Form.Control value={query} onChange={changeQuery} placeholder="жишээ: parent@gmail.com эсвэл 216786"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); findStudents(); } }} />
                      <Button variant="outline-primary" type="button" onClick={findStudents}
                              disabled={looking || !(queryIsEmail || queryIsMmo)}>
                        {looking ? <Spinner size="sm" animation="border" /> : 'Хайх'}
                      </Button>
                    </div>
                  </Col>
                )}
                {forOther && candidates !== null && (
                  <Col md={12}>
                    {candidates.length > 0 ? (
                      <>
                        <div className="small text-muted mb-1">Хайлтад тохирох сурагчид — зөв сурагчаа сонгоно уу:</div>
                        <StudentPicker candidates={candidates} value={picked} onChange={pickStudent} />
                      </>
                    ) : (
                      <div className="small text-muted">
                        {queryIsMmo ? 'Энэ MMO ID-тай сурагч олдсонгүй — мэдээллийг гараар бөглөж шинээр бүртгэнэ.'
                          : 'Энэ имэйлтэй сурагч олдсонгүй — шинээр бүртгэнэ.'}
                      </div>
                    )}
                  </Col>
                )}
                {pickedCandidate && latinMode && (
                  <Col md={12}>
                    <Card className="border-success">
                      <Card.Body className="py-2 px-3 small">
                        <div className="text-success fw-semibold mb-1">
                          Сонгосон сурагч{pickedCandidate.mmo_id && ` · MMO ID ${pickedCandidate.mmo_id}`}
                        </div>
                        <Row className="g-1">
                          <Col xs={6}><span className="text-muted">Овог:</span> {pickedCandidate.last_name || '-'}</Col>
                          <Col xs={6}><span className="text-muted">Нэр:</span> {pickedCandidate.first_name || '-'}</Col>
                          <Col xs={6}><span className="text-muted">Сургууль:</span> {pickedCandidate.school || '-'}</Col>
                          <Col xs={6}><span className="text-muted">Анги:</span> {pickedCandidate.grade_label || '-'}</Col>
                        </Row>
                        <div className="text-muted mt-1">
                          {mmoMode
                            ? 'Латин нэрийг шалгаж, доороос оролцох ангилалаа сонгоод бүртгүүлнэ үү. Бусад мэдээлэл MMO-оос бөглөгдөнө.'
                            : 'Латин нэрийг шалгаад, доорх сургууль, анги, аймгийг шалгаж бүртгүүлнэ үү. Утас, имэйл сурагчийн бүртгэлээс бөглөгдөнө.'}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
                {latinMode && (<>
                  <Col md={6}>
                    <Form.Label>Овог (латинаар)</Form.Label>
                    <Form.Control required value={form.last_name_latin}
                                  onChange={(e) => { set('last_name_latin')(e); setLatinConfirmed(false); }}
                                  isInvalid={!!form.last_name_latin && !LATIN_NAME_RE.test(form.last_name_latin.trim())} />
                    <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                  </Col>
                  <Col md={6}>
                    <Form.Label>Нэр (латинаар)</Form.Label>
                    <Form.Control required value={form.first_name_latin}
                                  onChange={(e) => { set('first_name_latin')(e); setLatinConfirmed(false); }}
                                  isInvalid={!!form.first_name_latin && !LATIN_NAME_RE.test(form.first_name_latin.trim())} />
                    <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                  </Col>
                  <Col md={12}>
                    <Alert variant="warning" className="py-2 px-3 mb-1 small">
                      <strong>⚠️ Латин нэрийг заавал шалгана уу.</strong> Англиар сертификат хэвлэхэд ашиглана.
                      Гадаад паспортын нэртэй тулгаарай.
                      <Form.Check className="mt-2" id="latin-confirmed" checked={latinConfirmed}
                                  onChange={(e) => setLatinConfirmed(e.target.checked)}
                                  label={<strong>Латин нэр зөв гэдгийг шалгасан</strong>} />
                    </Alert>
                  </Col>
                </>)}
                {!forOther && myMmoId && (
                  <Col md={12}>
                    <Form.Label>MMO ID</Form.Label>
                    <Form.Control plaintext readOnly value={myMmoId} className="fw-semibold" />
                    <Form.Text muted>Таны account-тай холбогдсон MMO ID бүртгэлд хадгалагдана.</Form.Text>
                  </Col>
                )}
                {showDetails && !pickedChosen && (<>
                <Col md={6}>
                  <Form.Label>Овог</Form.Label>
                  <Form.Control required value={form.last_name} onChange={setName('last_name')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Нэр</Form.Label>
                  <Form.Control required value={form.first_name} onChange={setName('first_name')} />
                </Col>
                <Col md={6}>
                  <Form.Label>Овог (латинаар)</Form.Label>
                  <Form.Control required placeholder="Жишээ: Batbold" value={form.last_name_latin} onChange={setLatin('last_name_latin')}
                                isInvalid={!!form.last_name_latin && !LATIN_NAME_RE.test(form.last_name_latin.trim())} />
                  <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Нэр (латинаар)</Form.Label>
                  <Form.Control required placeholder="Жишээ: Munkh-Erdene" value={form.first_name_latin} onChange={setLatin('first_name_latin')}
                                isInvalid={!!form.first_name_latin && !LATIN_NAME_RE.test(form.first_name_latin.trim())} />
                  <Form.Control.Feedback type="invalid">Зөвхөн латин үсэг</Form.Control.Feedback>
                </Col>
                <Col md={12}>
                  <Alert variant="warning" className="py-2 px-3 mb-1 small">
                    <strong>⚠️ Латин нэрээ заавал шалгана уу.</strong> Англиар сертификат хэвлэхэд ашиглана.
                    Гадаад паспортын нэртэй тулгаарай.
                    <Form.Check className="mt-2" id="latin-confirmed-manual" checked={latinConfirmed}
                                onChange={(e) => setLatinConfirmed(e.target.checked)}
                                label={<strong>Латин нэр зөв гэдгийг шалгасан</strong>} />
                  </Alert>
                </Col>
                </>)}
                {showDetails && (<>
                {mmoMode && (<>
                {categories.length > 0 && (
                  <Col md={noGrade || pickedCandidate?.grade ? 12 : 8}>
                    <Form.Label>Оролцох ангилал <small className="text-muted">(ангиас хамаарч сонгогдоно, сольж болно)</small></Form.Label>
                    <Form.Select required value={form.category_id} onChange={setCategory}>
                      <option value="">— Сонгоно уу —</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
                </>)}
                {mmoMode && !noGrade && !pickedCandidate?.grade && (
                  <Col md={4}>
                    <Form.Label>Анги <small className="text-muted">(MMO-д бүртгэлгүй)</small></Form.Label>
                    <Form.Select required value={form.grade} onChange={setGrade}>
                      <option value="">— Сонгоно уу —</option>
                      {gradeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Form.Select>
                  </Col>
                )}
                {!mmoMode && (<>
                <Col md={12}>
                  <Form.Label>Аймаг / Дүүрэг</Form.Label>
                  {provinces.length > 0 ? (
                    <Form.Select required value={form.province} onChange={set('province')}>
                      <option value="">— Сонгоно уу —</option>
                      {form.province && !provinces.includes(form.province) && (
                        <option value={form.province}>{form.province}</option>
                      )}
                      {provinces.map((n) => <option key={n} value={n}>{n}</option>)}
                    </Form.Select>
                  ) : (
                    <Form.Control required placeholder="Аймаг эсвэл дүүргийн нэр" value={form.province} onChange={set('province')} />
                  )}
                </Col>
                <Col md={12}>
                  <Form.Label>Сургууль</Form.Label>
                  <Form.Control required value={form.school} onChange={set('school')} />
                </Col>
                {categories.length > 0 && (
                  <Col md={noGrade ? 12 : 8}>
                    <Form.Label>Оролцох ангилал <small className="text-muted">(ангиас хамаарч сонгогдоно, сольж болно)</small></Form.Label>
                    <Form.Select required value={form.category_id} onChange={setCategory}>
                      <option value="">— Сонгоно уу —</option>
                      {categoryOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {categoryLabel(c)}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}
                {!noGrade && (
                  <Col md={categories.length > 0 ? 4 : 12}>
                    <Form.Label>{categories.length > 0 ? 'Анги' : 'Анги / Ангилал'}</Form.Label>
                    <Form.Select required value={form.grade} onChange={setGrade}>
                      <option value="">— Сонгоно уу —</option>
                      {gradeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Form.Select>
                  </Col>
                )}
                <Col md={6}>
                  <Form.Label>Утас</Form.Label>
                  <Form.Control required={!pickedChosen} type="tel" value={form.phone} onChange={set('phone')}
                                placeholder={pickedChosen ? 'Хоосон бол сурагчийн бүртгэлтэй утас' : ''} />
                </Col>
                </>)}
                {(!forOther || !queryIsEmail) && (!mmoMode || needEmail) && (
                  <Col md={6}>
                    <Form.Label>Имэйл хаяг</Form.Label>
                    <Form.Control required={!pickedChosen} type="email" value={form.email} onChange={set('email')}
                                  placeholder={pickedChosen ? 'Хоосон бол сурагчийн бүртгэлтэй имэйл' : ''} />
                  </Col>
                )}
                {user?.is_staff && fee > 0 && (
                  <Col md={12}>
                    <Form.Check
                      type="switch" id="waive-fee" checked={form.waive_fee}
                      onChange={(e) => setForm((f) => ({ ...f, waive_fee: e.target.checked }))}
                      label="Төлбөргүй бүртгэх (админ) — хураамж төлөхгүйгээр шууд баталгаажуулна"
                    />
                  </Col>
                )}
                {secondCat && (
                  <Col md={12} className="pt-2">
                    <Alert variant="warning" className="mb-0">
                      <div className="fw-semibold">{secondCat.error}</div>
                      <ul className="mb-2 small">
                        {secondCat.existing.map((x) => (
                          <li key={x.id}>
                            «{x.category_name || 'Ангилалгүй'}» ангилал
                            {x.status === 'PAID' ? ' — баталгаажсан' : ' — төлбөр хүлээгдэж буй'}
                          </li>
                        ))}
                      </ul>
                      <div className="mb-2">
                        Үнэхээр <strong>«{selectedCat?.name || 'энэ'}»</strong> ангилалд давхар оролцох уу? Хэрэв өмнө нь
                        буруу ангилал сонгосон бол өмнөх бүртгэлээ засна уу.
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <Button size="sm" variant="warning" disabled={busy} onClick={() => send({ confirm_second_category: true })}>
                          Тийм, хоёр ангилалд оролцоно
                        </Button>
                        {secondCat.existing.filter((x) => x.can_edit).map((x) => (
                          <Button key={x.id} size="sm" variant="outline-dark" disabled={busy}
                                  onClick={() => send({ replace_registration_id: x.id })}>
                            «{x.category_name}» бүртгэлийг «{selectedCat?.name}» болгож засах
                          </Button>
                        ))}
                        <Button size="sm" variant="link" onClick={() => setSecondCat(null)}>Болих</Button>
                      </div>
                    </Alert>
                  </Col>
                )}
                {error && (  // алдааг баталгаажуулах товчны яг дээр
                  <Col md={12} className="pt-2">
                    <Alert variant="danger" className="mb-0">{error}</Alert>
                  </Col>
                )}
                <Col md={12} className="pt-2">
                  <Button type="submit" disabled={busy} className="w-100">
                    {busy ? <Spinner size="sm" animation="border" />
                      : fee > 0 && !form.waive_fee && !forOther ? 'Бүртгэлийн хураамж төлж бүртгэл баталгаажуулах'
                        : fee > 0 && !form.waive_fee ? 'Бүртгэлийн дэвтэрт нэмэх' : 'Бүртгүүлэх'}
                  </Button>
                </Col>
                </>)}
              </Row>
            </Form>
          ) : (
            <Alert variant="secondary" className="mb-0">
              {regCountdown.state === 'not_started'
                ? `Бүртгэл эхлээгүй байна. Бүртгэлийн хугацаа: ${fmtRange(olympiad.registration_start, olympiad.registration_end)}.`
                : 'Бүртгэл дууссан.'}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {myRegs.length > 0 && (
        <Card className="mb-3">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Бүртгэлийн дэвтэр <small className="text-muted">({myRegs.length})</small></span>
            {payableRegs.length > 1 && (
              <span className="d-flex gap-2 align-items-center flex-wrap">
                <Button size="sm" variant="outline-dark" onClick={toggleAllPay}>
                  {selectedPay.length === payableRegs.length ? 'Сонголтыг арилгах' : `Бүгдийг сонгох (${payableRegs.length})`}
                </Button>
                <Button size="sm" variant="warning" disabled={!selectedPay.length} onClick={payBulk}>
                  {`Сонгосныг бөөнд төлөх (${selectedPay.length} · ${selectedTotal.toLocaleString()}₮)`}
                </Button>
              </span>
            )}
          </Card.Header>
          <Table size="sm" responsive className="mb-0 align-middle">
            <thead>
              <tr>{payableRegs.length > 1 && <th />}<th>№</th><th>Овог нэр</th><th>MMO ID</th><th>Ангилал / Анги</th><th>Төлөв</th><th /></tr>
            </thead>
            <tbody>
              {myRegs.map((r) => (
                <tr key={r.id}>
                  {payableRegs.length > 1 && (
                    <td>
                      {payable(r) && (
                        <Form.Check id={`pay-${r.id}`} checked={paySel.has(r.id)} onChange={() => togglePay(r.id)}
                                    aria-label="Бөөнд төлөхөд сонгох" />
                      )}
                    </td>
                  )}
                  <td>{r.participant_no ?? '-'}</td>
                  <td>{r.full_name}{r.is_mine && <Badge bg="light" text="dark" className="ms-2">Би</Badge>}</td>
                  <td>{r.mmo_id ?? '-'}</td>
                  <td>{r.olympiad_category_name && r.olympiad_category_name !== r.grade_label
                    ? `${r.olympiad_category_name} · ${r.grade_label}` : (r.grade_label || r.olympiad_category_name || '-')}</td>
                  <td>
                    <Badge bg={STATUS_LABEL[r.status][0]}>{STATUS_LABEL[r.status][1]}</Badge>
                    {r.fee_waived && <Badge bg="info" className="ms-1">Төлбөрөөс чөлөөлсөн</Badge>}
                  </td>
                  <td className="text-end">
                    {confirmCancel === r.id ? (
                      // Баталгаажуулах үед бусад товчийг орлоно — баганы өргөн өөрчлөгдөхгүй
                      <span className="d-inline-flex gap-1 align-items-center">
                        <span className="small">Цуцлах уу?</span>
                        <Button size="sm" variant="danger" onClick={() => cancelReg(r)}>Тийм</Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => setConfirmCancel(null)}>Үгүй</Button>
                      </span>
                    ) : (<>
                    {user?.is_staff && r.status === 'PENDING' && (
                      <Button size="sm" variant="outline-success" className="me-1" onClick={() => approve(r)}>Батлах (төлбөргүй)</Button>
                    )}
                    {r.status === 'PENDING' && fee > 0 && (
                      transferUnderReview(r)
                        ? <Badge bg="info">Дансаар: шалгаж буй</Badge>
                        : <Button size="sm" onClick={() => startPayment(r)}>Төлбөр төлөх</Button>
                    )}
                    {r.can_cancel && (
                      <Button size="sm" variant="outline-danger" className="ms-1" onClick={() => setConfirmCancel(r.id)}>
                        Цуцлах
                      </Button>
                    )}
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {payableRegs.length > 0 && (
            <Alert variant="warning" className="m-2 mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2 border-warning border-2">
              <div>
                <div className="fw-bold fs-6">
                  ⚠️ Төлбөр төлөгдөөгүй: {payableRegs.length} бүртгэл · {payableTotal.toLocaleString()}₮
                </div>
                <div className="small">
                  Төлөгдсөн бүртгэл л баталгаажна. Бүртгэл <strong>{fmtDate(olympiad.registration_end)}</strong>-нд
                  дуусахаас өмнө төлнө үү{olympiad.registration_open && regTimeLeft ? ` (${regTimeLeft} үлдлээ)` : ''}.
                  {payableRegs.length > 1 && ' Бүгдийг нэг QPay нэхэмжлэх эсвэл нэг дансны гүйлгээгээр төлж болно.'}
                </div>
              </div>
              <Button variant="danger" className="fw-semibold"
                      onClick={() => setPayReq({ ...paymentRequestFor(payableRegs), transferId: null })}>
                {payableRegs.length > 1 ? `Бүгдийг төлөх (${payableTotal.toLocaleString()}₮)` : `Төлөх (${payableTotal.toLocaleString()}₮)`}
              </Button>
            </Alert>
          )}
        </Card>
      )}

      <div className="d-flex flex-wrap gap-2">
        <Button as={Link} to={`/olympiads/${slug}/roster`} variant="outline-secondary">Бүртгэлийн жагсаалт харах</Button>
        <Button as={Link} to="/olympiads/sheet-guide" variant="outline-primary">Бодолтын хуудас бөглөх заавар</Button>
      </div>

      <RegistrationPayment request={payReq} onClose={() => { setPayReq(null); setPaySel(new Set()); }} onChanged={load} />
    </Container>
  );
}

export default OlympiadDetailPage;
