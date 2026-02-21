// ClubAssignmentsWidget.jsx
// Даалгавар, бодлого (Assignments, problems) виджет

import React from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import { ClipboardList, Calendar } from 'lucide-react';

const ClubAssignmentsWidget = ({ club }) => {
  if (!club) return null;

  const assignments = club.assignments || [];

  if (assignments.length === 0) {
    return null; // Даалгавар байхгүй бол харуулахгүй
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0 fw-bold">
          <ClipboardList size={16} className="me-2" />
          Даалгавар, бодлого
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {assignments.map((assignment) => (
            <ListGroup.Item
              key={assignment.id}
              action
              className="py-2 px-3"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="small fw-semibold mb-1">{assignment.title}</div>
                  {assignment.deadline && (
                    <div className="d-flex align-items-center text-muted" style={{ fontSize: '0.7rem' }}>
                      <Calendar size={12} className="me-1" />
                      {formatDate(assignment.deadline)}
                    </div>
                  )}
                </div>
                {assignment.deadline && isOverdue(assignment.deadline) && (
                  <Badge bg="danger" pill>Хугацаа дууссан</Badge>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ClubAssignmentsWidget;
