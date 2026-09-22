import { apiClient } from '../../../lib/apiClient';

export const salaryStructureApi = {
	getTemplates: () => apiClient('/salary-structure/templates'),

	createTemplate: (payload) => apiClient('/salary-structure/templates', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	updateTemplate: (id, payload) => apiClient(`/salary-structure/templates/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload),
	}),

	deleteTemplate: (id) => apiClient(`/salary-structure/templates/${id}`, {
		method: 'DELETE',
	}),

	calculateForEmployee: (employeeId) => apiClient(`/salary-structure/employee/${employeeId}/calculate`),
};
