const path = require('path');
const express = require('express');
const cors = require('cors');

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
const employeeRoutes = require('./modules/employee/employee.routes');
app.use('/api/employees', employeeRoutes);

const employeeConfigRoutes = require('./modules/employee-config/employee-config.routes');
app.use('/api/employee-config', employeeConfigRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;