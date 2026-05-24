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
          '--update — UUID давхцвал шинэчлэх (default: алгасах)',
          '--default-author <username> — Зохиогч олдохгүй бол ашиглах',
          '--skip-solutions — Бодолт импортлохгүй',
          '--skip-keywords — Түлхүүр үг импортлохгүй',
          '--add-to-quiz <quiz_id> — Тодорхой quiz-д нэмэх',
          '--skip-quiz — Quiz metadata байсан ч quiz үүсгэхгүй',
          '--extra-keywords "kw1,kw2" — Бүх бодлогод нэмэлт keyword нэмэх',
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
          '--quiz-id <id> — Quiz-ийн бүх бодлого',
          '--quiz-title <text> — Quiz нэрээр хайх',
          '--published — Зөвхөн нийтлэгдсэн',
          '--no-solutions — Бодолтгүй экспортлох',
          '--pretty — JSON-г уншигдахуйцаар форматлах',
        ],
      },
      {
        name: 'import_textbook',
        help: 'Сурах бичгийн зургуудаас бодлого, томьёо задлах (Gemini AI)',
        usage: 'python manage.py import_textbook <зургийн_хавтас>',
        flags: [
          '--batch-size <N> — Нэг API дуудалтад хэдэн зураг (default: 4)',
          '--start <N> — Эхлэх зургийн индекс (0-based)',
          '--end <N> — Дуусах зургийн индекс',
          '--dry-run — Хадгалахгүй',
          '--author <username> — Зохиогч (default: id=1)',
          '--keywords "kw1,kw2" — Бүх агуулгад нэмэх keyword',
          '--public — Нийтэд харагдахаар тохируулах',
          '--save-json — JSON файлд хадгалах',
          '--glob "*.jpg" — Зургийн файлын pattern',
          '--create-program — Curriculum Program үүсгэх',
          '--program-name <нэр> — Program-ын нэр',
          '--program-code <код> — Program-ын код',
          '--grade <N> — Ангийн дугаар',
          '--problems-only — Зөвхөн бодлого',
          '--formulas-only — Зөвхөн томьёо/теорем',
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
        ],
      },
      {
        name: 'import_egmo',
        help: 'EGMO олимпиадын PDF-уудыг импортлох (Gemini AI)',
        usage: 'python manage.py import_egmo <хавтас>',
        flags: [
          '--year <он> — Зөвхөн тодорхой он',
          '--dry-run — Хадгалахгүй',
          '--force — Давхардсан ч дахин оруулах',
          '--model <нэр> — Gemini model (default: gemini-2.5-flash)',
          '--author <username> — Зохиогч',
          '--delay <сек> — API хоорондын хүлээлт (default: 2)',
        ],
      },
      {
        name: 'import_tex_problems',
        help: 'LaTeX .tex файлаас бодлого, томьёо импортлох',
        usage: 'python manage.py import_tex_problems <file.tex>',
        flags: [
          '--model <нэр> — Gemini model (default: gemini-2.5-flash)',
          '--chunk-size <N> — Нэг chunk-ийн мөрийн тоо (default: 200)',
          '--dry-run — Хадгалахгүй',
          '--skip-problems — Бодлого задлахгүй',
          '--skip-formulas — Томьёо задлахгүй',
          '--problems-only — Зөвхөн бодлого',
          '--formulas-only — Зөвхөн томьёо',
          '--debug — Raw response хэвлэх',
          '--section-name <нэр> — Хэсгийн нэр (keyword болгон нэмнэ)',
          '--start-chunk <N> — Алгасах chunk тоо',
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
          '--no-solution — Бодолтгүй бодлогуудыг',
          '--dry-run — Хадгалахгүй',
          '--model <нэр> — Gemini model (default: gemini-2.0-flash)',
          '--delay <сек> — Хүсэлт хоорондын хугацаа (default: 1.0)',
        ],
      },
      {
        name: 'fix_latex_problems',
        help: 'Бодлогуудын математик тэмдэглэгээг LaTeX болгон хөрвүүлэх',
        usage: 'python manage.py fix_latex_problems',
        flags: [
          '--keyword <нэр> — Keyword-оор шүүх',
          '--problem-id <id> — Тодорхой бодлого',
          '--limit <N> — Хэдэн бодлого (default: 20)',
          '--all — Бүгдийг боловсруулах',
          '--dry-run — Хадгалахгүй',
          '--fix-solutions — Бодолтыг ч засах',
          '--force — LaTeX байсан ч дахин боловсруулах',
          '--model <нэр> — AI model (default: gemini-2.5-flash)',
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
        help: 'Keyword-аар бодолтгүй бодлогуудад AI-р бодолт үүсгэх',
        usage: 'python manage.py generate_solutions --keyword <нэр>',
        flags: [
          '--keyword <нэр> — Шалгах keyword',
          '--dry-run — Хадгалахгүй, зөвхөн харуулах',
          '--verbose — Дэлгэрэнгүй гаралт',
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--model <нэр> — Gemini model',
          '--delay <сек> — Хүсэлт хоорондын хугацаа',
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
        help: 'PDF/зургаас Gemini AI-р curriculum болон бодлого үүсгэх',
        usage: 'python manage.py generate_curriculum <файл_эсвэл_хавтас>',
        flags: [
          '--program-code <код> — Program код (заавал)',
          '--program-name <нэр> — Program нэр (заавал)',
          '--grade <N> — Ангийн дугаар (заавал)',
          '--academic-year <он> — Хичээлийн жил (default: 2025-2026)',
          '--year-start / --year-end — Эхлэх/Дуусах огноо',
          '--weeks <N> — Нийт долоо хоног (default: 34)',
          '--hours-per-week <N> — 7 хоногийн цаг (default: 2)',
          '--model <нэр> — Gemini model',
          '--dry-run — Хадгалахгүй',
          '--skip-problems — Бодлого задлахгүй',
          '--problems-only — Зөвхөн бодлого',
          '--skip-formulas — Томьёо алгасах',
          '--formulas-only — Зөвхөн томьёо',
          '--debug — Raw response хэвлэх',
          '--batch-size <N> — Нэг дуудалтад хэдэн файл (default: 5)',
          '--frontend-url <url> — Quiz холбоосонд ашиглах',
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
          '--tier <түвшин> — Түвшингээр шүүх',
          '--active-only — Зөвхөн идэвхтэй',
          '--activate-highest — Хамгийн өндөр эрхийг идэвхжүүлэх',
          '--verbose — Дэлгэрэнгүй',
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
        name: 'create_membership_products',
        help: 'Гишүүнчлэлийн бүтээгдэхүүнүүдийг үүсгэх',
        usage: 'python manage.py create_membership_products',
        flags: [
          '--reset — Хуучныг устгаж дахин үүсгэх',
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
          '--public — Нийтэд нээлттэй байдлаар үүсгэх (default: хаалттай)',
          '--dry-run — Quiz хадгалахгүй, pool статистик харуулах',
        ],
        note: 'math: 40 бодлого (36+4) | physics: 50 (46+4) | chemistry: 44 (40+4) | biology: 50 (46+4). Pool дутагдалтай бол auto_tag_problems командаар бодлогуудыг эхлээд таглана уу.',
        examples: [
          'python manage.py generate_eesh_quiz --year 2026 --variant A --dry-run',
          'python manage.py generate_eesh_quiz --subject physics --year 2026 --variant A --dry-run',
          'python manage.py generate_eesh_quiz --subject chemistry --year 2026 --variant A --public',
          'python manage.py generate_eesh_quiz --year 2026 --variant B --exclude-quizzes 192,331 --public',
        ],
      },
      {
        name: 'check_eesh_completeness',
        help: 'PDF/DOCX бодлогуудыг DB-тэй харьцуулж, дутуу бодлогыг нэмэх, keyword-ээр таглах',
        usage: 'python manage.py check_eesh_completeness --dir <хавтас>',
        flags: [
          '--dir <хавтас> — PDF/DOCX файлын хавтас',
          '--files <f1 f2...> — Тодорхой файлууд',
          '--min-sim <0-1> — Jaccard давхцлын босго (default: 0.30)',
          '--keyword <нэр> — Таглах keyword (default: "ЭЕШ жишиг")',
          '--tag-all — Тохирсон бодлогуудыг keyword-ээр таглах',
          '--add-missing — Дутуу бодлогуудыг DB-д нэмэх',
          '--show-missing — Олдоогүй бодлогуудыг дэлгэрэнгүй харуулах',
          '--report <файл> — JSON тайлан хадгалах',
        ],
        note: 'DOCX файлуудыг эхлээд PDF болгоно: libreoffice --headless --convert-to pdf *.docx',
        examples: [
          'python manage.py check_eesh_completeness --dir /home/deploy/Documents/1000problems --tag-all --add-missing',
          'python manage.py check_eesh_completeness --dir /home/deploy/Documents/1000problems --show-missing',
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
        help: 'ЭЕШ темплэйт тест үүсгэж, бодлогуудыг Claude API-р нэг нэгээр солих',
        usage: 'python manage.py fill_eesh_quiz --create --year 2026 --variant A',
        flags: [
          '--create — Шинэ темплэйт тест үүсгэх',
          '--year <он> — Блюпринтийн он (default: 2026)',
          '--variant <A|B|...> — Хувилбарын нэр (default: A)',
          '--quiz-id <id> — Дүүргэх / үргэлжлүүлэх quiz ID',
          '--from-order <N> — Хэдэн дугааргаас эхлэх (default: 1)',
          '--no-confirm — Баталгаажуулалгүйгээр шууд хадгалах',
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
