const { pool } = require('../../config/db');

async function getAllAllowanceTypes() {
  const [rows] = await pool.query('SELECT * FROM allowancetype ORDER BY name');
  return rows;
}

async function createAllowanceType({ name, is_taxable, calculation_type, value }) {
  const [result] = await pool.query(
    'INSERT INTO allowancetype (name, is_taxable, calculation_type, value) VALUES (?, ?, ?, ?)',
    [name, is_taxable !== undefined ? is_taxable : true, calculation_type, value]
  );
  return { id: result.insertId, name, is_taxable, calculation_type, value };
}

async function assignToEmployee({ employee_id, allowance_type_id, value }) {
  const [result] = await pool.query(
    'INSERT INTO employeeallowance (employee_id, allowance_type_id, value) VALUES (?, ?, ?)',
    [employee_id, allowance_type_id, value ?? null]
  );
  return getEmployeeAllowanceById(result.insertId);
}

async function assignByGrade({ grade_id, allowance_type_id, value }) {
  const [employees] = await pool.query("SELECT id FROM employee WHERE grade_id = ? AND status = 'Active'", [grade_id]);
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
        'INSERT INTO employeeallowance (employee_id, allowance_type_id, value) VALUES (?, ?, ?)',
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
    FROM employeeallowance ea JOIN allowancetype at ON ea.allowance_type_id = at.id WHERE ea.id = ?`,
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
    FROM employeeallowance ea JOIN allowancetype at ON ea.allowance_type_id = at.id WHERE ea.employee_id = ?`,
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
  await pool.query('DELETE FROM employeeallowance WHERE id = ?', [id]);
  return { deleted: true };
}

module.exports = {
  getAllAllowanceTypes, createAllowanceType, assignToEmployee, assignByGrade,
  getAllowancesForEmployee, calculateTotalAllowanceForEmployee, removeAllowance,
};
