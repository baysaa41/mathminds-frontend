// src/components/MeetingFormModal.jsx
// Видео уулзалт нэмэх/засах Modal

import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { createMeetingItem, updateMeetingItem } from '../services/clubContentService';

const WEEKDAY_LABELS = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const MeetingFormModal = ({ show, onHide, clubId, meetingItem, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!meetingItem;

  useEffect(() => {
    if (meetingItem) {
      setTitle(meetingItem.title || '');
      setDescription(meetingItem.description || '');
      setMeetingUrl(meetingItem.meeting_url || '');
      setMeetingDay(meetingItem.meeting_day != null ? String(meetingItem.meeting_day) : '');
      setMeetingTime(meetingItem.meeting_time || '');
      setIsActive(meetingItem.is_active ?? true);
    } else {
      setTitle('');
      setDescription('');
      setMeetingUrl('');
      setMeetingDay('');
      setMeetingTime('');
      setIsActive(true);
    }
    setError(null);
  }, [meetingItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Гарчиг заавал оруулна уу'); return; }
    if (!meetingUrl.trim()) { setError('Уулзалтын линк заавал оруулна уу'); return; }
    try { new URL(meetingUrl); } catch { setError('Буруу URL хэлбэр байна'); return; }

    try {
      setLoading(true);
      const data = {
        title: title.trim(),
        description: description.trim(),
        meeting_url: meetingUrl.trim(),
        meeting_day: meetingDay !== '' ? parseInt(meetingDay, 10) : null,
        meeting_time: meetingTime || null,
        is_active: isActive,
      };

      let response;
      if (isEditMode) {
        response = await updateMeetingItem(meetingItem.id, data);
      } else {
        response = await createMeetingItem(clubId, data);
      }

      if (onSuccess) onSuccess(response);
      setTitle(''); setDescription(''); setMeetingUrl('');
      setMeetingDay(''); setMeetingTime(''); setIsActive(true); setError(null);
    } catch (err) {
      console.error('❌ Error saving meeting:', err);
      let errorMessage = 'Алдаа гарлаа';
      if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      else if (err.response?.data) {
        const errors = err.response.data;
        const msgs = [];
        for (const field in errors) {
          msgs.push(Array.isArray(errors[field]) ? `${field}: ${errors[field].join(', ')}` : `${field}: ${errors[field]}`);
        }
        if (msgs.length > 0) errorMessage = msgs.join('\n');
      } else if (err.message) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setMeetingUrl('');
    setMeetingDay(''); setMeetingTime(''); setIsActive(true); setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? (
            <><i className="bi bi-pencil text-success me-2"></i>Уулзалт засах</>
          ) : (
            <><i className="bi bi-camera-video text-success me-2"></i>Уулзалт нэмэх</>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <i className="bi bi-exclamation-triangle me-2"></i>{error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Гарчиг <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Жишээ: Долоо хоног бүрийн хичээл"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={200}
              autoFocus
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Уулзалтын линк <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="url"
              placeholder="https://zoom.us/j/... эсвэл meet.google.com/..."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              disabled={loading}
              required
            />
            <Form.Text className="text-muted">Zoom, Google Meet, Teams гэх мэт</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Хуваарь</Form.Label>
            <div className="d-flex gap-2">
              <Form.Select
                value={meetingDay}
                onChange={(e) => setMeetingDay(e.target.value)}
                disabled={loading}
              >
                <option value="">Гараг сонгох</option>
                {WEEKDAY_LABELS.map((label, idx) => (
                  <option key={idx} value={idx}>{label}</option>
                ))}
              </Form.Select>
              <Form.Control
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                disabled={loading}
                style={{ maxWidth: '130px' }}
              />
            </div>
            <Form.Text className="text-muted">Долоо хоног бүр болох гараг, цаг (заавал биш)</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Уулзалтын тайлбар (заавал биш)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="is-active-check"
              label="Идэвхтэй"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
            />
            <Form.Text className="text-muted ms-4">
              Идэвхгүй бол зөвхөн багш нар харна
            </Form.Text>
          </Form.Group>

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>Болих</Button>
            <Button
              type="submit"
              variant="success"
              disabled={loading || !title.trim() || !meetingUrl.trim()}
              className="flex-grow-1"
            >
              {loading ? (
                <><Spinner as="span" animation="border" size="sm" role="status" className="me-2" />Хадгалж байна...</>
              ) : (
                <><i className="bi bi-check-circle me-2"></i>{isEditMode ? 'Хадгалах' : 'Нэмэх'}</>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default MeetingFormModal;
