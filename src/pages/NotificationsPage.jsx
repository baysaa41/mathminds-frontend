// frontend/src/pages/NotificationsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Badge, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import { mathJaxConfig } from '../mathjax.config.js';
import { getNotifications, markAllAsRead, markAsRead, markGroupAsRead } from '../services/notificationService';
import { formatRelativeDate } from '../utils/dateFormatter';
import { stripPSTricks } from '../utils/stripPSTricks.js';

const TABS = [
  { key: null,      label: 'Бүгд',       icon: 'bi-bell' },
  { key: 'like',    label: 'Таалагдлаа', icon: 'bi-heart-fill' },
  { key: 'reply',   label: 'Хариулт',    icon: 'bi-chat-left-text' },
  { key: 'club',    label: 'Клуб',       icon: 'bi-people-fill' },
  { key: 'message', label: 'Мессеж',     icon: 'bi-envelope-fill' },
];

const getNotifIcon = (verb) => {
  if (verb?.includes('таалагдлаа')) return 'bi-heart-fill text-danger';
  if (verb?.includes('хариулт')) return 'bi-chat-left-text text-primary';
  if (verb?.includes('клубт')) return 'bi-people-fill text-success';
  if (verb?.includes('мессеж')) return 'bi-envelope-fill text-warning';
  return 'bi-bell text-secondary';
};

const formatActorText = (notif) => {
  if (notif.is_grouped && notif.grouped_actors?.length > 0) {
    const actors = notif.grouped_actors;
    const total = notif.total_actor_count;
    if (total === 2) {
      return `${actors[0].username} болон ${actors[1]?.username ?? ''}`;
    } else if (total === 3 && actors.length >= 3) {
      return `${actors[0].username}, ${actors[1].username} болон ${actors[2].username}`;
    } else if (total > 2) {
      return `${actors[0].username}, ${actors[1]?.username ?? ''} болон ${total - 2} бусад`;
    }
    return actors[0].username;
  }
  return notif.actor?.username || 'Хэрэглэгч';
};

