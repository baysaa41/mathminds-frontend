// src/components/PaymentModal.jsx
// (!!!) QR КОДНЫ УГТВАРЫГ ЗАСВАРЛАСАН БҮРЭН ХУВИЛБАР

import React, { useState, useEffect, useRef } from 'react';
// (!!!) Таны axiosConfig.js-г ашиглана
import apiClient from '../api/axiosConfig'; // Байршлыг зөв заагаарай
import './PaymentModal.css';

function PaymentModal({ show, onClose, paymentData, localInvoiceId }) {
    const [status, setStatus] = useState('PENDING'); // PENDING, PAID, FAILED
    const intervalRef = useRef(null); // Interval-г хадгалах

    // Төлбөрийн төлөвийг шалгах функц
    const checkStatus = async () => {
        if (!localInvoiceId) return;

        try {
            // (!!!) apiClient-г ашиглан auth token-той шалгана
            const response = await apiClient.get(`/api/v1/payments/check-invoice/${localInvoiceId}/`);
            const newStatus = response.data.status;

            if (newStatus === 'PAID') {
                setStatus('PAID');
                clearInterval(intervalRef.current); // Төлөгдсөн бол шалгахаа зогсооно

                setTimeout(() => {
                    onClose(); // 3 секундын дараа модалыг автоматаар хаана
                }, 3000);

            } else if (newStatus === 'CANCELED' || newStatus === 'FAILED') {
                setStatus('FAILED');
                clearInterval(intervalRef.current); // Алдаатай бол зогсооно
            }
            // PENDING бол юу ч хийлгүй дараагийн шалгалтыг хүлээнэ

        } catch (error) {
            console.error("Төлөв шалгахад алдаа гарлаа:", error);
            setStatus('FAILED');
            clearInterval(intervalRef.current);
        }
    };

    // Модал нээгдэх үед 5 секунд тутамд шалгаж эхэлнэ
    useEffect(() => {
        // Interval цэвэрлэх функц
        const cleanupInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        if (show && localInvoiceId) {
            // Модал нээгдэхэд PENDING төлөвт оруулна
            setStatus('PENDING');

            // Өмнөх interval-г цэвэрлэнэ (давхардахаас сэргийлж)
            cleanupInterval();

            // Эхний шалгалтыг шууд хийнэ
            checkStatus();

            // 5 секунд тутамд давтан шалгана
            intervalRef.current = setInterval(checkStatus, 5000);

            // Компонент хаагдахад (unmount) interval-г цэвэрлэнэ
            return cleanupInterval;
        } else {
            // Модал хаагдвал interval-г зогсооно
            cleanupInterval();
        }
    }, [show, localInvoiceId]); // show эсвэл localInvoiceId өөрчлөгдвөл дахин ажиллана


    // --- Render хэсэг ---

    if (!show || !paymentData) {
        return null;
    }

    // 1. qpay_data байгаа эсэхийг шалгах
    if (!paymentData.qpay_data) {
        console.error("PaymentModal: 'qpay_data' олдсонгүй!");
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="status-failed">
                        <h3>Алдаа гарлаа</h3>
                        <p>Нэхэмжлэхийн мэдээлэл олдсонгүй.</p>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. qpay_data-г задлах
    const { qr_image, urls } = paymentData.qpay_data;

    // 3. qr_image ирсэн эсэхийг шалгах
    if (!qr_image) {
        console.error("PaymentModal: 'qr_image' олдсонгүй!");
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="status-failed">
                        <h3>Алдаа гарлаа</h3>
                        <p>Нэхэмжлэхийн QR код авч чадсангүй.</p>
                        <button className="modal-close" onClick={onClose}>&times;</button>
                    </div>
                </div>
            </div>
        );
    }

    // (!!!) 4. QR ЗУРГИЙГ УГТВАРТАЙ НЬ НИЙЛҮҮЛЭХ
    const imagePrefix = 'data:image/png;base64,';

    // qr_image нь зөв угтвартай эхэлж байна уу?
    const qrImageSrc = qr_image.startsWith(imagePrefix)
        ? qr_image // Хэрэв тийм бол шууд ашиглана
        : imagePrefix + qr_image; // Байхгүй бол угтварыг гараар нэмж өгнө

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>

                {status === 'PENDING' && (
                    <>
                        <h3>Төлбөр хийнэ үү</h3>
                        <p>Доорх QR кодыг уншуулна уу:</p>

                        {/* (!!!) ЗАСВАРЛАСАН <img> ТАГ */}
                        <img
                            src={qrImageSrc} // Энд засварласан хувьсагчийг ашиглана
                            alt="QPay QR Code"
                            className="qr-image"
                        />

                        <h4>Эсвэл банкны апп-аар нэвтэрнэ үү:</h4>
                        <div className="bank-links">
                            {/* Банкны жагсаалт байвал харуулна */}
                            {urls && urls.length > 0 ? (
                                urls.map((bank, index) => (
                                    <a key={index} href={bank.link} target="_blank" rel="noopener noreferrer" className="bank-link">
                                        <img src={bank.logo} alt={bank.name} />
                                        <span>{bank.description}</span>
                                    </a>
                                ))
                            ) : (
                                <p>Банкны холбоос олдсонгүй.</p>
                            )}
                        </div>
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