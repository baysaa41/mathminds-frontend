// src/pages/AIModelsPage.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { Cpu, Search, X, ChevronDown, ChevronRight } from 'lucide-react';

// ── Дата ──────────────────────────────────────────────────────────────────
// Эх сурвалж: backend/integral/utils_ai.py, solver_view.py, tasks.py,
// study_plan.py, eesh_blueprint.py, curriculum/management/commands/tag_weekly_topics.py зэрэг
// (2026-07-23 байдлаар код шалгаж бүрдүүлсэн)

const AI_PROVIDERS = [
  {
    provider: 'DeepSeek',
    color: '#4d6bfe',
    icon: '🌊',
    summary: 'Одоогийн үндсэн (default) AI загвар. Ихэнх AI багшийн функцууд үүгээр дамждаг.',
    models: [
      {
        name: 'deepseek-v4-flash',
        role: 'Үндсэн загвар — call_ai_teacher() дуудлагын default (AI_MODEL)',
        usedFor: [
          'Бодлогын AI бодолт/тайлбар — generate_ai_solution',
          'Бодолтын тэмдэглэл — generate_solution_note',
          'Бодлогыг сонголттой (MC) болгох — convert_to_mc',
          'Бодолт сайжруулах — improve_solution',
          'Ижил төстэй quiz үүсгэх — generate_similar_mc / generate_similar_traditional',
          'Клубын өдөр тутмын дасгал: хариулт шалгах, тайлбар, баяжуулалт, hint',
          'Curriculum/долоо хоногийн агуулга, зорилт үүсгэх (auto_objectives, generate_curriculum)',
          'AI Solver: DeepSeek оролцогч (solver_deepseek_solve/respond/review)',
          'Постын AI туслах (текст болон зурагтай пост, vision) — ai_help',
          'describe_image_for_teacher() — зургийн агуулгыг тайлбарлах (vision)',
          'Баримтаас Бодлого Импортлох (/admin/doc-import) — PDF хуудсыг зураг болгож, зураг/DOCX/Excel',
          'import_textbook, generate_curriculum, import_egmo, import_tex_problems — сурах бичиг/PDF/LaTeX импорт',
          'StudyPlan-ийн урам зоригийн товч тайлбар — study_plan_summary (integral/study_plan.py)',
          'Ухаалаг хайлт — байгалийн хэлний асуулгыг keyword+анги+хичээл болгож задлах (smart_search, integral/views.py)',
          'Даалгавар AI-аар шалгах — уламжлалт бодлогод санал score/feedback (ai_grade_submission, clubs/views.py)',
        ],
        note: 'Файл: integral/utils_ai.py — AI_MODEL = "deepseek-v4-flash". Хуучин баримтжуулалтад "deepseek-reasoner" гэж бичигдсэн байсан ч кодод deepseek-v4-flash байна.',
      },
    ],
  },
  {
    provider: 'Anthropic Claude',
    color: '#d97757',
    icon: '◆',
    summary: 'Curriculum-тай холбоотой ажлууд, тайлан дүгнэлт, structured JSON хариу шаардлагатай тохиолдолд ашиглана.',
    models: [
      {
        name: 'claude-haiku-4-5-20251001',
        role: 'call_anthropic_json() — fallback-ийн сүүлийн шат, structured JSON',
        usedFor: [
          'auto_tag_from_curriculum — Curriculum topic автомат таглах',
          'generate_curriculum_quiz_task — Curriculum-аас бодлогын багц үүсгэх',
          'enrich_fill_in_blank_answer — Нөхөх тестийн хариулт цэвэрлэх',
          'check_and_fix_problem — Бодлого шалгаж засах',
          'generate_problem_answer_note — Хариултын тэмдэглэл',
          'analyze_report() — Сурагчийн тайлан дүгнэлт',
          'auto_tag_problems management command — subject/category/topic/level таглах',
          'tag_weekly_topics management command / auto_tag_weekly_topic_curriculum — WeeklyTopic-ийг curriculum Topics-тай холбох (prompt caching ашигладаг)',
          'tag_problem_categories management command — Category автомат таглах',
          'generate_answer_notes management command — MC хариулт бүрийн тайлбар',
        ],
        note: 'Файл: integral/utils_ai.py — call_anthropic_json(). ANTHROPIC_API_KEY тохиргооноос уншина.',
      },
      {
        name: 'claude-sonnet-4-6',
        role: 'fix_duplicate_choices management command — давхардсан MC label засах',
        usedFor: [
          'fix_duplicate_choices — Label давхардсан AnswerChoice-той бодлогуудыг шинжилж засах',
        ],
        note: 'Файл: integral/eesh_blueprint.py — CLAUDE_MODEL. Энэ ажил илүү нарийвчлал шаардсан тул Haiku биш Sonnet ашигладаг цорын ганц газар.',
      },
    ],
  },
  {
    provider: 'OpenAI ChatGPT',
    color: '#10a37f',
    icon: '🤖',
    summary: 'Зөвхөн "AI Solver" (олон-загварын хамтын бодолт) feature дотор ашиглагдана.',
    models: [
      {
        name: 'gpt-4o',
        role: 'AI Solver-ийн ChatGPT оролцогч',
        usedFor: [
          'solver_view.py — _chatgpt_solve, _chatgpt_respond, _chatgpt_review',
          'AI Solver DeepSeek/ChatGPT хоёулаа нэг бодлого дээр хамтарч бодох/шалгах горим',
        ],
        note: 'OPENAI_API_KEY тохируулаагүй бол энэ функц алдаа шиднэ. Файл: integral/solver_view.py.',
      },
    ],
  },
];

