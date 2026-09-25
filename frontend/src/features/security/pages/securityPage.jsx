import React, { useEffect, useState } from 'react';
import { fetchSecurityDashboard } from '../api/securityApi';
import { Lock, FileText, UserPlus } from 'lucide-react';

export default function SecurityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetchSecurityDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load security dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading security settings...</div>;
  }

  if (!data) return null;

  // Helper to render colored dots for permissions
  const renderDots = (perms) => {
    const allPerms = ['view', 'add', 'edit', 'delete', 'approve'];
    const colors = {
      view: 'bg-blue-500',
      add: 'bg-emerald-500',
      edit: 'bg-orange-500',
      delete: 'bg-red-500',
      approve: 'bg-purple-500'
    };

    return (
      <div className="flex gap-1.5">
        {allPerms.map(p => (
          <div 
            key={p} 
            className={`w-2 h-2 rounded-full ${perms.includes(p) ? colors[p] : 'bg-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security</h2>
        <p className="text-sm text-gray-500 mt-1">Roles, permissions, accounts & audit trail</p>
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder overflow-x-auto">
        <div className="flex justify-between items-center mb-6 min-w-[700px]">
          <h3 className="font-bold text-gray-900">Role permission matrix</h3>
          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> View</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Add</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Edit</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Delete</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"/> Approve</span>
          </div>
        </div>

        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="pb-3 font-medium">Module</th>
              <th className="pb-3 font-medium">Admin</th>
              <th className="pb-3 font-medium">HR</th>
              <th className="pb-3 font-medium">Manager</th>
              <th className="pb-3 font-medium">Employee</th>
              <th className="pb-3 font-medium">Accounts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.permissions.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="py-4 font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500">
                    <Lock className="w-3 h-3" />
                  </div>
                  {row.module}
                </td>
                <td className="py-4">{renderDots(row.admin)}</td>
                <td className="py-4">{renderDots(row.hr)}</td>
                <td className="py-4">
                  {row.manager.length > 0 ? renderDots(row.manager) : <span className="text-gray-300">-</span>}
                </td>
                <td className="py-4">
                  {row.employee.length > 0 ? renderDots(row.employee) : <span className="text-gray-300">-</span>}
                </td>
                <td className="py-4">
                  {row.accounts.length > 0 ? renderDots(row.accounts) : <span className="text-gray-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Accounts */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">User accounts</h3>
            <button className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              <UserPlus className="w-4 h-4" /> New user
            </button>
          </div>
          <div className="space-y-4">
            {data.users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-sm">
                    {user.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{user.name}</p>
                      {user.isNew && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">New</span>}
                    </div>
                    <p className="text-xs text-gray-500">{user.role} — {user.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold ${user.status === 'Active' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Password Policy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
          <h3 className="font-bold text-gray-900 mb-6">Session & password policy</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Min. password length</span>
              <span className="text-sm font-bold text-gray-900">{data.policy.minPasswordLength}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Idle session timeout</span>
              <span className="text-sm font-bold text-gray-900">{data.policy.idleTimeout}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Password reset</span>
              <span className="text-sm font-bold text-gray-900">{data.policy.passwordReset}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sm text-gray-500">MFA</span>
              <span className="text-sm font-bold text-gray-900">{data.policy.mfa}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Protection */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Data protection & compliance</h3>
          <span className="text-xs text-gray-500">Industry-standard controls, added to the PRD baseline</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Encryption at rest</p>
            <p className="text-sm font-bold text-gray-900">{data.protection.encryptionAtRest}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Encryption in transit</p>
            <p className="text-sm font-bold text-gray-900">{data.protection.encryptionInTransit}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Single Sign-On</p>
            <p className="text-sm font-bold text-gray-900">{data.protection.sso}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Data Retention</p>
            <p className="text-sm font-bold text-gray-900">{data.protection.dataRetention}</p>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Audit log
        </h3>
        <div className="space-y-4">
          {data.auditLogs.map(log => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pb-3 last:pb-1 border-b last:border-b-0 border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[140px]">
                <span>{log.date},</span>
                <span>{log.time}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                <span className="font-bold">{log.action.split(' ')[0]} {log.action.split(' ')[1]}</span>
                {" " + log.action.split(' ').slice(2).join(' ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
