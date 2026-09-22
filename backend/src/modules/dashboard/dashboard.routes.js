const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth');

router.get('/admin', authenticate, dashboardController.getAdminDashboard);

module.exports = router;
