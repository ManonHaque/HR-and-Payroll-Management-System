const { pool } = require('../../config/db');
const ApiError = require('../../utils/ApiError');

// ---------------- Form Options (lookups for onboarding) ----------------

const getFormOptions = async () => {
  const [[departments], [designations], [grades], [branches], [documentTypes], [managers]] = await Promise.all([
    pool.query('SELECT id, name FROM Department ORDER BY name ASC'),
    pool.query('SELECT id, department_id, name FROM Designation ORDER BY name ASC'),
    pool.query('SELECT id, name, min_salary, max_salary FROM Grade ORDER BY min_salary ASC'),
    pool.query('SELECT id, name FROM Branch ORDER BY name ASC'),
    pool.query('SELECT id, name, is_mandatory FROM DocumentTypeConfig ORDER BY is_mandatory DESC, name ASC'),
    pool.query("SELECT id, emp_id, first_name, last_name FROM Employee WHERE status = 'Active' ORDER BY first_name ASC")
  ]);
  return { departments, designations, grades, branches, documentTypes, managers };
};

// ---------------- Directory ----------------

const listEmployees = async ({ search, department_id, designation_id, status, page, limit }) => {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(e.first_name LIKE ? OR e.last_name LIKE ? OR e.emp_id LIKE ? OR e.email LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (department_id) {
    conditions.push('e.department_id = ?');
    params.push(department_id);
  }
  if (designation_id) {
    conditions.push('e.designation_id = ?');
    params.push(designation_id);
  }
  if (status) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const [rows] = await pool.query(
    `SELECT e.id, e.emp_id, e.first_name, e.last_name, e.email, e.phone, e.status, e.joining_date,
            d.name AS department_name, ds.name AS designation_name
     FROM Employee e
     LEFT JOIN Department d ON d.id = e.department_id
     LEFT JOIN Designation ds ON ds.id = e.designation_id
     ${whereClause}
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM Employee e ${whereClause}`, params);

  return { data: rows, total: countRows[0].total, page: pageNum, limit: limitNum };
};

// ---------------- Profile ----------------

const getEmployeeById = async (id) => {
  const [rows] = await pool.query(
    `SELECT e.*,
            d.name AS department_name, ds.name AS designation_name,
            g.name AS grade_name, b.name AS branch_name,
            CONCAT(m.first_name, ' ', m.last_name) AS manager_name
     FROM Employee e
     LEFT JOIN Department d ON d.id = e.department_id
     LEFT JOIN Designation ds ON ds.id = e.designation_id
     LEFT JOIN Grade g ON g.id = e.grade_id
     LEFT JOIN Branch b ON b.id = e.branch_id
     LEFT JOIN Employee m ON m.id = e.manager_id
     WHERE e.id = ?`,
    [id]
  );
  if (!rows.length) throw new ApiError(404, 'Employee not found');
  const employee = rows[0];

  const [emergencyContacts] = await pool.query(
    'SELECT id, name, relationship, phone FROM EmergencyContact WHERE employee_id = ?',
    [id]
  );
  const documents = await listDocuments(id);

  return { ...employee, emergencyContacts, documents };
};

// ---------------- Onboarding ----------------

const validateOnboardingPayload = ({ first_name, last_name, joining_date, department_id, designation_id }) => {
  if (!first_name || !last_name || !joining_date || !department_id || !designation_id) {
    throw new ApiError(400, 'first_name, last_name, joining_date, department_id and designation_id are required');
  }
};

const createEmployee = async (payload) => {
  validateOnboardingPayload(payload);
  const {
    first_name, last_name, email, phone, date_of_birth, gender,
    joining_date, department_id, designation_id, grade_id, branch_id, manager_id,
    bank_account_no, bank_name, basic_salary, emergency_contacts
  } = payload;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [settingRows] = await connection.query(
      'SELECT id, emp_id_prefix, next_emp_id FROM CompanySetting ORDER BY id LIMIT 1 FOR UPDATE'
    );
    let setting = settingRows[0];
    if (!setting) {
      const [result] = await connection.query(
        "INSERT INTO CompanySetting (name, emp_id_prefix, next_emp_id) VALUES ('My Company', 'EMP-', 1001)"
      );
      setting = { id: result.insertId, emp_id_prefix: 'EMP-', next_emp_id: 1001 };
    }
    const empId = `${setting.emp_id_prefix}${setting.next_emp_id}`;
    await connection.query('UPDATE CompanySetting SET next_emp_id = next_emp_id + 1 WHERE id = ?', [setting.id]);

    const [result] = await connection.query(
      `INSERT INTO Employee (
        emp_id, first_name, last_name, email, phone, date_of_birth, gender,
        joining_date, department_id, designation_id, grade_id, branch_id, manager_id,
        bank_account_no, bank_name, basic_salary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId, first_name, last_name, email || null, phone || null, date_of_birth || null, gender || null,
        joining_date, department_id, designation_id, grade_id || null, branch_id || null, manager_id || null,
        bank_account_no || null, bank_name || null, basic_salary || 0
      ]
    );
    const employeeId = result.insertId;

    if (Array.isArray(emergency_contacts)) {
      for (const contact of emergency_contacts) {
        if (!contact || !contact.name || !contact.phone) continue;
        await connection.query(
          'INSERT INTO EmergencyContact (employee_id, name, relationship, phone) VALUES (?, ?, ?, ?)',
          [employeeId, contact.name, contact.relationship || null, contact.phone]
        );
      }
    }

    await connection.commit();
    return getEmployeeById(employeeId);
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'An employee with this email already exists');
    throw err;
  } finally {
    connection.release();
  }
};

const updateEmployee = async (id, payload) => {
  const editableFields = [
    'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
    'department_id', 'designation_id', 'grade_id', 'branch_id', 'manager_id',
    'bank_account_no', 'bank_name', 'basic_salary'
  ];
  const updates = [];
  const params = [];
  for (const field of editableFields) {
    if (payload[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(payload[field] === '' ? null : payload[field]);
    }
  }
  if (!updates.length) throw new ApiError(400, 'No fields provided to update');
  params.push(id);

  try {
    const [result] = await pool.query(`UPDATE Employee SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) throw new ApiError(404, 'Employee not found');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'An employee with this email already exists');
    throw err;
  }
  return getEmployeeById(id);
};

