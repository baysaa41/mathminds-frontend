// src/services/clubsService.js
// ✅ ШИНЭЧИЛСЭН: getMyClubs, getPrograms функцүүд нэмэгдсэн.

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
 * Бүх клубуудын жагсаалт авах (ClubsList.jsx-д зориулагдсан)
 * GET /api/clubs/
 */
export const getClubs = async (params = {}) => {
  try {
    console.log('📥 Fetching ALL clubs from /api/clubs/', { params });
    const response = await apiClient.get('/api/clubs/', { params });
    console.log('✅ All clubs fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching all clubs:', error);
    throw error;
  }
};

// -----------------------------------------------------------------
// ✅ ШИНЭЭР НЭМСЭН ФУНКЦ
// -----------------------------------------------------------------
/**
 * Хэрэглэгчийн клубуудыг авах (MyClubsWidget.jsx-д зориулагдсан)
 * GET /api/clubs/my_clubs/
 * @param {string} username - Хэрэглэгчийн нэр (optional, if not provided returns current user's clubs)
 * @param {object} params - Нэмэлт параметрүүд
 */
export const getMyClubs = async (username = null, params = {}) => {
  try {
    // If username is provided, add it to params
    const requestParams = username ? { ...params, username } : params;
    console.log('📥 Fetching MY clubs from /api/clubs/my_clubs/', { params: requestParams });
    const response = await apiClient.get('/api/clubs/my_clubs/', { params: requestParams });
    console.log('✅ My clubs fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching my clubs:', error);
    throw error;
  }
};

/**
 * Клубын дэлгэрэнгүй мэдээлэл авах
 * GET /api/clubs/:id/
 */
export const getClubDetail = async (clubId) => {
  try {
    console.log(`📥 Fetching club detail: ${clubId}`);
    const response = await apiClient.get(`/api/clubs/${clubId}/`);
    console.log('✅ Club detail fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching club detail:', error);
    throw error;
  }
};

/**
 * Шинэ клуб үүсгэх
 * POST /api/clubs/
 */
export const createClub = async (clubData) => {
  try {
    console.log('📤 Creating club:', clubData);
    const response = await apiClient.post('/api/clubs/', clubData);
    console.log('✅ Club created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating club:', error);
    throw error;
  }
};

/**
 * Клуб засварлах
 * PATCH /api/clubs/:id/
 */
export const updateClub = async (clubId, clubData) => {
  try {
    console.log(`📤 Updating club ${clubId}:`, clubData);
    const response = await apiClient.patch(`/api/clubs/${clubId}/`, clubData);
    console.log('✅ Club updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating club:', error);
    throw error;
  }
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
  try {
    const body = {};
    if (programId) body.program_id = programId;
    if (weekNum) body.week_num = weekNum;
    const response = await apiClient.post(`/api/clubs/${clubId}/generate_weekly_article/`, body);
    return response.data;
  } catch (error) {
    console.error('❌ Error generating weekly article:', error);
    throw error;
  }
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
  try {
    console.log('📤 Joining club with code:', regCode);
    const response = await apiClient.post('/api/clubs/join/', {
      reg_code: regCode,
    });
    console.log('✅ Joined club:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error joining club:', error);
    throw error;
  }
};

/**
 * Клубээс гарах
 * DELETE /api/clubs/:id/leave/
 */
export const leaveClub = async (clubId) => {
  try {
    console.log(`📤 Leaving club: ${clubId}`);
    const response = await apiClient.delete(`/api/clubs/${clubId}/leave/`);
    console.log('✅ Left club:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error leaving club:', error);
    throw error;
  }
};

/**
 * Клубт багш урилга илгээх
 * POST /api/clubs/:id/invite_teacher/
 */
export const inviteTeacher = async (clubId, username) => {
  try {
    console.log(`📤 Inviting teacher to club ${clubId}:`, username);
    const response = await apiClient.post(`/api/clubs/${clubId}/invite_teacher/`, {
      username: username,
    });
    console.log('✅ Teacher invitation sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error inviting teacher:', error);
    throw error;
  }
};

