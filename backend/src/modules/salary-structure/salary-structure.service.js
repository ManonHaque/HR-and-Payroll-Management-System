const { pool } = require('../../config/db');

// ----- Salary Structure Templates (grade-based Basic/HRA split) -----
async function getAllTemplates() {
  const [rows] = await pool.query(
    `SELECT sst.*, g.name AS grade_name
     FROM SalaryStructureTemplate sst
     JOIN Grade g ON sst.grade_id = g.id
     ORDER BY g.name`
  );
  return rows;
}

async function getTemplateById(id) {
  const [rows] = await pool.query(
    `SELECT sst.*, g.name AS grade_name
     FROM SalaryStructureTemplate sst
     JOIN Grade g ON sst.grade_id = g.id
     WHERE sst.id = ?`,
    [id]
  );
  if (rows.length === 0) {
    const err = new Error('Salary structure template not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

async function getTemplateByGrade(gradeId) {
  const [rows] = await pool.query(
    `SELECT sst.*, g.name AS grade_name
     FROM SalaryStructureTemplate sst
     JOIN Grade g ON sst.grade_id = g.id
     WHERE sst.grade_id = ?`,
    [gradeId]
  );
  if (rows.length === 0) {
    const err = new Error('No salary structure template defined for this grade');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

function validatePercentages(basic_percentage, hra_percentage) {
  const basic = Number(basic_percentage);
  const hra = Number(hra_percentage);
  if (basic <= 0 || basic > 100 || hra < 0 || hra > 100) {
    const err = new Error('basic_percentage and hra_percentage must be between 0 and 100');
    err.status = 400;
    throw err;
  }
  if (basic + hra > 100) {
    const err = new Error('basic_percentage + hra_percentage cannot exceed 100');
    err.status = 400;
    throw err;
  }
}

async function createTemplate({ grade_id, basic_percentage, hra_percentage }) {
  validatePercentages(basic_percentage, hra_percentage);

  const [existing] = await pool.query('SELECT id FROM SalaryStructureTemplate WHERE grade_id = ?', [grade_id]);
  if (existing.length > 0) {
    const err = new Error('A salary structure template already exists for this grade — update it instead');
    err.status = 400;
    throw err;
  }

  const [result] = await pool.query(
    'INSERT INTO SalaryStructureTemplate (grade_id, basic_percentage, hra_percentage) VALUES (?, ?, ?)',
    [grade_id, basic_percentage, hra_percentage]
  );
  return getTemplateById(result.insertId);
}

async function updateTemplate(id, { basic_percentage, hra_percentage }) {
  const existing = await getTemplateById(id);
  const basic = basic_percentage !== undefined ? basic_percentage : existing.basic_percentage;
  const hra = hra_percentage !== undefined ? hra_percentage : existing.hra_percentage;
  validatePercentages(basic, hra);

  await pool.query(
    'UPDATE SalaryStructureTemplate SET basic_percentage = ?, hra_percentage = ? WHERE id = ?',
    [basic, hra, id]
  );
  return getTemplateById(id);
}

async function deleteTemplate(id) {
  await getTemplateById(id);
  await pool.query('DELETE FROM SalaryStructureTemplate WHERE id = ?', [id]);
  return { deleted: true };
}

// ----- Break a CTC / gross figure down using an employee's grade template -----
async function calculateStructureForEmployee(employeeId) {
  const [empRows] = await pool.query(
    'SELECT id, grade_id, basic_salary FROM Employee WHERE id = ?',
    [employeeId]
  );
  if (empRows.length === 0) {
    const err = new Error('Employee not found');
    err.status = 404;
    throw err;
  }
  const employee = empRows[0];
  if (!employee.grade_id) {
    const err = new Error('Employee has no grade assigned — cannot resolve a salary structure template');
    err.status = 400;
    throw err;
  }

  const template = await getTemplateByGrade(employee.grade_id);
  const ctc = Number(employee.basic_salary);
  const basicAmount = Math.round(ctc * (Number(template.basic_percentage) / 100) * 100) / 100;
  const hraAmount = Math.round(ctc * (Number(template.hra_percentage) / 100) * 100) / 100;
  const remainder = Math.round((ctc - basicAmount - hraAmount) * 100) / 100;

  return {
    employee_id: employee.id,
    grade_id: employee.grade_id,
    grade_name: template.grade_name,
    reference_amount: ctc,
    basic_percentage: Number(template.basic_percentage),
    hra_percentage: Number(template.hra_percentage),
    basic_amount: basicAmount,
    hra_amount: hraAmount,
    other_amount: remainder,
  };
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplateByGrade,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  calculateStructureForEmployee,
};
