// frontend/src/components/PostCard.jsx
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import {useAuth} from '../context/AuthContext';

// Components
import LivePreview from './LivePreview';
import UserAvatar from './UserAvatar';
import EmbedRenderer from './EmbedRenderer';
import CommentSection from './CommentSection'; // (!!! НЭМСЭН !!!)

// React Bootstrap
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';

// -------------------------------------------------------------------
// ----------------- PostImageGallery (Туслах компонент) -----------------
// -------------------------------------------------------------------
const PostImageGallery = ({images}) => {
    if (!images || images.length === 0) return null;

    // 1. Нэг зураг байвал: Бүтэн өргөнөөр
    if (images.length === 1) {
        return (
            <img
                src={images[0].image}
                className="img-fluid rounded my-2 post-image"
                alt="Post attachment"
                style={{maxHeight: '500px', objectFit: 'cover', width: '100%'}}
            />
        );
    }

    // 2. 2-4 зураг байвал: Grid
    const gridTemplateColumns = (images.length === 2 || images.length === 4) ? '1fr 1fr' : '1fr 1fr';
    const gap = '4px';

    return (
        <div
            className="my-2 post-image-gallery"
            style={{
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns,
                gap: gap,
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            {images.slice(0, 4).map((img, index) => (
                <div
                    key={img.id}
                    className="position-relative"
                    style={{
                        paddingTop: '100%',
                        background: `url(${img.image}) no-repeat center center`,
                        backgroundSize: 'cover',
                        cursor: 'pointer'
                    }}
                >
                    {images.length > 4 && index === 3 && (
                        <div
                            className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                            }}
                        >
                            +{images.length - 4}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// -------------------------------------------------------------------
// ----------------- PostContent (Туслах компонент) ------------------
// -------------------------------------------------------------------
const PostContent = ({post}) => {
    if (!post) return null;

    // Энэ хэсэг хэвээрээ (post, repost, reply-г алгасна)
    if (post.content_type === 'post' || post.content_type === 'repost' || post.content_type === 'reply') {
        return null;
    }

    const relatedItem =
        post.related_problem ||
        post.related_formula ||
        post.related_article ||
        post.related_quiz;

    if (!relatedItem)
        return <div className="text-muted fst-italic">[Холбоотой контент олдсонгүй]</div>;

    let title = relatedItem.title || relatedItem.name || `Контент #${relatedItem.id}`;


    // (!!! ЗАСВАР: description-г энд тодорхойлно !!!)
    let description =
        relatedItem.statement ||  // Бодлогын 'statement'
        relatedItem.content ||      // Томьёо, Өгүүллийн 'content'
        relatedItem.abstract ||     // Өгүүллийн 'abstract'
        relatedItem.description ||    // Тестийн 'description'
        '';

    // (!!! ЗАСВАР: typeLabel БА badgeVariant-г хамт тодорхойлно !!!)
    let typeLabel;
    let badgeVariant; // Badge өнгийг хадгалах хувьсагч
    let content;

    switch (post.content_type) {
        case 'problem':
            typeLabel = 'Бодлого';
            badgeVariant = 'secondary'; // Цэнхэр
            break;
        case 'formula':
            typeLabel = 'Томьёо';
            badgeVariant = 'info'; // Ногоон
            content = post.content || '';
            break;
        case 'article':
            typeLabel = 'Өгүүлэл';
            badgeVariant = 'danger';    // Цайвар цэнхэр
            break;
        case 'quiz':
            typeLabel = 'Тест';
            badgeVariant = 'success'; // Шар
            break;
        default:
            typeLabel = 'Контент';
            badgeVariant = 'warning'; // Саарал
    }

    // (!!! ЗАСВAR: Бодлого, Томьёо бол бүтэн, бусад бол товч харуулна !!!)
    const contentToShow = (post.content_type === 'problem' || post.content_type === 'formula')
        ? description // <-- Бодлого, Томьёо бол бүтнээр нь харуулна
        : description.substring(0, 100) + (description.length > 100 ? '...' : ''); // <-- Бусад үед (өгүүлэл, тест) товчилж харуулна

    return (
        <>
            <LivePreview content={post.content}/>
            <Card className="bg-light border shadow-sm mt-2">
                <Card.Body>
                    {/* (!!! ЗАСВАР: badgeVariant-г ашигласан !!!) */}
                    <Badge bg={badgeVariant} className="mb-2">{typeLabel}</Badge>

                    <Card.Title className="h6 mathjax-content mb-1">
                        <LivePreview content={title}/>

                    </Card.Title>

                    {/* (!!! ЗАСВАР: contentToShow-г ашигласан !!!) */}
                    {description && (
                        <Card.Text as="div" className="small text-muted mathjax-content"
                                   style={{whiteSpace: 'pre-wrap'}}>
                            <LivePreview content={contentToShow}/>
                        </Card.Text>
                    )}
                </Card.Body>
            </Card>
        </>
    );
};

// -------------------------------------------------------------------
// ----------------- Үндсэн PostCard компонент -----------------
// -------------------------------------------------------------------
const PostCard = ({post, onPostDeleted, depth = 0}) => {
    const {user} = useAuth();
    const navigate = useNavigate();

    const [isFavorited, setIsFavorited] = useState(post.is_favored);
    const [favoriteCount, setFavoriteCount] = useState(post.favorite_count || 0);
    const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
    const [isReposting, setIsReposting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    // (!!! Comment Count State нэмсэн !!!)
    const [commentCount, setCommentCount] = useState(post.replies_count || 0);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentViewCount, setCurrentViewCount] = useState(
        (post.reposted_post ? post.reposted_post.view_count : post.view_count) || 0
    );
    const [viewCountIncremented, setViewCountIncremented] = useState(false);
    const cardRef = useRef(null);

    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    // --- Үйлдлүүд (Actions) ---

    // Favorite / Bookmark
    const handleAction = async (actionType, e) => {
        e.stopPropagation();
        if (!user) {
            showNotification('Энэ үйлдлийг хийхийн тулд нэвтэрнэ үү.', 'warning');
            return;
        }

        let url;
        switch (actionType) {
            case 'favorite':
                url = `/api/minds/posts/${post.id}/favorite/`;
                break;
            case 'bookmark':
                url = `/api/minds/posts/${post.id}/bookmark/`;
                break;
            default:
                return;
        }

        try {
            const response = await apiClient.post(url);
            if (actionType === 'favorite') {
                setIsFavorited(response.data.is_favored);
                setFavoriteCount(response.data.favorite_count);
            } else if (actionType === 'bookmark') {
                setIsBookmarked(response.data.is_bookmarked);
            }
        } catch (err) {
            console.error(`Failed to ${actionType} post:`, err);
            showNotification(`Үйлдэл амжилтгүй боллоо (${actionType})`, 'danger');
        }
    };

    // Repost
    const handleRepost = async (e) => {
        e.stopPropagation();
        if (!user) {
            showNotification('Repost хийхийн тулд нэвтэрнэ үү.', 'warning');
            return;
        }

        if (isReposting) return;
        if (post.content_type === 'repost') {
            showNotification('Repost хийгдсэн постыг дахин repost хийх боломжгүй.', 'warning');
            return;
        }

        const targetPostId = post.reposted_post ? post.reposted_post.id : post.id;

        setIsReposting(true);
        try {
            const response = await apiClient.post(`/api/minds/posts/${targetPostId}/repost/`);
            if (response.status === 201) {
                showNotification('Амжилттай repost хийлээ!', 'success');
            } else if (response.status === 200) {
                showNotification(response.data.message || 'Та аль хэдийн repost хийсэн байна.', 'info');
            }
        } catch (err) {
            console.error('Failed to repost:', err);
            showNotification(err.response?.data?.error || 'Repost хийхэд алдаа гарлаа.', 'danger');
        } finally {
            setIsReposting(false);
        }
    };

    // Delete
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await apiClient.delete(`/api/minds/posts/${post.id}/`);
            showNotification('Пост амжилттай устлаа.', 'success');
            if (onPostDeleted) onPostDeleted(post.id);
        } catch (err) {
            console.error('Failed to delete post:', err);
            showNotification(err.response?.data?.detail || 'Пост устгахад алдаа гарлаа.', 'danger');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Navigation
    const navigateToPost = (e) => {
        if (e.target.closest('a, button, .dropdown-toggle, .dropdown-item, .post-actions')) {
            e.stopPropagation();
            return;
        }

        if (post.content_type === 'repost' && post.reposted_post) {
            navigate(`/post/${post.reposted_post.id}`);
        } else {
            navigate(`/post/${post.id}`);
        }
    };

    // (!!! View Count - Reply (depth > 0) бол ажиллахгүй !!!)
    const incrementViewCount = useCallback(async () => {
        if (!user || viewCountIncremented) return;

        setViewCountIncremented(true);
        try {
            const targetId = post.reposted_post ? post.reposted_post.id : post.id;
            const response = await apiClient.post(`/api/minds/posts/${targetId}/view/`);
            if (response.data && response.data.view_count !== undefined)
                setCurrentViewCount(response.data.view_count);
        } catch (err) {
            console.error(`Failed to increment view count for post ${post.id}:`, err);
        }
    }, [user, post.id, post.reposted_post, viewCountIncremented]);

    useEffect(() => {
        if (!user || viewCountIncremented) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    incrementViewCount();
                    if (cardRef.current) observer.unobserve(cardRef.current);
                }
            },
            {threshold: 0.5}
        );
        const currentCardRef = cardRef.current;
        if (currentCardRef) observer.observe(currentCardRef);
        return () => {
            if (currentCardRef) observer.unobserve(currentCardRef);
        };
    }, [incrementViewCount, viewCountIncremented, user]);

    // (!!! Comment Count өөрчлөгдөх үед callback !!!)
    const handleCommentCountChange = useCallback((newCount) => {
        setCommentCount(newCount);
    }, []);

    // --- Render-д зориулсан хувьсагчид ---
    const canEditOrDelete = user && post.author && (user.id === post.author.id || user.is_staff);
    const isRepost = post.content_type === 'repost' && post.reposted_post;
    const originalPost = isRepost ? post.reposted_post : post;
    const originalAuthor = originalPost?.author;
    const reposterAuthor = isRepost ? post.author : null;

    if (!originalAuthor) {
        return (
            <Card className="shadow-sm m-3 post-card">
                <Card.Body>
                    <p className="text-muted text-center">Энэ контент олдсонгүй (зохиогч устгасан байж магадгүй).</p>
                </Card.Body>
            </Card>
        );
    }

    const getModalTitle = () => {
        if (post.content_type === 'reply') return "Сэтгэгдэл устгах";
        if (isRepost) return "Repost устгах";
        return "Пост устгах";
    };

    return (
        <>
            <ToastContainer position="top-end" className="p-3" style={{zIndex: 9999}}>
                <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide bg={toastVariant}>
                    <Toast.Body className={toastVariant === 'light' ? 'text-dark' : 'text-white'}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h5">{getModalTitle()}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Та
                    энэ {post.content_type === 'reply' ? "сэтгэгдлийг" : (isRepost ? "repost-г" : "постыг")} устгахдаа
                    итгэлтэй байна уу?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Болих
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner as="span" size="sm" className="me-1"/> :
                            <i className="bi bi-trash me-1"></i>}
                        Устгах
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- Үндсэн Пост Карт --- */}
            <Card
                ref={cardRef}
                className={`shadow-sm m-3 post-card ${depth > 0 ? 'post-reply-card' : ''}`}
                onClick={depth > 0 ? undefined : navigateToPost}
                style={{cursor: depth > 0 ? 'default' : 'pointer'}}
            >
                {/* Repost мэдээлэл */}
                {isRepost && reposterAuthor && (
                    <div className="text-muted small px-3 pt-2 pb-1 border-bottom bg-light">
                        <i className="bi bi-repeat me-2"></i>
                        <Link to={`/profile/${reposterAuthor.username}`} onClick={(e) => e.stopPropagation()}
                              className="fw-bold text-decoration-none text-dark">
                            {reposterAuthor.first_name || reposterAuthor.email}
                        </Link>
                        <span className="ms-1">reminded</span>
                    </div>
                )}

                <Card.Body className="pb-2">
                    {/* Repost-н өөрийнх нь сэтгэгдэл */}
                    {isRepost && post.content && (
                        <div className="mb-2">
                            <LivePreview content={post.content}/>
                        </div>
                    )}

                    {/* Repost-н өөрийнх нь зургууд */}
                    {isRepost && post.images && post.images.length > 0 && (
                        <div className="mt-2">
                            <PostImageGallery images={post.images}/>
                        </div>
                    )}

                    {/* Repost-н өөрийнх нь embed */}
                    {isRepost && post.embed_link && (
                        <EmbedRenderer url={post.embed_link}/>
                    )}

                    {/* Эх постын хэсэг */}
                    <div className={isRepost ? "reposted-content-wrapper border rounded p-3" : ""}>

                        {/* Зохиогчийн мэдээлэл */}
                        <Stack direction="horizontal" gap={3} className="align-items-start mb-2">
                            <Link to={`/profile/${originalAuthor.username}`} onClick={(e) => e.stopPropagation()}>
                                <UserAvatar user={originalAuthor} size={40}/>
                            </Link>
                            <div className="flex-grow-1">
                                <Link to={`/profile/${originalAuthor.username}`} onClick={(e) => e.stopPropagation()}
                                      className="fw-bold text-decoration-none text-dark mb-0">
                                    {originalAuthor.first_name || originalAuthor.email}
                                </Link>
                                <p className="text-muted small mb-0"
                                   title={new Date(originalPost.created_at).toISOString()}>
                                    {new Date(originalPost.created_at).toLocaleString('mn-MN', {
                                        dateStyle: 'short',
                                        timeStyle: 'short'
                                    })}
                                </p>
                            </div>

                            {/* Устгах / Засах товч */}
                            {canEditOrDelete && (
                                <Dropdown align="end" onClick={(e) => e.stopPropagation()}>
                                    <Dropdown.Toggle variant="link" size="sm" className="text-muted no-caret p-0"
                                                     id={`dropdown-post-${post.id}`}>
                                        <i className="bi bi-three-dots-vertical"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={handleDeleteClick} className="text-danger">
                                            Устгах
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            )}
                        </Stack>

                        {/* Постын үндсэн агуулга */}
                        <div className="post-body-content">
                            {/* Энгийн бичвэр */}
                            {(originalPost.content_type === 'post' || originalPost.content_type === 'reply') && originalPost.content && (
                                <LivePreview content={originalPost.content}/>
                            )}

                            {/* Зургийн Галерей */}
                            <PostImageGallery images={originalPost.images}/>

                            {/* Холбоотой контент */}
                            {originalPost.content_type !== 'post' && originalPost.content_type !== 'reply' && (
                                <PostContent post={originalPost}/>
                            )}

                            {/* Embed */}
                            {originalPost.embed_link && (
                                <EmbedRenderer url={originalPost.embed_link}/>
                            )}
                        </div>
                    </div>

                    {/* (!!! COMMENT SECTION - Feed дээр л харуулна (depth === 0) !!!) */}
                    {depth === 0 && (
                        <CommentSection
                            postId={post.id}
                            initialCount={commentCount}
                            onCountChange={handleCommentCountChange}
                            defaultExpanded={false}  // Feed дээр collapsed байна
                        />
                    )}

                </Card.Body>

                {/* --- FOOTER: Үйлдлийн товчнууд --- */}
                <Card.Footer className="bg-white border-top-0 pt-0">
                    <Stack direction="horizontal" gap={3} className="post-actions align-items-center">
                        {/* Таалагдсан */}
                        <Button
                            variant="link"
                            className="text-decoration-none p-1 d-flex align-items-center text-muted"
                            onClick={(e) => handleAction('favorite', e)}
                            title="Таалагдсан"
                        >
                            <i className={`bi ${isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                            <span className={`ms-1 small ${isFavorited ? 'text-danger' : ''}`}>{favoriteCount}</span>
                        </Button>

                        {/* Коммент (State-с авсан тоо) */}
                        <div
                            className="text-muted p-1 d-flex align-items-center"
                            style={{cursor: 'default'}}
                            title="Сэтгэгдэл"
                        >
                            <i className="bi bi-chat-square me-1"></i>
                            <span className="ms-1 small">{commentCount}</span>
                        </div>

                        {/* Үзэлт */}
                        <span className="text-muted small ms-2 d-flex align-items-center" title="Үзсэн тоо">
                            <i className="bi bi-eye me-1"></i>
                            {currentViewCount || 0}
                        </span>

                        {/* Хадгалах */}
                        <Button
                            variant="link"
                            className={`text-decoration-none ms-auto p-1 ${isBookmarked ? 'text-primary' : 'text-muted'}`}
                            onClick={(e) => handleAction('bookmark', e)}
                            title="Хадгалах"
                        >
                            <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                        </Button>

                        {/* Repost */}
                        <Button
                            variant="link"
                            className="text-decoration-none text-muted p-1"
                            onClick={handleRepost}
                            disabled={isReposting || post.content_type === 'repost'}
                            title={post.content_type === 'repost' ? "Дахин repost хийх боломжгүй" : "Repost"}
                        >
                            {isReposting ? <Spinner as="span" size="sm"/> : <i className="bi bi-repeat"></i>}
                        </Button>
                    </Stack>
                </Card.Footer>
            </Card>
        </>
    );
};

export default PostCard;