const FEATURE_MAP = [
  { feature: 'Бодлогын AI бодолт/тайлбар/тэмдэглэл', app: 'integral', provider: 'DeepSeek', file: 'views_ai.py' },
  { feature: 'AI Solver (DeepSeek + ChatGPT хамтын бодолт)', app: 'integral', provider: 'DeepSeek / ChatGPT', file: 'solver_view.py' },
  { feature: 'Curriculum taglal, quiz автомат үүсгэх', app: 'integral (Celery)', provider: 'Anthropic Claude', file: 'tasks.py' },
  { feature: 'Клубын өдөр тутмын дасгал (hint, шалгах, тайлбар)', app: 'clubs', provider: 'DeepSeek', file: 'views_practice.py' },
  { feature: 'Долоо хоногийн хөтөлбөр/зорилт AI-аар үүсгэх', app: 'clubs / curriculum', provider: 'DeepSeek', file: 'views.py' },
  { feature: 'Постын AI туслах (ai_help)', app: 'minds', provider: 'DeepSeek (текст + vision)', file: 'views.py' },
  { feature: 'Баримт/PDF-ээс бодлого импорт', app: 'integral / management commands', provider: 'DeepSeek (vision)', file: 'doc_import_views.py, import_egmo.py, import_tex_problems.py' },
  { feature: 'Curriculum WeeklyTopic автомат таглах', app: 'integral / curriculum (Celery)', provider: 'Anthropic Claude', file: 'tasks.py, tag_weekly_topics.py' },
  { feature: 'Хувийн StudyPlan AI тайлбар', app: 'integral', provider: 'DeepSeek', file: 'study_plan.py' },
  { feature: 'Ухаалаг хайлт (smart-search)', app: 'integral', provider: 'DeepSeek', file: 'views.py' },
  { feature: 'Даалгавар AI-аар шалгах', app: 'clubs', provider: 'DeepSeek', file: 'views.py (ai_grade_submission)' },
];

// ── Туслах компонентууд ──────────────────────────────────────────────────────

