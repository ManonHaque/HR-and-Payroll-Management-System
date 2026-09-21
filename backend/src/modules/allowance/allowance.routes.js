const express = require('express');
const router = express.Router();
const allowanceController = require('./allowance.controller');

router.get('/types', allowanceController.listAllowanceTypes);
router.post('/types', allowanceController.createAllowanceType);

router.post('/assign', allowanceController.assignAllowance);
router.get('/employee/:employeeId', allowanceController.getEmployeeAllowances);
router.delete('/:id', allowanceController.removeAllowance);

module.exports = router;
