import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import * as api from '../api/employeeApi';
import OnboardingWizard from '../components/OnboardingWizard';

const statusStyles = {
  Active: 'bg-green-50 text-green-700',
  'On-Leave': 'bg-amber-50 text-amber-700',
  Separated: 'bg-gray-100 text-gray-500'
};

export default function EmployeePage() {
  const [formOptions, setFormOptions] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.listEmployees({
        search: search || undefined,
        department_id: departmentFilter || undefined,
        status: statusFilter || undefined
      });
      setEmployees(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, departmentFilter, statusFilter]);

  useEffect(() => {
    api
      .getFormOptions()
      .then(({ data }) => setFormOptions(data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadEmployees, 300);
    return () => clearTimeout(timeout);
  }, [loadEmployees]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Module</h2>
          <p className="text-sm text-gray-600 mt-1">Directory, onboarding wizard &amp; profile.</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          disabled={!formOptions}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add employee
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <section className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID or email"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All departments</option>
            {formOptions?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="On-Leave">On-Leave</option>
            <option value="Separated">Separated</option>
          </select>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white/80 backdrop-blur-sm">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Designation</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <Link to={`/employee/${emp.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                      {emp.first_name} {emp.last_name}
                    </Link>
                    <p className="text-xs text-gray-400">{emp.emp_id}</p>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{emp.department_name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-600">{emp.designation_name || '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[emp.status] || 'bg-gray-100 text-gray-500'}`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && !employees.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {total} employee{total === 1 ? '' : 's'}
        </p>
      </section>

      {showWizard && formOptions && (
        <OnboardingWizard
          formOptions={formOptions}
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            setShowWizard(false);
            loadEmployees();
          }}
        />
      )}
    </div>
  );
}
