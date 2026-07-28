// src/components/quizTake/TimeLimitModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export function TimeLimitModal({ show, defaultTimeLimit, onContinue, onFinish }) {
  return (
    <Modal show={show} onHide={() => {}} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>
          <i className="bi bi-hourglass-bottom text-danger me-2"></i>
          Хугацаа дууслаа!
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Тестийн хугацаа ({defaultTimeLimit} минут) дууссан байна.
        </Alert>
        <p className="mb-0">Та тестийг дуусгах уу эсвэл үргэлжлүүлэх үү?</p>
        <p className="text-muted small">
          <strong>Санамж:</strong> Үргэлжлүүлсэн ч дүн дээр нөлөөлнө.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onContinue}>
          <i className="bi bi-play-circle me-2"></i>
          Үргэлжлүүлэх
        </Button>
        <Button variant="danger" onClick={onFinish}>
          <i className="bi bi-check-circle me-2"></i>
          Тестийг дуусгах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