// ---------------- Separation ----------------

const separateEmployee = async (id, { separation_date, separation_reason, clearance_completed }) => {
  if (!separation_date) throw new ApiError(400, 'separation_date is required');
  const [result] = await pool.query(
    `UPDATE Employee
     SET status = 'Separated', separation_date = ?, separation_reason = ?, clearance_completed = ?
     WHERE id = ?`,
    [separation_date, separation_reason || null, !!clearance_completed, id]
  );
  if (result.affectedRows === 0) throw new ApiError(404, 'Employee not found');
  return getEmployeeById(id);
};

// ---------------- Emergency Contacts ----------------

const addEmergencyContact = async (employeeId, { name, relationship, phone }) => {
  if (!name || !phone) throw new ApiError(400, 'name and phone are required');
  const [employee] = await pool.query('SELECT id FROM Employee WHERE id = ?', [employeeId]);
  if (!employee.length) throw new ApiError(404, 'Employee not found');
  const [result] = await pool.query(
    'INSERT INTO EmergencyContact (employee_id, name, relationship, phone) VALUES (?, ?, ?, ?)',
    [employeeId, name, relationship || null, phone]
  );
  return { id: result.insertId, employee_id: Number(employeeId), name, relationship: relationship || null, phone };
};

const updateEmergencyContact = async (contactId, { name, relationship, phone }) => {
  if (!name || !phone) throw new ApiError(400, 'name and phone are required');
  const [result] = await pool.query(
    'UPDATE EmergencyContact SET name = ?, relationship = ?, phone = ? WHERE id = ?',
    [name, relationship || null, phone, contactId]
  );
  if (result.affectedRows === 0) throw new ApiError(404, 'Emergency contact not found');
};

const deleteEmergencyContact = async (contactId) => {
  const [result] = await pool.query('DELETE FROM EmergencyContact WHERE id = ?', [contactId]);
  if (result.affectedRows === 0) throw new ApiError(404, 'Emergency contact not found');
};

// ---------------- Documents ----------------

const listDocuments = async (employeeId) => {
  const [rows] = await pool.query(
    `SELECT ed.id, ed.file_path, ed.is_verified, ed.created_at,
            dt.id AS document_type_id, dt.name AS document_type_name, dt.is_mandatory
     FROM EmployeeDocument ed
     JOIN DocumentTypeConfig dt ON dt.id = ed.document_type_id
     WHERE ed.employee_id = ?
     ORDER BY ed.created_at DESC`,
    [employeeId]
  );
  return rows;
};

const addDocument = async (employeeId, { document_type_id, file_path }) => {
  if (!document_type_id || !file_path) throw new ApiError(400, 'document_type_id and file are required');
  const [employee] = await pool.query('SELECT id FROM Employee WHERE id = ?', [employeeId]);
  if (!employee.length) throw new ApiError(404, 'Employee not found');
  const [result] = await pool.query(
    'INSERT INTO EmployeeDocument (employee_id, document_type_id, file_path) VALUES (?, ?, ?)',
    [employeeId, document_type_id, file_path]
  );
  return { id: result.insertId, employee_id: Number(employeeId), document_type_id: Number(document_type_id), file_path };
};

const deleteDocument = async (docId) => {
  const [rows] = await pool.query('SELECT file_path FROM EmployeeDocument WHERE id = ?', [docId]);
  if (!rows.length) throw new ApiError(404, 'Document not found');
  await pool.query('DELETE FROM EmployeeDocument WHERE id = ?', [docId]);
  return rows[0].file_path;
};

module.exports = {
  getFormOptions,
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  separateEmployee,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  listDocuments,
  addDocument,
  deleteDocument
};
