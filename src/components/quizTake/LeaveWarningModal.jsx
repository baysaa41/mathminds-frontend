// src/components/quizTake/LeaveWarningModal.jsx
// Back товч дарахад гарах анхааруулга

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export function LeaveWarningModal({
  show, onHide, isSavingLeave, onSaveAndExit, onExitWithoutSaving,
}) {
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>
          <i className="bi bi-exclamation-triangle text-warning me-2"></i>
          Тестээс гарах уу?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Та тестийг дуусгаагүй байна. Явцыг хадгалаад гарах уу?</p>
        <p className="text-muted small mb-0">
          Хадгалсан тохиолдолд дараа үргэлжлүүлж болно.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          disabled={isSavingLeave}
          onClick={onSaveAndExit}
        >
          {isSavingLeave
            ? <><Spinner as="span" size="sm" className="me-1" />Хадгалж байна...</>
            : <><i className="bi bi-save me-1" />Хадгалаад гарах</>
          }
        </Button>
        <Button
          variant="outline-danger"
          disabled={isSavingLeave}
          onClick={onExitWithoutSaving}
        >
          Хадгалахгүй гарах
        </Button>
        <Button
          variant="outline-secondary"
          disabled={isSavingLeave}
          onClick={onHide}
        >
          Цуцлах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
