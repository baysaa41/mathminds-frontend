// src/components/clubSubGroups/AddMembersModal.jsx
// Дэд бүлэгт гишүүд нэмэх modal

import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import { UserPlus } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import { Avatar } from './Avatar.jsx';
import { displayName } from './displayName.js';

export const AddMembersModal = ({ show, onHide, subgroup, clubMembers, onAdded }) => {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { if (show) { setSelected([]); setSearch(''); } }, [show]);

  const currentIds = new Set((subgroup?.members || []).map(m => m.id));
  const available = clubMembers.filter(m =>
    !currentIds.has(m.id) &&
    (search === '' ||
      `${m.last_name} ${m.first_name} ${m.username}`.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id) => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id]
  );
  const toggleAll = () =>
    setSelected(selected.length === available.length ? [] : available.map(m => m.id));

  const handleAdd = async () => {
    if (!selected.length) return;
    setSaving(true);
    try {
      const res = await apiClient.post(
        `/api/club-subgroups/${subgroup.id}/add_members/`,
        { user_ids: selected }
      );
      onAdded(res.data.subgroup);
      onHide();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">
          Гишүүд нэмэх — <Badge bg={subgroup?.color || 'secondary'}>{subgroup?.name}</Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control size="sm" placeholder="Нэрээр хайх..." className="mb-2"
          value={search} onChange={e => setSearch(e.target.value)} />
        {available.length === 0 ? (
          <div className="text-muted small text-center py-3">
            {search ? 'Тохирох гишүүн олдсонгүй' : 'Нэмэх гишүүн байхгүй'}
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-muted">{available.length} гишүүн</span>
              <Button variant="link" size="sm" className="p-0 small" onClick={toggleAll}>
                {selected.length === available.length ? 'Бүгдийг болих' : 'Бүгдийг сонгох'}
              </Button>
            </div>
            <ListGroup variant="flush" style={{ maxHeight: 320, overflowY: 'auto' }}>
              {available.map(m => (
                <ListGroup.Item key={m.id} action onClick={() => toggle(m.id)}
                  className="d-flex align-items-center gap-2 py-1 px-2">
                  <Form.Check type="checkbox" checked={selected.includes(m.id)} readOnly />
                  <Avatar user={m} size={26} />
                  <div className="small">
                    <div className="fw-medium">{displayName(m)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>@{m.username}</div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>Болих</Button>
        <Button variant="primary" size="sm" onClick={handleAdd}
          disabled={saving || !selected.length}>
          {saving
            ? <Spinner animation="border" size="sm" />
            : <><UserPlus size={14} className="me-1" />{selected.length} гишүүн нэмэх</>}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
