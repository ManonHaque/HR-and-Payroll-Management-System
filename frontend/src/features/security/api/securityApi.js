import { apiClient } from '../../../lib/apiClient';

export const fetchSecurityDashboard = () => {
  return apiClient('/security');
};
