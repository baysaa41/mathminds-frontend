// src/pages/DjangoCommandsPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Accordion, Badge } from 'react-bootstrap';
import { Terminal, Copy, Check, ArrowLeft } from 'lucide-react';

const DJANGO_COMMANDS = [
  {
    category: 'Бодлого & Контент',
    color: '#0d6efd',
    commands: [
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
          '--quiz-title <текст> — Quiz нэрээр хайх (uuid-тай харилцан хамааралтай)',
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
    ],
  },
  {
    category: 'AI Боловсруулалт',
    color: '#6f42c1',
    commands: [
      {
        name: 'categorize_problems_gemini',
        help: 'Gemini AI-р бодлогуудыг категори/хүндрэлээр ангилах',
        usage: 'python manage.py categorize_problems_gemini',
        flags: [
          '--limit <N> — Хэдэн бодлого (default: 10)',
          '--all — Бүх категоригүй бодлого',
          '--problem-id <id> — Тодорхой бодлого',
          '--quiz-uuid <uuid> — Quiz-ийн бүх бодлого',
          '--force — Дахин ангилах',
          '--dry-run — Хадгалахгүй',
          '--category-only — Зөвхөн категори',
          '--level-only — Зөвхөн level',
          '--model <нэр> — Gemini model (default: gemini-2.0-flash)',
        ],
      },
      {
        name: 'categorize_problems',
        help: 'OpenAI-р бодлогуудыг категори/хүндрэлээр ангилах',
        usage: 'python manage.py categorize_problems',
        flags: [
          '--limit <N> — Хэдэн бодлого (default: 10)',
          '--all — Бүх категоригүй',
          '--problem-id <id> — Тодорхой бодлого',
          '--quiz-uuid <uuid> — Quiz',
          '--force — Дахин ангилах',
          '--dry-run — Хадгалахгүй',
          '--category-only / --level-only',
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
      {
        name: 'map_categories',
        help: 'Хуучин Categories-аас MathCategory тодорхойлох',
        usage: 'python manage.py map_categories',
        flags: [
          '--dry-run — Хадгалахгүй',
          '--limit <N> — Хэдэн бодлого (0 = бүгд)',
          '--force — Дахин тодорхойлох',
        ],
      },
      {
        name: 'train_classifier',
        help: 'ML ангилагчуудыг сургах (subject + math category)',
        usage: 'python manage.py train_classifier',
        flags: [
          '--min-confidence <0-1> — Зөвхөн энэ confidence-аас дээш labeled бодлогуудыг ашиглах',
          '--subject-only — Зөвхөн subject модель сургах',
          '--math-only — Зөвхөн math category модель сургах',
        ],
      },
      {
        name: 'classify_offline',
        help: 'Offline ML + Gemini fallback-аар бодлого ангилах (subject + math category)',
        usage: 'python manage.py classify_offline',
        flags: [
          '--limit <N> — Хэдэн бодлого (default: 50)',
          '--all — Бүх ангилагдаагүй бодлого',
          '--problem-id <id> — Тодорхой бодлого',
          '--quiz-uuid <uuid> — Quiz-ийн бүх бодлого',
          '--force — Дахин ангилах',
          '--dry-run — Хадгалахгүй',
          '--no-fallback — Gemini хэрэглэхгүй (зөвхөн ML)',
          '--threshold <0-1> — Confidence threshold (default: 0.6)',
          '--model <нэр> — Gemini model (default: gemini-2.0-flash)',
          '--subject-only — Зөвхөн subject ангилах',
          '--math-only — Зөвхөн math category ангилах',
        ],
      },
      {
        name: 'fix_subject_labels',
        help: 'Буруу subject label-тай бодлогуудыг тусгай нэр томьёогоор олж засах',
        usage: 'python manage.py fix_subject_labels',
        flags: [
          '--dry-run — Хадгалахгүй, тоолох',
          '--subject <chemistry|physics|biology> — Тодорхой subject',
          '--verbose — Жишээ бодлогуудыг харуулах',
        ],
      },
    ],
  },
  {
    category: 'Хичээлийн хөтөлбөр',
    color: '#198754',
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
        name: 'import_mmo_teachers',
        help: 'MMO-оос сургуулийн багш нарыг импортлох (60000 зоос)',
        usage: 'python manage.py import_mmo_teachers',
        flags: [
          '--dry-run — Хадгалахгүй',
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
        help: 'ЭЕШ блюпринт дагуу 36 сонгох + 4 нөхөх quiz автоматаар үүсгэх',
        usage: 'python manage.py generate_eesh_quiz --year 2026 --variant A',
        flags: [
          '--year <он> — Блюпринтийн он: 2025 эсвэл 2026 (default: 2026)',
          '--variant <A|B|...> — Хувилбарын нэр (default: A)',
          '--exclude-quizzes <id,...> — Давтагдахаас хассах quiz ID-ууд',
          '--source <eesh-batch|all> — eesh-batch: Багц-аас үүсгэсэн, all: бүх pool (default: all)',
          '--seed <N> — Random seed (нэг дүнг давтах)',
          '--public — Нийтэд нээлттэй байдлаар үүсгэх (default: хаалттай)',
          '--dry-run — Quiz хадгалахгүй, pool статистик харуулах',
        ],
        note: '2025 vs 2026 ялгаа: ALGEBRA 11→12, PROBABILITY 7→6. Одоо даруй ажиллана — таглалт заавал биш (fallback ажиллана).',
        examples: [
          'python manage.py generate_eesh_quiz --year 2026 --variant A --dry-run',
          'python manage.py generate_eesh_quiz --year 2026 --variant A --public',
          'python manage.py generate_eesh_quiz --year 2026 --variant B --exclude-quizzes 192,331 --public',
          'python manage.py generate_eesh_quiz --year 2025 --variant A --public',
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
        note: 'Интерактив горим: [y] хадгал · [r] дахин үүсгэх · [s] алгасах · [q] гарах. Бодлогуудын автор: baysa.',
        examples: [
          'python manage.py create_eesh_problems --category ALGEBRA --type mc --count 3',
          'python manage.py create_eesh_problems --category GEOMETRY --type fill --count 2 --level 3',
          'python manage.py create_eesh_problems --all-categories --type mc --count 5 --no-confirm',
        ],
      },
      {
        name: 'fill_eesh_quiz',
        help: 'ЭЕШ темплэйт тест үүсгэж, бодлогуудыг Claude API-р нэг нэгээр солих (дурын үед зогсоож, үргэлжлүүлнэ)',
        usage: 'python manage.py fill_eesh_quiz --create --year 2026 --variant A',
        flags: [
          '--create — Шинэ темплэйт тест үүсгэх (байгаа бодлогуудаар)',
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
    category: 'Төлбөр & Мессеж',
    color: '#ffc107',
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
      {
        name: 'migrate_private_messages',
        help: 'Хуучин private Post-уудыг шинэ Conversation системд шилжүүлэх',
        usage: 'python manage.py migrate_private_messages',
        flags: [
          '--commit — Жинхэнэ шилжүүлэх (default: dry-run)',
          '--delete-old — Хуучин post-уудыг устгах',
        ],
      },
      {
        name: 'cleanup_duplicate_messages',
        help: 'Давхардсан мессежүүдийг устгах',
        usage: 'python manage.py cleanup_duplicate_messages',
        flags: [
          '--commit — Жинхэнэ устгах (default: dry-run)',
        ],
      },
    ],
  },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      className="btn btn-sm btn-outline-secondary py-0 px-1 ms-2"
      onClick={handleCopy}
      title="Хуулах"
      style={{ fontSize: '0.75rem' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function DjangoCommandsPage() {
  const totalCommands = DJANGO_COMMANDS.reduce((sum, cat) => sum + cat.commands.length, 0);

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <Terminal size={32} style={{ color: '#20c997' }} className="me-2" />
              <h1 className="mb-0">Django Management Commands</h1>
              <Badge bg="secondary" className="ms-3 fs-6">
                {totalCommands} комманд
              </Badge>
            </div>
            <Link to="/admin" className="btn btn-outline-secondary btn-sm">
              ‹ Admin Dashboard
            </Link>
          </div>
          <Card className="shadow-sm">
            <Card.Body>
              <p className="text-muted mb-2">
                Бүх коммандууд <code>cd backend</code> хавтаснаас ажиллана.
              </p>
              <p className="text-muted mb-0 small">
                <code>--dry-run</code> flag нь өөрчлөлт хийхгүйгээр үр дүнг харуулна.
                Анх удаа ажиллуулахдаа заавал <code>--dry-run</code> ашиглаарай.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Accordion defaultActiveKey="0">
        {DJANGO_COMMANDS.map((cat, catIdx) => (
          <Accordion.Item eventKey={String(catIdx)} key={catIdx}>
            <Accordion.Header>
              <span
                className="d-inline-block rounded-circle me-2"
                style={{ width: 14, height: 14, backgroundColor: cat.color }}
              />
              <strong>{cat.category}</strong>
              <Badge bg="light" text="dark" className="ms-2">
                {cat.commands.length}
              </Badge>
            </Accordion.Header>
            <Accordion.Body className="p-2">
              {cat.commands.map((cmd, cmdIdx) => (
                <Card key={cmdIdx} className="mb-2 border-0 bg-light">
                  <Card.Body className="py-2 px-3">
                    <div className="d-flex align-items-start justify-content-between">
                      <div>
                        <code className="fw-bold" style={{ color: cat.color }}>
                          {cmd.name}
                        </code>
                        <span className="text-muted ms-2 small">{cmd.help}</span>
                      </div>
                    </div>
                    <div className="mt-1 d-flex align-items-center">
                      <code className="small bg-dark text-light px-2 py-1 rounded">
                        {cmd.usage}
                      </code>
                      <CopyButton text={cmd.usage} />
                    </div>
                    {cmd.flags.length > 0 && (
                      <div className="mt-1">
                        {cmd.flags.map((flag, fIdx) => (
                          <div key={fIdx} className="small text-muted ps-2">
                            <code className="small">{flag.split(' — ')[0]}</code>
                            {flag.includes(' — ') && (
                              <span className="ms-1">{flag.split(' — ')[1]}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {cmd.note && (
                      <div className="mt-2 small px-2 py-1 rounded" style={{ background: '#fff3cd', color: '#856404' }}>
                        ⚠ {cmd.note}
                      </div>
                    )}
                    {cmd.examples && cmd.examples.length > 0 && (
                      <div className="mt-2">
                        <div className="small text-muted ps-2 mb-1">Жишээ:</div>
                        {cmd.examples.map((ex, eIdx) => (
                          <div key={eIdx} className="mt-1 d-flex align-items-center ps-2">
                            <code className="small bg-dark text-light px-2 py-1 rounded">{ex}</code>
                            <CopyButton text={ex} />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </Container>
  );
}

export default DjangoCommandsPage;
