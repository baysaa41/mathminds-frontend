// src/services/clubService.js
// Клубын үндсэн CRUD, гишүүнчлэл, урилга, клубт хамаарах хөтөлбөрийн холбоос
// (endpoint namespace: /api/clubs/...). `clubsService.js`-ээс энд шилжсэн.

import apiClient from '../api/axiosConfig';

/**
 * Бүх клубуудын жагсаалт авах (ClubsList.jsx-д зориулагдсан)
 * GET /api/clubs/
 */
export const getClubs = async (params = {}) => {
  const response = await apiClient.get('/api/clubs/', { params });
  return response.data;
};

/**
 * Хэрэглэгчийн клубуудыг авах (MyClubsWidget.jsx-д зориулагдсан)
 * GET /api/clubs/my_clubs/
 * @param {string} username - Хэрэглэгчийн нэр (optional, if not provided returns current user's clubs)
 * @param {object} params - Нэмэлт параметрүүд
 */
export const getMyClubs = async (username = null, params = {}) => {
  // If username is provided, add it to params
  const requestParams = username ? { ...params, username } : params;
  const response = await apiClient.get('/api/clubs/my_clubs/', { params: requestParams });
  return response.data;
};

/**
 * Багшийн бүх клубыг нэгтгэсэн хяналтын самбар
 * GET /api/clubs/teacher_dashboard/
 */
export const getTeacherDashboard = async () => {
  const response = await apiClient.get('/api/clubs/teacher_dashboard/');
  return response.data;
};

/**
 * Багшийн клубуудын сурагчийг нэрээр хайх (зөвхөн багш/админ)
 * GET /api/clubs/teacher_students/?q=
 */
export const searchTeacherStudents = async (q) => {
  const response = await apiClient.get('/api/clubs/teacher_students/', { params: { q } });
  return response.data;
};

/**
 * Сурагчийн сэдэв тус бүрийн чадварын тайлан (зөвхөн багш/админ)
 * GET /api/clubs/teacher_student_report/?username=
 */
export const getTeacherStudentReport = async (username) => {
  const response = await apiClient.get('/api/clubs/teacher_student_report/', { params: { username } });
  return response.data;
};

/**
 * Сурагчдын "Өдрийн 5 бодлого" — клуб/дэд бүлгээр, тухайн өдрөөр (зөвхөн багш/админ)
 * @param {{club?: number, subgroup?: number, date?: string}} params
 */
export const getTeacherDailyProblems = async (params = {}) => {
  const response = await apiClient.get('/api/clubs/teacher_daily_problems/', { params });
  return response.data;
};

/**
 * Нэг сурагчийн сүүлийн N хоногийн өдрийн бодлогууд (зөвхөн багш/админ)
 */
export const getTeacherStudentDaily = async (username, days = 7) => {
  const response = await apiClient.get('/api/clubs/teacher_student_daily/', { params: { username, days } });
  return response.data;
};

/**
 * Клубын дэлгэрэнгүй мэдээлэл авах
 * GET /api/clubs/:id/
 */
export const getClubDetail = async (clubId) => {
  const response = await apiClient.get(`/api/clubs/${clubId}/`);
  return response.data;
};

/**
 * Шинэ клуб үүсгэх
 * POST /api/clubs/
 */
export const createClub = async (clubData) => {
  const response = await apiClient.post('/api/clubs/', clubData);
  return response.data;
};

/**
 * Клуб засварлах
 * PATCH /api/clubs/:id/
 */
export const updateClub = async (clubId, clubData) => {
  const response = await apiClient.patch(`/api/clubs/${clubId}/`, clubData);
  return response.data;
};

/**
 * Клубын бүх долоо хоногийн сэдвийн жагсаалт
 * GET /api/clubs/:id/weekly_topics/
 */
export const getWeeklyTopics = async (clubId) => {
  const response = await apiClient.get(`/api/clubs/${clubId}/weekly_topics/`);
  return response.data;
};

/**
 * AI долоо хоногийн өгүүлэл үүсгэж клубд нийтлэх
 * POST /api/clubs/:id/generate_weekly_article/
 */
export const generateWeeklyArticle = async (clubId, { programId, weekNum } = {}) => {
  const body = {};
  if (programId) body.program_id = programId;
  if (weekNum) body.week_num = weekNum;
  const response = await apiClient.post(`/api/clubs/${clubId}/generate_weekly_article/`, body);
  return response.data;
};

