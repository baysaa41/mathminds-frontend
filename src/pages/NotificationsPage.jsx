// frontend/src/pages/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAllAsRead, markAsRead } from '../services/notificationService';
import { formatRelativeDate } from '../utils/dateFormatter';

/**
 * Notifications Page
 * Хэрэглэгчийн бүх мэдэгдлүүдийг харуулах хуудас
 */
const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const navigate = useNavigate();

  // Мэдэгдлүүдийг татах
  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getNotifications(pageNum);
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
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  // Бүх мэдэгдлийг уншсан болгох
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications(1);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Дараагийн хуудсыг татах
  const handleLoadMore = () => {
    fetchNotifications(page + 1);
  };

  // Мэдэгдэл дээр дарахад холбогдох хуудас руу очих
  const handleNotificationClick = async (notification) => {
    // Уншаагүй бол уншсан болгох
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        // Мэдэгдлүүдийг шинэчлэх
        fetchNotifications(1);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Холбогдох хуудас руу очих (UUID ашиглана)
    if (notification.action_object?.type === 'post') {
      const postId = notification.action_object.uuid || notification.action_object.id;
      navigate(`/post/${postId}`);
    } else if (notification.target?.type === 'post') {
      const postId = notification.target.uuid || notification.target.id;
      navigate(`/post/${postId}`);
    } else if (notification.target?.type === 'club') {
      navigate(`/clubs/${notification.target.id}`);
    }
  };

  // Мэдэгдлийн текстийг форматлах
  const formatNotificationText = (notification) => {
    const actorName = notification.actor?.username || 'Хэрэглэгч';
    return `${actorName} ${notification.verb}`;
  };

  // Огноог форматлах - dateFormatter utility ашиглана
  const formatTimestamp = (timestamp) => {
    return formatRelativeDate(timestamp);
  };

  // Уншаагүй мэдэгдлийн тоо
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0 fw-bold">
                Мэдэгдлүүд
                {unreadCount > 0 && (
                  <Badge bg="danger" className="ms-2">
                    {unreadCount}
                  </Badge>
                )}
              </h4>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline-primary" size="sm" onClick={handleMarkAllRead}>
                <i className="bi bi-check-all me-1"></i>
                Бүгдийг уншсан
              </Button>
            )}
          </div>
        </Card.Header>

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
              <p className="text-muted">Танд ирсэн мэдэгдлүүд энд харагдах болно</p>
            </div>
          ) : (
            <>
              <ListGroup variant="flush">
                {notifications.map((notif) => (
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
                          style={{ width: '48px', height: '48px' }}
                        >
                          <i
                            className={`bi ${
                              notif.verb.includes('хариулт')
                                ? 'bi-chat-left-text'
                                : notif.verb.includes('таалагдлаа')
                                  ? 'bi-heart-fill'
                                  : notif.verb.includes('постлосон') ||
                                      notif.verb.includes('нийтэллээ')
                                    ? 'bi-megaphone'
                                    : 'bi-bell'
                            } text-primary fs-5`}
                          ></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 fw-semibold">{formatNotificationText(notif)}</p>
                        <small className="text-muted">{formatTimestamp(notif.timestamp)}</small>
                      </div>
                      {!notif.read && (
                        <div className="flex-shrink-0">
                          <span
                            className="badge bg-primary rounded-circle"
                            style={{ width: '10px', height: '10px' }}
                          ></span>
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
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
                        <i className="bi bi-arrow-down me-1"></i>
                        Цааш үзэх
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
  );
};

export default NotificationsPage;
