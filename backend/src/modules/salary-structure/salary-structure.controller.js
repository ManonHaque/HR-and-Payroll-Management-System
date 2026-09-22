const salaryStructureService = require('./salary-structure.service');

async function listTemplates(req, res, next) {
  try { res.json({ status: 'success', data: await salaryStructureService.getAllTemplates() }); }
  catch (err) { next(err); }
}

async function getTemplate(req, res, next) {
  try { res.json({ status: 'success', data: await salaryStructureService.getTemplateById(req.params.id) }); }
  catch (err) { next(err); }
}

async function createTemplate(req, res, next) {
  try {
    const { grade_id, basic_percentage, hra_percentage } = req.body;
    if (!grade_id || basic_percentage === undefined || hra_percentage === undefined) {
      return res.status(400).json({ status: 'error', message: 'grade_id, basic_percentage and hra_percentage are required' });
    }
    const template = await salaryStructureService.createTemplate({ grade_id, basic_percentage, hra_percentage });
    res.status(201).json({ status: 'success', data: template });
  } catch (err) { next(err); }
}

async function updateTemplate(req, res, next) {
  try {
    const { basic_percentage, hra_percentage } = req.body;
    const template = await salaryStructureService.updateTemplate(req.params.id, { basic_percentage, hra_percentage });
    res.json({ status: 'success', data: template });
  } catch (err) { next(err); }
}

async function deleteTemplate(req, res, next) {
  try { res.json({ status: 'success', data: await salaryStructureService.deleteTemplate(req.params.id) }); }
  catch (err) { next(err); }
}

async function calculateForEmployee(req, res, next) {
  try { res.json({ status: 'success', data: await salaryStructureService.calculateStructureForEmployee(req.params.employeeId) }); }
  catch (err) { next(err); }
}

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate, calculateForEmployee };
