const express = require('express');
const router = express.Router();
const deductionController = require('./deduction.controller');

router.get('/types', deductionController.listDeductionTypes);
router.post('/types', deductionController.createDeductionType);

router.post('/assign', deductionController.assignDeduction);
router.get('/employee/:employeeId', deductionController.getEmployeeDeductions);
router.get('/employee/:employeeId/total', deductionController.getEmployeeDeductionTotal);
router.patch('/:id', deductionController.updateDeduction);
router.delete('/:id', deductionController.removeDeduction);

module.exports = router;
