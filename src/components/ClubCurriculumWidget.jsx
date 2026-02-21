// ClubCurriculumWidget.jsx
// Хөтөлбөр (Curriculum) виджет - багш нарт засах, устгах, эрэмбэлэх боломжтой

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { BookOpen, ChevronRight, ChevronUp, ChevronDown, Edit2, Trash2, Plus } from 'lucide-react';
import CurriculumFormModal from './CurriculumFormModal';
import { deleteCurriculumItem, moveCurriculumUp, moveCurriculumDown } from '../services/clubsService';

const ClubCurriculumWidget = ({ club, onUpdate, isTeacherOrAdmin }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  if (!club) return null;

  // ClubSerializer-н SerializerMethodField-ээр ирсэн curriculum_items
  const curriculumItems = club.curriculum_items || [];

  // Empty state for teachers/admins
  if (curriculumItems.length === 0 && !isTeacherOrAdmin) {
    return null; // Хөтөлбөр байхгүй бол энгийн гишүүдэд харуулахгүй
  }

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" хөтөлбөрийг устгах уу?`)) {
      return;
    }

    try {
      setLoadingItemId(item.id);
      await deleteCurriculumItem(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      alert('Хөтөлбөр устгахад алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleMoveUp = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveCurriculumUp(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error moving curriculum up:', error);
      const message = error.response?.data?.detail || 'Хөтөлбөр шилжүүлэхэд алдаа гарлаа';
      alert(message);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleMoveDown = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveCurriculumDown(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error moving curriculum down:', error);
      const message = error.response?.data?.detail || 'Хөтөлбөр шилжүүлэхэд алдаа гарлаа';
      alert(message);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingItem(null);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold">
              <BookOpen size={16} className="me-2" />
              Хөтөлбөр
            </h6>
            {isTeacherOrAdmin && (
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowFormModal(true);
                }}
              >
                <Plus size={14} className="me-1" />
                Нэмэх
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {curriculumItems.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <BookOpen size={32} className="mb-2 opacity-50" />
              <p className="mb-0 small">Хөтөлбөр хараахан нэмэгдээгүй байна</p>
              {isTeacherOrAdmin && (
                <p className="mb-0 small">Дээрх "Нэмэх" товчоор эхлүүлэх</p>
              )}
            </div>
          ) : (
            <ListGroup variant="flush">
              {curriculumItems.map((item, index) => (
                <ListGroup.Item
                  key={item.id}
                  className="py-2 px-3"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    {/* Left: Title and Description */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="small fw-medium">{item.title}</span>
                        {!item.is_published && isTeacherOrAdmin && (
                          <Badge bg="warning" text="dark" className="small">
                            Ноорог
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          {item.description.length > 100
                            ? `${item.description.substring(0, 100)}...`
                            : item.description}
                        </div>
                      )}
                    </div>

                    {/* Right: Action buttons for teachers/admins */}
                    {isTeacherOrAdmin && (
                      <div className="d-flex gap-1 ms-2" style={{ minWidth: '140px' }}>
                        {loadingItemId === item.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            {/* Move Up */}
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleMoveUp(item)}
                              disabled={index === 0}
                              title="Дээш шилжүүлэх"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <ChevronUp size={14} />
                            </Button>

                            {/* Move Down */}
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleMoveDown(item)}
                              disabled={index === curriculumItems.length - 1}
                              title="Доош шилжүүлэх"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <ChevronDown size={14} />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              title="Засах"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <Edit2 size={14} />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(item)}
                              title="Устгах"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      {/* Curriculum Form Modal */}
      <CurriculumFormModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setEditingItem(null);
        }}
        clubId={club.id}
        curriculumItem={editingItem}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default ClubCurriculumWidget;
