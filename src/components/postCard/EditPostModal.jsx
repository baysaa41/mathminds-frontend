// src/components/postCard/EditPostModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export function EditPostModal({ show, onHide, isEditing, editContent, setEditContent, onSubmit }) {
  return (
    <Modal show={show} onHide={() => !isEditing && onHide()} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <i className="bi bi-pencil me-2"></i>
          Пост засах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label htmlFor="editContent" className="form-label fw-semibold">
            Агуулга
          </label>
          <textarea
            id="editContent"
            className="form-control"
            rows="5"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Постын агуулгаа бичнэ үү..."
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isEditing}>
          Цуцлах
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          disabled={isEditing || !editContent.trim()}
        >
          {isEditing ? (
            <>
              <Spinner as="span" size="sm" className="me-1" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle me-1"></i>
              Хадгалах
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
