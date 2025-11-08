// frontend/src/components/CommentSection.jsx
import { useState, useEffect } from "react";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import PostCard from "./PostCard"; // ← үндсэн PostCard component ашиглана
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import Stack from "react-bootstrap/Stack";
import { MessageCircle } from "lucide-react";

// ----------------------
// Reply form
// ----------------------
const ReplyForm = ({ parentId, onReplyAdded, depth = 0 }) => {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            setLoading(true);
            const res = await apiClient.post("/api/minds/posts/", {
                content: content.trim(),
                parent_post: parentId,
                content_type: "reply",
            });
            onReplyAdded(res.data);
            setContent("");
        } catch (err) {
            console.error("Reply error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit} className="mt-2 ms-4">
            <Form.Control
                as="textarea"
                rows={2}
                placeholder="Хариулт бичих..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
            />
            <div className="text-end mt-1">
                <Button size="sm" type="submit" disabled={loading || !content.trim()}>
                    {loading ? <Spinner size="sm" /> : "Илгээх"}
                </Button>
            </div>
        </Form>
    );
};

// ----------------------
// Comment Section
// ----------------------
const CommentSection = ({ postId, initialCount = 0, onCountChange }) => {
    const { user } = useAuth();
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [replyCount, setReplyCount] = useState(initialCount);

    const fetchReplies = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(
                `/api/minds/posts/?parent_post=${postId}&content_type=reply`
            );
            const data = res.data.results || res.data;
            setReplies(Array.isArray(data) ? data : []);
            setReplyCount(res.data.count || data.length);
        } catch (err) {
            console.error("Fetch replies error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) fetchReplies();
    }, [show, postId]);

    // Шинээр хариулт нэмэгдэх үед
    const handleReplyAdded = (newReply) => {
        setReplies((prev) => [...prev, newReply]);
        const newCount = replyCount + 1;
        setReplyCount(newCount);
        onCountChange?.(newCount);
    };

    // ----- (!!!) ШИНЭЭР НЭМСЭН ХЭСЭГ (!!!) -----
    // Reply (PostCard) устгагдах үед
    const handleReplyDeleted = (deletedReplyId) => {
        // 1. replies state-с устгагдсан постыг шүүж хасна
        setReplies((prevReplies) =>
            prevReplies.filter((reply) => reply.id !== deletedReplyId)
        );
        // 2. Тоог нэгээр хасна
        const newCount = replyCount - 1;
        setReplyCount(newCount);
        // 3. Эцэг (PostCard/PostDetailPage) компонент руу мэдэгдэнэ
        onCountChange?.(newCount);
    };
    // ----- (!!!) ЗАСВАР ДУУССАН (!!!) -----

    return (
        <div className="comment-section mt-2">
            <Button
                variant="link"
                size="sm"
                onClick={() => setShow(!show)}
                className="p-0 text-muted text-decoration-none"
            >
                <MessageCircle size={16} className="me-1" />
                {replyCount} {show ? "▲" : "▼"}
            </Button>

            {show && (
                <div className="mt-3 ms-2">
                    {user ? (
                        <ReplyForm parentId={postId} onReplyAdded={handleReplyAdded} />
                    ) : (
                        <Alert
                            variant="info"
                            className="small py-2"
                        >
                            Хариулт бичихийн тулд нэвтэрнэ үү.
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center py-3">
                            <Spinner size="sm" />
                        </div>
                    ) : replies.length === 0 ? (
                        <div className="text-center text-muted small py-3">
                            Одоогоор хариулт алга.
                        </div>
                    ) : (
                        replies.map((reply) => (
                            <div key={reply.id} style={{ marginLeft: "2rem" }}>
                                {/* 🟢 PostCard-г дахин ашиглаж байна */}
                                <PostCard
                                    post={reply}
                                    depth={1}
                                    // ----- (!!!) ШИНЭЭР НЭМСЭН PROP (!!!) -----
                                    onPostDeleted={handleReplyDeleted}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentSection;