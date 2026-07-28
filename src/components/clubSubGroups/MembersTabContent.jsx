// src/components/clubSubGroups/MembersTabContent.jsx
// ClubSubGroupsPage-ийн "Гишүүд" табын агуулга (state-гүй, зөвхөн props хүлээж авдаг)

import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { UserMinus } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { displayName } from './displayName.js';

export function MembersTabContent({ selected, isTeacherOrAdmin, removingId, onRemoveMember, onViewReport }) {
  return (
    <Card.Body className="p-0">
      {!selected.members ? (
        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
      ) : selected.members.length === 0 ? (
        <div className="text-center text-muted small py-4">Гишүүн байхгүй байна.</div>
      ) : (
        <div className="row g-0">
          {selected.members.map((m) => (
            <div key={m.id} className="col-12">
              <div className="d-flex align-items-center gap-2 p-2"
                style={{ borderBottom: '1px solid #f0f0f0' }}>
                <Avatar user={m} size={32} />
                <div className="flex-grow-1 min-width-0">
                  <div className="small fw-medium text-truncate">{displayName(m)}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
                    @{m.username}
                  </div>
                </div>
                {isTeacherOrAdmin && (
                  <div className="d-flex gap-1 flex-shrink-0">
                    <Button variant="link" size="sm" className="text-info p-0"
                      title="Тайлан харах"
                      onClick={() => onViewReport(m.username)}>
                      📊
                    </Button>
                    <Button variant="link" size="sm" className="text-danger p-0"
                      onClick={() => onRemoveMember(m.id)}
                      disabled={removingId === m.id} title="Хасах">
                      {removingId === m.id
                        ? <Spinner animation="border" size="sm" />
                        : <UserMinus size={14} />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {selected.members?.length > 0 && (
        <div className="px-3 py-2 text-muted small border-top">
          Нийт {selected.members.length} гишүүн
        </div>
      )}
    </Card.Body>
  );
}
