// frontend/src/pages/QuizzesPage.jsx
// (!!! ШИНЭЧИЛСЭН: Нийтлэг hook, компонент ашигласан, зөвхөн "Миний" тестүүдийг харуулна)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import LivePreview from '../components/LivePreview.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BadgeCheck } from 'lucide-react';

// (!!!) 1. ШИНЭ HOOK БОЛОН КОМПОНЕНТУУДЫГ ИМПОРТЛОХ
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';
import useToast from '../hooks/useToast.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import SearchBar from '../components/common/SearchBar.jsx';

// React Bootstrap components
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

const QuizzesPage = () => {
    const { user } = useAuth(); // (!!!) Хэрэглэгчийн мэдээллийг авах
    const navigate = useNavigate();
    const { setPageTitle } = useOutletContext();

    // (!!!) 2. НИЙТЛЭГ HOOK-ҮҮДИЙГ АШИГЛАХ
    const { toast, showToast, hideToast } = useToast();
    const {
        data: quizzes,
        loading,
        loadingMore,
        error,
        hasMore,
        fetchData,
        loadMore,
        refresh
    } = usePaginatedFetch('/api/integral/quizzes/'); //

    const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

    // (!!!) 3. Дотоод state-үүдийг цомхотгох
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [currentQuery, setCurrentQuery] = useState({ search: '' });

    // Анхны ачаалалт болон гарчиг тохируулах
    useEffect(() => {
        setPageTitle('Миний тестүүд'); // (!!!) Гарчгийг өөрчлөх

        // (!!!) 4. Хэрэглэгч байвал 'author' шүүлтүүр нэмэх
        if (user?.id) {
            fetchData({ author: user.id });
        }

        return () => { setPageTitle('Нүүр'); };
    }, [fetchData, setPageTitle, user?.id]); // (!!!) user.id-г dependency-д нэмэх

    // --- Үйлдэл гүйцэтгэх функцууд ---

    // (!!!) 5. Хайлтын функцийг SearchBar-д тохируулах
    const handleSearch = useCallback((query) => {
        if (!user?.id) return; // Хэрэглэгч байхгүй бол хайхгүй

        const searchQuery = query.search || '';
        setCurrentQuery({ search: searchQuery });

        // (!!!) 6. Хайлт хийхдээ 'author' шүүлтүүрийг хадгалах
        fetchData({ search: searchQuery, author: user.id }, true);

    }, [fetchData, user?.id]); // (!!!) user.id-г dependency-д нэмэх

    // Шинэ тест үүсгэх (useToast-г ашиглахаар шинэчилсэн)
    const handleCreateNew = async () => {
        setIsCreatingNew(true);
        try {
            const response = await apiClient.post('/api/integral/quizzes/', {
                title: 'Шинэ тест (Гарчиггүй)',
                description: 'Тестийн тайлбар...',
                is_published: false,
            }); //
            const newQuizId = response.data.id;
            navigate(`/quiz/${newQuizId}/edit`);
        } catch (err) {
            console.error("Failed to create new quiz:", err);
            showToast('Шинэ тест үүсгэхэд алдаа гарлаа.', 'danger');
        } finally {
            setIsCreatingNew(false);
        }
    };


    // --- Render хэсэг ---

    return (
        <Container className="py-4">

            {/* (!!!) 7. useToast-д зориулсан ToastContainer */}
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

            {/* (!!!) 8. PageHeader компонент ашиглах (icon-г LeftSidebar-тай нийцүүлэх) */}
            <PageHeader
                title="Миний тестүүд"
                action={{
                    label: "Шинэ тест",
                    onClick: handleCreateNew,
                    icon: <i className="bi bi-patch-plus me-1"></i> // (bi-patch-check-н "нэмэх" хувилбар)
                }}
                loading={isCreatingNew}
            />

            {/* (!!!) 9. SearchBar компонент ашиглах */}
            <SearchBar
                onSearch={handleSearch}
                placeholder="Миний тестүүдээс хайх..."
                loading={loading}
                filters={[]} // Энэ хуудсанд нэмэлт шүүлтүүр (author-с гадна) байхгүй
            />

            {/* (!!!) 10. Loading, Error, Empty state-үүдийг компонентоор солих */}

            {/* Анхны ачаалал */}
            {loading && <LoadingState message="Миний тестүүдийг ачааллаж байна..." />}

            {/* Алдаа */}
            {error && !loading && (
                <ErrorState message={error} onRetry={refresh} />
            )}

            {/* Хоосон (мэдээллийг өөрчилсөн) */}
            {!loading && !error && quizzes.length === 0 && (
                <EmptyState
                    icon={BadgeCheck} // Sidebar icon
                    title={currentQuery.search ? 'Хайлт олдсонгүй' : 'Та тест үүсгээгүй байна'}
                    message={currentQuery.search ? 'Хайлтын утганд тохирох тест таны сан дотор байхгүй байна.' : 'Та эхний тестээ үүсгэнэ үү.'}
                    actionLabel="Шинэ тест үүсгэх"
                    onAction={handleCreateNew}
                />
            )}

            {/* Тестүүдийн жагсаалт (хэвээрээ) */}
            {!loading && !error && quizzes.length > 0 && (
                <Row className="g-3">
                    {quizzes.map((quiz) => (
                        <Col key={quiz.id} xs={12}>
                            <Card
                                className="h-100 shadow-sm hover-shadow transition"
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/quiz/${quiz.id}`)}
                            >
                                <Card.Body>
                                    <Stack direction="horizontal" gap={2} className="mb-2 flex-wrap">
                                        {quiz.is_published ? (
                                            <Badge bg="success">Нийтлэгдсэн</Badge>
                                        ) : (
                                            <Badge bg="warning" text="dark">Ноорог</Badge>
                                        )}
                                        {/* (!!!) Бүгд "Миний" тул энэ Badge-г харуулж болно, эсвэл хасаж болно */}
                                        <Badge bg="primary">Миний</Badge>

                                        <Badge bg="secondary" className="ms-auto">
                                            {quiz.problems_count || 0} бодлоготой
                                        </Badge>
                                    </Stack>

                                    <div className="h5 mb-2 mathjax-content">
                                        <LivePreview content={quiz.title || `Тест #${quiz.id}`} />
                                    </div>

                                    <div className="text-muted small mathjax-content">
                                        <LivePreview content={quiz.description || 'Тайлбар байхгүй...'} />
                                    </div>

                                    <div className="text-muted small mt-2">
                                        <i className="bi bi-person me-1"></i>
                                        {quiz.author?.first_name || quiz.author?.email || 'N/A'}
                                        {quiz.updated_at && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <i className="bi bi-clock me-1"></i>
                                                {new Date(quiz.updated_at).toLocaleString()}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* (!!!) 11. Infinite Scroll-н trigger (ref-г солих) */}
            <div ref={triggerRef} style={{ height: '20px' }} />

            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}

            {/* Статистик (hasMore-г ашиглахаар шинэчилсэн) */}
            {quizzes.length > 0 && (
                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        Нийт: <strong>{quizzes.length}</strong> тест
                        {currentQuery.search ? (
                            <> • (Одоогийн хайлтаар <strong>{quizzes.length}</strong> олдсон)</>
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

export default QuizzesPage;