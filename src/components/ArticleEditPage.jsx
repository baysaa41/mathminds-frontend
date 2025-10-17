import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// import apiClient from '../api/axiosConfig'; // Түр comment болгов
// import { useAuth } from '../context/AuthContext'; // Түр comment болгов

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Stack from 'react-bootstrap/Stack';

// import { MathJax } from 'better-react-mathjax'; // Түр comment болгов


// --- ТҮР ОРЛУУЛАЛТ: Кодыг Preview орчинд ажиллуулахын тулд ---
// Таны жинхэнэ файлууд болон сангуудыг түр орлуулж байна.
// Та өөрийн төсөлдөө эдгээрийг ашиглах шаардлагагүй.

const apiClient = {
    get: (url) => Promise.resolve({
        data: {
            id: url.split('/')[4],
            title: 'Серверээс ирсэн гарчиг',
            content: '<p>Серверээс ирсэн анхны агуулга.</p>',
            author: { id: 1, username: 'testuser' }
        }
    }),
    patch: (url, data) => {
        console.log(`PATCHing to ${url} with data:`, data);
        return Promise.resolve({ data });
    }
};

const useAuth = () => ({
    user: { user_id: 1, is_staff: false, username: 'testuser' }
});

const MathJax = ({ children }) => <div className="mathjax-mock">{children}</div>;
// --- ТҮР ОРЛУУЛАЛТ ДУУССАН ---


// --- Бие даасан Editor Компонент (Tiptap/Quill-ийн оронд) ---
const editorStyles = {
    editorWrapper: {
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem',
        backgroundColor: 'white',
        transition: 'border-color .15s ease-in-out, box-shadow .15s ease-in-out',
    },
    editorWrapperDisabled: {
        backgroundColor: '#e9ecef',
        opacity: 1,
    },
    menu: {
        backgroundColor: '#f8f9fa',
        padding: '0.5rem',
        borderBottom: '1px solid #dee2e6',
        borderTopLeftRadius: '0.375rem',
        borderTopRightRadius: '0.375rem',
    },
    button: {
        background: 'none',
        border: '1px solid transparent',
        borderRadius: '0.25rem',
        padding: '0.25rem 0.5rem',
        marginRight: '0.25rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
    },
    editableArea: {
        padding: '0.5rem 0.75rem',
        minHeight: '250px',
        outline: 'none',
    },
};

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    const commands = [
        { cmd: 'bold', label: 'B', title: 'Bold' },
        { cmd: 'italic', label: 'I', title: 'Italic' },
        { cmd: 'underline', label: 'U', title: 'Underline' },
        { cmd: 'insertUnorderedList', label: '●', title: 'Bullet List' },
        { cmd: 'insertOrderedList', label: '1.', title: 'Numbered List' }
    ];

    const handleCommand = (cmd) => {
        if (document.execCommand) {
            document.execCommand(cmd, false, null);
        }
        editor.current.focus();
    };

    return (
        <div style={editorStyles.menu}>
            {commands.map(({ cmd, label, title }) => (
                <button
                    key={cmd}
                    type="button"
                    onClick={() => handleCommand(cmd)}
                    title={title}
                    style={editorStyles.button}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};


const MyEditor = ({ initialContent = '', onContentChange, disabled = false }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = initialContent;
        }
    }, [initialContent]);

    const handleInput = () => {
        if (onContentChange && editorRef.current) {
            onContentChange(editorRef.current.innerHTML);
        }
    };

    const wrapperStyle = {
        ...editorStyles.editorWrapper,
        ...(disabled ? editorStyles.editorWrapperDisabled : {})
    };

    return (
        <div style={wrapperStyle}>
            {!disabled && <MenuBar editor={editorRef} />}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                style={editorStyles.editableArea}
            />
        </div>
    );
};
// --- Editor Компонент дууссан ---



// --- Үндсэн Засварлах Хуудасны Компонент ---
const ArticleEditPage = () => {
    const { articleId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [initialAuthorId, setInitialAuthorId] = useState(null);
    const [originalTitle, setOriginalTitle] = useState('');

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get(`/api/minds/articles/${articleId}/`);
                const articleData = response.data;

                if (!user || !articleData.author || (user.user_id !== articleData.author.id && !user.is_staff)) {
                    setError("Энэ өгүүллийг засварлах эрх танд байхгүй байна.");
                    setLoading(false);
                    return;
                }

                setTitle(articleData.title || '');
                setOriginalTitle(articleData.title || '');
                setContent(articleData.content || '');
                setInitialAuthorId(articleData.author.id);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Засварлах өгүүлэл олдсонгүй.');
                } else {
                    setError('Өгүүллийн мэдээллийг татахад алдаа гарлаа.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (articleId) { // articleId байгаа үед л fetch хийнэ
            fetchArticle();
        } else {
            setLoading(false);
            setError("Өгүүллийн дугаар олдсонгүй.")
        }
    }, [articleId, user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await apiClient.patch(`/api/minds/articles/${articleId}/`, {
                title: title,
                content: content,
            });
            navigate(`/article/${articleId}`);
        } catch (err) {
            setError('Өгүүллийг хадгалахад алдаа гарлаа.');
            console.error(err);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error && (!initialAuthorId || !user || (user.user_id !== initialAuthorId && !user.is_staff))) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Link to={initialAuthorId ? `/article/${articleId}` : "/"}> &laquo; Буцах</Link>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/article/${articleId}` }}>
                    {originalTitle || 'Өгүүлэл'}
                </Breadcrumb.Item>
                <Breadcrumb.Item active>Засварлах</Breadcrumb.Item>
            </Breadcrumb>

            <h1 className="h3 fw-bold mb-4">Өгүүлэл засварлах</h1>

            {error && initialAuthorId && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSave}>
                <Form.Group className="mb-3" controlId="articleTitle">
                    <Form.Label className="fw-semibold">Гарчиг</Form.Label>
                    <Form.Control
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3" controlId="articleContent">
                    <Form.Label className="fw-semibold">Агуулга (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)</Form.Label>
                    <MyEditor
                        initialContent={content}
                        onContentChange={setContent}
                        disabled={saving}
                    />
                </Form.Group>

                <div className="mb-3 border p-3 bg-light rounded mt-4">
                    <p className='fw-semibold small text-muted mb-2'>Урьдчилж харах:</p>
                    <MathJax hideUntilTypeset={"first"}>
                        <div
                            className="mathjax-content preview-content"
                            style={{ whiteSpace: 'normal', wordBreak: 'break-word', minHeight: '50px' }}
                            dangerouslySetInnerHTML={{ __html: content || "<span class='text-muted fst-italic'>Агуулга хоосон байна...</span>" }}
                        />
                    </MathJax>
                </div>

                <Stack direction="horizontal" gap={2} className="justify-content-end mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate(`/article/${articleId}`)} disabled={saving}>
                        Цуцлах
                    </Button>
                    <Button variant="primary" type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/>
                                Хадгалж байна...
                            </>
                        ) : (
                            'Хадгалах'
                        )}
                    </Button>
                </Stack>
            </Form>
        </Container>
    );
};

export default ArticleEditPage;

