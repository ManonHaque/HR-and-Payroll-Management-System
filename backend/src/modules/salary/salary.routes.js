const express = require('express');
const router = express.Router();
const salaryController = require('./salary.controller');

// Current payroll cycle & calculation
router.get('/current', (req, res, next) => salaryController.getCurrentRun(req, res, next));

// Employee calculation breakdown
router.get('/calculation/:employeeId', (req, res, next) => salaryController.getEmployeeCalculation(req, res, next));

// Update status (Draft -> Approved -> Locked)
router.put('/status', (req, res, next) => salaryController.updateStatus(req, res, next));

// Download payslip PDF
router.get('/payslip/:employeeIdentifier/download', (req, res, next) => salaryController.downloadPayslip(req, res, next));

module.exports = router;
