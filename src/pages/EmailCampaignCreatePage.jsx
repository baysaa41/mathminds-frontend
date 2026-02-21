// frontend/src/pages/EmailCampaignCreatePage.jsx
// Шинэ имэйл кампанит ажил үүсгэх

import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { createCampaign } from '../services/emailService';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const EmailCampaignCreatePage = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    html_message: '',
    from_email: 'baysa@mathminds.club',
    filter_teachers: false,
    filter_students: false,
    filter_staff: false,
    filter_all_users: false,
    filter_members: false,
    filter_last_login_days: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPageTitle('Шинэ Email Campaign');
    return () => setPageTitle('Нүүр');
  }, [setPageTitle]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      // Хэрэв "Бүх хэрэглэгчид" сонговол бусад шүүлтүүрийг унтраах
      if (name === 'filter_all_users' && checked) {
        setFormData((prev) => ({
          ...prev,
          filter_all_users: true,
          filter_teachers: false,
          filter_students: false,
          filter_staff: false,
          filter_members: false,
        }));
      } else if (name !== 'filter_all_users' && checked) {
        // Бусад шүүлтүүр сонговол "Бүх хэрэглэгчид"-г унтраах
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
          filter_all_users: false,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('Кампанит ажлын нэр оруулна уу.');
      return;
    }
    if (!formData.subject.trim()) {
      setError('Имэйлийн гарчиг оруулна уу.');
      return;
    }
    if (!formData.message.trim()) {
      setError('Мессеж оруулна уу.');
      return;
    }
    if (
      !formData.filter_all_users &&
      !formData.filter_teachers &&
      !formData.filter_students &&
      !formData.filter_staff &&
      !formData.filter_members &&
      formData.filter_last_login_days === 0
    ) {
      setError('Хүлээн авагчийн шүүлтүүр сонгоно уу.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const campaign = await createCampaign(formData);
      navigate(`/admin/emails/${campaign.id}`);
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError(err.response?.data?.detail || 'Кампанит ажил үүсгэхэд алдаа гарлаа.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/admin/emails' }}>
          Email Campaigns
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Шинэ кампанит ажил</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <i className="bi bi-plus-lg me-2"></i>
            Шинэ Email Campaign үүсгэх
          </h4>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Кампанит ажлын нэр *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Жишээ: Шинэ жилийн мэндчилгээ"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Илгээгч имэйл</Form.Label>
                  <Form.Select
                    name="from_email"
                    value={formData.from_email}
                    onChange={handleChange}
                  >
                    <option value="baysa@mathminds.club">baysa@mathminds.club</option>
                    <option value="info@mathminds.club">info@mathminds.club</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Имэйлийн гарчиг (Subject) *</Form.Label>
              <Form.Control
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Имэйлийн subject"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Текст мессеж *</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Имэйлийн агуулга... ({{ name }} гэж бичвэл хүлээн авагчийн нэрээр орлуулна)"
                required
              />
              <Form.Text className="text-muted">
                Хувьсагч: {'{{ name }}'} - Хүлээн авагчийн нэр
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>HTML мессеж (заавал биш)</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                name="html_message"
                value={formData.html_message}
                onChange={handleChange}
                placeholder="<html>...</html> (HTML форматтай имэйл бол энд оруулна)"
              />
            </Form.Group>

            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">
                  <i className="bi bi-funnel me-2"></i>
                  Хүлээн авагч сонгох *
                </h6>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={4} lg={2}>
                    <Form.Check
                      type="checkbox"
                      id="filter_all_users"
                      name="filter_all_users"
                      label="Бүх хэрэглэгчид"
                      checked={formData.filter_all_users}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={4} lg={2}>
                    <Form.Check
                      type="checkbox"
                      id="filter_teachers"
                      name="filter_teachers"
                      label="Багш нар"
                      checked={formData.filter_teachers}
                      onChange={handleChange}
                      disabled={formData.filter_all_users}
                    />
                  </Col>
                  <Col md={4} lg={2}>
                    <Form.Check
                      type="checkbox"
                      id="filter_students"
                      name="filter_students"
                      label="Сурагчид"
                      checked={formData.filter_students}
                      onChange={handleChange}
                      disabled={formData.filter_all_users}
                    />
                  </Col>
                  <Col md={4} lg={2}>
                    <Form.Check
                      type="checkbox"
                      id="filter_staff"
                      name="filter_staff"
                      label="Staff"
                      checked={formData.filter_staff}
                      onChange={handleChange}
                      disabled={formData.filter_all_users}
                    />
                  </Col>
                  <Col md={4} lg={2}>
                    <Form.Check
                      type="checkbox"
                      id="filter_members"
                      name="filter_members"
                      label="Гишүүд (төлбөртэй)"
                      checked={formData.filter_members}
                      onChange={handleChange}
                      disabled={formData.filter_all_users}
                    />
                  </Col>
                </Row>

                <Row className="align-items-center">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="mb-0">
                        <i className="bi bi-clock-history me-1"></i>
                        Сүүлд нэвтэрсэн хугацаа
                      </Form.Label>
                      <Form.Select
                        name="filter_last_login_days"
                        value={formData.filter_last_login_days}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            filter_last_login_days: parseInt(e.target.value, 10),
                          }))
                        }
                      >
                        <option value={0}>Хязгааргүй</option>
                        <option value={7}>Сүүлийн 7 хоногт</option>
                        <option value={30}>Сүүлийн 1 сард</option>
                        <option value={90}>Сүүлийн 3 сард</option>
                        <option value={180}>Сүүлийн 6 сард</option>
                        <option value={365}>Сүүлийн 1 жилд</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info" className="mt-3 mb-0">
                  <small>
                    <strong>AND логик:</strong> Бүх шүүлтүүр AND логикоор холбогдоно.
                    <br />
                    Жишээ: "Багш нар" + "Сүүлийн 30 хоногт" = Сүүлийн 30 хоногт нэвтэрсэн багш нар.
                    <br />
                    "Багш нар" + "Сурагчид" сонговол хоёулангийнх нь OR логикоор (учир нь нэг хүн хоёуланг нь хангаж чадахгүй).
                  </small>
                </Alert>
              </Card.Body>
            </Card>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Үүсгэж байна...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Үүсгэх
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/admin/emails')}
                disabled={submitting}
              >
                Цуцлах
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmailCampaignCreatePage;
