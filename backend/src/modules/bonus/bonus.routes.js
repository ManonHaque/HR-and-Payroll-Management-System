const express = require('express');
const router = express.Router();
const bonusController = require('./bonus.controller');

router.get('/types', bonusController.listBonusTypes);
router.post('/types', bonusController.createBonusType);

router.post('/runs', bonusController.generateBonusRun);
router.get('/runs', bonusController.listBonusRuns);
router.get('/runs/:id', bonusController.getBonusRun);
router.patch('/runs/:id/status', bonusController.updateBonusRunStatus);

router.patch('/employee-bonus/:employeeBonusId', bonusController.adjustEmployeeBonus);

module.exports = router;
