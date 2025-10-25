// frontend/src/components/Feed.jsx
// ✅ ШИНЭЧИЛСЭН: Post устгах + Pagination (Infinite Scroll) нэмсэн

import { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../api/axiosConfig';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';

import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // (!!!) Pagination-д зориулсан state-үүд
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);

    // (!!!) Pagination-д зориулсан ref-үүд
    const loadMoreTriggerRef = useRef(null);
    const isHandlingLoadMore = useRef(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            setNextPageUrl(null); // (!!!) Анхны ачаалалт тул цэвэрлэх
            isHandlingLoadMore.current = true; // (!!!) Ачааллаж эхлэх

            const response = await apiClient.get('/api/minds/posts/');

            // Pagination шалгах
            if (response.data.results) {
                setPosts(response.data.results);
                setNextPageUrl(response.data.next); // (!!!) Дараагийн хуудсыг хадгалах
            } else if (Array.isArray(response.data)) {
                // (Fallback: Хэрэв pagination-гүй хариу ирвэл)
                setPosts(response.data);
                setNextPageUrl(null);
            } else {
                setPosts([]);
                setNextPageUrl(null);
                console.error('Unexpected API response format:', response.data);
            }
        } catch (err) {
            setError("Пост уншихад алдаа гарлаа. Backend сервер ажиллаж байгаа эсэхийг шалгана уу.");
            console.error('API Error:', err);
            console.error('Response:', err.response?.data);
        } finally {
            setLoading(false);
            // (!!!) Богино хугацааны дараа дахин ачаалахыг зөвшөөрөх
            setTimeout(() => { isHandlingLoadMore.current = false; }, 500);
        }
    };

    // (!!!) --- ШИНЭ ФУНКЦ: Нэмэлт постуудыг ачаалах ---
    const handleLoadMore = useCallback(async () => {
        if (!nextPageUrl || isHandlingLoadMore.current) {
            return;
        }

        isHandlingLoadMore.current = true;
        setLoadingMore(true);
        setError(null);

        try {
            const response = await apiClient.get(nextPageUrl);

            if (response.data && Array.isArray(response.data.results)) {
                if (response.data.results.length > 0) {
                    setPosts(prevPosts => [...prevPosts, ...response.data.results]); // (!!!) "НЭМЭХ"
                    setNextPageUrl(response.data.next);
                } else {
                    setNextPageUrl(null);
                }
            } else {
                setNextPageUrl(null);
            }
        } catch (err) {
            setError('Нэмэлт пост ачааллахад алдаа гарлаа.');
            console.error(err);
        } finally {
            setLoadingMore(false);
            setTimeout(() => {
                isHandlingLoadMore.current = false;
            }, 500);
        }
    }, [nextPageUrl]);

    // (!!!) --- ШИНЭ EFFECT: Intersection Observer ---
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && nextPageUrl && !isHandlingLoadMore.current) {
                    handleLoadMore();
                }
            }, { threshold: 1.0 }
        );
        const currentTrigger = loadMoreTriggerRef.current;
        if (currentTrigger) observer.observe(currentTrigger);
        return () => { if (currentTrigger) observer.unobserve(currentTrigger); };
    }, [nextPageUrl, handleLoadMore]);


    // Шинэ пост үүсгэсэн үед (хэвээрээ)
    const handlePostCreated = (newPost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    // ✅ Пост устгасан үед (хэвээрээ)
    const handlePostDeleted = (deletedPostId) => {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    };

    // (!!!) Анхны ачааллыг шалгах (posts.length === 0 нэмсэн)
    if (loading && posts.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Ачааллаж байна...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div>
            {/* Пост үүсгэх форм */}
            <CreatePostForm onPostCreated={handlePostCreated} />

            {/* Error */}
            {error && (
                <Alert variant="danger" className="m-3">
                    {error}
                </Alert>
            )}

            {/* Posts list */}
            {/* (!!!) Хоосон үеийн шалгалтыг !loading нэмж сайжруулсан */}
            {!loading && posts && posts.length > 0 ? (
                posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onPostDeleted={handlePostDeleted}
                    />
                ))
            ) : (
                !loading && (
                    <div className="text-center p-5 text-muted">
                        Одоогоор харуулах пост байхгүй байна. Та эхний постыг бичээрэй!
                    </div>
                )
            )}

            {/* (!!!) Infinite Scroll-н trigger */}
            <div ref={loadMoreTriggerRef} style={{ height: '20px' }} />

            {/* (!!!) Нэмэлт ачааллын spinner */}
            {loadingMore && (
                <div className="text-center mt-4 py-3">
                    <Spinner as="span" animation="border" size="sm" />
                    <span className="ms-2">Ачааллаж байна...</span>
                </div>
            )}
        </div>
    );
};

export default Feed;