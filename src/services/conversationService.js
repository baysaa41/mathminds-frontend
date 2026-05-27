// frontend/src/services/conversationService.js
import apiClient from '../api/axiosConfig';

/**
 * Харилцан ярианы сервис
 */

/**
 * Одоогийн хэрэглэгчийн бүх харилцан яриануудыг авах
 */
export const getConversations = async () => {
  const response = await apiClient.get('/api/minds/conversations/');
  return response.data;
};

/**
 * UUID-аар нэг харилцан яриаг авах
 * @param {string} conversationUuid - Харилцан ярианы UUID
 */
export const getConversation = async (conversationUuid) => {
  const response = await apiClient.get(`/api/minds/conversations/${conversationUuid}/`);
  return response.data;
};

/**
 * Тодорхой хэрэглэгчтэй байгаа харилцан яриануудыг авах
 * @param {string} username - Хэрэглэгчийн нэр
 */
export const getConversationsWithUser = async (username) => {
  const response = await apiClient.get(`/api/minds/conversations/with/${username}/`);
  return response.data;
};

/**
 * Харилцан ярианы мессежүүдийг авах
 * @param {string} conversationUuid - Харилцан ярианы UUID
 */
export const getConversationMessages = async (conversationUuid) => {
  const response = await apiClient.get(`/api/minds/messages/conversation/${conversationUuid}/`);
  return response.data;
};

/**
 * Шинэ харилцан яриа үүсгэх
 * @param {string} otherUsername - Нөгөө хэрэглэгчийн нэр
 * @param {string} title - Харилцан ярианы гарчиг (optional)
 */
export const createConversation = async (otherUsername, title = '') => {
  const response = await apiClient.post('/api/minds/conversations/', {
    other_user_username: otherUsername,
    title: title,
  });
  return response.data;
};

/**
 * Харилцан ярианы мэдээллийг шинэчлэх (гарчиг)
 * @param {string} conversationUuid - Харилцан ярианы UUID
 * @param {string} title - Шинэ гарчиг
 */
export const updateConversation = async (conversationUuid, title) => {
  const response = await apiClient.patch(`/api/minds/conversations/${conversationUuid}/`, {
    title: title,
  });
  return response.data;
};

/**
 * Харилцан яриаг устгах
 * @param {string} conversationUuid - Харилцан ярианы UUID
 */
export const deleteConversation = async (conversationUuid) => {
  const response = await apiClient.delete(`/api/minds/conversations/${conversationUuid}/`);
  return response.data;
};

/**
 * Мессеж илгээх
 * @param {Object} params - Мессежийн параметрүүд
 * @param {string} params.conversationUuid - Харилцан ярианы UUID (optional if otherUsername provided)
 * @param {string} params.otherUsername - Хэрэглэгчийн нэр (шинэ харилцан яриа үүсгэхэд)
 * @param {string} params.content - Мессежийн агуулга
 * @param {File[]} params.attachments - Хавсралт файлууд (optional)
 * @param {string} params.replyToUuid - Хариулах мессежийн UUID (optional)
 */
