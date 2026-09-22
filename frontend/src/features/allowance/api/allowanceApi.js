import { apiClient } from '../../../lib/apiClient';

export const allowanceApi = {
	getAllowanceTypes: () => apiClient('/allowances/types'),

	createAllowanceType: (payload) => apiClient('/allowances/types', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	assignAllowance: (payload) => apiClient('/allowances/assign', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	getEmployeeAllowances: (employeeId) => apiClient(`/allowances/employee/${employeeId}`),

	removeAllowance: (id) => apiClient(`/allowances/${id}`, {
		method: 'DELETE',
	}),
};