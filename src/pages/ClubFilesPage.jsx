// Club Files Page - Клубын баримт файлууд
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { FileText, FileSpreadsheet, File, FileDown, FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { createFileItem, updateFileItem, deleteFileItem } from '../services/clubContentService';
import { formatErrorMessage } from '../services/clubService';

const FILE_ICONS = {
  PDF:  <FileText size={18} className="text-danger" />,
  DOCX: <FileText size={18} className="text-primary" />,
  DOC:  <FileText size={18} className="text-primary" />,
  XLSX: <FileSpreadsheet size={18} className="text-success" />,
  XLS:  <FileSpreadsheet size={18} className="text-success" />,
  PPTX: <FileText size={18} className="text-warning" />,
  PPT:  <FileText size={18} className="text-warning" />,
};

const FILE_TYPES = [
  { value: 'PDF', label: 'PDF' },
  { value: 'DOCX', label: 'Word баримт (.docx)' },
  { value: 'DOC', label: 'Word баримт (.doc)' },
  { value: 'XLSX', label: 'Excel (.xlsx)' },
  { value: 'XLS', label: 'Excel (.xls)' },
  { value: 'PPTX', label: 'PowerPoint (.pptx)' },
  { value: 'PPT', label: 'PowerPoint (.ppt)' },
  { value: 'DJVU', label: 'DJVU' },
  { value: 'EPUB', label: 'EPUB' },
  { value: 'TXT', label: 'Текст файл' },
  { value: 'OTHER', label: 'Бусад' },
];

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const EMPTY_FORM = { title: '', description: '', file_type: 'PDF', folder: '', file: null };

const ClubFilesPage = () => {
  const { clubData, isTeacherOrAdmin, clubActions } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // file object being edited, null = new
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  if (!clubData) return null;

  const files = clubData.files || [];

  // Хавтсаар бүлэглэх
  const grouped = {};
  files.forEach((f) => {
    const folder = f.folder || '';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(f);
  });
  const folders = Object.keys(grouped).sort();

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (file) => {
    setEditing(file);
    setForm({
      title: file.title || '',
      description: file.description || '',
      file_type: file.file_type || 'PDF',
      folder: file.folder || '',
      file: null,
    });
    setError('');
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, files: fileList } = e.target;
    if (name === 'file') {
      setForm((prev) => ({ ...prev, file: fileList[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Гарчиг оруулна уу.'); return; }
    if (!editing && !form.file) { setError('Файл сонгоно уу.'); return; }

    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('file_type', form.file_type);
      fd.append('folder', form.folder);
      if (form.file) fd.append('file', form.file);
      if (!editing) fd.append('club', clubData.id);

      if (editing) {
        await updateFileItem(editing.id, fd);
      } else {
        await createFileItem(fd);
      }
      await clubActions.onUpdate();
      setShowModal(false);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    setDeletingId(fileToDelete.id);
    try {
      await deleteFileItem(fileToDelete.id);
      await clubActions.onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Файлууд</h4>
        {isTeacherOrAdmin && (
          <Button size="sm" variant="primary" onClick={openAdd}>
            <Plus size={14} className="me-1" />
            Файл нэмэх
          </Button>
        )}
      </div>

      {files.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center text-muted py-5">
            <FileText size={48} className="mb-3 opacity-25" />
            <p className="mb-0">Файл байхгүй байна.</p>
          </Card.Body>
        </Card>
      ) : (
        folders.map((folder) => (
          <Card key={folder} className="shadow-sm mb-3">
            {folder && (
              <Card.Header className="bg-white">
                <h6 className="mb-0 fw-semibold">
                  <FolderOpen size={16} className="me-2 text-warning" />
                  {folder}
                </h6>
              </Card.Header>
            )}
            <ListGroup variant="flush">
              {grouped[folder].map((file) => (
                <ListGroup.Item key={file.id} className="py-2 px-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="flex-shrink-0">
                      {FILE_ICONS[file.file_type] || <File size={18} className="text-secondary" />}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="small fw-semibold text-decoration-none text-dark text-truncate d-block"
                      >
                        {file.title}
                      </a>
                      {file.description && (
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {file.description}
                        </div>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {file.file_type_display && (
                        <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.65rem' }}>
                          {file.file_type_display}
                        </Badge>
                      )}
                      {file.file_size && (
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatFileSize(file.file_size)}
                        </span>
                      )}
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-muted">
                        <FileDown size={14} />
                      </a>
                      {isTeacherOrAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="p-1"
                            style={{ lineHeight: 1 }}
                            onClick={() => openEdit(file)}
                          >
                            <Pencil size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="p-1"
                            style={{ lineHeight: 1 }}
                            disabled={deletingId === file.id}
                            onClick={() => askDelete(file)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        ))
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Файл засах' : 'Файл нэмэх'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          <Form.Group className="mb-3">
            <Form.Label>Гарчиг <span className="text-danger">*</span></Form.Label>
            <Form.Control
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Файлын гарчиг"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Тайлбар</Form.Label>
            <Form.Control
              name="description"
              as="textarea"
              rows={2}
              value={form.description}
              onChange={handleChange}
              placeholder="Файлын тайлбар (заавал биш)"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Хавтас</Form.Label>
            <Form.Control
              name="folder"
              value={form.folder}
              onChange={handleChange}
              placeholder="Жишээ: 1-р бүлэг (заавал биш)"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Файлын төрөл</Form.Label>
            <Form.Select name="file_type" value={form.file_type} onChange={handleChange}>
              {FILE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
              Файл {!editing && <span className="text-danger">*</span>}
              {editing && <span className="text-muted small"> (шинэ файл сонговол солигдоно)</span>}
            </Form.Label>
            <Form.Control
              name="file"
              type="file"
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
            Болих
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Хадгалж байна...' : 'Хадгалах'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirm modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Файл устгах</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            <strong>{fileToDelete?.title}</strong> файлыг устгах уу?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
            Болих
          </Button>
          <Button variant="danger" size="sm" onClick={confirmDelete} disabled={!!deletingId}>
            Устгах
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClubFilesPage;
