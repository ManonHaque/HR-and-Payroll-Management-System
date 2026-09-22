const { pool } = require('../../config/db');

// ----- Deduction Types (e.g. Provident Fund, Professional Tax, Late Penalty) -----
async function getAllDeductionTypes() {
  const [rows] = await pool.query('SELECT * FROM DeductionType ORDER BY name');
  return rows;
}

async function createDeductionType({ name, is_statutory, calculation_type, value }) {
  if (!['Fixed', 'Percentage'].includes(calculation_type)) {
    const err = new Error("calculation_type must be 'Fixed' or 'Percentage'");
    err.status = 400;
    throw err;
  }
  const [result] = await pool.query(
    'INSERT INTO DeductionType (name, is_statutory, calculation_type, value) VALUES (?, ?, ?, ?)',
    [name, is_statutory !== undefined ? is_statutory : false, calculation_type, value]
  );
  return { id: result.insertId, name, is_statutory, calculation_type, value };
}

// ----- Assign a deduction to a single employee -----
async function assignToEmployee({ employee_id, deduction_type_id, value }) {
  const [result] = await pool.query(
    'INSERT INTO EmployeeDeduction (employee_id, deduction_type_id, value) VALUES (?, ?, ?)',
    [employee_id, deduction_type_id, value ?? null]
  );
  return getEmployeeDeductionById(result.insertId);
}

// ----- Assign a deduction to every active employee in a grade (e.g. statutory PF) -----
async function assignByGrade({ grade_id, deduction_type_id, value }) {
  const [employees] = await pool.query(
    "SELECT id FROM Employee WHERE grade_id = ? AND status = 'Active'",
    [grade_id]
  );
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
        'INSERT INTO EmployeeDeduction (employee_id, deduction_type_id, value) VALUES (?, ?, ?)',
        [emp.id, deduction_type_id, value ?? null]
      );
      insertedIds.push(result.insertId);
    }
    await connection.commit();
    return { assigned_count: insertedIds.length, employee_deduction_ids: insertedIds };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function getEmployeeDeductionById(id) {
  const [rows] = await pool.query(
    `SELECT ed.*, dt.name AS deduction_type_name, dt.is_statutory, dt.calculation_type, dt.value AS default_value
     FROM EmployeeDeduction ed JOIN DeductionType dt ON ed.deduction_type_id = dt.id WHERE ed.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Employee deduction record not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getDeductionsForEmployee(employeeId) {
  const [rows] = await pool.query(
    `SELECT ed.*, dt.name AS deduction_type_name, dt.is_statutory, dt.calculation_type, dt.value AS default_value
     FROM EmployeeDeduction ed JOIN DeductionType dt ON ed.deduction_type_id = dt.id WHERE ed.employee_id = ?`,
    [employeeId]
  );
  return rows;
}

// ----- Total deduction for one employee (consumed later by Salary Generation module) -----
async function calculateTotalDeductionForEmployee(employeeId, basicSalary) {
  const deductions = await getDeductionsForEmployee(employeeId);
  let total = 0;
  for (const d of deductions) {
    const rawValue = d.value !== null ? d.value : d.default_value;
    total += d.calculation_type === 'Fixed'
      ? Number(rawValue)
      : Number(basicSalary) * (Number(rawValue) / 100);
  }
  return Math.round(total * 100) / 100;
}

async function updateEmployeeDeduction(id, value) {
  await getEmployeeDeductionById(id);
  await pool.query('UPDATE EmployeeDeduction SET value = ? WHERE id = ?', [value, id]);
  return getEmployeeDeductionById(id);
}

async function removeDeduction(id) {
  await getEmployeeDeductionById(id);
  await pool.query('DELETE FROM EmployeeDeduction WHERE id = ?', [id]);
  return { deleted: true };
}

module.exports = {
  getAllDeductionTypes,
  createDeductionType,
  assignToEmployee,
  assignByGrade,
  getEmployeeDeductionById,
  getDeductionsForEmployee,
  calculateTotalDeductionForEmployee,
  updateEmployeeDeduction,
  removeDeduction,
};