/**
 * Клубт хөтөлбөр нэмэх
 * POST /api/clubs/:id/add_program/
 */
export const addProgram = async (clubId, programId) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/add_program/`, { program_id: programId });
  return response.data;
};

/**
 * Клубаас хөтөлбөр хасах
 * POST /api/clubs/:id/remove_program/
 */
export const removeProgram = async (clubId, programId) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/remove_program/`, { program_id: programId });
  return response.data;
};

/**
 * Клубын хөтөлбөрийн долоо хоногийг өөрчлөх
 * POST /api/clubs/:id/set_week/
 */
export const setWeek = async (clubId, data) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/set_week/`, data);
  return response.data;
};

/**
 * Бүртгэлийн кодоор клубт элсэх
 * POST /api/clubs/join/
 */
export const joinClub = async (regCode) => {
  const response = await apiClient.post('/api/clubs/join/', {
    reg_code: regCode,
  });
  return response.data;
};

/**
 * Клубээс гарах
 * DELETE /api/clubs/:id/leave/
 */
export const leaveClub = async (clubId) => {
  const response = await apiClient.delete(`/api/clubs/${clubId}/leave/`);
  return response.data;
};

/**
 * Клубт багш урилга илгээх
 * POST /api/clubs/:id/invite_teacher/
 */
export const inviteTeacher = async (clubId, username) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/invite_teacher/`, {
    username: username,
  });
  return response.data;
};

/**
 * Миний хүлээн авсан урилгууд
 * GET /api/clubs/my_invitations/
 */
export const getMyInvitations = async () => {
  const response = await apiClient.get('/api/clubs/my_invitations/');
  return response.data;
};

/**
 * Урилга зөвшөөрөх
 * POST /api/clubs/invitations/:id/accept/
 */
export const acceptInvitation = async (invitationId) => {
  const response = await apiClient.post(`/api/clubs/invitations/${invitationId}/accept/`);
  return response.data;
};

/**
 * Урилга татгалзах
 * POST /api/clubs/invitations/:id/reject/
 */
export const rejectInvitation = async (invitationId) => {
  const response = await apiClient.post(`/api/clubs/invitations/${invitationId}/reject/`);
  return response.data;
};

/**
 * Клубаас багш хасах
 * POST /api/clubs/:id/remove_teacher/
 */
export const removeTeacher = async (clubId, username) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/remove_teacher/`, {
    username: username,
  });
  return response.data;
};

export const removeMember = async (clubId, username) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/remove_member/`, { username });
  return response.data;
};

/**
 * Бүртгэлийн код шинэчлэх
 * POST /api/clubs/:id/refresh_reg_code/
 */
export const refreshRegCode = async (clubId) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/refresh_reg_code/`);
  return response.data;
};

export const reactivateClub = async (clubId) => {
  const response = await apiClient.post(`/api/clubs/${clubId}/reactivate/`);
  return response.data;
};

/**
 * Алдааны мессежийг форматлах helper функц
 */
export const formatErrorMessage = (error) => {
  // HTML буцаж ирсэн тохиолдол
  if (error.response?.data && typeof error.response.data === 'string') {
    if (error.response.data.includes('<!DOCTYPE') || error.response.data.includes('<html')) {
      return 'Backend-с буруу хариу ирлээ. Django server ажиллаж байгаа эсэхийг шалгана уу.';
    }
  }

  // Django REST Framework error format
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  // Field validation errors
  if (error.response?.data) {
    const errors = error.response.data;
    const errorMessages = [];

    for (const field in errors) {
      if (Array.isArray(errors[field])) {
        errorMessages.push(`${field}: ${errors[field].join(', ')}`);
      } else if (typeof errors[field] === 'string') {
        errorMessages.push(`${field}: ${errors[field]}`);
      }
    }

    if (errorMessages.length > 0) {
      return errorMessages.join('\n');
    }
  }

  // Network алдаа
  if (error.message === 'Network Error') {
    return 'Сүлжээний алдаа. Backend server ажиллаж байгаа эсэхийг шалгана уу (http://127.0.0.1:8000)';
  }

  if (error.message) {
    return error.message;
  }

  return 'Алдаа гарлаа. Дахин оролдоно уу.';
};
