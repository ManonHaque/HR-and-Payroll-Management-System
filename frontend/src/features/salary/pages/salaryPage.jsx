import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { 
  fetchCurrentPayrollRun, 
  fetchEmployeeCalculation, 
  updatePayrollStatus, 
  downloadPayslipFile 
} from '../api/salaryApi';

export default function SalaryPage() {
  const [payrollRun, setPayrollRun] = useState({
    id: 1,
    cycleMonthName: 'September',
    cycleYear: 2026,
    totalEmployees: 184,
    status: 'Draft',
    statusLabel: 'Draft — pending review'
  });

  const [employees, setEmployees] = useState([
    { id: 1, employeeId: 101, name: 'Abdullah Al Sayed', department: 'Engineering' },
    { id: 2, employeeId: 102, name: 'Aviram Singha', department: 'Engineering' },
    { id: 3, employeeId: 103, name: 'Avishel Biswas', department: 'HR' },
    { id: 4, employeeId: 104, name: 'Manon Hoque', department: 'Finance' }
  ]);

  const [selectedEmployee, setSelectedEmployee] = useState({
    id: 1,
    name: 'Abdullah Al Sayed',
    grossSalary: 46750,
    deductions: 3850,
    loanEmi: 4375,
    netSalary: 38525
  });

  const [downloadablePayslip, setDownloadablePayslip] = useState({
    fileName: 'Payslip_Sep2026_AviramSingha.pdf',
    employeeName: 'Aviram Singha',
    subtitle: 'Generated on approval, downloadable by employee'
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadPayrollData();
  }, []);

  const loadPayrollData = async () => {
    try {
      const data = await fetchCurrentPayrollRun();
      if (data) {
        if (data.run) setPayrollRun(data.run);
        if (data.employees) setEmployees(data.employees);
        if (data.selectedEmployee) setSelectedEmployee(data.selectedEmployee);
        if (data.downloadablePayslip) setDownloadablePayslip(data.downloadablePayslip);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (payrollRun.status === 'Locked') {
      setErrorMessage('A locked run cannot be edited (SAL-04 / SAL-05).');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const result = await updatePayrollStatus(newStatus);
      if (result && result.run) {
        setPayrollRun(result.run);
        setSuccessMessage(`Status updated to ${newStatus}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Status transition failed.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmployeeChange = async (e) => {
    const empId = parseInt(e.target.value, 10);
    try {
      const calc = await fetchEmployeeCalculation(empId);
      if (calc) {
        setSelectedEmployee(calc);
        setDownloadablePayslip(prev => ({
          ...prev,
          fileName: `Payslip_Sep2026_${calc.name.replace(/\s+/g, '')}.pdf`,
          employeeName: calc.name
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPayslip = async () => {
    try {
      await downloadPayslipFile(downloadablePayslip.employeeName.replace(/\s+/g, ''));
    } catch (err) {
      console.error(err);
    }
  };

  const isLocked = payrollRun.status === 'Locked';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Salary Generation Module
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Monthly run, calculation &amp; payslip
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top 2 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Payroll Run */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-5">
              Payroll run
            </h2>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Cycle</span>
                <span className="font-bold text-gray-900">
                  {payrollRun.cycleMonthName || 'September'} {payrollRun.cycleYear || '2026'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Employees</span>
                <span className="font-bold text-gray-900">
                  {payrollRun.totalEmployees || 184}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`font-bold ${
                  payrollRun.status === 'Locked' 
                    ? 'text-gray-700' 
                    : payrollRun.status === 'Approved' 
                    ? 'text-emerald-600' 
                    : 'text-[#c2410c]'
                }`}>
                  {payrollRun.statusLabel || (payrollRun.status === 'Draft' ? 'Draft — pending review' : payrollRun.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Stepper / Segmented Control */}
          <div className="mt-8 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 bg-gray-100/70 p-1.5 rounded-2xl border border-gray-200/50">
              <button
                type="button"
                onClick={() => handleStatusChange('Draft')}
                disabled={isLocked || isUpdating}
                className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  payrollRun.status === 'Draft'
                    ? 'bg-[#fae8e0] text-[#c2410c] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Draft
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('Approved')}
                disabled={isLocked || isUpdating}
                className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  payrollRun.status === 'Approved'
                    ? 'bg-[#fae8e0] text-[#c2410c] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Approved
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('Locked')}
                disabled={isLocked || isUpdating}
                className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  payrollRun.status === 'Locked'
                    ? 'bg-[#fae8e0] text-[#c2410c] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Locked
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Net Salary Calculation */}
        <div className="lg:col-span-7 bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Net salary calculation —</span>
                <span className="text-gray-800">{selectedEmployee.name}</span>
              </h2>

              {/* Employee selector */}
              <div className="relative inline-block text-left">
                <select
                  value={selectedEmployee.id || ''}
                  onChange={handleEmployeeChange}
                  className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs pr-7 cursor-pointer"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4 Stat Boxes in Row matching Image 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* GROSS */}
              <div className="p-3 bg-white/60 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  GROSS
                </span>
                <span className="text-lg font-bold text-gray-900 mt-1">
                  ৳{(selectedEmployee.grossSalary || 0).toLocaleString()}
                </span>
              </div>

              {/* DEDUCTIONS */}
              <div className="p-3 bg-white/60 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  DEDUCTIONS
                </span>
                <span className="text-lg font-bold text-gray-800 mt-1">
                  -৳{(selectedEmployee.deductions || 0).toLocaleString()}
                </span>
              </div>

              {/* LOAN EMI */}
              <div className="p-3 bg-white/60 rounded-xl border border-gray-100 flex flex-col justify-center">
                <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  LOAN EMI
                </span>
                <span className="text-lg font-bold text-gray-800 mt-1">
                  -৳{(selectedEmployee.loanEmi || 0).toLocaleString()}
                </span>
              </div>

              {/* NET SALARY (Peach highlight matching Image 1) */}
              <div className="p-3 bg-[#fae8e0] rounded-xl border border-orange-200/50 shadow-xs flex flex-col justify-center">
                <span className="text-[11px] font-bold tracking-wider text-orange-950 uppercase">
                  NET SALARY
                </span>
                <span className="text-lg font-extrabold text-gray-900 mt-1">
                  ৳{(selectedEmployee.netSalary || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500 flex items-center justify-between pt-3 border-t border-gray-100">
            <span>SAL-03: Net = Gross - Deductions - Loan EMI - NBR tax</span>
            <span className="text-emerald-700 font-medium">Auto-calculated</span>
          </div>
        </div>
      </div>

      {/* Middle Card: Payslip Download Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 px-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {downloadablePayslip.fileName || 'Payslip_Sep2026_AviramSingha.pdf'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {downloadablePayslip.subtitle || 'Generated on approval, downloadable by employee'}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleDownloadPayslip}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer group"
          >
            <span className="group-hover:underline">Download</span>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requirements Covered Section matching Image 1 */}
      <div className="pt-2 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-teal-950 mb-3">
          REQUIREMENTS COVERED ON THIS PAGE
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-gray-700">
          <div className="space-y-2">
            <p>
              <strong className="text-orange-700 font-bold">SAL-01/SAL-02</strong> — monthly payroll for all active employees; gross = Basic + Allowances + Bonus + OT
            </p>
            <p>
              <strong className="text-orange-700 font-bold">SAL-04/SAL-05</strong> — Draft → Approve → Lock; a locked run is not editable
            </p>
            <p>
              <strong className="text-orange-700 font-bold">SAL-07</strong> — salary revision history retained; no unaudited overwrite of a locked run
            </p>
          </div>

          <div className="space-y-2">
            <p>
              <strong className="text-orange-700 font-bold">SAL-03</strong> — net = gross - deductions - loan EMI - NBR tax
            </p>
            <p>
              <strong className="text-orange-700 font-bold">SAL-06</strong> — individual PDF payslip per employee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}