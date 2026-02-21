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
