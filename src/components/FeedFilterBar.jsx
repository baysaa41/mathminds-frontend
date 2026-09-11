// frontend/src/components/FeedFilterBar.jsx
// Feed-ийн шүүлтүүр: хайлт, контентын төрөл, "дагаж буй" горим

import Form from 'react-bootstrap/Form';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import { Search, X } from 'lucide-react';

// content_type утгууд (backend Post.content_type)
const FEED_CONTENT_TYPES = [
  { value: '', label: 'Бүгд' },
  { value: 'post', label: 'Пост' },
  { value: 'problem', label: 'Бодлого' },
  { value: 'article', label: 'Онол' },
  { value: 'formula', label: 'Томьёо' },
  { value: 'quiz', label: 'Тест' },
  { value: 'ai_chat', label: 'AI чат' },
];

const FeedFilterBar = ({
  search,
  onSearchChange,
  scope,
  onScopeChange,
  contentType,
  onContentTypeChange,
}) => {
  return (
    <div className="card shadow-sm m-3 feed-filter-bar">
      <div className="card-body py-3">
        {/* Хайлт + горим */}
        <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
          <div className="position-relative flex-grow-1">
            <Search
              size={16}
              className="position-absolute text-muted"
              style={{ left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <Form.Control
              type="search"
              placeholder="Пост, бодлого, зохиогч хайх..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ paddingLeft: 36, paddingRight: search ? 36 : 12 }}
              aria-label="Feed-ээс хайх"
            />
            {search && (
              <Button
                variant="link"
                size="sm"
                className="position-absolute text-muted p-0 border-0"
                style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => onSearchChange('')}
                aria-label="Хайлтыг цэвэрлэх"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          <ButtonGroup className="flex-shrink-0">
            <Button
              variant={scope === 'all' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => onScopeChange('all')}
            >
              Бүгд
            </Button>
            <Button
              variant={scope === 'following' ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => onScopeChange('following')}
            >
              Дагаж буй
            </Button>
          </ButtonGroup>
        </div>

        {/* Контентын төрөл */}
        <div className="d-flex flex-wrap gap-1">
          {FEED_CONTENT_TYPES.map((type) => (
            <Button
              key={type.value || 'all'}
              variant={contentType === type.value ? 'dark' : 'outline-secondary'}
              size="sm"
              className="rounded-pill px-3"
              onClick={() => onContentTypeChange(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedFilterBar;
