// src/components/quizEdit/ShuffleChoicePositionsModal.jsx
// Зөв хариултын байрлал жигдлэх (staff-only) үйлдлийн анхааруулга + үр дүнгийн Modal

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Shuffle } from 'lucide-react';

export function ShuffleChoicePositionsModal({ show, onHide, onConfirm, isShuffling, result, error }) {
  return (
    <Modal show={show} onHide={isShuffling ? undefined : onHide} centered>
      <Modal.Header closeButton={!isShuffling}>
        <Modal.Title>Зөв хариултын байрлал жигдлэх</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!result && !error && (
          <>
            <p>
              Энэ үйлдэл нь тестэд багтсан <b>"Сонгох тест" (type=1)</b> бодлогуудын
              хариултын сонголтуудын байрыг өөрчилж, зөв хариултын үсэг (A, B, C, ...)
              бодлого бүрт жигд тархахаар (санамсаргүй) шинэчилнэ.
            </p>
            <Alert variant="warning" className="mb-0">
              <b>Анхаар:</b> Сонголтын байрлал өөрчлөгдсөнтэй холбоотойгоор энэ тестэд
              өмнө нь хариулсан <b>бүх сурагчийн хариулт</b> (label) мөн шинэ байрлалд
              тохируулан <b>автоматаар дахин бичигдэнэ</b>. Аль хэдийн дүгнэгдсэн оноо
              өөрчлөгдөхгүй — зөвхөн аль сонголтыг сонгосон эсэхийг заасан тэмдэглэгээ
              шинэ үсэгт шилжинэ. Энэ үйлдлийг буцаах боломжгүй тул итгэлтэй байвал
              үргэлжлүүлнэ үү.
            </Alert>
          </>
        )}

        {error && <Alert variant="danger" className="mb-0">{error}</Alert>}

        {result && (
          <Alert variant="success" className="mb-0">
            <div>Шинэчилсэн бодлого: <b>{result.shuffled_problems}</b></div>
            <div>Шинэчилсэн сурагчийн хариулт: <b>{result.answers_updated}</b></div>
            {result.skipped_problems?.length > 0 && (
              <div className="mt-2">
                Алгассан бодлого ({result.skipped_problems.length}):
                <ul className="mb-0">
                  {result.skipped_problems.map((s, i) => (
                    <li key={i}>#{s.problem_id} — {s.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {result || error ? (
          <Button variant="secondary" onClick={onHide}>Хаах</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onHide} disabled={isShuffling}>Цуцлах</Button>
            <Button variant="warning" onClick={onConfirm} disabled={isShuffling}>
              {isShuffling ? <Spinner as="span" size="sm" className="me-2" /> : <Shuffle size={14} className="me-2" />}
              Тийм, жигдлэх
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
