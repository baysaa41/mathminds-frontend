// src/components/problemEdit/PreviewModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { MathJax } from 'better-react-mathjax';
import { X, Eye, FileText } from 'lucide-react';

export function PreviewModal({ show, onHide, title, statement }) {
  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Eye size={20} className="me-2" />
          Урьдчилж харах
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {/* Title Preview */}
        {title && (
          <div className="mb-4">
            <h2 className="h3 fw-bold">
              <FileText size={24} className="me-2 text-primary" />
              {title}
            </h2>
          </div>
        )}

        {/* Statement Preview */}
        <MathJax hideUntilTypeset={'first'}>
          <div
            className="mathjax-content"
            style={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: '1.6',
            }}
            dangerouslySetInnerHTML={{
              __html:
                statement ||
                "<span class='text-muted fst-italic'>Өгүүлбэр хоосон байна...</span>",
            }}
          />
        </MathJax>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <X size={16} className="me-2" />
          Хаах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
