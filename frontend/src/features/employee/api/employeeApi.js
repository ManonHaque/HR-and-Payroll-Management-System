import { apiClient } from '../../../lib/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Origin without the /api suffix, used to build links to statically served uploads.
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

export const getFormOptions = () => apiClient('/employees/form-options');

export const listEmployees = (params = {}) => {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return apiClient(`/employees${query ? `?${query}` : ''}`);
};

export const getEmployee = (id) => apiClient(`/employees/${id}`);

export const createEmployee = (payload) => apiClient('/employees', { method: 'POST', body: JSON.stringify(payload) });

export const updateEmployee = (id, payload) =>
  apiClient(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });

export const separateEmployee = (id, payload) =>
  apiClient(`/employees/${id}/separation`, { method: 'PUT', body: JSON.stringify(payload) });

export const addEmergencyContact = (employeeId, payload) =>
  apiClient(`/employees/${employeeId}/emergency-contacts`, { method: 'POST', body: JSON.stringify(payload) });

export const deleteEmergencyContact = (contactId) =>
  apiClient(`/employees/emergency-contacts/${contactId}`, { method: 'DELETE' });

// apiClient always forces a JSON Content-Type header, which breaks multipart
// uploads (the browser needs to set its own boundary), so this one call
// talks to fetch() directly instead of going through the shared client.
export const uploadDocument = async (employeeId, documentTypeId, file) => {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('document_type_id', documentTypeId);
  form.append('file', file);

  const response = await fetch(`${BASE_URL}/employees/${employeeId}/documents`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Document upload failed');
  }
  return response.json();
};

export const deleteDocument = (docId) => apiClient(`/employees/documents/${docId}`, { method: 'DELETE' });
