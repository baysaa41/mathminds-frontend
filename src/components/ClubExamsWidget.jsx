// ClubExamsWidget - with management UI
import React, { useState } from 'react';
import { Card, ListGroup, Button, Badge, Spinner } from 'react-bootstrap';
import { Award, Calendar, Edit2, Trash2, Plus } from 'lucide-react';
import ExamFormModal from './ExamFormModal';
import { deleteExamItem } from '../services/clubContentService';

const ClubExamsWidget = ({ club, onUpdate, isTeacherOrAdmin }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  if (!club) return null;
  const exams = club.exams || [];
  if (exams.length === 0 && !isTeacherOrAdmin) return null;

  const formatDate = (ds) => ds ? new Date(ds).toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const isUpcoming = (ed) => ed ? new Date(ed) > new Date() : false;

  const handleEdit = (item) => { setEditingItem(item); setShowFormModal(true); };
  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" устгах уу?`)) return;
    try {
      setLoadingItemId(item.id);
      await deleteExamItem(item.id);
      if (onUpdate) onUpdate();
    } catch {
      alert('Устгахад алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };

  return (<>
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold"><Award size={16} className="me-2" />Шалгалт ба ахиц</h6>
          {isTeacherOrAdmin && (
            <Button variant="outline-primary" size="sm" onClick={() => { setEditingItem(null); setShowFormModal(true); }}>
              <Plus size={14} className="me-1" />Нэмэх
            </Button>
          )}
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {exams.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <Award size={32} className="mb-2 opacity-50" />
            <p className="mb-0 small">Шалгалт нэмэгдээгүй байна</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {exams.map((exam) => (
              <ListGroup.Item key={exam.id} className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small fw-semibold">{exam.title}</span>
                      {!exam.is_published && isTeacherOrAdmin && <Badge bg="warning" text="dark">Ноорог</Badge>}
                    </div>
                    {exam.exam_date && (
                      <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.7rem' }}>
                        <Calendar size={12} className="me-1" />{formatDate(exam.exam_date)}
                      </div>
                    )}
                  </div>
                  {exam.exam_date && isUpcoming(exam.exam_date) && <Badge bg="info" pill>Удахгүй</Badge>}
                  {isTeacherOrAdmin && (
                    <div className="d-flex gap-1 ms-2">
                      {loadingItemId === exam.id ? <Spinner animation="border" size="sm" /> : (<>
                        <Button variant="outline-primary" size="sm" onClick={() => handleEdit(exam)} style={{ padding: '0.25rem 0.5rem' }}><Edit2 size={14} /></Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(exam)} style={{ padding: '0.25rem 0.5rem' }}><Trash2 size={14} /></Button>
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
    <ExamFormModal show={showFormModal} onHide={() => { setShowFormModal(false); setEditingItem(null); }}
      clubId={club.id} examItem={editingItem}
      onSuccess={() => { setShowFormModal(false); setEditingItem(null); if (onUpdate) onUpdate(); }} />
  </>);
};

export default ClubExamsWidget;
