const incrementService = require('./increment.service');

async function listPolicies(req, res, next) {
  try { res.json({ status: 'success', data: await incrementService.getAllPolicies() }); }
  catch (err) { next(err); }
}

async function createPolicy(req, res, next) {
  try {
    const { name, type, value, eligibility_criteria } = req.body;
    if (!name || !type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'name, type and value are required' });
    }
    const policy = await incrementService.createPolicy({ name, type, value, eligibility_criteria });
    res.status(201).json({ status: 'success', data: policy });
  } catch (err) { next(err); }
}

async function previewIncrement(req, res, next) {
  try {
    const { employee_id, policy_id } = req.query;
    if (!employee_id || !policy_id) {
      return res.status(400).json({ status: 'error', message: 'employee_id and policy_id are required' });
    }
    const preview = await incrementService.previewIncrement(employee_id, policy_id);
    res.json({ status: 'success', data: preview });
  } catch (err) { next(err); }
}

async function createIncrement(req, res, next) {
  try {
    const { employee_id, policy_id, revised_salary, effective_date } = req.body;
    if (!employee_id || !effective_date || (!policy_id && !revised_salary)) {
      return res.status(400).json({
        status: 'error',
        message: 'employee_id, effective_date and either policy_id or revised_salary are required'
      });
    }
    const increment = await incrementService.createIncrement({ employee_id, policy_id, revised_salary, effective_date });
    res.status(201).json({ status: 'success', data: increment });
  } catch (err) { next(err); }
}

async function generateBulkIncrement(req, res, next) {
  try {
    const { policy_id, department_id, grade_id, effective_date } = req.body;
    if (!policy_id || !effective_date) {
      return res.status(400).json({ status: 'error', message: 'policy_id and effective_date are required' });
    }
    const result = await incrementService.generateBulkIncrement({ policy_id, department_id, grade_id, effective_date });
    res.status(201).json({ status: 'success', data: result });
  } catch (err) { next(err); }
}

async function listIncrements(req, res, next) {
  try {
    const { employee_id, status } = req.query;
    res.json({ status: 'success', data: await incrementService.getAllIncrements({ employee_id, status }) });
  } catch (err) { next(err); }
}

async function getIncrement(req, res, next) {
  try { res.json({ status: 'success', data: await incrementService.getIncrementById(req.params.id) }); }
  catch (err) { next(err); }
}

async function updateIncrementStatus(req, res, next) {
  try {
    const { status, approved_by } = req.body; // TODO: replace approved_by with req.user.id once auth middleware exists
    if (!status) {
      return res.status(400).json({ status: 'error', message: 'status is required' });
    }
    const increment = await incrementService.updateIncrementStatus(req.params.id, status, approved_by || null);
    res.json({ status: 'success', data: increment });
  } catch (err) { next(err); }
}

async function getEmployeeHistory(req, res, next) {
  try { res.json({ status: 'success', data: await incrementService.getIncrementHistoryForEmployee(req.params.employeeId) }); }
  catch (err) { next(err); }
}

module.exports = {
  listPolicies, createPolicy, previewIncrement, createIncrement,
  generateBulkIncrement, listIncrements, getIncrement, updateIncrementStatus, getEmployeeHistory,
};
