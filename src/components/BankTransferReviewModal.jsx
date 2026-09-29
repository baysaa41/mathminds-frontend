// src/components/BankTransferReviewModal.jsx
// Админ: дансаар шилжүүлсэн төлбөрийг банкны хуулгатай тулгаж батлах / татгалзах

import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert, Spinner, Table, Form } from 'react-bootstrap';
import { apiErrorText, fmtDate, getBankTransfer, reviewBankTransfer } from '../services/olympiadService';

function BankTransferReviewModal({ transferId, onClose, onDone }) {
  const [t, setT] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!transferId) return;
    setT(null); setReason(''); setError(null);
    getBankTransfer(transferId).then(setT).catch((e) => setError(apiErrorText(e.response?.data)));
  }, [transferId]);

  const review = async (action) => {
    if (action === 'reject' && !reason.trim()) {
      setError('Татгалзах шалтгааныг бичнэ үү (төлөгчид харагдана).');
      return;
    }
    setBusy(true); setError(null);
    try {
      await reviewBankTransfer(transferId, action, reason.trim());
      onDone();
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  const isPdf = t?.receipt_url && /\.pdf($|\?)/i.test(t.receipt_url);
  return (
    <Modal show={!!transferId} onHide={onClose} size="lg">
      <Modal.Header closeButton><Modal.Title>Дансаар шилжүүлэг шалгах</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {!t && !error && <div className="text-center py-4"><Spinner animation="border" /></div>}
        {t && (
          <>
            <Table size="sm">
              <tbody>
                <tr><td className="text-muted">Гүйлгээний утга</td><td className="fw-bold">{t.description || t.reference}</td></tr>
                <tr><td className="text-muted">Дүн</td><td className="fw-bold">{Number(t.amount).toLocaleString()}₮</td></tr>
                <tr><td className="text-muted">Төлөгч</td><td>{t.payer_name || '-'}</td></tr>
                <tr><td className="text-muted">Төлөв</td><td>{t.status_label}{t.submitted_at && ` · ${fmtDate(t.submitted_at)}`}</td></tr>
                <tr><td className="text-muted">Бүртгэлүүд</td><td>{t.registrations.map((r) => r.full_name).join(', ')}</td></tr>
                {t.note && <tr><td className="text-muted">Тэмдэглэл</td><td>{t.note}</td></tr>}
              </tbody>
            </Table>
            {t.receipt_url ? (
              isPdf
                ? <a href={t.receipt_url} target="_blank" rel="noreferrer">Баримт (PDF) нээх</a>
                : <a href={t.receipt_url} target="_blank" rel="noreferrer"><img src={t.receipt_url} alt="Гүйлгээний баримт" className="img-fluid border rounded" style={{ maxHeight: 420 }} /></a>
            ) : <div className="small text-muted">Баримт хавсаргаагүй — банкны хуулгаас гүйлгээний утгаар шалгана уу.</div>}
            {t.status !== 'CONFIRMED' && (
              <Form.Group className="mt-3">
                <Form.Label className="small mb-0">Татгалзах шалтгаан (татгалзах үед заавал)</Form.Label>
                <Form.Control size="sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Жишээ: Гүйлгээ олдсонгүй, дүн дутуу" />
              </Form.Group>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {t && t.status !== 'CONFIRMED' && (<>
          <Button variant="outline-danger" disabled={busy} onClick={() => review('reject')}>Татгалзах</Button>
          <Button variant="success" disabled={busy} onClick={() => review('confirm')}>
            {busy ? <Spinner size="sm" animation="border" /> : 'Төлбөр орсон — батлах'}
          </Button>
        </>)}
        <Button variant="outline-secondary" onClick={onClose}>Хаах</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default BankTransferReviewModal;
