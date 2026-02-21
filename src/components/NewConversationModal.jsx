// frontend/src/components/NewConversationModal.jsx
import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { createConversation } from '../services/conversationService';

const NewConversationModal = ({ show, onHide, onConversationCreated }) => {
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Хэрэглэгчийн нэр оруулна уу');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const conversation = await createConversation(username.trim(), title.trim());

      // Reset form
      setUsername('');
      setTitle('');

      // Notify parent
      if (onConversationCreated) {
        onConversationCreated(conversation);
      }

      // Close modal
      onHide();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.other_user_username?.[0] ||
          'Харилцан яриа үүсгэхэд алдаа гарлаа'
      );
      console.error('Error creating conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setTitle('');
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Шинэ харилцан яриа үүсгэх</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Хэрэглэгчийн нэр *</Form.Label>
            <Form.Control
              type="text"
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <Form.Text className="text-muted">Харилцах хэрэглэгчийн нэрийг оруулна уу</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Гарчиг (заавал биш)</Form.Label>
            <Form.Control
              type="text"
              placeholder="жнь: Даалгаврын тухай"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Харилцан ярианы гарчиг (сэдэв) оруулж болно
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Болих
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading || !username.trim()}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Үүсгэж байна...
            </>
          ) : (
            'Үүсгэх'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewConversationModal;
