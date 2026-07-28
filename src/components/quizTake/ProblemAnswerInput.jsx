// src/components/quizTake/ProblemAnswerInput.jsx
// QuizTakePage-ийн одоогийн бодлогын хариулт оруулах хэсэг (state-гүй, зөвхөн props хүлээж авдаг)

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import LivePreview from '../LivePreview.jsx';

export function ProblemAnswerInput({
  problem, answer, selectedImage, onAnswerChange, onImageSelect, onImageRemove,
}) {
  if (problem.type === 1 && problem.choices && problem.choices.length > 0) {
    // Multiple choice - Radio buttons
    return (
      <Form>
        {[...problem.choices].sort((a, b) => (a.label || '').localeCompare(b.label || '')).map((choice) => (
          <Form.Check
            key={choice.id}
            type="radio"
            id={`choice-${choice.id}`}
            name={`problem-${problem.id}`}
            label={
              <div className="mathjax-content">
                <LivePreview content={`${choice.label}: ${choice.value}`} />
              </div>
            }
            checked={answer?.label === choice.label}
            onChange={() => onAnswerChange(problem.id, choice.label, choice.value)}
          />
        ))}
      </Form>
    );
  }

  if (problem.type === 4 && problem.choices && problem.choices.length > 0) {
    // Fill-in-the-blank - Input fields
    return (
      <div>
        <Form.Label className="mb-3">Хариултаа нөхнө үү:</Form.Label>
        {problem.choices.map((choice) => (
          <Form.Group key={choice.id} className="mb-3">
            <InputGroup>
              <InputGroup.Text style={{ minWidth: '80px' }}>
                <strong className="mathjax-content">
                  <LivePreview content={choice.label} />
                </strong>
              </InputGroup.Text>
              <Form.Control
                type="text"
                value={answer?.answers?.[choice.label] || ''}
                onChange={(e) => {
                  const currentAnswers = answer?.answers || {};
                  const newAnswers = {
                    ...currentAnswers,
                    [choice.label]: e.target.value,
                  };
                  onAnswerChange(problem.id, '', '', newAnswers);
                }}
                placeholder={`${choice.value.length} оронтой`}
                maxLength={choice.value.length}
                style={{ fontFamily: 'monospace' }}
              />
            </InputGroup>
            <Form.Text className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              {choice.value.length} тэмдэгт оруулна уу
            </Form.Text>
          </Form.Group>
        ))}
      </div>
    );
  }

  // Traditional - Text area + Image upload
  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Хариулт:</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={answer?.value || ''}
          onChange={(e) => onAnswerChange(problem.id, '', e.target.value)}
          placeholder="Хариултаа энд бичнэ үү..."
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>
          <i className="bi bi-image me-1"></i>
          Зураг оруулах (сонголттой):
        </Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onImageSelect(problem.id, file);
          }}
        />
        {selectedImage && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
              className="border rounded"
            />
            <div className="mt-1">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onImageRemove(problem.id)}
              >
                <i className="bi bi-trash me-1"></i>
                Устгах
              </Button>
            </div>
          </div>
        )}
      </Form.Group>
    </div>
  );
}
