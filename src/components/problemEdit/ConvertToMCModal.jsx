// src/components/problemEdit/ConvertToMCModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import { X, Wand2 } from 'lucide-react';

export function ConvertToMCModal({ show, onHide, onConfirm, title, id, hasStatement }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <Wand2 size={20} className="me-2 text-warning" />
          Сонгох тест болгох
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          AI ашиглан <b>{title || `Бодлого #${id}`}</b> бодлогыг клон хийж,{' '}
          <b>5 сонгох хариулттай (1 зөв = 2 оноо, 4 буруу = 0 оноо)</b> шинэ бодлого үүсгэнэ.
        </p>
        {!hasStatement && (
          <Alert variant="warning" className="py-2">
            Бодлогын өгүүлбэр хоосон байна. AI-д илүү мэдээлэл өгсөн тусам илүү сайн хариулт гарна.
          </Alert>
        )}
        <p className="text-muted small mb-0">
          Эх бодлого өөрчлөгдөхгүй. Шинэ бодлого үүсэн засварлах хуудас руу шилжинэ.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <X size={16} className="me-2" />
          Цуцлах
        </Button>
        <Button variant="warning" onClick={onConfirm}>
          <Wand2 size={16} className="me-2" />
          Үүсгэх
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
