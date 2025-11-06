// src/components/PaymentModal.jsx
// (!!!) ЦУЦЛАХ (CANCEL) ЛОГИК НЭМСЭН ХУВИЛБАР

import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axiosConfig';
import './PaymentModal.css';

function PaymentModal({ show, onClose, paymentData, localInvoiceId }) {
    const [status, setStatus] = useState('PENDING');
    const intervalRef = useRef(null);

    // Интервал цэвэрлэх туслах функц
    const cleanupInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Төлбөрийн төлөвийг шалгах функц
    const checkStatus = async () => {
        if (!localInvoiceId) return;

        try {
            const response = await apiClient.get(`/api/v1/payments/check-invoice/${localInvoiceId}/`);
            const newStatus = response.data.status;

            if (newStatus === 'PAID') {
                setStatus('PAID');
                cleanupInterval();
                setTimeout(() => { onClose(); }, 3000);
            } else if (newStatus === 'CANCELED' || newStatus === 'FAILED') {
                setStatus('FAILED');
                cleanupInterval();
            }
        } catch (error) {
            console.error("Төлөв шалгахад алдаа гарлаа:", error);
            setStatus('FAILED');
            cleanupInterval();
        }
    };

    // Модал нээгдэх үед 5 секунд тутамд шалгаж эхэлнэ
    useEffect(() => {
        if (show && localInvoiceId) {
            setStatus('PENDING');
            cleanupInterval(); // Хуучин interval-г цэвэрлэх
            checkStatus(); // Эхний шалгалт
            intervalRef.current = setInterval(checkStatus, 5000);

            return cleanupInterval; // Компонент хаагдахад цэвэрлэнэ
        } else {
            cleanupInterval(); // Модал хаагдвал цэвэрлэнэ
        }
    }, [show, localInvoiceId]);


    // (!!!) ШИНЭ ФУНКЦ: "X" ТОВЧ ДАРАГДАХАД АЖИЛЛАНА
    const handleCloseModal = async () => {
        console.log("Модал хаах үйлдэл эхэллээ...");

        // 1. Автомат шалгалтыг зогсооно
        cleanupInterval();

        // 2. Зөвхөн "PENDING" үед л цуцлах API дуудна
        if (status === 'PENDING' && localInvoiceId) {
            try {
                // Backend рүү "Энэ нэхэмжлэхийг цуцаллаа" гэж мэдэгдэнэ
                await apiClient.post('/api/v1/payments/cancel-invoice/', {
                    local_invoice_id: localInvoiceId
                });
                console.log("Нэхэмжлэх (local_invoice_id) цуцлах хүсэлт илгээлээ.");
            } catch (err) {
                console.error("Нэхэмжлэх цуцлахад алдаа гарлаа:", err);
                // Алдаа гарсан ч модалыг хаах үйлдлийг үргэлжлүүлнэ
            }
        }

        // 3. Модалыг хаах (ProductListPage-с ирсэн props-г дуудна)
        onClose();
    };


    // --- Render хэсэг ---

    if (!show || !paymentData) {
        return null;
    }

    if (!paymentData.qpay_data) {
        return ( /* ... (Алдааны хэсэг) ... */ );
    }

    const { qr_image } = paymentData.qpay_data;

    if (!qr_image) {
        return ( /* ... (Алдааны хэсэг) ... */ );
    }

    const imagePrefix = 'data:image/png;base64,';
    const qrImageSrc = qr_image.startsWith(imagePrefix)
        ? qr_image
        : imagePrefix + qr_image;

    return (
        <div className="modal-overlay">
            <div className="modal-content">

                {/* (!!!) "X" ТОВЧИНД ШИНЭ ФУНКЦ ХОЛБОСОН */}
                <button className="modal-close" onClick={handleCloseModal}>&times;</button>

                {status === 'PENDING' && (
                    <>
                        <h3>Төлбөр хийнэ үү</h3>
                        <p>Доорх QR кодыг уншуулна уу:</p>

                        <img
                            src={qrImageSrc}
                            alt="QPay QR Code"
                            className="qr-image"
                        />

                        <div className="status-waiting">
                            Төлбөрийг хүлээж байна...
                        </div>
                    </>
                )}

                {status === 'PAID' && (
                    <div className="status-success">
                        <h3>Төлбөр амжилттай</h3>
                        <p>Худалдан авалт хийсэнд баярлалаа!</p>
                    </div>
                )}

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