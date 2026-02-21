// frontend/src/components/LatexTutorialWidget.jsx
// ✅ ШИНЭЧИЛСЭН: Бүх жишээ харах товч нэмэгдсэн

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { MathJax } from 'better-react-mathjax';
import { RefreshCw, ChevronLeft, ChevronRight, Copy, Check, BookOpen } from 'lucide-react';

// LaTeX-ийн жишээнүүд
export const LATEX_EXAMPLES = [
  {
    title: 'Үндсэн тэмдэгтүүд ба илэрхийлэл',
    code: '$a + b = c, \\quad x - y, \\quad 2x + 3y = 5$',
    description:
      'Ердийн тэгшитгэл, нэмэх, хасах, үржих тэмдэгтүүдийг LaTeX-д жирийн байдлаар бичдэг.',
  },
  {
    title: 'Бутархай ба язгуур',
    code: '$\\frac{a+b}{c-d}, \\quad \\sqrt{x^2 + 1}, \\quad \\sqrt[3]{8} = 2$',
    description:
      '`\\frac{...}{...}` — бутархай, `\\sqrt{...}` — язгуур, `\\sqrt[n]{...}` — n-тын язгуур.',
  },
  {
    title: 'Индекс ба зэрэг',
    code: '$a_i, \\; b_{i+1}^2, \\; x^n + y^n$',
    description:
      'Доод индексийг `_`, дээд зэргийг `^` тэмдгээр бичдэг. Олон тэмдэгттэй бол `{}` хаалт хэрэглэнэ.',
  },
  {
    title: 'Грек үсгүүд ба тогтмолууд',
    code: '$\\alpha, \\beta, \\gamma, \\pi, \\Delta, \\Omega$',
    description:
      'Грек үсгүүдийг `\\alpha`, `\\beta`, `\\pi` гэх мэтээр бичдэг. ($\\pi \\approx 3.14$)',
  },
  {
    title: 'Нийлбэр ба үржвэр',
    code: '$\\sum_{i=1}^{n} i^2, \\quad \\prod_{k=1}^{n} k = n!$',
    description: '`\\sum` — нийлбэрийн тэмдэг, `\\prod` — үржвэрийн тэмдэг.',
  },
  {
    title: 'Интеграл ба уламжлал',
    code: '$\\int_{0}^{1} x^2 \\, dx, \\quad \\frac{dy}{dx} = 2x$',
    description: '`\\int_{a}^{b}` — тодорхой интеграл, `\\frac{dy}{dx}` — уламжлалын тэмдэглэл.',
  },
  {
    title: 'Хязгаар ба тэмүүлэх',
    code: '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$',
    description: '`\\lim_{x \\to a}` — хязгаар, `\\to` — тэмүүлэхийг илэрхийлнэ.',
  },
  {
    title: 'Матриц ба вектор',
    code: '$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}, \\quad \\vec{v} = (v_1, v_2)$',
    description: '`\\begin{pmatrix} ... \\end{pmatrix}` — матриц, `\\vec{v}` — вектор.',
  },
  {
    title: 'Хэсэгчилэн тодорхойлогдсон функц',
    code: '$f(x) = \\begin{cases} x^2, & x \\ge 0 \\\\ -x, & x < 0 \\end{cases}$',
    description: 'Тохирох нөхцөлөөр функц тодорхойлохдоо `\\begin{cases}` орчинг ашиглана.',
  },
  {
    title: 'Олонлог ба логик тэмдэгтүүд',
    code: '$\\forall x \\in \\mathbb{R}, \\; \\exists y > x, \\; A \\cap B, \\; A \\cup B, \\; A \\subseteq B$',
    description:
      '`\\forall`, `\\exists`, `\\in`, `\\cap`, `\\cup`, `\\subseteq` — олонлог ба логик тэмдэглэлүүд.',
  },
  {
    title: 'Гурвалжин ба тригонометр',
    code: '$\\sin^2 x + \\cos^2 x = 1, \\quad \\tan x = \\frac{\\sin x}{\\cos x}$',
    description: 'Тригонометрийн үндсэн тэгшитгэлүүдийг `\\sin`, `\\cos`, `\\tan` ашиглан бичдэг.',
  },
  {
    title: 'Тэгшитгэл, тогтмол ба тэмдэглэгээ',
    code: '$e^{i\\pi} + 1 = 0, \\quad c^2 = a^2 + b^2$',
    description:
      'Математикийн алдарт тэгшитгэлүүдийн жишээ. `e^{i\\pi}` зэрэг илэрхийлэл дээд зэрэг хэрэглэнэ.',
  },
  {
    title: 'Display командууд',
    code: '$\\dfrac{a}{b+c}, \\quad \\lim\\limits_{x\\to 1} f(x), \\quad \\sum\\limits_{k=1}^{n} k, \\quad \\displaystyle\\int_a^b f(x) \\, dx$',
    description:
      '`\\dfrac`, `\\limits`, `\\displaystyle` зэрэг командыг ашигласнаар томьёог “display” хэлбэрээр буюу илүү том, уншихад хялбар дүрслэлтэйгээр бичиж болно.',
  },
];