export const sendMessage = async ({
  conversationUuid,
  otherUsername,
  content,
  attachments = [],
  replyToUuid,
  examPrepProblemId,
  examPrepHint = false,
  examSuggestTopicChange = false,
}) => {
  const formData = new FormData();

  if (conversationUuid) {
    formData.append('conversation_uuid', conversationUuid);
  }
  if (otherUsername) {
    formData.append('other_user_username', otherUsername);
  }
  if (content) {
    formData.append('content', content);
  }
  if (replyToUuid) {
    formData.append('reply_to_uuid', replyToUuid);
  }
  if (examPrepProblemId) {
    formData.append('exam_prep_problem_id', examPrepProblemId);
  }
  if (examPrepHint) {
    formData.append('exam_prep_hint', '1');
  }
  if (examSuggestTopicChange) {
    formData.append('exam_suggest_topic_change', '1');
  }

  // Хавсралтууд нэмэх
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await apiClient.post('/api/minds/messages/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * ЭЕШ бэлдэхэд зориулсан санал болгосон бодлогууд
 * @param {string} subject - Хичээл (math/physics/chemistry/biology)
 * @param {number} limit - Бодлогын тоо
 */
export const getEeshProblems = async (subject = 'math', limit = 20, categoryIds = [], keywordIds = []) => {
  let url = `/api/integral/eesh-problems/?subject=${subject}&limit=${limit}`;
  if (categoryIds.length > 0) {
    url += `&category_ids=${categoryIds.join(',')}`;
  }
  if (keywordIds.length > 0) {
    url += `&keyword_ids=${keywordIds.join(',')}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const getEeshTopics = async (categoryId) => {
  const response = await apiClient.get(`/api/integral/eesh-topics/?category_id=${categoryId}`);
  return response.data;
};

/**
 * ЭЕШ бэлдэх: AI багш чатад бодлого илгээнэ
 */
/**
 * ЭЕШ — Өөр бодлого: алгоритмын дагуу сэдэв сонгож бодлого авах
 */
export const getEeshDifferentProblem = async (currentProblemId, subject = 'math') => {
  const response = await apiClient.post('/api/integral/eesh-different-problem/', {
    current_problem_id: currentProblemId,
    subject,
  });
  return response.data;
};

/**
 * ЭЕШ бэлдэх: бодлогын зөвлөгөө + бодолт авах (Modal-д харуулахад)
 * @param {number} problemId
 */
export const getProblemHintSolution = async (problemId) => {
  const response = await apiClient.get(`/api/integral/problems/${problemId}/hint-solution/`);
  return response.data;
};

/**
 * Буруу хариулт яагаад буруу болохыг тайлбарлах
 * @param {number} problemId
 * @param {string} choiceLabel - e.g. "А"
 */
export const explainWrongChoice = async (problemId, choiceLabel) => {
  const response = await apiClient.post(
    `/api/integral/problems/${problemId}/explain-wrong-choice/`,
    { choice_label: choiceLabel }
  );
  return response.data;
};

export const sendExamProblem = async (conversationUuid, problemId) => {
  const response = await apiClient.post(
    `/api/minds/conversations/${conversationUuid}/send-exam-problem/`,
    { problem_id: problemId }
  );
  return response.data;
};

/**
 * ЭЕШ бэлдэх: сурагчийн assignment-ын категори тус бүрийн амжилтын статистик
 */
export const getEeshStats = async () => {
  const response = await apiClient.get('/api/integral/eesh-stats/');
  return response.data;
};

/**
 * Мессеж засах
 * @param {string} messageUuid - Мессежийн UUID
 * @param {string} content - Шинэ агуулга
 */
export const updateMessage = async (messageUuid, content) => {
  const response = await apiClient.patch(`/api/minds/messages/${messageUuid}/`, {
    content: content,
  });
  return response.data;
};

/**
 * Мессеж устгах
 * @param {string} messageUuid - Мессежийн UUID
 */
export const deleteMessage = async (messageUuid) => {
  await apiClient.delete(`/api/minds/messages/${messageUuid}/`);
};

/**
 * Мессежийг уншсан гэж тэмдэглэх
 * @param {string} messageUuid - Мессежийн UUID
 */
export const markMessageAsRead = async (messageUuid) => {
  const response = await apiClient.post(`/api/minds/messages/${messageUuid}/mark_as_read/`);
  return response.data;
};

/**
 * Чатын polling: шинэ мессеж + AI typing status
 * @param {string} conversationUuid
 * @param {number} sinceId - Энэ ID-аас их мессежийг авна
 */
export const pollConversation = async (conversationUuid, sinceId = 0, signal = null) => {
  const config = signal ? { signal } : {};
  const response = await apiClient.get(
    `/api/minds/conversations/${conversationUuid}/poll/?since_id=${sinceId}`,
    config,
  );
  return response.data; // { ai_typing: bool, messages: [...] }
};

/**
 * Харилцан ярианы архивлах
 * @param {string} conversationUuid - Харилцан ярианы UUID
 */
export const archiveConversation = async (conversationUuid) => {
  const response = await apiClient.post(`/api/minds/conversations/${conversationUuid}/archive/`);
  return response.data;
};

/**
 * Харилцан ярианы архиваас гаргах
 * @param {string} conversationUuid - Харилцан ярианы UUID
 */
export const unarchiveConversation = async (conversationUuid) => {
  const response = await apiClient.post(`/api/minds/conversations/${conversationUuid}/unarchive/`);
  return response.data;
};

/** AI мессежэд like/dislike үнэлгээ өгөх. rating = 'like' | 'dislike' | null */
export const rateMessage = async (messageUuid, rating, examPrepProblemId = null) => {
  const body = { rating };
  if (examPrepProblemId) body.exam_prep_problem_id = examPrepProblemId;
  const response = await apiClient.post(`/api/minds/messages/${messageUuid}/rate/`, body);
  return response.data;
};

/** Сонголтын тайлбарт like/dislike үнэлгээ өгөх. rating = 'like' | 'dislike' | null */
export const rateAnswerChoice = async (choiceId, rating) => {
  const response = await apiClient.post(`/api/integral/choices/${choiceId}/rate/`, { rating });
  return response.data;
};
