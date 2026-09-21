# TASK: Implement Loan & Advance, Bonus, and Allowance Modules

## Context
Node.js + Express + MySQL backend for an HR & Payroll Management System, using a
**Feature-Driven Modular Architecture**:
`backend/src/modules/<feature>/<feature>.controller.js|routes.js|service.js`

Database access goes through a `mysql2/promise` connection pool exported from
`backend/src/config/db.js` as `{ pool, testConnection }`.

The tables below already exist in `database/schema.sql` (verified against the actual
file in this repo — column names here are exact):

- `Employee(id, user_id, emp_id, first_name, last_name, email, phone, date_of_birth,
  gender, joining_date, separation_date, status['Active'|'On-Leave'|'Separated'],
  department_id, designation_id, grade_id, branch_id, manager_id, bank_account_no,
  bank_name, basic_salary, created_at, updated_at)`
- `LoanType(id, name, interest_rate, max_amount, max_tenure, created_at)`
- `LoanRequest(id, employee_id, loan_type_id, requested_amount, emi_amount,
  tenure_months, status['Pending'|'Approved'|'Rejected'], approved_by, created_at,
  updated_at)`
- `LoanRepayment(id, loan_request_id, payroll_run_id, amount_paid, payment_date,
  status['Paid'|'Pending'])`
- `BonusType(id, name, calculation_type['Fixed'|'Percentage'], value, created_at)`
- `BonusRun(id, bonus_type_id, run_date, total_amount,
  status['Draft'|'Approved'|'Processed'], created_at)`
- `EmployeeBonus(id, bonus_run_id, employee_id, amount, created_at)`
- `AllowanceType(id, name, is_taxable, calculation_type['Fixed'|'Percentage'], value,
  created_at)`
- `EmployeeAllowance(id, employee_id, allowance_type_id, value, created_at)` — note:
  no `effective_date` column on this table.

Note: `LoanRequest.status` has no `'Closed'` value in the current schema — the code
below handles that (see the commented-out block in `loan.service.js`).

## Instructions for Claude Code

1. Replace the placeholder content of the 9 files below with the exact code given
   (one section per file). Do not rename tables/columns — they must match
   `database/schema.sql` exactly as documented above.
2. In `backend/src/app.js`, find the route-mounting section (a `// TODO` comment or
   commented-out example route mounts) and add the three route-mounting blocks shown
   in "app.js wiring" below.
3. Check `backend/package.json` first; only run `npm install` inside `backend/` if
   `express`, `cors`, `dotenv`, or `mysql2` are missing from dependencies.
4. Start the server with `npm run dev` inside `backend/` and verify:
   - `GET /api/loans/types` → `200 OK`, `{"status":"success","data":[]}`
   - `GET /api/bonuses/types` → `200 OK`, `{"status":"success","data":[]}`
   - `GET /api/allowances/types` → `200 OK`, `{"status":"success","data":[]}`
   (Empty arrays are expected — the tables have no rows yet.)
5. Do not modify any files outside `backend/src/modules/loan/`,
   `backend/src/modules/bonus/`, `backend/src/modules/allowance/`, and the
   route-mounting section of `backend/src/app.js`.
6. If a table/column referenced below turns out not to match the live
   `database/schema.sql` in this repo, stop and flag the mismatch instead of
   guessing or silently adapting.

---

## FILE 1: `backend/src/modules/loan/loan.service.js`

```js
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
```

---

## FILE 2: `backend/src/modules/loan/loan.controller.js`

```js
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
```

---

## FILE 3: `backend/src/modules/loan/loan.routes.js`

```js
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
```

---

## FILE 4: `backend/src/modules/bonus/bonus.service.js`

