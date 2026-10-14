// src/services/curriculumService.js
// Сургалтын хөтөлбөр, сэдэв судлах, зорилт, шалгах тест (student-facing curriculum API).
// `clubsService.js`-ээс энд шилжсэн (endpoint namespace: /api/curriculum/...).

import apiClient from '../api/axiosConfig';

/**
 * Хичээлийн жилүүдийн жагсаалт авах
 * GET /api/curriculum/academic-years/
 */
export const getAcademicYears = async () => {
  try {
    const response = await apiClient.get('/api/curriculum/academic-years/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching academic years:', error);
    throw error;
  }
};

/**
 * Идэвхтэй сургалтын хөтөлбөрүүдийн жагсаалт авах
 * GET /api/curriculum/programs/
 */
export const getPrograms = async () => {
  try {
    const response = await apiClient.get('/api/curriculum/programs/');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching programs:', error);
    throw error;
  }
};

/**
 * Тухайн хөтөлбөрт зориулсан AI багшийг авах (байхгүй бол шинээр үүсгэнэ)
 * POST /api/curriculum/programs/:id/teacher/
 */
export const getProgramTeacher = async (programId) => {
  const response = await apiClient.post(`/api/curriculum/programs/${programId}/teacher/`);
  return response.data;
};

/**
 * "AI багштай ярилцах" дарахад дуудагдана: тухайн хөтөлбөрийн AI багштай Conversation
 * олох/үүсгэх, мөн сурагч эзэмшилт султай (давтах мартсан) сэдэвтэй бол ЭЕШ бэлдэх
 * горимын адил зарчмаар (LLM дуудахгүй, шууд Message) давтах сануулга илгээнэ —
 * өдөрт нэг л удаа.
 * POST /api/curriculum/programs/:id/remind/
 * Буцаана: {conversation_uuid, reminder_sent, message}
 */
export const remindProgramTopics = async (programId) => {
  const response = await apiClient.post(`/api/curriculum/programs/${programId}/remind/`);
  return response.data;
};

/**
 * Хөтөлбөрийн сэдэв бүрийн явц (mastery, одоогийн долоо хоног, шалгах тестүүд)
 * GET /api/curriculum/programs/:id/progress/
 */
export const getProgramProgress = async (programId) => {
  const response = await apiClient.get(`/api/curriculum/programs/${programId}/progress/`);
  return response.data;
};

/**
 * Нэг сэдвийг шалгах тестийг авах (байхгүй бол AI-аар шинээр үүсгэнэ)
 * POST /api/curriculum/weekly-topics/:id/check-quiz/
 */
export const getTopicCheckQuiz = async (weeklyTopicId) => {
  const response = await apiClient.post(`/api/curriculum/weekly-topics/${weeklyTopicId}/check-quiz/`);
  return response.data;
};

/**
 * "Дасгал бодлого" хэсэг — ЭЕШ бэлтгэлийн адил чат горим: дараагийн бодлогыг
 * чатад шууд Message болгон илгээнэ (жагсаалт → сангийн хайлт → AI-аар шинээр
 * үүсгэх дараалалтай). Сурагч хариултаа энгийн sendMessage-ээр
 * (examPrepProblemId дагалдуулан) илгээнэ.
 * POST /api/curriculum/weekly-topics/:id/practice/next/
 * Буцаана: {status: 'generating'} эсвэл {status:'ready', conversation_uuid, problem, message}
 */
export const getNextPracticeProblem = async (weeklyTopicId) => {
  const response = await apiClient.post(`/api/curriculum/weekly-topics/${weeklyTopicId}/practice/next/`);
  return response.data;
};

/**
 * Нэг сэдвийг судлах хуудсанд шаардлагатай өгөгдөл (зорилтууд, эх сурвалж,
 * санал болгох бодлого, эзэмшилт, тестийн төлөв)
 * GET /api/curriculum/weekly-topics/:id/learn/
 */
