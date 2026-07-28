// src/components/problemEdit/DeleteProblemModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { X, Trash2 } from 'lucide-react';

export function DeleteProblemModal({ show, onHide, onConfirm, title, id }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <Trash2 size={20} className="me-2 text-danger" />
          Устгахыг баталгаажуулах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Та "<b>{title || `Бодлого #${id}`}</b>"-г устгахдаа итгэлтэй байна уу? Энэ
        үйлдлийг буцаах боломжгүй.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <X size={16} className="me-2" />
          Цуцлах
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          <Trash2 size={16} className="me-2" />
          Устгах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
