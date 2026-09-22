import { apiClient } from '../../../lib/apiClient';

export const deductionApi = {
	getDeductionTypes: () => apiClient('/deductions/types'),

	createDeductionType: (payload) => apiClient('/deductions/types', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	assignDeduction: (payload) => apiClient('/deductions/assign', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	getEmployeeDeductions: (employeeId) => apiClient(`/deductions/employee/${employeeId}`),

	getEmployeeDeductionTotal: (employeeId, basicSalary) => {
		const params = new URLSearchParams({ basicSalary: String(basicSalary) });
		return apiClient(`/deductions/employee/${employeeId}/total?${params.toString()}`);
	},

	updateDeduction: (id, value) => apiClient(`/deductions/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ value }),
	}),

	removeDeduction: (id) => apiClient(`/deductions/${id}`, {
		method: 'DELETE',
	}),
};
