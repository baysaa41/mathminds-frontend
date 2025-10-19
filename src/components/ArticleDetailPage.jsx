import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { MathJax } from 'better-react-mathjax';
import { useAuth } from '../context/AuthContext';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';

const ArticleDetailPage = () => {
    const { articleId } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
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
        return null;
    }

    const canEdit = user && article && article.author && (user.user_id === article.author.id || user.is_staff);

    const handleEditClick = () => {
        navigate(`/article/${articleId}/edit`);
    };

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                <Breadcrumb.Item active>{article.title || 'Өгүүлэл'}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Гарчиг ба Засварлах товч */}
            <Stack direction="horizontal" gap={3} className="align-items-start mb-3">
                <MathJax hideUntilTypeset={"first"} className="flex-grow-1">
                    <h1 className="h3 fw-bold mathjax-content mb-0">{article.title || 'Гарчиггүй өгүүлэл'}</h1>
                </MathJax>
                {canEdit && (
                    <Button variant="outline-primary" size="sm" onClick={handleEditClick} className="flex-shrink-0">
                        Засварлах
                    </Button>
                )}
            </Stack>

            {/* ✅ Abstract харуулах */}
            {article.abstract && (
                <MathJax hideUntilTypeset={"first"}>
                    <div
                        className="mathjax-content text-muted mb-4 p-3 bg-light rounded border-start border-primary border-4"
                        style={{ fontSize: '1.05em', lineHeight: '1.6', fontStyle: 'italic' }}
                    >
                        {article.abstract}
                    </div>
                </MathJax>
            )}

            {/* Зохиогч, огноо */}
            <div className="text-muted mb-4 small d-flex flex-wrap gap-2 align-items-center">
                <span>Зохиогч: {article.author?.first_name || article.author?.email || 'N/A'}</span>
                <span className='d-none d-sm-inline mx-1'>|</span>
                <span>Нийтэлсэн: {article.published ? new Date(article.published).toLocaleDateString() : 'N/A'}</span>
            </div>

            <hr className="mb-4"/>

            {/* Үндсэн агуулга */}
            <MathJax hideUntilTypeset={"first"}>
                <div
                    className="article-content mathjax-content"
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.7' }}
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