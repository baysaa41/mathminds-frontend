// frontend/src/components/ProgramProgressModal.jsx
import { useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import { GraduationCap } from 'lucide-react';
import useProgramProgress from '../hooks/useProgramProgress';
import ProgramProgressPanel from './ProgramProgressPanel';

/**
 * Хөтөлбөрийн агуулга, сэдэв бүрийн явц (mastery) харуулж, AI-аар үүсгэсэн
 * шалгах тест рүү шилжих модал.
 */
const ProgramProgressModal = ({ show, onHide, programId }) => {
  const navigate = useNavigate();
  const {
    loading,
    error,
    data,
    generatingTopicId,
    generatingReview,
    requestTopicQuiz,
    requestReviewQuiz,
  } = useProgramProgress(programId, { active: show });

  const goToQuiz = (quiz) => {
    if (!quiz) return;
    onHide();
    navigate(`/quiz/${quiz.quiz_uuid}`);
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <GraduationCap size={20} />
          {data?.program?.name || 'Хөтөлбөрийн агуулга'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <ProgramProgressPanel
          loading={loading}
          error={error}
          data={data}
          generatingTopicId={generatingTopicId}
          generatingReview={generatingReview}
          onTopicQuiz={async (topicId) => goToQuiz(await requestTopicQuiz(topicId))}
          onReviewQuiz={async () => goToQuiz(await requestReviewQuiz())}
        />
      </Modal.Body>
    </Modal>
  );
};

export default ProgramProgressModal;
