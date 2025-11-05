// src/pages/ProductListPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// PaymentModal компонентоо ../components/ хавтаснаас дуудна гэж тооцоолов
import PaymentModal from '../components/PaymentModal.jsx';
// Энэ хуудасны CSS-г import хийх
import './ProductListPage.css';

function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Нэхэмжлэх үүсгэх үеийн loading
    const [pageLoading, setPageLoading] = useState(true); // Хуудас ачаалах loading

    // Модалын төлөв
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [localInvoiceId, setLocalInvoiceId] = useState(null);

    // 1. Бүтээгдэхүүнийг дуудах
    useEffect(() => {
        const fetchProducts = async () => {
            setPageLoading(true);
            try {
                // Django-ийн /api/v1/products/ API-г дуудна
                const response = await axios.get('/api/v1/products/');
                setProducts(response.data);
            } catch (error) {
                console.error("Бүтээгдэхүүн дуудахад алдаа гарлаа:", error);
                // Энд хэрэглэгчид алдааны мэдээлэл харуулж болно
            }
            setPageLoading(false);
        };
        fetchProducts();
    }, []); // Анх хуудас ачаалахад нэг удаа ажиллана

    // 2. "Худалдаж авах" товч дарагдах үйлдэл
    const handleBuyClick = async (productId) => {
        setIsLoading(true);
        try {
            // Django-ийн /api/v1/payments/create-invoice/ API-г дуудна
            // Энэ API нь IsAuthenticated тул хэрэглэгч нэвтэрсэн байх ёстой
            const response = await axios.post('/api/v1/payments/create-invoice/', {
                product_id: productId
            });

            // Django-оос буцаж ирсэн дата
            const { qpay_data, local_invoice_id } = response.data;

            setModalData(response.data); // (qr_image, urls агуулсан)
            setLocalInvoiceId(local_invoice_id); // (шалгах ID)
            setShowModal(true); // Модалыг нээнэ

        } catch (error) {
            console.error("Нэхэмжлэх үүсгэхэд алдаа гарлаа:", error);

            // Хэрэглэгчид алдааг ойлгомжтой харуулах
            if (error.response?.status === 401) {
                alert("Нэхэмжлэх үүсгэхийн тулд эхлээд нэвтэрнэ үү!");
                // Энд нэвтрэх хуудас руу үсэргэх (react-router ашиглан) логик хийж болно
            } else {
                alert("Алдаа гарлаа: " + error.response?.data?.error);
            }
        }
        setIsLoading(false);
    };

    // Хуудас ачааллаж байвал...
    if (pageLoading) {
        return <div className="loading-container">Бүтээгдэхүүн ачааллаж байна...</div>;
    }

    return (
        <div className="product-list-page">
            <h1>Манай бүтээгдэхүүнүүд</h1>
            <div className="product-list">
                {products.length === 0 ? (
                    <p>Одоогоор бүтээгдэхүүн алга.</p>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="product-card">
                            <img
                                // Django MEDIA_URL-г зөв тохируулсан бол зураг ингэж харагдана
                                src={product.image ? `http://127.0.0.1:8000${product.image}` : 'https://via.placeholder.com/300'}
                                alt={product.name}
                                className="product-image"
                            />
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p>{product.description || "Бүтээгдэхүүний дэлгэрэнгүй тайлбар."}</p>
                                <div className="product-price">{product.price} ₮</div>
                                <button
                                    onClick={() => handleBuyClick(product.id)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Хүлээгээрэй...' : 'Худалдаж авах'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Модал компонент энд дуудагдана.
              Шаардлагатай бүх мэдээллийг props-р дамжуулна.
            */}
            <PaymentModal
                show={showModal}
                onClose={() => setShowModal(false)}
                paymentData={modalData}
                localInvoiceId={localInvoiceId}
            />
        </div>
    );
}

export default ProductListPage;