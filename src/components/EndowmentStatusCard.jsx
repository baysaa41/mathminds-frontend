// src/components/EndowmentStatusCard.jsx
// "360 гишүүнчлэл"-ийн endowment (гэрээт хадгаламж) төлөвийг харуулах карт

import { useState, useEffect, useCallback } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Coins, ShieldCheck, Crown } from 'lucide-react';
import {
  getEndowmentStatus,
  requestEndowmentCancellation,
  convertEndowmentToVip,
} from '../services/membershipService';

const STATUS_LABELS = {
  ACTIVE: { label: 'Идэвхтэй', variant: 'success' },
  CANCELLATION_REQUESTED: { label: 'Цуцлах хүсэлт гаргасан', variant: 'warning' },
  REFUNDED: { label: 'Буцаагдсан', variant: 'secondary' },
  CONVERTED_PERMANENT: { label: 'Хугацаагүй хандив (VIP)', variant: 'warning' },
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('mn-MN');
}

function formatAmount(value) {
  return new Intl.NumberFormat('mn-MN').format(value) + '₮';
}

function EndowmentStatusCard() {
  const [endowment, setEndowment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEndowmentStatus();
      setEndowment(data.has_endowment ? data : null);
    } catch (err) {
      console.error('Endowment мэдээлэл татахад алдаа:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleRequestCancellation = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      await requestEndowmentCancellation();
      await fetchStatus();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Хүсэлт гаргахад алдаа гарлаа');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToVip = async () => {
    setActionError(null);
    if (!window.confirm('Та endowment-ээ бүрмөсөн хандивлаж, хугацаагүй VIP эрх авахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.')) {
      return;
    }
    setActionLoading(true);
    try {
      await convertEndowmentToVip();
      await fetchStatus();
    } catch (err) {
      setActionError(err.response?.data?.error || 'VIP болгож хөрвүүлэхэд алдаа гарлаа');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" />
        </Card.Body>
      </Card>
    );
  }

  if (!endowment) {
    return null;
  }

  const statusInfo = STATUS_LABELS[endowment.status] || { label: endowment.status, variant: 'secondary' };
  const isPermanent = endowment.status === 'CONVERTED_PERMANENT';

  return (
    <Card className="shadow-sm mb-4 border-warning">
      <Card.Header className="bg-warning bg-opacity-10 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Coins size={20} className="me-2 text-warning" />
          <strong>Миний endowment (360 гишүүнчлэл)</strong>
        </div>
        <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>
      </Card.Header>
      <Card.Body>
        {actionError && <Alert variant="danger" className="py-2">{actionError}</Alert>}

        <div className="mb-2">
          <strong>Дүн:</strong> {formatAmount(endowment.amount)}
        </div>
        {!isPermanent && (
          <div className="mb-2">
            <strong>Дуусах огноо:</strong> {formatDate(endowment.matures_at)}
            {endowment.renewed_count > 0 && (
              <span className="text-muted ms-2">({endowment.renewed_count} удаа сунгагдсан)</span>
            )}
          </div>
        )}
        <div className="mb-3 text-muted small">
          <ShieldCheck size={14} className="me-1" />
          {endowment.custody_note}
        </div>

        {endowment.status === 'ACTIVE' && endowment.can_request_cancellation && (
          <Alert variant="info" className="py-2 small mb-3">
            Цуцлах хүсэлт гаргах цонх нээгдсэн байна — одоо хүсэлт гаргавал дуусах огноон дээр 300,000₮-ээ буцааж авах боломжтой.
          </Alert>
        )}

        <div className="d-flex gap-2 flex-wrap">
          {endowment.status === 'ACTIVE' && (
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={!endowment.can_request_cancellation || actionLoading}
              onClick={handleRequestCancellation}
            >
              Цуцлах хүсэлт гаргах
            </Button>
          )}
          {(endowment.status === 'ACTIVE' || endowment.status === 'CANCELLATION_REQUESTED') && (
            <Button
              variant="warning"
              size="sm"
              disabled={actionLoading}
              onClick={handleConvertToVip}
            >
              <Crown size={14} className="me-1" />
              Бүрмөсөн хандивлаж VIP болох
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default EndowmentStatusCard;
