// src/pages/TeacherInvitationsPage.jsx
// Багшийн урилгуудыг харах, зөвшөөрөх/татгалзах хуудас

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Check, X, Mail } from 'lucide-react';
import { getMyInvitations, acceptInvitation, rejectInvitation, formatErrorMessage } from '../services/clubsService';
import useToast from '../hooks/useToast';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

const TeacherInvitationsPage = () => {
  const { setPageTitle } = useOutletContext();
  const { toast, showToast, hideToast } = useToast();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(null); // ID of invitation being processed

  useEffect(() => {
    setPageTitle('Багшийн урилгууд');
    fetchInvitations();
    return () => setPageTitle('Нүүр');
  }, [setPageTitle]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId, clubName) => {
    try {
      setProcessing(invitationId);
      const result = await acceptInvitation(invitationId);
      showToast(result.detail || `"${clubName}" клубын багш боллоо!`, 'success');
      fetchInvitations(); // Refresh list
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (invitationId, clubName) => {
    try {
      setProcessing(invitationId);
      const result = await rejectInvitation(invitationId);
      showToast(result.detail || `"${clubName}" клубын урилгыг татгалзлаа`, 'warning');
      fetchInvitations(); // Refresh list
    } catch (err) {
      showToast(formatErrorMessage(err), 'danger');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Урилгууд уншиж байна...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={fetchInvitations}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '800px' }}>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast show={toast.show} onClose={hideToast} delay={3000} autohide bg={toast.variant}>
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === 'success' ? 'Амжилттай' : toast.variant === 'warning' ? 'Анхааруулга' : 'Алдаа'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'success' || toast.variant === 'warning' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex align-items-center">
            <Mail size={20} className="me-2 text-primary" />
            <h5 className="mb-0">Багшийн урилгууд</h5>
            <Badge bg="primary" pill className="ms-auto">
              {invitations.length}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {invitations.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Mail size={48} className="mb-3 opacity-50" />
              <p className="mb-0">Одоогоор урилга байхгүй байна</p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {invitations.map((invitation) => (
                <ListGroup.Item key={invitation.id} className="px-0">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">{invitation.club.name}</h6>
                      <small className="text-muted">
                        <strong>{invitation.inviter.first_name || ''} {invitation.inviter.last_name || ''}</strong>
                        {' '}(@{invitation.inviter.username}) таныг багшаар урьж байна
                      </small>
                      <div className="mt-1">
                        <Badge bg="info" className="me-2">
                          +10 сурагч хязгаар
                        </Badge>
                        <Badge bg="secondary">
                          {new Date(invitation.created_at).toLocaleDateString('mn-MN')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAccept(invitation.id, invitation.club.name)}
                      disabled={processing === invitation.id}
                    >
                      {processing === invitation.id ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          <Check size={16} className="me-1" />
                          Зөвшөөрөх
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleReject(invitation.id, invitation.club.name)}
                      disabled={processing === invitation.id}
                    >
                      <X size={16} className="me-1" />
                      Татгалзах
                    </Button>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TeacherInvitationsPage;
