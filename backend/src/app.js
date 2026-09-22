const path = require('path');
const express = require('express');
const cors = require('cors');

const employeeRoutes = require('./modules/employee/employee.routes');
const employeeConfigRoutes = require('./modules/employee-config/employee-config.routes');
const loanRoutes = require('./modules/loan/loan.routes');
const bonusRoutes = require('./modules/bonus/bonus.routes');
const allowanceRoutes = require('./modules/allowance/allowance.routes');
const salaryRoutes = require('./modules/salary/salary.routes');
const reportingRoutes = require('./modules/reporting/reporting.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const settingsRoutes = require('./modules/settings/settings.routes');
const securityRoutes = require('./modules/security/security.routes');
const incrementRoutes = require('./modules/increment/increment.routes');
const deductionRoutes = require('./modules/deduction/deduction.routes');
const salaryStructureRoutes = require('./modules/salary-structure/salary-structure.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

// Serve uploaded employee documents
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'HR & Payroll API is running!' });
});

// Module routes
app.use('/api/employees', employeeRoutes);
app.use('/api/employee-config', employeeConfigRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/allowances', allowanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/increments', incrementRoutes);
app.use('/api/deductions', deductionRoutes);
app.use('/api/salary-structure', salaryStructureRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;
