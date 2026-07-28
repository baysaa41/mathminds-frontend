// src/components/docImport/FileResultSection.jsx
// DocImportPage-ийн нэг файлаас задлагдсан бодлогуудын жагсаалт

import Badge from 'react-bootstrap/Badge';
import Alert from 'react-bootstrap/Alert';

import { fileIcon } from './docImportUtils.js';
import ProblemCard from './ProblemCard.jsx';

export default function FileResultSection({ result, onProblemsChange }) {
  if (result.error) {
    return (
      <Alert variant="danger">
        <strong>{result.filename}:</strong> {result.error}
      </Alert>
    );
  }

  const handleChange = (idx, updated) => {
    const newProbs = [...result.problems];
    newProbs[idx] = updated;
    onProblemsChange({ ...result, problems: newProbs });
  };

  const handleDelete = (idx) => {
    onProblemsChange({ ...result, problems: result.problems.filter((_, i) => i !== idx) });
  };

  const handleImageAttach = (probIdx, imgData) => {
    const newProbs = result.problems.map((p, i) =>
      i === probIdx ? { ...p, images: [...(p.images || []), imgData] } : p
    );
    onProblemsChange({ ...result, problems: newProbs });
  };

  const handleImageDetach = (probIdx, imgIdx) => {
    const newProbs = result.problems.map((p, i) =>
      i === probIdx
        ? { ...p, images: (p.images || []).filter((_, ii) => ii !== imgIdx) }
        : p
    );
    onProblemsChange({ ...result, problems: newProbs });
  };

  // Нийт зурагтай бодлогын тоо
  const figureCount = result.problems.filter((p) => p.has_figure).length;
  const attachedCount = result.problems.filter((p) => (p.images || []).length > 0).length;

  return (
    <div className="mb-4">
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <span className="fs-5">{fileIcon(result.filename)}</span>
        <div>
          <strong>{result.filename}</strong>
          {result.source && result.source !== result.filename && (
            <span className="text-muted ms-2 small">({result.source})</span>
          )}
        </div>
        <Badge bg={result.language === 'mongolian' ? 'success' : 'info'} className="ms-auto">
          {result.language === 'mongolian' ? '🇲🇳 Монгол' : '🇬🇧 Англи'}
        </Badge>
        <Badge bg="secondary">{result.problems.length} бодлого</Badge>
        {result.images?.length > 0 && (
          <Badge bg="warning" text="dark">🖼 {result.images.length} зураг</Badge>
        )}
        {figureCount > 0 && (
          <Badge bg={attachedCount >= figureCount ? 'success' : 'danger'}>
            {attachedCount}/{figureCount} зураг хавсарсан
          </Badge>
        )}
      </div>

      {result.problems.length === 0 ? (
        <Alert variant="warning">Бодлого олдсонгүй.</Alert>
      ) : (
        result.problems.map((prob, i) => (
          <ProblemCard
            key={prob._key}
            prob={prob}
            index={i}
            onChange={handleChange}
            onDelete={handleDelete}
            extractedImages={result.images || []}
            onImageAttach={handleImageAttach}
            onImageDetach={handleImageDetach}
          />
        ))
      )}
    </div>
  );
}
