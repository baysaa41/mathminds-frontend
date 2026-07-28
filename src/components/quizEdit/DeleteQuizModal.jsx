// src/components/quizEdit/DeleteQuizModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { Trash2 } from 'lucide-react';

export function DeleteQuizModal({ show, onHide, onConfirm, isDeleting, title }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Тест устгах</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Та <b>{title || 'энэ тестийг'}</b> устгахдаа итгэлтэй байна уу?
        <br />
        <small className="text-muted">
          Хэрэв хэн нэгэн хариулсан бол тест устгагдахгүй, зохиогч нь хасагдана.
        </small>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>Цуцлах</Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? <Spinner as="span" size="sm" className="me-2" /> : <Trash2 size={14} className="me-2" />}
          Устгах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
