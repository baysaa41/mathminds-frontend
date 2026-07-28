// frontend/src/pages/EmailCampaignDetailPage.jsx
// Имэйл кампанит ажлын дэлгэрэнгүй хуудас

import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { getCampaign, sendTestEmail, sendCampaign } from '../services/emailService';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import AppBreadcrumb from '../components/common/AppBreadcrumb';

const EmailCampaignDetailPage = () => {
  const { id } = useParams();
  const { setPageTitle } = useOutletContext();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test email state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Send campaign state
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    setPageTitle('Campaign Detail');
    fetchCampaign();

    return () => setPageTitle('Нүүр');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setPageTitle]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCampaign(id);
      setCampaign(data);
      setPageTitle(data.name);
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
      setError('Кампанит ажил ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      setTestResult({ success: false, message: 'Имэйл хаяг оруулна уу.' });
      return;
    }

    try {
      setSendingTest(true);
      setTestResult(null);
      const result = await sendTestEmail(id, testEmail);
      setTestResult(result);
      await fetchCampaign(); // Refresh data
    } catch (err) {
      console.error('Failed to send test email:', err);
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Тест имэйл илгээхэд алдаа гарлаа.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendCampaign = async () => {
    try {
      setSending(true);
      setSendResult(null);
      const result = await sendCampaign(id);
      setSendResult(result);
      setShowSendModal(false);
      await fetchCampaign(); // Refresh data
    } catch (err) {
      console.error('Failed to send campaign:', err);
      setSendResult({
        success: false,
        message: err.response?.data?.message || 'Кампанит ажил илгээхэд алдаа гарлаа.',
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { variant: 'secondary', text: 'Ноорог' },
      sending: { variant: 'info', text: 'Илгээж байна' },
      sent: { variant: 'success', text: 'Илгээгдсэн' },
      failed: { variant: 'danger', text: 'Алдаатай' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge bg={badge.variant}>{badge.text}</Badge>;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
        <Button variant="outline-primary" onClick={fetchCampaign}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">Кампанит ажил олдсонгүй.</Alert>
        <AppBreadcrumb items={[{ label: 'Имэйл кампанит', to: '/admin/emails' }, { label: 'Дэлгэрэнгүй' }]} />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <AppBreadcrumb className="mb-3" items={[
        { label: 'Имэйл кампанит', to: '/admin/emails' },
        { label: campaign.name },
      ]} />

      {/* Result alerts */}
      {sendResult && (
        <Alert
          variant={sendResult.success ? 'success' : 'danger'}
          dismissible
          onClose={() => setSendResult(null)}
        >
          {sendResult.message}
        </Alert>
      )}

      {/* Header Card */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-envelope me-2"></i>
              {campaign.name}
            </h4>
            {getStatusBadge(campaign.status)}
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p>
                <strong>Гарчиг:</strong> {campaign.subject}
              </p>
              <p>
                <strong>Илгээгч:</strong> {campaign.from_email}
              </p>
              <p>
                <strong>Шүүлтүүр:</strong>{' '}
                {campaign.filters_applied?.map((f, i) => (
                  <Badge key={i} bg="light" text="dark" className="me-1">
                    {f}
                  </Badge>
                ))}
              </p>
            </Col>
            <Col md={6}>
              <p>
                <strong>Үүсгэсэн:</strong> {formatDateTime(campaign.created_at)}
              </p>
              <p>
                <strong>Илгээсэн:</strong> {formatDateTime(campaign.sent_at)}
              </p>
              <p>
                <strong>Тест:</strong>{' '}
                {campaign.is_tested ? (
                  <Badge bg="success">Тест илгээсэн ({campaign.test_recipient_email})</Badge>
                ) : (
                  <Badge bg="warning">Тест илгээгээгүй</Badge>
                )}
              </p>
            </Col>
          </Row>

          {/* Progress */}
          <Card className="mt-3">
            <Card.Body>
              <Row className="text-center">
                <Col>
                  <h3>{campaign.total_recipients}</h3>
                  <small className="text-muted">Нийт хүлээн авагчид</small>
                </Col>
                <Col>
                  <h3 className="text-success">{campaign.sent_count}</h3>
                  <small className="text-muted">Амжилттай</small>
                </Col>
                <Col>
                  <h3 className="text-danger">{campaign.failed_count}</h3>
                  <small className="text-muted">Алдаатай</small>
                </Col>
                <Col>
                  <h3>{campaign.pending_count || 0}</h3>
                  <small className="text-muted">Хүлээгдэж буй</small>
                </Col>
              </Row>
              {campaign.total_recipients > 0 && (
                <ProgressBar className="mt-3">
                  <ProgressBar
                    variant="success"
                    now={(campaign.sent_count / campaign.total_recipients) * 100}
                    key={1}
                    label={`${campaign.sent_count}`}
                  />
                  <ProgressBar
                    variant="danger"
                    now={(campaign.failed_count / campaign.total_recipients) * 100}
                    key={2}
                    label={campaign.failed_count > 0 ? `${campaign.failed_count}` : ''}
                  />
                </ProgressBar>
              )}
            </Card.Body>
          </Card>

          {/* Actions */}
          {campaign.status === 'draft' && (
            <div className="d-flex gap-2 mt-4">
              <Button variant="outline-info" onClick={() => setShowTestModal(true)}>
                <i className="bi bi-send me-2"></i>
                Тест имэйл илгээх
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowSendModal(true)}
                disabled={campaign.total_recipients === 0}
              >
                <i className="bi bi-envelope-check me-2"></i>
                Бодит илгээлт хийх ({campaign.total_recipients} хүн)
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Message Preview */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Мессежийн урьдчилсан харагдац</h5>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="text" className="mb-3">
            <Tab eventKey="text" title="Текст">
              <pre
                className="p-3 bg-light rounded"
                style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}
              >
                {campaign.message}
              </pre>
            </Tab>
            {campaign.html_message && (
              <Tab eventKey="html" title="HTML">
                <div
                  className="p-3 border rounded"
                  style={{ maxHeight: '400px', overflow: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: campaign.html_message }}
                />
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>

      {/* Recipients */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Хүлээн авагчид</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Tabs defaultActiveKey="sent" className="p-3">
            <Tab eventKey="sent" title={`Илгээсэн (${campaign.sent_count})`}>
              {campaign.recent_sent && campaign.recent_sent.length > 0 ? (
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Имэйл</th>
                      <th>Нэр</th>
                      <th>Илгээсэн огноо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.recent_sent.map((r) => (
                      <tr key={r.id}>
                        <td>{r.email}</td>
                        <td>{r.name || '-'}</td>
                        <td className="text-muted small">{formatDateTime(r.sent_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  Одоогоор илгээсэн имэйл байхгүй.
                </div>
              )}
            </Tab>
            <Tab eventKey="failed" title={`Алдаатай (${campaign.failed_count})`}>
              {campaign.recent_failed && campaign.recent_failed.length > 0 ? (
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Имэйл</th>
                      <th>Нэр</th>
                      <th>Алдааны мэдээлэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaign.recent_failed.map((r) => (
                      <tr key={r.id}>
                        <td>{r.email}</td>
                        <td>{r.name || '-'}</td>
                        <td className="text-danger small">{r.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">Алдаатай имэйл байхгүй.</div>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Test Email Modal */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Тест имэйл илгээх</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {testResult && (
            <Alert variant={testResult.success ? 'success' : 'danger'}>
              {testResult.message}
            </Alert>
          )}
          <Form.Group>
            <Form.Label>Тест имэйл хаяг</Form.Label>
            <Form.Control
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <Form.Text className="text-muted">
              Энэ хаяг руу туршилтын имэйл илгээнэ.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestModal(false)}>
            Хаах
          </Button>
          <Button variant="primary" onClick={handleSendTest} disabled={sendingTest}>
            {sendingTest ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Илгээж байна...
              </>
            ) : (
              'Тест илгээх'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send Campaign Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Кампанит ажил илгээх</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Анхааруулга!</strong> Та {campaign.total_recipients} хэрэглэгч рүү имэйл илгээх
            гэж байна. Энэ үйлдлийг буцаах боломжгүй.
          </Alert>
          <p>
            <strong>Кампанит ажил:</strong> {campaign.name}
          </p>
          <p>
            <strong>Гарчиг:</strong> {campaign.subject}
          </p>
          <p>
            <strong>Шүүлтүүр:</strong> {campaign.filters_applied?.join(', ')}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>
            Цуцлах
          </Button>
          <Button variant="danger" onClick={handleSendCampaign} disabled={sending}>
            {sending ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Илгээж байна...
              </>
            ) : (
              <>
                <i className="bi bi-send me-2"></i>
                Илгээх
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EmailCampaignDetailPage;
