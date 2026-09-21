import React, { useState } from 'react';

export default function AttendanceManagement() {
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reason, setReason] = useState('');
  const [newStatus, setNewStatus] = useState('Present');

  // Dummy daily attendance list matching backend schema
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, empName: 'Alice Smith', date: '2026-01-22', checkIn: '09:02 AM', checkOut: '05:00 PM', status: 'Present' },
    { id: 2, empName: 'Bob Johnson', date: '2026-01-22', checkIn: '09:42 AM', checkOut: '05:10 PM', status: 'Late' },
    { id: 3, empName: 'Charlie Brown', date: '2026-01-22', checkIn: '09:00 AM', checkOut: '01:00 PM', status: 'Half-Day' },
  ]);

  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    if (!reason) return alert('Please enter a reason for correction.');
    
    // Update local state (connect to /api/attendance/correct endpoint)
    setAttendanceList(prev => prev.map(item => 
      item.id === selectedRecord.id ? { ...item, status: newStatus } : item
    ));
    setShowModal(false);
    setReason('');
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Attendance Management</h1>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <p className="text-sm text-slate-500">Present Today</p>
          <p className="text-2xl font-bold text-emerald-600">42</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <p className="text-sm text-slate-500">Late Arrivals</p>
          <p className="text-2xl font-bold text-amber-600">5</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
          <p className="text-sm text-slate-500">On Leave</p>
          <p className="text-2xl font-bold text-blue-600">3</p>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Date</th>
              <th className="p-4">Check-In</th>
              <th className="p-4">Check-Out</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {attendanceList.map((rec) => (
              <tr key={rec.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{rec.empName}</td>
                <td className="p-4 text-slate-600">{rec.date}</td>
                <td className="p-4 text-slate-600">{rec.checkIn}</td>
                <td className="p-4 text-slate-600">{rec.checkOut}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    rec.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                    rec.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {rec.status}
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => { setSelectedRecord(rec); setShowModal(true); }}
                    className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded hover:bg-slate-700">
                    Correct
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* HR Correction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg">
            <h2 className="text-lg font-bold mb-4">Manual Attendance Correction</h2>
            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Status</label>
                <select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm">
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="On-Leave">On-Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason (Mandatory Audit Trail)</label>
                <textarea 
                  required
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide explicit justification for direct HR edit..."
                  className="w-full border border-slate-300 rounded p-2 text-sm h-24"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs bg-blue-600 text-white rounded font-medium">Save Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}