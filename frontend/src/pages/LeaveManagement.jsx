import React, { useState } from 'react';

export default function LeaveManagement() {
  const balances = [
    { type: 'Casual Leave', allocated: 10, used: 2, remaining: 8 },
    { type: 'Sick Leave', allocated: 14, used: 1, remaining: 13 },
    { type: 'Annual Leave', allocated: 15, used: 5, remaining: 10 },
  ];

  const [requests, setRequests] = useState([
    { id: 101, empName: 'Alice Smith', leaveType: 'Casual Leave', dates: '2026-02-01 to 2026-02-03', days: 3, status: 'Pending Manager Review' },
    { id: 102, empName: 'David Lee', leaveType: 'Sick Leave', dates: '2026-01-18 to 2026-01-19', days: 2, status: 'Pending HR Review' },
  ]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leave Management</h1>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {balances.map((b, i) => (
          <div key={i} className="bg-white p-5 rounded-lg shadow border border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm mb-2">{b.type}</h3>
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-extrabold text-slate-900">{b.remaining} <span className="text-xs font-normal text-slate-500">days left</span></span>
              <span className="text-xs text-slate-400">Used: {b.used} / {b.allocated}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Multi-stage Workflow Approval Visualizer */}
      <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-4">Pending Approval Queue</h2>
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="p-4 border border-slate-100 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50">
              <div>
                <p className="font-semibold text-slate-800">{req.empName}</p>
                <p className="text-xs text-slate-500">{req.leaveType} • {req.dates} ({req.days} days)</p>
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  req.status === 'Pending Manager Review' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {req.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}