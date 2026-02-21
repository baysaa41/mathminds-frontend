// frontend/src/components/SearchWidget.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Spinner from 'react-bootstrap/Spinner';
import { Search, X, FileText, HelpCircle, Calculator, ClipboardList, MessageSquare, User, Users } from 'lucide-react';
import apiClient from '../api/axiosConfig';

const SearchWidget = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Debounce хайлт
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/api/minds/search/', {
        params: { q: searchQuery, limit: 5 }
      });
      setResults(response.data);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Хайлт хийхэд алдаа гарлаа.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setShowResults(false);
    setError('');
  };

  const handleResultClick = (type, item) => {
    setShowResults(false);
    setQuery('');

    switch (type) {
      case 'post':
        navigate(`/post/${item.uuid || item.id}`);
        break;
      case 'article':
        navigate(`/article/${item.id}`);
        break;
      case 'problem':
        navigate(`/problem/${item.id}`);
        break;
      case 'formula':
        navigate(`/formula/${item.id}`);
        break;
      case 'quiz':
        navigate(`/quiz/${item.id}`);
        break;
      case 'user':
        navigate(`/profile/${item.username}`);
        break;
      case 'club':
        navigate(`/clubs/${item.id}`);
        break;
      default:
        break;
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'post':
        return <MessageSquare size={16} className="me-2 text-primary" />;
      case 'article':
        return <FileText size={16} className="me-2 text-success" />;
      case 'problem':
        return <HelpCircle size={16} className="me-2 text-warning" />;
      case 'formula':
        return <Calculator size={16} className="me-2 text-info" />;
      case 'quiz':
        return <ClipboardList size={16} className="me-2 text-danger" />;
      case 'user':
        return <User size={16} className="me-2 text-secondary" />;
      case 'club':
        return <Users size={16} className="me-2 text-primary" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      post: 'Пост',
      article: 'Нийтлэл',
      problem: 'Бодлого',
      formula: 'Томъёо',
      quiz: 'Тест',
      user: 'Хэрэглэгч',
      club: 'Клуб'
    };
    return labels[type] || type;
  };

  const renderResultItem = (type, item) => {
    let title, subtitle;

    if (type === 'user') {
      title = item.first_name && item.last_name
        ? `${item.first_name} ${item.last_name}`
        : item.username;
      subtitle = `@${item.username}`;
    } else if (type === 'club') {
      title = item.name || 'Клубын нэргүй';
      subtitle = item.description?.substring(0, 50) || '';
    } else {
      title = item.title || item.content?.substring(0, 50) || 'Гарчиггүй';
      subtitle = item.author?.username || item.author_username || '';
    }

    return (
      <ListGroup.Item
        key={`${type}-${item.id}`}
        action
        onClick={() => handleResultClick(type, item)}
        className="d-flex align-items-start py-2"
      >
        {getIcon(type)}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <div className="fw-semibold small" style={{ fontSize: '0.9rem' }}>
              {title}
            </div>
            <Badge bg="light" text="dark" className="ms-2">
              {getTypeLabel(type)}
            </Badge>
          </div>
          {subtitle && (
            <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
              {subtitle}
            </div>
          )}
        </div>
      </ListGroup.Item>
    );
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="h6 mb-3">
          <Search size={18} className="me-2" />
          Хайлт
        </Card.Title>

        <InputGroup size="sm">
          <Form.Control
            type="text"
            placeholder="Хэрэглэгч, клуб, контент хайх..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results && setShowResults(true)}
          />
          {query && (
            <Button variant="outline-secondary" onClick={handleClear}>
              <X size={16} />
            </Button>
          )}
        </InputGroup>

        {loading && (
          <div className="text-center mt-3">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        )}

        {error && (
          <div className="alert alert-danger mt-3 py-2 small mb-0">
            {error}
          </div>
        )}

        {showResults && results && results.total_count > 0 && (
          <div className="mt-3">
            <div className="text-muted small mb-2">
              Нийт {results.total_count} үр дүн олдлоо
            </div>
            <ListGroup variant="flush" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {results.users?.map(item => renderResultItem('user', item))}
              {results.clubs?.map(item => renderResultItem('club', item))}
              {results.posts?.map(item => renderResultItem('post', item))}
              {results.articles?.map(item => renderResultItem('article', item))}
              {results.problems?.map(item => renderResultItem('problem', item))}
              {results.formulas?.map(item => renderResultItem('formula', item))}
              {results.quizzes?.map(item => renderResultItem('quiz', item))}
            </ListGroup>
          </div>
        )}

        {showResults && results && results.total_count === 0 && (
          <div className="alert alert-info mt-3 py-2 small mb-0">
            <Search size={16} className="me-2" />
            "{query}" гэсэн үр дүн олдсонгүй.
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default SearchWidget;
