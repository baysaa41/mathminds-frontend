// ClubMediaWidget.jsx
// Медиа файлууд (Media files) виджет

import React from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { FileText, Image, File, FileDown } from 'lucide-react';

const ClubMediaWidget = ({ club }) => {
  if (!club) return null;

  const mediaFiles = club.media_files || [];

  if (mediaFiles.length === 0) {
    return null; // Медиа файл байхгүй бол харуулахгүй
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (mediaType) => {
    switch (mediaType) {
      case 'PDF':
        return <FileText size={14} className="me-2 text-danger" />;
      case 'IMAGE':
        return <Image size={14} className="me-2 text-primary" />;
      default:
        return <File size={14} className="me-2 text-secondary" />;
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0 fw-bold">
          <FileText size={16} className="me-2" />
          Медиа файлууд
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {mediaFiles.map((file) => (
            <ListGroup.Item
              key={file.id}
              action
              className="py-2 px-3"
              as="a"
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center flex-grow-1">
                  {getFileIcon(file.media_type)}
                  <div>
                    <div className="small fw-semibold">{file.title}</div>
                    {file.file_size && (
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {formatFileSize(file.file_size)}
                      </div>
                    )}
                  </div>
                </div>
                <FileDown size={14} className="text-muted" />
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ClubMediaWidget;
