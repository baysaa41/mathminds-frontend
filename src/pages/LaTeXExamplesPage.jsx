// src/pages/LaTeXExamplesPage.jsx
// Бүх LaTeX жишээнүүдийг нэгэн зэрэг харуулах хуудас

import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { MathJax } from 'better-react-mathjax';
import { Copy, Check } from 'lucide-react';
import AppBreadcrumb from '../components/common/AppBreadcrumb';
import { LATEX_EXAMPLES } from '../components/LatexTutorialWidget';

const LaTeXExamplesPage = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    setPageTitle('LaTeX Жишээнүүд');
    return () => setPageTitle('Нүүр');
  }, [setPageTitle]);

  const handleCopy = (code, index) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => {
          setCopiedIndex(null);
        }, 2000);
      })
      .catch((err) => {
        console.error('Кодыг хуулахад алдаа гарлаа: ', err);
      });
  };

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="mb-4">
        <AppBreadcrumb className="mb-3" items={[{ label: 'LaTeX жишээнүүд' }]} />

        <Card className="shadow-sm border-0 bg-light">
          <Card.Body>
            <h1 className="h4 mb-2">LaTeX Жишээнүүд</h1>
            <p className="text-muted mb-0">
              Математикийн томьёо бичихэд ашигладаг LaTeX синтаксийн бүх жишээнүүд
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Бүх жишээнүүд */}
      <Row xs={1} className="g-4">
        {LATEX_EXAMPLES.map((example, index) => (
          <Col key={index}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h5 className="fw-bold mb-3">
                  {index + 1}. {example.title}
                </h5>
                <p className="text-muted small mb-3">{example.description}</p>

                {/* Код хэсэг */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="small">Код (Бичиглэл):</strong>
                  <Button
                    variant={copiedIndex === index ? 'success' : 'light'}
                    size="sm"
                    onClick={() => handleCopy(example.code, index)}
                    disabled={copiedIndex === index}
                    className="d-flex align-items-center"
                  >
                    {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                    <span className="ms-1 small">
                      {copiedIndex === index ? 'Хуулсан!' : 'Хуулах'}
                    </span>
                  </Button>
                </div>

                <pre
                  className="bg-light p-3 rounded small mb-3"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                >
                  <code>{example.code}</code>
                </pre>

                {/* Үр дүн */}
                <strong className="small d-block mb-2">Үр дүн (Харагдах байдал):</strong>
                <div
                  className="border p-4 rounded bg-white"
                  style={{ overflowX: 'auto', minHeight: '50px' }}
                >
                  <MathJax>{example.code}</MathJax>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Төгсгөл мэдэгдэл */}
      <div className="text-center py-4">
        <p className="text-muted small mb-0">Нийт {LATEX_EXAMPLES.length} жишээ</p>
      </div>
    </Container>
  );
};

export default LaTeXExamplesPage;
