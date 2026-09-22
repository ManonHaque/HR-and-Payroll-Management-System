const express = require('express');
const router = express.Router();
const securityController = require('./security.controller');
const { authenticate } = require('../../middlewares/auth');

router.get('/', authenticate, securityController.getSecurityDashboard);

module.exports = router;
