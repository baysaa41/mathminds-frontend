import axiosInstance from '../api/axiosConfig';

const BASE = '/api/curriculum/admin';

// ─── Programs ────────────────────────────────────────────────────────────────
export const getPrograms = (params) =>
  axiosInstance.get(`${BASE}/programs/`, { params });

export const createProgram = (data) =>
  axiosInstance.post(`${BASE}/programs/`, data);

export const updateProgram = (id, data) =>
  axiosInstance.patch(`${BASE}/programs/${id}/`, data);

export const deleteProgram = (id) =>
  axiosInstance.delete(`${BASE}/programs/${id}/`);

// ─── Weekly Topics ────────────────────────────────────────────────────────────
export const getWeeklyTopics = (params) =>
  axiosInstance.get(`${BASE}/weekly-topics/`, { params });

export const createWeeklyTopic = (data) =>
  axiosInstance.post(`${BASE}/weekly-topics/`, data);

export const updateWeeklyTopic = (id, data) =>
  axiosInstance.patch(`${BASE}/weekly-topics/${id}/`, data);

export const deleteWeeklyTopic = (id) =>
  axiosInstance.delete(`${BASE}/weekly-topics/${id}/`);

// ─── Learning Objectives ─────────────────────────────────────────────────────
export const createObjective = (data) =>
  axiosInstance.post(`${BASE}/objectives/`, data);

export const updateObjective = (id, data) =>
  axiosInstance.patch(`${BASE}/objectives/${id}/`, data);

export const deleteObjective = (id) =>
  axiosInstance.delete(`${BASE}/objectives/${id}/`);

// ─── Resources ────────────────────────────────────────────────────────────────
export const createResource = (data) =>
  axiosInstance.post(`${BASE}/resources/`, data);

export const updateResource = (id, data) =>
  axiosInstance.patch(`${BASE}/resources/${id}/`, data);

export const deleteResource = (id) =>
  axiosInstance.delete(`${BASE}/resources/${id}/`);
