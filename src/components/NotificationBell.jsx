// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Badge, Dropdown } from 'react-bootstrap';
import { getNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';
import { formatRelativeDate } from '../utils/dateFormatter';

/**
 * Notification Bell Component
 * Header дээр мэдэгдлийн хонхны icon-г харуулна
 */
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  // Уншаагүй мэдэгдлийн тоог авах
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Мэдэгдлүүдийг авах
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(1);
      setNotifications(data.results || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Эхлэл: Уншаагүй тоог авах болон 30 секунд тутамд шинэчлэх
  useEffect(() => {
    fetchUnreadCount();

    // 30 секунд тутамд шинэчлэх
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 секунд

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Dropdown нээх үед мэдэгдлүүдийг татах
  const handleToggle = (isOpen) => {
    setShowDropdown(isOpen);
    if (isOpen) {
      fetchNotifications();
    }
  };

  // Бүх мэдэгдлийг уншсан болгох
  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      // Мэдэгдлүүдийг дахин татах
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Мэдэгдэл дээр дарахад холбогдох хуудас руу очих
  const handleNotificationClick = async (notification) => {
    // Уншаагүй бол уншсан болгох
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        // Уншаагүй тоог шууд бууруулах
        setUnreadCount((prev) => Math.max(0, prev - 1));
        // Мэдэгдлүүдийг шинэчлэх
        fetchNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Мэдэгдлийн төрлөөс хамааран зөв хуудас руу очно
    if (notification.verb?.includes('багшаар урьж байна') || notification.action_object?.type === 'teacher_invitation') {
      // Багшийн урилга
      navigate('/teacher-invitations');
    } else if (notification.verb?.includes('хувийн мессеж илгээлээ')) {
      // Хувийн мессеж (UUID ашиглана)
      if (notification.target?.uuid) {
        navigate(`/post/${notification.target.uuid}`);
      }
    } else if (notification.action_object?.type === 'post') {
      // Post UUID ашиглана
      const postId = notification.action_object.uuid || notification.action_object.id;
      navigate(`/post/${postId}`);
    } else if (notification.target?.type === 'post') {
      // Post UUID ашиглана
      const postId = notification.target.uuid || notification.target.id;
      navigate(`/post/${postId}`);
    } else if (notification.target?.type === 'club') {
      navigate(`/clubs/${notification.target.id}`);
    }
    setShowDropdown(false);
  };

  // Мэдэгдлийн текстийг форматлах
  const formatNotificationText = (notification) => {
    const actorName = notification.actor?.first_name || notification.actor?.username || 'Хэрэглэгч';
    return `${actorName} ${notification.verb}`;
  };

  // Огноог форматлах - dateFormatter utility ашиглана
  const formatTimestamp = (timestamp) => {
    return formatRelativeDate(timestamp);
  };

  return (
    <Dropdown show={showDropdown} onToggle={handleToggle} align="end" className="notification-bell">
      <Dropdown.Toggle
        variant="link"
        className="notification-bell-toggle position-relative p-2"
        id="notification-dropdown"
      >
        <i className="bi bi-bell fs-5 text-dark"></i>
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown-menu shadow-lg">
        <div className="notification-header d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0 fw-bold">Мэдэгдлүүд</h6>
          {unreadCount > 0 && (
            <button
              className="btn btn-link btn-sm text-decoration-none p-0"
              onClick={handleMarkAllRead}
            >
              Бүгдийг уншсан
            </button>
          )}
        </div>

        <div className="notification-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Уншиж байна...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              <p className="mb-0">Мэдэгдэл байхгүй</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Dropdown.Item
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
              >
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0 me-2">
                    <i
                      className={`bi ${
                        notif.verb.includes('багшаар урьж байна')
                          ? 'bi-envelope-fill'
                          : notif.verb.includes('хувийн мессеж илгээлээ')
                            ? 'bi-chat-dots-fill'
                            : notif.verb.includes('хариулт')
                              ? 'bi-chat-left-text'
                              : notif.verb.includes('таалагдлаа')
                                ? 'bi-heart-fill'
                                : notif.verb.includes('постлосон') || notif.verb.includes('нийтэллээ')
                                  ? 'bi-megaphone'
                                  : 'bi-bell'
                      } ${
                        notif.verb.includes('багшаар урьж байна')
                          ? 'text-info'
                          : notif.verb.includes('хувийн мессеж илгээлээ')
                            ? 'text-success'
                            : 'text-primary'
                      }`}
                    ></i>
                  </div>
                  <div className="flex-grow-1">
                    <p className="mb-1 small">{formatNotificationText(notif)}</p>
                    <small className="text-muted">{formatTimestamp(notif.timestamp)}</small>
                  </div>
                  {!notif.read && (
                    <div className="flex-shrink-0">
                      <span
                        className="badge bg-primary rounded-circle"
                        style={{ width: '8px', height: '8px' }}
                      ></span>
                    </div>
                  )}
                </div>
              </Dropdown.Item>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer text-center border-top py-2">
            <button
              className="btn btn-link btn-sm text-decoration-none"
              onClick={() => {
                navigate('/notifications');
                setShowDropdown(false);
              }}
            >
              Бүх мэдэгдлийг харах
            </button>
          </div>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell;
