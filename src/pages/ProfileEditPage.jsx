// frontend/src/pages/ProfileEditPage.jsx (ШИНЭ ФАЙЛ)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import apiClient from '../api/axiosConfig';
import Cropper from 'react-easy-crop';
import { SITE_ROLE_CONFIG, SITE_ROLES } from '../constants/membership';

// Bootstrap components
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';

function ProfileEditPage() {
  const { user, updateUser } = useAuth(); // updateUser-г context-с авна
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Staff editing another user
  const targetUsername = searchParams.get('username');
  const isEditingOther = user?.is_staff && targetUsername && targetUsername !== user?.username;

  const [targetUser, setTargetUser] = useState(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    site_role: '',
    picture_url: '',
  });

  // Username солих (зөвхөн өөрийн профайл засах үед)
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [changingUsername, setChangingUsername] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Зураг upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Зураг crop
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Staff: бусад хэрэглэгчийн мэдээллийг татах
  useEffect(() => {
    if (isEditingOther) {
      setLoadingTarget(true);
      apiService.getUserProfile(targetUsername)
        .then((data) => {
          setTargetUser(data);
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            site_role: data.site_role || 'OTHER',
            picture_url: data.picture_url || '',
          });
          setImagePreview(data.picture_url || null);
        })
        .catch(() => setError('Хэрэглэгчийн мэдээлэл татахад алдаа гарлаа.'))
        .finally(() => setLoadingTarget(false));
    }
  }, [isEditingOther, targetUsername]);

  // Өөрийн профайл: user мэдээлэл context-с ачаалагдсаны дараа form-г дүүргэнэ
  useEffect(() => {
    if (!isEditingOther && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        site_role: user.site_role || 'OTHER',
        picture_url: user.picture_url || '',
      });
      setImagePreview(user.picture_url || null);
    }
  }, [isEditingOther, user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Crop callback
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper function: Load image from URL
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  // Helper function: Get cropped image as blob
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Цагаан background нэмэх (transparent өнгийг цагаан болгоно)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Read file and show crop modal
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropModal(true);
        setCrop({ x: 0, y: 0 });
        setZoom(0.8); // Анхны zoom-г жижигрүүлж, зургийг бүтнээр нь харах боломжтой
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop completion and create cropped image file
  const handleCropComplete = async () => {
    try {
      if (!imageToCrop || !croppedAreaPixels) {
        setError('Crop мэдээлэл дутуу байна.');
        return;
      }

      // Get cropped image blob
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Convert blob to File object
      const croppedFile = new File([croppedBlob], 'profile-picture.jpg', {
        type: 'image/jpeg',
      });

      // Set as selected image and create preview
      setSelectedImage(croppedFile);
      setImagePreview(URL.createObjectURL(croppedBlob));

      // Close modal
      setShowCropModal(false);
      setImageToCrop(null);
    } catch (err) {
      console.error('Crop хийхэд алдаа:', err);
      setError('Зураг crop хийхэд алдаа гарлаа.');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      setError('Зураг сонгоно уу.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('picture', selectedImage);

      const response = await apiService.uploadProfilePicture(
        formData,
        isEditingOther ? targetUsername : null
      );

      // Update user picture_url (only update context if editing own profile)
      if (!isEditingOther) {
        updateUser({ ...user, picture_url: response.picture_url });
      }
      setFormData((prev) => ({ ...prev, picture_url: response.picture_url }));
      setSuccess('Профайл зураг амжилттай солигдлоо!');
      setSelectedImage(null);
    } catch (err) {
      console.error('Image upload error:', err);
      setError(err.message || 'Зураг upload хийхэд алдаа гарлаа.');
    } finally {
      setUploading(false);
    }
  };

  // Username боломжтой эсэхийг шалгах
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    setCheckingUsername(true);
    setUsernameError(null);

    try {
      const response = await apiClient.get(`/users/api/check-username/?username=${username}`);
      if (response.data.available) {
        setUsernameAvailable(true);
        setUsernameError(null);
      } else {
        setUsernameAvailable(false);
        setUsernameError(response.data.error);
      }
    } catch (err) {
      setUsernameAvailable(false);
      setUsernameError(err.response?.data?.error || err.message || 'Алдаа гарлаа.');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Username оруулах үед шалгах
  const handleUsernameChange = (e) => {
    const value = e.target.value.trim();
    setNewUsername(value);

    // Debounce effect (500ms хүлээж шалгах)
    if (value && value !== user?.username) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setUsernameAvailable(null);
      setUsernameError(null);
    }
  };

  // Username солих
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();

    if (!newUsername || newUsername === user?.username) {
      setUsernameError('Шинэ хэрэглэгчийн нэр оруулна уу.');
      return;
    }

    if (!usernameAvailable) {
      setUsernameError('Энэ хэрэглэгчийн нэр боломжгүй байна.');
      return;
    }

    setChangingUsername(true);
    setUsernameError(null);

    try {
      const response = await apiClient.post('/users/api/change-username/', {
        new_username: newUsername,
      });

      // Update user context
      updateUser(response.data.user);
      setSuccess('Хэрэглэгчийн нэр амжилттай солигдлоо!');
      setNewUsername('');
      setUsernameAvailable(null);

      // Redirect to new profile URL
      setTimeout(() => {
        navigate(`/profile/${response.data.new_username}`);
      }, 2000);
    } catch (err) {
      setUsernameError(
        err.response?.data?.error || err.message || 'Хэрэглэгчийн нэр солиход алдаа гарлаа.'
      );
    } finally {
      setChangingUsername(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Backend partial=True-г хүлээж авч байгаа тул
      // зүгээр л бүх мэдээллээ явуулж болно.
      const dataToUpdate = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        site_role: formData.site_role || 'OTHER',
        picture_url: formData.picture_url,
      };

      const updatedUser = await apiService.updateUserProfile(
        dataToUpdate,
        isEditingOther ? targetUsername : null
      );

      // Context-г шинэчлэх (зөвхөн өөрийн профайл засаж байгаа үед)
      if (!isEditingOther) {
        updateUser(updatedUser);
      }

      setSuccess('Амжилттай шинэчлэгдлээ.');
      setLoading(false);

      // 2 секундын дараа профайл хуудас руу буцах
      const redirectTo = isEditingOther
        ? `/profile/${targetUsername}`
        : '/profile';
      setTimeout(() => {
        navigate(redirectTo);
      }, 2000);
    } catch (err) {
      setLoading(false);
      if (typeof err === 'object') {
        // Backend validation алдаа (жишээ: {role: ["Invalid choice."]})
        const messages = Object.values(err).flat().join(' ');
        setError(messages || 'Алдаа гарлаа.');
      } else {
        setError(err.message || 'Профайл шинэчлэхэд алдаа гарлаа.');
      }
    }
  };

  if (loadingTarget) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  const displayUser = isEditingOther ? targetUser : user;

  return (
    <Container className="my-4" style={{ maxWidth: '800px' }}>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-light p-4 border-0">
          <h2 className="h4 fw-bold mb-0">Профайл засах</h2>
          <p className="text-muted mb-0">@{displayUser?.username}</p>
          {isEditingOther && (
            <p className="text-warning small mb-0">Staff: бусад хэрэглэгчийн профайл засаж байна</p>
          )}
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Username солих - зөвхөн өөрийн профайл засах үед */}
            {!isEditingOther && (
              <>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="fw-semibold">
                    Хэрэглэгчийн нэр
                    <small className="text-muted ms-2">(Одоо: @{user?.username})</small>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <div className="flex-grow-1">
                      <Form.Control
                        type="text"
                        value={newUsername}
                        onChange={handleUsernameChange}
                        placeholder={user?.username || 'Шинэ хэрэглэгчийн нэр'}
                        isInvalid={usernameAvailable === false}
                        isValid={usernameAvailable === true && newUsername}
                      />
                      {checkingUsername && (
                        <Form.Text className="text-muted">
                          <Spinner as="span" animation="border" size="sm" className="me-1" />
                          Шалгаж байна...
                        </Form.Text>
                      )}
                      {usernameAvailable === true && newUsername && (
                        <Form.Text className="text-success d-block">✓ Боломжтой</Form.Text>
                      )}
                      {usernameAvailable === false && usernameError && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {usernameError}
                        </Form.Control.Feedback>
                      )}
                    </div>
                    <Button
                      variant="outline-primary"
                      onClick={handleUsernameSubmit}
                      disabled={changingUsername || !usernameAvailable || !newUsername}
                      style={{ minWidth: '100px' }}
                    >
                      {changingUsername ? (
                        <Spinner as="span" animation="border" size="sm" />
                      ) : (
                        'Солих'
                      )}
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    3-30 тэмдэгт, зөвхөн үсэг, тоо, доогуур зураас
                  </Form.Text>
                </Form.Group>

                <hr className="my-4" />
              </>
            )}

            {/* Нэр, Овог */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="first_name">
                  <Form.Label>Нэр</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Нэр"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="last_name">
                  <Form.Label>Овог</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Овог"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Үндсэн үүрэг (site_role) */}
            <Form.Group className="mb-3" controlId="site_role">
              <Form.Label className="fw-semibold">Таны үүрэг</Form.Label>
              <Form.Select
                name="site_role"
                value={formData.site_role}
                onChange={handleChange}
                required
              >
                {Object.keys(SITE_ROLES)
                  .filter((roleKey) => roleKey !== 'STAFF' || user?.is_staff || formData.site_role === 'STAFF')
                  .map((roleKey) => (
                    <option key={roleKey} value={SITE_ROLES[roleKey]}>
                      {SITE_ROLE_CONFIG[SITE_ROLES[roleKey]]?.label || roleKey}
                    </option>
                  ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Та багш уу, сурагч уу, эсвэл бусад үүрэгтэй юу?
              </Form.Text>
            </Form.Group>

            {/* Профайл зураг upload */}
            <Form.Group className="mb-4" controlId="profilePicture">
              <Form.Label className="fw-semibold">Профайл зураг</Form.Label>

              {/* Зургийн preview */}
              {imagePreview && (
                <div className="mb-3 text-center">
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '3px solid #dee2e6',
                    }}
                  />
                </div>
              )}

              {/* File input */}
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={uploading}
              />
              <Form.Text className="text-muted d-block mt-2">
                JPEG, PNG, GIF, WEBP форматтай зураг. Хэмжээ 5MB-аас бага байх ёстой.
              </Form.Text>

              {/* Upload button */}
              {selectedImage && (
                <Button
                  variant="success"
                  size="sm"
                  className="mt-2"
                  onClick={handleImageUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-1" />
                      Upload хийж байна...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-1"></i>
                      Зураг upload хийх
                    </>
                  )}
                </Button>
              )}
            </Form.Group>

            <Form.Group className="mb-3" controlId="picture_url">
              <Form.Label>Эсвэл зургийн URL оруулах</Form.Label>
              <Form.Control
                type="text"
                name="picture_url"
                value={formData.picture_url}
                onChange={handleChange}
                placeholder="https://..."
              />
              <Form.Text className="text-muted">
                Гадны зургийн линк (ui-avatars.com, gravatar.com г.м)
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => navigate(isEditingOther ? `/profile/${targetUsername}` : '/profile')}
                disabled={loading}
              >
                Цуцлах
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Хадгалах'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Crop Modal */}
      <Modal show={showCropModal} onHide={() => setShowCropModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Зургийг тохируулах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ position: 'relative', width: '100%', height: '400px' }}>
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                minZoom={0.5}
                maxZoom={3}
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="mt-3">
            <Form.Label>Хэмжээ: {zoom.toFixed(1)}x</Form.Label>
            <Form.Range
              min={0.5}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
            <div className="d-flex justify-content-between small text-muted">
              <span>Жижиг (0.5x)</span>
              <span>Том (3x)</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCropModal(false)}>
            Цуцлах
          </Button>
          <Button variant="primary" onClick={handleCropComplete}>
            <i className="bi bi-check-circle me-1"></i>
            Хадгалах
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ProfileEditPage;
