const { pool } = require('../../config/db');

// ----- Loan Types -----
async function getAllLoanTypes() {
  const [rows] = await pool.query('SELECT * FROM LoanType ORDER BY name');
  return rows;
}

async function createLoanType({ name, interest_rate, max_amount, max_tenure }) {
  const [result] = await pool.query(
    'INSERT INTO LoanType (name, interest_rate, max_amount, max_tenure) VALUES (?, ?, ?, ?)',
    [name, interest_rate || 0, max_amount, max_tenure]
  );
  return { id: result.insertId, name, interest_rate, max_amount, max_tenure };
}

// ----- EMI calculation (flat-rate): (P + P*rate%*years) / tenure -----
function calculateEmi(amount, interestRate, tenureMonths) {
  const principal = Number(amount);
  const rate = Number(interestRate) || 0;
  const tenure = Number(tenureMonths);
  const totalInterest = principal * (rate / 100) * (tenure / 12);
  const emi = (principal + totalInterest) / tenure;
  return Math.round(emi * 100) / 100;
}

async function previewEmi(loanTypeId, amount, tenureMonths) {
  const [rows] = await pool.query('SELECT * FROM LoanType WHERE id = ?', [loanTypeId]);
  if (rows.length === 0) {
    const err = new Error('Loan type not found');
    err.status = 404;
    throw err;
  }
  const loanType = rows[0];

  if (amount > loanType.max_amount) {
    const err = new Error(`Amount exceeds maximum allowed (${loanType.max_amount}) for this loan type`);
    err.status = 400;
    throw err;
  }
  if (tenureMonths > loanType.max_tenure) {
    const err = new Error(`Tenure exceeds maximum allowed (${loanType.max_tenure} months) for this loan type`);
    err.status = 400;
    throw err;
  }

  const emi = calculateEmi(amount, loanType.interest_rate, tenureMonths);
  return {
    loan_type: loanType.name,
    requested_amount: amount,
    tenure_months: tenureMonths,
    interest_rate: loanType.interest_rate,
    emi_amount: emi,
  };
}

// ----- Loan Requests -----
async function applyForLoan({ employee_id, loan_type_id, requested_amount, tenure_months }) {
  const preview = await previewEmi(loan_type_id, requested_amount, tenure_months);

  const [result] = await pool.query(
    `INSERT INTO LoanRequest (employee_id, loan_type_id, requested_amount, emi_amount, tenure_months, status)
     VALUES (?, ?, ?, ?, ?, 'Pending')`,
    [employee_id, loan_type_id, requested_amount, preview.emi_amount, tenure_months]
  );

  return getLoanRequestById(result.insertId);
}

async function getAllLoanRequests({ employee_id, status } = {}) {
  let query = `
    SELECT lr.*, lt.name AS loan_type_name, e.first_name, e.last_name
    FROM LoanRequest lr
    JOIN LoanType lt ON lr.loan_type_id = lt.id
    JOIN Employee e ON lr.employee_id = e.id
    WHERE 1 = 1
  `;
  const params = [];
  if (employee_id) { query += ' AND lr.employee_id = ?'; params.push(employee_id); }
  if (status) { query += ' AND lr.status = ?'; params.push(status); }
  query += ' ORDER BY lr.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getLoanRequestById(id) {
  const [rows] = await pool.query(
    `SELECT lr.*, lt.name AS loan_type_name, e.first_name, e.last_name
     FROM LoanRequest lr
     JOIN LoanType lt ON lr.loan_type_id = lt.id
     JOIN Employee e ON lr.employee_id = e.id
     WHERE lr.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Loan request not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function updateLoanStatus(id, status, approvedBy) {
  if (!['Approved', 'Rejected'].includes(status)) {
    const err = new Error('Status must be Approved or Rejected');
    err.status = 400;
    throw err;
  }
  await pool.query('UPDATE LoanRequest SET status = ?, approved_by = ? WHERE id = ?', [status, approvedBy, id]);
  return getLoanRequestById(id);
}

// ----- Loan ledger (outstanding balance + repayment history) -----
async function getLoanLedger(loanRequestId) {
  const loan = await getLoanRequestById(loanRequestId);

  const [repayments] = await pool.query(
    'SELECT * FROM LoanRepayment WHERE loan_request_id = ? ORDER BY payment_date',
    [loanRequestId]
  );

  const totalPaid = repayments
    .filter(r => r.status === 'Paid')
    .reduce((sum, r) => sum + Number(r.amount_paid), 0);

  const totalPayable = Number(loan.emi_amount) * Number(loan.tenure_months);
  const outstandingBalance = Math.max(totalPayable - totalPaid, 0);

  return {
    loan,
    repayments,
    total_payable: Math.round(totalPayable * 100) / 100,
    total_paid: Math.round(totalPaid * 100) / 100,
    outstanding_balance: Math.round(outstandingBalance * 100) / 100,
  };
}

// ----- Record a repayment (called by payroll run when EMI is deducted) -----
async function recordRepayment({ loan_request_id, payroll_run_id, amount_paid, payment_date }) {
  const [result] = await pool.query(
    `INSERT INTO LoanRepayment (loan_request_id, payroll_run_id, amount_paid, payment_date, status)
     VALUES (?, ?, ?, ?, 'Paid')`,
    [loan_request_id, payroll_run_id, amount_paid, payment_date]
  );

  const ledger = await getLoanLedger(loan_request_id);
  // NOTE: LoanRequest.status ENUM in schema.sql currently has no 'Closed' value.
  // If you want a fully-repaid loan to stop being deducted, add 'Closed' to the
  // ENUM in schema.sql and uncomment the block below.
  // if (ledger.outstanding_balance <= 0) {
  //   await pool.query("UPDATE LoanRequest SET status = 'Closed' WHERE id = ?", [loan_request_id]);
  // }

  return { id: result.insertId, ...ledger };
}

module.exports = {
  getAllLoanTypes,
  createLoanType,
  previewEmi,
  applyForLoan,
  getAllLoanRequests,
  getLoanRequestById,
  updateLoanStatus,
  getLoanLedger,
  recordRepayment,
};
