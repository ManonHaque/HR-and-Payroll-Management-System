import { useEffect, useState } from 'react';
import { CircleDollarSign, Landmark, Sparkles } from 'lucide-react';
import { loanApi } from '../api/loanApi';

const emptyTypeForm = { name: '', interest_rate: '', max_amount: '', max_tenure: '' };
const emptyLoanForm = {
	employee_id: '1',
	loan_type_id: '',
	requested_amount: '',
	tenure_months: '',
};

export default function LoanPage() {
	const [types, setTypes] = useState([]);
	const [requests, setRequests] = useState([]);
	const [typeForm, setTypeForm] = useState(emptyTypeForm);
	const [loanForm, setLoanForm] = useState(emptyLoanForm);
	const [preview, setPreview] = useState(null);
	const [statusMessage, setStatusMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const [typeResponse, requestResponse] = await Promise.all([
				loanApi.getLoanTypes(),
				loanApi.getLoanRequests(),
			]);
			setTypes(typeResponse.data || []);
			setRequests(requestResponse.data || []);
			if (typeResponse.data?.[0]) {
				setLoanForm((current) => ({ ...current, loan_type_id: String(typeResponse.data[0].id) }));
			}
		} catch (error) {
			setStatusMessage(error.message || 'Unable to load loan data.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleTypeChange = (event) => {
		const { name, value } = event.target;
		setTypeForm((current) => ({ ...current, [name]: value }));
	};

	const handleLoanChange = (event) => {
		const { name, value } = event.target;
		setLoanForm((current) => ({ ...current, [name]: value }));
	};

	const handleCreateType = async (event) => {
		event.preventDefault();
		try {
			await loanApi.createLoanType({
				...typeForm,
				interest_rate: Number(typeForm.interest_rate || 0),
				max_amount: Number(typeForm.max_amount),
				max_tenure: Number(typeForm.max_tenure),
			});
			setTypeForm(emptyTypeForm);
			await loadData();
			setStatusMessage('Loan type created successfully.');
		} catch (error) {
			setStatusMessage(error.message || 'Failed to create loan type.');
		}
	};

	const handlePreview = async () => {
		try {
			const response = await loanApi.previewEmi({
				loan_type_id: loanForm.loan_type_id,
				amount: Number(loanForm.requested_amount),
				tenure_months: Number(loanForm.tenure_months),
			});
			setPreview(response.data);
			setStatusMessage('EMI preview updated.');
		} catch (error) {
			setPreview(null);
			setStatusMessage(error.message || 'Unable to preview EMI.');
		}
	};

	const handleApplyLoan = async (event) => {
		event.preventDefault();
		try {
			await loanApi.applyForLoan({
				employee_id: Number(loanForm.employee_id),
				loan_type_id: Number(loanForm.loan_type_id),
				requested_amount: Number(loanForm.requested_amount),
				tenure_months: Number(loanForm.tenure_months),
			});
			setLoanForm({ ...emptyLoanForm, loan_type_id: loanForm.loan_type_id || types[0]?.id || '' });
			setPreview(null);
			await loadData();
			setStatusMessage('Loan request created successfully.');
		} catch (error) {
			setStatusMessage(error.message || 'Loan request failed.');
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="loan">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><Landmark size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#7656ad]"><Sparkles size={14} /> Pay studio</p>
						<h2 className="text-3xl font-bold text-slate-900">Loan & Advance</h2>
						<p className="mt-1 text-sm text-slate-600">Manage loan types, underwriting, and repayment requests.</p>
					</div>
				</div>
				<span className="relative z-10 rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#6541a5] shadow-sm">
					{requests.length} Requests
				</span>
			</div>

			{statusMessage && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
					{statusMessage}
				</div>
			)}

			<div className="module-layout grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Loan Types</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading loan types...</p>
						) : types.length === 0 ? (
							<p className="text-sm text-gray-500">No loan types created yet.</p>
						) : (
							types.map((type) => (
								<div key={type.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{type.name}</span>
										<span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
											{type.interest_rate || 0}%
										</span>
									</div>
									<div className="mt-2 text-sm text-gray-600 space-y-1">
										<p>Max amount: {Number(type.max_amount || 0).toLocaleString()}</p>
										<p>Max tenure: {Number(type.max_tenure || 0)} months</p>
									</div>
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreateType} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Add Loan Type</h4>
						<input
							name="name"
							value={typeForm.name}
							onChange={handleTypeChange}
							placeholder="Loan name"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<input
								name="interest_rate"
								type="number"
								min="0"
								step="0.01"
								value={typeForm.interest_rate}
								onChange={handleTypeChange}
								placeholder="Interest %"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
							/>
							<input
								name="max_amount"
								type="number"
								min="0"
								value={typeForm.max_amount}
								onChange={handleTypeChange}
								placeholder="Max amount"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
								required
							/>
						</div>
						<input
							name="max_tenure"
							type="number"
							min="1"
							value={typeForm.max_tenure}
							onChange={handleTypeChange}
							placeholder="Max tenure (months)"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
							required
						/>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Loan Type
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Apply for Loan</h3>
					<form onSubmit={handleApplyLoan} className="mt-4 space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<input
								name="employee_id"
								type="number"
								value={loanForm.employee_id}
								onChange={handleLoanChange}
								placeholder="Employee ID"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
								required
							/>
							<select
								name="loan_type_id"
								value={loanForm.loan_type_id}
								onChange={handleLoanChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
								required
							>
								<option value="">Select loan type</option>
								{types.map((type) => (
									<option key={type.id} value={type.id}>{type.name}</option>
								))}
							</select>
							<input
								name="requested_amount"
								type="number"
								min="0"
								value={loanForm.requested_amount}
								onChange={handleLoanChange}
								placeholder="Requested amount"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
								required
							/>
							<input
								name="tenure_months"
								type="number"
								min="1"
								value={loanForm.tenure_months}
								onChange={handleLoanChange}
								placeholder="Tenure (months)"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
								required
							/>
						</div>

						<div className="flex items-center gap-3">
							<button type="button" onClick={handlePreview} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
								Preview EMI
							</button>
							<button type="submit" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
								Submit Request
							</button>
						</div>

						{preview && (
							<div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
								<p className="font-semibold">EMI Preview</p>
								<div className="mt-2 grid grid-cols-2 gap-2">
									<span>Loan type</span>
									<strong>{preview.loan_type}</strong>
									<span>Interest rate</span>
									<strong>{preview.interest_rate}%</strong>
									<span>Requested amount</span>
									<strong>{Number(preview.requested_amount).toLocaleString()}</strong>
									<span>Monthly EMI</span>
									<strong>{Number(preview.emi_amount).toLocaleString()}</strong>
								</div>
							</div>
						)}
					</form>
				</div>
			</div>

			<div className="module-card p-5">
				<h3 className="text-lg font-semibold text-gray-900">Recent Loan Requests</h3>
				<div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-100 text-slate-700">
							<tr>
								<th className="px-4 py-3 font-semibold">Employee</th>
								<th className="px-4 py-3 font-semibold">Type</th>
								<th className="px-4 py-3 font-semibold">Amount</th>
								<th className="px-4 py-3 font-semibold">Tenure</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 bg-white">
							{requests.length === 0 ? (
								<tr>
									<td colSpan="5" className="px-4 py-5 text-center text-gray-500">
										No loan requests yet.
									</td>
								</tr>
							) : (
								requests.map((request) => (
									<tr key={request.id}>
										<td className="px-4 py-3">{request.first_name} {request.last_name}</td>
										<td className="px-4 py-3">{request.loan_type_name}</td>
										<td className="px-4 py-3">{Number(request.requested_amount).toLocaleString()}</td>
										<td className="px-4 py-3">{request.tenure_months} months</td>
										<td className="px-4 py-3">
											<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
												{request.status}
											</span>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}