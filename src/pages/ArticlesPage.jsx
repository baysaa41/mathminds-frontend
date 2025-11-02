// frontend/src/pages/ArticlesPage.jsx
// (!!! ШИНЭЧИЛСЭН: Зөвхөн өөрийн өгүүллийг харуулдаг болсон)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { FileText } from 'lucide-react';

import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Badge from 'react-bootstrap/Badge';
import Stack from 'react-bootstrap/Stack';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';


const ArticlesPage = () => {
    const { user } = useAuth(); // (!!!) 1. Хэрэглэгчийн мэдээллийг авах
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    const { toast, showToast, hideToast } = useToast();
    const {
        data: articles,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh
    } = usePaginatedFetch('/api/integral/articles/');

    const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [postingId, setPostingId] = useState(null);
    const [currentQuery, setCurrentQuery] = useState({ search: '' });

    // Анхны ачаалалт болон гарчиг тохируулах
    useEffect(() => {
        // (!!!) 2. Гарчгийг өөрчлөх
        setPageTitle('Миний өгүүллүүд');

        // (!!!) 3. Хэрэглэгч байвал 'author' шүүлтүүр нэмэх
        if (user?.id) {
            fetchData({ author: user.id });
        }

        return () => { setPageTitle('Нүүр'); };
        // (!!!) 4. 'user.id'-г dependency-д нэмэх
    }, [fetchData, setPageTitle, user?.id]);

    // Хайлтын функц
    const handleSearch = useCallback((query) => {
        // (!!!) 5. Хэрэглэгч байхгүй бол хайхгүй
        if (!user?.id) return;

        const searchQuery = query.search || '';
        setCurrentQuery({ search: searchQuery });

        // (!!!) 6. Хайлт хийхдээ 'author' шүүлтүүрийг хадгалах
        fetchData({ search: searchQuery, author: user.id }, true);

        // (!!!) 7. 'user.id'-г dependency-д нэмэх
    }, [fetchData, user?.id]);

    // Шинэ өгүүлэл үүсгэх (хэвээрээ)
    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        try {
            const response = await apiClient.post('/api/integral/articles/', {
                title: 'Шинэ өгүүлэл (Гарчиггүй)',
                content: 'Өгүүллийн агуулга...',
                abstract: 'Товч хураангуй...',
            });
            const newArticleId = response.data.id;
            navigate(`/article/${newArticleId}/edit`);
        } catch (err) {
            console.error("Failed to create new article:", err);
            showToast('Шинэ өгүүлэл үүсгэхэд алдаа гарлаа.', 'danger');
        } finally {
            setIsCreatingNew(false);
        }
    };

    // Пост үүсгэх (хэвээрээ)
    const handleCreatePost = async (e, articleId) => {
        e.stopPropagation();
        setPostingId(articleId);

        try {
            const response = await apiClient.post('/api/minds/posts/create-from-article/', {
                article_id: articleId
            });

            if (response.status === 201) {
                showToast('Пост амжилттай үүслээ!', 'success');
            } else if (response.status === 200 && response.data.message === "Post already exists.") {
                showToast('Та энэ өгүүллийг аль хэдийн постлосон байна.', 'info');
            }
        } catch (err) {
            console.error('Failed to create post:', err);
            const errorMsg = err.response?.data?.error || 'Пост үүсгэхэд алдаа гарлаа.';
            showToast(errorMsg, 'danger');
        } finally {
            setPostingId(null);
        }
    };


    // --- Render хэсэг ---

    return (
        <Container className="py-4">

            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast
                    show={toast.show}
                    onClose={hideToast}
                    delay={3000}
                    autohide
                    bg={toast.variant}
                >
                    <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            {/* (!!!) 8. PageHeader-н гарчгийг болон icon-г өөрчлөх */}
            <PageHeader
                title="Миний өгүүллүүд"
                action={{
                    label: "Шинэ өгүүлэл",
                    onClick: handleCreateNew,
                    icon: <i className="bi bi-journal-text me-1"></i>
                }}
                loading={isCreatingNew}
            />

            <SearchBar
                onSearch={handleSearch}
                placeholder="Миний өгүүллүүдээс хайх..."
                loading={loading}
                filters={[]}
            />

            {/* Анхны ачаалал */}
            {loading && <LoadingState message="Миний өгүүллүүдийг ачааллаж байна..." />}

            {/* Алдаа */}
            {error && !loading && (
                <ErrorState message={error} onRetry={refresh} />
            )}

            {/* (!!!) 9. EmptyState-н мэдээллийг өөрчлөх */}
            {!loading && !error && articles.length === 0 && (
                <EmptyState
                    icon={FileText}
                    title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Та өгүүлэл бичээгүй байна'}
                    message={currentQuery.search ? 'Хайлтын утганд тохирох өгүүлэл таны нийтлэлд байхгүй байна.' : 'Та эхний өгүүллээ үүсгэнэ үү.'}
                    actionLabel="Шинэ өгүүлэл үүсгэх"
                    onAction={handleCreateNew}
                />
            )}

            {/* Өгүүллүүдийн жагсаалт */}
            {!loading && !error && articles.length > 0 && (
                <Row className="g-3">
                    {articles.map((article) => (
                        <Col key={article.id} xs={12}>
                            <Card
                                className="h-100 shadow-sm hover-shadow transition"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/article/${article.id}`)}
                            >
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {article.published ? (
                                            <Badge bg="success">Нийтлэгдсэн</Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark">Ноорог</Badge>
                                        )}
                                        {/* (!!!) Бүх өгүүлэл "Миний" тул энэ Badge-г харуулж болно эсвэл бүр хасч болно */}
                                        <Badge bg="primary">Миний</Badge>

                                        <Button variant="outline-primary" size="sm" className="ms-auto" onClick={(e) => handleCreatePost(e, article.id)} disabled={postingId === article.id}>
                                            {postingId === article.id ? <Spinner as="span" size="sm" /> : <i className="bi bi-send-plus me-1"></i> }
                                            {postingId !== article.id && 'Постлох'}
                                        </Button>
                                    </Stack>

                                    <div className="h5 mb-2 mathjax-content">
                                        <LivePreview content={article.title || `Өгүүлэл #${article.id}`} />
                                    </div>

                                    <div className="text-muted small mathjax-content">
                                        <LivePreview content={article.abstract || 'Хураангуй байхгүй...'} />
                                    </div>

                                    <div className="text-muted small mt-2">
                                        {/* (!!!) Зохиогч нь үргэлж 'user' тул харуулж болно, эсвэл огноог л харуулж болно */}
                                        <i className="bi bi-person me-1"></i>
                                        {article.author?.first_name || article.author?.email || 'N/A'}
                                        {article.published && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <i className="bi bi-clock me-1"></i>
                                                {new Date(article.published).toLocaleDateString()}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <div ref={triggerRef} style={{ height: '20px' }} />

            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            {/* Статистик */}
            {articles.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        Нийт: <strong>{articles.length}</strong> өгүүлэл
                        {currentQuery.search ? (
                            <> • (Одоогийн хайлтаар <strong>{articles.length}</strong> олдсон)</>
                        ) : null}
                        {hasMore && !loading && (
                            <> • (Гүйлгэж илүү ихийг ачаална уу)</>
                        )}
                    </small>
                </div>
            )}
        </Container>
    );
};

export default ArticlesPage;