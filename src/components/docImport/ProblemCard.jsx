// src/components/docImport/ProblemCard.jsx
// DocImportPage-ийн задлагдсан нэг бодлогыг засварлах карт

import { useState } from 'react';
import LivePreview from '../LivePreview.jsx';

import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import { PROBLEM_TYPES } from './docImportUtils.js';

export default function ProblemCard({ prob, index, onChange, onDelete, extractedImages, onImageAttach, onImageDetach }) {
  const [previewMode, setPreviewMode] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const update = (field, val) => onChange(index, { ...prob, [field]: val });

  const attachedImages = prob.images || [];
  const hasFigure = prob.has_figure;
  const needsFigure = hasFigure && attachedImages.length === 0;

  return (
    <Card className={`mb-3 shadow-sm border-0 ${needsFigure ? 'border-start border-warning border-3' : ''}`}>
      <Card.Header className="d-flex justify-content-between align-items-center py-2 bg-white border-bottom">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <Badge bg="primary" className="rounded-pill">#{index + 1}</Badge>
          {prob.source_number != null && (
            <span className="text-muted small">Бодлого {prob.source_number}</span>
          )}
          {hasFigure && (
            <Badge bg={needsFigure ? 'warning' : 'success'} text={needsFigure ? 'dark' : 'white'}>
              {needsFigure ? '⚠️ Зураг хавсаргаагүй' : '🖼 Зурагтай'}
            </Badge>
          )}
          <Form.Check
            type="switch"
            id={`pub-${prob._key}`}
            label="Нийтэд харагдах"
            checked={prob.is_public}
            onChange={(e) => update('is_public', e.target.checked)}
            className="mb-0 small"
          />
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant={previewMode ? 'primary' : 'outline-secondary'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? '✏️ Засах' : '👁 Харах'}
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => onDelete(index)}>
            🗑
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Гарчиг */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold small text-muted">ГАРЧИГ</Form.Label>
          <Form.Control
            size="sm"
            type="text"
            value={prob.title || ''}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Бодлогын гарчиг..."
          />
        </Form.Group>

        {/* Төрөл */}
        <Row className="mb-3 g-2">
          <Col xs={12} md={4}>
            <Form.Label className="fw-semibold small text-muted">ТӨРӨЛ</Form.Label>
            <Form.Select
              size="sm"
              value={prob.type}
              onChange={(e) => update('type', parseInt(e.target.value))}
            >
              {PROBLEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Form.Select>
          </Col>
          {prob.answer != null && (
            <Col xs={12} md={8}>
              <Form.Label className="fw-semibold small text-muted">ХАРИУЛТ / УТГА</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                value={prob.answer || ''}
                onChange={(e) => update('answer', e.target.value)}
                placeholder="Тооцоолсон хариулт (заавал биш)..."
              />
            </Col>
          )}
        </Row>

        {/* Statement */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="fw-semibold small text-muted mb-0">БОДЛОГЫН АГУУЛГА</Form.Label>
            {previewMode && <small className="text-muted">LaTeX урьдчилан харах</small>}
          </div>
          {previewMode ? (
            <div className="border rounded p-3 bg-light" style={{ minHeight: 80, fontSize: '0.9rem' }}>
              <LivePreview content={prob.statement} />
            </div>
          ) : (
            <Form.Control
              as="textarea"
              rows={4}
              value={prob.statement || ''}
              onChange={(e) => update('statement', e.target.value)}
              placeholder="Бодлогын текст (LaTeX дэмжинэ: $x^2$, $$\frac{a}{b}$$)..."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          )}
        </Form.Group>

        {/* Бодолт */}
        <Form.Group className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <Form.Label className="fw-semibold small text-muted mb-0">
              БОДОЛТ <span className="text-muted fw-normal">(заавал биш)</span>
            </Form.Label>
          </div>
          {previewMode && prob.solution ? (
            <div className="border rounded p-3 bg-light" style={{ minHeight: 60, fontSize: '0.9rem' }}>
              <LivePreview content={prob.solution} />
            </div>
          ) : (
            <Form.Control
              as="textarea"
              rows={3}
              value={prob.solution || ''}
              onChange={(e) => update('solution', e.target.value)}
              placeholder="Бодолтын текст (LaTeX дэмжинэ)..."
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          )}
        </Form.Group>

        {/* Хавсаргасан зурагнууд */}
        {attachedImages.length > 0 && (
          <div className="mb-3">
            <small className="text-muted fw-semibold d-block mb-2">ХАВСАРГАСАН ЗУРАГНУУД</small>
            <div className="d-flex flex-wrap gap-2">
              {attachedImages.map((img, ii) => (
                <div key={ii} className="position-relative">
                  <img
                    src={img}
                    alt={`img-${ii}`}
                    style={{
                      width: 80, height: 80, objectFit: 'contain',
                      borderRadius: 6, border: '1px solid #dee2e6',
                      background: '#f8f9fa', cursor: 'pointer',
                    }}
                    onClick={() => window.open(img, '_blank')}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    className="position-absolute top-0 end-0 p-0"
                    style={{ width: 20, height: 20, fontSize: 11, lineHeight: 1 }}
                    onClick={() => onImageDetach(index, ii)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Зураг хавсаргах товч */}
        {extractedImages && extractedImages.length > 0 && (
          <div className="d-flex gap-2 align-items-center">
            <Button
              size="sm"
              variant={needsFigure ? 'warning' : 'outline-secondary'}
              onClick={() => setShowImagePicker(true)}
            >
              🖼 {needsFigure ? 'Зураг хавсаргах (шаардлагатай)' : `Зураг нэмэх (${extractedImages.length} байна)`}
            </Button>
            {prob.figure_description && (
              <small className="text-muted fst-italic">{prob.figure_description}</small>
            )}
          </div>
        )}
      </Card.Body>

      {/* Image picker modal */}
      <Modal show={showImagePicker} onHide={() => setShowImagePicker(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Зураг сонгох — Бодлого #{index + 1}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {prob.figure_description && (
            <Alert variant="info" className="py-2 small mb-3">
              <strong>Зургийн тайлбар:</strong> {prob.figure_description}
            </Alert>
          )}
          <p className="text-muted small mb-3">
            Бодлогод хавсаргах зургийг дарж сонго. Дахин дарж арилгана.
          </p>
          <div className="d-flex flex-wrap gap-3">
            {extractedImages.map((img, ii) => {
              const attached = attachedImages.includes(img.data);
              const label = img.name || `Зураг ${ii + 1}`;
              return (
                <div key={img.data.slice(-30)} className="text-center" style={{ cursor: 'pointer', maxWidth: 160 }}>
                  <img
                    src={img.data}
                    alt={label}
                    style={{
                      width: 150, height: 150, objectFit: 'contain',
                      border: attached ? '3px solid #0d6efd' : '2px solid #dee2e6',
                      borderRadius: 8, background: '#f8f9fa',
                    }}
                    onClick={() => {
                      if (attached) {
                        const imgIdx = attachedImages.indexOf(img.data);
                        onImageDetach(index, imgIdx);
                      } else {
                        onImageAttach(index, img.data);
                      }
                    }}
                  />
                  <div className="small text-muted mt-1">
                    <span className="fw-semibold">{ii + 1}.</span> {label}
                    {attached && <Badge bg="primary" className="ms-1">✓</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowImagePicker(false)}>Болсон</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