```js
const { pool } = require('../../config/db');

async function getAllBonusTypes() {
  const [rows] = await pool.query('SELECT * FROM BonusType ORDER BY name');
  return rows;
}

async function createBonusType({ name, calculation_type, value }) {
  const [result] = await pool.query(
    'INSERT INTO BonusType (name, calculation_type, value) VALUES (?, ?, ?)',
    [name, calculation_type, value]
  );
  return { id: result.insertId, name, calculation_type, value };
}

function calculateBonusAmount(basicSalary, bonusType) {
  if (bonusType.calculation_type === 'Fixed') return Number(bonusType.value);
  return Math.round(Number(basicSalary) * (Number(bonusType.value) / 100) * 100) / 100;
}

// ----- Bulk generation for all/filtered eligible employees -----
async function generateBonusRun({ bonus_type_id, run_date, department_id, grade_id }) {
  const [typeRows] = await pool.query('SELECT * FROM BonusType WHERE id = ?', [bonus_type_id]);
  if (typeRows.length === 0) {
    const err = new Error('Bonus type not found');
    err.status = 404;
    throw err;
  }
  const bonusType = typeRows[0];

  let empQuery = "SELECT id, basic_salary FROM Employee WHERE status = 'Active'";
  const empParams = [];
  if (department_id) { empQuery += ' AND department_id = ?'; empParams.push(department_id); }
  if (grade_id) { empQuery += ' AND grade_id = ?'; empParams.push(grade_id); }
  const [employees] = await pool.query(empQuery, empParams);

  if (employees.length === 0) {
    const err = new Error('No eligible employees found for the given filters');
    err.status = 400;
    throw err;
  }

  const employeeBonuses = employees.map(emp => ({
    employee_id: emp.id,
    amount: calculateBonusAmount(emp.basic_salary, bonusType),
  }));
  const totalAmount = employeeBonuses.reduce((sum, eb) => sum + eb.amount, 0);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [runResult] = await connection.query(
      `INSERT INTO BonusRun (bonus_type_id, run_date, total_amount, status) VALUES (?, ?, ?, 'Draft')`,
      [bonus_type_id, run_date, totalAmount]
    );
    const bonusRunId = runResult.insertId;

    for (const eb of employeeBonuses) {
      await connection.query(
        'INSERT INTO EmployeeBonus (bonus_run_id, employee_id, amount) VALUES (?, ?, ?)',
        [bonusRunId, eb.employee_id, eb.amount]
      );
    }

    await connection.commit();
    return getBonusRunById(bonusRunId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getAllBonusRuns() {
  const [rows] = await pool.query(
    `SELECT br.*, bt.name AS bonus_type_name FROM BonusRun br
     JOIN BonusType bt ON br.bonus_type_id = bt.id ORDER BY br.run_date DESC`
  );
  return rows;
}

async function getBonusRunById(id) {
  const [runRows] = await pool.query(
    `SELECT br.*, bt.name AS bonus_type_name FROM BonusRun br
     JOIN BonusType bt ON br.bonus_type_id = bt.id WHERE br.id = ?`,
    [id]
  );
  if (runRows.length === 0) {
    const err = new Error('Bonus run not found');
    err.status = 404;
    throw err;
  }

  const [employeeBonuses] = await pool.query(
    `SELECT eb.*, e.first_name, e.last_name FROM EmployeeBonus eb
     JOIN Employee e ON eb.employee_id = e.id WHERE eb.bonus_run_id = ?`,
    [id]
  );

  return { ...runRows[0], employee_bonuses: employeeBonuses };
}

// ----- Adjust one employee's bonus before finalization -----
async function adjustEmployeeBonus(employeeBonusId, newAmount) {
  const [rows] = await pool.query('SELECT * FROM EmployeeBonus WHERE id = ?', [employeeBonusId]);
  if (rows.length === 0) {
    const err = new Error('Employee bonus record not found');
    err.status = 404;
    throw err;
  }
  const [runRows] = await pool.query('SELECT status FROM BonusRun WHERE id = ?', [rows[0].bonus_run_id]);
  if (runRows[0].status !== 'Draft') {
    const err = new Error('Cannot adjust a bonus that has already been approved or processed');
    err.status = 400;
    throw err;
  }

  await pool.query('UPDATE EmployeeBonus SET amount = ? WHERE id = ?', [newAmount, employeeBonusId]);

  const [sumRows] = await pool.query(
    'SELECT SUM(amount) AS total FROM EmployeeBonus WHERE bonus_run_id = ?',
    [rows[0].bonus_run_id]
  );
  await pool.query('UPDATE BonusRun SET total_amount = ? WHERE id = ?', [sumRows[0].total, rows[0].bonus_run_id]);

  return getBonusRunById(rows[0].bonus_run_id);
}

async function updateBonusRunStatus(id, status) {
  if (!['Approved', 'Processed'].includes(status)) {
    const err = new Error('Status must be Approved or Processed');
    err.status = 400;
    throw err;
  }
  await pool.query('UPDATE BonusRun SET status = ? WHERE id = ?', [status, id]);
  return getBonusRunById(id);
}

module.exports = {
  getAllBonusTypes, createBonusType, generateBonusRun,
  getAllBonusRuns, getBonusRunById, adjustEmployeeBonus, updateBonusRunStatus,
};
```

---

