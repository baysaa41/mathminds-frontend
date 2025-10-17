// frontend/src/components/ArticleDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { MathJax } from 'better-react-mathjax';
import { useAuth } from '../context/AuthContext'; // <-- useAuth-г импорт хийсэн

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button'; // <-- Button-г импорт хийсэн
import Stack from 'react-bootstrap/Stack'; // <-- Stack-г импорт хийсэн

const ArticleDetailPage = () => {
    const { articleId } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth(); // <-- Нэвтэрсэн хэрэглэгчийн мэдээллийг авсан
    const navigate = useNavigate();

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get(`/api/minds/articles/${articleId}/`);
                setArticle(response.data);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Өгүүлэл олдсонгүй.');
                } else {
                    setError('Өгүүллийг уншихад алдаа гарлаа.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [articleId]);

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5" >
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Link to="/"> &laquo; Буцах</Link>
            </Container>
        );
    }

    if (!article) {
        // Error state дээр аль хэдийн мессеж харуулсан тул энд хүрэхгүй
        // Гэхдээ баталгаажуулах үүднээс null буцааж болно
        return null;
    }

    // --- ЗАСВАРЛАХ ЭРХИЙГ ШАЛГАХ ---
    // API-аас ирсэн author object дотор id байгаа эсэхийг шалгах нь чухал
    const canEdit = user && article && article.author && (user.user_id === article.author.id || user.is_staff);
    // --- ШАЛГАЛТ ДУУССАН ---

    // Засварлах товч дарагдах үед ажиллах функц
    const handleEditClick = () => {
        // Засварлах хуудас руу үсэрнэ
        navigate(`/article/${articleId}/edit`);
    };


    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                {/* Өгүүллийн гарчиг байхгүй үед 'Өгүүлэл' гэж харуулна */}
                <Breadcrumb.Item active>{article.title || 'Өгүүлэл'}</Breadcrumb.Item>
            </Breadcrumb>

            {/* --- ГАРЧИГ БА ЗАСВАРЛАХ ТОВЧ --- */}
            <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                <MathJax hideUntilTypeset={"first"} className="flex-grow-1">
                    {/* Өгүүллийн гарчиг байхгүй үед 'Гарчиггүй' гэж харуулна */}
                    <h1 className="h3 fw-bold mathjax-content mb-0">{article.title || 'Гарчиггүй өгүүлэл'}</h1>
                </MathJax>
                {canEdit && ( // Эрхтэй үед л товчийг харуулна
                    <Button variant="outline-primary" size="sm" onClick={handleEditClick} className="flex-shrink-0"> {/* flex-shrink-0 нэмсэн */}
                        Засварлах
                    </Button>
                )}
            </Stack>
            {/* --- ХЭСЭГ ДУУССАН --- */}


            <div className="text-muted mb-4 small d-flex flex-wrap gap-2 align-items-center"> {/* flex-wrap нэмсэн */}
                <span>Зохиогч: {article.author?.first_name || article.author?.email || 'N/A'}</span>
                <span className='d-none d-sm-inline mx-1'>|</span> {/* Жижиг дэлгэцэнд нуугдана */}
                <span>Нийтэлсэн: {article.published ? new Date(article.published).toLocaleDateString() : 'N/A'}</span>
            </div>

            <hr className="mb-4"/>

            <MathJax hideUntilTypeset={"first"}>
                <div
                    className="article-content mathjax-content"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
                    // Контент байхгүй үед хоосон харагдуулна
                    dangerouslySetInnerHTML={{ __html: article.content || '' }}
                />
            </MathJax>

            <hr className="mt-5"/>
            <Link to="/" className="btn btn-outline-secondary btn-sm mt-3">
                &laquo; Нүүр хуудас руу буцах
            </Link>

        </Container>
    );
};

export default ArticleDetailPage;