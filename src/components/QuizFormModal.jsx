// Quiz management modal - simplified version
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { createQuizItem, updateQuizItem } from '../services/clubsService';

const QuizFormModal = ({ show, onHide, clubId, quizItem, curriculumItems, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [curriculumId, setCurriculumId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (quizItem) {
      setTitle(quizItem.title || '');
      setDescription(quizItem.description || '');
      setQuestionCount(quizItem.question_count || 0);
      setDurationMinutes(quizItem.duration_minutes || 30);
      setPassingScore(quizItem.passing_score || 60);
      setCurriculumId(quizItem.curriculum || '');
      setIsPublished(quizItem.is_published ?? true);
    } else {
      setTitle(''); setDescription(''); setQuestionCount(0); 
      setDurationMinutes(30); setPassingScore(60); setCurriculumId(''); setIsPublished(true);
    }
    setError(null);
  }, [quizItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Гарчиг оруулна уу'); return; }
    setLoading(true);
    try {
      const data = { title: title.trim(), description: description.trim(),
        question_count: questionCount, duration_minutes: durationMinutes,
        passing_score: passingScore, is_published: isPublished };
      if (curriculumId) data.curriculum = curriculumId;
      
      if (quizItem) await updateQuizItem(quizItem.id, data);
      else await createQuizItem(clubId, data);
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
        <Modal.Title>{quizItem ? 'Сорил засах' : 'Сорил нэмэх'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Гарчиг <span className="text-danger">*</span></Form.Label>
            <Form.Control value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </Form.Group>
          <div className="row mb-3">
            <div className="col-6">
              <Form.Label>Асуултын тоо</Form.Label>
              <Form.Control type="number" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))} />
            </div>
            <div className="col-6">
              <Form.Label>Үргэлжлэх хугацаа (минут)</Form.Label>
              <Form.Control type="number" value={durationMinutes} onChange={e => setDurationMinutes(parseInt(e.target.value))} />
            </div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>Тэнцсэн оноо (%)</Form.Label>
            <Form.Control type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} />
          </Form.Group>
          {curriculumItems?.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Хөтөлбөр</Form.Label>
              <Form.Select value={curriculumId} onChange={e => setCurriculumId(e.target.value)}>
                <option value="">-- Хөтөлбөргүй --</option>
                {curriculumItems.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-4">
            <Form.Check type="checkbox" label="Нийтлэх" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide}>Болих</Button>
            <Button type="submit" disabled={loading} className="flex-grow-1">
              {loading ? <><Spinner size="sm" /> Хадгалж байна...</> : (quizItem ? 'Хадгалах' : 'Нэмэх')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default QuizFormModal;
