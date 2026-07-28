// src/components/problemEdit/KeywordsManager.jsx
// ProblemEditPage-ийн холбоотой түлхүүр үгсийн хэсэг (state-гүй, зөвхөн props хүлээж авдаг)

import Badge from 'react-bootstrap/Badge';
import CloseButton from 'react-bootstrap/CloseButton';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import { Tag } from 'lucide-react';

export function KeywordsManager({
  keywords, keywordSearch, setKeywordSearch, keywordResults, loadingKeywords,
  onAddKeyword, onRemoveKeyword,
}) {
  return (
    <div id="keywords-manager">
      <h4>
        <Tag size={20} className="me-2" />
        Холбоотой түлхүүр үгс
      </h4>
      <div id="current-keywords-list" className="mb-3">
        {keywords.map((kw) => (
          <Badge bg="secondary" key={kw.id} className="me-1 keyword-badge" pill>
            {kw.name}
            <CloseButton
              variant="white"
              className="ms-1"
              style={{ fontSize: '0.65em' }}
              onClick={() => onRemoveKeyword(kw)}
            />
          </Badge>
        ))}
      </div>

      <Form.Label htmlFor="keyword-search-input">Түлхүүр үг хайж нэмэх:</Form.Label>
      <InputGroup className="mb-1">
        <Form.Control
          type="text"
          id="keyword-search-input"
          placeholder="Дор хаяж 2 үсэг бичнэ үү..."
          value={keywordSearch}
          onChange={(e) => setKeywordSearch(e.target.value)}
        />
        {loadingKeywords && (
          <InputGroup.Text>
            <Spinner animation="border" size="sm" />
          </InputGroup.Text>
        )}
      </InputGroup>
      {keywordResults.length > 0 && (
        <ListGroup id="keyword-search-results">
          {keywordResults.map((kw) => (
            <ListGroup.Item key={kw.id} action onClick={() => onAddKeyword(kw)}>
              {kw.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
