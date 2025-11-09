import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Spinner, Alert, Stack, Badge, Image, CloseButton } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';

// (Жишээ Modal-ууд энд байна гэж үзлээ)
// import ProblemSelectorModal from './ProblemSelectorModal';
// import ArticleSelectorModal from './ArticleSelectorModal';
// ...

/**
 * Үндсэн "Universal" пост үүсгэх форм
 */
const CreatePostForm = ({ onPostCreated }) => {
    // Form fields
    const [contentType, setContentType] = useState('post');
    const [content, setContent] = useState('');
    const [relatedItem, setRelatedItem] = useState(null); // { id: 1, title: "..." }

    // (!!!) Олон зураг хадгалах State (!!!)
    const [imageFiles, setImageFiles] = useState([]); // File object-н array
    const [imagePreviews, setImagePreviews] = useState([]); // URL string-н array

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false); // "Сонгох..." товчны модал

    // Refs
    const contentRef = useRef(null); // "Бэлэг" ирэхэд focus хийхэд ашиглана
    const imageInputRef = useRef(null); // "Зураг" товч дарахад file input-г дуудах

    // Navigation state (бэлэг) хүлээж авах
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // 1. Navigation-р "бэлэг" (state) ирсэн эсэхийг шалгана
        const prefillData = location.state?.prefill;

        if (prefillData) {
            // 2. Формын state-г бэлгээр дүүргэнэ
            setContentType(prefillData.type);
            setRelatedItem(prefillData.item);

            // 3. Хэрэглэгчийг шууд бичвэр оруулах талбар луу үсэргэнэ
            contentRef.current?.focus();

            // 4. (Маш чухал) Navigation state-г цэвэрлэнэ.
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location, navigate]); // Энэ effect зөвхөн location өөрчлөгдөхөд ажиллана

    /**
     * Олон зураг сонгох үед ажиллана
     */
    const handleImageChange = (e) => {
        setError(null); // Шинэ зураг сонгоход алдааг цэвэрлэх
        const files = Array.from(e.target.files); // FileList-г array-руу хөрвүүлэх
        if (files.length === 0) return;

        // Хязгаар шалгах (Backend-тэй адил: 10)
        if (files.length + imageFiles.length > 10) {
            setError("Нэг дор 10-аас ихгүй зураг хавсаргах боломжтой.");
            e.target.value = null; // Input-г цэвэрлэх
            return;
        }

        // Шинэ файлуудыг state-д нэмэх
        setImageFiles(prevFiles => [...prevFiles, ...files]);

        // Шинэ preview URL-уудыг state-д нэмэх
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);

        e.target.value = null; // Дахин ижил файлыг сонгох боломжтой болгох
    };

    /**
     * Нэг зургийг preview-с устгах
     */
    const clearImage = (indexToRemove) => {
        // Memory-с URL-г устгах (memory leak-с сэргийлнэ)
        URL.revokeObjectURL(imagePreviews[indexToRemove]);

        setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    };

    /**
     * Бүх зургийг цэвэрлэх (Пост илгээсний дараа)
     */
    const clearAllImages = () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        if (imageInputRef.current) imageInputRef.current.value = null;
    };

    /**
     * Формыг илгээх (handleSubmit)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();

        // 1. Үндсэн мэдээлэл (бичвэр)
        formData.append('content', content);

        // 2. Холбоотой контент (Бодлого, Өгүүлэл г.м)
        if (relatedItem) {
            formData.append(`related_${contentType}_id`, relatedItem.id);
        }

        // 3. Олон зургийг 'images' гэсэн *нэг* key-р нэмнэ
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
        }

        try {
            // (!!!) ЗАСВАРЛАСАН ХЭСЭГ (!!!)
            // 'headers' тохиргоог бүхэлд нь устгасан.
            // Axios үүнийг автоматаар хийнэ.
            const response = await apiClient.post('/api/minds/posts/', formData);

            // (!!!) ЗАСВАР ДУУССАН (!!!)


            // Эцэг компонент руу мэдэгдэх (Feed-д шинэ пост нэмэх)
            if (onPostCreated) {
                onPostCreated(response.data);
            }

            // Формыг бүрэн цэвэрлэх
            setContent('');
            setContentType('post');
            setRelatedItem(null);
            clearAllImages();

        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object' && errorData !== null) {
                const errorMessages = Object.values(errorData).join(' ');
                setError(errorMessages || "Пост үүсгэхэд алдаа гарлаа.");
            } else {
                setError("Пост үүсгэхэд алдаа гарлаа.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Туслах функцууд (Modal нээх, сонгох) ---

    const handleSelectClick = () => {
        if (contentType !== 'post') {
            setShowModal(true);
        }
    };

    const handleItemSelected = (item) => {
        setRelatedItem(item);
        setShowModal(false);
        if (!content) {
            setContent(item.title || item.name || '');
        }
    };

    // Сонгогдсон "бэлэг"-г харуулах Badge
    const renderRelatedItemBadge = () => {
        if (!relatedItem) return null;

        const typeLabels = {
            problem: 'Бодлого',
            article: 'Өгүүлэл',
            formula: 'Томьёо',
            quiz: 'Тест',
        };

        return (
            <Alert
                variant="info"
                onClose={() => setRelatedItem(null)}
                dismissible
                className="py-2 px-3 small d-flex justify-content-between align-items-center"
            >
                <div>
                    <Badge pill bg="primary" className="me-2">{typeLabels[contentType]}</Badge>
                    {relatedItem.title || relatedItem.name}
                </div>
            </Alert>
        );
    };

    // Аль Modal-г нээхийг сонгох
    const renderActiveModal = () => {
        if (!showModal) return null;

        // Энд та өөрийн Selector Modal-уудаа холбоно
        switch (contentType) {
            // case 'problem':
            //     return <ProblemSelectorModal show={showModal} onHide={() => setShowModal(false)} onSelect={handleItemSelected} />;
            // case 'article':
            //     return <ArticleSelectorModal show={showModal} onHide={() => setShowModal(false)} onSelect={handleItemSelected} />;
            default:
                return (
                    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>{contentType} сонгох</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {contentType} сонгох Modal энд хийгдэнэ.
                        </Modal.Body>
                    </Modal>
                );
        }
    };

    // --- Үндсэн Render ---
    return (
        <>
            <Form onSubmit={handleSubmit} className="p-3 border rounded bg-white shadow-sm mb-3">

                {/* Алдааны мөр */}
                {error && <Alert variant="danger">{error}</Alert>}

                {/* --- 1. Төрөл сонгох хэсэг --- */}
                {/* Зөвхөн "бэлэггүй" (relatedItem=null) үед харуулна */}
                {!relatedItem && (
                    <Stack direction="horizontal" gap={2} className="mb-2">
                        <Form.Label className="fw-bold mb-0">Төрөл:</Form.Label>
                        <Form.Select
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                            style={{ width: '150px' }}
                            size="sm"
                        >
                            <option value="post">Энгийн</option>
                            <option value="problem">Бодлого</option>
                            <option value="article">Өгүүлэл</option>
                            <option value="formula">Томьёо</option>
                            <option value="quiz">Тест</option>
                        </Form.Select>

                        {contentType !== 'post' && (
                            <Button variant="outline-primary" size="sm" onClick={handleSelectClick}>
                                <i className="bi bi-search me-1"></i> Сонгох...
                            </Button>
                        )}
                    </Stack>
                )}

                {/* --- 2. "Бэлэг" харуулах хэсэг --- */}
                {renderRelatedItemBadge()}

                {/* --- 3. Үндсэн бичвэр --- */}
                <Form.Group controlId="postContent">
                    <Form.Control
                        ref={contentRef}
                        as="textarea"
                        rows={3}
                        placeholder={relatedItem ? "Сэтгэгдлээ бичнэ үү..." : "Юу бодож байна... (YouTube, Vimeo линкээ энд хуулж болно)"}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        // Хэрэв "бэлэг" байхгүй, зураг ч байхгүй бол бичвэр заавал шаардлагатай
                        required={!relatedItem && imageFiles.length === 0}
                    />
                </Form.Group>

                {/* --- 4. Файл нэмэх хэсэг --- */}
                <Stack direction="horizontal" gap={3} className="mt-2">
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-secondary text-decoration-none"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageFiles.length >= 10} // Хязгаар хүрсэн бол идэвхгүй болгох
                    >
                        <i className="bi bi-images me-1"></i>
                        Зураг {imageFiles.length > 0 && `(${imageFiles.length} / 10)`}
                    </Button>

                    {/* "Видео" болон "YouTube" товчнууд байхгүй */}
                </Stack>

                {/* Далд Файл Input (multiple-г анхаарна уу) */}
                <Form.Control
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="d-none"
                    multiple // Олон зураг сонгохыг зөвшөөрнө
                />

                {/* --- 5. Зургийн Preview Хэсэг --- */}
                {imagePreviews.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap" style={{ gap: '10px' }}>
                        {imagePreviews.map((previewUrl, index) => (
                            <div
                                key={index}
                                className="position-relative d-inline-block"
                                style={{ width: '100px', height: '100px' }} // 1:1 харьцаатай жижиг зураг
                            >
                                <CloseButton
                                    onClick={() => clearImage(index)}
                                    className="position-absolute top-0 end-0 bg-light p-1"
                                    style={{ zIndex: 1, fontSize: '0.6em', opacity: 0.8 }}
                                    title="Устгах"
                                />
                                <Image
                                    src={previewUrl}
                                    thumbnail
                                    fluid
                                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* --- 6. Илгээх товч --- */}
                <div className="text-end mt-3">
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner as="span" size="sm" className="me-1" />}
                        Нийтлэх
                    </Button>
                </div>
            </Form>

            {/* Modal-уудыг рендерлэх хэсэг */}
            {renderActiveModal()}
        </>
    );
};

export default CreatePostForm;