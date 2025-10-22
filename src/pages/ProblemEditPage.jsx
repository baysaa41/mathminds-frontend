import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap components
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Stack from 'react-bootstrap/Stack';

import { MathJax } from 'better-react-mathjax';


// --- Бие даасан Editor Компонент ---
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
        if (editor.current) {
            editor.current.focus();
        }
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


const MyEditor = ({ initialContent = '', onContentChange, disabled = false, minHeight = '250px' }) => {
    const editorRef = useRef(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (editorRef.current && initialContent && isInitialMount.current) {
            editorRef.current.innerHTML = initialContent;
            isInitialMount.current = false;
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
                style={{ ...editorStyles.editableArea, minHeight }}
                dangerouslySetInnerHTML={{ __html: initialContent }}
            />
        </div>
    );
};
// --- Editor Компонент дууссан ---



// --- Үндсэн Засварлах Хуудасны Компонент ---
const ProblemEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [statement, setStatement] = useState('');
    const [answer, setAnswer] = useState('');
    const [problemType, setProblemType] = useState(1); // Default: Multiple choice
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [initialAuthorId, setInitialAuthorId] = useState(null);
    const [originalTitle, setOriginalTitle] = useState('');
    const [choices, setChoices] = useState([]);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.get(`/api/minds/problems/${id}/`);
                const problemData = response.data;

                if (!user || !problemData.author || (user.id !== problemData.author.id && !user.is_staff)) {
                    setError("Энэ бодлогыг засварлах эрх танд байхгүй байна.");
                    setLoading(false);
                    return;
                }

                setTitle(problemData.title || '');
                setOriginalTitle(problemData.title || '');
                setStatement(problemData.statement || '');
                setAnswer(problemData.answer || '');
                setProblemType(problemData.type || 1);
                setChoices(problemData.choices || []);
                setInitialAuthorId(problemData.author.id);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError('Засварлах бодлого олдсонгүй.');
                } else {
                    setError('Бодлогын мэдээллийг татахад алдаа гарлаа.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchProblem();
        } else {
            setLoading(false);
            setError("Бодлогын дугаар олдсонгүй.")
        }
    }, [id, user?.id, user?.is_staff]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await apiClient.patch(`/api/minds/problems/${id}/`, {
                title: title,
                statement: statement,
                answer: answer,
                type: problemType,
            });
            navigate(`/problem/${id}`);
        } catch (err) {
            setError('Бодлогыг хадгалахад алдаа гарлаа.');
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

    if (error && (!initialAuthorId || !user || (user.id !== initialAuthorId && !user.is_staff))) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Link to={initialAuthorId ? `/problem/${id}` : "/"}> &laquo; Буцах</Link>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Breadcrumb listProps={{ className: "mb-3" }}>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Нүүр</Breadcrumb.Item>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/problem/${id}` }}>
                    {originalTitle || 'Бодлого'}
                </Breadcrumb.Item>
                <Breadcrumb.Item active>Засварлах</Breadcrumb.Item>
            </Breadcrumb>

            <h1 className="h3 fw-bold mb-4">Бодлого засварлах</h1>

            {error && initialAuthorId && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSave}>
                {/* Гарчиг */}
                <Form.Group className="mb-3" controlId="problemTitle">
                    <Form.Label className="fw-semibold">Гарчиг</Form.Label>
                    <Form.Control
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={saving}
                        placeholder="Бодлогын гарчиг..."
                    />
                </Form.Group>

                {/* Төрөл */}
                <Form.Group className="mb-3" controlId="problemType">
                    <Form.Label className="fw-semibold">Бодлогын төрөл</Form.Label>
                    <Form.Select
                        value={problemType}
                        onChange={(e) => setProblemType(parseInt(e.target.value))}
                        disabled={saving}
                    >
                        <option value={0}>Уламжлалт</option>
                        <option value={1}>Сонгох тест</option>
                        <option value={4}>Нөхөх тест</option>
                    </Form.Select>
                </Form.Group>

                {/* Бодлогын нөхцөл (statement) */}
                <Form.Group className="mb-3" controlId="problemStatement">
                    <Form.Label className="fw-semibold">Бодлогын нөхцөл (LaTeX ашиглаж болно: $...$ эсвэл $$...$$)</Form.Label>
                    <MyEditor
                        initialContent={statement}
                        onContentChange={setStatement}
                        disabled={saving}
                        minHeight="200px"
                    />
                </Form.Group>

                {/* Хариулт */}
                <Form.Group className="mb-3" controlId="problemAnswer">
                    <Form.Label className="fw-semibold">Хариулт (Зөвхөн зохиогч болон админ харна)</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={saving}
                        placeholder="Бодлогын хариулт..."
                    />
                </Form.Group>

                {/* Сонголтууд харуулах (зөвхөн унших горимд) */}
                {problemType === 1 && choices && choices.length > 0 && (
                    <div className="mb-3">
                        <Form.Label className="fw-semibold">Одоо байгаа сонголтууд:</Form.Label>
                        <div className="list-group">
                            {choices.map((choice, index) => (
                                <div key={choice.id || index} className="list-group-item">
                                    <strong>{choice.label || `${String.fromCharCode(65 + index)}.`}</strong> {choice.value}
                                    {choice.default_score > 0 && <span className="badge bg-success ms-2">Зөв</span>}
                                </div>
                            ))}
                        </div>
                        <Form.Text className="text-muted">
                            Сонголтуудыг засварлах функц удахгүй нэмэгдэх болно.
                        </Form.Text>
                    </div>
                )}

                {/* Урьдчилж харах */}
                <div className="mb-3 border p-3 bg-light rounded mt-4">
                    <p className='fw-semibold small text-muted mb-2'>Урьдчилж харах:</p>

                    {/* Title урьдчилж харах */}
                    {title && (
                        <div className="mb-3 pb-3 border-bottom">
                            <p className="fw-semibold small text-secondary mb-1">Гарчиг:</p>
                            <MathJax hideUntilTypeset={"first"}>
                                <div className="mathjax-content fw-bold">
                                    {title}
                                </div>
                            </MathJax>
                        </div>
                    )}

                    {/* Statement урьдчилж харах */}
                    <p className="fw-semibold small text-secondary mb-1">Бодлогын нөхцөл:</p>
                    <MathJax hideUntilTypeset={"first"}>
                        <div
                            className="mathjax-content preview-content"
                            style={{ whiteSpace: 'normal', wordBreak: 'break-word', minHeight: '50px' }}
                            dangerouslySetInnerHTML={{ __html: statement || "<span class='text-muted fst-italic'>Нөхцөл хоосон байна...</span>" }}
                        />
                    </MathJax>
                </div>

                {/* Товчнууд */}
                <Stack direction="horizontal" gap={2} className="justify-content-end mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate(`/problem/${id}`)} disabled={saving}>
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

export default ProblemEditPage;