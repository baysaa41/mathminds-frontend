// src/pages/ProductListPage.jsx

import React, { useState, useEffect } from 'react';
// (!!!) ЗАСВАР: Ердийн 'axios' биш, тохируулсан 'apiClient'-г импортлоно
import apiClient from '../api/axiosConfig'; // Таны axiosConfig.js-н байршлыг зөв заана уу

// Компонентууд
import PaymentModal from '../components/PaymentModal.jsx';
import './ProductListPage.css';

// Зураг харуулахын тулд API-н үндсэн хаяг
const API_DOMAIN = 'https://api.mathminds.club';

function ProductListPage() {
    // State-үүд
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Модалын state-үүд
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [localInvoiceId, setLocalInvoiceId] = useState(null);

    // 1. Бүтээгдэхүүнийг дуудах (useEffect)
    useEffect(() => {
        const fetchProducts = async () => {
            setPageLoading(true);
            try {
                // (!!!) ЗАСВАР: 'axios.get' биш, 'apiClient.get' ашиглана
                const response = await apiClient.get('/api/api/v1/products/');

                // Django-ийн пагинацитай хариу ({ results: [...] })
                if (response.data && Array.isArray(response.data.results)) {
                    setProducts(response.data.results);
                } else {
                    console.warn("API-аас зөв жагсаалт ирсэнгүй:", response.data);
                    setProducts([]);
                }

            } catch (error) {
                console.error("Бүтээгдэхүүн дуудахад алдаа гарлаа:", error);
                setProducts([]);
            }
            setPageLoading(false);
        };

        fetchProducts();
    }, []); // Анх хуудас ачаалахад нэг удаа ажиллана

    // 2. "Худалдаж авах" товч дарагдах үйлдэл
    const handleBuyClick = async (productId) => {
        setIsLoading(true);
        try {
            // (!!!) ЗАСВАР: 'axios.post' биш, 'apiClient.post' ашиглана
            // Энэ нь 'axiosConfig.js'-н ачаар auth token-г автоматаар хавсаргана
            const response = await apiClient.post('/api/v1/payments/create-invoice/', {
                product_id: productId
            });

            const { qpay_data, local_invoice_id } = response.data;

            setModalData(response.data);
            setLocalInvoiceId(local_invoice_id);
            setShowModal(true);

        } catch (error) {
            console.error("Нэхэмжлэх үүсгэхэд алдаа гарлаа:", error);

            if (error.response?.status === 401) {
                alert("Нэхэмжлэх үүсгэхийн тулд эхлээд нэвтэрнэ үү!");
            } else {
                alert("Алдаа гарлаа: " + (error.response?.data?.error || "Тодорхойгүй алдаа"));
            }
        }
        setIsLoading(false);
    };

    // --- Render хэсэг ---

    if (pageLoading) {
        return <div className="loading-container">Бүтээгдэхүүн ачааллаж байна...</div>;
    }

    return (
        <div className="product-list-page">
            <h1>Манай бүтээгдэхүүнүүд</h1>
            <div className="product-list">

                {products.length === 0 ? (
                    <p>Одоогоор худалдаж авах боломжтой бүтээгдэхүүн алга.</p>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="product-card">
                            <img
                                // (!!!) ЗАСВАР: Зургийг production хаягаас дуудах
                                // product.image нь /media/... гэсэн харьцангуй зам буцаана гэж үзэв
                                src={product.image ? `${API_DOMAIN}${product.image}` : 'https://via.placeholder.com/300'}
                                alt={product.name}
                                className="product.image"
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