function ModelCard({ model, color }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="mb-2 border-0" style={{ background: '#f8f9fa' }}>
      <Card.Body className="py-2 px-3">
        <div
          className="d-flex align-items-start justify-content-between gap-2"
          style={{ cursor: 'pointer' }}
          onClick={() => setOpen(o => !o)}
        >
          <div className="flex-grow-1 min-w-0">
            <code className="fw-bold me-2" style={{ color, fontSize: '0.9rem' }}>
              {model.name}
            </code>
            <span className="text-muted small">{model.role}</span>
          </div>
          <span className="text-muted flex-shrink-0" style={{ marginTop: 2 }}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        </div>

        {open && (
          <div className="mt-2">
            <div className="small fw-medium text-muted ps-1 mb-1">Хаана ашиглагддаг:</div>
            <ul className="small mb-1 ps-4">
              {model.usedFor.map((u, i) => (
                <li key={i} className="text-muted" style={{ lineHeight: 1.6 }}>{u}</li>
              ))}
            </ul>
            {model.note && (
              <div className="mt-1 small px-2 py-1 rounded" style={{ background: '#fff3cd', color: '#856404' }}>
                ⚠ {model.note}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// ── Үндсэн хуудас ────────────────────────────────────────────────────────────

function AIModelsPage() {
  const [search, setSearch] = useState('');
  const [openProviders, setOpenProviders] = useState(() => {
    const init = {};
    AI_PROVIDERS.forEach((_, i) => { init[i] = true; });
    return init;
  });

  const toggleProvider = (i) => setOpenProviders(prev => ({ ...prev, [i]: !prev[i] }));

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return AI_PROVIDERS;
    return AI_PROVIDERS.map(p => ({
      ...p,
      models: p.models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.usedFor.some(u => u.toLowerCase().includes(q))
      ),
    })).filter(p => p.models.length > 0);
  }, [q]);

  const totalModels = AI_PROVIDERS.reduce((s, p) => s + p.models.length, 0);
  const filteredTotal = filtered.reduce((s, p) => s + p.models.length, 0);

  return (
    <Container className="py-4" style={{ maxWidth: 860 }}>
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Cpu size={28} style={{ color: '#8b5cf6' }} />
              <h1 className="mb-0 h4">AI Загварууд</h1>
              <Badge bg="secondary" className="fs-6">{totalModels} загвар</Badge>
            </div>
            <Link to="/admin" className="btn btn-outline-secondary btn-sm">
              ‹ Admin
            </Link>
          </div>

          <Card className="shadow-sm mb-3 border-0" style={{ background: '#f5f3ff' }}>
            <Card.Body className="py-2 px-3">
              <p className="text-muted mb-1 small">
                Систем 3 AI провайдер ашигладаг: <strong>DeepSeek</strong> (үндсэн загвар, зураг/PDF таних),
                {' '}<strong>Anthropic Claude</strong> (curriculum/тайлан), <strong>ChatGPT</strong> (AI Solver горим).
              </p>
              <p className="text-muted mb-0 small">
                Ихэнх дуудлага <code>integral/utils_ai.py</code>-ийн <code>call_ai_teacher()</code> нэгдсэн функцээр дамждаг.
              </p>
            </Card.Body>
          </Card>

          <InputGroup>
            <InputGroup.Text style={{ background: '#fff' }}>
              <Search size={15} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Загвар, feature хайх..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderLeft: 'none' }}
            />
            {search && (
              <Button variant="outline-secondary" onClick={() => setSearch('')} title="Арилгах">
                <X size={14} />
              </Button>
            )}
          </InputGroup>
          {q && (
            <div className="text-muted small mt-1">
              {filteredTotal} загвар олдлоо
            </div>
          )}
        </Col>
      </Row>

      {/* Providers */}
      {filtered.map((p, pIdx) => (
        <div key={pIdx} className="mb-3">
          <div
            className="d-flex align-items-center gap-2 mb-1 px-1 py-1 rounded"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleProvider(pIdx)}
          >
            <span
              className="d-inline-block rounded-circle flex-shrink-0"
              style={{ width: 12, height: 12, background: p.color }}
            />
            <span className="fw-semibold" style={{ color: p.color }}>
              {p.icon} {p.provider}
            </span>
            <Badge bg="light" text="dark" className="ms-1">
              {p.models.length}
            </Badge>
            <span className="text-muted ms-auto">
              {openProviders[pIdx] !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </div>
          <div className="text-muted small ps-4 mb-2">{p.summary}</div>

          {openProviders[pIdx] !== false && (
            <div className="ps-2">
              {p.models.map((m, i) => (
                <ModelCard key={i} model={m} color={p.color} />
              ))}
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-muted py-5">
          <Search size={32} className="mb-2 opacity-25" />
          <div>"{search}" хайлтанд тохирох загвар олдсонгүй</div>
        </div>
      )}

      {/* Feature map */}
      {!q && (
        <div className="mt-4">
          <h2 className="h6 text-muted mb-2">Feature → Провайдер (товч хүснэгт)</h2>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr className="text-muted small">
                      <th className="ps-3">Feature</th>
                      <th>App</th>
                      <th>Провайдер</th>
                      <th className="pe-3">Файл</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {FEATURE_MAP.map((row, i) => (
                      <tr key={i}>
                        <td className="ps-3">{row.feature}</td>
                        <td className="text-muted">{row.app}</td>
                        <td>{row.provider}</td>
                        <td className="pe-3"><code className="small">{row.file}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
}

export default AIModelsPage;
