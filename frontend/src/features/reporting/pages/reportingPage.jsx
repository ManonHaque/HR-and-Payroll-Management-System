import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  fetchDepartmentCosts, 
  fetchExportHistory, 
  exportReportFile,
  DEFAULT_REPORTS 
} from '../api/reportingApi';

export default function ReportingPage() {
  const [reports] = useState(DEFAULT_REPORTS);
  const [departmentCosts, setDepartmentCosts] = useState([
    { department: 'Eng', fullName: 'Engineering', cost: 1450000, height: '65%' },
    { department: 'Fin', fullName: 'Finance', cost: 1750000, height: '78%' },
    { department: 'HR', fullName: 'Human Resources', cost: 1100000, height: '48%' },
    { department: 'Prod', fullName: 'Production', cost: 2050000, height: '88%' },
    { department: 'Sales', fullName: 'Sales', cost: 1350000, height: '58%' },
    { department: 'Admin', fullName: 'Admin', cost: 1650000, height: '74%' }
  ]);

  const [exportHistory, setExportHistory] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadData();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [costs, history] = await Promise.all([
        fetchDepartmentCosts(),
        fetchExportHistory()
      ]);
      if (costs && costs.length > 0) setDepartmentCosts(costs);
      if (history && history.length > 0) setExportHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (reportName, format) => {
    setActiveDropdown(null);
    try {
      const newRecord = await exportReportFile(reportName, format);
      if (newRecord) {
        setExportHistory(prev => [newRecord, ...prev]);
        setToastMessage(`Exported "${reportName}" as ${format}`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10" ref={dropdownRef}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Reporting
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Operational reports, exportable to PDF &amp; Excel
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Grid: 2 Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Available reports */}
        <div className="lg:col-span-6 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Available reports
            </h2>

            <div className="divide-y divide-gray-100">
              {reports.map((report, idx) => {
                const isOpen = activeDropdown === report.id;
                return (
                  <div 
                    key={report.id || idx} 
                    className="py-3 flex items-center justify-between gap-3 text-sm hover:bg-white/40 px-2 rounded-lg transition-colors relative"
                  >
                    <span className="text-gray-800 font-medium truncate">
                      {report.name}
                    </span>

                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveDropdown(isOpen ? null : report.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 py-1 px-2.5 rounded-lg border border-orange-200 bg-orange-50/50 hover:bg-orange-100/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Export</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown menu */}
                      {isOpen && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-30 animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => handleExport(report.name, 'PDF')}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-500" />
                            <span>PDF (.pdf)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExport(report.name, 'Excel')}
                            className="w-full text-left px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Excel (.xlsx)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Payroll cost by department — September */}
        <div className="lg:col-span-6 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">
                Payroll cost by department — September
              </h2>
            </div>

            {/* Bar Chart Container matching Image 2 */}
            <div className="h-56 pt-6 flex items-end justify-between gap-3 sm:gap-6 px-4 border-b border-gray-200 pb-2">
              {departmentCosts.map((dept) => {
                const heightVal = dept.height || `${dept.percentage || 60}%`;
                return (
                  <div 
                    key={dept.department} 
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[11px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-md">
                      ৳{(dept.cost || 0).toLocaleString()}
                    </div>

                    {/* Blue Bar */}
                    <div
                      style={{ height: heightVal }}
                      className="w-full max-w-[42px] bg-[#2563eb] rounded-t-sm transition-all duration-300 group-hover:bg-[#1d4ed8] group-hover:shadow-md cursor-pointer"
                    />

                    {/* Department Label on X Axis */}
                    <span className="text-xs font-medium text-gray-600 mt-2">
                      {dept.department}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>RPT-03: Department-wise monthly &amp; yearly cost breakdown</span>
            <span className="font-semibold text-gray-700">Total: ৳9,350,000</span>
          </div>
        </div>
      </div>

      {/* Middle / Bottom Card: Recent export history */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Recent export history
          </h2>
          <span className="text-xs text-gray-500 italic">
            Who exported what, and when
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">REPORT</th>
                <th className="pb-3 font-semibold">FORMAT</th>
                <th className="pb-3 font-semibold">EXPORTED BY</th>
                <th className="pb-3 font-semibold">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {exportHistory.map((item) => (
                <tr key={item.id} className="hover:bg-white/50 transition-colors">
                  <td className="py-3.5 font-medium text-gray-900">
                    {item.report}
                  </td>
                  <td className="py-3.5 text-gray-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.format === 'PDF' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    }`}>
                      {item.format}
                    </span>
                  </td>
                  <td className="py-3.5 text-gray-700">
                    {item.exportedBy}
                  </td>
                  <td className="py-3.5 text-gray-600">
                    {item.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requirements Covered Section matching Image 2 */}
      <div className="pt-2 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-teal-950 mb-3">
          REQUIREMENTS COVERED ON THIS PAGE
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700">
          <div className="space-y-2">
            <p>
              <strong className="text-orange-700 font-bold">RPT-01</strong> — headcount report by department and joining/leaving trend
            </p>
            <p>
              <strong className="text-orange-700 font-bold">RPT-03</strong> — monthly and yearly payroll cost report by department
            </p>
            <p>
              <strong className="text-orange-700 font-bold">RPT-05</strong> — export any report to PDF and Excel
            </p>
          </div>

          <div className="space-y-2">
            <p>
              <strong className="text-orange-700 font-bold">RPT-02</strong> — attendance and leave reports filterable by employee/department/date
            </p>
            <p>
              <strong className="text-orange-700 font-bold">RPT-04</strong> — loan/advance outstanding report and income tax deduction report
            </p>
            <p>
              <strong className="text-sky-700 font-bold">Added</strong> — turnover and NBR tax summary report types, plus an export-history audit trail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}