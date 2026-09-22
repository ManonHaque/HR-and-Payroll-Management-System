const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// ---------------- Grades ----------------

const listGrades = async () => {
  const [rows] = await pool.query(
    `SELECT g.id, g.name, g.min_salary, g.max_salary, COUNT(e.id) AS headcount
     FROM Grade g
     LEFT JOIN Employee e ON e.grade_id = g.id
     GROUP BY g.id
     ORDER BY g.min_salary ASC, g.id ASC`
  );
  return rows;
};

const validateGradePayload = ({ name, min_salary, max_salary }) => {
  if (!name || min_salary === undefined || min_salary === null || max_salary === undefined || max_salary === null) {
    throw new ApiError(400, 'name, min_salary and max_salary are required');
  }
  if (Number(min_salary) < 0 || Number(max_salary) < 0) {
    throw new ApiError(400, 'Salary values cannot be negative');
  }
  if (Number(min_salary) > Number(max_salary)) {
    throw new ApiError(400, 'min_salary cannot be greater than max_salary');
  }
};

const createGrade = async (payload) => {
  validateGradePayload(payload);
  const { name, min_salary, max_salary } = payload;
  try {
    const [result] = await pool.query(
      'INSERT INTO Grade (name, min_salary, max_salary) VALUES (?, ?, ?)',
      [name, min_salary, max_salary]
    );
    return { id: result.insertId, name, min_salary, max_salary, headcount: 0 };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'A grade with this name already exists');
    throw err;
  }
};

const updateGrade = async (id, payload) => {
  validateGradePayload(payload);
  const { name, min_salary, max_salary } = payload;
  try {
    const [result] = await pool.query(
      'UPDATE Grade SET name = ?, min_salary = ?, max_salary = ? WHERE id = ?',
      [name, min_salary, max_salary, id]
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Grade not found');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'A grade with this name already exists');
    throw err;
  }
};

const deleteGrade = async (id) => {
  const [result] = await pool.query('DELETE FROM Grade WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Grade not found');
};

// ---------------- Salary Structure Template ----------------

const getSalaryTemplate = async (gradeId) => {
  const [rows] = await pool.query('SELECT * FROM SalaryStructureTemplate WHERE grade_id = ?', [gradeId]);
  return rows[0] || null;
};

const upsertSalaryTemplate = async (gradeId, payload) => {
  const { basic_percentage, hra_percentage, medical_percentage, transport_percentage } = payload;
  const values = [basic_percentage, hra_percentage, medical_percentage, transport_percentage];
  if (values.some((v) => v === undefined || v === null || isNaN(v) || Number(v) < 0 || Number(v) > 100)) {
    throw new ApiError(400, 'basic_percentage, hra_percentage, medical_percentage and transport_percentage are required and must be between 0 and 100');
  }

  const [grade] = await pool.query('SELECT id FROM Grade WHERE id = ?', [gradeId]);
  if (!grade.length) throw new ApiError(404, 'Grade not found');

  await pool.query(
    `INSERT INTO SalaryStructureTemplate (grade_id, basic_percentage, hra_percentage, medical_percentage, transport_percentage)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       basic_percentage = VALUES(basic_percentage),
       hra_percentage = VALUES(hra_percentage),
       medical_percentage = VALUES(medical_percentage),
       transport_percentage = VALUES(transport_percentage)`,
    [gradeId, ...values]
  );

  return getSalaryTemplate(gradeId);
};

// ---------------- Document Types ----------------

const listDocumentTypes = async () => {
  const [rows] = await pool.query('SELECT * FROM DocumentTypeConfig ORDER BY is_mandatory DESC, name ASC');
  return rows;
};

const createDocumentType = async ({ name, is_mandatory }) => {
  if (!name) throw new ApiError(400, 'name is required');
  try {
    const [result] = await pool.query(
      'INSERT INTO DocumentTypeConfig (name, is_mandatory) VALUES (?, ?)',
      [name, !!is_mandatory]
    );
    return { id: result.insertId, name, is_mandatory: !!is_mandatory };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'This document type already exists');
    throw err;
  }
};

const updateDocumentType = async (id, { name, is_mandatory }) => {
  if (!name) throw new ApiError(400, 'name is required');
  try {
    const [result] = await pool.query(
      'UPDATE DocumentTypeConfig SET name = ?, is_mandatory = ? WHERE id = ?',
      [name, !!is_mandatory, id]
    );
    if (result.affectedRows === 0) throw new ApiError(404, 'Document type not found');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'This document type already exists');
    throw err;
  }
};

const deleteDocumentType = async (id) => {
  try {
    const [result] = await pool.query('DELETE FROM DocumentTypeConfig WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError(404, 'Document type not found');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
      throw new ApiError(409, 'Cannot delete a document type that is already in use by employee documents');
    }
    throw err;
  }
};

// ---------------- Employee ID Auto-generation ----------------

const ensureCompanySetting = async () => {
  const [rows] = await pool.query('SELECT id, emp_id_prefix, next_emp_id FROM CompanySetting ORDER BY id LIMIT 1');
  if (rows.length) return rows[0];
  const [result] = await pool.query(
    "INSERT INTO CompanySetting (name, emp_id_prefix, next_emp_id) VALUES ('My Company', 'EMP-', 1001)"
  );
  return { id: result.insertId, emp_id_prefix: 'EMP-', next_emp_id: 1001 };
};

const getIdGeneration = async () => {
  const setting = await ensureCompanySetting();
  return {
    emp_id_prefix: setting.emp_id_prefix,
    next_emp_id: setting.next_emp_id,
    example: `${setting.emp_id_prefix}${setting.next_emp_id}`
  };
};

const updateIdGeneration = async ({ emp_id_prefix, next_emp_id }) => {
  if (!emp_id_prefix || !next_emp_id || Number(next_emp_id) < 1) {
    throw new ApiError(400, 'emp_id_prefix and a positive next_emp_id are required');
  }
  const setting = await ensureCompanySetting();
  await pool.query('UPDATE CompanySetting SET emp_id_prefix = ?, next_emp_id = ? WHERE id = ?', [
    emp_id_prefix,
    next_emp_id,
    setting.id
  ]);
  return getIdGeneration();
};

// ---------------- Overview (single-page dashboard) ----------------

const getOverview = async () => {
  const [grades, documentTypes, idGeneration] = await Promise.all([
    listGrades(),
    listDocumentTypes(),
    getIdGeneration()
  ]);
  return { grades, documentTypes, idGeneration };
};

module.exports = {
  listGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSalaryTemplate,
  upsertSalaryTemplate,
  listDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  getIdGeneration,
  updateIdGeneration,
  getOverview
};
