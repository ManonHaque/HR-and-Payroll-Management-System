const express = require('express');
const router = express.Router();
const incrementController = require('./increment.controller');

router.get('/policies', incrementController.listPolicies);
router.post('/policies', incrementController.createPolicy);

router.get('/preview', incrementController.previewIncrement);

router.post('/bulk', incrementController.generateBulkIncrement);

router.post('/', incrementController.createIncrement);
router.get('/', incrementController.listIncrements);
router.get('/:id', incrementController.getIncrement);
router.patch('/:id/status', incrementController.updateIncrementStatus);

router.get('/employee/:employeeId/history', incrementController.getEmployeeHistory);

module.exports = router;
