// frontend/src/components/MaintenanceBanner.jsx
// Админаас "maintenance_mode" feature flag-ыг асаахад бүх хуудсан дээр
// харагдах зурвас. Хүсэлт блоклохгүй — зөвхөн мэдэгдэл.

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import apiClient from '../api/axiosConfig';

function MaintenanceBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    apiClient
      .get('/users/api/site-status/')
      .then((res) => setShow(Boolean(res.data?.maintenance_mode)))
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <div
      className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 text-center small"
      style={{ background: '#fff3cd', color: '#856404' }}
    >
      <AlertTriangle size={16} />
      Систем засвар үйлчилгээнд орсон тул зарим боломж түр тогтворгүй ажиллаж болзошгүй.
    </div>
  );
}

export default MaintenanceBanner;
