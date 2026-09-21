const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'HR & Payroll API is running!' });
});

// Import and mount module routes
const salaryRoutes = require('./modules/salary/salary.routes');
const reportingRoutes = require('./modules/reporting/reporting.routes');

app.use('/api/salary', salaryRoutes);
app.use('/api/reporting', reportingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;