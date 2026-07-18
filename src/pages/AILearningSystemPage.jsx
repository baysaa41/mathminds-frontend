// src/pages/AILearningSystemPage.jsx
// Адаптив сургалтын AI систем хэрхэн ажилладаг тухай админ/багшийн заавар

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import {
  Brain,
  Target,
  RotateCcw,
  CalendarCheck,
  ClipboardCheck,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ── Дата ──────────────────────────────────────────────────────────────────
// Эх сурвалж: backend/integral/models.py, views.py, sm2.py, study_plan.py,
// clubs/views.py, mathminds/settings.py CELERY_BEAT_SCHEDULE (2026-07-18)

const MODULES = [
  {
    key: 'mastery',
    icon: Target,
    color: '#0ea5e9',
    title: 'Сул тал илрүүлэх (Mastery)',
    summary: 'Сурагч бүрийн сэдэв тус бүрийн эзэмшлийг (0–1) хянана.',
    details: [
      'Загвар: UserTopic (mastery_score, problems_attempted, problems_correct) — integral/models.py',
      'Тест дуусах бүрд (AnswerSheetViewSet.finish()) MC/FITB бодлого тус бүрийн curriculum_topic-оор шинэчлэгдэнэ',
      'API: GET /api/integral/answer-sheets/{id}/recommend/ — weak_topics, recommended_articles, next_topic талбарууд (mastery_score < 0.6 бол "сул")',
      'API: GET /api/integral/learning-path/?subject= — сэдэв бүрийн mastery + статус (mastered / in_progress / not_started)',
    ],
    note: 'Бусад бүх модуль (StudyPlan, зөвлөмж) эндээс өгөгдлөө авдаг — систeмийн суурь давхарга.',
  },
  {
    key: 'sm2',
    icon: RotateCcw,
    color: '#f97316',
    title: 'Давталт (SM-2 Spaced Repetition)',
    summary: 'Зөв бодсон бодлогыг тогтоосон давтамжаар давтуулна (мартагдахаас сэргийлнэ).',
    details: [
      'Алгоритм: integral/sm2.py — sm2_update(ease_factor, interval_days, repetitions, quality) — Django-с хамааралгүй цэвэр функц',
      'Загвар: ProblemReview — бодлогыг анх удаа ЗӨВ бодоход автоматаар үүснэ (finish()-д hook)',
      'API: GET review/due/, POST review/rate/ ({problem_id, quality: 0–5}), GET review/stats/',
      'Celery: daily-review-reminder — өдөр бүр 08:00 УБ цагаар due сурагчдад имэйл сануулга (integral.tasks.send_review_reminders)',
    ],
    note: 'quality < 3 бол интервал 1 хоног болж reset хийгдэнэ; ease_factor хэзээ ч 1.3-аас доош орохгүй.',
  },
  {
    key: 'studyplan',
    icon: CalendarCheck,
    color: '#10b981',
    title: 'Долоо хоногийн StudyPlan',
    summary: 'Дүрэмд суурилсан бүтэц + AI-ийн урам зоригийн товч тайлбар.',
    details: [
      'Логик: integral/study_plan.py — build_study_plan_items() (зөвхөн унших, тест бичихэд хялбар) → сул сэдэв (review), дараагийн сэдэв (learn), SM-2 due (review) — нийт 5–8 item',
      'get_or_create_weekly_plan() нэмж call_ai_teacher(SCHEMA_NOTE)-ээр 2-3 өгүүлбэрийн урам зориг нэмнэ — AI унавал хоосон үлдэж блоклохгүй',
      'API: GET study-plan/?subject=, POST study-plan/items/{id}/complete/',
      'Ахиц автоматаар бүртгэгдэнэ: finish() (quiz) болон review/rate/ (давталт) хоёулаа тухайн 7 хоногийн идэвхтэй item-ийг олж completed_count-г нэмнэ',
      'Celery: weekly-study-plan-generate — Даваа гараг бүр 06:00 УБ, сүүлийн 30 хоногт идэвхтэй сурагч бүрт шинэ план',
    ],
    note: 'Топик тус бүрийн бус, student+subject-ээр хамрагдана — Program/ClubProgram-той шууд холбоогүй (хараахан баригдаагүй StudentProgram загвараас хамааралгүй).',
  },
  {
    key: 'grading',
    icon: ClipboardCheck,
    color: '#8b5cf6',
    title: 'Даалгавар AI-аар шалгах',
    summary: 'Зөвхөн гараар шалгах шаардлагатай (уламжлалт) бодлогод AI санал өгнө.',
    details: [
      'Хамрах хүрээ: Problems.TRADITIONAL (type=0) — MC/FITB бодлого автоматаар оноогддог тул давхцахгүй, АЖИЛЛАХГҮЙ',
      'API: POST /api/club-assignments/{id}/ai_grade_submission/ (багш-only) — Body: {submission_id}',
      'Гарц: AssignmentSubmission.ai_suggested_score (auto_score + AI-ийн уламжлалт бодлогод өгсөн оноо), ai_feedback',
      'Эцсийн оноо: багш ХЭВЭЭР grade_submission-аар өөрөө батална — AI талбарууд зөвхөн UI-д "санал" болгож харагдана',
    ],
    note: 'AssignmentSubmission-д чөлөөт эссэ/файл талбар байхгүй тул AI зөвхөн quiz-той холбогдсон submission дээр ажиллана.',
  },
  {
    key: 'search',
    icon: Search,
    color: '#ec4899',
    title: 'Хичээлийн агуулга AI хайлт',
    summary: 'Байгалийн хэл дээрх асуулгыг keyword+анги+хичээл болгож задална.',
    details: [
      'API: GET /api/integral/smart-search/?q=...',
      'call_ai_teacher-ээр асуулгыг {search_terms, grade_level, subject} болгож задлаад, байгаа Problems/Articles дээр icontains filter ажиллуулна',
      'Vector DB/embedding АШИГЛААГҮЙ — зөвхөн query parsing AI-аар, хайлт өөрөө энгийн DB filter',
      'AI дуудлага унавал (алдаа гарвал) search_terms = [q] болгож plain keyword хайлт руу автоматаар шилждэг',
    ],
    note: null,
  },
];

const FLOW = [
  { trigger: 'Сурагч quiz дуусгах (finish())', effect: 'UserTopic шинэчлэгдэнэ + анх зөв бодсон бодлогод ProblemReview үүснэ + идэвхтэй StudyPlanItem-ийн ахиц нэмэгдэнэ' },
  { trigger: 'Сурагч давталт үнэлэх (review/rate/)', effect: 'ProblemReview.next_review_at шинэчлэгдэнэ (SM-2) + "Давталт" StudyPlanItem-ийн ахиц нэмэгдэнэ' },
  { trigger: 'Celery: өдөр бүр 08:00 УБ', effect: 'send_review_reminders — due сурагчдад имэйл' },
  { trigger: 'Celery: Даваа 06:00 УБ', effect: 'generate_weekly_study_plans — идэвхтэй сурагч бүрт шинэ 7 хоногийн план' },
  { trigger: 'Багш ai_grade_submission дуудах', effect: 'Уламжлалт бодлогуудад AI оноо/тайлбар санал болгоно (эцсийн бус)' },
];

// ── Туслах компонент ──────────────────────────────────────────────────────

function ModuleCard({ mod }) {
  const [open, setOpen] = useState(true);
  const Icon = mod.icon;

  return (
    <Card className="mb-3 shadow-sm" style={{ borderColor: mod.color }}>
      <Card.Body>
        <div
          className="d-flex align-items-start gap-2"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <Icon size={28} style={{ color: mod.color, flexShrink: 0, marginTop: 2 }} />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="mb-0">{mod.title}</h5>
            </div>
            <div className="text-muted small">{mod.summary}</div>
          </div>
          <span className="text-muted flex-shrink-0" style={{ marginTop: 4 }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>

        {open && (
          <div className="mt-3 ps-1">
            <ul className="small mb-2" style={{ lineHeight: 1.7 }}>
              {mod.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            {mod.note && (
              <div className="mt-2 small px-2 py-2 rounded" style={{ background: '#fff3cd', color: '#856404' }}>
                ⚠ {mod.note}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function AILearningSystemPage() {
  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Brain size={28} style={{ color: '#6366f1' }} />
          <h1 className="mb-0 h4">AI Сургалтын Систем</h1>
          <Badge bg="secondary" className="fs-6">{MODULES.length} модуль</Badge>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary btn-sm">
          ‹ Admin
        </Link>
      </div>

      <Card className="shadow-sm mb-4 border-0" style={{ background: '#eef2ff' }}>
        <Card.Body className="py-2 px-3">
          <p className="text-muted mb-1 small">
            Адаптив сургалтын систем 5 модулиас бүрдэнэ: <strong>Mastery</strong> (сул тал илрүүлэх) нь
            бусад бүх модулийн суурь өгөгдлийг бүрдүүлдэг. <strong>SM-2 давталт</strong> ба{' '}
            <strong>StudyPlan</strong> хоёр хоорондоо холбогдсон (StudyPlan-ийн "Давталт" item нь
            SM-2-ийн due бодлогоос үүснэ). <strong>AI шалгах</strong> ба <strong>AI хайлт</strong> нь
            бие даасан, туслах шинж чанарууд.
          </p>
          <p className="text-muted mb-0 small">
            Хэрэгжсэн: 2026-07-18. Санаатайгаар ХИЙГДЭЭГҮЙ: презентац/видео бэлтгэх, олимпиадын
            бодлого автоматаар сонгох.
          </p>
        </Card.Body>
      </Card>

      {MODULES.map(mod => (
        <ModuleCard key={mod.key} mod={mod} />
      ))}

      {/* Systemic flow */}
      <div className="mt-4">
        <h2 className="h6 text-muted mb-2">Систем дэх урсгал (trigger → үр дүн)</h2>
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th className="ps-3">Trigger</th>
                    <th className="pe-3">Үр дүн</th>
                  </tr>
                </thead>
                <tbody className="small">
                  {FLOW.map((row, i) => (
                    <tr key={i}>
                      <td className="ps-3">{row.trigger}</td>
                      <td className="pe-3 text-muted">{row.effect}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
}

export default AILearningSystemPage;
