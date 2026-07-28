// src/components/curriculumAdmin/ConfirmModal.jsx
import { Modal, Button, Spinner } from 'react-bootstrap';

export default function ConfirmModal({ show, message, onConfirm, onCancel, loading }) {
  return (
    <Modal show={show} onHide={onCancel} centered size="sm">
      <Modal.Body className="text-center p-4">
        <p className="mb-3">{message}</p>
        <Button variant="danger" onClick={onConfirm} disabled={loading} className="me-2">
          {loading ? <Spinner size="sm" /> : 'Устгах'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Болих
        </Button>
      </Modal.Body>
    </Modal>
  );
}
