// src/components/quizEdit/GenerateSimilarModal.jsx
// QuizEditPage-ийн "AI төстэй тест үүсгэх" modal — task эхлүүлж, статусыг polling хийдэг

import { useState, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Wand2 } from 'lucide-react';
import apiClient from '../../api/axiosConfig.js';

export function GenerateSimilarModal({ show, onHide, quizId, problemCount, onSuccess }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, title: '' });
  const pollRef = useRef(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 0, title: '' });
    try {
      const res = await apiClient.post(`/api/integral/quizzes/${quizId}/generate_similar/`);
      const { task_id, total } = res.data;
      setProgress((p) => ({ ...p, total }));

      // Poll task status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await apiClient.get(
            `/api/integral/quizzes/task-status/${task_id}/`
          );
          const { state, current, total: t, problem_title, new_uuid, error: taskError } = statusRes.data;

          if (state === 'PROGRESS') {
            setProgress({ current: current + 1, total: t, title: problem_title || '' });
          } else if (state === 'SUCCESS') {
            clearInterval(pollRef.current);
            onSuccess(new_uuid);
          } else if (state === 'FAILURE') {
            clearInterval(pollRef.current);
            setError(taskError || 'AI тест үүсгэхэд алдаа гарлаа.');
            setGenerating(false);
          }
        } catch {
          // poll алдаа — үргэлжлүүлнэ
        }
      }, 3000);
    } catch (err) {
      const msg = err.response?.data?.error || 'AI тест үүсгэхэд алдаа гарлаа.';
      setError(msg);
      setGenerating(false);
    }
  };

  // Modal хаахад poll зогсоох (task background-д үргэлжилнэ)
  const handleClose = () => {
    clearInterval(pollRef.current);
    setGenerating(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="h6">
          <Wand2 size={16} className="me-2" />
          AI төстэй тест үүсгэх
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!generating ? (
          <>
            <p className="mb-2">
              AI ашиглан энэ тестийн{' '}
              <strong>{problemCount} бодлого</strong> тус бүртэй{' '}
              <strong>төстэй, гэхдээ өөр</strong> бодлогуудаар шинэ ноорог тест үүсгэнэ.
            </p>
            <ul className="text-muted small mb-3">
              <li>Ижил математикийн ухагдахуун, арга ашиглана</li>
              <li>Тоо, нөхцөл нь өөр байна</li>
              <li>Бодлого тус бүрд бодолт үүсгэнэ</li>
              <li>Шинэ тест ноорог байдлаар нэн даруй нээгдэнэ</li>
            </ul>
          </>
        ) : (
          <div className="py-2">
            <div className="d-flex align-items-center mb-3">
              <Spinner animation="border" size="sm" className="me-2 text-primary" />
              <span className="text-primary fw-semibold">AI бодлого үүсгэж байна...</span>
            </div>
            {progress.total > 0 && (
              <>
                <div className="progress mb-2" style={{ height: 8 }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{
                      width: `${Math.round((progress.current / progress.total) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-muted small text-center">
                  {progress.current}/{progress.total} бодлого
                  {progress.title && (
                    <span className="ms-2 fst-italic">— {progress.title}</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {error && (
          <Alert variant="danger" className="mb-0 small mt-2">{error}</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Цуцлах
        </Button>
        {!generating && (
          <Button variant="primary" onClick={handleGenerate}>
            <Wand2 size={14} className="me-2" />
            Үүсгэх
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
