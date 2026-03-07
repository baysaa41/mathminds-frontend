import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Button,
  Spinner,
  Alert,
  Stack,
  Badge,
  Image,
  CloseButton,
  Card,
} from 'react-bootstrap';
import apiClient from '../api/axiosConfig';
import { usePrefill } from '../context/PrefillContext';
import { getMyClubs } from '../services/clubsService';
import EmojiPickerButton from './EmojiPickerButton';

/**
 * Үндсэн "Universal" пост үүсгэх форм
 * (!!! ШИНЭЧИЛСЭН: Клуб сонгох dropdown нэмэгдсэн)
 * @param {Function} onPostCreated - Callback after post created
 * @param {Number} clubId - Optional club ID for club posts (ClubFeed-с ирсэн бол)
 * @param {String} clubName - Optional club name for display
 */
const CreatePostForm = ({ onPostCreated, clubId = null, clubName = null }) => {
  const navigate = useNavigate();
  const { prefillData, setPrefillData } = usePrefill();

  // --- Form fields ---
  // "Бэлэг"-ийг 'useState'-н анхны утга болгож тохируулах
  const [content, setContent] = useState('');
  // type === 'club' бол энгийн пост (related item биш)
  const [contentType, setContentType] = useState(
    prefillData?.type === 'club' ? 'post' : prefillData?.type || 'post'
  );
  const [relatedItem, setRelatedItem] = useState(
    prefillData?.type === 'club' ? null : prefillData?.item || null
  );

  // Олон зураг хадгалах State
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Клуб сонгох (зөвхөн clubId prop байхгүй үед)
  // Хэрвээ prefillData.type === 'club' бол урьдчилан сонгоно
  const [selectedClubId, setSelectedClubId] = useState(
    prefillData?.type === 'club' && prefillData?.item?.id ? String(prefillData.item.id) : ''
  );
  const [myClubs, setMyClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const contentRef = useRef(null);
  const imageInputRef = useRef(null);

  // "Бэлэг"-тэй үед focus хийх
  useEffect(() => {
    if (relatedItem) {
      contentRef.current?.focus();
    }
  }, [relatedItem]);

  // Клубуудыг татаж авах (зөвхөн clubId prop байхгүй үед)
  useEffect(() => {
    if (!clubId) {
      fetchMyClubs();
    }
  }, [clubId]);

  const fetchMyClubs = async () => {
    try {
      setLoadingClubs(true);
      const data = await getMyClubs();
      // results эсвэл array байж болно
      const clubsList = data?.results || data || [];
      setMyClubs(Array.isArray(clubsList) ? clubsList : []);
    } catch (err) {
      console.error('Error fetching my clubs:', err);
      // Клуб татаж авахад алдаа гарсан ч пост үүсгэх боломжтой
    } finally {
      setLoadingClubs(false);
    }
  };

  // (!!!) АСУУДАЛТАЙ 'useEffect'-Г ЭНДЭЭС УСТГАСАН (!!!)
  // Strict Mode-д "бэлэг"-ийг устгаж байсан unmount 'useEffect'-г хассан.

  // ... (handleImageChange, clearImage, clearAllImages хэвээрээ) ...
  const handleImageChange = (e) => {
    setError(null);
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length + imageFiles.length > 10) {
      setError('Нэг дор 10-аас ихгүй зураг хавсаргах боломжтой.');
      e.target.value = null;
      return;
    }
    setImageFiles((prevFiles) => [...prevFiles, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
    e.target.value = null;
  };

  const clearImage = (indexToRemove) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]);
    setImageFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, index) => index !== indexToRemove));
  };

  const clearAllImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    if (imageInputRef.current) imageInputRef.current.value = null;
  };

  /**
   * "Бэлэг"-ийг цуцлах (Alert-н хаах товч)
   */
  const clearRelatedItem = () => {
    setRelatedItem(null);
    setContentType('post');
    setPrefillData(null); // Context-г цэвэрлэх (Зөв)
  };

  /**
   * Формыг илгээх
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('content', content);

    // Клубын пост бол club ID нэмэх
    // clubId prop (ClubFeed-с) эсвэл selectedClubId (dropdown-с сонгосон)
    const targetClubId = clubId || selectedClubId;
    if (targetClubId) {
      formData.append('club', targetClubId);
    }

    if (relatedItem) {
      formData.append(`related_${contentType}_id`, relatedItem.uuid || relatedItem.id);
    }
    if (imageFiles.length > 0) {
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
    }

    try {
      const response = await apiClient.post('/api/minds/posts/', formData);
      if (onPostCreated) {
        onPostCreated(response.data);
      }
      // Формыг бүрэн цэвэрлэх
      setContent('');
      setContentType('post');
      setRelatedItem(null);
      setSelectedClubId(''); // Клуб сонголтыг цэвэрлэх
      clearAllImages();
      setPrefillData(null); // Context-г цэвэрлэх (Зөв)
    } catch (err) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const errorMessages = Object.values(errorData).join(' ');
        setError(errorMessages || 'Пост үүсгэхэд алдаа гарлаа.');
      } else {
        setError('Пост үүсгэхэд алдаа гарлаа.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Клубын Badge-г харуулах
   */
  const renderClubBadge = () => {
    if (!clubId || !clubName) return null;

    return (
      <Alert variant="success" className="py-2 px-3 small mb-2">
        <div>
          <Badge pill bg="success" className="me-2">
            Клуб
          </Badge>
          {clubName}-д пост үүсгэж байна
        </div>
      </Alert>
    );
  };

  /**
   * "Бэлэг"-ийн Badge-г харуулах (PostCard шиг)
   */
  const renderRelatedItemBadge = () => {
    if (!relatedItem) return null;

    const typeConfig = {
      problem: {
        label: 'Бодлого',
        badgeVariant: 'secondary',
      },
      article: {
        label: 'Өгүүлэл',
        badgeVariant: 'success',
      },
      formula: {
        label: 'Томьёо',
        badgeVariant: 'info',
      },
      quiz: {
        label: 'Тест',
        badgeVariant: 'primary',
      },
    };

    const config = typeConfig[contentType] || typeConfig.problem;

    let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;
    let description =
      relatedItem.statement || // Бодлогын 'statement'
      relatedItem.content || // Томьёо, Өгүүллийн 'content'
      relatedItem.abstract || // Өгүүллийн 'abstract'
      relatedItem.description || // Тестийн 'description'
      '';

    // Бодлого, Томьёо бол бүтэн, бусад бол товч харуулна
    const contentToShow =
      contentType === 'problem' || contentType === 'formula'
        ? description
        : description.substring(0, 150) + (description.length > 150 ? '...' : '');

    return (
      <div className="position-relative mb-3">
        <CloseButton
          onClick={clearRelatedItem}
          className="position-absolute top-0 end-0 m-2"
          style={{ fontSize: '0.75rem', zIndex: 10 }}
        />
        <Card className="bg-light border shadow-sm">
          <Card.Body>
            <Badge bg={config.badgeVariant} className="mb-2">
              {config.label}
            </Badge>
            <Card.Title className="h6 mb-1">{title}</Card.Title>
            {description && (
              <Card.Text className="small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                {contentToShow.replace(/<[^>]*>/g, '')}
              </Card.Text>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // --- Үндсэн Render ---
  return (
    <>
      <Form onSubmit={handleSubmit} className="p-3 border rounded bg-white shadow-sm mb-3 mx-3">
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Клуб сонгох dropdown (зөвхөн clubId prop байхгүй үед) */}
        {!clubId && myClubs.length > 0 && (
          <Form.Group className="mb-3">
            <Form.Label className="small text-muted">
              Хаашаа {loadingClubs && <Spinner size="sm" animation="border" />}
            </Form.Label>
            <Form.Select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              disabled={loadingClubs}
            >
              <option value="">Нийтэд</option>
              {myClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  📚 {club.name} {club.role === 'teacher' ? '(Багш)' : '(Гишүүн)'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        {renderClubBadge()}
        {renderRelatedItemBadge()}
        <Form.Group controlId="postContent">
          <Form.Control
            ref={contentRef}
            as="textarea"
            rows={3}
            placeholder={
              relatedItem
                ? 'Сэтгэгдлээ бичнэ үү...'
                : 'Юу бодож байна... (YouTube, Vimeo линкээ энд хуулж болно)'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)} // Энэ алдааг өмнө нь зассан
            required={!relatedItem && imageFiles.length === 0}
          />
        </Form.Group>
        <Stack direction="horizontal" gap={3} className="mt-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 text-secondary text-decoration-none"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageFiles.length >= 10}
          >
            <i className="bi bi-images me-1"></i>
            Зураг {imageFiles.length > 0 && `(${imageFiles.length} / 10)`}
          </Button>
          <EmojiPickerButton
            textareaRef={contentRef}
            onInsert={(newValue, cursorPos) => {
              setContent(newValue);
              setTimeout(() => {
                if (contentRef.current) {
                  contentRef.current.selectionStart = cursorPos;
                  contentRef.current.selectionEnd = cursorPos;
                }
              }, 0);
            }}
          />
        </Stack>
        <Form.Control
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageChange}
          className="d-none"
          multiple
        />
        {imagePreviews.length > 0 && (
          <div className="mt-2 d-flex flex-wrap" style={{ gap: '10px' }}>
            {imagePreviews.map((previewUrl, index) => (
              <div
                key={index}
                className="position-relative d-inline-block"
                style={{ width: '100px', height: '100px' }}
              >
                <CloseButton
                  onClick={() => clearImage(index)}
                  className="position-absolute top-0 end-0 bg-light p-1"
                  style={{ zIndex: 1, fontSize: '0.6em', opacity: 0.8 }}
                  title="Устгах"
                />
                <Image
                  src={previewUrl}
                  thumbnail
                  fluid
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}
        <div className="text-end mt-3">
          <Button type="submit" disabled={loading}>
            {loading && <Spinner as="span" size="sm" className="me-1" />}
            Нийтлэх
          </Button>
        </div>
      </Form>
    </>
  );
};

export default CreatePostForm;
