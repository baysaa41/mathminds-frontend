// frontend/src/components/LatexTutorialWidget.jsx
// (!!!) ШИНЭЧИЛСЭН: Код хуулах товч болон padding нэмсэн

import { useState, useCallback, useEffect } from 'react'; // (!!!) 1. useEffect нэмэх
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { MathJax } from 'better-react-mathjax';
// (!!!) 2. Шинэ icon-уудыг импортлох
import { RefreshCw, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

// LaTeX-ийн жишээнүүд
const LATEX_EXAMPLES = [
    {
        title: 'Квадрат тэгшитгэлийн шийд',
        code: '$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$',
        description: '`\\frac{...}{...}` (бутархай) болон `\\sqrt{...}` (язгуур) ашиглах.'
    },
    {
        title: 'Индекс ба Зэрэг',
        code: '$a_i^2 + b_{i+1}^n$',
        description: 'Доод индекс `_` (underscore), дээд зэрэг `^` (caret) тэмдгээр бичнэ.'
    },
    {
        title: 'Нийлбэр ба Интеграл',
        code: '$\\sum_{i=1}^{N} i \\quad \\int_{a}^{b} f(x) \\,dx$',
        description: '`\\sum_{...}^{...}` (нийлбэр) болон `\\int_{...}^{...}` (интеграл).'
    },
    {
        title: 'Грек үсгүүд',
        code: '$\\alpha, \\beta, \\gamma, \\Delta, \\Omega, \\pi$',
        description: 'Грек үсгүүдийг `\\alpha`, `\\beta` гэх мэт бичнэ. (Жишээ нь: $\\pi \\approx 3.14$)'
    },
    {
        title: 'Хязгаар',
        code: '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$',
        description: '`\\lim_{...}` (хязгаар) болон `\\to` (тэмүүлэх) ашиглах.'
    },
    {
        title: 'Матриц (pmatrix)',
        code: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$',
        description: '`\\begin{pmatrix} ... \\end{pmatrix}` орчинг ашиглана. Шинэ мөрийг `\\\\` -р тусгаарлана.'
    },
    {
        title: 'Тодорхойлогдсон Макро',
        code: '$\\tg(x) = \\frac{\\sin(x)}{\\cos(x)}$',
        description: 'Тохиргооноос (mathjax.config.js) `\\tg` макрог ашиглаж байна.'
    },
    {
        title: 'Олонлогийн тэмдэгтүүд',
        code: '$\\forall x \\in \\mathbb{R}, \\exists y \\text{ s.t. } y > x$',
        description: '`\\forall` (бүх), `\\in` (харьяалагдах), `\\mathbb{R}` (бодит тоо), `\\exists` (орших).'
    }
];

const LatexTutorialWidget = () => {
    const totalExamples = LATEX_EXAMPLES.length;

    // Индексийг state-д хадгалах
    const getInitialIndex = () => Math.floor(Math.random() * totalExamples);
    const [currentIndex, setCurrentIndex] = useState(getInitialIndex);

    // (!!!) 3. Хуулсан эсэхийг хадгалах state
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

    // (!!!) 4. Код хуулах функц
    const handleCopy = useCallback(() => {
        const codeToCopy = LATEX_EXAMPLES[currentIndex].code;
        navigator.clipboard.writeText(codeToCopy)
            .then(() => {
                setIsCopied(true);
            })
            .catch(err => {
                console.error('Кодыг хуулахад алдаа гарлаа: ', err);
            });
    }, [currentIndex]); // currentIndex өөрчлөгдөхөд энэ функц дахин үүснэ

    // (!!!) 5. 'isCopied' state-г удирдах useEffect
    useEffect(() => {
        // isCopied = true бол 2 секундын дараа буцааж false болгох
        if (isCopied) {
            const timer = setTimeout(() => {
                setIsCopied(false);
            }, 2000); // 2 секунд

            // Хэрэв 2 секунд болоогүй байхад жишээ солигдвол timer-г цэвэрлэх
            return () => clearTimeout(timer);
        }
    }, [isCopied]); // 'isCopied' state өөрчлөгдөх бүрт ажиллана

    // (!!!) 6. Жишээ солигдох үед 'isCopied' state-г false болгох
    useEffect(() => {
        setIsCopied(false);
    }, [currentIndex]); // 'currentIndex' өөрчлөгдөх бүрт ажиллана

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

                {/* (!!!) 7. Код хуулах товчтой хэсэг */}
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>Код (Бичиглэл):</strong>
                    <Button
                        variant={isCopied ? "success" : "light"} // Өнгө өөрчлөгдөнө
                        size="sm"
                        onClick={handleCopy}
                        disabled={isCopied} // Хуулж байх үед дахин дарахыг хориглоно
                        className="d-flex align-items-center"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        <span className="ms-1">
                            {isCopied ? 'Хуулсан!' : 'Хуулах'}
                        </span>
                    </Button>
                </div>

                {/* (!!!) 8. Кодын padding-г p-3 болгов */}
                <pre className="bg-light p-3 rounded small" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    <code>{currentExample.code}</code>
                </pre>

                <strong className="mt-2 d-block">Үр дүн (Харагдах байдал):</strong>

                {/* (!!!) 9. Үр дүнгийн padding-г p-4 (том) болгов */}
                <div
                    className="border p-4 rounded bg-white mt-1"
                    style={{ overflowX: 'auto', minHeight: '50px' }} // minHeight-г 50px болгов
                >
                    <MathJax>
                        {currentExample.code}
                    </MathJax>
                </div>
            </Card.Body>
        </Card>
    );
};

export default LatexTutorialWidget;