// src/components/CurriculumFormModal.jsx
// Хөтөлбөр нэмэх/засах Modal

import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { createCurriculumItem, updateCurriculumItem } from '../services/clubsService';

const CurriculumFormModal = ({ show, onHide, clubId, curriculumItem, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!curriculumItem;

  // Populate form when editing
  useEffect(() => {
    if (curriculumItem) {
      setTitle(curriculumItem.title || '');
      setDescription(curriculumItem.description || '');
      setIsPublished(curriculumItem.is_published ?? true);
    } else {
      // Reset form when creating new
      setTitle('');
      setDescription('');
      setIsPublished(true);
    }
    setError(null);
  }, [curriculumItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Гарчиг заавал оруулна уу');
      return;
    }

    if (title.length > 200) {
      setError('Гарчиг хэтэрхий урт байна (200 тэмдэгтээс бага байх ёстой)');
      return;
    }

    try {
      setLoading(true);

      const data = {
        title: title.trim(),
        description: description.trim(),
        is_published: isPublished,
      };

      if (isEditMode) {
        // Auto-set order to max+1 for new items
        const maxOrder = 0; // Backend will handle order automatically
        if (!curriculumItem.order && maxOrder !== undefined) {
          data.order = maxOrder + 1;
        }
      }

      let response;
      if (isEditMode) {
        console.log('📤 Updating curriculum item:', curriculumItem.id, data);
        response = await updateCurriculumItem(curriculumItem.id, data);
      } else {
        console.log('📤 Creating curriculum item for club:', clubId, data);
        response = await createCurriculumItem(clubId, data);
      }

      console.log('✅ Curriculum item saved:', response);

      // Success - call parent's success callback
      if (onSuccess) {
        onSuccess(response);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setIsPublished(true);
      setError(null);
    } catch (err) {
      console.error('❌ Error saving curriculum item:', err);

      // Format error message
      let errorMessage = 'Алдаа гарлаа';

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.title) {
        errorMessage = Array.isArray(err.response.data.title)
          ? err.response.data.title[0]
          : err.response.data.title;
      } else if (err.response?.data) {
        // Field validation errors
        const errors = err.response.data;
        const errorMessages = [];
        for (const field in errors) {
          if (Array.isArray(errors[field])) {
            errorMessages.push(`${field}: ${errors[field].join(', ')}`);
          } else if (typeof errors[field] === 'string') {
            errorMessages.push(`${field}: ${errors[field]}`);
          }
        }
        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsPublished(true);
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? (
            <>
              <i className="bi bi-pencil text-primary me-2"></i>
              Хөтөлбөр засах
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle text-primary me-2"></i>
              Хөтөлбөр нэмэх
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Title Field */}
          <Form.Group className="mb-3">
            <Form.Label>
              Гарчиг <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Жишээ: Алгебрын үндэс"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={200}
              autoFocus
              required
            />
            <Form.Text className="text-muted">
              {title.length}/200 тэмдэгт
            </Form.Text>
          </Form.Group>

          {/* Description Field */}
          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Хөтөлбөрийн дэлгэрэнгүй тайлбар (заавал биш)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          {/* Published Checkbox */}
          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              id="is-published-check"
              label="Нийтлэх"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={loading}
            />
            <Form.Text className="text-muted ms-4">
              Нийтлэгдээгүй бол зөвхөн багш нар харна
            </Form.Text>
          </Form.Group>

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Болих
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !title.trim()}
              className="flex-grow-1"
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                  Хадгалж байна...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditMode ? 'Хадгалах' : 'Нэмэх'}
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CurriculumFormModal;
