// frontend/src/services/integralService.js
import apiClient from '../api/axiosConfig';

/**
 * "Миний өдөр" — сурагчийн нэгдсэн dashboard мэдээлэл
 * @param {string} subject - math|physics|chemistry|biology
 */
export const getStudentDashboard = async (subject = 'math') => {
  const response = await apiClient.get('/api/integral/student-dashboard/', {
    params: { subject },
  });
  return response.data;
};

/**
 * Давталтын статистик (due_today/due_week/total)
 */
export const getReviewStats = async () => {
  const response = await apiClient.get('/api/integral/review/stats/');
  return response.data;
};

/**
 * Клубын даалгаврын үр дүнд суурилсан өнөөдрийн 5 бодлогын зөвлөмж
 * @param {string} subject - math|physics|chemistry|biology
 */
export const getDailyRecommendations = async (subject = 'math') => {
  const response = await apiClient.get('/api/integral/daily-recommendations/', {
    params: { subject },
  });
  return response.data;
};

/**
 * Өдрийн бодлогоо дуусгасны дараа "Өөр бодлого бодох" — өнөөдрийн чатыг буцаана.
 * Буцаана: { conversation_uuid }
 * @param {string} subject
 */
export const startMoreProblemsChat = async (subject = 'math') => {
  const response = await apiClient.post('/api/integral/daily-recommendations/more-chat/', { subject });
  return response.data;
};

/**
 * Тухайн бодлогыг AI багштай чат горимоор эхлүүлнэ (dashboard-ийн "Өнөөдрийн
 * 5 бодлого" гэх мэт жагсаалтаас дарахад ашиглана).
 * Буцаана: { conversation_uuid, problem, problems, current_index, message }
 * — `problems` нь энэ бодлого харьяалагдах DailyRecommendation-ий БҮХ бодлого
 * (order-оор), `current_index` нь дотор нь дарсан бодлогын байрлал — MessagesPage
 * "Дараагийн бодлого" товчоор эдгээрийг дараалуулахад ашиглана.
 * @param {number} problemId
 */
export const startProblemChat = async (problemId) => {
  // defer_message: бодлого чатын ЭЕШ блокт харагдаж, хариулсны дараа л чатад нэмэгдэнэ
  const response = await apiClient.post(`/api/integral/problems/${problemId}/start-chat/`, { defer_message: true });
  return response.data;
};