## FILE 5: `backend/src/modules/bonus/bonus.controller.js`

```js
const bonusService = require('./bonus.service');

async function listBonusTypes(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getAllBonusTypes() }); }
  catch (err) { next(err); }
}

async function createBonusType(req, res, next) {
  try {
    const { name, calculation_type, value } = req.body;
    if (!name || !calculation_type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'name, calculation_type and value are required' });
    }
    res.status(201).json({ status: 'success', data: await bonusService.createBonusType({ name, calculation_type, value }) });
  } catch (err) { next(err); }
}

async function generateBonusRun(req, res, next) {
  try {
    const { bonus_type_id, run_date, department_id, grade_id } = req.body;
    if (!bonus_type_id || !run_date) {
      return res.status(400).json({ status: 'error', message: 'bonus_type_id and run_date are required' });
    }
    const run = await bonusService.generateBonusRun({ bonus_type_id, run_date, department_id, grade_id });
    res.status(201).json({ status: 'success', data: run });
  } catch (err) { next(err); }
}

async function listBonusRuns(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getAllBonusRuns() }); }
  catch (err) { next(err); }
}

async function getBonusRun(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getBonusRunById(req.params.id) }); }
  catch (err) { next(err); }
}

async function adjustEmployeeBonus(req, res, next) {
  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ status: 'error', message: 'amount is required' });
    }
    res.json({ status: 'success', data: await bonusService.adjustEmployeeBonus(req.params.employeeBonusId, amount) });
  } catch (err) { next(err); }
}

async function updateBonusRunStatus(req, res, next) {
  try {
    res.json({ status: 'success', data: await bonusService.updateBonusRunStatus(req.params.id, req.body.status) });
  } catch (err) { next(err); }
}

module.exports = {
  listBonusTypes, createBonusType, generateBonusRun,
  listBonusRuns, getBonusRun, adjustEmployeeBonus, updateBonusRunStatus,
};
```

---

## FILE 6: `backend/src/modules/bonus/bonus.routes.js`

```js
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
```

---

## FILE 7: `backend/src/modules/allowance/allowance.service.js`

```js
const { pool } = require('../../config/db');

async function getAllAllowanceTypes() {
  const [rows] = await pool.query('SELECT * FROM AllowanceType ORDER BY name');
  return rows;
}

async function createAllowanceType({ name, is_taxable, calculation_type, value }) {
  const [result] = await pool.query(
    'INSERT INTO AllowanceType (name, is_taxable, calculation_type, value) VALUES (?, ?, ?, ?)',
    [name, is_taxable !== undefined ? is_taxable : true, calculation_type, value]
  );
  return { id: result.insertId, name, is_taxable, calculation_type, value };
}

async function assignToEmployee({ employee_id, allowance_type_id, value }) {
  const [result] = await pool.query(
    'INSERT INTO EmployeeAllowance (employee_id, allowance_type_id, value) VALUES (?, ?, ?)',
    [employee_id, allowance_type_id, value ?? null]
  );
  return getEmployeeAllowanceById(result.insertId);
}

async function assignByGrade({ grade_id, allowance_type_id, value }) {
  const [employees] = await pool.query("SELECT id FROM Employee WHERE grade_id = ? AND status = 'Active'", [grade_id]);
  if (employees.length === 0) {
    const err = new Error('No active employees found in the given grade');
    err.status = 400;
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const insertedIds = [];
    for (const emp of employees) {
      const [result] = await connection.query(
        'INSERT INTO EmployeeAllowance (employee_id, allowance_type_id, value) VALUES (?, ?, ?)',
        [emp.id, allowance_type_id, value ?? null]
      );
      insertedIds.push(result.insertId);
    }
    await connection.commit();
    return { assigned_count: insertedIds.length, employee_allowance_ids: insertedIds };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getEmployeeAllowanceById(id) {
  const [rows] = await pool.query(
    `SELECT ea.*, at.name AS allowance_type_name, at.is_taxable, at.calculation_type, at.value AS default_value
     FROM EmployeeAllowance ea JOIN AllowanceType at ON ea.allowance_type_id = at.id WHERE ea.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Employee allowance record not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getAllowancesForEmployee(employeeId) {
  const [rows] = await pool.query(
    `SELECT ea.*, at.name AS allowance_type_name, at.is_taxable, at.calculation_type, at.value AS default_value
     FROM EmployeeAllowance ea JOIN AllowanceType at ON ea.allowance_type_id = at.id WHERE ea.employee_id = ?`,
    [employeeId]
  );
  return rows;
}