const LatexTutorialWidget = () => {
  const navigate = useNavigate();
  const totalExamples = LATEX_EXAMPLES.length;

  // Индексийг state-д хадгалах
  const getInitialIndex = () => Math.floor(Math.random() * totalExamples);
  const [currentIndex, setCurrentIndex] = useState(getInitialIndex);

  // Хуулсан эсэхийг хадгалах state
  const [isCopied, setIsCopied] = useState(false);

  // --- Навигацын функцууд ---
  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalExamples) % totalExamples);
  }, [totalExamples]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalExamples);
  }, [totalExamples]);

  const handleRandom = useCallback(() => {
    if (totalExamples <= 1) return;
    let newIndex = Math.floor(Math.random() * totalExamples);
    while (newIndex === currentIndex) {
      newIndex = Math.floor(Math.random() * totalExamples);
    }
    setCurrentIndex(newIndex);
  }, [totalExamples, currentIndex]);

  // Код хуулах функц
  const handleCopy = useCallback(() => {
    const codeToCopy = LATEX_EXAMPLES[currentIndex].code;
    navigator.clipboard
      .writeText(codeToCopy)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error('Кодыг хуулахад алдаа гарлаа: ', err);
      });
  }, [currentIndex]);

  // 'isCopied' state-г удирдах useEffect
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  // Жишээ солигдох үед 'isCopied' state-г false болгох
  useEffect(() => {
    setIsCopied(false);
  }, [currentIndex]);

  // --- Рендер ---
  if (totalExamples === 0) {
    return null;
  }

  const currentExample = LATEX_EXAMPLES[currentIndex];

  return (
    <Card className="border-0 shadow-sm mt-3">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex align-items-center justify-content-between">
          <strong className="text-primary">LaTeX Зөвлөгөө</strong>
          <ButtonGroup size="sm">
            <Button variant="light" onClick={handlePrevious} title="Өмнөх">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="light" onClick={handleRandom} title="Өөр жишээ">
              <RefreshCw size={16} />
            </Button>
            <Button variant="light" onClick={handleNext} title="Дараах">
              <ChevronRight size={16} />
            </Button>
          </ButtonGroup>
        </div>
      </Card.Header>
      <Card.Body>
        <h6 className="fw-bold">{currentExample.title}</h6>
        <p className="small text-muted mb-2">{currentExample.description}</p>

        {/* Код хуулах товчтой хэсэг */}
        <div className="d-flex justify-content-between align-items-center mb-1">
          <strong>Код (Бичиглэл):</strong>
          <Button
            variant={isCopied ? 'success' : 'light'}
            size="sm"
            onClick={handleCopy}
            disabled={isCopied}
            className="d-flex align-items-center"
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            <span className="ms-1">{isCopied ? 'Хуулсан!' : 'Хуулах'}</span>
          </Button>
        </div>

        <pre
          className="bg-light p-3 rounded small"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
        >
          <code>{currentExample.code}</code>
        </pre>

        <strong className="mt-2 d-block">Үр дүн (Харагдах байдал):</strong>

        <div
          className="border p-4 rounded bg-white mt-1 mb-3"
          style={{ overflowX: 'auto', minHeight: '50px' }}
        >
          <MathJax>{currentExample.code}</MathJax>
        </div>

        {/* Бүх жишээ харах товч */}
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => navigate('/latex-examples')}
          className="w-100"
        >
          <BookOpen size={16} className="me-2" />
          Бүх жишээ харах ({totalExamples})
        </Button>
      </Card.Body>
    </Card>
  );
};

export default LatexTutorialWidget;
