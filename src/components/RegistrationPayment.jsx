// src/components/RegistrationPayment.jsx
// Олимпиадын бүртгэлийн төлбөр: QPay эсвэл дансаар шилжүүлэх.
// request = { ids: [бүртгэлийн id], amount, bankAvailable, transferId? } — null бол хаалттай.
// transferId өгвөл (өмнө эхлүүлсэн шилжүүлэг) шууд дансны алхам руу орно.

import React, { useEffect, useState } from 'react';
import { Modal, Button, Alert, Spinner, Form, Table } from 'react-bootstrap';
import PaymentModal from './PaymentModal';
import {
  apiErrorText, createBankTransfer, getBankTransfer, payRegistration, payRegistrationsBulk, submitBankTransfer,
} from '../services/olympiadService';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* clipboard эрхгүй */ }
  };
  return (
    <tr>
      <td className="text-muted">{label}</td>
      <td className="fw-semibold">{value}</td>
      <td className="text-end">
        <Button size="sm" variant="outline-secondary" onClick={copy}>{copied ? 'Хуулсан' : 'Хуулах'}</Button>
      </td>
    </tr>
  );
}

function RegistrationPayment({ request, onClose, onChanged }) {
  const [step, setStep] = useState('choose');  // choose | bank | done
  const [qpay, setQpay] = useState(null);
  const [transfer, setTransfer] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!request) return;
    setError(null); setReceipt(null); setNote(''); setTransfer(null);
    if (request.transferId) {
      setStep('bank');
      getBankTransfer(request.transferId).then(setTransfer).catch((e) => setError(apiErrorText(e.response?.data)));
    } else {
      setStep(request.bankAvailable ? 'choose' : 'qpay-start');
    }
  }, [request]);

  const startQPay = async () => {
    setBusy(true); setError(null);
    try {
      const ids = request.ids;
      const data = ids.length === 1 ? await payRegistration(ids[0]) : await payRegistrationsBulk(ids);
      setQpay({ ...data, amount: Number(data.amount ?? request.amount) });
      setStep('qpay');
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'QPay нэхэмжлэх үүсгэхэд алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  // Банк сонгоогүй (данс тохируулаагүй) бол шууд QPay
  useEffect(() => { if (request && step === 'qpay-start') startQPay(); }, [step]);  // eslint-disable-line react-hooks/exhaustive-deps

  const startBank = async () => {
    setBusy(true); setError(null);
    try {
      setTransfer(await createBankTransfer(request.ids));
      setStep('bank');
      onChanged?.();
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      setTransfer(await submitBankTransfer(transfer.id, { receipt, note }));
      setStep('done');
      onChanged?.();
    } catch (err) {
      setError(apiErrorText(err.response?.data, 'Илгээхэд алдаа гарлаа'));
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setQpay(null); setStep('choose'); onClose(); };

  if (!request) return null;
  if (step === 'qpay' && qpay) {
    return (
      <PaymentModal
        show
        paymentData={qpay}
        localInvoiceId={qpay.local_invoice_id}
        amount={qpay.amount}
        title="Бүртгэлийн хураамж төлөх"
        successMessage="Төлбөр амжилттай төлөгдлөө, бүртгэл баталгаажлаа."
        onClose={() => { close(); onChanged?.(); }}
      />
    );
  }

  const amount = Number(transfer?.amount ?? request.amount ?? 0);
  return (
    <Modal show onHide={close} centered size={step === 'bank' ? 'lg' : undefined}>
      <Modal.Header closeButton>
        <Modal.Title>Бүртгэлийн хураамж {amount ? `· ${amount.toLocaleString()}₮` : ''}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {(step === 'choose' || step === 'qpay-start') && (
          <div className="d-grid gap-2">
            {step === 'qpay-start' && busy && <div className="text-center py-3"><Spinner animation="border" /></div>}
            {step === 'choose' && (<>
              <Button size="lg" onClick={startQPay} disabled={busy}>QPay-ээр төлөх (QR, банкны апп)</Button>
              <Button size="lg" variant="outline-primary" onClick={startBank} disabled={busy}>Дансаар шилжүүлэх</Button>
              <div className="small text-muted">
                Дансаар шилжүүлбэл админ шалгаж баталгаажуулсны дараа бүртгэл баталгаажна (ажлын цагаар).
              </div>
            </>)}
          </div>
        )}
        {step === 'bank' && !transfer && !error && <div className="text-center py-3"><Spinner animation="border" /></div>}
        {step === 'bank' && transfer && (
          <>
            {transfer.status === 'REJECTED' && (
              <Alert variant="warning" className="small">
                Өмнөх шилжүүлгийг баталгаажуулаагүй: {transfer.note || 'шалтгаан заагаагүй'}. Шалгаад дахин илгээнэ үү.
              </Alert>
            )}
            <p className="small mb-2">Доорх данс руу шилжүүлж, <strong>гүйлгээний утгад</strong> заасан кодыг заавал бичнэ үү.</p>
            <Table size="sm" className="align-middle">
              <tbody>
                <CopyRow label="Банк" value={transfer.bank.name || '-'} />
                <CopyRow label="Дансны дугаар" value={transfer.bank.account} />
                <CopyRow label="Хүлээн авагч" value={transfer.bank.holder || '-'} />
                <CopyRow label="Дүн" value={`${Number(transfer.amount).toLocaleString()}₮`} />
                <CopyRow label="Гүйлгээний утга" value={transfer.reference} />
              </tbody>
            </Table>
            {transfer.registrations.length > 1 && (
              <div className="small text-muted mb-2">
                {transfer.registrations.length} бүртгэл: {transfer.registrations.map((r) => r.full_name).join(', ')}
              </div>
            )}
            <Form.Group className="mb-2">
              <Form.Label className="small mb-0">Гүйлгээний баримт (зураг эсвэл PDF, заавал биш)</Form.Label>
              <Form.Control type="file" accept="image/*,application/pdf" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small mb-0">Тайлбар (заавал биш)</Form.Label>
              <Form.Control size="sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Жишээ: Хаан банкаар, 10/01 шилжүүлсэн" />
            </Form.Group>
          </>
        )}
        {step === 'done' && (
          <Alert variant="success" className="mb-0">
            Баярлалаа! Шилжүүлгийг ({transfer?.reference}) админ шалгаад бүртгэлийг баталгаажуулна. Баталгаажмагц имэйлээр мэдэгдэнэ.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        {step === 'bank' && transfer && (
          <Button onClick={submit} disabled={busy}>{busy ? <Spinner size="sm" animation="border" /> : 'Шилжүүлсэн'}</Button>
        )}
        <Button variant="outline-secondary" onClick={close}>Хаах</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RegistrationPayment;
