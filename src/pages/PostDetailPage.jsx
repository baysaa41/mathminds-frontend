// frontend/src/pages/PostDetailPage.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';

import PostCard from '../components/PostCard';
import UserAvatar from '../components/UserAvatar';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

import Container from 'react-bootstrap/Container';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import CloseButton from 'react-bootstrap/CloseButton';

// ── Tree builder: flat list (ancestor + thread) → tree ───────
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
  // Нэг эцэгтэй хариултуудыг created_at өсөх дарааллаар эрэмбэлнэ
  Object.values(byUuid).forEach(node => {
    node.children.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  });
  return root;
};

// ── Root-аас target хүртэлх UUID замыг олох ─────────────────
const findPath = (node, targetUuid, path = []) => {
  if (!node) return null;
  const current = [...path, node.uuid];
  if (node.uuid === targetUuid) return current;
  for (const child of node.children) {
    const result = findPath(child, targetUuid, current);
    if (result) return result;
  }
  return null;
};

// ── DFS traverse: only show children of expanded nodes ───────
const buildVisibleList = (node, expandedSet, result = [], depth = 0) => {
  if (!node) return result;
  result.push({ ...node, _depth: depth });
  if (expandedSet.has(node.uuid)) {
    for (const child of node.children) {
      buildVisibleList(child, expandedSet, result, depth + 1);
    }
  }
  return result;
};

