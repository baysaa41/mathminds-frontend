// src/pages/GroupDetailPage.jsx
// (!!! ШИНЭ ФАЙЛ)

import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Alert from 'react-bootstrap/Alert';
import PostCard from '../components/PostCard'; // (!!!) Таны өгсөн PostCard
// import PostForm from '../components/PostForm'; // (!!!) Пост нэмэх форм (байгаа гэж таамаглав)
// import GroupMembersModal from '../components/GroupMembersModal'; // (!!!) Гишүүн удирдах Modal (үүсгэх шаардлагатай)

const GroupDetailPage = () => {
    const { id } = useParams(); // (!!!) URL-с /group/:id гэсэн :id-г авна
    const { setPageTitle } = useOutletContext();
    const [group, setGroup] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loadingGroup, setLoadingGroup] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [error, setError] = useState(null);
    // const [showMemberModal, setShowMemberModal] = useState(false); // Гишүүн удирдах

    useEffect(() => {
        setLoadingGroup(true);
        setLoadingPosts(true);
        setError(null);

        // (!!!) `id` өөрчлөгдөх бүрт 2 API-г дуудна
        fetchGroupDetails();
        fetchGroupPosts();
    }, [id]); // (!!!) id-г dependency болгох

    useEffect(() => {
        if (group?.name) {
            setPageTitle(group.name); // Layout-н гарчгийг бүлгийн нэрээр өөрчлөх
        }
    }, [group, setPageTitle]);

    const fetchGroupDetails = async () => {
        try {
            // (!!!) АЛДААГ ЗАССАН: ${id} хувьсагчийг backtick дотор зөв ашиглах
            // (!!!) Эцэст нь "/" тэмдэг нэмсэн (DRF-н standard)
            const response = await apiClient.get(`/api/integral/groups/${id}/`);
            setGroup(response.data);
        } catch (err) {
            console.error("Бүлгийн мэдээлэл авахад алдаа гарлаа:", err);
            setError("Бүлгийн мэдээллийг ачаалахад алдаа гарлаа. (404 Not Found?)");
        } finally {
            setLoadingGroup(false);
        }
    };

    const fetchGroupPosts = async () => {
        try {
            // (!!!) АЛДААГ ЗАССАН: ${id} хувьсагчийг backtick дотор зөв ашиглах
            // Backend (minds/views.py)-д тохируулсан шүүлтүүрийг ашиглах
            const response = await apiClient.get(`/api/minds/posts/?group=${id}`);
            setPosts(response.data.results || []);
        } catch (err) {
            console.error("Бүлгийн постуудыг авахад алдаа гарлаа:", err);
            // Group-г ачаалж чадаагүй бол постоо ч ачаалахгүй
            if (!error) {
                setError("Постуудыг ачаалахад алдаа гарлаа.");
            }
        } finally {
            setLoadingPosts(false);
        }
    };

    // PostForm-с шинэ пост нэмэгдэхэд дуудагдах функц
    const handleNewPost = (newPost) => {
        setPosts([newPost, ...posts]);
    };

    // Пост устгасны дараа жагсаалтаас хасах
    const handlePostDeleted = (deletedPostId) => {
        setPosts(posts.filter(post => post.id !== deletedPostId));
    };


    if (loadingGroup) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    if (error && !group) {
        return <Container className="p-3"><Alert variant="danger">{error}</Alert></Container>;
    }

    if (!group) {
        return <Container className="p-3"><p>Бүлэг олдсонгүй.</p></Container>;
    }

    return (
        <Container fluid="lg" className="p-0">
            {/* Бүлгийн мэдээлэл (Толгой хэсэг) */}
            <div className="bg-light p-3 border-bottom">
                <Stack direction="horizontal" gap={3}>
                    <div>
                        <h2 className="h4 mb-0">{group.name}</h2>
                        <p className="text-muted mb-0">{group.description}</p>
                        <small className="text-muted">
                            {group.teachers?.length || 0} багш, {group.students?.length || 0} гишүүн
                        </small>
                    </div>
                    {/* (!!!) Хэрэв багш бол (GroupDetailSerializer-с ирнэ) удирдах товч гарч ирнэ */}
                    {group.is_teacher && (
                        <div className="ms-auto">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                // onClick={() => setShowMemberModal(true)} // (!!!) Дараагийн алхамд хийх
                            >
                                <i className="bi bi-person-plus me-1"></i> Гишүүн удирдах
                            </Button>
                        </div>
                    )}
                </Stack>
            </div>

            {/* Пост нэмэх хэсэг (Зөвхөн багшид харагдана) */}
            {group.is_teacher && (
                <div className="p-3 border-bottom">
                    {/* (!!!) ЭНЭ ХЭСГИЙГ ӨӨРИЙН POSTFORM КОМПОНЕНТООР СОЛИХ */}
                    {/*
                    <PostForm
                        onPostCreated={handleNewPost}
                        // (!!!) PostForm-г group-д пост хийдэг болгож засах
                        // Backend (PostCreateSerializer)-т 'group' талбар хүлээж авна
                        groupId={group.id} // (!!!) Энэ ID-г PostForm руу дамжуулах
                        placeholderText={`${group.name}-д пост бичих...`}
                    />
                    */}
                    <Alert variant="info" className="mb-0">
                        (Тайлбар: Багшид зориулсан пост нэмэх форм энд байрлана. `PostForm`-г `groupId={group.id}` проп-той дуудна.)
                    </Alert>
                </div>
            )}

            {/* Постуудын жагсаалт */}
            <div className="p-3">
                {loadingPosts ? (
                    <div className="text-center"><Spinner size="sm" /></div>
                ) : error && posts.length === 0 ? ( // Пост ачаалахад алдаа гарвал
                    <Alert variant="danger">{error}</Alert>
                ) : posts.length === 0 ? (
                    <p className="text-muted text-center mt-3">Энэ бүлэгт пост байхгүй байна.</p>
                ) : (
                    <Stack gap={3}>
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onPostDeleted={handlePostDeleted}
                            />
                        ))}
                    </Stack>
                )}
            </div>

            {/* (!!!) Гишүүн удирдах Modal (Дараагийн алхамд хийх) */}
            {/* {group.is_teacher && (
                <GroupMembersModal
                    show={showMemberModal}
                    onHide={() => setShowMemberModal(false)}
                    group={group}
                />
            )} */}
        </Container>
    );
};

export default GroupDetailPage;