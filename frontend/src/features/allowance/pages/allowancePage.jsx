import { useEffect, useState } from 'react';
import { BadgePercent, Gem, Sparkles } from 'lucide-react';
import { allowanceApi } from '../api/allowanceApi';

const emptyTypeForm = { name: '', is_taxable: true, calculation_type: 'Fixed', value: '' };
const emptyAssignmentForm = {
	employee_id: '',
	grade_id: '',
	allowance_type_id: '',
	value: '',
};

export default function AllowancePage() {
	const [types, setTypes] = useState([]);
	const [employeeAllowances, setEmployeeAllowances] = useState([]);
	const [typeForm, setTypeForm] = useState(emptyTypeForm);
	const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const response = await allowanceApi.getAllowanceTypes();
			setTypes(response.data || []);
			if (response.data?.[0]) {
				setAssignmentForm((current) => ({ ...current, allowance_type_id: String(response.data[0].id) }));
			}
		} catch (error) {
			setMessage(error.message || 'Unable to load allowance data.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleTypeChange = (event) => {
		const { name, value, type: inputType, checked } = event.target;
		setTypeForm((current) => ({
			...current,
			[name]: inputType === 'checkbox' ? checked : value,
		}));
	};

	const handleAssignmentChange = (event) => {
		const { name, value } = event.target;
		setAssignmentForm((current) => ({ ...current, [name]: value }));
	};

	const handleCreateType = async (event) => {
		event.preventDefault();
		try {
			await allowanceApi.createAllowanceType({
				...typeForm,
				is_taxable: Boolean(typeForm.is_taxable),
				value: Number(typeForm.value),
			});
			setTypeForm(emptyTypeForm);
			await loadData();
			setMessage('Allowance type created successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to create allowance type.');
		}
	};

	const handleAssignAllowance = async (event) => {
		event.preventDefault();
		try {
			const payload = {
				employee_id: assignmentForm.employee_id ? Number(assignmentForm.employee_id) : null,
				grade_id: assignmentForm.grade_id ? Number(assignmentForm.grade_id) : null,
				allowance_type_id: Number(assignmentForm.allowance_type_id),
				value: assignmentForm.value === '' ? null : Number(assignmentForm.value),
			};
			const response = await allowanceApi.assignAllowance(payload);
			if (payload.employee_id) {
				const employeeResponse = await allowanceApi.getEmployeeAllowances(payload.employee_id);
				setEmployeeAllowances(employeeResponse.data || []);
			} else {
				setEmployeeAllowances([]);
			}
			setAssignmentForm((current) => ({ ...emptyAssignmentForm, allowance_type_id: current.allowance_type_id || types[0]?.id || '' }));
			setMessage(response.message || 'Allowance assigned successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to assign allowance.');
		}
	};

	const handleLoadEmployeeAllowances = async () => {
		const employeeId = assignmentForm.employee_id;
		if (!employeeId) {
			setEmployeeAllowances([]);
			return;
		}
		try {
			const response = await allowanceApi.getEmployeeAllowances(employeeId);
			setEmployeeAllowances(response.data || []);
		} catch (error) {
			setMessage(error.message || 'Failed to load employee allowances.');
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="allowance">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><BadgePercent size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#397c72]"><Sparkles size={14} /> Benefits studio</p>
						<h2 className="text-3xl font-bold text-slate-900">Allowance Management</h2>
						<p className="mt-1 text-sm text-slate-600">Configure allowances and assign them to employees or grades.</p>
					</div>
				</div>
				<div className="relative z-10 flex items-center gap-3">
					<Gem className="hidden text-[#397c72] sm:block" size={24} />
					<span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#397c72] shadow-sm">
						{types.length} Types
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
					<h3 className="text-lg font-semibold text-gray-900">Allowance Types</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading allowance types...</p>
						) : types.length === 0 ? (
							<p className="text-sm text-gray-500">No allowance types configured.</p>
						) : (
							types.map((type) => (
								<div key={type.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{type.name}</span>
										<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
											{type.calculation_type}
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-600">Value: {type.value}</p>
									<p className="text-sm text-gray-600">Taxable: {type.is_taxable ? 'Yes' : 'No'}</p>
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreateType} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Add Allowance Type</h4>
						<input
							name="name"
							value={typeForm.name}
							onChange={handleTypeChange}
							placeholder="Allowance name"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								name="calculation_type"
								value={typeForm.calculation_type}
								onChange={handleTypeChange}
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
								value={typeForm.value}
								onChange={handleTypeChange}
								placeholder="Value"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							/>
						</div>
						<label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
							<span>Taxable</span>
							<input
								name="is_taxable"
								type="checkbox"
								checked={typeForm.is_taxable}
								onChange={handleTypeChange}
							/>
						</label>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Allowance Type
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Assign Allowance</h3>
					<form onSubmit={handleAssignAllowance} className="mt-4 space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<input
								name="employee_id"
								type="number"
								value={assignmentForm.employee_id}
								onChange={handleAssignmentChange}
								placeholder="Employee ID"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							/>
							<input
								name="grade_id"
								type="number"
								value={assignmentForm.grade_id}
								onChange={handleAssignmentChange}
								placeholder="Grade ID"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							/>
							<select
								name="allowance_type_id"
								value={assignmentForm.allowance_type_id}
								onChange={handleAssignmentChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 md:col-span-2"
								required
							>
								<option value="">Select allowance type</option>
								{types.map((type) => (
									<option key={type.id} value={type.id}>{type.name}</option>
								))}
							</select>
							<input
								name="value"
								type="number"
								min="0"
								step="0.01"
								value={assignmentForm.value}
								onChange={handleAssignmentChange}
								placeholder="Custom value (optional)"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 md:col-span-2"
							/>
						</div>

						<div className="flex items-center gap-3">
							<button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
								Assign
							</button>
							<button type="button" onClick={handleLoadEmployeeAllowances} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
								Load Employee Allowances
							</button>
						</div>
					</form>

					<div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<h4 className="text-sm font-semibold text-slate-800">Employee Allowances</h4>
						{employeeAllowances.length === 0 ? (
							<p className="mt-2 text-sm text-slate-500">No employee assignments loaded yet.</p>
						) : (
							<ul className="mt-3 space-y-2 text-sm text-slate-700">
								{employeeAllowances.map((item) => (
									<li key={item.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
										<span>{item.allowance_type_name}</span>
										<span className="font-medium">{Number(item.value ?? item.default_value).toLocaleString()}</span>
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