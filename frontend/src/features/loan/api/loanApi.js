import { apiClient } from '../../../lib/apiClient';

export const loanApi = {
	getLoanTypes: () => apiClient('/loans/types'),

	createLoanType: (payload) => apiClient('/loans/types', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	previewEmi: ({ loan_type_id, amount, tenure_months }) => {
		const params = new URLSearchParams({
			loan_type_id: String(loan_type_id),
			amount: String(amount),
			tenure_months: String(tenure_months),
		});

		return apiClient(`/loans/preview-emi?${params.toString()}`);
	},

	getLoanRequests: (filters = {}) => {
		const params = new URLSearchParams();

		if (filters.employee_id) params.append('employee_id', filters.employee_id);
		if (filters.status) params.append('status', filters.status);

		const query = params.toString();
		return apiClient(query ? `/loans?${query}` : '/loans');
	},

	applyForLoan: (payload) => apiClient('/loans', {
		method: 'POST',
		body: JSON.stringify(payload),
	}),

	updateLoanStatus: (id, status, approved_by = null) => apiClient(`/loans/${id}/status`, {
		method: 'PATCH',
		body: JSON.stringify({ status, approved_by }),
	}),

	getLoanLedger: (id) => apiClient(`/loans/${id}/ledger`),

	recordRepayment: (id, payload) => apiClient(`/loans/${id}/repayments`, {
		method: 'POST',
		body: JSON.stringify(payload),
	}),
};