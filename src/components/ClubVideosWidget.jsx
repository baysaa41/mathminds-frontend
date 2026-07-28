// ClubVideosWidget.jsx
// Видео хичээлүүд - багш нарт засах, устгах, эрэмбэлэх боломжтой

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Video, Play, Clock, ChevronUp, ChevronDown, Edit2, Trash2, Plus } from 'lucide-react';
import VideoFormModal from './VideoFormModal';
import { deleteVideoItem, moveVideoUp, moveVideoDown } from '../services/clubContentService';

const ClubVideosWidget = ({ club, onUpdate, isTeacherOrAdmin }) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingItemId, setLoadingItemId] = useState(null);

  if (!club) return null;

  const videos = club.videos || [];

  // Empty state for teachers/admins
  if (videos.length === 0 && !isTeacherOrAdmin) {
    return null; // Видео байхгүй бол энгийн гишүүдэд харуулахгүй
  }

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" видеог устгах уу?`)) {
      return;
    }

    try {
      setLoadingItemId(item.id);
      await deleteVideoItem(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Видео устгахад алдаа гарлаа');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleMoveUp = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveVideoUp(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error moving video up:', error);
      const message = error.response?.data?.detail || 'Видео шилжүүлэхэд алдаа гарлаа';
      alert(message);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleMoveDown = async (item) => {
    try {
      setLoadingItemId(item.id);
      await moveVideoDown(item.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error moving video down:', error);
      const message = error.response?.data?.detail || 'Видео шилжүүлэхэд алдаа гарлаа';
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
              <Video size={16} className="me-2" />
              Видео хичээлүүд
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
          {videos.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <Video size={32} className="mb-2 opacity-50" />
              <p className="mb-0 small">Видео хичээл хараахан нэмэгдээгүй байна</p>
              {isTeacherOrAdmin && (
                <p className="mb-0 small">Дээрх "Нэмэх" товчоор эхлүүлэх</p>
              )}
            </div>
          ) : (
            <ListGroup variant="flush">
              {videos.map((video, index) => (
                <ListGroup.Item
                  key={video.id}
                  className="py-2 px-3"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    {/* Left: Video info */}
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <Play size={14} className="text-primary me-1" />
                          <span className="small fw-medium">{video.title}</span>
                        </a>
                        {!video.is_published && isTeacherOrAdmin && (
                          <Badge bg="warning" text="dark" className="small">
                            Ноорог
                          </Badge>
                        )}
                      </div>
                      {video.duration && (
                        <div className="d-flex align-items-center text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          <Clock size={12} className="me-1" />
                          {video.duration}
                        </div>
                      )}
                      {video.description && (
                        <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          {video.description.length > 80
                            ? `${video.description.substring(0, 80)}...`
                            : video.description}
                        </div>
                      )}
                    </div>

                    {/* Right: Action buttons for teachers/admins */}
                    {isTeacherOrAdmin && (
                      <div className="d-flex gap-1 ms-2" style={{ minWidth: '140px' }}>
                        {loadingItemId === video.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            {/* Move Up */}
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleMoveUp(video)}
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
                              onClick={() => handleMoveDown(video)}
                              disabled={index === videos.length - 1}
                              title="Доош шилжүүлэх"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <ChevronDown size={14} />
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(video)}
                              title="Засах"
                              style={{ padding: '0.25rem 0.5rem' }}
                            >
                              <Edit2 size={14} />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(video)}
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

      {/* Video Form Modal */}
      <VideoFormModal
        show={showFormModal}
        onHide={() => {
          setShowFormModal(false);
          setEditingItem(null);
        }}
        clubId={club.id}
        videoItem={editingItem}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};

export default ClubVideosWidget;
