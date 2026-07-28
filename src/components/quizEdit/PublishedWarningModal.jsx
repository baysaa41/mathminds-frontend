// src/components/quizEdit/PublishedWarningModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

export function PublishedWarningModal({ show, onBack, onAcknowledge }) {
  return (
    <Modal show={show} onHide={() => {}} backdrop="static" keyboard={false} centered>
      <Modal.Header className="bg-warning">
        <Modal.Title>⚠️ Анхааруулга</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">Энэ тест <strong>нийтлэгдсэн</strong> байна. Засварлах нь дараах нөлөөтэй:</p>
        <ul className="mb-3">
          <li>Тестийг өмнө нь бөглөсөн хэрэглэгчдийн хариулт өөрчлөгдөж болзошгүй</li>
          <li>Статистик, үр дүн буруу харагдаж болзошгүй</li>
          <li>Идэвхтэй тест бөглөж байгаа хүмүүст асуудал үүсгэж болзошгүй</li>
        </ul>
        <Alert variant="info" className="mb-0">
          <small>Хэрэв та зөвхөн алдаа засах гэж байгаа бол үргэлжлүүлж болно.</small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onBack}>Буцах</Button>
        <Button variant="warning" onClick={onAcknowledge}>
          Ойлголоо, засварлах
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
