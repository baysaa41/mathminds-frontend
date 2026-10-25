// src/pages/DjangoCommandsPage.jsx

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { Terminal, Copy, Check, Search, X, ChevronDown, ChevronRight } from 'lucide-react';

const DJANGO_COMMANDS = [
  {
    category: 'Бодлого & Контент',
    color: '#0d6efd',
    icon: '📚',
    commands: [
      {
        name: 'auto_tag_problems',
        help: 'Haiku AI-р бодлогын subject / category / curriculum_topic / level автоматаар таглах',
        usage: 'python manage.py auto_tag_problems',
        flags: [
          '--no-subject — subject таглахгүй',
          '--no-category — category таглахгүй',
          '--no-topic — curriculum_topic таглахгүй (зөвхөн math)',
          '--no-level — level таглахгүй',
          '--filter-subject <math|physics|chemistry|biology> — Зөвхөн тухайн subject-тай бодлогуудыг боловсруулах',
          '--force — Аль хэдийн тагласан бодлогуудыг дахин таглах',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--limit <N> — Хамгийн их бодлогын тоо (0 = хязгааргүй)',
          '--batch-size <N> — Зэрэг явуулах хүсэлтийн тоо (default: 20)',
          '--delay <сек> — Batch хоорондын хугацаа (default: 1.0)',
          '--confidence <0-1> — Хамгийн бага итгэлцэл (default: 0.6)',
        ],
        note: 'subject=null болсон бодлогуудыг admin-д "Subject-гүй (null)" шүүлтээр харж, гараар устгаж болно.',
        examples: [
          'python manage.py auto_tag_problems --limit 100 --dry-run',
          'python manage.py auto_tag_problems --filter-subject math --force',
          'python manage.py auto_tag_problems --no-topic --no-level',
        ],
      },
      {
        name: 'import_problems',
        help: 'JSON файлаас бодлого импортлох',
        usage: 'python manage.py import_problems <file.json>',
        flags: [
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--update-existing — UUID давхцвал шинэчлэх (default: алгасах)',
          '--default-author <username> — Зохиогч олдохгүй бол ашиглах',
          '--skip-solutions — Бодолт импортлохгүй',
          '--skip-keywords — Түлхүүр үг импортлохгүй',
          '--add-to-quiz <quiz_id> — Тодорхой quiz-д нэмэх',
          '--no-quiz — Quiz metadata байсан ч quiz үүсгэхгүй',
          '--keyword "kw1,kw2" — Бүх бодлогод нэмэлт keyword нэмэх',
        ],
      },
      {
        name: 'export_problems',
        help: 'Бодлогуудыг JSON формат руу экспортлох',
        usage: 'python manage.py export_problems',
        flags: [
          '--output <file> — Гаралтын файл (default: problems_export_YYYYMMDD.json)',
          '--author <username> — Зохиогчоор шүүх',
          '--type <0|1|4> — Төрлөөр шүүх (0=Задаргаа, 1=Сонгох, 4=Нөхөх)',
          '--ids 1,2,3 — Тодорхой ID-ууд',
          '--quiz <id> — Quiz-ийн бүх бодлого',
          '--quiz-title <text> — Quiz нэрээр хайх',
          '--published-only — Зөвхөн нийтлэгдсэн',
          '--include-solutions — Бодолт оруулах (default: тийм)',
          '--pretty — JSON-г уншигдахуйцаар форматлах',
        ],
      },
      {
        name: 'import_textbook',
        help: 'Сурах бичгийн зургуудаас бодлого, томьёо задлах (DeepSeek AI)',
        usage: 'python manage.py import_textbook <зургийн_хавтас>',
        flags: [
          '--batch-size <N> — Нэг API дуудалтад хэдэн зураг (default: 4)',
          '--start <N> — Эхлэх зургийн индекс (0-based)',
          '--end <N> — Дуусах зургийн индекс',
          '--dry-run — Хадгалахгүй',
          '--author <username> — Зохиогч (default: id=1)',
          '--keyword "kw1,kw2" — Бүх агуулгад нэмэх keyword',
          '--subject <нэр> — Хичээл (default: math)',
          '--output <file.json> — Задалсан агуулгыг JSON файлд хадгалах',
          '--pattern "*.jpg" — Зургийн файлын glob pattern (default: *.jpg)',
          '--create-program — Curriculum Program үүсгэх',
          '--program-name <нэр> — Program-ын нэр',
          '--program-code <код> — Program-ын код',
          '--grade <N> — Ангийн дугаар',
          '--academic-year <id> — Байгаа AcademicYear-ийн id (заагаагүй бол шинээр үүсгэнэ)',
          '--toc-end <N> — Агуулгын хүснэгт хэдэн зураг хүртэл (default: 10)',
          '--only-problems — Зөвхөн бодлого',
          '--only-formulas — Зөвхөн томьёо/теорем/тодорхойлолт',
        ],
      },
      {
        name: 'import_quiz_answers',
        help: 'Excel файлаас quiz-ийн сурагчдын хариулт оруулах',
        usage: 'python manage.py import_quiz_answers <excel_file> --quiz-uuid <uuid>',
        flags: [
          '--quiz-uuid <uuid> — Quiz-ийн UUID',
          '--quiz-title <текст> — Quiz нэрээр хайх',
          '--list-quizzes — Байгаа quiz-уудын жагсаалт харуулаад гарах',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--skip-existing — Хариулт бүртгэгдсэн сурагчийг алгасах (default: устгаж дахин оруулна)',
          '--create-users — Username-ээр хайж олоод байвал ашиглах, байхгүй бол шинээр үүсгэх',
          '--username-prefix <угтвар> — Шинэ хэрэглэгчийн username-ийн угтвар (default: exam_)',
          '--club <id|reg_code> — Клубд гишүүн нэмэх; анги баганаар дэд бүлэг автоматаар үүсгэнэ',
          '--sheet <нэр> — Excel sheet нэр',
          '--default-password <нууц үг> — --create-users үед бүх шинэ хэрэглэгчид ижил нууц үг (зөвлөдөггүй; заагаагүй бол санамсаргүй нууц үгийг CSV-д экспортлоно)',
          '--assignment <id> — ClubAssignment ID; AnswerSheet-ийг даалгаврын хариулт болгон бүртгэнэ',
        ],
      },
      {
        name: 'import_egmo',
        help: 'EGMO олимпиадын PDF-уудыг импортлох (DeepSeek AI)',
        usage: 'python manage.py import_egmo <хавтас>',
        flags: [
          '--year <он> — Зөвхөн тодорхой он',
          '--dry-run — Хадгалахгүй',
          '--force — Давхардсан ч дахин оруулах',
          '--model <нэр> — DeepSeek model (default: deepseek-v4-flash)',
          '--author <username> — Зохиогч',
          '--delay <сек> — API хоорондын хүлээлт (default: 2)',
        ],
      },
      {
        name: 'import_tex_problems',
        help: 'LaTeX .tex файлаас бодлого, томьёо импортлох',
        usage: 'python manage.py import_tex_problems <file.tex>',
        flags: [
          '--model <нэр> — DeepSeek model (default: deepseek-v4-flash)',
          '--chunk-size <N> — Нэг chunk-ийн мөрийн тоо (default: 200)',
          '--dry-run — Хадгалахгүй',
          '--skip-problems — Бодлого задлахгүй',
          '--skip-formulas — Томьёо задлахгүй',
          '--problems-only — Зөвхөн бодлого',
          '--formulas-only — Зөвхөн томьёо',
          '--debug — Raw response хэвлэх',
          '--section-title <нэр> — Хэсгийн нэр (keyword болгон нэмнэ)',
          '--chunk-start <N> — Хэдэн дугаартай chunk-аас эхлэх',
        ],
      },
      {
        name: 'delete_by_keyword',
        help: 'Түлхүүр үгээр бодлого/томьёог устгах',
        usage: 'python manage.py delete_by_keyword --keyword <нэр>',
        flags: [
          '--keyword <нэр> — Устгах keyword',
          '--problems — Бодлогуудыг устгах',
          '--formulas — Томьёонуудыг устгах',
          '--delete-keyword — Keyword-г өөрийг нь устгах',
          '--dry-run — Хадгалахгүй, тоог харуулах',
        ],
      },
      {
        name: 'delete_by_quiz',
        help: 'Өгсөн quiz ID-тай холбоотой бүх бодлогыг устгана',
        usage: 'python manage.py delete_by_quiz --quiz <id>',
        flags: [
          '--quiz <id> — Quiz ID',
          '--dry-run — Зөвхөн юу устахыг харуулна',
        ],
        note: 'delete_quiz_import-аас ялгаатай: энэ команд quiz-ийн БОДЛОГУУДЫГ устгадаг, харин delete_quiz_import нь import хийхэд үүссэн хэрэглэгч/хариулт/дэд бүлгийг устгадаг.',
      },
      {
        name: 'fix_fill_answers',
        help: 'Нөхөх тестийн хариултын label-ийн зөрүүг засах',
        usage: 'python manage.py fix_fill_answers',
        flags: [
          '--quiz-id <id> — Тодорхой quiz (default: бүгд)',
          '--dry-run — Хадгалахгүй',
        ],
      },
      {
        name: 'delete_quiz_import',
        help: 'import_quiz_answers-аар үүссэн хэрэглэгч, хариулт, дэд бүлгүүдийг устгах',
        usage: 'python manage.py delete_quiz_import --quiz-uuid <uuid> --club <id>',
        flags: [
          '--quiz-uuid <uuid> — Quiz-ийн UUID (эсвэл --quiz-title)',
          '--quiz-title <текст> — Quiz нэрийн хэсэг',
          '--club <id|reg_code> — Клубын ID эсвэл reg_code',
          '--username-prefix <угтвар> — Устгах хэрэглэгчийн prefix (default: exam_)',
          '--subgroups <нэр...> — Устгах дэд бүлгийн нэрүүд',
          '--keep-users — Хэрэглэгчийн бүртгэлийг устгахгүй',
          '--keep-answers — Answers/AnswerSheets устгахгүй',
          '--dry-run — Зөвхөн юу устгагдах болохыг харуулах',
        ],
        note: 'Устгах дараалал: 1) Answers/AnswerSheets → 2) Клуб гишүүнчлэл → 3) Дэд бүлгүүд → 4) Хэрэглэгч.',
        examples: [
          'python manage.py delete_quiz_import --quiz-uuid <uuid> --club 5 --dry-run',
          'python manage.py delete_quiz_import --quiz-uuid <uuid> --club 5 --username-prefix khanbogd_',
        ],
      },
    ],
  },
  {
    category: 'Клуб',
    color: '#20c997',
    icon: '🏫',
    commands: [
      {
        name: 'deactivate_inactive_clubs',
        help: 'Сүүлийн 30 хоногт пост нийтлээгүй идэвхтэй клубуудыг is_active=False болгох',
        usage: 'python manage.py deactivate_inactive_clubs',
        flags: [
          '--days <N> — Идэвхгүй байсан хоногийн тоо (default: 30)',
          '--dry-run — Өөрчлөлт хийхгүй, зөвхөн жагсаалт харуулах',
        ],
        note: 'is_official=True клубуудад хамаарахгүй. Celery beat: Даваа 08:30 UB-д автоматаар ажиллана.',
        examples: [
          'python manage.py deactivate_inactive_clubs --dry-run',
          'python manage.py deactivate_inactive_clubs --days 14',
        ],
      },
    ],
  },
  {
    category: 'AI Боловсруулалт',
    color: '#6f42c1',
    icon: '🤖',
    commands: [
      {
        name: 'tag_content',
        help: 'AI-р curriculum_topic нь null байгаа Problems/Articles-г автоматаар таглах (Celery queue)',
        usage: 'python manage.py tag_content',
        flags: [
          '--model <Problems|Articles> — Зөвхөн нэг моделийг боловсруулах (default: хоёулаа)',
          '--apply — Celery queue-д биш шууд синхрон ажиллуулах',
        ],
      },
      {
        name: 'tag_batch_problems',
        help: 'Quiz нэрийн загварт тохирох бодлогуудыг keyword-ээр таглах',
        usage: 'python manage.py tag_batch_problems --quiz-title "ЭЕШ%Багц%" --keyword "ЭЕШ жишиг"',
        flags: [
          '--quiz-title <загвар> — SQL LIKE загвар (%=wildcard). Жишээ: "ЭЕШ%%Багц%%"',
          '--keyword <нэр> — Таглах keyword (заавал)',
          '--dry-run — DB-д өөрчлөлт хийхгүй, зөвхөн тоог харуулах',
        ],
        examples: [
          'python manage.py tag_batch_problems --quiz-title "ЭЕШ%Багц%" --keyword "ЭЕШ жишиг"',
          'python manage.py tag_batch_problems --quiz-title "ЭЕШ%Багц%" --dry-run',
        ],
      },
      {
        name: 'convert_to_multiple_choice',
        help: 'Задаргаа бодлогыг AI-р сонгох тест болгох',
        usage: 'python manage.py convert_to_multiple_choice',
        flags: [
          '--problem-id <id> — Тодорхой бодлого',
          '--limit <N> — Хэдэн бодлого (default: 10)',
          '--all — Бүх тохирох бодлого',
          '--no-solution-only — Зөвхөн бодолтгүй бодлогуудыг',
          '--dry-run — Хадгалахгүй',
          '--model <нэр> — DeepSeek model (default: deepseek-v4-flash)',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.0)',
        ],
      },
      {
        name: 'fix_latex_problems',
        help: 'Бодлогуудын математик тэмдэглэгээг LaTeX болгон хөрвүүлэх',
        usage: 'python manage.py fix_latex_problems',
        flags: [
          '--keyword <нэр> — Keyword-оор шүүх',
          '--title-prefix <текст> — Гарчгийн эхлэлээр шүүх (жишээ: "[math")',
          '--problem-id <id> — Тодорхой бодлого',
          '--limit <N> — Хэдэн бодлого (default: 20)',
          '--all — Бүгдийг боловсруулах',
          '--dry-run — Хадгалахгүй',
          '--fix-solutions — Бодолтыг ч засах',
          '--force — LaTeX байсан ч дахин боловсруулах',
          '--model <нэр> — AI model (default: deepseek-v4-flash)',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.0)',
        ],
      },
      {
        name: 'suggest_titles',
        help: 'Title-гүй бодлогуудад AI-р гарчиг санал болгох',
        usage: 'python manage.py suggest_titles',
        flags: [
          '--apply — Гарчгийг хадгалах (default: dry run)',
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--author <username> — Зохиогчоор шүүх',
        ],
      },
      {
        name: 'generate_solutions',
        help: 'Keyword-аар бодолтгүй бодлогуудыг шинжилж MC/нөхөх болгох, бодолт үүсгэх, түвшин тогтоох (AI)',
        usage: 'python manage.py generate_solutions --keyword <нэр>',
        flags: [
          '--keyword <нэр> — Шалгах keyword',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--verbose — Дэлгэрэнгүй гаралт',
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--model <нэр> — AI model (default: claude-haiku-4-5-20251001)',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.0)',
          '--no-delete — Бодлого биш зүйлсийг асуулгүй алгасах (устгахгүй)',
        ],
      },
      {
        name: 'tag_weekly_topics',
        help: 'Claude Haiku-р WeeklyTopic мөрүүдийг curriculum Topics-тай автоматаар холбох (queue)',
        usage: 'python manage.py tag_weekly_topics',
        flags: [
          '--apply — Celery queue-д биш шууд синхрон ажиллуулах',
          '--limit <N> — Хамгийн ихдээ N WeeklyTopic боловсруулах (тест хийхэд хэрэгтэй)',
        ],
        note: 'Ажиллуулахын өмнө claude-haiku-4-5-ийн тооцоолсон зардлыг ($) хэвлэнэ. Prompt caching ашигладаг тул давтан ажиллуулах хямд.',
        examples: [
          'python manage.py tag_weekly_topics --apply --limit 10',
        ],
      },
      {
        name: 'tag_problem_categories',
        help: 'Category-гүй бодлогуудыг Claude Haiku-аар ангилж Problems.category-г бөглөх',
        usage: 'python manage.py tag_problem_categories',
        flags: [
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--delay <сек> — Хүсэлт хоорондын хугацаа',
          '--min-confidence <0-1> — Хамгийн бага итгэлцэл',
          '--verbose — Дэлгэрэнгүй гаралт',
        ],
      },
      {
        name: 'fix_duplicate_choices',
        help: 'Label давхардсан AnswerChoice-той бодлогуудыг Claude API-аар шинжилж засах',
        usage: 'python manage.py fix_duplicate_choices',
        flags: [
          '--problem-id <id> — Тодорхой нэг бодлогын ID',
          '--apply — Бодитоор хадгалах (default: dry-run)',
          '--min-confidence <high|medium|low> — Хамгийн бага итгэлцэл (default: medium)',
        ],
        note: 'claude-sonnet-4-6 ашигладаг (Haiku биш) — давхардсан label засах нь илүү нарийвчлал шаардсан ажил тул.',
      },
      {
        name: 'generate_answer_notes',
        help: 'MC бодлогын хариулт бүрийн тайлбарыг AnswerChoice.description-д Claude-аар хадгалах',
        usage: 'python manage.py generate_answer_notes',
        flags: [
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--overwrite — Байгаа тайлбарыг дахин бичих',
          '--dry-run — Хадгалахгүй',
          '--delay <сек> — Хүсэлт хоорондын хугацаа',
          '--verbose — Дэлгэрэнгүй гаралт',
        ],
      },
      {
        name: 'shuffle_ai_quiz_choices',
        help: 'AI-аар үүсгэсэн бүх тестийн сонгох бодлогын зөв хариултын байрлалыг жигдлэх',
        usage: 'python manage.py shuffle_ai_quiz_choices',
        flags: [
          '--dry-run — Хадгалахгүй, зөвхөн тестүүдийн жагсаалт, MC бодлогын тоог харуулах',
        ],
      },
    ],
  },
  {
    category: 'Хичээлийн хөтөлбөр',
    color: '#198754',
    icon: '📋',
    commands: [
      {
        name: 'generate_curriculum',
        help: 'PDF/зургаас DeepSeek AI-р curriculum болон бодлого үүсгэх',
        usage: 'python manage.py generate_curriculum <файл_эсвэл_хавтас>',
        flags: [
          '--program-code <код> — Program код (заавал)',
          '--program-name <нэр> — Program нэр (заавал)',
          '--grade <N> — Ангийн дугаар (заавал)',
          '--academic-year <он> — Хичээлийн жил (default: 2025-2026)',
          '--year-start <YYYY-MM-DD> — Эхлэх огноо (default: 2025-09-01)',
          '--year-end <YYYY-MM-DD> — Дуусах огноо (default: 2026-05-25)',
          '--weeks <N> — Нийт долоо хоног (default: 34)',
          '--hours-per-week <N> — 7 хоногийн цаг (default: 2)',
          '--total-hours <N> — Нийт хичээлийн цаг (0 = автомат)',
          '--model <нэр> — DeepSeek model (default: deepseek-v4-flash)',
          '--dry-run — Хадгалахгүй',
          '--skip-problems — Бодлого задлахгүй',
          '--problems-only — Зөвхөн бодлого',
          '--skip-formulas — Томьёо алгасах',
          '--formulas-only — Зөвхөн томьёо',
          '--debug — Raw response хэвлэх',
          '--batch-size <N> — Нэг дуудалтад хэдэн файл (default: 5)',
        ],
      },
      {
        name: 'setup_categories',
        help: '2026 ЭЕШ Blueprint-д үндэслэн бүх subject-ийн категориудыг DB-д нэмэх/шинэчлэх',
        usage: 'python manage.py setup_categories',
        flags: [],
        note: 'math (6), physics (6), chemistry (4), biology (4) — нийт 20 категори. Хуучин Blueprint-д нийцэхгүй категориудыг автоматаар устгана.',
      },
      {
        name: 'create_placement_tests',
        help: 'Хичээл тус бүрт оношлох тест үүсгэх (math/physics/chemistry/biology)',
        usage: 'python manage.py create_placement_tests',
        flags: [
          '--force — Байгаа оношлох тестийг устгаж дахин үүсгэх',
        ],
        note: 'Нэг subject-д 15 бодлого: 5 хялбар + 5 дунд + 5 хэцүү (level ID-аар тодорхойлно). Байгаа оношлох тестийг алгасна.',
      },
      {
        name: 'analyze_topics_plan',
        help: 'Түлхүүр үг эсвэл quiz group-уудаар бодлогуудын topic анализ хийж AI-р curriculum үүсгэх',
        usage: 'python manage.py analyze_topics_plan --keywords "ЭЕШ жишиг"',
        flags: [
          '--keywords <үг...> — Түлхүүр үгээр шүүх (--groups-тэй харилцан хасагдана)',
          '--groups <id...> — Quiz group ID-уудаар шүүх, жишээ: --groups 5 6',
          '--subject <math|physics|chemistry|biology> — Хичээлээр нэмэлт шүүлт',
          '--top <N> — Хамгийн олон N topic харуулах (default: 15)',
          '--no-ai — AI дуудахгүй, зөвхөн статистик',
          '--name <нэр> — Хөтөлбөрийн нэр; өгвөл curriculum үүсгэнэ',
          '--code <код> — Хөтөлбөрийн давтагдахгүй код (--name-тэй хамт шаардлагатай)',
          '--grade <N> — Ангийн түвшин (default: 12)',
          '--weeks <N> — Нийт долоо хоногийн тоо (default: 32)',
          '--hours-per-week <N> — Долоо хоног бүрийн цаг (default: 2)',
          '--academic-year <жил> — Хичээлийн жил (default: 2025-2026)',
          '--dry-run — DB-д хадгалахгүй, үүсгэх контентийг харуулах',
        ],
        note: '--name + --code өгвөл Claude Haiku-аар долоо хоног бүрийн сэдэв, тайлбар, суралцахуйн зорилт үүсгэж Program → WeeklyTopic → LearningObjective хадгална.',
        examples: [
          'python manage.py analyze_topics_plan --keywords "ЭЕШ жишиг" --no-ai',
          'python manage.py analyze_topics_plan --groups 5 6 --no-ai',
          'python manage.py analyze_topics_plan --groups 5 6 --name "ЭЕШ бэлтгэл 2026" --code "eesh-math-2026" --grade 12 --weeks 32 --dry-run',
          'python manage.py analyze_topics_plan --groups 5 6 --name "ЭЕШ бэлтгэл 2026" --code "eesh-math-2026" --grade 12 --weeks 32',
        ],
      },
      {
        name: 'generate_book',
        help: 'Quiz group-ээс 4 бүлэгтэй LaTeX ном үүсгэх',
        usage: 'python manage.py generate_book <quiz_group_id>',
        flags: [
          '--title <гарчиг> — Номын гарчиг (заавал биш)',
        ],
      },
      {
        name: 'export_program',
        help: 'Program-г WeeklyTopics, Objectives, Resources-тай JSON-д экспортлох',
        usage: 'python manage.py export_program <code>',
        flags: [
          'code — Program код (жишээ: 7-regular)',
          '--output <файл> — Гаралтын файл (default: stdout)',
          '--all — Бүх program-г экспортлох',
        ],
      },
      {
        name: 'import_program',
        help: 'JSON файлаас Program импортлох (WeeklyTopics, Objectives, Resources)',
        usage: 'python manage.py import_program <file.json>',
        flags: [
          'file — JSON файлын зам (заавал)',
          '--update — Байгаа program-г шинэчлэх (weekly topics устгаж дахин үүсгэнэ)',
          '--dry-run — Хадгалахгүй',
        ],
      },
      {
        name: 'backfill_student_programs',
        help: 'Клубын/дэд бүлгийн гишүүн сурагч бүрт хувийн StudentProgram мөрийг урьдчилан үүсгэх',
        usage: 'python manage.py backfill_student_programs',
        flags: [
          '--dry-run — Юу үүсгэхийг зөвхөн харуулах, хадгалахгүй',
        ],
      },
      {
        name: 'backfill_topic_category',
        help: 'Topics.category-г холбогдсон Problems.category-ийн majority vote-оор бөглөх (AI ашиглахгүй)',
        usage: 'python manage.py backfill_topic_category',
        flags: [
          '--apply — Бодитоор хадгалах (өгөхгүй бол зөвхөн dry-run)',
        ],
        note: 'TopicKeyword (Keywords-ээр дамжсан шууд бус холбоос)-г санаатайгаар ашигладаггүй — статистик bias гарсан тул. Зөвхөн Problems.curriculum_topic-аар шууд холбогдсон өгөгдлийг ашиглана.',
      },
      {
        name: 'link_articles_to_curriculum_topics',
        help: 'curriculum.Resource-ийн article URL-аас Article-г таньж curriculum_topic-ийг автоматаар холбох (AI ашиглахгүй)',
        usage: 'python manage.py link_articles_to_curriculum_topics',
        flags: [
          '--apply — Бодитоор хадгалах (өгөхгүй бол зөвхөн dry-run)',
        ],
        note: 'WeeklyTopic.topic нэр integral.Topics.name-тай яг таарсан тохиолдолд л холбоно. Аль хэдийн тохирсон Article-ийг дахин бичихгүй.',
      },
      {
        name: 'generate_cumulative_quiz',
        help: 'Хэд хэдэн Program-ын хуримтлагдсан агуулгаас блюпринт + AI-аар цоо шинэ Quiz үүсгэх',
        usage: 'python manage.py generate_cumulative_quiz --programs <code,...> --name <нэр>',
        flags: [
          '--programs <code,...> — Program.code жагсаалт; ":N" нэмж 7 хоногийг хязгаарлана (жиш: math06,math07,math09:4)',
          '--name <нэр> — Блюпринт/тестийн нэр',
          '--author <username> — Зохиогч (default: baysa)',
          '--blueprint-only — Зөвхөн блюпринт үүсгээд зогсох',
          '--from-blueprint <id> — Байгаа блюпринтээс quiz үүсгэх',
          '--workers <N> — AI зэрэгцээ дуудлагын тоо (default: 6)',
          '--tailbar-out <file.docx> — Quiz үүссэний дараа тайлбар .docx файлыг шууд бичих',
        ],
        note: 'Эхлээд --blueprint-only-оор блюпринтийг шалгаад, дараа нь --from-blueprint-оор quiz үүсгэх нь аюулгүй.',
        examples: [
          'python manage.py generate_cumulative_quiz --programs math06,math07,math08,math09:4 --name "ЭЕШ давтлага" --blueprint-only',
          'python manage.py generate_cumulative_quiz --from-blueprint 12 --tailbar-out /tmp/tailbar.docx',
        ],
      },
      {
        name: 'export_tailbar_docx',
        help: 'QuizBlueprint-ээс тайлбар (.docx) баримт үүсгэх',
        usage: 'python manage.py export_tailbar_docx --blueprint <id> --out <file.docx>',
        flags: [
          '--blueprint <id> — QuizBlueprint ID',
          '--out <file.docx> — Гаргах файлын зам',
        ],
      },
      {
        name: 'generate_program_articles',
        help: 'Program-ын WeeklyTopic бүрд AI-аар өгүүлэл үүсгэж Resource-оор холбох',
        usage: 'python manage.py generate_program_articles <program_code>',
        flags: [
          '--dry-run — AI дуудахгүй, боловсруулах долоо хоногуудыг жагсаах',
          '--force — Өгүүлэлтэй долоо хоногийг ч дахин үүсгэх (хуучин Resource-г солино)',
          '--delay <сек> — Долоо хоног хоорондын хүлээлт (default: 1.0)',
        ],
        examples: [
          'python manage.py generate_program_articles philosophy-16w --dry-run',
        ],
      },
      {
        name: 'generate_japan_math_quizzes',
        help: 'Японы Математик I+A / II+B хөтөлбөрийн quiz-гүй долоо хоногуудад "Японы ном" keyword-той бодлогуудаас 8 асуулттай тест үүсгэх',
        usage: 'python manage.py generate_japan_math_quizzes',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
        note: 'Шинэ бодлого зохиохгүй — системд байгаа бодлогуудаас л угсарна.',
      },
      {
        name: 'generate_philosophy_quizzes',
        help: 'Философи 16 долоо хоногийн хөтөлбөрийн 4–16-р долоо хоногт гараар зохиосон 8 асуулттай MC тест үүсгэх',
        usage: 'python manage.py generate_philosophy_quizzes',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
        note: 'AI ашиглахгүй. WeeklyTopic.check_quiz болон curriculum.Resource-ийг шинэчилнэ.',
      },
    ],
  },
  {
    category: 'Хэрэглэгч & Гишүүнчлэл',
    color: '#0dcaf0',
    icon: '👤',
    commands: [
      {
        name: 'check_memberships',
        help: 'Гишүүнчлэлийн түүх болон үлдэгдэл шалгах',
        usage: 'python manage.py check_memberships',
        flags: [
          '--username <нэр> — Тодорхой хэрэглэгч',
          '--tier <FREE|MEMBER|PRO|PREMIUM|VIP> — Түвшингээр шүүх',
          '--active-only — Зөвхөн идэвхтэй',
          '--apply-highest — Бүх хэрэглэгчид хамгийн өндөр худалдаж авсан эрхийг идэвхжүүлэх',
          '--detailed — Дэлгэрэнгүй',
          '--limit <N> — Харуулах тоо',
        ],
      },
      {
        name: 'extend_memberships',
        help: 'Гишүүнчлэлийн хугацаа сунгах',
        usage: 'python manage.py extend_memberships --days <N>',
        flags: [
          '--days <N> — Сунгах хоногийн тоо (заавал)',
          '--username <нэр> — Тодорхой хэрэглэгч',
          '--tier <түвшин> — Түвшингээр шүүх',
          '--dry-run — Туршилт горим',
          '--include-expired — Дууссан гишүүнчлэлийг ч сунгах',
        ],
      },
      {
        name: 'sync_ai_teachers',
        help: 'ai_teachers.md файлаас AI багш нарыг үүсгэх/шинэчлэх',
        usage: 'python manage.py sync_ai_teachers',
        flags: [
          '--dry-run — Хадгалахгүй',
          '--file <зам> — Файлын зам (default: backend/ai_teachers.md)',
        ],
      },
      {
        name: 'reset_membership_products',
        help: 'Хуучин MEMBERSHIP Product-уудыг идэвхгүй болгож, шинэ 2 бүтээгдэхүүн ("360 гишүүнчлэл", "Жилийн гишүүнчлэл") үүсгэх',
        usage: 'python manage.py reset_membership_products',
        flags: [],
        note: 'Flag-гүй, шууд DB-д бичнэ (dry-run байхгүй). update_or_create тул дахин ажиллуулахад давхардахгүй.',
      },
      {
        name: 'generate_ai_teacher_avatars',
        help: 'AI багш нарт OpenAI gpt-image-аар зурмал аватар үүсгэх (анхдагчаар локал файл; --apply үед S3 + picture_url)',
        usage: 'python manage.py generate_ai_teacher_avatars --missing',
        flags: [
          '--teacher <id> — AITeacher id (олон удаа өгч болно)',
          '--missing — picture_url-гүй бүх идэвхтэй AI багш',
          '--hint <текст> — Дүр төрхийн нэмэлт тайлбар (англиар)',
          '--gender <ID=female|male|neutral> — Таамагласан хүйсийг дарах (олон удаа өгч болно)',
          '--list — Багш бүрийн таамагласан хүйсийг харуулаад зогсох',
          '--out <хавтас> — Локал хадгалах хавтас (default: /tmp/ai_teacher_avatars)',
          '--apply — S3-д upload хийж user.picture_url-д бичих',
        ],
        note: 'Эхлээд --list-ээр хүйсийн таамгийг шалгаж, буруу бол --gender-ээр засаад ажиллуулна.',
        examples: [
          'python manage.py generate_ai_teacher_avatars --missing --list',
          'python manage.py generate_ai_teacher_avatars --missing --apply',
        ],
      },
    ],
  },
  {
    category: 'ЭЕШ Мок Тест',
    color: '#fd7e14',
    icon: '🎯',
    commands: [
      {
        name: 'tag_eesh_problems',
        help: 'Claude API-аар бодлогуудыг ЭЕШ-ийн 5 категорид таглах (eesh_category талбар)',
        usage: 'python manage.py tag_eesh_problems',
        flags: [
          '--all — Бүх type=0/1/4 бодлогуудыг таглах (default: зөвхөн ЭЕШ Багц)',
          '--problem-id <id> — Тодорхой нэг бодлого',
          '--limit <N> — Хэдэн бодлого боловсруулах (default: хязгааргүй)',
          '--confidence <0-1> — Хамгийн бага итгэлцэл (default: 0.75)',
          '--delay <сек> — API дуудалт хоорондын хугацаа (default: 0.5)',
          '--force — Аль хэдийн тагласан бодлогуудыг дахин таглах',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
        ],
        note: 'Дутуу/зурагтай/ойлгомжгүй өгүүлбэрийг автоматаар алгасана. Эхлэж --limit 20 --dry-run-аар туршина уу.',
      },
      {
        name: 'convert_eesh_batch',
        help: 'ЭЕШ Багц quizzes-ийн type=0 бодлогоос Claude API-аар type=1 (сонгох) + type=4 (нөхөх) үүсгэх',
        usage: 'python manage.py convert_eesh_batch',
        flags: [
          '--quiz-ids <id,...> — Тодорхой quiz ID-уудыг таслалаар (жишээ: 5405,5406)',
          '--mc-only — Зөвхөн type=1 (сонгох, 5 сонголт) үүсгэх',
          '--fill-only — Зөвхөн type=4 (нөхөх) үүсгэх',
          '--limit <N> — Хэдэн эх бодлого боловсруулах (default: бүгд)',
          '--delay <сек> — API дуудалт хоорондын хугацаа (default: 1.0)',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--skip-existing — Аль хэдийн хөрвүүлсэн бодлогуудыг алгасах (default: тийм)',
        ],
        note: 'Нэг type=0 бодлогоос type=1 + type=4 хоёр шинэ бодлого үүснэ (is_public=False). Нийтлэхийн өмнө admin-д review хийнэ үү.',
      },
      {
        name: 'generate_eesh_quiz',
        help: 'ЭЕШ блюпринт дагуу quiz автоматаар үүсгэх (math/physics/chemistry/biology)',
        usage: 'python manage.py generate_eesh_quiz --subject math --year 2026 --variant A',
        flags: [
          '--subject <math|physics|chemistry|biology> — Хичээл (default: math)',
          '--year <он> — Блюпринтийн он (default: 2026)',
          '--variant <A|B|...> — Хувилбарын нэр (default: A)',
          '--exclude-quizzes <id,...> — Давтагдахаас хассах quiz ID-ууд',
          '--source <eesh-batch|all> — eesh-batch: Багц-аас үүсгэсэн (зөвхөн math), all: бүх pool (default: all)',
          '--seed <N> — Random seed (нэг дүнг давтах)',
          '--dry-run — Quiz хадгалахгүй, pool статистик харуулах',
        ],
        note: 'Үүсгэсэн quiz анхнаасаа нийтэд нээлттэй (is_public=True). math: 40 бодлого (36+4) | physics: 50 (46+4) | chemistry: 44 (40+4) | biology: 50 (46+4). Pool дутагдалтай бол auto_tag_problems командаар бодлогуудыг эхлээд таглана уу.',
        examples: [
          'python manage.py generate_eesh_quiz --year 2026 --variant A --dry-run',
          'python manage.py generate_eesh_quiz --subject physics --year 2026 --variant A --dry-run',
          'python manage.py generate_eesh_quiz --subject chemistry --year 2026 --variant A',
          'python manage.py generate_eesh_quiz --year 2026 --variant B --exclude-quizzes 192,331',
        ],
      },
      {
        name: 'check_eesh_completeness',
        help: 'PDF/DOCX бодлогуудыг DB-тэй харьцуулж, дутуу бодлогыг нэмэх, keyword-ээр таглах',
        usage: 'python manage.py check_eesh_completeness --dir <хавтас>',
        flags: [
          '--dir <хавтас> — PDF/DOCX файлын хавтас',
          '--files <f1,f2,...> — Тодорхой файлууд (таслалаар)',
          '--min-sim <0-1> — Jaccard давхцлын босго (default: 0.30)',
          '--keyword <нэр> — Таглах keyword (default: "ЭЕШ жишиг")',
          '--tag-all — Тохирсон бодлогуудыг keyword-ээр таглах',
          '--add-missing — Дутуу бодлогуудыг DB-д нэмэх',
          '--link-db-only — DB-д байгаа ч Багц-д холбогдоогүй бодлогуудыг quiz-т нэмэх',
          '--quiz-id <id> — Бодлогуудыг нэмэх quiz-ийн ID',
          '--show-missing — Олдоогүй бодлогуудыг дэлгэрэнгүй харуулах',
          '--report <файл> — JSON тайлан хадгалах',
        ],
        note: 'DOCX файлуудыг эхлээд PDF болгоно: libreoffice --headless --convert-to pdf *.docx',
        examples: [
          'python manage.py check_eesh_completeness --dir /home/deploy/documents/1000problems --tag-all --add-missing',
          'python manage.py check_eesh_completeness --dir /home/deploy/documents/1000problems --show-missing',
        ],
      },
      {
        name: 'create_eesh_problems',
        help: 'ЭЕШ блюпринт дагуу "ЭЕШ жишиг" загвараас Claude API-р шинэ бодлого үүсгэх (интерактив)',
        usage: 'python manage.py create_eesh_problems --category ALGEBRA --type mc --count 5',
        flags: [
          '--year <он> — Блюпринтийн он (default: 2026)',
          '--category <кат> — NUMBER_THEORY | ALGEBRA | ANALYSIS | GEOMETRY | PROBABILITY',
          '--all-categories — Бүх 5 категориор дамжин үүсгэх',
          '--type <mc|fill> — mc=сонгох тест, fill=нөхөх тест (default: mc)',
          '--count <N> — Нэг категорид үүсгэх тоо (default: 5)',
          '--level <1-4> — Хүндрэлийн түвшин (default: blueprint дагуу автомат)',
          '--author <username> — Зохиогч (default: baysa)',
          '--keyword <нэр> — Загвар хайх keyword (default: "ЭЕШ жишиг")',
          '--no-confirm — Баталгаажуулалгүйгээр шууд хадгалах',
          '--seed <N> — Random seed',
        ],
        note: 'Интерактив горим: [y] хадгал · [r] дахин үүсгэх · [s] алгасах · [q] гарах.',
        examples: [
          'python manage.py create_eesh_problems --category ALGEBRA --type mc --count 3',
          'python manage.py create_eesh_problems --category GEOMETRY --type fill --count 2 --level 3',
          'python manage.py create_eesh_problems --all-categories --type mc --count 5 --no-confirm',
        ],
      },
      {
        name: 'fill_eesh_quiz',
        help: 'ЭЕШ темплэйт тест үүсгэж, бодлогуудыг AI-аар нэг нэгээр солих',
        usage: 'python manage.py fill_eesh_quiz --create --year 2026 --variant A',
        flags: [
          '--create — Шинэ темплэйт тест үүсгэх',
          '--year <он> — Блюпринтийн он (default: 2026)',
          '--variant <A|B|...> — Хувилбарын нэр (default: A)',
          '--name <нэр> — Тестийн нэр (заагаагүй бол асуух эсвэл автомат нэр)',
          '--quiz-id <id> — Дүүргэх / үргэлжлүүлэх quiz ID',
          '--from-order <N> — Хэдэн дугааргаас эхлэх (default: 1)',
          '--no-confirm — Баталгаажуулалгүйгээр шууд хадгалах',
          '--non-interactive — Огт асуулгүй, алдаанд автоматаар дахин оролдоно',
          '--seed <N> — Random seed',
          '--author <username> — Зохиогч (default: baysa)',
          '--keyword <нэр> — Загвар хайх keyword (default: "ЭЕШ жишиг")',
        ],
        note: 'Явц ~/.eesh_fill_<quiz_id>.json файлд хадгалагдана. q дарж зогсоод --quiz-id-аар дахин ажиллуулна.',
        examples: [
          'python manage.py fill_eesh_quiz --create --year 2026 --variant A',
          'python manage.py fill_eesh_quiz --quiz-id 7159',
          'python manage.py fill_eesh_quiz --quiz-id 7159 --from-order 15',
          'python manage.py fill_eesh_quiz --quiz-id 7159 --no-confirm',
        ],
      },
    ],
  },
  {
    category: 'ЭЕШ Дүн',
    color: '#6610f2',
    icon: '📊',
    commands: [
      {
        name: 'import_eec_results',
        help: 'list.eec.mn-аас ЭЕШ дүнг татаж өгөгдлийн санд хадгалах',
        usage: 'python manage.py import_eec_results --aid <N> --buleg <N>',
        flags: [
          '--aid <N> — Аймагийн дугаар (1–23)',
          '--buleg <N> — Бүлгийн дугаар (1–10)',
          '--all — Бүх аймаг/бүлгийг татах',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.5)',
          '--dry-run — Хадгалахгүй',
        ],
        note: 'EECResultsPage / EECStatsPage (/admin) хуудсуудад харагдах бодит ЭЕШ-ийн дүн — генерацлагдсан мок дүн биш. Анхаар: одоогоор backend venv-д beautifulsoup4 суугаагүй тул команд ачаалагдахгүй (ModuleNotFoundError: bs4) — эхлээд venv/bin/pip install beautifulsoup4.',
      },
      {
        name: 'setup_eesh_keywords',
        help: '"ЭЕШ жишиг" keyword үүсгэж, ЭЕШ жилийн бодлогуудыг таглах',
        usage: 'python manage.py setup_eesh_keywords',
        flags: [
          '--generate — type=0 бодлогуудад MC сонголт async үүсгэх (Celery шаардлагатай)',
          '--batch <N> — Нэг удаагийн batch хэмжээ (default: 50)',
          '--dry-run — Хадгалахгүй, зөвхөн тоолох',
        ],
      },
    ],
  },
  {
    category: 'Төлбөр',
    color: '#ffc107',
    icon: '💳',
    commands: [
      {
        name: 'sync_qpay_payments',
        help: 'QPay-ээс амжилттай төлбөрүүдийг татаж хадгалах',
        usage: 'python manage.py sync_qpay_payments --start YYYY-MM-DD',
        flags: [
          '--start <огноо> — Эхлэх огноо (заавал)',
          '--end <огноо> — Дуусах огноо (default: өнөөдөр)',
        ],
      },
    ],
  },
  {
    category: 'ЭЕШ ном & чанарын аудит',
    color: '#d63384',
    icon: '📖',
    commands: [
      {
        name: 'generate_eesh_book',
        help: 'ЭЕШ жишиг бодлогуудаас сэдвээр эрэмбэлсэн LaTeX ном угсарч PDF болгох',
        usage: 'python manage.py generate_eesh_book --book <нэр>',
        flags: [
          '--book <book1|book2|book3|geometry|probstat|src_math_1..10|src_probstat> — Ном (src_* нь зөвхөн энэ командад)',
          '--keyword <нэр> — Бодлогын keyword (default: "ЭЕШ жишиг")',
          '--title <текст> — Номын гарчиг',
          '--author <username> — Зохиогч (default: baysa)',
          '--no-compile — Зөвхөн .tex үүсгэх, xelatex ажиллуулахгүй',
          '--examples-only — Зөвхөн жишээ бодлогын асуулт (бодолт/дасгалгүй)',
          '--delete-old — Өмнөх хувилбаруудыг (файл+DB) устгах (анхдагчаар түүх хадгалагдана)',
        ],
        examples: [
          'python manage.py generate_eesh_book --book geometry',
          'python manage.py generate_eesh_book --book src_math_3 --examples-only',
        ],
      },
      {
        name: 'sync_eesh_book_from_tex',
        help: 'Гараар засварласан ЭЕШ номын .tex файлаас DB руу өөрчлөлтийг илрүүлж бичих',
        usage: 'python manage.py sync_eesh_book_from_tex --book <нэр> --file <file.tex>',
        flags: [
          '--book <нэр> — Ном (generate_eesh_book-ийн утгууд)',
          '--file <file.tex> — Засварласан .tex файлын зам',
          '--apply — DB руу бодитоор бичих (анхдагчаар dry-run)',
          '--only <problem_id> — Зөвхөн энэ бодлогод хязгаарлах',
          '--output <file.json> — Diff тайланг JSON-д хадгалах',
        ],
      },
      {
        name: 'generate_eesh_variants',
        help: 'ЭЕШ жишиг загвар бодлого бүрт AI-аар 2 төстэй дасгал бодлого үүсгэх',
        usage: 'python manage.py generate_eesh_variants --dry-run',
        flags: [
          '--keyword <нэр> — Загварын keyword (default: "ЭЕШ жишиг")',
          '--category <A,B> — Category.name жагсаалт (жиш: GEOMETRY,ALGEBRA)',
          '--level-min <N> / --level-max <N> — Түвшний хүрээ',
          '--limit <N> — Загвар бодлогын дээд тоо',
          '--ids <id,...> — Тодорхой загвар бодлогын ID-ууд',
          '--workers <N> — Зэрэгцээ дуудлага (default: 6)',
          '--author <username> — Зохиогч (default: baysa)',
          '--force — Загварын одоо байгаа дасгалуудыг устгаад дахин үүсгэх',
          '--dry-run — Зөвхөн зардлын тооцоо + жагсаалт',
        ],
        note: 'Эхлээд --dry-run-аар зардлыг тооцоод ажиллуулна.',
      },
      {
        name: 'backfill_eesh_topics',
        help: 'ЭЕШ жишиг бодлогын curriculum_topic=NULL-ыг AI-аар (category-д эрэмбэтэй байгаа сэдвүүдээс) бөглөх',
        usage: 'python manage.py backfill_eesh_topics --book <нэр> --dry-run',
        flags: [
          '--book <book1|book2|book3|geometry|probstat|all> — Ном (default: all)',
          '--limit <N> — Бодлогын тоо (0 = бүгд)',
          '--dry-run — AI дуудаж харах ч хадгалахгүй',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.0)',
          '--confidence <0-1> — Үүнээс доош итгэлцэлтэйг хаях (default: 0.6)',
        ],
      },
      {
        name: 'audit_topic_order',
        help: 'ЭЕШ жишиг бодлогын Topics-ийн topic_order давхцал/дутууг Category-аар илрүүлэх (засахгүй)',
        usage: 'python manage.py audit_topic_order',
        flags: [
          '--output <file.json> — Тайланг файлд хадгалах',
        ],
      },
      {
        name: 'audit_eesh_books',
        help: 'ЭЕШ номын бодлогуудад AI-гүй LaTeX/бүтцийн аудит хийх',
        usage: 'python manage.py audit_eesh_books --book <нэр>',
        flags: [
          '--book <book1|book2|book3|geometry|probstat|all> — Ном (default: all)',
          '--skip-structural / --skip-latex / --skip-orphans — Тухайн шалгалтыг алгасах',
          '--min-statement-len <N> / --min-solution-len <N> — Хэт богино нөхцөл/бодолтын босго (default: 15)',
          '--include-known — Мэдэгдэж буй алдааг ч харуулах',
          '--verify — Геометр номын мэдэгдэж буй \\vec алдааг олж байгааг баталгаажуулаад гарах',
          '--keep-scratch — Түр файлуудыг устгахгүй',
          '--limit-preview <N> — Урьдчилан харуулах тоо (default: 20)',
          '--output <file> — Тайлангийн файл',
        ],
      },
      {
        name: 'audit_eesh_quality',
        help: 'ЭЕШ номын жишээ+дасгал бодлогуудыг AI-аар чанарын хувьд үнэлж JSON тайлан гаргах',
        usage: 'python manage.py audit_eesh_quality --book <нэр> --models deepseek',
        flags: [
          '--book <book1|book2|book3|geometry|probstat|all> — Ном (default: book1)',
          '--models <deepseek,deepseek_pro,claude> — Үнэлэх моделиуд (default: гурвуулаа)',
          '--limit <N> — Жишээ БҮЛГИЙН тоог хязгаарлах',
          '--delay <сек> — AI дуудлага хоорондын хугацаа (default: 1.5)',
          '--dry-run — Prompt харуулна, AI дуудахгүй',
          '--output <file> — Тайлангийн зам',
          '--resume <file.json> — Өмнөх тайланг үргэлжлүүлэх (боловсруулсан бүлгийг алгасна)',
          '--template-ids <id,...> — Зөвхөн эдгээр жишээ бүлгийг дахин аудит хийх',
          '--triage-model <нэр> — Эхлээд бүх бүлгийг зөвхөн энэ моделиор шалгах',
          '--escalate-models <нэр,...> — Triage оноо босгоос доош бүлгүүдэд нэмж дуудах моделиуд',
          '--escalate-threshold <0-5> — Escalate хийх босго (default: 2)',
        ],
        note: 'Зардал: --models deepseek эсвэл --triage-model deepseek-ийг анхдагчаар хэрэглэнэ. claude-оор escalate хийх нь зардалтай; deepseek түүхий LaTeX-ээс false-positive гаргах хандлагатайг анхаарна уу.',
        examples: [
          'python manage.py audit_eesh_quality --book all --models deepseek',
          'python manage.py audit_eesh_quality --book book2 --resume logs/eesh_quality_book2.json',
        ],
      },
      {
        name: 'show_eesh_quality_issues',
        help: 'audit_eesh_quality-ийн JSON тайлангаас босгоос доош оноотой бүлгүүдийг дэлгэрэнгүй харуулах',
        usage: 'python manage.py show_eesh_quality_issues',
        flags: [
          '--report <file.json> — Тайлан (default: хамгийн сүүлийнх)',
          '--max-score <0-5> — Энэ оноо ба түүнээс доош (default: 2)',
          '--criterion <correctness|solution|clarity|mongolian> — Зөвхөн нэг шалгуураар',
          '--model <deepseek|deepseek_pro|gemini|claude> — Зөвхөн нэг моделиор (gemini: хуучин тайланд)',
          '--book <нэр> — Зөвхөн нэг номоор',
          '--output <file.json> — Шүүсэн дүнг хадгалах',
        ],
      },
      {
        name: 'convert_book1_traditional_to_mc',
        help: 'Book1-ийн уламжлалт (type=0) бодлогыг DeepSeek-ээр шалгаж, баталгаажсаныг л сонгох тест (type=1) болгож in-place хувиргах',
        usage: 'python manage.py convert_book1_traditional_to_mc --dry-run',
        flags: [
          '--problem-ids <id,...> — Тодорхой ID-ууд (заагаагүй бол book1-ийг автоматаар)',
          '--limit <N> — Эхний N бодлого',
          '--dry-run — DB бичихгүй',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.5)',
          '--fix-solution — Шалгалтад унасан ч бодолтыг AI-аар дахин бичээд хүчээр хувиргах (нөхцөл нь зөв гэдэгт итгэлтэй ID-д л)',
        ],
        note: 'type=0 → MC хөрвүүлэлт дууссан (1065 MC + 10 алгассан). Нөхцөл нь бөглөх хэлбэртэй (FIB) бодлогыг MC болгохдоо анхаарна уу.',
      },
    ],
  },
  {
    category: 'Өгөгдөл цэвэрлэгээ & засвар',
    color: '#6c757d',
    icon: '🧹',
    commands: [
      {
        name: 'fix_terminology',
        help: 'MathTerm-д бүртгэсэн буруу нэр томьёог контентод хайж зөвөөр солих (AI-гүй)',
        usage: 'python manage.py fix_terminology',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
          '--term <id> — Зөвхөн энэ MathTerm',
          '--subject <нэр|all> — Зөвхөн энэ subject-ийн нэр томьёо',
          '--exclude <Model:id|Model.field:id> — Алгасах мөр (олон удаа өгч болно)',
          '--interactive — Тохиолдол бүрийг асууж (y/N/q) солих',
          '--literal-suffix — Заагаагүй залгаврыг литерал хэвээр залгаж солих (эрсдэлтэй)',
        ],
        note: 'Залгавартай хэлбэрийг MathTerm.inflections-д "буруу => зөв" гэж заагаагүй бол солихгүй, "⚠" гэж л мэдээлнэ (эгшгийн зохицол). Нэр томьёог мэдрэмжээр бүү нэм — эх сурвалжаар баталгаажуулна.',
        examples: [
          'python manage.py fix_terminology --term 3',
          'python manage.py fix_terminology --term 3 --apply',
        ],
      },
      {
        name: 'link_formulas_solutions',
        help: 'Formulas ↔ Solutions-ийг LaTeX онцлог илэрхийллээр тааруулж, баталгаажуулсан хосыг SolutionFormula-аар холбох',
        usage: 'python manage.py link_formulas_solutions --topic <нэр> --dry-run',
        flags: [
          '--topic <нэр> — Formulas.topic.name (жиш: "Комплекс тоо")',
          '--subject <нэр> — --topic өгөөгүй үед бүх сэдэв',
          '--dry-run — Зөвхөн нэр дэвшигчдийг хэвлэх',
          '--min-sig-len <N> — Signature-ийн доод урт (default: 10)',
          '--max-formula-freq <N> — Хэт ерөнхий signature-ийн босго, Formula (default: 15)',
          '--max-solution-freq <N> — Хэт ерөнхий signature-ийн босго, Solution (default: 20)',
          '--apply — Баталгаажуулсан хосуудыг холбох',
          '--pairs <fid:sid,...> — Холбох хосууд',
        ],
        note: '2 алхамтай: эхлээд --dry-run-аар нэр дэвшигчийг харж шалгаад, зөвийг нь --apply --pairs-аар холбоно.',
      },
      {
        name: 'fix_broken_latex_backslashes',
        help: 'Эвдэрхий LaTeX backslash засах: \\\\sum → \\sum, $frac{..}$ → $\\frac{..}$, "\\ cdot" → \\cdot',
        usage: 'python manage.py fix_broken_latex_backslashes',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
        note: 'Шинэ өгөгдөлд pre_save signal (integral/signals.py) автоматаар ажилладаг — энэ команд зөвхөн хуучин өгөгдөлд.',
      },
      {
        name: 'fix_markdown_tables',
        help: 'Markdown хүснэгтийг (| a | b |) \\begin{tabular} болгож хөрвүүлэх',
        usage: 'python manage.py fix_markdown_tables',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
        note: 'Шинэ өгөгдөлд pre_save signal автоматаар ажилладаг — энэ команд зөвхөн хуучин өгөгдөлд.',
      },
      {
        name: 'fix_broken_latex_tables',
        help: '[xlat]...[/xlat] shortcode-той бичлэгээс \\begin{document} доторх хүснэгтийг л үлдээх',
        usage: 'python manage.py fix_broken_latex_tables',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'fix_bare_callout_commands',
        help: 'Хаалтгүй \\definition{...} зэрэг callout командыг \\begin{ENV}...\\end{ENV} болгох',
        usage: 'python manage.py fix_bare_callout_commands',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'fix_duplicate_topic_subjects',
        help: 'Ижил нэртэй, өөр subject-тэй давхардсан Topics-ийн "math" талыг зөв subject болгох (Problems/Quizzes руу каскад)',
        usage: 'python manage.py fix_duplicate_topic_subjects',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'fix_topic_subject_from_problems',
        help: 'Topics.subject="math" боловч холбогдсон бүх бодлого өөр subject-тэй бол Topic-ийн subject-ийг засах',
        usage: 'python manage.py fix_topic_subject_from_problems',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'fix_formula_subjects_from_keywords',
        help: '"<N>-р ангийн хими/физик/биологи" keyword-ийн олонхийн саналаар Formulas.subject засах',
        usage: 'python manage.py fix_formula_subjects_from_keywords',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'classify_quiz_subjects',
        help: 'Quizzes.subject-ийг доторх бодлогуудын subject-ийн олонхоор (AI-гүй) бөглөх',
        usage: 'python manage.py classify_quiz_subjects',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'cleanup_keywords',
        help: 'Orphan "<тоо> хуулбар" keyword устгах, нэр давхцсан keyword-уудыг нэг canonical руу нэгтгэх',
        usage: 'python manage.py cleanup_keywords',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'normalize_article_status',
        help: 'Articles.status-ийн legacy "0"/"1" утгыг "draft"/"published" болгох',
        usage: 'python manage.py normalize_article_status',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
      },
      {
        name: 'delete_non_formula_content',
        help: 'Formula биш гэж гараар баталгаажуулсан 31 бичлэгийг устгах (тогтмол ID)',
        usage: 'python manage.py delete_non_formula_content',
        flags: [
          '--apply — Бодитоор устгах (заагаагүй бол dry-run)',
        ],
        note: 'Нэг удаагийн цэвэрлэгээ — ID жагсаалт кодонд тогтмол.',
      },
      {
        name: 'translate_formula_titles',
        help: 'Англи гарчигтай 6 Formula-ийн гарчгийг монгол болгох (тогтмол ID)',
        usage: 'python manage.py translate_formula_titles',
        flags: [
          '--apply — Бодитоор хадгалах (заагаагүй бол зөвхөн dry-run)',
        ],
        note: 'Нэг удаагийн засвар — ID жагсаалт кодонд тогтмол.',
      },
    ],
  },
];

