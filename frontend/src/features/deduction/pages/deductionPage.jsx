import { useEffect, useState } from 'react';
import { MinusCircle, Sparkles, Gem } from 'lucide-react';
import { deductionApi } from '../api/deductionApi';

const emptyTypeForm = { name: '', is_statutory: false, calculation_type: 'Fixed', value: '' };
const emptyAssignmentForm = { employee_id: '', grade_id: '', deduction_type_id: '', value: '' };

export default function DeductionPage() {
	const [types, setTypes] = useState([]);
	const [employeeDeductions, setEmployeeDeductions] = useState([]);
	const [typeForm, setTypeForm] = useState(emptyTypeForm);
	const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const response = await deductionApi.getDeductionTypes();
			setTypes(response.data || []);
			if (response.data?.[0]) {
				setAssignmentForm((current) => ({ ...current, deduction_type_id: current.deduction_type_id || String(response.data[0].id) }));
			}
		} catch (error) {
			setMessage(error.message || 'Unable to load deduction data.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleTypeChange = (event) => {
		const { name, value, type: inputType, checked } = event.target;
		setTypeForm((current) => ({ ...current, [name]: inputType === 'checkbox' ? checked : value }));
	};

	const handleAssignmentChange = (event) => {
		const { name, value } = event.target;
		setAssignmentForm((current) => ({ ...current, [name]: value }));
	};

	const handleCreateType = async (event) => {
		event.preventDefault();
		try {
			await deductionApi.createDeductionType({
				...typeForm,
				is_statutory: Boolean(typeForm.is_statutory),
				value: Number(typeForm.value),
			});
			setTypeForm(emptyTypeForm);
			await loadData();
			setMessage('Deduction type created successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to create deduction type.');
		}
	};

	const handleAssignDeduction = async (event) => {
		event.preventDefault();
		try {
			const payload = {
				employee_id: assignmentForm.employee_id ? Number(assignmentForm.employee_id) : null,
				grade_id: assignmentForm.grade_id ? Number(assignmentForm.grade_id) : null,
				deduction_type_id: Number(assignmentForm.deduction_type_id),
				value: assignmentForm.value === '' ? null : Number(assignmentForm.value),
			};
			const response = await deductionApi.assignDeduction(payload);
			if (payload.employee_id) {
				const employeeResponse = await deductionApi.getEmployeeDeductions(payload.employee_id);
				setEmployeeDeductions(employeeResponse.data || []);
			} else {
				setEmployeeDeductions([]);
			}
			setAssignmentForm((current) => ({ ...emptyAssignmentForm, deduction_type_id: current.deduction_type_id || types[0]?.id || '' }));
			setMessage(response.message || 'Deduction assigned successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to assign deduction.');
		}
	};

	const handleLoadEmployeeDeductions = async () => {
		const employeeId = assignmentForm.employee_id;
		if (!employeeId) {
			setEmployeeDeductions([]);
			return;
		}
		try {
			const response = await deductionApi.getEmployeeDeductions(employeeId);
			setEmployeeDeductions(response.data || []);
		} catch (error) {
			setMessage(error.message || 'Failed to load employee deductions.');
		}
	};

	const handleRemoveDeduction = async (id) => {
		try {
			await deductionApi.removeDeduction(id);
			setEmployeeDeductions((current) => current.filter((item) => item.id !== id));
			setMessage('Deduction removed.');
		} catch (error) {
			setMessage(error.message || 'Failed to remove deduction.');
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="deduction">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><MinusCircle size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#397c72]"><Sparkles size={14} /> Salary adjustments</p>
						<h2 className="text-3xl font-bold text-slate-900">Deduction Management</h2>
						<p className="mt-1 text-sm text-slate-600">Configure statutory and voluntary deductions, and assign them to employees or grades.</p>
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
					<h3 className="text-lg font-semibold text-gray-900">Deduction Types</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading deduction types...</p>
						) : types.length === 0 ? (
							<p className="text-sm text-gray-500">No deduction types configured.</p>
						) : (
							types.map((type) => (
								<div key={type.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{type.name}</span>
										<span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
											{type.calculation_type}
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-600">Value: {type.value}</p>
									<p className="text-sm text-gray-600">Statutory: {type.is_statutory ? 'Yes' : 'No'}</p>
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreateType} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Add Deduction Type</h4>
						<input
							name="name"
							value={typeForm.name}
							onChange={handleTypeChange}
							placeholder="Deduction name (e.g. Provident Fund)"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								name="calculation_type"
								value={typeForm.calculation_type}
								onChange={handleTypeChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
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
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
								required
							/>
						</div>
						<label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
							<span>Statutory (e.g. tax, PF)</span>
							<input
								name="is_statutory"
								type="checkbox"
								checked={typeForm.is_statutory}
								onChange={handleTypeChange}
							/>
						</label>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Deduction Type
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Assign Deduction</h3>
					<form onSubmit={handleAssignDeduction} className="mt-4 space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<input
								name="employee_id"
								type="number"
								value={assignmentForm.employee_id}
								onChange={handleAssignmentChange}
								placeholder="Employee ID"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
							/>
							<input
								name="grade_id"
								type="number"
								value={assignmentForm.grade_id}
								onChange={handleAssignmentChange}
								placeholder="Grade ID (bulk assign)"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
							/>
							<select
								name="deduction_type_id"
								value={assignmentForm.deduction_type_id}
								onChange={handleAssignmentChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 md:col-span-2"
								required
							>
								<option value="">Select deduction type</option>
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
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200 md:col-span-2"
							/>
						</div>

						<div className="flex items-center gap-3">
							<button type="submit" className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600">
								Assign
							</button>
							<button type="button" onClick={handleLoadEmployeeDeductions} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
								Load Employee Deductions
							</button>
						</div>
					</form>

					<div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
						<h4 className="text-sm font-semibold text-slate-800">Employee Deductions</h4>
						{employeeDeductions.length === 0 ? (
							<p className="mt-2 text-sm text-slate-500">No employee assignments loaded yet.</p>
						) : (
							<ul className="mt-3 space-y-2 text-sm text-slate-700">
								{employeeDeductions.map((item) => (
									<li key={item.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
										<span>{item.deduction_type_name}</span>
										<div className="flex items-center gap-3">
											<span className="font-medium">{Number(item.value ?? item.default_value).toLocaleString()}</span>
											<button onClick={() => handleRemoveDeduction(item.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-700">
												Remove
											</button>
										</div>
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
