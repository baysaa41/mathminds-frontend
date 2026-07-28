// src/components/curriculumAdmin/ObjectivesEditor.jsx
// Долоо хоногийн сэдвийн суралцахуйн зорилтуудыг засварлах жагсаалт

import { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { Pencil, Trash2, Plus } from 'lucide-react';
import * as svc from '../../services/curriculumAdminService';

export default function ObjectivesEditor({ topicId, objectives, onRefresh }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleting, setDeleting] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      await svc.createObjective({ weekly_topic: topicId, text });
      setText('');
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    setSaving(true);
    try {
      await svc.updateObjective(id, { text: editText });
      setEditId(null);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await svc.deleteObjective(id);
      onRefresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <ul className="list-group list-group-flush mb-2">
        {objectives.length === 0 && (
          <li className="list-group-item text-muted small">Зорилт байхгүй</li>
        )}
        {objectives.map(obj => (
          <li key={obj.id} className="list-group-item px-0 py-1">
            {editId === obj.id ? (
              <div className="d-flex gap-1">
                <Form.Control
                  size="sm" value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
                <Button size="sm" variant="success" onClick={() => handleUpdate(obj.id)} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : 'OK'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>✕</Button>
              </div>
            ) : (
              <div className="d-flex justify-content-between align-items-start">
                <span className="small">{obj.text}</span>
                <div className="ms-2 flex-shrink-0">
                  <Button
                    size="sm" variant="link" className="p-0 me-1 text-secondary"
                    onClick={() => { setEditId(obj.id); setEditText(obj.text); }}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    size="sm" variant="link" className="p-0 text-danger"
                    onClick={() => handleDelete(obj.id)}
                    disabled={deleting === obj.id}
                  >
                    {deleting === obj.id ? <Spinner size="sm" /> : <Trash2 size={12} />}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Form onSubmit={handleAdd} className="d-flex gap-1">
        <Form.Control
          size="sm" placeholder="Шинэ зорилт нэмэх..."
          value={text} onChange={e => setText(e.target.value)}
        />
        <Button size="sm" type="submit" variant="outline-primary" disabled={saving || !text.trim()}>
          <Plus size={14} />
        </Button>
      </Form>
    </div>
  );
}
