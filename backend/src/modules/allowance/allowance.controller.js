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
