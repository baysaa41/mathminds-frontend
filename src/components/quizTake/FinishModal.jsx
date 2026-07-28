// src/components/quizTake/FinishModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function FinishModal({ show, onHide, answeredCount, problemsLength, onConfirm }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-check-circle text-success me-2"></i>
          Тест дуусгах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Та тестийг дуусгахдаа итгэлтэй байна уу?</p>
        <p className="mb-0">
          <strong>Нийт хариулсан:</strong> {answeredCount} / {problemsLength}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Цуцлах
        </Button>
        <Button variant="success" onClick={onConfirm}>
          <i className="bi bi-check-circle me-2"></i>
          Тийм, дуусгах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
