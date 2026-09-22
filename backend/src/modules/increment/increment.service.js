const { pool } = require('../../config/db');

// ----- Increment Policies -----
async function getAllPolicies() {
  const [rows] = await pool.query('SELECT * FROM IncrementPolicy ORDER BY name');
  return rows;
}

async function createPolicy({ name, type, value, eligibility_criteria }) {
  if (!['Fixed', 'Percentage'].includes(type)) {
    const err = new Error("type must be 'Fixed' or 'Percentage'");
    err.status = 400;
    throw err;
  }
  const [result] = await pool.query(
    'INSERT INTO IncrementPolicy (name, type, value, eligibility_criteria) VALUES (?, ?, ?, ?)',
    [name, type, value, eligibility_criteria || null]
  );
  return { id: result.insertId, name, type, value, eligibility_criteria };
}

async function getPolicyById(id) {
  const [rows] = await pool.query('SELECT * FROM IncrementPolicy WHERE id = ?', [id]);
  if (rows.length === 0) {
    const err = new Error('Increment policy not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ----- Revised salary calculation -----
function calculateRevisedSalary(previousSalary, policy) {
  const base = Number(previousSalary);
  const revised = policy.type === 'Fixed'
    ? base + Number(policy.value)
    : base + base * (Number(policy.value) / 100);
  return Math.round(revised * 100) / 100;
}

async function getEmployeeBasicSalary(employeeId) {
  const [rows] = await pool.query('SELECT id, basic_salary FROM Employee WHERE id = ?', [employeeId]);
  if (rows.length === 0) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ----- Preview a revised salary before submitting an increment -----
async function previewIncrement(employeeId, policyId) {
  const employee = await getEmployeeBasicSalary(employeeId);
  const policy = await getPolicyById(policyId);
  const revisedSalary = calculateRevisedSalary(employee.basic_salary, policy);

  return {
    employee_id: employee.id,
    policy_name: policy.name,
    policy_type: policy.type,
    policy_value: policy.value,
    previous_salary: Number(employee.basic_salary),
    revised_salary: revisedSalary,
    increment_amount: Math.round((revisedSalary - Number(employee.basic_salary)) * 100) / 100,
  };
}

// ----- Increment requests (individual) -----
async function createIncrement({ employee_id, policy_id, revised_salary, effective_date }) {
  const employee = await getEmployeeBasicSalary(employee_id);

  let finalRevisedSalary = revised_salary;
  if (policy_id) {
    const policy = await getPolicyById(policy_id);
    finalRevisedSalary = calculateRevisedSalary(employee.basic_salary, policy);
  }

  if (!finalRevisedSalary || Number(finalRevisedSalary) <= Number(employee.basic_salary)) {
    const err = new Error('revised_salary must be greater than the employee current basic_salary');
    err.status = 400;
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO Increment (employee_id, previous_salary, revised_salary, effective_date, status)
     VALUES (?, ?, ?, ?, 'Pending')`,
    [employee_id, employee.basic_salary, finalRevisedSalary, effective_date]
  );

  return getIncrementById(result.insertId);
}

// ----- Bulk increment run against an eligible group (department/grade), driven by a policy -----
async function generateBulkIncrement({ policy_id, department_id, grade_id, effective_date }) {
  const policy = await getPolicyById(policy_id);

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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const insertedIds = [];
    for (const emp of employees) {
      const revisedSalary = calculateRevisedSalary(emp.basic_salary, policy);
      const [result] = await connection.query(
        `INSERT INTO Increment (employee_id, previous_salary, revised_salary, effective_date, status)
         VALUES (?, ?, ?, ?, 'Pending')`,
        [emp.id, emp.basic_salary, revisedSalary, effective_date]
      );
      insertedIds.push(result.insertId);
    }
    await connection.commit();
    return { generated_count: insertedIds.length, increment_ids: insertedIds };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getAllIncrements({ employee_id, status } = {}) {
  let query = `
    SELECT i.*, e.first_name, e.last_name, e.emp_id
    FROM Increment i
    JOIN Employee e ON i.employee_id = e.id
    WHERE 1 = 1
  `;
  const params = [];
  if (employee_id) { query += ' AND i.employee_id = ?'; params.push(employee_id); }
  if (status) { query += ' AND i.status = ?'; params.push(status); }
  query += ' ORDER BY i.created_at DESC';

  const [rows] = await pool.query(query, params);
  return rows;
}

async function getIncrementById(id) {
  const [rows] = await pool.query(
    `SELECT i.*, e.first_name, e.last_name, e.emp_id
     FROM Increment i
     JOIN Employee e ON i.employee_id = e.id
     WHERE i.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Increment record not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

// ----- Approve/Reject an increment. Approval updates Employee.basic_salary. -----
async function updateIncrementStatus(id, status, approvedBy) {
  if (!['Approved', 'Rejected'].includes(status)) {
    const err = new Error('Status must be Approved or Rejected');
    err.status = 400;
    throw err;
  }

  const increment = await getIncrementById(id);
  if (increment.status !== 'Pending') {
    const err = new Error(`Increment is already ${increment.status} and cannot be changed`);
    err.status = 400;
    throw err;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      'UPDATE Increment SET status = ?, approved_by = ? WHERE id = ?',
      [status, approvedBy, id]
    );

    if (status === 'Approved') {
      await connection.query(
        'UPDATE Employee SET basic_salary = ? WHERE id = ?',
        [increment.revised_salary, increment.employee_id]
      );
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return getIncrementById(id);
}

async function getIncrementHistoryForEmployee(employeeId) {
  const [rows] = await pool.query(
    'SELECT * FROM Increment WHERE employee_id = ? ORDER BY effective_date DESC',
    [employeeId]
  );
  return rows;
}

module.exports = {
  getAllPolicies,
  createPolicy,
  getPolicyById,
  previewIncrement,
  createIncrement,
  generateBulkIncrement,
  getAllIncrements,
  getIncrementById,
  updateIncrementStatus,
  getIncrementHistoryForEmployee,
};