// ── Reply composer ───────────────────────────────────────────
const ReplyComposer = ({ postId, user, onReplyAdded }) => {
  const [content, setContent]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [imageFiles, setImageFiles]   = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const imageInputRef = useRef(null);

  if (!user) {
    return (
      <div className="px-sm-4 px-3 py-3 border-top text-muted small">
        Хариулт бичихийн тулд нэвтэрнэ үү.
      </div>
    );
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (files.length + imageFiles.length > 10) {
      setError('Нэг дор 10-аас ихгүй зураг хавсаргах боломжтой.');
      e.target.value = null;
      return;
    }
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = null;
  };

  const clearImage = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && imageFiles.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('content', content.trim());
      fd.append('parent_post', postId);
      fd.append('content_type', 'reply');
      imageFiles.forEach(f => fd.append('images', f));
      const res = await apiClient.post('/api/minds/posts/', fd);
      onReplyAdded(res.data);
      setContent('');
      setImageFiles([]);
      setImagePreviews([]);
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'object' ? Object.values(d).join(' ') : 'Алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-sm-4 px-3 py-3 border-top" style={{ background: '#f8f9fa' }}>
      <div className="d-flex gap-3">
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
          {/* Зургийн preview */}
          {imagePreviews.length > 0 && (
            <div className="d-flex flex-wrap mt-2" style={{ gap: 8 }}>
              {imagePreviews.map((src, i) => (
                <div key={i} className="position-relative" style={{ width: 80, height: 80 }}>
                  <CloseButton
                    onClick={() => clearImage(i)}
                    className="position-absolute top-0 end-0 bg-light p-1"
                    style={{ fontSize: '0.6em', zIndex: 1, opacity: 0.8 }}
                  />
                  <Image
                    src={src} thumbnail
                    style={{ width: 80, height: 80, objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="d-flex align-items-center justify-content-between mt-1">
            {/* Зураг хавсаргах товч */}
            <Button
              variant="link" size="sm"
              className="p-0 text-secondary text-decoration-none"
              onClick={() => imageInputRef.current?.click()}
              disabled={loading || imageFiles.length >= 10}
            >
              <i className="bi bi-images me-1" />
              {imageFiles.length > 0 ? `${imageFiles.length} / 10` : 'Зураг'}
            </Button>
            <Button
              type="submit" size="sm" variant="primary"
              disabled={loading || (!content.trim() && imageFiles.length === 0)}
              className="rounded-pill px-3"
            >
              {loading ? <Spinner size="sm" /> : 'Хариулах'}
            </Button>
          </div>
          <Form.Control
            type="file" accept="image/*" multiple
            ref={imageInputRef}
            onChange={handleImageChange}
            className="d-none"
          />
        </Form>
      </div>
    </div>
  );
};

const TYPE_LABELS = {
  post:    'Mind',
  reply:   'Хариулт',
  repost:  'Дахин пост',
  problem: 'Бодлого',
  article: 'Өгүүлэл',
  formula: 'Томьёо',
  quiz:    'Тест',
};

// ── Үндсэн хуудас ────────────────────────────────────────────
const PostDetailPage = () => {
  const { postId } = useParams();
  const { user }   = useAuth();
  const { setPageTitle } = useOutletContext() || {};

  const [ancestors, setAncestors]         = useState([]);
  const [thread, setThread]               = useState([]);
  const [focusedUuid, setFocusedUuid]     = useState(null);
  const [focusedPostId, setFocusedPostId] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [viewDone, setViewDone]           = useState(false);
  const [expandedSet, setExpandedSet]     = useState(() => new Set());

  const focusedRef = useRef(null);
  const topRef     = useRef(null);

  // Unified tree from ancestors + thread
  const allPosts  = useMemo(() => [...ancestors, ...thread], [ancestors, thread]);
  const treeRoot  = useMemo(() => buildTree(allPosts), [allPosts]);

  // Depth of focused post in the unified tree = number of ancestors
  const focusedDepth = ancestors.length;

  // Одоогийн замын ancestor мэдээлэл:
  //   ancestorUuidSet — ancestor-ийн UUID-ууд (focused хасагдсан)
  //   ancestorRatioMap — UUID → [0..1] (0=root, 1=parent of focused) гэсэн харьцаа
  const { ancestorUuidSet, ancestorRatioMap } = useMemo(() => {
    const path = findPath(treeRoot, focusedUuid);
    if (!path || path.length <= 1) return { ancestorUuidSet: new Set(), ancestorRatioMap: new Map() };
    const uuidSet  = new Set();
    const ratioMap = new Map();
    const total    = path.length - 1; // ancestor-ийн тоо
    path.slice(0, total).forEach((uuid, idx) => {
      uuidSet.add(uuid);
      ratioMap.set(uuid, total === 1 ? 1 : idx / (total - 1)); // 0.0→1.0
    });
    return { ancestorUuidSet: uuidSet, ancestorRatioMap: ratioMap };
  }, [treeRoot, focusedUuid]);

  // DFS list filtered by expandedSet
  const visibleList = useMemo(
    () => buildVisibleList(treeRoot, expandedSet),
    [treeRoot, expandedSet]
  );

  // ── Thread татах (нэг удаа) ──────────────────────────────
  const fetchThread = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res   = await apiClient.get(`/api/minds/posts/${postId}/thread/`);
      const ancs  = res.data.ancestors || [];
      const posts = res.data.thread    || [];

      setAncestors(ancs);
      setThread(posts);
      setFocusedUuid(res.data.focused_uuid);

      const focused = posts.find(p => p.uuid === res.data.focused_uuid);
      if (focused) {
        setFocusedPostId(focused.id);
        if (setPageTitle) {
          const typeLabel = TYPE_LABELS[focused.content_type] || 'Пост';
          const relatedItem =
            focused.related_problem || focused.related_formula ||
            focused.related_article || focused.related_quiz;
          const relatedTitle = relatedItem?.title || relatedItem?.name;
          const author = focused.author?.username || focused.author?.display_name || '';
          const snippet = focused.content?.trim().split(/\s+/).slice(0, 3).join(' ');
          const title = relatedTitle
            ? `${typeLabel} · ${relatedTitle}`
            : `${typeLabel}${snippet ? ' · ' + snippet : author ? ' · @' + author : ''}`;
          setPageTitle(title);
        }
      }

      // Анхны expanded байдал:
      //   - Бүх ancestor expanded (дараагийнхаа хариулт харагдана)
      //   - Focused expanded (яг дараагийн түвшин харагдана)
      //   - Бусад нь collapsed
      const set = new Set();
      ancs.forEach(p => set.add(p.uuid));
      if (res.data.focused_uuid) set.add(res.data.focused_uuid);
      setExpandedSet(set);
    } catch (err) {
      setError(err.response?.data?.detail || 'Thread олдсонгүй.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
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

  // Accordion toggle — шинэ дата дуудахгүй
  const toggleExpand = useCallback((post) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(post.uuid)) next.delete(post.uuid);
      else next.add(post.uuid);
      return next;
    });
  }, []);

  // Пост дарахад фокуслах:
  //   expandedSet = root → focused замын бүх UUID (focused өөрөө багтана)
  //   → focused хүртэлх зам expanded, бусад collapsed, focused-ийн хүүхдүүд харагдана
  const handleCardClick = useCallback((post) => {
    setFocusedUuid(post.uuid);
    setFocusedPostId(post.id);
    const path = findPath(treeRoot, post.uuid);
    setExpandedSet(new Set(path ?? [post.uuid]));
  }, [treeRoot]);

  // Хариулт нэмэгдсэний дараа refresh
  const handleReplyAdded = useCallback(() => {
    fetchThread();
  }, [fetchThread]);

  // AI reply хадгалагдсаны дараа reload хийлгүй thread-д шууд нэмэх
  const handleAIReplyAdded = useCallback((newPost) => {
    setThread(prev => [...prev, newPost]);
    // Эцэг постыг expand хийж шинэ reply харагдуулах
    if (newPost.parent_post?.uuid) {
      setExpandedSet(prev => {
        const next = new Set(prev);
        next.add(newPost.parent_post.uuid);
        return next;
      });
    }
  }, []);

  // Пост устгагдсан үед
  const handlePostDeleted = useCallback((deletedId) => {
    setAncestors(prev => prev.filter(p => p.id !== deletedId));
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
          <AppBreadcrumb items={[{ label: 'Пост' }]} />
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid ref={topRef} className="my-4 ps-0 pe-2" style={{ maxWidth: '100%' }}>
      <AppBreadcrumb className="mb-3" items={[{ label: 'Пост' }]} />

      <div className="bg-white overflow-hidden">
        {visibleList.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-chat-square me-2" />
            Thread олдсонгүй.
          </div>
        ) : (
          visibleList.map((post, idx) => {
            const isFocused  = post.uuid === focusedUuid;
            const isAncestor = ancestorUuidSet.has(post.uuid);
            const depth      = post._depth ?? 0;
            // Focused постоос харьцангуй гүн: 0=focused, 1=direct reply, …
            const replyDepth = depth - focusedDepth;
            const isExpanded  = expandedSet.has(post.uuid);
            const hasChildren = post.children?.length > 0;

            // Ancestor/focused-ийг toggle хийхгүй
            const isToggleable = !isAncestor && !isFocused && hasChildren;

            // Ancestor: root (0.3 opacity) → parent of focused (0.85 opacity) → focused (1.0)
            const borderColor = isFocused
              ? '#0d6efd'
              : isAncestor
              ? `rgba(13,110,253,${(0.3 + (ancestorRatioMap.get(post.uuid) ?? 0) * 0.55).toFixed(2)})`
              : '#dee2e6';

            return (
              <React.Fragment key={post.id}>
                <div
                  ref={isFocused ? focusedRef : null}
                  className={idx > 0 ? 'border-top' : ''}
                  style={{
                    borderLeft: `3px solid ${borderColor}`,
                    background: isFocused ? '#f0f7ff' : undefined,
                  }}
                >
                  {/* Reply label */}
                  {replyDepth > 0 && (
                    <div
                      className="px-3 pt-2 text-muted"
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        paddingLeft: `${Math.min(replyDepth * 12 + 12, 48)}px`,
                      }}
                    >
                      {'└ '}{'Хариулт' + (replyDepth > 1 ? ` (түвшин ${replyDepth})` : '')}
                    </div>
                  )}

                  <PostCard
                    post={post}
                    compact
                    onCardClick={handleCardClick}
                    onPostDeleted={handlePostDeleted}
                    onAIReplyAdded={handleAIReplyAdded}
                  />

                  {/* Collapsed: "N хариулт харах" */}
                  {isToggleable && !isExpanded && (
                    <div
                      className="pb-2"
                      style={{ paddingLeft: `${Math.min(replyDepth * 12 + 16, 52)}px` }}
                    >
                      <Button
                        variant="link" size="sm"
                        className="p-0 text-muted text-decoration-none"
                        onClick={() => toggleExpand(post)}
                      >
                        <i className="bi bi-chevron-down me-1" style={{ fontSize: '0.7rem' }} />
                        <span style={{ fontSize: '0.75rem' }}>
                          {post.children.length} хариулт харах
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Expanded: "нуух" */}
                  {isToggleable && isExpanded && (
                    <div
                      className="pb-1"
                      style={{ paddingLeft: `${Math.min(replyDepth * 12 + 16, 52)}px` }}
                    >
                      <Button
                        variant="link" size="sm"
                        className="p-0 text-muted text-decoration-none"
                        onClick={() => toggleExpand(post)}
                      >
                        <i className="bi bi-chevron-up me-1" style={{ fontSize: '0.7rem' }} />
                        <span style={{ fontSize: '0.75rem' }}>нуух</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reply composer focused постын яг доор */}
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
