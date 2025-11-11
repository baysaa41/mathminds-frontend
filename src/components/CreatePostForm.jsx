import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Spinner, Alert, Stack, Badge, Image, CloseButton } from 'react-bootstrap';
import apiClient from '../api/axiosConfig';
import { usePrefill } from '../context/PrefillContext';

/**
 * Үндсэн "Universal" пост үүсгэх форм
 * (!!! ШИНЭЧИЛСЭН: Асуудалтай Unmount 'useEffect'-г устгасан)
 */
const CreatePostForm = ({ onPostCreated }) => {
    const navigate = useNavigate();
    const { prefillData, setPrefillData } = usePrefill();

    // --- Form fields ---
    // "Бэлэг"-ийг 'useState'-н анхны утга болгож тохируулах
    const [content, setContent] = useState('');
    const [contentType, setContentType] = useState(prefillData?.type || 'post');
    const [relatedItem, setRelatedItem] = useState(prefillData?.item || null);

    // Олон зураг хадгалах State
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Refs
    const contentRef = useRef(null);
    const imageInputRef = useRef(null);

    // "Бэлэг"-тэй үед focus хийх
    useEffect(() => {
        if (relatedItem) {
            contentRef.current?.focus();
        }
    }, [relatedItem]);

    // (!!!) АСУУДАЛТАЙ 'useEffect'-Г ЭНДЭЭС УСТГАСАН (!!!)
    // Strict Mode-д "бэлэг"-ийг устгаж байсан unmount 'useEffect'-г хассан.

    // ... (handleImageChange, clearImage, clearAllImages хэвээрээ) ...
    const handleImageChange = (e) => {
        setError(null);
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        if (files.length + imageFiles.length > 10) {
            setError("Нэг дор 10-аас ихгүй зураг хавсаргах боломжтой.");
            e.target.value = null;
            return;
        }
        setImageFiles(prevFiles => [...prevFiles, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
        e.target.value = null;
    };

    const clearImage = (indexToRemove) => {
        URL.revokeObjectURL(imagePreviews[indexToRemove]);
        setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prevPreviews => prevPreviews.filter((_, index) => index !== indexToRemove));
    };

    const clearAllImages = () => {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setImageFiles([]);
        setImagePreviews([]);
        if (imageInputRef.current) imageInputRef.current.value = null;
    };

    /**
     * "Бэлэг"-ийг цуцлах (Alert-н хаах товч)
     */
    const clearRelatedItem = () => {
        setRelatedItem(null);
        setContentType('post');
        setPrefillData(null); // Context-г цэвэрлэх (Зөв)
    };

    /**
     * Формыг илгээх
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('content', content);

        if (relatedItem) {
            formData.append(`related_${contentType}_id`, relatedItem.id);
        }
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => {
                formData.append('images', file);
            });
        }

        try {
            const response = await apiClient.post('/api/minds/posts/', formData);
            if (onPostCreated) {
                onPostCreated(response.data);
            }
            // Формыг бүрэн цэвэрлэх
            setContent('');
            setContentType('post');
            setRelatedItem(null);
            clearAllImages();
            setPrefillData(null); // Context-г цэвэрлэх (Зөв)

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

    /**
     * "Бэлэг"-ийн Badge-г харуулах
     */
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
                onClose={clearRelatedItem}
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

    // --- Үндсэн Render ---
    return (
        <>
            <Form onSubmit={handleSubmit} className="p-3 border rounded bg-white shadow-sm mb-3">
                {error && <Alert variant="danger">{error}</Alert>}
                {renderRelatedItemBadge()}
                <Form.Group controlId="postContent">
                    <Form.Control
                        ref={contentRef}
                        as="textarea"
                        rows={3}
                        placeholder={relatedItem ? "Сэтгэгдлээ бичнэ үү..." : "Юу бодож байна... (YouTube, Vimeo линкээ энд хуулж болно)"}
                        value={content}
                        onChange={(e) => setContent(e.target.value)} // Энэ алдааг өмнө нь зассан
                        required={!relatedItem && imageFiles.length === 0}
                    />
                </Form.Group>
                <Stack direction="horizontal" gap={3} className="mt-2">
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-secondary text-decoration-none"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageFiles.length >= 10}
                    >
                        <i className="bi bi-images me-1"></i>
                        Зураг {imageFiles.length > 0 && `(${imageFiles.length} / 10)`}
                    </Button>
                </Stack>
                <Form.Control
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className="d-none"
                    multiple
                />
                {imagePreviews.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap" style={{ gap: '10px' }}>
                        {imagePreviews.map((previewUrl, index) => (
                            <div
                                key={index}
                                className="position-relative d-inline-block"
                                style={{ width: '100px', height: '100px' }}
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
                <div className="text-end mt-3">
                    <Button type="submit" disabled={loading}>
                        {loading && <Spinner as="span" size="sm" className="me-1" />}
                        Нийтлэх
                    </Button>
                </div>
            </Form>
        </>
    );
};

export default CreatePostForm;