/**
 * Миний хүлээн авсан урилгууд
 * GET /api/clubs/my_invitations/
 */
export const getMyInvitations = async () => {
  try {
    console.log('📥 Fetching my teacher invitations');
    const response = await apiClient.get('/api/clubs/my_invitations/');
    console.log('✅ Invitations fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    throw error;
  }
};

/**
 * Урилга зөвшөөрөх
 * POST /api/clubs/invitations/:id/accept/
 */
export const acceptInvitation = async (invitationId) => {
  try {
    console.log(`📤 Accepting invitation ${invitationId}`);
    const response = await apiClient.post(`/api/clubs/invitations/${invitationId}/accept/`);
    console.log('✅ Invitation accepted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error accepting invitation:', error);
    throw error;
  }
};

/**
 * Урилга татгалзах
 * POST /api/clubs/invitations/:id/reject/
 */
export const rejectInvitation = async (invitationId) => {
  try {
    console.log(`📤 Rejecting invitation ${invitationId}`);
    const response = await apiClient.post(`/api/clubs/invitations/${invitationId}/reject/`);
    console.log('✅ Invitation rejected:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error rejecting invitation:', error);
    throw error;
  }
};

/**
 * Клубаас багш хасах
 * POST /api/clubs/:id/remove_teacher/
 */
export const removeTeacher = async (clubId, username) => {
  try {
    console.log(`📤 Removing teacher from club ${clubId}:`, username);
    const response = await apiClient.post(`/api/clubs/${clubId}/remove_teacher/`, {
      username: username,
    });
    console.log('✅ Teacher removed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error removing teacher:', error);
    throw error;
  }
};

export const removeMember = async (clubId, username) => {
  try {
    const response = await apiClient.post(`/api/clubs/${clubId}/remove_member/`, { username });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Бүртгэлийн код шинэчлэх
 * POST /api/clubs/:id/refresh_reg_code/
 */
export const refreshRegCode = async (clubId) => {
  try {
    console.log(`📤 Refreshing registration code for club ${clubId}`);
    const response = await apiClient.post(`/api/clubs/${clubId}/refresh_reg_code/`);
    console.log('✅ Registration code refreshed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error refreshing registration code:', error);
    throw error;
  }
};

// -----------------------------------------------------------------
// Video Management Functions
// -----------------------------------------------------------------

/**
 * Шинэ видео нэмэх
 * POST /api/club-videos/
 */
export const createVideoItem = async (clubId, data) => {
  try {
    console.log(`📤 Creating video item for club ${clubId}:`, data);
    const response = await apiClient.post('/api/club-videos/', {
      ...data,
      club: clubId,
    });
    console.log('✅ Video item created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating video item:', error);
    throw error;
  }
};

/**
 * Видео засах
 * PATCH /api/club-videos/:id/
 */
export const updateVideoItem = async (id, data) => {
  try {
    console.log(`📤 Updating video item ${id}:`, data);
    const response = await apiClient.patch(`/api/club-videos/${id}/`, data);
    console.log('✅ Video item updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error updating video item:', error);
    throw error;
  }
};

/**
 * Видео устгах
 * DELETE /api/club-videos/:id/
 */
export const deleteVideoItem = async (id) => {
  try {
    console.log(`📤 Deleting video item ${id}`);
    const response = await apiClient.delete(`/api/club-videos/${id}/`);
    console.log('✅ Video item deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting video item:', error);
    throw error;
  }
};

/**
 * Видеог дээш шилжүүлэх
 * POST /api/club-videos/:id/move_up/
 */
export const moveVideoUp = async (id) => {
  try {
    console.log(`📤 Moving video item ${id} up`);
    const response = await apiClient.post(`/api/club-videos/${id}/move_up/`);
    console.log('✅ Video item moved up:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error moving video item up:', error);
    throw error;
  }
};

/**
 * Видеог доош шилжүүлэх
 * POST /api/club-videos/:id/move_down/
 */
export const moveVideoDown = async (id) => {
  try {
    console.log(`📤 Moving video item ${id} down`);
    const response = await apiClient.post(`/api/club-videos/${id}/move_down/`);
    console.log('✅ Video item moved down:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error moving video item down:', error);
    throw error;
  }
};

// -----------------------------------------------------------------
// Exam Management Functions
// -----------------------------------------------------------------

export const createExamItem = async (clubId, data) => {
  return apiClient.post('/api/club-exams/', { ...data, club: clubId }).then(r => r.data);
};

export const updateExamItem = async (id, data) => {
  return apiClient.patch(`/api/club-exams/${id}/`, data).then(r => r.data);
};

export const deleteExamItem = async (id) => {
  return apiClient.delete(`/api/club-exams/${id}/`).then(r => r.data);
};

// -----------------------------------------------------------------
// Assignment Management Functions
// -----------------------------------------------------------------

export const getAssignments = async (clubId) => {
  const response = await apiClient.get('/api/club-assignments/', { params: { club: clubId } });
  return response.data;
};

export const createAssignment = async (clubId, data) => {
  return apiClient.post('/api/club-assignments/', { ...data, club: clubId }).then(r => r.data);
};

export const updateAssignment = async (id, data) => {
  return apiClient.patch(`/api/club-assignments/${id}/`, data).then(r => r.data);
};

export const deleteAssignment = async (id) => {
  return apiClient.delete(`/api/club-assignments/${id}/`).then(r => r.data);
};

export const startAssignment = async (assignmentId) => {
  return apiClient.post(`/api/club-assignments/${assignmentId}/start/`).then(r => r.data);
};

export const getMySubmission = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/my_submission/`).then(r => r.data);
};

export const getSubmissions = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/submissions/`).then(r => r.data);
};

export const getAssignmentProgress = async (assignmentId) => {
  return apiClient.get(`/api/club-assignments/${assignmentId}/progress/`).then(r => r.data);
};

export const gradeSubmission = async (assignmentId, data) => {
  return apiClient.post(`/api/club-assignments/${assignmentId}/grade_submission/`, data).then(r => r.data);
};

// -----------------------------------------------------------------
// Quiz Management Functions
// -----------------------------------------------------------------

export const createQuizItem = async (clubId, data) => {
  return apiClient.post('/api/club-quizzes/', { ...data, club: clubId }).then(r => r.data);
};

export const updateQuizItem = async (id, data) => {
  return apiClient.patch(`/api/club-quizzes/${id}/`, data).then(r => r.data);
};

export const deleteQuizItem = async (id) => {
  return apiClient.delete(`/api/club-quizzes/${id}/`).then(r => r.data);
};

export const moveQuizUp = async (id) => {
  return apiClient.post(`/api/club-quizzes/${id}/move_up/`).then(r => r.data);
};

export const moveQuizDown = async (id) => {
  return apiClient.post(`/api/club-quizzes/${id}/move_down/`).then(r => r.data);
};

// ─── Club Files ───────────────────────────────────────────────────────────────

export const createFileItem = async (formData) => {
  return apiClient.post('/api/club-files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const updateFileItem = async (id, formData) => {
  return apiClient.patch(`/api/club-files/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const deleteFileItem = async (id) => {
  return apiClient.delete(`/api/club-files/${id}/`).then(r => r.data);
};

/**
 * Алдааны мессежийг форматлах helper функц
 */
export const formatErrorMessage = (error) => {
  console.error('Error details:', error);

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

// Default export
const clubsService = {
  getClubs,
  getMyClubs,
  getClubDetail,
  createClub,
  updateClub,
  joinClub,
  leaveClub,
  inviteTeacher,
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
  removeTeacher,
  refreshRegCode,
  createVideoItem,
  updateVideoItem,
  deleteVideoItem,
  moveVideoUp,
  moveVideoDown,
  createExamItem,
  updateExamItem,
  deleteExamItem,
  createQuizItem,
  updateQuizItem,
  deleteQuizItem,
  moveQuizUp,
  moveQuizDown,
  addProgram,
  removeProgram,
  setWeek,
  createFileItem,
  updateFileItem,
  deleteFileItem,
  formatErrorMessage,
};

export default clubsService;
