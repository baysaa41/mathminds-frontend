// src/components/problemEdit/ChoicesEditor.jsx
// ProblemEditPage-ийн хариултын сонголтуудын formset (Сонгох/Нөхөх тестэд)

import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Layers, PlusCircle } from 'lucide-react';
import LivePreview from '../LivePreview.jsx';
import { useDebounce } from './useDebounce.js';

export function ChoicesEditor({ choices, onChoiceChange, onAddChoice, onRemoveChoice }) {
  const debouncedChoiceValues = useDebounce(
    choices.map((c) => c.value),
    500
  );

  return (
    <div id="choices-section">
      <h4>
        <Layers size={20} className="me-2" />
        Хариултын сонголтууд
      </h4>
      <div id="choice-forms-container">
        {choices.map((choice, index) => {
          if (choice.DELETE) return null;
          const isCorrect = choice.default_score > 0;
          return (
            <Card
              key={choice.id || `new-${index}`}
              className={`mb-3 choice-form ${isCorrect ? 'bg-success-subtle' : ''}`}
              border={isCorrect ? 'success' : null}
            >
              <Card.Body>
                <Row className="align-items-start">
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Label</Form.Label>
                      <Form.Control
                        type="text"
                        name="label"
                        value={choice.label || ''}
                        onChange={(e) => onChoiceChange(index, e)}
                        readOnly // (!!!) Гараас засахыг хориглох
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Утга (Value)</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="value"
                        rows={2}
                        value={choice.value || ''}
                        onChange={(e) => onChoiceChange(index, e)}
                        className="font-monospace"
                      />
                      <LivePreview content={debouncedChoiceValues[index]} />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Оноо</Form.Label>
                      <Form.Control
                        type="number"
                        name="default_score"
                        value={choice.default_score}
                        onChange={(e) => onChoiceChange(index, e)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="text-end pt-4">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onRemoveChoice(index)}
                    >
                      Устгах
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          );
        })}
      </div>
      <Button
        id="add-choice-btn"
        type="button"
        variant="outline-success"
        size="sm"
        onClick={onAddChoice}
      >
        <PlusCircle size={16} className="me-1" />
        Шинэ сонголт нэмэх
      </Button>
    </div>
  );
}
