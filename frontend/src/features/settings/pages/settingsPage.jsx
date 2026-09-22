import React, { useEffect, useState } from 'react';
import { fetchSettings } from '../api/settingsApi';

export default function SettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchSettings();
        setData(response.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading settings...</div>;
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Setting</h2>
        <p className="text-sm text-gray-500 mt-1">Company profile, org structure & system defaults</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
          <h3 className="font-bold text-gray-900 mb-6">Company profile</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Company name</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Registration no.</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.registration_number}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Address</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.address}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sm text-gray-500">Logo</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.logo_url}</span>
            </div>
          </div>
        </div>

        {/* Payroll Cycle Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
          <h3 className="font-bold text-gray-900 mb-6">Payroll cycle</h3>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Cycle type</span>
              <span className="text-sm font-semibold text-gray-900">Monthly</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Salary generation date</span>
              <span className="text-sm font-semibold text-gray-900">
                {data.companyProfile.payroll_cycle_date === 30 ? 'Last working day' : Day }
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Standard working hours</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.working_hours}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-sm text-gray-500">Working days</span>
              <span className="text-sm font-semibold text-gray-900">{data.companyProfile.working_days}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Departments & Designations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder relative">
        <h3 className="font-bold text-gray-900 mb-6">Departments & designations</h3>
        <button className="absolute top-6 right-6 text-sm font-bold text-orange-600 hover:text-orange-700">
          + Add department
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-4">
          {data.departments.map((dept, index) => (
            <div key={index}>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{dept.name}</h4>
              <p className="text-sm text-gray-500">{dept.designations.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Holiday Calendar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
          <h3 className="font-bold text-gray-900 mb-6">Holiday calendar (2026)</h3>
          <div className="space-y-4">
            {data.holidays.map((holiday, index) => (
              <div key={index} className="flex justify-between pb-3 last:pb-1 border-b last:border-b-0 border-gray-100">
                <span className="text-sm text-gray-500">{holiday.name}</span>
                <span className="text-sm font-semibold text-gray-900">{holiday.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-cardBorder">
          <h3 className="font-bold text-gray-900 mb-6">Notifications</h3>
          <div className="space-y-4">
            {data.notifications.map((notif, index) => (
              <div key={index} className="flex justify-between pb-3 last:pb-1 border-b last:border-b-0 border-gray-100">
                <span className="text-sm text-gray-500">{notif.type}</span>
                <span className="text-sm font-bold text-gray-900">{notif.enabled ? 'On' : 'Off'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
