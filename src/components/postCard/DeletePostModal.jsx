// src/components/postCard/DeletePostModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export function DeletePostModal({ show, onHide, isDeleting, onConfirm, title, contentType, isRepost }) {
  return (
    <Modal show={show} onHide={() => !isDeleting && onHide()} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Та энэ {contentType === 'reply' ? 'сэтгэгдлийг' : isRepost ? 'repost-г' : 'постыг'}{' '}
        устгахдаа итгэлтэй байна уу?
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={isDeleting}
        >
          Болих
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? (
            <Spinner as="span" size="sm" className="me-1" />
          ) : (
            <i className="bi bi-trash me-1"></i>
          )}
          Устгах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
