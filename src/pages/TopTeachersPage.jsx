// src/pages/TopTeachersPage.jsx
// Топ багш нарын танилцуулга

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Trophy, Award, Target, Edit } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';

function TeacherCard({ teacher, user, getSubjectColor, onCardClick, inactive = false }) {
  const color = getSubjectColor(teacher.subject);
  return (
    <Col sm={6} md={6} lg={4}>
      <Card
        className={`h-100 shadow-sm border-0 position-relative${inactive ? ' opacity-50' : ''}`}
        onClick={() => onCardClick(teacher)}
        style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {inactive && (
          <span
            className="position-absolute top-0 start-0 m-2 badge bg-secondary"
            style={{ zIndex: 10 }}
          >
            Идэвхгүй
          </span>
        )}
        {user?.is_staff && (
          <Button
            variant="light"
            size="sm"
            as={Link}
            to={`/teacher/${teacher.id}/edit`}
            className="position-absolute top-0 end-0 m-2"
            style={{ zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Edit size={14} />
          </Button>
        )}
        <div
          className="text-center py-3 px-3"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
            color: 'white',
            filter: inactive ? 'grayscale(60%)' : 'none',
          }}
        >
          {teacher.user_details ? (
            <div className="mb-3">
              <UserAvatar
                user={teacher.user_details}
                size={120}
                border={true}
                borderClass="border border-4 border-white shadow"
              />
            </div>
          ) : (
            <div
              className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
              style={{
                width: '120px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Trophy size={48} className="text-white" />
            </div>
          )}
          <h5 className="text-white fw-bold mb-2">{teacher.name}</h5>
          <p className="text-white opacity-75 mb-1 small">{teacher.title}</p>
          {teacher.subject_display && (
            <span className="badge bg-white text-primary small">{teacher.subject_display}</span>
          )}
        </div>
      </Card>
    </Col>
  );
}

export default function TopTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const activeTeachers = teachers.filter((t) => t.is_active);
  const inactiveTeachers = teachers.filter((t) => !t.is_active);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/users/api/teachers/');
      const data = response.data.results || response.data;
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Багш нарын мэдээлэл татахад алдаа:', error);
      setError('Багш нарын мэдээллийг татахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const getIconByName = (iconName) => {
    const icons = {
      trophy: Trophy,
      award: Award,
      target: Target,
    };
    return icons[iconName] || Award;
  };

  // Мэргэжлээс хамаарч өнгө сонгох (HEX код)
  const getSubjectColor = (subject) => {
    const colors = {
      MATH: '#1976D2', // Математик - Хөх
      PHYSICS: '#283593', // Физик - Хар хөх/Индиго
      CHEMISTRY: '#388E3C', // Хими - Ногоон
      BIOLOGY: '#7CB342', // Биологи - Ногоон-шаргал/Lime Green
      OTHER: '#6c757d', // Бусад - Саарал
    };
    return colors[subject] || '#1976D2';
  };

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Уншиж байна...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-5">
      <style>
        {`
                    .custom-teacher-modal .modal-dialog {
                        max-width: 50vw !important;
                        width: 100% !important;
                        margin: 1.75rem auto !important;
                    }
                    .custom-teacher-modal .modal-header .btn-close {
                        filter: invert(1) grayscale(100%) brightness(200%);
                        opacity: 1;
                    }
                    @media (max-width: 768px) {
                        .custom-teacher-modal .modal-dialog {
                            max-width: 90vw !important;
                        }
                    }
                `}
      </style>
      <Container>
        {/* Back button */}
        <div className="mb-4">
          <Button variant="link" as={Link} to="/" className="p-0 text-decoration-none">
            <i className="bi bi-arrow-left me-2"></i>
            Нүүр хуудас руу буцах
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold mb-3">Манай багш нар</h1>
          <p className="lead text-muted">
            Математик, физик, хими, биологийн туршлагатай, мэргэшсэн багш нар
          </p>
          {user && user.is_staff && (
            <div className="mt-3">
              <Button variant="primary" as={Link} to="/teacher/new">
                <i className="bi bi-plus-circle me-2"></i>
                Шинэ багш нэмэх
              </Button>
            </div>
          )}
        </div>

        {/* Active Teachers Grid */}
        {activeTeachers.length === 0 ? (
          <Alert variant="info" className="text-center">
            Одоогоор багш нарын мэдээлэл байхгүй байна.
          </Alert>
        ) : (
          <Row className="g-4">
            {activeTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                user={user}
                getSubjectColor={getSubjectColor}
                onCardClick={handleTeacherClick}
              />
            ))}
          </Row>
        )}

        {/* Inactive Teachers — зөвхөн staff */}
        {user?.is_staff && inactiveTeachers.length > 0 && (
          <div className="mt-5">
            <hr />
            <h5 className="text-muted mb-3">
              <i className="bi bi-eye-slash me-2"></i>
              Идэвхгүй багш нар ({inactiveTeachers.length})
              <small className="ms-2 fs-6 fw-normal">— зөвхөн admin харна</small>
            </h5>
            <Row className="g-4">
              {inactiveTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  user={user}
                  getSubjectColor={getSubjectColor}
                  onCardClick={handleTeacherClick}
                  inactive
                />
              ))}
            </Row>
          </div>
        )}

        {/* Teacher Details Modal */}
        <Modal show={showModal} onHide={handleCloseModal} centered className="custom-teacher-modal">
          <Modal.Header
            closeButton
            className="text-white border-0"
            style={{
              background: `linear-gradient(135deg, ${getSubjectColor(selectedTeacher?.subject)} 0%, ${getSubjectColor(selectedTeacher?.subject)}dd 100%)`
            }}
          >
            <Modal.Title>{selectedTeacher?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {selectedTeacher && (
              <>
                {/* Teacher Image and Title */}
                <div className="text-center mb-4">
                  {selectedTeacher.user_details ? (
                    <div className="mb-3">
                      <UserAvatar
                        user={selectedTeacher.user_details}
                        size={150}
                        border={true}
                        borderClass="border border-4 border-primary shadow"
                      />
                    </div>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                      style={{
                        width: '150px',
                        height: '150px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }}
                    >
                      <Trophy size={60} className="text-white" />
                    </div>
                  )}
                  <h5 className="fw-bold mb-1" style={{ color: getSubjectColor(selectedTeacher.subject) }}>
                    {selectedTeacher.name}
                  </h5>
                  <p className="text-muted mb-2">{selectedTeacher.title}</p>
                  <div className="d-flex gap-2 justify-content-center">
                    {selectedTeacher.subject_display && (
                      <span className="badge" style={{ backgroundColor: getSubjectColor(selectedTeacher.subject), color: 'white' }}>
                        {selectedTeacher.subject_display}
                      </span>
                    )}
                    {selectedTeacher.participation_type_display && (
                      <span className="badge bg-secondary">
                        {selectedTeacher.participation_type_display}
                      </span>
                    )}
                    {selectedTeacher.program && (
                      <span className="badge" style={{ backgroundColor: '#1565C0', color: 'white' }}>
                        {selectedTeacher.program}
                      </span>
                    )}
                  </div>
                </div>

                {/* Biography */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2" style={{ color: getSubjectColor(selectedTeacher.subject) }}>
                    Танилцуулга
                  </h6>
                  <p className="text-secondary" style={{ lineHeight: '1.8' }}>
                    {selectedTeacher.bio}
                  </p>
                </div>

                {/* Онцлох мэдээлэл */}
                {selectedTeacher.achievements && selectedTeacher.achievements.length > 0 && (
                  <div>
                    <h6 className="fw-bold mb-3" style={{ color: getSubjectColor(selectedTeacher.subject) }}>
                      Онцлох мэдээлэл
                    </h6>
                    <div className="d-flex flex-column gap-3">
                      {selectedTeacher.achievements.map((achievement, index) => {
                        const Icon = getIconByName(achievement.icon);
                        return (
                          <div key={index} className="d-flex align-items-start">
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle me-3 flex-shrink-0"
                              style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              }}
                            >
                              <Icon size={20} className="text-white" />
                            </div>
                            <div className="flex-grow-1">
                              <strong className="d-block mb-1">{achievement.title}</strong>
                              {achievement.description && (
                                <p className="text-muted mb-0 small">{achievement.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0">
            {user && user.is_staff && selectedTeacher && (
              <Button
                variant="primary"
                as={Link}
                to={`/teacher/${selectedTeacher.id}/edit`}
                className="me-auto"
              >
                <Edit size={16} className="me-1" />
                Засах
              </Button>
            )}
            <Button variant="secondary" onClick={handleCloseModal}>
              Хаах
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}
