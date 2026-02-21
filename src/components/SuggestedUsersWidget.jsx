// src/components/SuggestedUsersWidget.jsx
// Санал болгох хэрэглэгчдийн widget

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { UserPlus, Users, CheckCircle } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import UserAvatar from './UserAvatar';
import UserName from './UserName';

const SuggestedUsersWidget = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [processingIds, setProcessingIds] = useState(new Set());

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/api/suggested/');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Санал болгох хэрэглэгчид татахад алдаа:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (username, userId) => {
    if (processingIds.has(userId)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(userId));
      await apiClient.post(`/users/api/${username}/follow/`);
      setFollowingIds((prev) => new Set(prev).add(userId));

      // Дагасны дараа жагсаалтаас хасах
      setTimeout(() => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }, 500);
    } catch (error) {
      console.error('Дагахад алдаа:', error);
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-4">
          <Spinner animation="border" size="sm" variant="primary" />
          <div className="text-muted small mt-2">Ачааллаж байна...</div>
        </Card.Body>
      </Card>
    );
  }

  if (users.length === 0) {
    return null; // Санал болгох хэрэглэгч байхгүй бол харуулахгүй
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white border-bottom">
        <h6 className="mb-0 fw-bold">
          <Users size={16} className="me-2" />
          Хэнийг дагах
        </h6>
      </Card.Header>
      <ListGroup variant="flush">
        {users.slice(0, 3).map((user) => (
          <ListGroup.Item key={user.id} className="py-3 px-3">
            <div className="d-flex align-items-start justify-content-between">
              <div className="d-flex align-items-start flex-grow-1 me-2">
                <Link to={`/profile/${user.username}`} className="me-2 flex-shrink-0">
                  <UserAvatar user={user} size={40} />
                </Link>
                <div className="flex-grow-1">
                  <div className="mb-1">
                    <UserName
                      user={user}
                      showLink={true}
                      className="fw-semibold text-dark"
                      showMembershipBadge={true}
                    />
                  </div>
                  <Link
                    to={`/profile/${user.username}`}
                    className="text-decoration-none text-muted small"
                  >
                    @{user.username}
                  </Link>
                </div>
              </div>
              <Button
                size="sm"
                variant={followingIds.has(user.id) ? 'outline-success' : 'primary'}
                onClick={(e) => {
                  e.preventDefault();
                  handleFollow(user.username, user.id);
                }}
                disabled={processingIds.has(user.id) || followingIds.has(user.id)}
                style={{ minWidth: '70px' }}
                className="flex-shrink-0"
              >
                {processingIds.has(user.id) ? (
                  <Spinner animation="border" size="sm" />
                ) : followingIds.has(user.id) ? (
                  <>
                    <CheckCircle size={14} />
                    &nbsp;Дагасан
                  </>
                ) : (
                  <>
                    <UserPlus size={14} />
                    &nbsp;Дагах
                  </>
                )}
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {users.length > 3 && (
        <Card.Footer className="bg-light text-center py-2">
          <Link to="/users/suggested" className="text-decoration-none">
            <small className="text-primary">
              Санал болгох хэрэглэгчдийн жагсаалт үзэх
            </small>
          </Link>
        </Card.Footer>
      )}
    </Card>
  );
};

export default SuggestedUsersWidget;
