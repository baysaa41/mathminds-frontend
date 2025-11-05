import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './PaymentModal.css'; // (Энгийн CSS доор бий)

function PaymentModal({ show, onClose, paymentData, localInvoiceId }) {
    const [status, setStatus] = useState('PENDING'); // PENDING, PAID, FAILED
    const intervalRef = useRef(null); // Interval-г хадгалах

    // Төлбөрийн төлөвийг шалгах функц
    const checkStatus = async () => {
        if (!localInvoiceId) return;

        try {
            const response = await axios.get(`/api/v1/payments/check-invoice/${localInvoiceId}/`);
            const newStatus = response.data.status;

            if (newStatus === 'PAID') {
                setStatus('PAID');
                clearInterval(intervalRef.current); // Төлөгдсөн бол шалгахаа зогсооно

                // 3 секундын дараа модалыг автоматаар хаана
                setTimeout(() => {
                    onClose();
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
        if (show && localInvoiceId) {
            // Модал нээгдэхэд PENDING төлөвт оруулна
            setStatus('PENDING');

            // Эхний шалгалтыг шууд хийнэ
            checkStatus();

            // 5 секунд тутамд давтан шалгана
            intervalRef.current = setInterval(checkStatus, 5000);

            // Компонент хаагдахад (unmount) interval-г цэвэрлэнэ
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [show, localInvoiceId]); // show эсвэл localInvoiceId өөрчлөгдвөл дахин ажиллана

    if (!show || !paymentData) {
        return null;
    }

    const { qr_image, urls } = paymentData.qpay_data;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>

                {status === 'PENDING' && (
                    <>
                        <h3>Төлбөр хийнэ үү</h3>
                        <p>Доорх QR кодыг уншуулна уу:</p>
                        <img src={qr_image} alt="QPay QR Code" className="qr-image" />

                        <h4>Эсвэл банкны апп-аар нэвтэрнэ үү:</h4>
                        <div className="bank-links">
                            {urls.map((bank, index) => (
                                <a key={index} href={bank.link} target="_blank" rel="noopener noreferrer" className="bank-link">
                                    <img src={bank.logo} alt={bank.name} />
                                    <span>{bank.description}</span>
                                </a>
                            ))}
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