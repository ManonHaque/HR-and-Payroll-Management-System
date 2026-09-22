import { useEffect, useState } from 'react';
import { Layers, Sparkles, Gem } from 'lucide-react';
import { salaryStructureApi } from '../api/salaryStructureApi';

const emptyTemplateForm = { grade_id: '', basic_percentage: '', hra_percentage: '' };

export default function SalaryStructurePage() {
	const [templates, setTemplates] = useState([]);
	const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
	const [employeeId, setEmployeeId] = useState('');
	const [breakdown, setBreakdown] = useState(null);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const response = await salaryStructureApi.getTemplates();
			setTemplates(response.data || []);
		} catch (error) {
			setMessage(error.message || 'Unable to load salary structure templates.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleTemplateChange = (event) => {
		const { name, value } = event.target;
		setTemplateForm((current) => ({ ...current, [name]: value }));
	};

	const handleCreateTemplate = async (event) => {
		event.preventDefault();
		try {
			await salaryStructureApi.createTemplate({
				grade_id: Number(templateForm.grade_id),
				basic_percentage: Number(templateForm.basic_percentage),
				hra_percentage: Number(templateForm.hra_percentage),
			});
			setTemplateForm(emptyTemplateForm);
			await loadData();
			setMessage('Salary structure template created successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to create salary structure template.');
		}
	};

	const handleDeleteTemplate = async (id) => {
		try {
			await salaryStructureApi.deleteTemplate(id);
			await loadData();
			setMessage('Salary structure template removed.');
		} catch (error) {
			setMessage(error.message || 'Failed to remove template.');
		}
	};

	const handleCalculate = async () => {
		if (!employeeId) {
			setMessage('Employee ID is required to calculate a breakdown.');
			return;
		}
		try {
			const response = await salaryStructureApi.calculateForEmployee(employeeId);
			setBreakdown(response.data);
		} catch (error) {
			setMessage(error.message || 'Failed to calculate salary structure.');
			setBreakdown(null);
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="salary-structure">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><Layers size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#397c72]"><Sparkles size={14} /> Salary adjustments</p>
						<h2 className="text-3xl font-bold text-slate-900">Salary Structure / Components</h2>
						<p className="mt-1 text-sm text-slate-600">Define grade-based Basic/HRA splits and preview an employee's breakdown.</p>
					</div>
				</div>
				<div className="relative z-10 flex items-center gap-3">
					<Gem className="hidden text-[#397c72] sm:block" size={24} />
					<span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#397c72] shadow-sm">
						{templates.length} Templates
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
					<h3 className="text-lg font-semibold text-gray-900">Grade Templates</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading templates...</p>
						) : templates.length === 0 ? (
							<p className="text-sm text-gray-500">No salary structure templates configured.</p>
						) : (
							templates.map((template) => (
								<div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{template.grade_name}</span>
										<button onClick={() => handleDeleteTemplate(template.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-700">
											Remove
										</button>
									</div>
									<p className="mt-2 text-sm text-gray-600">Basic: {template.basic_percentage}%</p>
									<p className="text-sm text-gray-600">HRA: {template.hra_percentage}%</p>
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreateTemplate} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Add Grade Template</h4>
						<input
							name="grade_id"
							type="number"
							value={templateForm.grade_id}
							onChange={handleTemplateChange}
							placeholder="Grade ID"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<input
								name="basic_percentage"
								type="number"
								min="0"
								max="100"
								step="0.01"
								value={templateForm.basic_percentage}
								onChange={handleTemplateChange}
								placeholder="Basic %"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							/>
							<input
								name="hra_percentage"
								type="number"
								min="0"
								max="100"
								step="0.01"
								value={templateForm.hra_percentage}
								onChange={handleTemplateChange}
								placeholder="HRA %"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
								required
							/>
						</div>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Template
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Employee Breakdown</h3>
					<div className="mt-4 flex items-center gap-3">
						<input
							type="number"
							value={employeeId}
							onChange={(event) => setEmployeeId(event.target.value)}
							placeholder="Employee ID"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
						/>
						<button onClick={handleCalculate} className="whitespace-nowrap rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
							Calculate
						</button>
					</div>

					{breakdown && (
						<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
							<p className="font-semibold text-slate-900">{breakdown.grade_name} &middot; Employee #{breakdown.employee_id}</p>
							<div className="mt-3 space-y-2">
								<div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
									<span>Basic Salary ({breakdown.basic_percentage}%)</span>
									<span className="font-medium">{Number(breakdown.basic_amount).toLocaleString()}</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
									<span>House Rent Allowance ({breakdown.hra_percentage}%)</span>
									<span className="font-medium">{Number(breakdown.hra_amount).toLocaleString()}</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
									<span>Other Components</span>
									<span className="font-medium">{Number(breakdown.other_amount).toLocaleString()}</span>
								</div>
								<div className="flex items-center justify-between rounded-lg bg-emerald-100 px-3 py-2 font-semibold text-emerald-800">
									<span>Reference Amount</span>
									<span>{Number(breakdown.reference_amount).toLocaleString()}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
