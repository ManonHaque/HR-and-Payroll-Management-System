const bonusService = require('./bonus.service');

async function listBonusTypes(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getAllBonusTypes() }); }
  catch (err) { next(err); }
}

async function createBonusType(req, res, next) {
  try {
    const { name, calculation_type, value } = req.body;
    if (!name || !calculation_type || value === undefined) {
      return res.status(400).json({ status: 'error', message: 'name, calculation_type and value are required' });
    }
    res.status(201).json({ status: 'success', data: await bonusService.createBonusType({ name, calculation_type, value }) });
  } catch (err) { next(err); }
}

async function generateBonusRun(req, res, next) {
  try {
    const { bonus_type_id, run_date, department_id, grade_id } = req.body;
    if (!bonus_type_id || !run_date) {
      return res.status(400).json({ status: 'error', message: 'bonus_type_id and run_date are required' });
    }
    const run = await bonusService.generateBonusRun({ bonus_type_id, run_date, department_id, grade_id });
    res.status(201).json({ status: 'success', data: run });
  } catch (err) { next(err); }
}

async function listBonusRuns(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getAllBonusRuns() }); }
  catch (err) { next(err); }
}

async function getBonusRun(req, res, next) {
  try { res.json({ status: 'success', data: await bonusService.getBonusRunById(req.params.id) }); }
  catch (err) { next(err); }
}

async function adjustEmployeeBonus(req, res, next) {
  try {
    const { amount } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ status: 'error', message: 'amount is required' });
    }
    res.json({ status: 'success', data: await bonusService.adjustEmployeeBonus(req.params.employeeBonusId, amount) });
  } catch (err) { next(err); }
}

async function updateBonusRunStatus(req, res, next) {
  try {
    res.json({ status: 'success', data: await bonusService.updateBonusRunStatus(req.params.id, req.body.status) });
  } catch (err) { next(err); }
}

module.exports = {
  listBonusTypes, createBonusType, generateBonusRun,
  listBonusRuns, getBonusRun, adjustEmployeeBonus, updateBonusRunStatus,
};
