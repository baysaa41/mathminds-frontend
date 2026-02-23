// frontend/src/pages/PostDetailPage.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

import PostCard from '../components/PostCard';
import UserAvatar from '../components/UserAvatar';

import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

// ── Tree builder: flat BFS list → мод бүтэц ─────────────────
const buildTree = (posts) => {
  if (!posts.length) return null;
  const byUuid = {};
  posts.forEach(p => { byUuid[p.uuid] = { ...p, children: [] }; });
  let root = null;
  posts.forEach(p => {
    const parentUuid = p.parent_post?.uuid;
    if (parentUuid && byUuid[parentUuid]) {
      byUuid[parentUuid].children.push(byUuid[p.uuid]);
    } else if (!root) {
      root = byUuid[p.uuid];
    }
  });
  return root;
};

// ── DFS flatten: мод → дараалсан жагсаалт (DFS эрэмбэтэй) ──
const flattenDFS = (node, result = [], depth = 0) => {
  if (!node) return result;
  result.push({ ...node, thread_level: depth });
  for (const child of node.children) {
    flattenDFS(child, result, depth + 1);
  }
  return result;
};

// ── Level өнгүүд ─────────────────────────────────────────────
const LEVEL_COLORS = ['#0d6efd', '#6f42c1', '#20c997', '#fd7e14', '#dc3545'];
const levelColor = (lvl) => LEVEL_COLORS[Math.min(lvl, LEVEL_COLORS.length - 1)];

// ── Reply composer ───────────────────────────────────────────
const ReplyComposer = ({ postId, user, onReplyAdded }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  if (!user) {
    return (
      <div className="px-sm-4 px-3 py-3 border-top text-muted small">
        Хариулт бичихийн тулд нэвтэрнэ үү.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('content', content.trim());
      fd.append('parent_post', postId);
      fd.append('content_type', 'reply');
      const res = await apiClient.post('/api/minds/posts/', fd);
      onReplyAdded(res.data);
      setContent('');
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).join(' ') : 'Алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex gap-3 px-sm-4 px-3 py-3 border-top" style={{ background: '#f8f9fa' }}>
      <div className="flex-shrink-0">
        <UserAvatar user={user} size={36} />
      </div>
      <Form onSubmit={handleSubmit} className="flex-grow-1">
        {error && <Alert variant="danger" className="py-2 small mb-2">{error}</Alert>}
        <Form.Control
          as="textarea" rows={2}
          placeholder="Хариулт бичих..."
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={loading}
          className="border-0 ps-0 bg-transparent"
          style={{ boxShadow: 'none', resize: 'none' }}
        />
        <div className="d-flex justify-content-end mt-1">
          <Button
            type="submit" size="sm" variant="primary"
            disabled={loading || !content.trim()}
            className="rounded-pill px-3"
          >
            {loading ? <Spinner size="sm" /> : 'Хариулах'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// ── Үндсэн хуудас ────────────────────────────────────────────
const PostDetailPage = () => {
  const { postId } = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [thread, setThread]               = useState([]);
  const [focusedUuid, setFocusedUuid]     = useState(null);
  const [focusedPostId, setFocusedPostId] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [viewDone, setViewDone]           = useState(false);
  const focusedRef = useRef(null);

  // BFS жагсаалт → мод → DFS дараалал
  const flatList = useMemo(() => {
    const root = buildTree(thread);
    return flattenDFS(root);
  }, [thread]);

  // Thread татах
  const fetchThread = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/minds/posts/${postId}/thread/`);
      const posts = res.data.thread || [];
      setThread(posts);
      setFocusedUuid(res.data.focused_uuid);
      const focused = posts.find(p => p.uuid === res.data.focused_uuid);
      if (focused) setFocusedPostId(focused.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Thread олдсонгүй.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    setViewDone(false);
    fetchThread();
  }, [fetchThread]);

  // Focused пост руу scroll
  useEffect(() => {
    if (!loading && focusedRef.current) {
      const t = setTimeout(() => {
        focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Үзэлт
  useEffect(() => {
    if (user && !loading && focusedUuid && !viewDone) {
      setViewDone(true);
      apiClient.post(`/api/minds/posts/${postId}/view/`).catch(() => {});
    }
  }, [postId, user, loading, focusedUuid, viewDone]);

  // Пост карт дарахад focus солих
  const handleCardClick = useCallback((clickedPost) => {
    setFocusedUuid(clickedPost.uuid);
    setFocusedPostId(clickedPost.id);
    setTimeout(() => {
      focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  // Хариулт нэмэгдсэний дараа thread refresh
  const handleReplyAdded = useCallback(() => {
    fetchThread();
  }, [fetchThread]);

  // Пост устгагдсан үед жагсаалтаас хасах
  const handlePostDeleted = useCallback((deletedId) => {
    setThread(prev => prev.filter(p => p.id !== deletedId));
  }, []);

  // ── Loading / Error ──
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Алдаа</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate(-1)}>Буцах</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="my-4 ps-0 pe-2" style={{ maxWidth: '100%' }}>
      {/* Буцах */}
      <Button
        variant="link"
        onClick={() => navigate(-1)}
        className="mb-3 ms-3 ms-sm-0 p-0 text-decoration-none text-muted"
      >
        <i className="bi bi-arrow-left me-1" /> Буцах
      </Button>

      {/* Thread feed — DFS дараалал, хуучин visual */}
      <div className="bg-white overflow-hidden">
        {flatList.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-square me-2" />
            Thread олдсонгүй.
          </div>
        ) : (
          flatList.map((post, idx) => {
            const isFocused = post.uuid === focusedUuid;
            const lvl = post.thread_level ?? 0;

            return (
              <React.Fragment key={post.id}>
                <div
                  ref={isFocused ? focusedRef : null}
                  className={idx > 0 ? 'border-top' : ''}
                  style={{
                    borderLeft: `3px solid ${isFocused ? '#0d6efd' : lvl > 0 ? levelColor(lvl) + '55' : 'transparent'}`,
                    background: isFocused ? '#f0f7ff' : undefined,
                  }}
                >
                  {lvl > 0 && (
                    <div
                      className="px-3 pt-2"
                      style={{
                        fontSize: '0.72rem',
                        color: levelColor(lvl),
                        fontWeight: 500,
                        paddingLeft: `${Math.min(lvl * 12 + 12, 48)}px`,
                      }}
                    >
                      {'└ '}{'Хариулт' + (lvl > 1 ? ` (түвшин ${lvl})` : '')}
                    </div>
                  )}
                  <PostCard
                    post={post}
                    compact
                    onCardClick={handleCardClick}
                    onPostDeleted={handlePostDeleted}
                  />
                </div>

                {isFocused && (
                  <ReplyComposer
                    postId={focusedPostId}
                    user={user}
                    onReplyAdded={handleReplyAdded}
                  />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </Container>
  );
};

export default PostDetailPage;
