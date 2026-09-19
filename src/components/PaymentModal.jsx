// src/components/PaymentModal.jsx
// (!!!) АЛДААГ ЗАСВАРЛАСАН БҮРЭН ХУВИЛБАР

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig'; // Таны тохируулсан apiClient
import './PaymentModal.css'; // Таны илгээсэн CSS файл

function PaymentModal({ show, onClose, paymentData, localInvoiceId, amount, title, successMessage }) {
  const [status, setStatus] = useState('PENDING'); // PENDING, PAID, FAILED
  const intervalRef = useRef(null); // Автомат шалгалтын interval-г хадгалах

  // Интервал цэвэрлэх туслах функц
  const cleanupInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Төлбөрийн төлөвийг шалгах (Polling) функц
  const checkStatus = async () => {
    if (!localInvoiceId) {
      console.warn('checkStatus: localInvoiceId байхгүй тул шалгах боломжгүй.');
      return;
    }

    try {
      // Django-ийн Hybrid API-г дуудна
      const response = await apiClient.get(`/api/v1/payments/check-invoice/${localInvoiceId}/`);
      const newStatus = response.data.status;

      if (newStatus === 'PAID') {
        console.log('Төлөв шалгалт: PAID (Төлөгдсөн)');
        setStatus('PAID');
        cleanupInterval();
        // 3 секундын дараа модалыг автоматаар хаана
        setTimeout(() => {
          onClose();
        }, 3000);
      } else if (newStatus === 'CANCELED' || newStatus === 'FAILED') {
        console.log('Төлөв шалгалт: CANCELED/FAILED (Цуцлагдсан/Алдаатай)');
        setStatus('FAILED');
        cleanupInterval();
      } else {
        // 'PENDING' хэвээрээ бол юу ч хийлгүй, дараагийн interval-г хүлээнэ
        console.log('Төлөв шалгалт: PENDING (Хүлээгдэж байна)');
      }
    } catch (error) {
      console.error('Төлөв шалгахад алдаа гарлаа:', error);
      setStatus('FAILED');
      cleanupInterval();
    }
  };

  // Модал нээгдэх үед 5 секунд тутамд шалгаж эхэлнэ
  useEffect(() => {
    if (show && localInvoiceId) {
      console.log('Модал нээгдлээ. Автомат шалгалтыг эхлүүлж байна...');
      setStatus('PENDING');
      cleanupInterval(); // Хуучин interval-г цэвэрлэх (давхардахаас сэргийлж)

      checkStatus(); // Эхний шалгалтыг нэн даруй хийнэ

      // 5 секунд тутамд давтан шалгана
      intervalRef.current = setInterval(checkStatus, 5000);

      // Компонент хаагдахад (unmount) цэвэрлэгээ хийнэ
      return cleanupInterval;
    } else {
      // Модал хаагдвал (show = false) цэвэрлэгээ хийнэ
      cleanupInterval();
    }
  }, [show, localInvoiceId]);

  // "X" ТОВЧ ДАРАГДАХАД АЖИЛЛАХ ФУНКЦ
  const handleCloseModal = async () => {
    console.log('Модал хаах товч дарагдлаа...');

    // 1. Автомат шалгалтыг нэн даруй зогсооно
    cleanupInterval();

    // 2. Зөвхөн "PENDING" үед л цуцлах API дуудна
    if (status === 'PENDING' && localInvoiceId) {
      try {
        console.log(`Нэхэмжлэх (${localInvoiceId}) цуцлах хүсэлт илгээж байна...`);
        await apiClient.post('/api/v1/payments/cancel-invoice/', {
          local_invoice_id: localInvoiceId,
        });
        console.log('Нэхэмжлэх цуцлах хүсэлт амжилттай.');
      } catch (err) {
        console.error('Нэхэмжлэх цуцлахад алдаа гарлаа:', err);
      }
    }

    // 3. Модалыг хаах
    onClose();
  };

  // --- Render (Дүрслэх) хэсэг ---

  if (!show || !paymentData) {
    return null;
  }

  // (!!!) АЛДААГ ЗАСВАРЛАСАН ХЭСЭГ 1
  // 1. qpay_data байгаа эсэхийг шалгах
  if (!paymentData.qpay_data) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={handleCloseModal}>
            &times;
          </button>
          <div className="status-failed">
            <h3>Алдаа гарлаа</h3>
            <p>Нэхэмжлэхийн мэдээлэл олдсонгүй.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. qpay_data-г задлах
  const { qr_image } = paymentData.qpay_data;

  // (!!!) АЛДААГ ЗАСВАРЛАСАН ХЭСЭГ 2
  // 3. qr_image ирсэн эсэхийг шалгах
  if (!qr_image) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="modal-close" onClick={handleCloseModal}>
            &times;
          </button>
          <div className="status-failed">
            <h3>Алдаа гарлаа</h3>
            <p>Нэхэмжлэхийн QR код авч чадсангүй.</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. QR ЗУРГИЙГ УГТВАРТАЙ НЬ НИЙЛҮҮЛЭХ
  const imagePrefix = 'data:image/png;base64,';
  const qrImageSrc = qr_image.startsWith(imagePrefix) ? qr_image : imagePrefix + qr_image;

  // Үндсэн модал
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={handleCloseModal}>
          &times;
        </button>

        {/* 1-р Төлөв: Төлбөр хүлээж байх */}
        {status === 'PENDING' && (
          <>
            <h3>{title || 'Төлбөр хийнэ үү'}</h3>
            {amount != null && (
              <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0' }}>
                Төлөх дүн: {Number(amount).toLocaleString()}₮
              </p>
            )}
            <p>Доорх QR кодыг уншуулна уу:</p>

            <img src={qrImageSrc} alt="QPay QR Code" className="qr-image" />

            <div className="status-waiting">Төлбөрийг хүлээж байна...</div>
          </>
        )}

        {/* 2-р Төлөв: Төлбөр амжилттай */}
        {status === 'PAID' && (
          <div className="status-success">
            <h3>Төлбөр амжилттай</h3>
            <p>{successMessage || 'Худалдан авалт хийсэнд баярлалаа!'}</p>
          </div>
        )}

        {/* 3-р Төлөв: Алдаатай / Цуцлагдсан */}
        {status === 'FAILED' && (
          <div className="status-failed">
            <h3>Алдаа гарлаа</h3>
            <p>Төлбөр амжилтгүй боллоо эсвэл цуцлагдлаа.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
