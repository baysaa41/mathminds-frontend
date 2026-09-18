// frontend/src/components/NotificationBell.jsx
// Тоог эцэг компонент (AppHeader) дамжуулна — өөрөө poll хийхгүй,
// ингэснээр нэг л хүсэлтээр хоёр badge шинэчлэгдэнэ.
import { Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();

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