// ----- Total allowance for one employee (used later by Salary Generation module) -----
async function calculateTotalAllowanceForEmployee(employeeId, basicSalary) {
  const allowances = await getAllowancesForEmployee(employeeId);
  let total = 0;
  for (const a of allowances) {
    const rawValue = a.value !== null ? a.value : a.default_value;
    total += a.calculation_type === 'Fixed'
      ? Number(rawValue)
      : Number(basicSalary) * (Number(rawValue) / 100);
  }
  return Math.round(total * 100) / 100;
}

async function removeAllowance(id) {
  await getEmployeeAllowanceById(id);
  await pool.query('DELETE FROM EmployeeAllowance WHERE id = ?', [id]);
  return { deleted: true };
}

module.exports = {
  getAllAllowanceTypes, createAllowanceType, assignToEmployee, assignByGrade,
  getAllowancesForEmployee, calculateTotalAllowanceForEmployee, removeAllowance,
};
```

---

## FILE 8: `backend/src/modules/allowance/allowance.controller.js`

```js
const allowanceService = require('./allowance.service');

async function listAllowanceTypes(req, res, next) {
  try { res.json({ status: 'success', data: await allowanceService.getAllAllowanceTypes() }); }
  catch (err) { next(err); }
}

async function createAllowanceType(req, res, next) {
  try {
    const { name, is_taxable, calculation_type, value } = req.body;
    if (!name || !calculation_type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'name, calculation_type and value are required' });
    }
    res.status(201).json({ status: 'success', data: await allowanceService.createAllowanceType({ name, is_taxable, calculation_type, value }) });
  } catch (err) { next(err); }
}

async function assignAllowance(req, res, next) {
  try {
    const { employee_id, grade_id, allowance_type_id, value } = req.body;
    if (!allowance_type_id) {
      return res.status(400).json({ status: 'error', message: 'allowance_type_id is required' });
    }
    if (!employee_id && !grade_id) {
      return res.status(400).json({ status: 'error', message: 'Provide either employee_id (individual) or grade_id (bulk)' });
    }
    const result = employee_id
      ? await allowanceService.assignToEmployee({ employee_id, allowance_type_id, value })
      : await allowanceService.assignByGrade({ grade_id, allowance_type_id, value });
    res.status(201).json({ status: 'success', data: result });
  } catch (err) { next(err); }
}

async function getEmployeeAllowances(req, res, next) {
  try { res.json({ status: 'success', data: await allowanceService.getAllowancesForEmployee(req.params.employeeId) }); }
  catch (err) { next(err); }
}

async function removeAllowance(req, res, next) {
  try { res.json({ status: 'success', data: await allowanceService.removeAllowance(req.params.id) }); }
  catch (err) { next(err); }
}

module.exports = { listAllowanceTypes, createAllowanceType, assignAllowance, getEmployeeAllowances, removeAllowance };
```

---

## FILE 9: `backend/src/modules/allowance/allowance.routes.js`

```js
const express = require('express');
const router = express.Router();
const allowanceController = require('./allowance.controller');

router.get('/types', allowanceController.listAllowanceTypes);
router.post('/types', allowanceController.createAllowanceType);

router.post('/assign', allowanceController.assignAllowance);
router.get('/employee/:employeeId', allowanceController.getEmployeeAllowances);
router.delete('/:id', allowanceController.removeAllowance);

module.exports = router;
```

---

## app.js wiring

In `backend/src/app.js`, add these three blocks where module routes are meant to be
mounted (near the `// TODO: Import and mount module routes here` comment, or replacing
it):

```js
const loanRoutes = require('./modules/loan/loan.routes');
app.use('/api/loans', loanRoutes);

const bonusRoutes = require('./modules/bonus/bonus.routes');
app.use('/api/bonuses', bonusRoutes);

const allowanceRoutes = require('./modules/allowance/allowance.routes');
app.use('/api/allowances', allowanceRoutes);
```

## Verification checklist (run after wiring)
- [ ] `npm run dev` inside `backend/` starts without errors and logs a successful
      MySQL connection (via `testConnection` in `config/db.js`)
- [ ] `GET /api/loans/types` → `200 OK`, `{"status":"success","data":[]}`
- [ ] `GET /api/bonuses/types` → `200 OK`, `{"status":"success","data":[]}`
- [ ] `GET /api/allowances/types` → `200 OK`, `{"status":"success","data":[]}`
- [ ] No changes made to files outside the paths listed in instruction step 5 above
</content>
