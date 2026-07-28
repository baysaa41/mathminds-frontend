// frontend/src/hooks/useProgramProgress.js
import { useState, useEffect } from 'react';
import {
  getProgramProgress,
  getTopicCheckQuiz,
  getProgramReviewQuiz,
} from '../services/curriculumService';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 180000; // 40 бодлоготой нэгтгэсэн тест удаан үүсэж болно

/**
 * fetchFn нь har удаа {status: 'ready'|'generating', quiz_uuid?, title?} буцаана.
 * 'generating' бол Celery дуусах хүртэл дахин дуудаж хүлээнэ.
 */
const pollUntilReady = async (fetchFn) => {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let result = await fetchFn();
  while (result.status !== 'ready') {
    if (Date.now() > deadline) {
      throw new Error('AI тест үүсгэх хугацаа дууслаа.');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    result = await fetchFn();
  }
  return result;
};

/**
 * Хөтөлбөрийн сэдэв бүрийн явц (mastery) татаж, AI-аар шалгах тест
 * үүсгэх/авах үйлдлүүдийг өгнө. ProgramProgressModal (жижиг цонх) болон
 * ProgramDetailPage (бүтэн хуудас) хоёулаа ашиглана.
 */
export default function useProgramProgress(programId, { active = true } = {}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [generatingTopicId, setGeneratingTopicId] = useState(null);
  const [generatingReview, setGeneratingReview] = useState(false);

  useEffect(() => {
    if (!active || !programId) return;
    setLoading(true);
    setError(null);
    getProgramProgress(programId)
      .then(setData)
      .catch(() => setError('Хөтөлбөрийн явц татахад алдаа гарлаа.'))
      .finally(() => setLoading(false));
  }, [active, programId]);

  const requestTopicQuiz = async (topicId) => {
    setGeneratingTopicId(topicId);
    setError(null);
    try {
      return await pollUntilReady(() => getTopicCheckQuiz(topicId));
    } catch {
      setError('Тест үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
      return null;
    } finally {
      setGeneratingTopicId(null);
    }
  };

  const requestReviewQuiz = async () => {
    setGeneratingReview(true);
    setError(null);
    try {
      return await pollUntilReady(() => getProgramReviewQuiz(programId));
    } catch {
      setError('Тест үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
      return null;
    } finally {
      setGeneratingReview(false);
    }
  };

  return {
    loading,
    error,
    data,
    generatingTopicId,
    generatingReview,
    requestTopicQuiz,
    requestReviewQuiz,
  };
}
