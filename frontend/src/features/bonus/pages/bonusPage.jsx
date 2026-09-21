import { useEffect, useState } from 'react';
import { Gift, Sparkles, WandSparkles } from 'lucide-react';
import { bonusApi } from '../api/bonusApi';

const emptyTypeForm = { name: '', calculation_type: 'Fixed', value: '' };
const emptyRunForm = { bonus_type_id: '', run_date: new Date().toISOString().slice(0, 10), department_id: '', grade_id: '' };

export default function BonusPage() {
	const [types, setTypes] = useState([]);
	const [runs, setRuns] = useState([]);
	const [typeForm, setTypeForm] = useState(emptyTypeForm);
	const [runForm, setRunForm] = useState(emptyRunForm);
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const [typeResponse, runResponse] = await Promise.all([
				bonusApi.getBonusTypes(),
				bonusApi.getBonusRuns(),
			]);
			setTypes(typeResponse.data || []);
			setRuns(runResponse.data || []);
			if (typeResponse.data?.[0]) {
				setRunForm((current) => ({ ...current, bonus_type_id: String(typeResponse.data[0].id) }));
			}
		} catch (error) {
			setMessage(error.message || 'Unable to load bonus data.');
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

	const handleRunChange = (event) => {
		const { name, value } = event.target;
		setRunForm((current) => ({ ...current, [name]: value }));
	};

	const handleCreateType = async (event) => {
		event.preventDefault();
		try {
			await bonusApi.createBonusType({
				...typeForm,
				value: Number(typeForm.value),
			});
			setTypeForm(emptyTypeForm);
			await loadData();
			setMessage('Bonus type saved successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to create bonus type.');
		}
	};

	const handleGenerateRun = async (event) => {
		event.preventDefault();
		try {
			await bonusApi.generateBonusRun({
				bonus_type_id: Number(runForm.bonus_type_id),
				run_date: runForm.run_date,
				department_id: runForm.department_id ? Number(runForm.department_id) : null,
				grade_id: runForm.grade_id ? Number(runForm.grade_id) : null,
			});
			setRunForm((current) => ({ ...emptyRunForm, bonus_type_id: current.bonus_type_id || types[0]?.id || '' }));
			await loadData();
			setMessage('Bonus run generated successfully.');
		} catch (error) {
			setMessage(error.message || 'Failed to generate bonus run.');
		}
	};

	return (
		<div className="module-shell space-y-6" data-module="bonus">
			<div className="module-hero flex items-center justify-between gap-5">
				<div className="relative z-10 flex items-center gap-5">
					<div className="module-art"><Gift size={38} strokeWidth={1.7} /></div>
					<div>
						<p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a05279]"><WandSparkles size={14} /> Reward studio</p>
						<h2 className="text-3xl font-bold text-slate-900">Bonus Management</h2>
						<p className="mt-1 text-sm text-slate-600">Create bonus rules and generate department or grade-based runs.</p>
					</div>
				</div>
				<span className="relative z-10 rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#9a4f75] shadow-sm">
					{runs.length} Runs
				</span>
			</div>

			{message && (
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
					{message}
				</div>
			)}

			<div className="module-layout grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Bonus Types</h3>
					<div className="mt-4 space-y-3">
						{loading ? (
							<p className="text-sm text-gray-500">Loading bonus types...</p>
						) : types.length === 0 ? (
							<p className="text-sm text-gray-500">No bonus types available.</p>
						) : (
							types.map((type) => (
								<div key={type.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">{type.name}</span>
										<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
											{type.calculation_type}
										</span>
									</div>
									<p className="mt-2 text-sm text-gray-600">Value: {type.value}</p>
								</div>
							))
						)}
					</div>

					<form onSubmit={handleCreateType} className="mt-6 space-y-3 border-t border-slate-200 pt-5">
						<h4 className="text-base font-semibold text-gray-900">Create Bonus Type</h4>
						<input
							name="name"
							value={typeForm.name}
							onChange={handleTypeChange}
							placeholder="Bonus name"
							className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
							required
						/>
						<div className="grid grid-cols-2 gap-3">
							<select
								name="calculation_type"
								value={typeForm.calculation_type}
								onChange={handleTypeChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
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
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
								required
							/>
						</div>
						<button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
							Save Bonus Type
						</button>
					</form>
				</div>

				<div className="module-card p-5">
					<h3 className="text-lg font-semibold text-gray-900">Generate Bonus Run</h3>
					<form onSubmit={handleGenerateRun} className="mt-4 space-y-4">
						<div className="grid gap-3 md:grid-cols-2">
							<select
								name="bonus_type_id"
								value={runForm.bonus_type_id}
								onChange={handleRunChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
								required
							>
								<option value="">Select type</option>
								{types.map((type) => (
									<option key={type.id} value={type.id}>{type.name}</option>
								))}
							</select>
							<input
								name="run_date"
								type="date"
								value={runForm.run_date}
								onChange={handleRunChange}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
								required
							/>
							<input
								name="department_id"
								type="number"
								value={runForm.department_id}
								onChange={handleRunChange}
								placeholder="Department ID (optional)"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
							/>
							<input
								name="grade_id"
								type="number"
								value={runForm.grade_id}
								onChange={handleRunChange}
								placeholder="Grade ID (optional)"
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-200"
							/>
						</div>
						<button type="submit" className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
							Generate Run
						</button>
					</form>
				</div>
			</div>

			<div className="module-card p-5">
				<h3 className="text-lg font-semibold text-gray-900">Recent Bonus Runs</h3>
				<div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
					<table className="min-w-full divide-y divide-slate-200 text-left text-sm">
						<thead className="bg-slate-100 text-slate-700">
							<tr>
								<th className="px-4 py-3 font-semibold">Type</th>
								<th className="px-4 py-3 font-semibold">Run Date</th>
								<th className="px-4 py-3 font-semibold">Total Amount</th>
								<th className="px-4 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-200 bg-white">
							{runs.length === 0 ? (
								<tr>
									<td colSpan="4" className="px-4 py-5 text-center text-gray-500">
										No bonus runs generated yet.
									</td>
								</tr>
							) : (
								runs.map((run) => (
									<tr key={run.id}>
										<td className="px-4 py-3">{run.bonus_type_name}</td>
										<td className="px-4 py-3">{run.run_date}</td>
										<td className="px-4 py-3">{Number(run.total_amount || 0).toLocaleString()}</td>
										<td className="px-4 py-3">
											<span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
												{run.status}
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