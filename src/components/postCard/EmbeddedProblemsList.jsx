// src/components/postCard/EmbeddedProblemsList.jsx

import { Link } from 'react-router-dom';
import Accordion from 'react-bootstrap/Accordion';
import LivePreview from '../LivePreview';

export const EmbeddedProblemsList = ({ problems }) => {
  if (!problems || problems.length === 0) return null;

  return (
    <Accordion className="mt-3" alwaysOpen>
      {problems.map((p, idx) => (
        <Accordion.Item eventKey={String(idx)} key={p.id}>
          <Accordion.Header>Жишээ {idx + 1}</Accordion.Header>
          <Accordion.Body>
            <div className="mathjax-content mb-2" style={{ whiteSpace: 'pre-wrap' }}>
              <LivePreview content={p.statement || p.title} />
            </div>
            <div className="text-end">
              <Link to={`/problem/${p.uuid}`} target="_blank" rel="noopener noreferrer" className="small">
                Дэлгэрэнгүй харах →
              </Link>
            </div>
          </Accordion.Body>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
