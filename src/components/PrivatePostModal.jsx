// frontend/src/components/PrivatePostModal.jsx
import { useState, useRef } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Image,
  CloseButton,
  Spinner,
} from 'react-bootstrap';
import { Send, ImagePlus, X } from 'lucide-react';
import apiClient from '../api/axiosConfig';

/**
 * Хувийн пост илгээх Modal
 * @param {Boolean} show - Modal харуулах эсэх
 * @param {Function} onHide - Modal хаах callback
 * @param {String} recipientUsername - Хүлээн авагчийн username
 * @param {Function} onSuccess - Амжилттай илгээсний дараах callback
 */
const PrivatePostModal = ({ show, onHide, recipientUsername, onSuccess }) => {
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imageInputRef = useRef(null);

  // Зураг сонгох
  const handleImageChange = (e) => {
    setError(null);
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length + imageFiles.length > 10) {
      setError('Нэг дор 10-аас ихгүй зураг хавсаргах боломжтой.');
      e.target.value = null;
      return;
    }

    const newImageFiles = [...imageFiles, ...files];
    setImageFiles(newImageFiles);

    // Preview үүсгэх
    const newPreviews = [...imagePreviews];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = null;
  };

  // Зураг устгах
  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Бүх зураг устгах
  const clearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    if (imageInputRef.current) {
      imageInputRef.current.value = null;
    }
  };

  // Хувийн пост илгээх
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!content.trim() && imageFiles.length === 0) {
      setError('Агуулга эсвэл зураг оруулна уу.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    // Array-г зөв илгээх (DRF ListField-д зориулж)
    formData.append('private_recipient_usernames', recipientUsername);

    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
    }

    try {
      const response = await apiClient.post('/api/minds/posts/', formData);

      // Амжилттай илгээсэн
      setContent('');
      clearAllImages();

      if (onSuccess) {
        onSuccess(response.data);
      }

      onHide();
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const errorMessages = Object.values(errorData).join(' ');
        setError(errorMessages || 'Хувийн пост илгээхэд алдаа гарлаа.');
      } else {
        setError('Хувийн пост илгээхэд алдаа гарлаа.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal хаах үед цэвэрлэх
  const handleClose = () => {
    setContent('');
    setError(null);
    clearAllImages();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Send size={20} className="me-2" />
          Хувийн мессеж илгээх
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Alert variant="info" className="small mb-3">
          <strong>@{recipientUsername}</strong>-д хувийн мессеж илгээх гэж байна.
          Зөвхөн та хоёр энэ постыг feed дээр харна, гэхдээ линкээр бусад хэрэглэгч харж болно.
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Хувийн мессеж бичих..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
          </Form.Group>

          {/* Зургийн preview */}
          {imagePreviews.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      thumbnail
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <CloseButton
                      onClick={() => removeImage(index)}
                      className="position-absolute top-0 end-0 m-1 bg-white"
                      style={{ fontSize: '0.7rem' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Зураг хавсаргах товч */}
          <div className="mb-3">
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={loading}
            >
              <ImagePlus size={16} className="me-1" />
              Зураг хавсаргах ({imageFiles.length}/10)
            </Button>
          </div>

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Цуцлах
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || (!content.trim() && imageFiles.length === 0)}
              className="flex-grow-1"
            >
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Илгээж байна...
                </>
              ) : (
                <>
                  <Send size={16} className="me-1" />
                  Илгээх
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PrivatePostModal;
