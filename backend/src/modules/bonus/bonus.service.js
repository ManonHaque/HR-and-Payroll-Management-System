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
