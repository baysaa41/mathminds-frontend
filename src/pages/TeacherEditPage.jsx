// src/pages/TeacherEditPage.jsx
// Багш засах/нэмэх хуудас (зөвхөн staff-д)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { Save, Trash2, Plus } from 'lucide-react';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

export default function TeacherEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subject: 'MATH',
    bio: '',
    program: '',
    participation_type: 'CORE',
    display_order: 0,
    is_active: true,
    user: null,
  });

  const [achievements, setAchievements] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Subject choices
  const subjectChoices = [
    { value: 'MATH', label: 'Математик' },
    { value: 'PHYSICS', label: 'Физик' },
    { value: 'CHEMISTRY', label: 'Хими' },
    { value: 'BIOLOGY', label: 'Биологи' },
    { value: 'OTHER', label: 'Бусад' },
  ];

  // Participation type choices
  const participationChoices = [
    { value: 'CORE', label: 'Үндсэн багш' },
    { value: 'INVITED', label: 'Урилгаар оролцсон' },
  ];

  // Icon choices
  const iconChoices = ['trophy', 'award', 'target'];

  useEffect(() => {
    // Staff шалгах
    if (!user || !user.is_staff) {
      navigate('/teachers');
      return;
    }

    if (id) {
      fetchTeacher();
    }
  }, [id, user, navigate]);

  const fetchTeacher = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users/api/teachers/${id}/`);
      const data = response.data;
      setFormData({
        name: data.name || '',
        title: data.title || '',
        subject: data.subject || 'MATH',
        bio: data.bio || '',
        program: data.program || '',
        participation_type: data.participation_type || 'CORE',
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
        user: data.user || null,
      });
      setAchievements(data.achievements || []);
      if (data.image) {
        setImagePreview(data.image);
      }
    } catch (err) {
      console.error('Failed to fetch teacher:', err);
      setError('Багшийн мэдээллийг татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddAchievement = () => {
    setAchievements([...achievements, { icon: 'trophy', title: '', description: '' }]);
  };

  const handleAchievementChange = (index, field, value) => {
    const newAchievements = [...achievements];
    newAchievements[index][field] = value;
    setAchievements(newAchievements);
  };

  const handleRemoveAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('title', formData.title);
      data.append('subject', formData.subject);
      data.append('bio', formData.bio);
      data.append('program', formData.program);
      data.append('participation_type', formData.participation_type);
      data.append('display_order', formData.display_order);
      data.append('is_active', formData.is_active);
      data.append('achievements', JSON.stringify(achievements));

      if (formData.user) {
        data.append('user', formData.user);
      }

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (id) {
        // Update
        await apiClient.patch(`/users/api/teachers/${id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Амжилттай шинэчлэгдлээ!');
      } else {
        // Create
        const response = await apiClient.post('/users/api/teachers/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Амжилттай үүсгэлээ!');
        setTimeout(() => {
          navigate(`/teacher/${response.data.id}/edit`);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to save teacher:', err);
      const errorMsg = err.response?.data
        ? Object.values(err.response.data).flat().join(', ')
        : 'Хадгалахад алдаа гарлаа.';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!user || !user.is_staff) {
    return null;
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Уншиж байна...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <AppBreadcrumb items={[{ label: 'Багш нар', to: '/teachers' }, { label: 'Засах' }]} />
      </div>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">{id ? 'Багш засах' : 'Шинэ багш нэмэх'}</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                {/* Нэр */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Нэр <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Жишээ: Б.Батаа"
                  />
                </Form.Group>

                {/* Албан тушаал */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Албан тушаал <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Жишээ: Математикийн багш, Олимпиадын дасгалжуулагч"
                  />
                </Form.Group>

                {/* Хичээл */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Хичээл <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="subject" value={formData.subject} onChange={handleChange}>
                    {subjectChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Танилцуулга */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Танилцуулга <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    placeholder="Багшийн дэлгэрэнгүй танилцуулга..."
                  />
                </Form.Group>

                {/* Хөтөлбөр */}
                <Form.Group className="mb-3">
                  <Form.Label>Хөтөлбөр</Form.Label>
                  <Form.Control
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    placeholder="Жишээ: nomads360, MathMinds"
                  />
                </Form.Group>

                {/* Оролцооны төрөл */}
                <Form.Group className="mb-3">
                  <Form.Label>Оролцооны төрөл</Form.Label>
                  <Form.Select
                    name="participation_type"
                    value={formData.participation_type}
                    onChange={handleChange}
                  >
                    {participationChoices.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {/* Дарааллын дугаар */}
                <Form.Group className="mb-3">
                  <Form.Label>Дарааллын дугаар</Form.Label>
                  <Form.Control
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleChange}
                    min="0"
                  />
                  <Form.Text className="text-muted">Бага тоо = эхэнд харагдана</Form.Text>
                </Form.Group>

                {/* Идэвхтэй эсэх */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="is_active"
                    label="Идэвхтэй"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                </Form.Group>

                {/* Зураг */}
                <Form.Group className="mb-3">
                  <Form.Label>Зураг</Form.Label>
                  {imagePreview && (
                    <div className="mb-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                  )}
                  <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                  <Form.Text className="text-muted">Зөвлөмж: 400x400px</Form.Text>
                </Form.Group>

                {/* Онцлох мэдээлэл */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Онцлох мэдээлэл</h5>
                    <Button variant="outline-primary" size="sm" onClick={handleAddAchievement}>
                      <Plus size={16} className="me-1" />
                      Нэмэх
                    </Button>
                  </div>

                  {achievements.map((achievement, index) => (
                    <Card key={index} className="mb-3 bg-light">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Badge bg="secondary">Онцлох мэдээлэл #{index + 1}</Badge>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveAchievement(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>

                        <Form.Group className="mb-2">
                          <Form.Label className="small">Icon</Form.Label>
                          <Form.Select
                            value={achievement.icon}
                            onChange={(e) => handleAchievementChange(index, 'icon', e.target.value)}
                            size="sm"
                          >
                            {iconChoices.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2">
                          <Form.Label className="small">Гарчиг</Form.Label>
                          <Form.Control
                            type="text"
                            value={achievement.title}
                            onChange={(e) => handleAchievementChange(index, 'title', e.target.value)}
                            size="sm"
                            placeholder="Амжилтын гарчиг"
                          />
                        </Form.Group>

                        <Form.Group>
                          <Form.Label className="small">Тайлбар</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={achievement.description}
                            onChange={(e) => handleAchievementChange(index, 'description', e.target.value)}
                            size="sm"
                            placeholder="Дэлгэрэнгүй тайлбар"
                          />
                        </Form.Group>
                      </Card.Body>
                    </Card>
                  ))}

                  {achievements.length === 0 && (
                    <Alert variant="info" className="small">
                      Одоогоор онцлох мэдээлэл нэмээгүй байна. "Нэмэх" товч дарж онцлох мэдээлэл нэмнэ үү.
                    </Alert>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Хадгалж байна...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="me-1" />
                        Хадгалах
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/teachers')} disabled={saving}>
                    Цуцлах
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
