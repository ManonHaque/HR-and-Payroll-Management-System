const deductionService = require('./deduction.service');

async function listDeductionTypes(req, res, next) {
  try { res.json({ status: 'success', data: await deductionService.getAllDeductionTypes() }); }
  catch (err) { next(err); }
}

async function createDeductionType(req, res, next) {
  try {
    const { name, is_statutory, calculation_type, value } = req.body;
    if (!name || !calculation_type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'name, calculation_type and value are required' });
    }
    const type = await deductionService.createDeductionType({ name, is_statutory, calculation_type, value });
    res.status(201).json({ status: 'success', data: type });
  } catch (err) { next(err); }
}

async function assignDeduction(req, res, next) {
  try {
    const { employee_id, grade_id, deduction_type_id, value } = req.body;
    if (!deduction_type_id) {
      return res.status(400).json({ status: 'error', message: 'deduction_type_id is required' });
    }
    if (!employee_id && !grade_id) {
      return res.status(400).json({ status: 'error', message: 'Provide either employee_id (individual) or grade_id (bulk)' });
    }
    const result = employee_id
      ? await deductionService.assignToEmployee({ employee_id, deduction_type_id, value })
      : await deductionService.assignByGrade({ grade_id, deduction_type_id, value });
    res.status(201).json({ status: 'success', data: result });
  } catch (err) { next(err); }
}

async function getEmployeeDeductions(req, res, next) {
  try { res.json({ status: 'success', data: await deductionService.getDeductionsForEmployee(req.params.employeeId) }); }
  catch (err) { next(err); }
}

async function getEmployeeDeductionTotal(req, res, next) {
  try {
    const { basicSalary } = req.query;
    if (!basicSalary) {
      return res.status(400).json({ status: 'error', message: 'basicSalary query param is required' });
    }
    const total = await deductionService.calculateTotalDeductionForEmployee(req.params.employeeId, Number(basicSalary));
    res.json({ status: 'success', data: { employee_id: Number(req.params.employeeId), total_deduction: total } });
  } catch (err) { next(err); }
}

async function updateDeduction(req, res, next) {
  try {
    const { value } = req.body;
    if (value === undefined) {
      return res.status(400).json({ status: 'error', message: 'value is required' });
    }
    res.json({ status: 'success', data: await deductionService.updateEmployeeDeduction(req.params.id, value) });
  } catch (err) { next(err); }
}

async function removeDeduction(req, res, next) {
  try { res.json({ status: 'success', data: await deductionService.removeDeduction(req.params.id) }); }
  catch (err) { next(err); }
}

module.exports = {
  listDeductionTypes, createDeductionType, assignDeduction,
  getEmployeeDeductions, getEmployeeDeductionTotal, updateDeduction, removeDeduction,
};
