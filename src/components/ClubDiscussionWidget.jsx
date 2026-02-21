// ClubDiscussionWidget.jsx
// Хэлэлцүүлэг / Q&A виджет

import React from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import { MessageCircle, MessageSquare, Pin } from 'lucide-react';

const ClubDiscussionWidget = ({ club }) => {
  if (!club) return null;

  const discussions = club.discussions || [];

  if (discussions.length === 0) {
    return null; // Хэлэлцүүлэг байхгүй бол харуулахгүй
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0 fw-bold">
          <MessageCircle size={16} className="me-2" />
          Хэлэлцүүлэг / Q&A
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {discussions.map((discussion) => (
            <ListGroup.Item
              key={discussion.id}
              action
              className="py-2 px-3"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="d-flex align-items-start flex-grow-1">
                  {discussion.is_pinned ? (
                    <Pin size={14} className="me-2 mt-1 text-warning" />
                  ) : (
                    <MessageSquare size={14} className="me-2 mt-1 text-primary" />
                  )}
                  <div className="flex-grow-1">
                    <div className="small fw-semibold">{discussion.title}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {discussion.reply_count} хариулт
                    </div>
                  </div>
                </div>
                {discussion.is_closed && (
                  <Badge bg="secondary" pill>
                    Хаасан
                  </Badge>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ClubDiscussionWidget;
