// src/components/postCard/AIHelpModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import LivePreview from '../LivePreview';

export function AIHelpModal({
  show, onHide, aiLoading, aiError, aiResponse, isSavingReply, onSaveReply,
}) {
  return (
    <Modal
      show={show}
      onHide={() => !aiLoading && !isSavingReply && onHide()}
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <i className="bi bi-stars me-2 text-warning"></i>
          AI тусламж
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {aiLoading && (
          <div className="text-center py-4">
            <Spinner animation="border" variant="warning" className="mb-3" />
            <p className="text-muted small mb-0">AI дүгнэж байна...</p>
          </div>
        )}
        {!aiLoading && aiError && (
          <div className="alert alert-danger small mb-0">{aiError}</div>
        )}
        {!aiLoading && aiResponse && (
          <LivePreview content={aiResponse} />
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          size="sm"
          onClick={onHide}
          disabled={isSavingReply}
        >
          Хаах
        </Button>
        {aiResponse && !aiLoading && (
          <Button
            variant="primary"
            size="sm"
            disabled={isSavingReply}
            onClick={onSaveReply}
          >
            {isSavingReply ? (
              <>
                <Spinner as="span" size="sm" className="me-1" />
                Хадгалж байна...
              </>
            ) : (
              <>
                <i className="bi bi-chat-left-text me-1"></i>
                Хариулт болгон хадгалах
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