export const getWeeklyTopicLearn = async (weeklyTopicId) => {
  const response = await apiClient.get(`/api/curriculum/weekly-topics/${weeklyTopicId}/learn/`);
  return response.data;
};

/**
 * Нэг суралцахуйн зорилтыг ТУСДАА чатаар судлахыг эхлүүлэх/үргэлжлүүлэх (AI багштайгаа
 * зөвхөн энэ зорилтод зориулсан харилцан ярианд тайлбар мессежийг хүргэнэ, эсвэл
 * өмнөх нь байвал буцаана).
 * POST /api/curriculum/admin/objectives/:id/lesson/
 * Буцаана: {status: 'generating'} эсвэл {status:'ready', conversation_uuid, newly_delivered, messages}
 */
export const startObjectiveLesson = async (objectiveId) => {
  const response = await apiClient.post(`/api/curriculum/admin/objectives/${objectiveId}/lesson/`);
  return response.data;
};

/**
 * Сурагч тухайн зорилтын тайлбарт үнэлгээ (like/dislike) + сэтгэгдэл өгөх.
 * POST /api/curriculum/admin/objectives/:id/feedback/
 */
export const sendObjectiveFeedback = async (objectiveId, rating, comment = '') => {
  const response = await apiClient.post(`/api/curriculum/admin/objectives/${objectiveId}/feedback/`, {
    rating,
    comment,
  });
  return response.data;
};

/**
 * Зорилтын дэлгэрэнгүй (explanation_title/content, staff_rating гэх мэт) авах —
 * is_staff хэрэглэгч засварлахын өмнө одоогийн утгыг татахад ашиглана.
 * GET /api/curriculum/admin/objectives/:id/
 */
export const getObjective = async (objectiveId) => {
  const response = await apiClient.get(`/api/curriculum/admin/objectives/${objectiveId}/`);
  return response.data;
};

/**
 * (Зөвхөн is_staff) Зорилтын AI тайлбарыг засах болон/эсвэл ажилтны үнэлгээ өгөх.
 * PATCH /api/curriculum/admin/objectives/:id/
 */
export const updateObjective = async (objectiveId, fields) => {
  const response = await apiClient.patch(`/api/curriculum/admin/objectives/${objectiveId}/`, fields);
  return response.data;
};

/**
 * Хөтөлбөрийн бүх сэдвийг хамарсан нэгтгэсэн шалгах тестийг авах
 * (байхгүй бол AI-аар шинээр үүсгэнэ)
 * POST /api/curriculum/programs/:id/review-quiz/
 */
export const getProgramReviewQuiz = async (programId) => {
  const response = await apiClient.post(`/api/curriculum/programs/${programId}/review-quiz/`);
  return response.data;
};

/**
 * Ангид өлгөх A0 постерууд (нийтэд нээлттэй жагсаалт; can_download — идэвхтэй гишүүн эсэх).
 * GET /api/curriculum/classroom-posters/?grade=6
 */
export const getClassroomPosters = async (grade) => {
  const response = await apiClient.get('/api/curriculum/classroom-posters/', {
    params: grade ? { grade } : undefined,
  });
  return response.data;
};

/**
 * A0 постерын PDF-ийг татна (зөвхөн гишүүнд). Гишүүн биш бол { code: 'members_only' } алдаа шидэнэ.
 * GET /api/curriculum/classroom-posters/<id>/download/
 */
export const downloadClassroomPoster = async (posterId) => {
  try {
    const response = await apiClient.get(`/api/curriculum/classroom-posters/${posterId}/download/`, {
      responseType: 'blob',
    });
    const match = /filename="?([^";]+)"?/.exec(response.headers['content-disposition'] || '');
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = match ? match[1] : `mathminds_poster_${posterId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    // blob хариуны доторх JSON алдааг задлана
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        throw Object.assign(new Error('download_failed'), JSON.parse(await data.text()));
      } catch (parsed) {
        if (parsed.code || parsed.error) throw parsed;
      }
    }
    throw err;
  }
};
