// Exam management modal - simplified version
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { createExamItem, updateExamItem } from '../services/clubsService';

const ExamFormModal = ({ show, onHide, clubId, examItem, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(60);
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (examItem) {
      setTitle(examItem.title || '');
      setDescription(examItem.description || '');
      setExamDate(examItem.exam_date ? examItem.exam_date.substring(0, 16) : '');
      setDurationMinutes(examItem.duration_minutes || 60);
      setMaxScore(examItem.max_score || 100);
      setPassingScore(examItem.passing_score || 60);
      setIsPublished(examItem.is_published ?? true);
    } else {
      setTitle(''); setDescription(''); setExamDate(''); setDurationMinutes(60);
      setMaxScore(100); setPassingScore(60); setIsPublished(true);
    }
    setError(null);
  }, [examItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Гарчиг оруулна уу'); return; }
    setLoading(true);
    try {
      const data = { title: title.trim(), description: description.trim(), 
        exam_date: examDate || null, duration_minutes: durationMinutes,
        max_score: maxScore, passing_score: passingScore, is_published: isPublished };
      if (examItem) await updateExamItem(examItem.id, data);
      else await createExamItem(clubId, data);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{examItem ? 'Шалгалт засах' : 'Шалгалт нэмэх'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Гарчиг <span className="text-danger">*</span></Form.Label>
            <Form.Control value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Огноо</Form.Label>
            <Form.Control type="datetime-local" value={examDate} onChange={e => setExamDate(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </Form.Group>
          <div className="row mb-3">
            <div className="col-6">
              <Form.Label>Үргэлжлэх хугацаа (минут)</Form.Label>
              <Form.Control type="number" value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value))} />
            </div>
            <div className="col-6">
              <Form.Label>Дээд оноо</Form.Label>
              <Form.Control type="number" value={maxScore} onChange={e => setMaxScore(parseInt(e.target.value))} />
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Тэнцсэн оноо</Form.Label>
            <Form.Control type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Check type="checkbox" label="Нийтлэх" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide}>Болих</Button>
            <Button type="submit" disabled={loading} className="flex-grow-1">
              {loading ? <><Spinner size="sm" /> Хадгалж байна...</> : (examItem ? 'Хадгалах' : 'Нэмэх')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ExamFormModal;
