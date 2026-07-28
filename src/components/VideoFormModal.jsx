// src/components/VideoFormModal.jsx
// Видео хичээл нэмэх/засах Modal

import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { createVideoItem, updateVideoItem } from '../services/clubContentService';

const VideoFormModal = ({ show, onHide, clubId, videoItem, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!videoItem;

  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const extractVimeoId = (url) => {
    const pattern = /vimeo\.com\/(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchVideoMetadata = async (url) => {
    if (!url) return;
    setFetchingMetadata(true);
    setError(null);
    try {
      const youtubeId = extractYouTubeId(url);
      if (youtubeId) {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        if (response.ok) {
          const videoData = await response.json();
          if (videoData.title && !title) setTitle(videoData.title);
          const noembedResponse = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`
          );
          if (noembedResponse.ok) {
            const noembedData = await noembedResponse.json();
            if (noembedData.duration && !duration) setDuration(formatDuration(noembedData.duration));
          }
        }
      }
      const vimeoId = extractVimeoId(url);
      if (vimeoId) {
        const response = await fetch(
          `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`
        );
        if (response.ok) {
          const videoData = await response.json();
          if (videoData.title && !title) setTitle(videoData.title);
          if (videoData.duration && !duration) setDuration(formatDuration(videoData.duration));
        }
      }
    } catch (err) {
      console.error('Error fetching video metadata:', err);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleUrlChange = (newUrl) => {
    setVideoUrl(newUrl);
    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be') || newUrl.includes('vimeo.com')) {
      const timer = setTimeout(() => fetchVideoMetadata(newUrl), 500);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    if (videoItem) {
      setTitle(videoItem.title || '');
      setDescription(videoItem.description || '');
      setVideoUrl(videoItem.video_url || '');
      setDuration(videoItem.duration || '');
      setIsPublished(videoItem.is_published ?? true);
    } else {
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setDuration('');
      setIsPublished(true);
    }
    setError(null);
  }, [videoItem, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Гарчиг заавал оруулна уу'); return; }
    if (title.length > 200) { setError('Гарчиг хэтэрхий урт байна (200 тэмдэгтээс бага байх ёстой)'); return; }
    if (!videoUrl.trim()) { setError('Видео холбоос заавал оруулна уу'); return; }
    try { new URL(videoUrl); } catch { setError('Буруу URL хэлбэр байна'); return; }

    try {
      setLoading(true);
      const data = {
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        duration: duration.trim(),
        is_published: isPublished,
      };

      let response;
      if (isEditMode) {
        response = await updateVideoItem(videoItem.id, data);
      } else {
        response = await createVideoItem(clubId, data);
      }

      if (onSuccess) onSuccess(response);
      setTitle(''); setDescription(''); setVideoUrl(''); setDuration('');
      setIsPublished(true); setError(null);
    } catch (err) {
      console.error('❌ Error saving video item:', err);
      let errorMessage = 'Алдаа гарлаа';
      if (err.response?.data?.error) errorMessage = err.response.data.error;
      else if (err.response?.data?.detail) errorMessage = err.response.data.detail;
      else if (err.response?.data?.title) {
        errorMessage = Array.isArray(err.response.data.title)
          ? err.response.data.title[0] : err.response.data.title;
      } else if (err.response?.data?.video_url) {
        errorMessage = Array.isArray(err.response.data.video_url)
          ? err.response.data.video_url[0] : err.response.data.video_url;
      } else if (err.response?.data) {
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
    setTitle(''); setDescription(''); setVideoUrl(''); setDuration('');
    setIsPublished(true); setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? (
            <><i className="bi bi-pencil text-primary me-2"></i>Видео хичээл засах</>
          ) : (
            <><i className="bi bi-plus-circle text-primary me-2"></i>Видео хичээл нэмэх</>
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
              placeholder="Жишээ: Тэгшитгэл бодох арга"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              maxLength={200}
              autoFocus
              required
            />
            <Form.Text className="text-muted">{title.length}/200 тэмдэгт</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Видео холбоос <span className="text-danger">*</span></Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={loading}
                required
                className="flex-grow-1"
              />
              {videoUrl && !isEditMode && (
                <Button
                  variant="outline-secondary"
                  onClick={() => fetchVideoMetadata(videoUrl)}
                  disabled={loading || fetchingMetadata}
                  title="Видео мэдээлэл татах"
                >
                  {fetchingMetadata ? <Spinner animation="border" size="sm" /> : <i className="bi bi-arrow-clockwise"></i>}
                </Button>
              )}
            </div>
            <Form.Text className="text-muted">
              {fetchingMetadata ? (
                <span className="text-primary">
                  <Spinner animation="border" size="sm" className="me-1" />
                  Видео мэдээлэл татаж байна...
                </span>
              ) : 'YouTube, Vimeo холбоос оруулахад гарчиг, үргэлжлэх хугацааг автоматаар татна'}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Үргэлжлэх хугацаа</Form.Label>
            <Form.Control
              type="text"
              placeholder="Жишээ: 5:30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={loading}
              maxLength={20}
            />
            <Form.Text className="text-muted">Минут:секунд (заавал биш)</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Видео хичээлийн тайлбар (заавал биш)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

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

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>Болих</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !title.trim() || !videoUrl.trim()}
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

export default VideoFormModal;
