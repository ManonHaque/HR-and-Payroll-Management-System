import { apiClient } from '../../../lib/apiClient';

export const bonusApi = {
	getBonusTypes: () => apiClient('/bonuses/types'),

	createBonusType: (payload) => apiClient('/bonuses/types', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	getBonusRuns: () => apiClient('/bonuses/runs'),

	getBonusRun: (id) => apiClient(`/bonuses/runs/${id}`),

	generateBonusRun: (payload) => apiClient('/bonuses/runs', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	updateBonusRunStatus: (id, status) => apiClient(`/bonuses/runs/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status }),
	}),

	adjustEmployeeBonus: (employeeBonusId, amount) => apiClient(`/bonuses/employee-bonus/${employeeBonusId}`, {
		method: 'PATCH',
		body: JSON.stringify({ amount }),
	}),
};