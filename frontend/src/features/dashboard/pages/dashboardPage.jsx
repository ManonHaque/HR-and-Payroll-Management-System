import React, { useEffect, useState } from 'react';
import { Users, UserCheck, CalendarOff, CreditCard, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchAdminDashboard } from '../api/dashboardApi';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetchAdminDashboard();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading dashboard...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Top 4 Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Widget 
          title="TOTAL EMPLOYEES" 
          value={data.totalEmployees} 
          subtitle="6 departments" 
          icon={<Users className="w-5 h-5 text-indigo-700" />} 
        />
        <Widget 
          title="PRESENT TODAY" 
          value={data.presentToday} 
          subtitle="93% attendance" 
          icon={<UserCheck className="w-5 h-5 text-emerald-500" />} 
        />
        <Widget 
          title="ON LEAVE TODAY" 
          value={data.onLeaveToday} 
          subtitle="3 pending approval" 
          icon={<CalendarOff className="w-5 h-5 text-blue-400" />} 
        />
        <Widget 
          title="PAYROLL STATUS" 
          value={data.payrollStatus} 
          subtitle="September cycle" 
          icon={<CreditCard className="w-5 h-5 text-blue-500" />} 
        />
      </div>

      {/* Middle Section: Chart & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[350px]">
        
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Attendance this week</h3>
            <span className="text-sm font-medium text-emerald-600 flex items-center">
              <ChevronUp className="w-4 h-4 mr-1" /> +2.1% vs last week
            </span>
          </div>
          <div className="flex-1 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.attendanceTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <Tooltip />
                <Area type="monotone" dataKey="present" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-6">Pending approvals</h3>
          <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-2">
            {data.pendingList.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-active text-orange-800 font-bold flex items-center justify-center text-sm">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type}</p>
                  </div>
                </div>
                <button className="text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors underline decoration-orange-300 underline-offset-4">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Events */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Upcoming</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.upcomingEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3 border-r last:border-r-0 border-gray-100">
              <div className="text-2xl">{event.icon}</div>
              <div>
                <p className="text-sm font-bold text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Widget({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="p-1.5 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

