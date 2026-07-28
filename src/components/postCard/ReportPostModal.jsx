// src/components/postCard/ReportPostModal.jsx

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';

export function ReportPostModal({
  show, onHide, isReporting, reportReason, setReportReason, reportDescription, setReportDescription, onSubmit,
}) {
  return (
    <Modal
      show={show}
      onHide={() => !isReporting && onHide()}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          <i className="bi bi-flag me-2"></i>
          Post report хийх
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small mb-3">
          Та энэ постыг яагаад report хийж байгаагаа сонгоно уу.
        </p>

        <div className="mb-3">
          <label htmlFor="reportReason" className="form-label fw-semibold">
            Шалтгаан
          </label>
          <select
            id="reportReason"
            className="form-select"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          >
            <option value="spam">Спам</option>
            <option value="harassment">Дарамт, доромжлол</option>
            <option value="hate_speech">Үзэн ядалт үг хэллэг</option>
            <option value="violence">Хүчирхийлэл</option>
            <option value="false_info">Худал мэдээлэл</option>
            <option value="inappropriate">Зохисгүй агуулга</option>
            <option value="other">Бусад</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="reportDescription" className="form-label fw-semibold">
            Дэлгэрэнгүй (заавал биш)
          </label>
          <textarea
            id="reportDescription"
            className="form-control"
            rows="3"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Нэмэлт мэдээлэл..."
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={isReporting}
        >
          Цуцлах
        </Button>
        <Button variant="warning" onClick={onSubmit} disabled={isReporting}>
          {isReporting ? (
            <>
              <Spinner as="span" size="sm" className="me-1" />
              Илгээж байна...
            </>
          ) : (
            <>
              <i className="bi bi-flag me-1"></i>
              Report илгээх
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
