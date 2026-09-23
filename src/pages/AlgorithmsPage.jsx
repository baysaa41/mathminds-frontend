// src/pages/AlgorithmsPage.jsx
// Системд ашиглагдаж буй дүрэмд суурилсан (AI биш) алгоритмуудын админ заавар

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import {
  GitBranch,
  Target,
  Shuffle,
  CalendarClock,
  Wallet,
  Link2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ── Дата ──────────────────────────────────────────────────────────────────
// Эх сурвалж: backend/integral/views.py (eesh_problems, eesh_different_problem),
// curriculum/pacing.py, users/membership_tracker.py, minds/tasks.py (2026-09-23)

const ALGORITHMS = [
  {
    key: 'eesh-topic-select',
    icon: Target,
    color: '#0ea5e9',
    title: 'ЭЕШ бэлдэх — сэдэв сонгох (3 сигналын нийлмэл оноо)',
    summary: 'Сурагч бүрт дараагийн бодлогын категорийг priority оноогоор автоматаар сонгоно.',
    details: [
      'Функц: integral/views.py — eesh_problems() — API: GET /api/integral/eesh-problems/?subject=&limit=',
      'A) Gap — клубын peer-үүд амжилттай бодсон ч сурагч өөрөө бодоогүй категори. gap_score = peer_success × coverage_factor, жин 0.25',
      'B) Weakness — AI чатын хариултыг Ebbinghaus-ийн задралаар жинлэнэ: w = exp(−0.05·days_ago), weighted_weakness = 1 − Σ(correct·w)/Σ(w), жин 0.40',
      'C) Review urgency — Spaced repetition: тогтворт хугацаа S(success) = 2 × 15^success өдөр, R = exp(−days_since / S), review_urgency = 1 − R, жин 0.35',
      'priority = 0.25·gap + 0.40·weakness + 0.35·urgency (зөвхөн байгаа сигналуудыг нэмнэ)',
      'Хойшлуулах (defer): R < 0.50 бол хэзээ ч хойшлуулахгүй; R ≥ 0.50 + weighted_success > 0.60 + жингийн нийлбэр ≥ 0.8 бол хойшлуулна',
      'Assignment гүйцэтгэлээр level шүүлт: сүүлийн 3 assignment дундаж < 20% → зөвхөн level 1, < 25% → level 1+2',
    ],
    note: 'Хэрэглэгч гараар категори сонговол (category_ids параметр) энэ алгоритмыг бүхэлд нь алгасна.',
  },
  {
    key: 'eesh-different-problem',
    icon: Shuffle,
    color: '#f97316',
    title: 'ЭЕШ бэлдэх — "Өөр бодлого" сонгох',
    summary: 'Одоогийн бодлогыг тойрч, сул категориос сурагч бодоогүй шинэ бодлого олно.',
    details: [
      'Функц: integral/views.py — eesh_different_problem() — API: POST /api/integral/eesh-different-problem/ (Body: current_problem_id, subject)',
      '1. Одоогийн бодлогын категорийг тойрч 2-3 категори сонгоно — сул (сүүлийн 30 assignment дүнгээр алдааны хувь > 30%) + AI чатад (7 хоног) ≤50% амжилттай категори давуу эрэмбэтэй',
      '2. Assignment-аар бодсон + сүүлийн 1 сард AI чатаар бодсон бодлогуудыг exclude хийнэ (давхардахгүй)',
      '3. Сонгосон категориудаас сурагч бодоогүй бодлого DB-с хайна',
      '4. Тохирох бодлого олдохгүй бол AI-аар (DeepSeek) шинэ бодлого зохиож DB-д хадгална',
    ],
    note: 'ЭЕШ сэдэв сонгох алгоритмтай ижил "сул категори" тодорхойлолт ашигладаг ч цонх/жин өөр — тусад нь тооцоологддог.',
  },
  {
    key: 'pacing',
    icon: CalendarClock,
    color: '#10b981',
    title: 'Хөтөлбөрийн долоо хоногийн хурд',
    summary: 'Клуб ба сурагч тус бүрийн идэвхтэй долоо хоногийг ӨӨР ӨӨР зарчмаар тооцоолно.',
    details: [
      'Файл: curriculum/pacing.py — Django-с хамааралгүй цэвэр функцууд',
      'calculate_elapsed_week(start_date) — Клубын хурд (is_auto_week=True): цаг хугацаанд суурилсан. (өнөөдөр − start_date).days // 7 + 1 (эхлээгүй бол 1)',
      'calculate_completion_week(student, program, topics) — Сурагчийн ӨӨРИЙН хурд (StudentProgram): цаг хугацаанд ХАМААРАХГҮЙ — WeeklyTopic.check_quiz-ийг дараалан "completed" болгосны дараа л дараагийн долоо хоног руу шилжинэ',
      'is_program_finished_for_student() — сурагч бүх долоо хоногийн шалгах тестийг дуусгасан эсэхийг ижил гүйцэтгэлийн шалгуураар тодорхойлно',
    ],
    note: 'Багш өөрөө долоо хоног сонгосон (is_auto_week=False) клубд calculate_elapsed_week огт дуудагдахгүй.',
  },
  {
    key: 'membership-value',
    icon: Wallet,
    color: '#8b5cf6',
    title: 'Гишүүнчлэлийн үлдэгдэл үнэ цэнэ',
    summary: 'Идэвхтэй гишүүнчлэлийг өдрийн үнээр хэмжиж, дүйцэх мөнгөн дүнг тооцоолно.',
    details: [
      'Функц: users/membership_tracker.py — calculate_membership_remaining_value(user, reference_date)',
      'remaining_days = (expiration − reference_date).days (дууссан бол 0)',
      'daily_price = get_daily_price(tier) — Product-оос идэвхтэй membership бүтээгдэхүүний 30 хоногийн үнийг 30-д хуваасан утга',
      'remaining_value = remaining_days × daily_price',
      'Түвшний эрэмбэ (TIER_HIERARCHY): PRO=3, MEMBER=2, FREE=1 — get_tier_priority() дараагийн (deferred) гишүүнчлэл аль нь дараа идэвхжихийг тодорхойлоход ашиглагдана',
      'Хэрэглэгддэг газар: users/membership_views.py (membership_remaining, admin_user_membership_summary) болон check_memberships.py management command',
    ],
    note: 'Upgrade/downgrade хийхэд энэ утгыг үндэслэн шинэ багц дахь өдрийг тооцдог — proration логик.',
  },
  {
    key: 'related-articles',
    icon: Link2,
    color: '#ec4899',
    title: 'AI чатад холбоотой нийтлэл санал болгох',
    summary: 'Сурагчийн мессежтэй агуулгын хувьд тохирох нийтэлсэн өгүүллийг keyword+AI 2 шаттайгаар олно.',
    details: [
      'Функц: minds/tasks.py — find_related_articles(text, subject, limit) → verify_related_articles(text, candidates)',
      'Шат 1 (keyword): 5+ тэмдэгттэй, стоп үггүй үгсийг (max 8) keyword болгоно; сүүлийн 200 нийтлэлээс гарчиг/abstract-тай тааруулна',
      'score = title_hits × 3 + abstract_hits (гарчигт тохирсон нь илүү жинтэй); гарчигт дор хаяж 1 тохирол (score ≥ 3) байх ёстой',
      'Шат 2 (AI баталгаажуулалт): keyword-ээр олдсон кандидатуудыг AI-аар семантик хувьд шалгаж, зөвхөн жинхэнэ хамааралтай гэж батлагдсан холбоосыг л буцаана',
      'Дуудагддаг газар: AI багштай чатлах Celery task (minds/tasks.py) — мессеж бүрийг боловсруулах үед',
    ],
    note: 'Vector DB/embedding ашигладаггүй — цэвэр keyword filter + AI-аар зөвхөн баталгаажуулалт хийдэг хос шатлалт систем.',
  },
];

// ── Туслах компонент ──────────────────────────────────────────────────────

function AlgorithmCard({ algo }) {
  const [open, setOpen] = useState(true);
  const Icon = algo.icon;

  return (
    <Card className="mb-3 shadow-sm" style={{ borderColor: algo.color }}>
      <Card.Body>
        <div
          className="d-flex align-items-start gap-2"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <Icon size={28} style={{ color: algo.color, flexShrink: 0, marginTop: 2 }} />
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="mb-0">{algo.title}</h5>
            </div>
            <div className="text-muted small">{algo.summary}</div>
          </div>
          <span className="text-muted flex-shrink-0" style={{ marginTop: 4 }}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        </div>

        {open && (
          <div className="mt-3 ps-1">
            <ul className="small mb-2" style={{ lineHeight: 1.7 }}>
              {algo.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            {algo.note && (
              <div className="mt-2 small px-2 py-2 rounded" style={{ background: '#fff3cd', color: '#856404' }}>
                ⚠ {algo.note}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function AlgorithmsPage() {
  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <GitBranch size={28} style={{ color: '#0ea5e9' }} />
          <h1 className="mb-0 h4">Алгоритмууд</h1>
          <Badge bg="secondary" className="fs-6">{ALGORITHMS.length} алгоритм</Badge>
        </div>
        <Link to="/admin" className="btn btn-outline-secondary btn-sm">
          ‹ Admin
        </Link>
      </div>

      <Card className="shadow-sm mb-4 border-0" style={{ background: '#eef2ff' }}>
        <Card.Body className="py-2 px-3">
          <p className="text-muted mb-1 small">
            Энэ хуудас системд ашиглагдаж буй <strong>дүрэмд суурилсан (rule-based)</strong>{' '}
            алгоритмуудыг тайлбарлана — AI-аар шийддэг сургалтын модулиудын тухай{' '}
            <Link to="/admin/ai-learning-system">AI Сургалтын Систем</Link> хуудсыг үзнэ үү (Mastery,
            SM-2 давталт, StudyPlan гэх мэт тэнд байгаа тул энд давхардуулаагүй).
          </p>
          <p className="text-muted mb-0 small">
            Эх сурвалж (2026-09-23): integral/views.py, curriculum/pacing.py,
            users/membership_tracker.py, minds/tasks.py.
          </p>
        </Card.Body>
      </Card>

      {ALGORITHMS.map(algo => (
        <AlgorithmCard key={algo.key} algo={algo} />
      ))}
    </Container>
  );
}

export default AlgorithmsPage;
