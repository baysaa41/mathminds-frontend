// frontend/src/components/FeedFilterBar.jsx
// Feed-ийн шүүлтүүр: хайлт, контентын төрөл, "дагаж буй" горим.
// X (Twitter)-ийн sticky толгой шиг — "Бүгдэд / Дагаж буй" tab + хайлт + chips.

import Form from 'react-bootstrap/Form';
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
    <div className="x-filterbar">
      {/* Горим сонгох tab */}
      <div className="x-filterbar__tabs">
        <button
          type="button"
          className={`x-filterbar__tab ${scope === 'all' ? 'is-active' : ''}`}
          onClick={() => onScopeChange('all')}
        >
          Бүгдэд
        </button>
        <button
          type="button"
          className={`x-filterbar__tab ${scope === 'following' ? 'is-active' : ''}`}
          onClick={() => onScopeChange('following')}
        >
          Дагаж буй
        </button>
      </div>

      {/* Хайлт */}
      <div className="x-filterbar__search mb-2">
        <Search
          size={16}
          className="position-absolute text-muted"
          style={{ left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <Form.Control
          type="search"
          size="sm"
          placeholder="Пост, бодлого, зохиогч хайх..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            paddingLeft: 36,
            paddingRight: search ? 36 : 12,
            borderRadius: 9999,
            background: '#f7f9f9',
            borderColor: 'transparent',
          }}
          aria-label="Feed-ээс хайх"
        />
        {search && (
          <button
            type="button"
            className="btn btn-link text-muted p-0 border-0 position-absolute"
            style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => onSearchChange('')}
            aria-label="Хайлтыг цэвэрлэх"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Контентын төрөл */}
      <div className="x-filterbar__chips">
        {FEED_CONTENT_TYPES.map((type) => (
          <button
            key={type.value || 'all'}
            type="button"
            className={`x-filterbar__chip ${contentType === type.value ? 'is-active' : ''}`}
            onClick={() => onContentTypeChange(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeedFilterBar;
