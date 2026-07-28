// src/components/quizTake/PauseModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export function PauseModal({ show, onResume, onExit }) {
  return (
    <Modal show={show} onHide={onResume} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>
          <i className="bi bi-pause-circle text-warning me-2"></i>
          Тест түр зогссон
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Тест түр зогссон байна. Та хүссэн үедээ үргэлжлүүлж болно.</p>
        <Alert variant="info" className="mb-0">
          <i className="bi bi-info-circle me-2"></i>
          Түр зогсоосон хугацаа нийт хугацаанд тооцогдохгүй.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onResume}>
          <i className="bi bi-play-circle me-2"></i>
          Үргэлжлүүлэх
        </Button>
        <Button variant="outline-secondary" onClick={onExit}>
          <i className="bi bi-save me-1"></i>
          Хадгалаад гарах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
