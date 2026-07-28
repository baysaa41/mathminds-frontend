// src/components/quizEdit/QuizProblemsList.jsx
// QuizEditPage-ийн зүүн тал: сонгосон бодлогуудын drag&drop жагсаалт

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import ListGroup from 'react-bootstrap/ListGroup';
import { Link } from 'react-router-dom';
import { PlusCircle, Sparkles, Edit3, ArrowLeftRight, Shuffle } from 'lucide-react';
import { ProblemBodyPreview } from './problemDisplay.jsx';

export function QuizProblemsList({
  selectedProblems,
  autoSaving,
  autoSaveError,
  generatingAll,
  generateAllProgress,
  generatingSummaryFor,
  saving,
  warningAcknowledged,
  wasInitiallyPublic,
  user,
  onDragEnd,
  onGenerateAllMissing,
  onGenerateSummary,
  onOpenReplaceModal,
  onRemoveProblem,
  onShowAddModal,
  onShowShuffleChoicePositionsModal,
}) {
  const editLocked = !warningAcknowledged && wasInitiallyPublic;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Card className="mb-4">
        <Card.Header as="h5" className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="d-flex align-items-center gap-2">
            Тестэд багтсан бодлогууд ({selectedProblems.length})
            {autoSaving && (
              <span className="text-muted fw-normal" style={{ fontSize: '0.78rem' }}>
                <Spinner as="span" size="sm" className="me-1" />хадгалж байна...
              </span>
            )}
            {!autoSaving && autoSaveError && (
              <span className="text-danger fw-normal" style={{ fontSize: '0.78rem' }}>{autoSaveError}</span>
            )}
          </span>
          <div className="d-flex gap-2">
            {user?.is_staff && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={onShowShuffleChoicePositionsModal}
                disabled={editLocked}
                title="Сонгох тестийн зөв хариултын байрлалыг жигдлэх (зөвхөн админ)"
              >
                <Shuffle size={14} className="me-1" />
                Байрлал жигдлэх
              </Button>
            )}
            {selectedProblems.some((p) => !p.ai_summary) && (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={onGenerateAllMissing}
                disabled={generatingAll || generatingSummaryFor !== null}
                title="AI summary байхгүй бодлогуудыг бүгдийг тооцох"
              >
                {generatingAll ? (
                  <>
                    <Spinner as="span" size="sm" className="me-1" />
                    {generateAllProgress.current}/{generateAllProgress.total}
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="me-1" />
                    Бүгдийг тооцох ({selectedProblems.filter((p) => !p.ai_summary).length})
                  </>
                )}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onShowAddModal}
              disabled={editLocked}
            >
              <PlusCircle size={16} className="me-1" />
              Бодлого нэмэх
            </Button>
          </div>
        </Card.Header>

        <Droppable droppableId="selectedProblemsList">
          {(provided) => (
            <ListGroup variant="flush" ref={provided.innerRef} {...provided.droppableProps}>
              {selectedProblems.length > 0 ? (
                selectedProblems.map((problem, index) => (
                  <Draggable key={problem.id} draggableId={String(problem.id)} index={index}>
                    {(provided) => (
                      <ListGroup.Item
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="d-flex align-items-start gap-2 py-3"
                      >
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="px-1 text-muted flex-shrink-0 mt-1"
                          title="Чирч эрэмбийг солих"
                          style={{ cursor: 'grab' }}
                        >
                          <i className="bi bi-grip-vertical" />
                        </div>

                        <span className="fw-bold flex-shrink-0 mt-1">{index + 1}.</span>

                        {/* Бодлогын бүрэн харагдац */}
                        <div className="flex-grow-1 min-width-0">
                          <ProblemBodyPreview problem={problem} />
                        </div>

                        {/* AI Summary товч */}
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => onGenerateSummary(problem)}
                          disabled={saving || generatingSummaryFor !== null || generatingAll}
                          title="AI summary үүсгэх"
                          className="flex-shrink-0"
                        >
                          {generatingSummaryFor === problem.id
                            ? <Spinner as="span" size="sm" />
                            : <Sparkles size={14} />}
                        </Button>

                        {/* Бодлого засах линк */}
                        {(user?.is_staff) && problem.uuid && (
                          <Link
                            to={`/problem/${problem.uuid}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-warning btn-sm flex-shrink-0"
                            title="Бодлого засах"
                          >
                            <Edit3 size={14} />
                          </Link>
                        )}

                        {/* Солих товч */}
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => onOpenReplaceModal(index)}
                          disabled={saving || editLocked}
                          title="Өөр бодлогоор солих"
                          className="flex-shrink-0"
                        >
                          <ArrowLeftRight size={14} />
                        </Button>

                        {/* Хасах товч */}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onRemoveProblem(problem.id)}
                          disabled={saving || editLocked}
                          className="flex-shrink-0"
                        >
                          <i className="bi bi-trash" />
                        </Button>
                      </ListGroup.Item>
                    )}
                  </Draggable>
                ))
              ) : (
                <ListGroup.Item>
                  <Alert variant="info" className="mb-0">
                    "Бодлого нэмэх" товчийг дарж тестээ бүрдүүлнэ үү.
                  </Alert>
                </ListGroup.Item>
              )}
              {provided.placeholder}
            </ListGroup>
          )}
        </Droppable>
      </Card>
    </DragDropContext>
  );
}
