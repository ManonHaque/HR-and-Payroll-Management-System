const express = require('express');
const router = express.Router();
const salaryStructureController = require('./salary-structure.controller');

router.get('/templates', salaryStructureController.listTemplates);
router.post('/templates', salaryStructureController.createTemplate);
router.get('/templates/:id', salaryStructureController.getTemplate);
router.put('/templates/:id', salaryStructureController.updateTemplate);
router.delete('/templates/:id', salaryStructureController.deleteTemplate);

router.get('/employee/:employeeId/calculate', salaryStructureController.calculateForEmployee);

module.exports = router;
