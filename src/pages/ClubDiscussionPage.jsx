// Club Discussion Page - Клубын хэлэлцүүлэг (feed)
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ClubFeed from '../components/ClubFeed';
import { MessageSquare } from 'lucide-react';

const ClubDiscussionPage = () => {
  const { clubData: club } = useOutletContext();

  if (!club) return null;

  return (
    <div className="container-fluid">
      {club.role ? (
        <ClubFeed clubId={club.id} clubName={club.name} />
      ) : (
        <Card>
          <Card.Body>
            <div className="text-center py-5 text-muted">
              <MessageSquare size={40} className="mb-3" />
              <p>Клубын гишүүн болсноор хэлэлцүүлэгт оролцох боломжтой</p>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ClubDiscussionPage;
