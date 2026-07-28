// src/components/clubSubGroups/AutoObjectivesModal.jsx
// AI суралцахуйн зорилго нэмэх modal

import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { Sparkles } from 'lucide-react';
import apiClient from '../../api/axiosConfig';

export const AutoObjectivesModal = ({ show, onHide, subgroup, clubId, onDone }) => {
  const [assignments, setAssignments] = useState([]);
  const [loadingAsgn, setLoadingAsgn] = useState(false);
  const [assignmentId, setAssignmentId] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!show || !clubId) return;
    setResult(null); setErr(''); setAssignmentId('');
    setLoadingAsgn(true);
    apiClient.get('/api/club-assignments/', { params: { club: clubId } })
      .then(r => setAssignments(r.data.results || r.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoadingAsgn(false));
  }, [show, clubId]);

  const handleRun = async () => {
    if (!assignmentId) { setErr('Даалгавар сонгоно уу.'); return; }
    setRunning(true); setErr(''); setResult(null);
    try {
      const r = await apiClient.post(
        `/api/club-subgroups/${subgroup.id}/auto_objectives/`,
        { assignment_id: parseInt(assignmentId) },
      );
      setResult(r.data);
    } catch (e) {
      setErr(e.response?.data?.detail || 'Алдаа гарлаа.');
    } finally { setRunning(false); }
  };

  const handleClose = () => {
    if (result) onDone();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 d-flex align-items-center gap-2">
          <Sparkles size={16} />AI суралцахуйн зорилго нэмэх
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {result ? (
          <div>
            <div className="text-success small fw-medium mb-2">
              {result.detail}
            </div>
            <div className="small text-muted mb-2">
              {result.week_num}-р долоо хоног — «{result.topic}»
            </div>
            {result.added_objectives?.length > 0 && (
              <ul className="mb-0 ps-3">
                {result.added_objectives.map(o => (
                  <li key={o.id} className="small mb-1">{o.text}</li>
                ))}
              </ul>
            )}
            {result.added_objectives?.length === 0 && (
              <div className="text-muted small">Давхардалтай тул шинэ зорилго нэмэгдсэнгүй.</div>
            )}
          </div>
        ) : (
          <>
            <div className="small text-muted mb-3">
              Сонгосон тестийн дүнгээр <strong>«{subgroup?.name}»</strong> бүлгийн сул талыг
              тооцоолж, дараагийн долоо хоногийн сэдэвт AI суралцахуйн зорилго нэмнэ.
              Хөтөлбөр холбоогүй бол клубын хөтөлбөрийг автоматаар ашиглана.
            </div>
            <Form.Group>
              <Form.Label className="small fw-medium">Даалгавар <span className="text-danger">*</span></Form.Label>
              {loadingAsgn
                ? <div className="small text-muted">Ачааллаж байна...</div>
                : (
                  <Form.Select size="sm" value={assignmentId}
                    onChange={e => setAssignmentId(e.target.value)}>
                    <option value="">— Сонгох —</option>
                    {assignments.map(a => (
                      <option key={a.id} value={a.id}>{a.title}</option>
                    ))}
                  </Form.Select>
                )}
            </Form.Group>
            {err && <div className="text-danger small mt-2">{err}</div>}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={handleClose}>
          {result ? 'Хаах' : 'Болих'}
        </Button>
        {!result && (
          <Button variant="primary" size="sm" onClick={handleRun}
            disabled={running || !assignmentId}>
            {running
              ? <><Spinner animation="border" size="sm" className="me-1" />Боловсруулж байна...</>
              : <><Sparkles size={13} className="me-1" />Зорилго нэмэх</>}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
