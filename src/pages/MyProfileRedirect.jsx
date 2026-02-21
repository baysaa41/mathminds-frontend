// frontend/src/pages/MyProfileRedirect.jsx (ШИНЭ ФАЙЛ)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from 'react-bootstrap/Spinner';

/**
 * /profile-г /profile/:username рүү чиглүүлдэг туслах компонент
 */
function MyProfileRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      // Хэрэглэгчийн мэдээлэл иртэл хүлээнэ
      return;
    }

    if (user && user.username) {
      // Хэрэглэгч байвал түүний профайл руу үсэргэнэ
      navigate(`/profile/${user.username}`, { replace: true });
    } else {
      // Хэрэглэгч нэвтрээгүй бол login руу үсэргэнэ
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  // Ачаалж байх үед эсвэл чиглүүлж байх үед харагдана
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Ачаалж байна...</span>
      </Spinner>
    </div>
  );
}

export default MyProfileRedirect;
