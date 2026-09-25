import { apiClient } from '../../../lib/apiClient';

export const fetchAdminDashboard = () => {
  return apiClient('/dashboard/admin');
};
