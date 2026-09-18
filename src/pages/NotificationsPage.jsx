// frontend/src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Badge, Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MathJax } from 'better-react-mathjax';
import { markAllAsRead, markAsRead, markGroupAsRead } from '../services/notificationService';
import { formatRelativeDate } from '../utils/dateFormatter';
import { stripPSTricks } from '../utils/stripPSTricks.js';
import usePaginatedFetch from '../hooks/usePagenatedFetch.js';
import useInfiniteScroll from '../hooks/useInfiniteScroll.js';

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
  if (verb?.includes('repost')) return 'bi-repeat text-success';
  if (verb?.includes('дагалаа')) return 'bi-person-plus-fill text-primary';
  if (verb?.includes('mention')) return 'bi-at text-warning';
  if (verb?.includes('клубт')) return 'bi-people-fill text-success';
  if (verb?.includes('мессеж')) return 'bi-envelope-fill text-warning';
  return 'bi-bell text-secondary';
};

const actorName = (actor) => actor?.first_name || actor?.username || 'Хэрэглэгч';

const formatActorText = (notif) => {
  if (notif.is_grouped && notif.grouped_actors?.length > 0) {
    const actors = notif.grouped_actors;
    const total = notif.total_actor_count;
    if (total === 2) return `${actorName(actors[0])} болон ${actorName(actors[1])}`;
    if (total === 3 && actors.length >= 3)
      return `${actorName(actors[0])}, ${actorName(actors[1])} болон ${actorName(actors[2])}`;
    if (total > 2)
      return `${actorName(actors[0])}, ${actorName(actors[1])} болон ${total - 2} бусад`;
    return actorName(actors[0]);
  }
  return actorName(notif.actor);
};

const ContentPreview = ({ content, className = '', style = {} }) => {
  if (!content) return null;
  return (
    <MathJax dynamic>
      <div className={className} style={style}>
        {stripPSTricks(content, 200)}
      </div>
    </MathJax>
  );
};

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  const {
    data: notifications,
    loading,
    loadingMore,
    hasMore,
    fetchData,
    loadMore,
    setData,
  } = usePaginatedFetch('/api/minds/notifications/');

  const { triggerRef } = useInfiniteScroll(loadMore, hasMore, loadingMore);

  useEffect(() => {
    const params = activeTab ? { type: activeTab } : {};
    fetchData(params);
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey === 'null' ? null : tabKey);
  };

  // Header-ийн badge нь 30 секунд хүлээхгүйгээр шууд шинэчлэгдэх ёстой
  const notifyCountsChanged = () => {
    window.dispatchEvent(new Event('notifications:changed'));
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setData((prev) => prev.map((n) => ({ ...n, read: true })));
      notifyCountsChanged();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        if (notification.is_grouped && notification.notification_ids?.length > 0) {
          await markGroupAsRead(notification.notification_ids);
        } else {
          await markAsRead(notification.id);
        }
        setData((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
        );
        notifyCountsChanged();
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
      <Container className="py-4">
        <Card className="shadow-sm">
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

          <Nav
            variant="tabs"
            className="px-3 pt-2 border-bottom bg-white"
            activeKey={String(activeTab)}
            onSelect={handleTabChange}
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

          <Card.Body className="p-0">
            {loading ? (
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
              <ListGroup variant="flush">
                {notifications.map((notif) => {
                  const actorText = formatActorText(notif);
                  const isReplyNotif = notif.verb?.includes('хариулт');
                  const targetPost = notif.target?.type === 'post' ? notif.target : null;
                  const replyPost =
                    isReplyNotif && notif.action_object?.type === 'post'
                      ? notif.action_object
                      : null;
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
                        <div className="flex-shrink-0 me-3">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px' }}
                          >
                            <i className={`bi ${getNotifIcon(notif.verb)} fs-5`}></i>
                          </div>
                        </div>

                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <p className="mb-1">
                            <span className="fw-semibold">{actorText}</span>{' '}
                            <span className="text-muted">{notif.verb}</span>
                          </p>

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

                          {relatedTitle && (
                            <div
                              className="small text-muted bg-white border rounded px-2 py-1 mb-1"
                              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              <i className="bi bi-link-45deg me-1 opacity-50"></i>
                              {relatedTitle}
                            </div>
                          )}

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

                        {targetPost?.image && (
                          <div className="flex-shrink-0 ms-2">
                            <img
                              src={targetPost.image}
                              alt=""
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </div>
                        )}

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

                {/* Infinite scroll trigger */}
                <div ref={triggerRef} style={{ height: '20px' }} />

                {loadingMore && (
                  <div className="text-center py-3">
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    <span className="text-muted small">Уншиж байна...</span>
                  </div>
                )}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
  );
};

export default NotificationsPage;