/** Post контентыг MathJax-р рендер хийх жижиг компонент */
const ContentPreview = ({ content, className = '', style = {} }) => {
  if (!content) return null;
  const stripped = stripPSTricks(content, 200);
  return (
    <MathJax dynamic>
      <div className={className} style={style}>
        {stripped}
      </div>
    </MathJax>
  );
};

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (pageNum = 1, type = activeTab) => {
    setLoading(true);
    try {
      const data = await getNotifications(pageNum, type);
      if (pageNum === 1) {
        setNotifications(data.results || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.results || [])]);
      }
      setHasMore(!!data.next);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(1, activeTab);
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications(1, activeTab);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleLoadMore = () => {
    fetchNotifications(page + 1, activeTab);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        if (notification.is_grouped && notification.notification_ids?.length > 0) {
          await markGroupAsRead(notification.notification_ids);
        } else {
          await markAsRead(notification.id);
        }
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (notification.target?.type === 'conversation') {
      navigate('/messages', { state: { conversationUuid: notification.target.uuid } });
    } else if (notification.verb?.includes('мессеж') || notification.verb?.includes('зурвас')) {
      navigate('/messages', { state: { startConversationWith: notification.actor?.username } });
    } else if (notification.action_object?.type === 'post') {
      navigate(`/post/${notification.action_object.uuid}`);
    } else if (notification.target?.type === 'post') {
      navigate(`/post/${notification.target.uuid}`);
    } else if (notification.target?.type === 'club') {
      navigate(`/clubs/${notification.target.id}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Container className="py-4">
        <Card className="shadow-sm">
          {/* Гарчиг */}
          <Card.Header className="bg-white border-bottom py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold">
                Мэдэгдлүүд
                {unreadCount > 0 && (
                  <Badge bg="danger" className="ms-2">{unreadCount}</Badge>
                )}
              </h4>
              {unreadCount > 0 && (
                <Button variant="outline-primary" size="sm" onClick={handleMarkAllRead}>
                  <i className="bi bi-check-all me-1"></i>Бүгдийг уншсан
                </Button>
              )}
            </div>
          </Card.Header>

          {/* Табууд */}
          <Nav
            variant="tabs"
            className="px-3 pt-2 border-bottom bg-white"
            activeKey={String(activeTab)}
            onSelect={(k) => handleTabChange(k === 'null' ? null : k)}
          >
            {TABS.map((tab) => (
              <Nav.Item key={String(tab.key)}>
                <Nav.Link
                  eventKey={String(tab.key)}
                  className="d-flex align-items-center gap-1 pb-2"
                >
                  <i className={`bi ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          {/* Агуулга */}
          <Card.Body className="p-0">
            {loading && page === 1 ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Мэдэгдлүүд уншиж байна...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted d-block mb-3"></i>
                <h5 className="text-muted">Мэдэгдэл байхгүй</h5>
                <p className="text-muted small">
                  {activeTab
                    ? `"${TABS.find((t) => t.key === activeTab)?.label}" төрлийн мэдэгдэл байхгүй байна`
                    : 'Танд ирсэн мэдэгдлүүд энд харагдах болно'}
                </p>
              </div>
            ) : (
              <>
                <ListGroup variant="flush">
                  {notifications.map((notif) => {
                    const actorText = formatActorText(notif);
                    const isReplyNotif = notif.verb?.includes('хариулт');
                    const targetPost = notif.target?.type === 'post' ? notif.target : null;
                    const replyPost = isReplyNotif && notif.action_object?.type === 'post'
                      ? notif.action_object
                      : null;

                    // Постын холбоотой контентийн гарчиг (article/problem/formula/quiz)
                    const relatedTitle = targetPost?.related_preview || null;

                    return (
                      <ListGroup.Item
                        key={notif.id}
                        action
                        onClick={() => handleNotificationClick(notif)}
                        className={`border-0 border-bottom ${!notif.read ? 'bg-light' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-start py-2">
                          {/* Дүрс */}
                          <div className="flex-shrink-0 me-3">
                            <div
                              className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className={`bi ${getNotifIcon(notif.verb)} fs-5`}></i>
                            </div>
                          </div>

                          {/* Текст */}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <p className="mb-1">
                              <span className="fw-semibold">{actorText}</span>{' '}
                              <span className="text-muted">{notif.verb}</span>
                            </p>

                            {/* Хариулт контент (reply-ийн текст) */}
                            {replyPost?.content && (
                              <ContentPreview
                                content={replyPost.content}
                                className="small text-muted border-start border-2 border-primary ps-2 mb-1"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              />
                            )}

                            {/* Холбоотой контентийн гарчиг (article/problem/formula/quiz) */}
                            {relatedTitle && (
                              <div className="small text-muted bg-white border rounded px-2 py-1 mb-1"
                                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                <i className="bi bi-link-45deg me-1 opacity-50"></i>
                                {relatedTitle}
                              </div>
                            )}

                            {/* Постын агуулга */}
                            {!relatedTitle && targetPost?.content && (
                              <ContentPreview
                                content={targetPost.content}
                                className="small text-muted bg-white border rounded px-2 py-1 mb-1"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              />
                            )}

                            <small className="text-muted">{formatRelativeDate(notif.timestamp)}</small>
                          </div>

                          {/* Постын зураг */}
                          {targetPost?.image && (
                            <div className="flex-shrink-0 ms-2">
                              <img
                                src={targetPost.image}
                                alt=""
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            </div>
                          )}

                          {/* Уншаагүй цэг */}
                          {!notif.read && (
                            <div className="flex-shrink-0 ms-2 d-flex align-items-center">
                              <span
                                className="rounded-circle bg-primary d-inline-block"
                                style={{ width: '10px', height: '10px' }}
                              ></span>
                            </div>
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>

                {hasMore && (
                  <div className="text-center py-3">
                    <Button variant="outline-primary" onClick={handleLoadMore} disabled={loading}>
                      {loading ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" className="me-2" />
                          Уншиж байна...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-down me-1"></i>Цааш үзэх
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </MathJaxContext>
  );
};

export default NotificationsPage;
