// frontend/src/pages/OnboardingPage.jsx
// Шинээр бүртгүүлсэн хэрэглэгчид зориулсан 3 алхамт танилцуулга:
// 1) Үүрэг сонгох, 2) Анги/түвшин сонгох, 3) Дараагийн алхам санал болгох.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import apiClient from '../api/axiosConfig';
import { SITE_ROLES, SITE_ROLE_CONFIG } from '../constants/membership.js';

import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';

const ROLE_ICONS = {
  TEACHER: 'bi-easel2',
  STUDENT: 'bi-backpack2',
  PARENT: 'bi-heart',
  OTHER: 'bi-person',
};

const TOTAL_STEPS = 3;

function OnboardingPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [grade, setGrade] = useState('');
  const [grades, setGrades] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/integral/grades/')
      .then((r) => setGrades(r.data.results || r.data || []))
      .catch(() => setGrades([]));
  }, []);

  const selectRole = (roleKey) => {
    setRole(roleKey);
    setStep(2);
  };

  const finishOnboarding = async () => {
    setSaving(true);
    setError('');
    try {
      const updatedUser = await apiService.updateUserProfile({
        site_role: role || 'OTHER',
        grade: grade || null,
      });
      updateUser(updatedUser);
      setStep(3);
    } catch {
      setError('Хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => navigate('/');

  return (
    <Container
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '100vh' }}
    >
      <div className="w-100 d-flex justify-content-between mb-3" style={{ maxWidth: 560 }}>
        <span className="text-muted small">
          Алхам {step} / {TOTAL_STEPS}
        </span>
        {step < 3 && (
          <Button variant="link" size="sm" className="p-0 text-muted" onClick={skip}>
            Алгасах
          </Button>
        )}
      </div>

      <Card className="shadow-sm w-100" style={{ maxWidth: 560 }}>
        <Card.Body className="p-4">
          {step === 1 && (
            <>
              <h4 className="mb-1">Тавтай морил! 👋</h4>
              <p className="text-muted mb-4">Та багш уу, сурагч уу, эцэг эх үү, эсвэл бусад уу?</p>
              <div className="d-grid gap-2">
                {Object.keys(SITE_ROLES).map((roleKey) => (
                  <Button
                    key={roleKey}
                    variant={role === roleKey ? 'primary' : 'outline-secondary'}
                    className="d-flex align-items-center text-start p-3"
                    onClick={() => selectRole(roleKey)}
                  >
                    <i className={`bi ${ROLE_ICONS[roleKey]} fs-4 me-3`}></i>
                    <span>
                      <div className="fw-semibold">{SITE_ROLE_CONFIG[roleKey].label}</div>
                      <div className="small text-muted">{SITE_ROLE_CONFIG[roleKey].description}</div>
                    </span>
                  </Button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h4 className="mb-1">Анги, түвшин</h4>
              <p className="text-muted mb-4">Танд тохирсон контент санал болгоход тусална (заавал биш).</p>
              <Form.Select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mb-4"
              >
                <option value="">— Сонгох —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Form.Select>

              {error && <p className="text-danger small">{error}</p>}

              <div className="d-flex justify-content-between">
                <Button variant="outline-secondary" onClick={() => setStep(1)} disabled={saving}>
                  Буцах
                </Button>
                <Button variant="primary" onClick={finishOnboarding} disabled={saving}>
                  {saving ? <Spinner animation="border" size="sm" /> : 'Үргэлжлүүлэх'}
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h4 className="mb-1">Бэлэн боллоо! 🎉</h4>
              <p className="text-muted mb-4">Одоо эхлээд юу хийх вэ?</p>
              <div className="d-grid gap-2 mb-2">
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center text-start p-3"
                  onClick={() => navigate('/clubs/browse')}
                >
                  <i className="bi bi-people fs-4 me-3"></i>
                  <span>
                    <div className="fw-semibold">Клуб олох</div>
                    <div className="small text-muted">Сонирхолд тохирсон клубыг үзэх</div>
                  </span>
                </Button>
                <Button
                  variant="outline-primary"
                  className="d-flex align-items-center text-start p-3"
                  onClick={() => navigate('/membership')}
                >
                  <i className="bi bi-star fs-4 me-3"></i>
                  <span>
                    <div className="fw-semibold">Гишүүнчлэл авах</div>
                    <div className="small text-muted">Клубт элсэхийн тулд гишүүнчлэл шаардлагатай</div>
                  </span>
                </Button>
              </div>
              <p className="text-muted small mb-3">
                Шинэ бүртгэл анхнаасаа Үнэгүй (FREE) төлөвтэй тул клубт элсэхийн өмнө
                гишүүнчлэл авах шаардлагатай.
              </p>
              <Button variant="primary" className="w-100" onClick={() => navigate('/')}>
                Эхлэх
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default OnboardingPage;
