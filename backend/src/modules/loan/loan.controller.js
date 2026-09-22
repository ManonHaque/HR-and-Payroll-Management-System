const loanService = require('./loan.service');

async function listLoanTypes(req, res, next) {
  try {
    res.json({ status: 'success', data: await loanService.getAllLoanTypes() });
  } catch (err) { next(err); }
}

async function createLoanType(req, res, next) {
  try {
    const { name, interest_rate, max_amount, max_tenure } = req.body;
    if (!name || !max_amount || !max_tenure) {
      return res.status(400).json({ status: 'error', message: 'name, max_amount and max_tenure are required' });
    }
    const type = await loanService.createLoanType({ name, interest_rate, max_amount, max_tenure });
    res.status(201).json({ status: 'success', data: type });
  } catch (err) { next(err); }
}

async function previewEmi(req, res, next) {
  try {
    const { loan_type_id, amount, tenure_months } = req.query;
    if (!loan_type_id || !amount || !tenure_months) {
      return res.status(400).json({ status: 'error', message: 'loan_type_id, amount and tenure_months are required' });
    }
    const preview = await loanService.previewEmi(loan_type_id, Number(amount), Number(tenure_months));
    res.json({ status: 'success', data: preview });
  } catch (err) { next(err); }
}

async function applyForLoan(req, res, next) {
  try {
    const { employee_id, loan_type_id, requested_amount, tenure_months } = req.body;
    if (!employee_id || !loan_type_id || !requested_amount || !tenure_months) {
      return res.status(400).json({ status: 'error', message: 'employee_id, loan_type_id, requested_amount and tenure_months are required' });
    }
    const loan = await loanService.applyForLoan({ employee_id, loan_type_id, requested_amount, tenure_months });
    res.status(201).json({ status: 'success', data: loan });
  } catch (err) { next(err); }
}

async function listLoanRequests(req, res, next) {
  try {
    const { employee_id, status } = req.query;
    res.json({ status: 'success', data: await loanService.getAllLoanRequests({ employee_id, status }) });
  } catch (err) { next(err); }
}

async function getLoanRequest(req, res, next) {
  try {
    res.json({ status: 'success', data: await loanService.getLoanRequestById(req.params.id) });
  } catch (err) { next(err); }
}

async function updateLoanStatus(req, res, next) {
  try {
    const { status, approved_by } = req.body; // TODO: replace approved_by with req.user.id once auth middleware exists
    const loan = await loanService.updateLoanStatus(req.params.id, status, approved_by || null);
    res.json({ status: 'success', data: loan });
  } catch (err) { next(err); }
}

async function getLoanLedger(req, res, next) {
  try {
    res.json({ status: 'success', data: await loanService.getLoanLedger(req.params.id) });
  } catch (err) { next(err); }
}

async function recordRepayment(req, res, next) {
  try {
    const { payroll_run_id, amount_paid, payment_date } = req.body;
    if (!payroll_run_id || !amount_paid || !payment_date) {
      return res.status(400).json({ status: 'error', message: 'payroll_run_id, amount_paid and payment_date are required' });
    }
    const result = await loanService.recordRepayment({ loan_request_id: req.params.id, payroll_run_id, amount_paid, payment_date });
    res.status(201).json({ status: 'success', data: result });
  } catch (err) { next(err); }
}

module.exports = {
  listLoanTypes, createLoanType, previewEmi, applyForLoan,
  listLoanRequests, getLoanRequest, updateLoanStatus, getLoanLedger, recordRepayment,
};
