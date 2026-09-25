import { apiClient } from '../../../lib/apiClient';

export const getOverview = () => apiClient('/employee-config/overview');

export const createGrade = (payload) =>
  apiClient('/employee-config/grades', { method: 'POST', body: JSON.stringify(payload) });

export const updateGrade = (id, payload) =>
  apiClient(`/employee-config/grades/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteGrade = (id) =>
  apiClient(`/employee-config/grades/${id}`, { method: 'DELETE' });

export const getSalaryTemplate = (gradeId) =>
  apiClient(`/employee-config/grades/${gradeId}/salary-template`);

export const saveSalaryTemplate = (gradeId, payload) =>
  apiClient(`/employee-config/grades/${gradeId}/salary-template`, { method: 'PUT', body: JSON.stringify(payload) });

export const createDocumentType = (payload) =>
  apiClient('/employee-config/document-types', { method: 'POST', body: JSON.stringify(payload) });

export const updateDocumentType = (id, payload) =>
  apiClient(`/employee-config/document-types/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const deleteDocumentType = (id) =>
  apiClient(`/employee-config/document-types/${id}`, { method: 'DELETE' });

export const updateIdGeneration = (payload) =>
  apiClient('/employee-config/id-generation', { method: 'PUT', body: JSON.stringify(payload) });
