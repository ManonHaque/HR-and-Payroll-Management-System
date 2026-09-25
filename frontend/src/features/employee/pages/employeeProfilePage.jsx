import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, UserX } from 'lucide-react';
import * as api from '../api/employeeApi';
import SeparationModal from '../components/SeparationModal';

const TABS = ['Attendance', 'Leave', 'Loan', 'Salary history'];

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [showSeparation, setShowSeparation] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.getEmployee(id);
      setEmployee(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="flex items-center justify-center h-full text-gray-500">Loading profile...</div>;
  if (error) return <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>;
  if (!employee) return null;

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-6">
      <Link to="/employee" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <div className="bg-white/60 border border-white/60 rounded-2xl p-6 shadow-sm backdrop-blur-sm mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-sm text-gray-500">
              {employee.emp_id} &middot; {employee.designation_name || 'No designation'} &middot; {employee.department_name || 'No department'}
            </p>
            <span
              className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full ${
                employee.status === 'Active'
                  ? 'bg-green-50 text-green-700'
                  : employee.status === 'Separated'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {employee.status}
            </span>
          </div>
          {employee.status !== 'Separated' && (
            <button
              onClick={() => setShowSeparation(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
            >
              <UserX className="h-4 w-4" /> Initiate separation
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <InfoItem label="Email" value={employee.email} />
          <InfoItem label="Phone" value={employee.phone} />
          <InfoItem label="Joining date" value={employee.joining_date?.slice(0, 10)} />
          <InfoItem label="Grade" value={employee.grade_name} />
          <InfoItem label="Branch" value={employee.branch_name} />
          <InfoItem label="Manager" value={employee.manager_name} />
          <InfoItem label="Bank" value={employee.bank_name} />
          <InfoItem label="Account no." value={employee.bank_account_no} />
        </div>

        {employee.status === 'Separated' && (
          <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
            Separated on {employee.separation_date?.slice(0, 10)}
            {employee.separation_reason && ` — ${employee.separation_reason}`}
            {employee.clearance_completed ? ' · Clearance completed' : ' · Clearance pending'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 border border-white/60 rounded-2xl shadow-sm backdrop-blur-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab ? 'text-orange-600 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6 text-sm text-gray-500">This section will surface once the {activeTab} module is connected.</div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
            <ul className="space-y-2">
              {employee.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between text-sm">
                  <a
                    href={`${api.API_ORIGIN}${doc.file_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-orange-600"
                  >
                    <FileText className="h-4 w-4" /> {doc.document_type_name}
                  </a>
                  {doc.is_mandatory ? <span className="text-[10px] text-green-600">Mandatory</span> : null}
                </li>
              ))}
              {!employee.documents.length && <p className="text-sm text-gray-400">No documents uploaded.</p>}
            </ul>
          </div>

          <div className="bg-white/60 border border-white/60 rounded-2xl p-5 shadow-sm backdrop-blur-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Emergency contacts</h3>
            <ul className="space-y-3">
              {employee.emergencyContacts.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium text-gray-800">
                    {c.name} <span className="text-xs text-gray-400">({c.relationship || 'N/A'})</span>
                  </p>
                  <p className="text-gray-500">{c.phone}</p>
                </li>
              ))}
              {!employee.emergencyContacts.length && <p className="text-sm text-gray-400">No emergency contacts on file.</p>}
            </ul>
          </div>
        </div>
      </div>

      {showSeparation && (
        <SeparationModal
          onClose={() => setShowSeparation(false)}
          onSubmit={async (payload) => {
            await api.separateEmployee(id, payload);
            setShowSeparation(false);
            load();
          }}
        />
      )}
    </div>
  );
}
