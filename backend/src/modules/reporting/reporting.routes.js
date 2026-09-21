const express = require('express');
const router = express.Router();
const reportingController = require('./reporting.controller');

// Get available reports list
router.get('/reports', (req, res, next) => reportingController.getReportsList(req, res, next));

// Get department payroll cost bar chart data
router.get('/department-costs', (req, res, next) => reportingController.getDepartmentCosts(req, res, next));

// Get recent export history audit trail
router.get('/history', (req, res, next) => reportingController.getExportHistory(req, res, next));

// Export report to PDF / Excel
router.post('/export', (req, res, next) => reportingController.exportReport(req, res, next));

module.exports = router;