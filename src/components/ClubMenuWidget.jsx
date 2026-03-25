// ClubMenuWidget - Navigation menu for club sections
import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, BookOpenText, MessageSquare, Video, FileText, File, ClipboardList, FileQuestion, Menu, Info, Users, Dumbbell } from 'lucide-react';
import LivePreview from './LivePreview';

const ClubMenuWidget = ({ club }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!club) return null;

  const clubId = club.id;

  const menuItems = [
    { path: `/clubs/${clubId}/discussions`, label: 'Хэлэлцүүлэг', icon: MessageSquare },
    { path: `/clubs/${clubId}/curriculum`, label: 'Хөтөлбөр', icon: BookOpen },
    { path: `/clubs/${clubId}/videos`, label: 'Видео хичээл', icon: Video },
    { path: `/clubs/${clubId}/files`, label: 'Файлууд', icon: File },
    { path: `/clubs/${clubId}/media`, label: 'Медиа', icon: FileText },
    { path: `/clubs/${clubId}/lessons`, label: 'Хичээл', icon: BookOpenText },
    { path: `/clubs/${clubId}/exercises`, label: 'Дасгал', icon: Dumbbell },
    { path: `/clubs/${clubId}/assignments`, label: 'Даалгавар', icon: ClipboardList },
    { path: `/clubs/${clubId}/quizzes`, label: 'Сорил', icon: FileQuestion },
    { path: `/clubs/${clubId}/members`, label: 'Гишүүд', icon: Users },
    { path: `/clubs/${clubId}/info`, label: 'Мэдээлэл', icon: Info },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <div className="mb-2">
          <small className="text-muted d-block mb-1">Клуб</small>
          <h6 className="mb-0 fw-bold">
            <LivePreview content={club.name} />
          </h6>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <ListGroup variant="flush">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <ListGroup.Item
                key={item.path}
                action
                active={active}
                onClick={() => navigate(item.path)}
                className="py-2 px-3 d-flex align-items-center"
                style={{ cursor: 'pointer' }}
              >
                <Icon size={16} className="me-2" />
                <span className="small">{item.label}</span>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ClubMenuWidget;
