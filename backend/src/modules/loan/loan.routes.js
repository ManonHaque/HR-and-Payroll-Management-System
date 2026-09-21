const express = require('express');
const router = express.Router();
const loanController = require('./loan.controller');

router.get('/types', loanController.listLoanTypes);
router.post('/types', loanController.createLoanType);

router.get('/preview-emi', loanController.previewEmi);

router.post('/', loanController.applyForLoan);
router.get('/', loanController.listLoanRequests);
router.get('/:id', loanController.getLoanRequest);
router.patch('/:id/status', loanController.updateLoanStatus);

router.get('/:id/ledger', loanController.getLoanLedger);
router.post('/:id/repayments', loanController.recordRepayment);

module.exports = router;
