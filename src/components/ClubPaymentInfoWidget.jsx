// ClubPaymentInfoWidget.jsx
// Төлбөр ба нэвтрэх мэдээлэл виджет

import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { CreditCard, Calendar, DollarSign, Lock, Package } from 'lucide-react';
import apiClient from '../api/axiosConfig';

const ClubPaymentInfoWidget = ({ club }) => {
  const [creating, setCreating] = useState(false);
  const [productCreated, setProductCreated] = useState(false);
  const [message, setMessage] = useState('');

  if (!club) return null;

  // Only show to teachers/admins
  const isTeacher = club.role === 'teacher';

  if (!isTeacher) return null;

  // Сарын төлбөр
  const monthlyPrice = club.monthly_price_silver || 0;

  const handleCreateProduct = async () => {
    if (monthlyPrice <= 0) {
      setMessage('Эхлээд клубын сарын төлбөр тохируулна уу.');
      return;
    }

    try {
      setCreating(true);
      setMessage('');
      const response = await apiClient.post(`/api/clubs/${club.id}/create_product/`);
      setProductCreated(true);
      setMessage(response.data.detail || 'Бүтээгдэхүүн үүсгэгдлээ!');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Алдаа гарлаа.';
      setMessage(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0 fw-bold">
          <CreditCard size={16} className="me-2" />
          Төлбөрийн мэдээлэл
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          <ListGroup.Item className="py-2 px-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <DollarSign size={12} className="me-1" />
                Сарын төлбөр
              </small>
              <small className="fw-semibold">
                {monthlyPrice > 0 ? `${monthlyPrice} ⚪` : 'Үнэгүй'}
              </small>
            </div>
          </ListGroup.Item>
          <ListGroup.Item className="py-2 px-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <Lock size={12} className="me-1" />
                Клубын төрөл
              </small>
              <Badge bg="success" pill>
                Суралцах
              </Badge>
            </div>
          </ListGroup.Item>
          <ListGroup.Item className="py-2 px-3">
            <small className="text-muted">
              Сурагчид клубт элсэхийн тулд {monthlyPrice > 0 ? `сар бүр ${monthlyPrice} мөнгөн зоос` : 'үнэгүй'} төлнө.
            </small>
          </ListGroup.Item>
        </ListGroup>
      </Card.Body>
      {/* Бүтээгдэхүүн үүсгэх товч */}
      {monthlyPrice > 0 && (
        <Card.Footer className="bg-white border-top p-3">
          {message && (
            <div className={`small mb-2 ${productCreated ? 'text-success' : 'text-danger'}`}>
              {message}
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            className="w-100"
            onClick={handleCreateProduct}
            disabled={creating || productCreated}
          >
            {creating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Үүсгэж байна...
              </>
            ) : productCreated ? (
              <>
                <Package size={14} className="me-2" />
                Бүтээгдэхүүн үүсгэгдсэн
              </>
            ) : (
              <>
                <Package size={14} className="me-2" />
                Клубын эрхийн бүтээгдэхүүн үүсгэх
              </>
            )}
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default ClubPaymentInfoWidget;
