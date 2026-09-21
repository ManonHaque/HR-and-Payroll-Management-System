import { apiClient } from '../../../lib/apiClient';

export const fetchSettings = () => {
  return apiClient('/settings');
};
