// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react';
import { Badge } from 'react-bootstrap';
import { getUnreadCount } from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <button
      className="btn btn-link position-relative p-2"
      onClick={() => navigate('/notifications')}
    >
      <i className="bi bi-bell fs-5 text-dark"></i>
      {unreadCount > 0 && (
        <Badge
          bg="danger"
          pill
          className="position-absolute"
          style={{ fontSize: '0.65rem', top: '1px', right: '-2px' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </button>
  );
};

export default NotificationBell;
