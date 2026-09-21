import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SalaryPage from './features/salary/pages/salaryPage';
import ReportingPage from './features/reporting/pages/reportingPage';
import LoanPage from './features/loan/pages/loanPage';
import BonusPage from './features/bonus/pages/bonusPage';
import AllowancePage from './features/allowance/pages/allowancePage';

const Placeholder = ({ title }) => (
  <div className="h-full flex flex-col">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">Wednesday, September 10, 2026</p>
      </div>
    </div>
    
    <div className="bg-white/40 border border-white/60 rounded-2xl flex-1 flex flex-col items-center justify-center text-center p-8 shadow-sm backdrop-blur-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title} Module</h3>
      <p className="text-gray-600 max-w-md">
        This module is currently under construction. The UI structure now perfectly matches the design mockups from your documentation.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Placeholder title="Dashboard" />} />
          <Route path="employee" element={<Placeholder title="Employee" />} />
          <Route path="employee-config" element={<Placeholder title="Employee Configuration" />} />
          <Route path="attendance" element={<Placeholder title="Attendance" />} />
          <Route path="overtime" element={<Placeholder title="Overtime Configuration" />} />
          <Route path="leave" element={<Placeholder title="Leave Management" />} />
          
          <Route path="salary" element={<SalaryPage />} />
          <Route path="increment" element={<Placeholder title="Increment" />} />
          <Route path="bonus" element={<BonusPage />} />
          <Route path="allowance" element={<AllowancePage />} />
          <Route path="deduction" element={<Placeholder title="Deduction" />} />
          <Route path="loan-advance" element={<LoanPage />} />
          
          <Route path="reporting" element={<ReportingPage />} />
          <Route path="security" element={<Placeholder title="Security" />} />
          <Route path="settings" element={<Placeholder title="Setting" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
