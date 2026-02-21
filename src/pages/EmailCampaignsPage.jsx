// frontend/src/pages/EmailCampaignsPage.jsx
// Имэйл кампанит ажлуудын жагсаалт

import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { getCampaigns, deleteCampaign } from '../services/emailService';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';

const EmailCampaignsPage = () => {
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setPageTitle('Email Campaigns');
    fetchCampaigns();

    return () => setPageTitle('Нүүр');
  }, [setPageTitle]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCampaigns();
      const data = response.results || response;
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Кампанит ажлуудыг ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Энэ кампанит ажлыг устгах уу?')) return;

    try {
      setDeletingId(id);
      await deleteCampaign(id);
      await fetchCampaigns();
    } catch (err) {
      console.error('Failed to delete campaign:', err);
      alert('Устгахад алдаа гарлаа.');
    } finally {
      setDeletingId(null);
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

  const formatDate = (dateString) => {
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
        <Button variant="outline-primary" onClick={fetchCampaigns}>
          Дахин оролдох
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Breadcrumb className="mb-3">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
          Нүүр
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Email Campaigns</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-envelope me-2"></i>
              Email Campaigns
            </h4>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/emails/create')}
            >
              <i className="bi bi-plus-lg me-1"></i>
              Шинэ кампанит ажил
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {campaigns.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox display-1"></i>
              <p className="mt-3">Одоогоор кампанит ажил байхгүй байна.</p>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/emails/create')}
              >
                Эхний кампанит ажил үүсгэх
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Нэр</th>
                    <th>Гарчиг</th>
                    <th>Төлөв</th>
                    <th>Хүлээн авагчид</th>
                    <th>Илгээсэн</th>
                    <th>Алдаатай</th>
                    <th>Үүсгэсэн</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>
                        <Link
                          to={`/admin/emails/${campaign.id}`}
                          className="text-decoration-none fw-bold"
                        >
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="text-muted">{campaign.subject.substring(0, 40)}{campaign.subject.length > 40 && '...'}</td>
                      <td>{getStatusBadge(campaign.status)}</td>
                      <td>
                        <Badge bg="light" text="dark">
                          {campaign.total_recipients}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="success">{campaign.sent_count}</Badge>
                      </td>
                      <td>
                        {campaign.failed_count > 0 ? (
                          <Badge bg="danger">{campaign.failed_count}</Badge>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/admin/emails/${campaign.id}`)}
                            title="Дэлгэрэнгүй"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {campaign.status === 'draft' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deletingId === campaign.id}
                              title="Устгах"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmailCampaignsPage;
