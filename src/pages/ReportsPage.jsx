// frontend/src/pages/ReportsPage.jsx
// Post Report-уудыг харах хуудас

import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import apiClient from '../api/axiosConfig.js';
import { useAuth } from '../context/AuthContext.jsx';

// React Bootstrap
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Button from 'react-bootstrap/Button';

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setPageTitle } = useOutletContext();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingReportId, setUpdatingReportId] = useState(null);

  // Admin эсвэл Teacher эсэхийг шалгах
  const isAdminOrTeacher = user?.is_staff || user?.site_role === 'TEACHER';

  useEffect(() => {
    setPageTitle('Post Reports');
    fetchReports();

    return () => setPageTitle('Нүүр');
  }, [setPageTitle]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/minds/post-reports/');

      // Pagination байвал results авна
      const data = response.data.results || response.data;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setError('Report-ууд ачааллахад алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, action) => {
    try {
      setUpdatingReportId(reportId);
      // Custom action endpoint дуудах (review, resolve, dismiss)
      await apiClient.post(`/api/minds/post-reports/${reportId}/${action}/`);

      // Жагсаалтыг дахин ачаалах
      await fetchReports();
    } catch (err) {
      console.error(`Failed to ${action} report:`, err);
      alert(`Report ${action} хийхэд алдаа гарлаа.`);
    } finally {
      setUpdatingReportId(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { variant: 'warning', text: 'Хүлээгдэж буй' },
      reviewed: { variant: 'info', text: 'Шалгагдсан' },
      resolved: { variant: 'success', text: 'Шийдвэрлэгдсэн' },
      dismissed: { variant: 'secondary', text: 'Хаягдсан' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge bg={badge.variant}>{badge.text}</Badge>;
  };

  const getReasonBadge = (reason, reasonDisplay) => {
    const badges = {
      spam: 'danger',
      harassment: 'danger',
      hate_speech: 'danger',
      violence: 'danger',
      false_info: 'warning',
      inappropriate: 'warning',
      other: 'secondary',
    };
    const variant = badges[reason] || 'secondary';
    return <Badge bg={variant}>{reasonDisplay || reason}</Badge>;
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
        <Button variant="outline-primary" onClick={fetchReports}>
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
        <Breadcrumb.Item active>Post Reports</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-flag me-2"></i>
              Post Reports
            </h4>
            <Badge bg="primary">{reports.length} report</Badge>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox display-1"></i>
              <p className="mt-3">Одоогоор report байхгүй байна.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Пост</th>
                    <th>Шалтгаан</th>
                    <th>Report хийсэн</th>
                    <th>Огноо</th>
                    <th>Төлөв</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td>
                        <Link to={`/post/${report.post_uuid || report.post}`} className="text-decoration-none">
                          Post #{report.post}
                        </Link>
                      </td>
                      <td>
                        {getReasonBadge(report.reason, report.reason_display)}
                        {report.description && (
                          <div className="small text-muted mt-1">
                            {report.description.substring(0, 50)}
                            {report.description.length > 50 && '...'}
                          </div>
                        )}
                      </td>
                      <td>
                        {report.reporter_details ? (
                          <Link
                            to={`/profile/${report.reporter_details.username}`}
                            className="text-decoration-none"
                          >
                            {report.reporter_details.first_name || report.reporter_details.email}
                          </Link>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="small text-muted">{formatDate(report.created_at)}</td>
                      <td>{getStatusBadge(report.status)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/post/${report.post_uuid || report.post}`)}
                            title="Пост харах"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>

                          {/* Admin/Teacher нарт статус өөрчлөх товчлууд */}
                          {isAdminOrTeacher && report.status === 'pending' && (
                            <>
                              <Button
                                variant="info"
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'review')}
                                disabled={updatingReportId === report.id}
                                title="Шалгах"
                              >
                                <i className="bi bi-search"></i>
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'resolve')}
                                disabled={updatingReportId === report.id}
                                title="Шийдвэрлэх"
                              >
                                <i className="bi bi-check-circle"></i>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'dismiss')}
                                disabled={updatingReportId === report.id}
                                title="Хаях"
                              >
                                <i className="bi bi-x-circle"></i>
                              </Button>
                            </>
                          )}

                          {/* Reviewed статустай report-г resolve эсвэл dismiss хийх */}
                          {isAdminOrTeacher && report.status === 'reviewed' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'resolve')}
                                disabled={updatingReportId === report.id}
                                title="Шийдвэрлэх"
                              >
                                <i className="bi bi-check-circle"></i>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => updateReportStatus(report.id, 'dismiss')}
                                disabled={updatingReportId === report.id}
                                title="Хаях"
                              >
                                <i className="bi bi-x-circle"></i>
                              </Button>
                            </>
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

export default ReportsPage;
