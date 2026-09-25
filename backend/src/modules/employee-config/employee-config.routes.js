const express = require('express');
const router = express.Router();
const controller = require('./employee-config.controller');

router.get('/overview', controller.getOverview);

router.get('/grades', controller.getGrades);
router.post('/grades', controller.createGrade);
router.put('/grades/:id', controller.updateGrade);
router.delete('/grades/:id', controller.deleteGrade);

router.get('/grades/:gradeId/salary-template', controller.getSalaryTemplate);
router.put('/grades/:gradeId/salary-template', controller.upsertSalaryTemplate);

router.get('/document-types', controller.getDocumentTypes);
router.post('/document-types', controller.createDocumentType);
router.put('/document-types/:id', controller.updateDocumentType);
router.delete('/document-types/:id', controller.deleteDocumentType);

router.get('/id-generation', controller.getIdGeneration);
router.put('/id-generation', controller.updateIdGeneration);

module.exports = router;
