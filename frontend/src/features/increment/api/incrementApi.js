import { apiClient } from '../../../lib/apiClient';

export const incrementApi = {
	getPolicies: () => apiClient('/increments/policies'),

	createPolicy: (payload) => apiClient('/increments/policies', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	previewIncrement: ({ employee_id, policy_id }) => {
		const params = new URLSearchParams({
			employee_id: String(employee_id),
			policy_id: String(policy_id),
		});
		return apiClient(`/increments/preview?${params.toString()}`);
	},

	createIncrement: (payload) => apiClient('/increments', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	generateBulkIncrement: (payload) => apiClient('/increments/bulk', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	getIncrements: (filters = {}) => {
		const params = new URLSearchParams();
		if (filters.employee_id) params.append('employee_id', filters.employee_id);
		if (filters.status) params.append('status', filters.status);
		const query = params.toString();
		return apiClient(query ? `/increments?${query}` : '/increments');
	},

	updateIncrementStatus: (id, status, approved_by = null) => apiClient(`/increments/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status, approved_by }),
	}),

	getEmployeeHistory: (employeeId) => apiClient(`/increments/employee/${employeeId}/history`),
};
