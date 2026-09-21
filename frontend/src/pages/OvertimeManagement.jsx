import React from 'react';

export default function OvertimeManagement() {
  const rules = [
    { id: 1, name: 'Weekday OT', multiplier: '1.5x', maxHours: '3 hrs/day' },
    { id: 2, name: 'Holiday OT', multiplier: '2.0x', maxHours: '8 hrs/day' },
  ];

  const otRequests = [
    { id: 1, empName: 'Bob Johnson', date: '2026-01-20', hours: 2.5, rule: 'Weekday OT', source: 'Auto (Attendance)', status: 'Pending' },
    { id: 2, empName: 'Charlie Brown', date: '2026-01-18', hours: 6.0, rule: 'Holiday OT', source: 'Manual Request', status: 'Approved' },
  ];

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Overtime Configuration & Requests</h1>

      {/* Rules Config Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {rules.map((r) => (
          <div key={r.id} className="bg-white p-5 rounded-lg shadow border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">{r.name}</h3>
              <p className="text-xs text-slate-500">Max limit: {r.maxHours}</p>
            </div>
            <span className="text-xl font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded">{r.multiplier}</span>
          </div>
        ))}
      </div>

      {/* OT Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-sm">Overtime Requests Queue</div>
        <table className="w-full text-left border-collapse">
          <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Date</th>
              <th className="p-4">Rule</th>
              <th className="p-4">Hours</th>
              <th className="p-4">Source</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {otRequests.map((ot) => (
              <tr key={ot.id}>
                <td className="p-4 font-medium text-slate-800">{ot.empName}</td>
                <td className="p-4 text-slate-600">{ot.date}</td>
                <td className="p-4 text-slate-600">{ot.rule}</td>
                <td className="p-4 font-bold text-slate-800">{ot.hours} hrs</td>
                <td className="p-4 text-xs text-slate-500">{ot.source}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    ot.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ot.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}