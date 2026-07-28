// src/components/problemEdit/ProblemInfoForm.jsx
// ProblemEditPage-ийн гарчиг/хичээл/түвшин/өгүүлбэр/төрөл/хариулт хэсэг (state-гүй, props хүлээж авдаг)

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import InputGroup from 'react-bootstrap/InputGroup';
import Stack from 'react-bootstrap/Stack';
import RichTextEditor from '../RichTextEditor';
import {
  FileText, AlignLeft, Eye, Code2, Layers, GraduationCap, Wand2, Edit3,
} from 'lucide-react';
import { SUBJECT_CHOICES } from './constants.js';

export function ProblemInfoForm({
  problem,
  onFieldChange,
  onStatementChange,
  viewMode,
  setViewMode,
  onShowPreview,
  titleSuggestions,
  loadingSuggestions,
  onSuggestTitles,
  onApplyTitleSuggestion,
}) {
  return (
    <>
      {/* Гарчиг, Түвшин */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-1">
            <Form.Label htmlFor="id_title" className="fw-semibold">
              <FileText size={16} className="me-2" />
              Гарчиг
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                name="title"
                id="id_title"
                value={problem.title || ''}
                onChange={onFieldChange}
                placeholder="Гарчиг оруулах..."
              />
              <Button
                variant="outline-secondary"
                onClick={onSuggestTitles}
                disabled={loadingSuggestions}
                title="Гарчиг санал болгох"
              >
                {loadingSuggestions
                  ? <Spinner animation="border" size="sm" />
                  : <Wand2 size={15} />}
              </Button>
            </InputGroup>
          </Form.Group>
          {titleSuggestions.length > 0 && (
            <div className="mb-3">
              {titleSuggestions.map((s, i) => (
                <Button
                  key={i}
                  variant="outline-primary"
                  size="sm"
                  className="me-1 mt-1"
                  onClick={() => onApplyTitleSuggestion(s.title)}
                >
                  {s.title}
                </Button>
              ))}
            </div>
          )}
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="id_subject" className="fw-semibold">
              <GraduationCap size={16} className="me-2" />
              Хичээл
            </Form.Label>
            <Form.Select
              name="subject"
              id="id_subject"
              value={problem.subject || 'math'}
              onChange={onFieldChange}
            >
              {SUBJECT_CHOICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="id_level" className="fw-semibold">
              <Layers size={16} className="me-2" />
              Түвшин
            </Form.Label>
            <Form.Select
              name="level"
              id="id_level"
              value={problem.level || ''}
              onChange={onFieldChange}
            >
              <option value="">---------</option>
              <option value="1">Сэргээн санах түвшин</option>
              <option value="2">Ойлгох түвшин</option>
              <option value="3">Хэрэглэх түвшин</option>
              <option value="4">Задлан шинжлэх түвшин</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Бодлогын өгүүлбэр */}
      <Form.Group className="mb-3">
        <Stack direction="horizontal" gap={2} className="mb-2">
          <Form.Label className="fw-semibold mb-0">
            <AlignLeft size={16} className="me-2" />
            Өгүүлбэр (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)
          </Form.Label>
          <div className="ms-auto">
            <Button
              size="sm"
              variant={viewMode === 'visual' ? 'primary' : 'outline-secondary'}
              onClick={() => setViewMode('visual')}
              className="me-1"
            >
              <Edit3 size={14} className="me-1" />
              Visual
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'source' ? 'primary' : 'outline-secondary'}
              onClick={() => setViewMode('source')}
              className="me-2"
            >
              <Code2 size={14} className="me-1" />
              Source
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={onShowPreview}
            >
              <Eye size={14} className="me-1" />
              Preview
            </Button>
          </div>
        </Stack>

        {viewMode === 'visual' ? (
          <RichTextEditor
            content={problem.statement || ''}
            onChange={onStatementChange}
            placeholder="Бодлогын өгүүлбэр бичих..."
          />
        ) : (
          <Form.Control
            as="textarea"
            rows={15}
            value={problem.statement || ''}
            onChange={(e) => onStatementChange(e.target.value)}
            placeholder="HTML код шууд бичих..."
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9em',
              lineHeight: '1.5',
            }}
          />
        )}
      </Form.Group>

      {/* Төрөл, Хариулт, Нийтлэх */}
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="id_type">Бодлогын төрөл</Form.Label>
            <Form.Select
              name="type"
              id="id_type"
              value={problem.type || 0}
              onChange={onFieldChange}
            >
              <option value="0">Уламжлалт</option>
              <option value="1">Сонгох тест</option>
              <option value="4">Нөхөх тест</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="id_answer">Хариулт</Form.Label>
            <Form.Control
              type="text"
              name="answer"
              id="id_answer"
              value={problem.answer || ''}
              onChange={onFieldChange}
            />
            <Form.Text>Сонгох/Нөхөх тестийн зөв хариултын Label (A, B, abcde...)</Form.Text>
            {(problem.alternative_answers?.length > 0) && (
              <div className="mt-2">
                <Form.Text className="d-block text-muted mb-1">Алтернатив хариултууд:</Form.Text>
                <div className="d-flex flex-wrap gap-1">
                  {problem.alternative_answers.map((a, i) => (
                    <span key={i} className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.75rem' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Form.Group>
        </Col>
        <Col md={4} className="d-flex align-items-center pt-3">
          <Form.Check
            type="switch"
            id="id_is_public"
            label="Нийтэд харагдах"
            name="is_public"
            checked={problem.is_public || false}
            onChange={onFieldChange}
          />
        </Col>
      </Row>
    </>
  );
}
