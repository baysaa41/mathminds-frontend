// src/components/ClubMeetingsWidget.jsx
// Клубын амьд видео уулзалтуудын жагсаалт

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Video, CalendarDays, Clock, Edit2, Trash2, Plus, ExternalLink } from 'lucide-react';
import MeetingFormModal from './MeetingFormModal';
import { deleteMeetingItem } from '../services/clubsService';

const WEEKDAY_LABELS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const ClubMeetingsWidget = ({ club, onUpdate, isTeacherOrAdmin }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  if (!club) return null;

  const meetings = club.meetings || [];

  if (meetings.length === 0 && !isTeacherOrAdmin) return null;

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" уулзалтыг устгах уу?`)) return;
    try {
      setLoadingItemId(item.id);
      await deleteMeetingItem(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      alert('Уулзалт устгахад алдаа гарлаа');
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
              <Video size={16} className="me-2 text-success" />
              Видео уулзалт
            </h6>
            {isTeacherOrAdmin && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => { setEditingItem(null); setShowFormModal(true); }}
              >
                <Plus size={14} className="me-1" />
                Нэмэх
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {meetings.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <Video size={32} className="mb-2 opacity-50" />
              <p className="mb-0 small">Видео уулзалт нэмэгдээгүй байна</p>
              {isTeacherOrAdmin && (
                <p className="mb-0 small">Дээрх "Нэмэх" товчоор эхлүүлэх</p>
              )}
            </div>
          ) : (
            <ListGroup variant="flush">
              {meetings.map((meeting) => (
                <ListGroup.Item key={meeting.id} className="py-3 px-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-medium small">{meeting.title}</span>
                        {!meeting.is_active && isTeacherOrAdmin && (
                          <Badge bg="warning" text="dark" className="small">Идэвхгүй</Badge>
                        )}
                      </div>

                      {(meeting.meeting_day != null || meeting.meeting_time) && (
                        <div className="d-flex align-items-center text-muted mb-1" style={{ fontSize: '0.8rem' }}>
                          <CalendarDays size={13} className="me-1" />
                          {meeting.meeting_day != null ? WEEKDAY_LABELS[meeting.meeting_day] : ''}
                          {meeting.meeting_day != null && meeting.meeting_time ? ' ' : ''}
                          {meeting.meeting_time && (
                            <>
                              <Clock size={13} className="mx-1" />
                              {meeting.meeting_time.slice(0, 5)}
                            </>
                          )}
                        </div>
                      )}

                      <a
                        href={meeting.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-success py-0 px-2"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <ExternalLink size={12} className="me-1" />
                        Нэгдэх
                      </a>

                      {meeting.description && (
                        <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          {meeting.description.length > 100
                            ? `${meeting.description.substring(0, 100)}...`
                            : meeting.description}
                        </div>
                      )}
                    </div>

                    {isTeacherOrAdmin && (
                      <div className="d-flex gap-1 ms-2">
                        {loadingItemId === meeting.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(meeting)}
                              title="Засах"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(meeting)}
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

      <MeetingFormModal
        show={showFormModal}
        onHide={() => { setShowFormModal(false); setEditingItem(null); }}
        clubId={club.id}
        meetingItem={editingItem}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default ClubMeetingsWidget;
