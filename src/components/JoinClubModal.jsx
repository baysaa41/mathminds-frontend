// src/components/JoinClubModal.jsx
// Бүртгэлийн кодоор клубт элсэх Modal (ЗАСВАРЛАСАН - axiosConfig ашиглана)

import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import apiClient from '../api/axiosConfig'; // <--- ШИНЭ IMPORT

const JoinClubModal = ({ show, onHide, onSuccess }) => {
    const [regCode, setRegCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!regCode.trim()) {
            setError('Бүртгэлийн код оруулна уу');
            return;
        }

        try {
            setLoading(true);
            console.log('📤 Joining club with code:', regCode);

            // ЗАСВАРЛАСАН: axiosConfig ашиглана
            const response = await apiClient.post('/api/clubs/join/', {
                reg_code: regCode.trim()
            });

            console.log('✅ Joined club:', response.data);

            // Success
            setRegCode('');
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('❌ Error joining club:', err);

            // Алдааны мессеж форматлах
            let errorMessage = 'Алдаа гарлаа';

            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.data?.reg_code) {
                // Field validation error
                errorMessage = Array.isArray(err.response.data.reg_code)
                    ? err.response.data.reg_code[0]
                    : err.response.data.reg_code;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRegCode('');
        setError(null);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-box-arrow-in-right text-primary me-2"></i>
                    Клубт элсэх
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted mb-4">
                    Багшаас авсан бүртгэлийн кодоо оруулж клубт элсээрэй
                </p>

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Бүртгэлийн код</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Жишээ: ABC123XYZ"
                            value={regCode}
                            onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                            disabled={loading}
                            autoFocus
                        />
                        <Form.Text className="text-muted">
                            Том жижиг үсэг ялгалгүй
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Болих
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !regCode.trim()}
                            className="flex-grow-1"
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        className="me-2"
                                    />
                                    Элсүүлж байна...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2"></i>
                                    Элсэх
                                </>
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default JoinClubModal;