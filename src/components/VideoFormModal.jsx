// src/components/VideoFormModal.jsx
// Видео хичээл нэмэх/засах Modal

import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { createVideoItem, updateVideoItem } from '../services/clubsService';

const VideoFormModal = ({ show, onHide, clubId, videoItem, curriculumItems, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [error, setError] = useState(null);

  const isEditMode = !!videoItem;

  // Helper function to extract YouTube video ID
  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Helper function to extract Vimeo video ID
  const extractVimeoId = (url) => {
    const pattern = /vimeo\.com\/(\d+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  };

  // Helper function to format seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch video metadata from YouTube or Vimeo
  const fetchVideoMetadata = async (url) => {
    if (!url) return;

    setFetchingMetadata(true);
    setError(null);

    try {
      let videoData = null;

      // Check if YouTube
      const youtubeId = extractYouTubeId(url);
      if (youtubeId) {
        // Use YouTube oEmbed API
        const response = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
        );
        if (response.ok) {
          videoData = await response.json();
          if (videoData.title && !title) {
            setTitle(videoData.title);
          }
          // YouTube oEmbed doesn't provide duration, try using noembed.com
          const noembedResponse = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${youtubeId}`
          );
          if (noembedResponse.ok) {
            const noembedData = await noembedResponse.json();
            if (noembedData.duration && !duration) {
              setDuration(formatDuration(noembedData.duration));
            }
          }
        }
      }

      // Check if Vimeo
      const vimeoId = extractVimeoId(url);
      if (vimeoId) {
        // Use Vimeo oEmbed API
        const response = await fetch(
          `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoId}`
        );
        if (response.ok) {
          videoData = await response.json();
          if (videoData.title && !title) {
            setTitle(videoData.title);
          }
          if (videoData.duration && !duration) {
            setDuration(formatDuration(videoData.duration));
          }
        }
      }

      if (!youtubeId && !vimeoId) {
        console.log('Not a YouTube or Vimeo URL, skipping metadata fetch');
      }

    } catch (err) {
      console.error('Error fetching video metadata:', err);
      // Don't show error to user, just silently fail
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Auto-fetch metadata when URL changes
  const handleUrlChange = (newUrl) => {
    setVideoUrl(newUrl);

    // Debounce: only fetch if URL looks complete
    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be') || newUrl.includes('vimeo.com')) {
      // Wait a bit to see if user is still typing
      const timer = setTimeout(() => {
        fetchVideoMetadata(newUrl);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (videoItem) {
      setTitle(videoItem.title || '');
      setDescription(videoItem.description || '');
      setVideoUrl(videoItem.video_url || '');
      setDuration(videoItem.duration || '');
      setCurriculumId(videoItem.curriculum || '');
      setIsPublished(videoItem.is_published ?? true);
    } else {
      // Reset form when creating new
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setDuration('');
      setCurriculumId('');
      setIsPublished(true);
    }
    setError(null);
  }, [videoItem, show]);

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

    if (!videoUrl.trim()) {
      setError('Видео холбоос заавал оруулна уу');
      return;
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
    } catch {
      setError('Буруу URL хэлбэр байна');
      return;
    }

    try {
      setLoading(true);

      const data = {
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        duration: duration.trim(),
        is_published: isPublished,
      };

      // Only add curriculum if selected
      if (curriculumId) {
        data.curriculum = curriculumId;
      }

      let response;
      if (isEditMode) {
        console.log('📤 Updating video item:', videoItem.id, data);
        response = await updateVideoItem(videoItem.id, data);
      } else {
        console.log('📤 Creating video item for club:', clubId, data);
        response = await createVideoItem(clubId, data);
      }

      console.log('✅ Video item saved:', response);

      // Success - call parent's success callback
      if (onSuccess) {
        onSuccess(response);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setVideoUrl('');
      setDuration('');
      setCurriculumId('');
      setIsPublished(true);
      setError(null);
    } catch (err) {
      console.error('❌ Error saving video item:', err);

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
      } else if (err.response?.data?.video_url) {
        errorMessage = Array.isArray(err.response.data.video_url)
          ? err.response.data.video_url[0]
          : err.response.data.video_url;
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
    setVideoUrl('');
    setDuration('');
    setCurriculumId('');
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
              Видео хичээл засах
            </>
          ) : (
            <>
              <i className="bi bi-plus-circle text-primary me-2"></i>
              Видео хичээл нэмэх
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
              placeholder="Жишээ: Тэгшитгэл бодох арга"
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

          {/* Video URL Field */}
          <Form.Group className="mb-3">
            <Form.Label>
              Видео холбоос <span className="text-danger">*</span>
            </Form.Label>
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
                  {fetchingMetadata ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="bi bi-arrow-clockwise"></i>
                  )}
                </Button>
              )}
            </div>
            <Form.Text className="text-muted">
              {fetchingMetadata ? (
                <span className="text-primary">
                  <Spinner animation="border" size="sm" className="me-1" />
                  Видео мэдээлэл татаж байна...
                </span>
              ) : (
                'YouTube, Vimeo холбоос оруулахад гарчиг, үргэлжлэх хугацааг автоматаар татна'
              )}
            </Form.Text>
          </Form.Group>

          {/* Duration Field */}
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
            <Form.Text className="text-muted">
              Минут:секунд (заавал биш)
            </Form.Text>
          </Form.Group>

          {/* Description Field */}
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

          {/* Curriculum Selection */}
          {curriculumItems && curriculumItems.length > 0 && (
            <Form.Group className="mb-3">
              <Form.Label>Хөтөлбөр</Form.Label>
              <Form.Select
                value={curriculumId}
                onChange={(e) => setCurriculumId(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Хөтөлбөргүй --</option>
                {curriculumItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Хөтөлбөрт холбох (заавал биш)
              </Form.Text>
            </Form.Group>
          )}

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
              disabled={loading || !title.trim() || !videoUrl.trim()}
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

export default VideoFormModal;
