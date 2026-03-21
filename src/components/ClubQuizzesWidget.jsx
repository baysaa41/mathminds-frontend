// ClubQuizzesWidget - with management UI
import React, { useState } from 'react';
import { Card, ListGroup, Button, Badge, Spinner } from 'react-bootstrap';
import { FileQuestion, Clock, Edit2, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import QuizFormModal from './QuizFormModal';
import { deleteQuizItem, moveQuizUp, moveQuizDown } from '../services/clubsService';

const ClubQuizzesWidget = ({ club, onUpdate, isTeacherOrAdmin }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  if (!club) return null;
  const quizzes = club.quizzes || [];
  if (quizzes.length === 0 && !isTeacherOrAdmin) return null;

  const handleEdit = (item) => { setEditingItem(item); setShowFormModal(true); };
  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" устгах уу?`)) return;
    try {
      setLoadingItemId(item.id);
      await deleteQuizItem(item.id);
      if (onUpdate) onUpdate();
    } catch {
      alert('Устгахад алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };
  const handleMoveUp = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveQuizUp(item.id);
      if (onUpdate) onUpdate();
    } catch {
      alert('Шилжүүлэхэд алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };
  const handleMoveDown = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveQuizDown(item.id);
      if (onUpdate) onUpdate();
    } catch {
      alert('Шилжүүлэхэд алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };

  return (<>
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold"><FileQuestion size={16} className="me-2" />Сорил, тестүүд</h6>
          {isTeacherOrAdmin && (
            <Button variant="outline-primary" size="sm" onClick={() => { setEditingItem(null); setShowFormModal(true); }}>
              <Plus size={14} className="me-1" />Нэмэх
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {quizzes.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <FileQuestion size={32} className="mb-2 opacity-50" />
            <p className="mb-0 small">Сорил нэмэгдээгүй байна</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {quizzes.map((quiz, index) => (
              <ListGroup.Item key={quiz.id} className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <FileQuestion size={14} className="text-primary" />
                      <span className="small fw-semibold">{quiz.title}</span>
                      {!quiz.is_published && isTeacherOrAdmin && <Badge bg="warning" text="dark">Ноорог</Badge>}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {quiz.question_count > 0 && <span className="me-2">{quiz.question_count} асуулт</span>}
                      {quiz.duration_minutes > 0 && <span className="d-inline-flex align-items-center"><Clock size={10} className="me-1" />{quiz.duration_minutes} мин</span>}
                    </div>
                  </div>
                  {quiz.passing_score && <Badge bg="info" pill>{quiz.passing_score}% тэнцэх</Badge>}
                  {isTeacherOrAdmin && (
                    <div className="d-flex gap-1 ms-2" style={{ minWidth: '140px' }}>
                      {loadingItemId === quiz.id ? <Spinner animation="border" size="sm" /> : (<>
                        <Button variant="outline-secondary" size="sm" onClick={() => handleMoveUp(quiz)} disabled={index === 0} style={{ padding: '0.25rem 0.5rem' }}><ChevronUp size={14} /></Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => handleMoveDown(quiz)} disabled={index === quizzes.length - 1} style={{ padding: '0.25rem 0.5rem' }}><ChevronDown size={14} /></Button>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(quiz)} style={{ padding: '0.25rem 0.5rem' }}><Edit2 size={14} /></Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(quiz)} style={{ padding: '0.25rem 0.5rem' }}><Trash2 size={14} /></Button>
                      </>)}
                    </div>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
    <QuizFormModal show={showFormModal} onHide={() => { setShowFormModal(false); setEditingItem(null); }}
      clubId={club.id} quizItem={editingItem}
      onSuccess={() => { setShowFormModal(false); setEditingItem(null); if (onUpdate) onUpdate(); }} />
  </>);
};

export default ClubQuizzesWidget;
