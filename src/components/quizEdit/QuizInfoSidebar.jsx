// src/components/quizEdit/QuizInfoSidebar.jsx
// QuizEditPage-ийн баруун тал: тестийн үндсэн мэдээлэл + үйлдлийн товчнууд

import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import {
  FileText, AlignLeft, Clock, GraduationCap, Save, X, Trash2, Wand2, Download, Copy,
} from 'lucide-react';

export function QuizInfoSidebar({
  title, setTitle,
  description, setDescription,
  defaultTimeLimit, setDefaultTimeLimit,
  gradeId, setGradeId,
  grades,
  isPublic, setIsPublic,
  saving,
  warningAcknowledged,
  wasInitiallyPublic,
  error,
  selectedProblemsCount,
  exportingLatex,
  cloning,
  isDeleting,
  onExportLatex,
  onClone,
  onShowGenerateSimilar,
  onCancel,
  onShowDeleteModal,
}) {
  const editLocked = !warningAcknowledged && wasInitiallyPublic;

  return (
    <>
      <Card className="mb-3">
        <Card.Header as="h6" className="fw-semibold">Тестийн мэдээлэл</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3" controlId="quizTitle">
            <Form.Label className="fw-semibold small">
              <FileText size={14} className="me-1" />Гарчиг
            </Form.Label>
            <Form.Control
              type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving || editLocked}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="quizDescription">
            <Form.Label className="fw-semibold small">
              <AlignLeft size={14} className="me-1" />Тайлбар
            </Form.Label>
            <Form.Control
              as="textarea" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving || editLocked}
              placeholder="Тестийн дэлгэрэнгүй тайлбар, заавар..."
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="quizTimeLimit">
            <Form.Label className="fw-semibold small">
              <Clock size={14} className="me-1" />Хугацааны хязгаар (минут)
            </Form.Label>
            <Form.Control
              type="number" min="1" max="300" value={defaultTimeLimit}
              onChange={(e) => setDefaultTimeLimit(e.target.value)}
              disabled={saving || editLocked}
              placeholder="Хоосон = хязгааргүй"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="quizGrade">
            <Form.Label className="fw-semibold small">
              <GraduationCap size={14} className="me-1" />Зорилтот анги
            </Form.Label>
            <Form.Select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              disabled={saving || editLocked}
            >
              <option value="">— Ангигүй —</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name || `${g.grade}-р анги`}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="switch" id="is-public-switch" label="Нийтэд харагдах"
            checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
            disabled={saving || editLocked}
          />
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <div className="d-grid gap-2">
            <Button variant="primary" type="submit" disabled={saving || editLocked}>
              {saving ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Хадгалж байна...</>
              ) : (
                <><Save size={16} className="me-2" />Хадгалах</>
              )}
            </Button>
            <Button
              variant="outline-primary"
              onClick={onShowGenerateSimilar}
              disabled={saving || selectedProblemsCount === 0}
              title="AI ашиглан энэ тесттэй төстэй шинэ тест үүсгэх"
            >
              <Wand2 size={16} className="me-2" />
              AI төстэй тест үүсгэх
            </Button>
            <Button
              variant="outline-success"
              onClick={onExportLatex}
              disabled={exportingLatex || selectedProblemsCount === 0}
              title="Бодлогуудыг LaTeX файл болгон татах"
            >
              {exportingLatex ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Бэлтгэж байна...</>
              ) : (
                <><Download size={16} className="me-2" />LaTeX татах (.tex)</>
              )}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={onClone}
              disabled={cloning || saving}
              title="Яг ижил бодлогуудтай хуулбар тест үүсгэх"
            >
              {cloning ? (
                <><Spinner as="span" animation="border" size="sm" className="me-2" />Хуулж байна...</>
              ) : (
                <><Copy size={16} className="me-2" />Хуулбар үүсгэх</>
              )}
            </Button>
            <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
              <X size={16} className="me-2" />Цуцлах
            </Button>
            <Button variant="outline-danger" onClick={onShowDeleteModal} disabled={saving || isDeleting}>
              <Trash2 size={16} className="me-2" />Устгах
            </Button>
          </div>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Card.Body>
      </Card>
    </>
  );
}
