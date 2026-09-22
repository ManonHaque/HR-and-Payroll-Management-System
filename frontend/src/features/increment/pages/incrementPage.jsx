import { useEffect, useState } from 'react';
import { TrendingUp, Sparkles, Gem } from 'lucide-react';
import { incrementApi } from '../api/incrementApi';

const emptyPolicyForm = { name: '', type: 'Percentage', value: '', eligibility_criteria: '' };
const emptyIncrementForm = { employee_id: '', policy_id: '', effective_date: '' };

export default function IncrementPage() {
	const [policies, setPolicies] = useState([]);
	const [increments, setIncrements] = useState([]);
	const [policyForm, setPolicyForm] = useState(emptyPolicyForm);
	const [incrementForm, setIncrementForm] = useState(emptyIncrementForm);
	const [preview, setPreview] = useState(null);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const [policyRes, incrementRes] = await Promise.all([
				incrementApi.getPolicies(),
				incrementApi.getIncrements(),
			]);
			setPolicies(policyRes.data || []);
			setIncrements(incrementRes.data || []);
			if (policyRes.data?.[0] && !incrementForm.policy_id) {
				setIncrementForm((current) => ({ ...current, policy_id: String(policyRes.data[0].id) }));
			}
		} catch (error) {
			setMessage(error.message || 'Unable to load increment data.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handlePolicyChange = (event) => {
		const { name, value } = event.target;
		setPolicyForm((current) => ({ ...current, [name]: value }));
	};

	const handleIncrementChange = (event) => {
		const { name, value } = event.target;
		setIncrementForm((current) => ({ ...current, [name]: value }));
		setPreview(null);
	};

	const handleCreatePolicy = async (event) => {
		event.preventDefault();
		try {
			await incrementApi.createPolicy({ ...policyForm, value: Number(policyForm.value) });
			setPolicyForm(emptyPolicyForm);
			await loadData();
			setMessage('Increment policy created successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to create increment policy.');
		}
	};

	const handlePreview = async () => {
		if (!incrementForm.employee_id || !incrementForm.policy_id) {
			setMessage('Employee ID and policy are required to preview.');
			return;
		}
		try {
			const response = await incrementApi.previewIncrement({
				employee_id: incrementForm.employee_id,
				policy_id: incrementForm.policy_id,
			});
			setPreview(response.data);
		} catch (error) {
			setMessage(error.message || 'Failed to preview increment.');
		}
	};

	const handleSubmitIncrement = async (event) => {
		event.preventDefault();
		if (!incrementForm.employee_id || !incrementForm.policy_id || !incrementForm.effective_date) {
			setMessage('Employee ID, policy and effective date are required.');
			return;
		}
		try {
			await incrementApi.createIncrement({
				employee_id: Number(incrementForm.employee_id),
				policy_id: Number(incrementForm.policy_id),
				effective_date: incrementForm.effective_date,
			});
			setIncrementForm((current) => ({ ...emptyIncrementForm, policy_id: current.policy_id }));
			setPreview(null);
			await loadData();
			setMessage('Increment submitted for approval.');
		} catch (error) {
			setMessage(error.message || 'Failed to submit increment.');
		}
	};

	const handleStatusChange = async (id, status) => {
		try {
			await incrementApi.updateIncrementStatus(id, status);
			await loadData();
			setMessage(`Increment ${status.toLowerCase()}.`);
		} catch (error) {
			setMessage(error.message || 'Failed to update increment status.');
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="increment">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><TrendingUp size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#397c72]"><Sparkles size={14} /> Salary adjustments</p>
						<h2 className="text-3xl font-bold text-slate-900">Increment Management</h2>
						<p className="mt-1 text-sm text-slate-600">Define increment policies and route salary revisions through approval.</p>
					</div>
				</div>
				<div className="relative z-10 flex items-center gap-3">
					<Gem className="hidden text-[#397c72] sm:block" size={24} />
					<span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#397c72] shadow-sm">
						{policies.length} Policies
					</span>
				</div>
			</div>

			{message && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
					{message}
				</div>
			)}

			<div className="module-layout grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Increment Policies</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading policies...</p>
						) : policies.length === 0 ? (
							<p className="text-sm text-gray-500">No increment policies configured.</p>
						) : (
							policies.map((policy) => (
								<div key={policy.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{policy.name}</span>
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
											{policy.type}
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-600">
										Value: {policy.value}{policy.type === 'Percentage' ? '%' : ''}
									</p>
									{policy.eligibility_criteria && (
										<p className="text-sm text-gray-500">Eligibility: {policy.eligibility_criteria}</p>
									)}
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreatePolicy} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Add Increment Policy</h4>
						<input
							name="name"
							value={policyForm.name}
							onChange={handlePolicyChange}
							placeholder="Policy name (e.g. Annual Merit Increment)"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								name="type"
								value={policyForm.type}
								onChange={handlePolicyChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							>
								<option value="Fixed">Fixed</option>
								<option value="Percentage">Percentage</option>
							</select>
							<input
								name="value"
								type="number"
								min="0"
								step="0.01"
								value={policyForm.value}
								onChange={handlePolicyChange}
								placeholder="Value"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							/>
						</div>
						<input
							name="eligibility_criteria"
							value={policyForm.eligibility_criteria}
							onChange={handlePolicyChange}
							placeholder="Eligibility criteria (optional)"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
						/>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Policy
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Submit Increment</h3>
					<form onSubmit={handleSubmitIncrement} className="mt-4 space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<input
								name="employee_id"
								type="number"
								value={incrementForm.employee_id}
								onChange={handleIncrementChange}
								placeholder="Employee ID"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							/>
							<select
								name="policy_id"
								value={incrementForm.policy_id}
								onChange={handleIncrementChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							>
								<option value="">Select policy</option>
								{policies.map((policy) => (
									<option key={policy.id} value={policy.id}>{policy.name}</option>
								))}
							</select>
							<input
								name="effective_date"
								type="date"
								value={incrementForm.effective_date}
								onChange={handleIncrementChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 md:col-span-2"
								required
							/>
						</div>

						<div className="flex items-center gap-3">
							<button type="button" onClick={handlePreview} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
								Preview Revised Salary
							</button>
							<button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
								Submit for Approval
							</button>
						</div>
					</form>

					{preview && (
						<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
							<p>Previous Salary: <strong>{Number(preview.previous_salary).toLocaleString()}</strong></p>
							<p>Revised Salary: <strong>{Number(preview.revised_salary).toLocaleString()}</strong></p>
							<p>Increment Amount: <strong>{Number(preview.increment_amount).toLocaleString()}</strong></p>
						</div>
					)}

					<div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<h4 className="text-sm font-semibold text-slate-800">Pending &amp; Recent Increments</h4>
						{increments.length === 0 ? (
							<p className="mt-2 text-sm text-slate-500">No increment records yet.</p>
						) : (
							<ul className="mt-3 space-y-2 text-sm text-slate-700">
								{increments.map((item) => (
									<li key={item.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
										<div>
											<p className="font-medium">{item.first_name} {item.last_name} ({item.emp_id})</p>
											<p className="text-xs text-slate-500">
												{Number(item.previous_salary).toLocaleString()} &rarr; {Number(item.revised_salary).toLocaleString()} &middot; {item.effective_date?.slice(0, 10)}
											</p>
										</div>
										{item.status === 'Pending' ? (
											<div className="flex gap-2">
												<button onClick={() => handleStatusChange(item.id, 'Approved')} className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600">
													Approve
												</button>
												<button onClick={() => handleStatusChange(item.id, 'Rejected')} className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600">
													Reject
												</button>
											</div>
										) : (
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
												{item.status}
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