// ── Туслах компонентууд ──────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      className="btn btn-sm btn-outline-secondary py-0 px-1 ms-2 flex-shrink-0"
      onClick={handleCopy}
      title="Хуулах"
      style={{ fontSize: '0.75rem' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function CommandCard({ cmd, color }) {
  const [open, setOpen] = useState(false);
  const hasDetail = cmd.flags.length > 0 || cmd.note || cmd.examples?.length;

  return (
    <Card className="mb-2 border-0" style={{ background: '#f8f9fa' }}>
      <Card.Body className="py-2 px-3">
        {/* Header row */}
        <div
          className="d-flex align-items-start justify-content-between gap-2"
          style={{ cursor: hasDetail ? 'pointer' : 'default' }}
          onClick={() => hasDetail && setOpen(o => !o)}
        >
          <div className="flex-grow-1 min-w-0">
            <code className="fw-bold me-2" style={{ color, fontSize: '0.9rem' }}>
              {cmd.name}
            </code>
            <span className="text-muted small">{cmd.help}</span>
          </div>
          {hasDetail && (
            <span className="text-muted flex-shrink-0" style={{ marginTop: 2 }}>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>

        {/* Usage */}
        <div className="mt-1 d-flex align-items-center">
          <code
            className="small px-2 py-1 rounded text-nowrap overflow-auto"
            style={{ background: '#212529', color: '#f8f9fa', maxWidth: '100%' }}
          >
            {cmd.usage}
          </code>
          <CopyButton text={cmd.usage} />
        </div>

        {/* Expandable detail */}
        {open && hasDetail && (
          <div className="mt-2">
            {cmd.flags.length > 0 && (
              <div className="mb-1">
                {cmd.flags.map((flag, i) => {
                  const [flagName, ...rest] = flag.split(' — ');
                  return (
                    <div key={i} className="small text-muted ps-2 py-0" style={{ lineHeight: 1.6 }}>
                      <code className="small" style={{ color: '#6f42c1' }}>{flagName.trim()}</code>
                      {rest.length > 0 && <span className="ms-1">{rest.join(' — ')}</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {cmd.note && (
              <div className="mt-1 small px-2 py-1 rounded" style={{ background: '#fff3cd', color: '#856404' }}>
                ⚠ {cmd.note}
              </div>
            )}
            {cmd.examples?.length > 0 && (
              <div className="mt-2">
                <div className="small fw-medium text-muted ps-1 mb-1">Жишээ:</div>
                {cmd.examples.map((ex, i) => (
                  <div key={i} className="mb-1 d-flex align-items-center ps-1">
                    <code
                      className="small px-2 py-1 rounded text-nowrap overflow-auto"
                      style={{ background: '#212529', color: '#f8f9fa' }}
                    >
                      {ex}
                    </code>
                    <CopyButton text={ex} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// ── Үндсэн хуудас ────────────────────────────────────────────────────────────

function DjangoCommandsPage() {
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(() => {
    const init = {};
    DJANGO_COMMANDS.forEach((_, i) => { init[i] = true; });
    return init;
  });

  const toggleCat = (i) => setOpenCats(prev => ({ ...prev, [i]: !prev[i] }));

  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return DJANGO_COMMANDS;
    return DJANGO_COMMANDS.map(cat => ({
      ...cat,
      commands: cat.commands.filter(cmd =>
        cmd.name.toLowerCase().includes(q) ||
        cmd.help.toLowerCase().includes(q) ||
        cmd.flags.some(f => f.toLowerCase().includes(q))
      ),
    })).filter(cat => cat.commands.length > 0);
  }, [q]);

  const totalCommands = DJANGO_COMMANDS.reduce((s, c) => s + c.commands.length, 0);
  const filteredTotal = filtered.reduce((s, c) => s + c.commands.length, 0);

  return (
    <Container className="py-4" style={{ maxWidth: 860 }}>
      {/* Header */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <Terminal size={28} style={{ color: '#20c997' }} />
              <h1 className="mb-0 h4">Django Management Commands</h1>
              <Badge bg="secondary" className="fs-6">{totalCommands} команд</Badge>
            </div>
            <Link to="/admin" className="btn btn-outline-secondary btn-sm">
              ‹ Admin
            </Link>
          </div>

          {/* Info card */}
          <Card className="shadow-sm mb-3 border-0" style={{ background: '#f0fff4' }}>
            <Card.Body className="py-2 px-3">
              <p className="text-muted mb-1 small">
                Бүх коммандууд <code>cd backend</code> хавтаснаас ажиллана.
              </p>
              <p className="text-muted mb-0 small">
                <code>--dry-run</code> — өөрчлөлт хийхгүйгээр урьдчилан харах. Анх удаа ажиллуулахдаа заавал ашиглаарай.
              </p>
            </Card.Body>
          </Card>

          {/* Search */}
          <InputGroup>
            <InputGroup.Text style={{ background: '#fff' }}>
              <Search size={15} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Команд хайх..."
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
              {filteredTotal} команд олдлоо
            </div>
          )}
        </Col>
      </Row>

      {/* Categories */}
      {filtered.map((cat, catIdx) => (
        <div key={catIdx} className="mb-3">
          <div
            className="d-flex align-items-center gap-2 mb-2 px-1 py-1 rounded"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => toggleCat(catIdx)}
          >
            <span
              className="d-inline-block rounded-circle flex-shrink-0"
              style={{ width: 12, height: 12, background: cat.color }}
            />
            <span className="fw-semibold" style={{ color: cat.color }}>
              {cat.icon} {cat.category}
            </span>
            <Badge bg="light" text="dark" className="ms-1">
              {cat.commands.length}
            </Badge>
            <span className="text-muted ms-auto">
              {openCats[catIdx] !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </div>

          {openCats[catIdx] !== false && (
            <div className="ps-2">
              {cat.commands.map((cmd, i) => (
                <CommandCard key={i} cmd={cmd} color={cat.color} />
              ))}
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-muted py-5">
          <Search size={32} className="mb-2 opacity-25" />
          <div>"{search}" хайлтанд тохирох команд олдсонгүй</div>
        </div>
      )}
    </Container>
  );
}

export default DjangoCommandsPage;
