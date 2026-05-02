// src/pages/ClubDetail.jsx
// ✅ ШИНЭЧИЛСЭН: Club Feed нэмэгдсэн

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Form from 'react-bootstrap/Form';
import { getClubDetail, updateClub, leaveClub, inviteTeacher, removeTeacher, removeMember, refreshRegCode, formatErrorMessage } from '../services/clubsService';
import useToast from '../hooks/useToast';
import JoinClubModal from '../components/JoinClubModal';
import { ArrowLeft, LogOut, Key, Clipboard, RefreshCw } from 'lucide-react';

const ClubDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const {
    setClubData,
    setClubActions,
    setPageTitle,
    setIsTeacherOrAdmin,
    setIsCreator,
    newTeacherUsername,
    setNewTeacherUsername,
    addingTeacher,
    setAddingTeacher
  } = useOutletContext(); // RightSidebar болон PageTitle

  const location = useLocation();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRegCodeModal, setShowRegCodeModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    monthly_price_silver: 0,
  });

  useEffect(() => {
    fetchClubDetails();
  }, [id]);

  // Дэд хуудас өөрчлөгдөх бүрт клубын нэрийг RecentlyVisitedWidget-д мэдэгдэх
  useEffect(() => {
    if (club?.name) {
      setPageTitle(club.name);
    }
  }, [location.pathname, club]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getClubDetail(id);
      console.log('Club Data:', data);
      setClub(data);
      setClubData(data); // RightSidebar-д мэдээлэл өгөх
      setPageTitle(data.name || 'Клуб'); // Navbar дээр клубын нэр харуулах

      // Check if user is teacher or admin
      const isTeacher = data.role === 'teacher';
      const isClubCreator = data.creator === user?.id;
      const isAdmin = data.admins?.some(admin => admin.id === user?.id);
      const isTeacherOrAdminValue = isTeacher || isClubCreator || isAdmin;
      setIsTeacherOrAdmin(isTeacherOrAdminValue);
      setIsCreator(isClubCreator);

      // Үйлдлийн функцүүдыг RightSidebar-т дамжуулах
      setClubActions({
        onEditClub: () => {
          setEditForm({
            name: data.name,
            description: data.description || '',
            monthly_price_silver: data.monthly_price_silver || 0,
          });
          setShowEditModal(true);
        },
        onShowRegCode: () => setShowRegCodeModal(true),
        onJoinClub: () => setShowJoinModal(true),
        onLeaveClub: () => setShowLeaveModal(true),
        onUpdate: fetchClubDetails // Refresh club data after curriculum changes
      });
    } catch (err) {
      console.error('Error fetching club details:', err);
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Cleanup: Хуудсаас гарахад RightSidebar-н clubData болон PageTitle цэвэрлэх
  useEffect(() => {
    return () => {
      setClubData(null);
      setClubActions(null);
      setIsTeacherOrAdmin(false);
      setIsCreator(false);
      setNewTeacherUsername('');
      setAddingTeacher(false);
      setPageTitle('Нүүр');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setters are stable, no need in dependency array

  const handleLeaveClub = async () => {
    try {
      await leaveClub(id);
      showToast(`"${club.name}" клубээс амжилттай гарлаа`, 'success');
      setTimeout(() => {
        navigate('/clubs');
      }, 1000);
    } catch (err) {
      console.error('Error leaving club:', err);
      showToast(formatErrorMessage(err), 'danger');
    }
  };

  const handleCopyRegCode = () => {
    if (club?.reg_code) {
      navigator.clipboard.writeText(club.reg_code);
      showToast(`Бүртгэлийн код хуулагдлаа: ${club.reg_code}`, 'success');
    }
  };

  const handleJoinSuccess = (joinedClub) => {
    fetchClubDetails(); // Клубын мэдээллийг шинэчлэх
    setShowJoinModal(false);
    showToast(`"${joinedClub.name}" клубт амжилттай элслээ!`, 'success');
  };

  const handleInviteTeacher = async (e) => {
    e.preventDefault();
    const username = newTeacherUsername || '';
    if (!username.trim()) {
      showToast('Багшийн username оруулна уу', 'danger');
      return;
    }

    try {
      setAddingTeacher(true);
      const result = await inviteTeacher(club.id, username.trim());
      showToast(result.detail || 'Багшийн урилга илгээгдлээ!', 'success');
      setNewTeacherUsername('');
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleRemoveTeacher = async (username) => {
    if (!window.confirm(`${username} багшийг хасахдаа итгэлтэй байна уу?`)) {
      return;
    }

    try {
      const result = await removeTeacher(club.id, username);
      showToast(result.detail || 'Багш амжилттай хасагдлаа', 'success');
      fetchClubDetails();
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    }
  };

  const handleRemoveMember = async (username) => {
    if (!window.confirm(`"${username}" гишүүнийг хасахдаа итгэлтэй байна уу?`)) {
      return;
    }

    try {
      const result = await removeMember(club.id, username);
      showToast(result.detail || 'Гишүүн амжилттай хасагдлаа', 'success');
      fetchClubDetails();
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    }
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showToast('Клубын нэр оруулна уу', 'danger');
      return;
    }

    // STUDY клубын үнэ шалгах
    if (club.club_type === 'STUDY' && editForm.monthly_price_silver < 0) {
      showToast('Сарын төлбөр 0-ээс бага байж болохгүй', 'danger');
      return;
    }

    try {
      await updateClub(club.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        monthly_price_silver: club.club_type === 'STUDY' ? editForm.monthly_price_silver : 0,
      });
      showToast('Клубын мэдээлэл амжилттай шинэчлэгдлээ', 'success');
      setShowEditModal(false);
      fetchClubDetails(); // Refresh club data
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    }
  };

  const handleRefreshRegCode = async () => {
    if (!window.confirm('Бүртгэлийн кодыг шинэчлэхдээ итгэлтэй байна уу? Хуучин код ажиллахгүй болно.')) {
      return;
    }

    try {
      setRefreshingCode(true);
      const result = await refreshRegCode(club.id);
      showToast(result.detail || 'Бүртгэлийн код амжилттай шинэчлэгдлээ', 'success');
      fetchClubDetails(); // Refresh club data
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    } finally {
      setRefreshingCode(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Уншиж байна...</p>
      </Container>
    );
  }

  if (error || !club) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Клуб олдсонгүй'}</Alert>
        <Button
          variant="primary"
          onClick={() => navigate('/clubs')}
        >
          Буцах
        </Button>
      </Container>
    );
  }

  const isClubCreator = club.creator === user?.id;
  const isLeaderboard = /\/assignments\/\d+\/leaderboard/.test(location.pathname);

  const outletContext = {
    clubData: club,
    clubActions: {
      onEditClub: () => {
        setEditForm({
          name: club.name,
          description: club.description || '',
          monthly_price_silver: club.monthly_price_silver || 0,
        });
        setShowEditModal(true);
      },
      onShowRegCode: () => setShowRegCodeModal(true),
      onJoinClub: () => setShowJoinModal(true),
      onLeaveClub: () => setShowLeaveModal(true),
      onUpdate: fetchClubDetails,
      onInviteTeacher: handleInviteTeacher,
      onRemoveTeacher: handleRemoveTeacher,
      onRemoveMember: handleRemoveMember,
    },
    isTeacherOrAdmin: club.role === 'teacher' || isClubCreator || club.admins?.some(admin => admin.id === user?.id),
    isCreator: isClubCreator,
    user,
    navigate,
    showToast,
    newTeacherUsername,
    setNewTeacherUsername,
    addingTeacher,
  };

  const toastEl = (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
        <Toast.Header>
          <strong className="me-auto">
            {toast.variant === 'success' ? 'Амжилттай' : 'Алдаа'}
          </strong>
        </Toast.Header>
        <Toast.Body className={toast.variant === 'success' ? 'text-white' : ''}>
          {toast.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );

  // Дүнгийн жагсаалт — бүтэн хуудас (Container-гүй)
  if (isLeaderboard) {
    return (
      <>
        {toastEl}
        <Outlet context={outletContext} />
      </>
    );
  }

  return (
    <Container className="py-4">
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === 'success' ? 'Амжилттай' : 'Алдаа'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'success' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Header - Буцах холбоос */}
      <div className="mb-4">
        <Button
          variant="link"
          onClick={() =>
            navigate('/clubs')
          }
          className="p-0 text-decoration-none"
        >
          <ArrowLeft size={16} className="me-2" />
          Буцах
        </Button>
      </div>

      {/* Child routes will render here */}
      <Outlet context={outletContext} />

      {/* Leave Club Modal */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Клубээс гарах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Та <strong>{club.name}</strong> клубээс гарахдаа итгэлтэй байна уу?
          </Alert>
          <p className="text-muted mb-0">Дахин элсэхийн тулд бүртгэлийн код шаардагдана.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
            Болих
          </Button>
          <Button variant="danger" onClick={handleLeaveClub}>
            <LogOut size={16} className="me-2" />
            Гарах
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Registration Code Modal */}
      <Modal show={showRegCodeModal} onHide={() => setShowRegCodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <Key size={20} className="text-primary me-2" />
            Бүртгэлийн код
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">Энэ кодыг сурагчиддаа өгч клубт элсүүлнэ үү</p>
          <div className="bg-light p-3 rounded text-center mb-3">
            <h3 className="h2 font-monospace text-primary mb-0">{club.reg_code}</h3>
          </div>
          <Button variant="outline-primary" className="w-100" onClick={handleCopyRegCode}>
            <Clipboard size={16} className="me-2" />
            Код хуулах
          </Button>
        </Modal.Body>
      </Modal>

      {/* Edit Club Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Клуб засах</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateClub}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Клубын нэр *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Клубын нэр"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Тайлбар</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Клубын тайлбар"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </Form.Group>
            {/* Сарын төлбөр (зөвхөн STUDY клубт) */}
            {club && club.club_type === 'STUDY' && (
              <Form.Group className="mb-3">
                <Form.Label>Сарын төлбөр (Мөнгөн зоос) *</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editForm.monthly_price_silver}
                  onChange={(e) => setEditForm({ ...editForm, monthly_price_silver: parseInt(e.target.value) || 0 })}
                />
                <Form.Text className="text-muted">
                  Сурагчид сар бүр төлөх үнэ (мөнгөн зоосоор)
                </Form.Text>
              </Form.Group>
            )}

            {/* Бүртгэлийн код шинэчлэх */}
            <div className="border-top pt-3">
              <Form.Label>Бүртгэлийн код</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <div className="bg-light p-2 rounded flex-grow-1 text-center">
                  <span className="font-monospace fw-bold">{club?.reg_code}</span>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleRefreshRegCode}
                  disabled={refreshingCode}
                >
                  {refreshingCode ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </Button>
              </div>
              <Form.Text className="text-muted">
                Код шинэчлэх товч дарж шинэ код үүсгэх
              </Form.Text>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Болих
            </Button>
            <Button variant="primary" type="submit">
              Хадгалах
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Join Club Modal */}
      <JoinClubModal
        show={showJoinModal}
        onHide={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
        club={club}
      />
    </Container>
  );
};

export default ClubDetail;
