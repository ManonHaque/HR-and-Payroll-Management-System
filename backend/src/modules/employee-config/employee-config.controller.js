const service = require('./employee-config.service');
const asyncHandler = require('../../utils/asyncHandler');

const getOverview = asyncHandler(async (req, res) => {
  const data = await service.getOverview();
  res.json({ status: 'success', data });
});

const getGrades = asyncHandler(async (req, res) => {
  const data = await service.listGrades();
  res.json({ status: 'success', data });
});

const createGrade = asyncHandler(async (req, res) => {
  const data = await service.createGrade(req.body);
  res.status(201).json({ status: 'success', data });
});

const updateGrade = asyncHandler(async (req, res) => {
  await service.updateGrade(req.params.id, req.body);
  res.json({ status: 'success', message: 'Grade updated' });
});

const deleteGrade = asyncHandler(async (req, res) => {
  await service.deleteGrade(req.params.id);
  res.json({ status: 'success', message: 'Grade deleted' });
});

const getSalaryTemplate = asyncHandler(async (req, res) => {
  const data = await service.getSalaryTemplate(req.params.gradeId);
  res.json({ status: 'success', data });
});

const upsertSalaryTemplate = asyncHandler(async (req, res) => {
  const data = await service.upsertSalaryTemplate(req.params.gradeId, req.body);
  res.json({ status: 'success', data });
});

const getDocumentTypes = asyncHandler(async (req, res) => {
  const data = await service.listDocumentTypes();
  res.json({ status: 'success', data });
});

const createDocumentType = asyncHandler(async (req, res) => {
  const data = await service.createDocumentType(req.body);
  res.status(201).json({ status: 'success', data });
});

const updateDocumentType = asyncHandler(async (req, res) => {
  await service.updateDocumentType(req.params.id, req.body);
  res.json({ status: 'success', message: 'Document type updated' });
});

const deleteDocumentType = asyncHandler(async (req, res) => {
  await service.deleteDocumentType(req.params.id);
  res.json({ status: 'success', message: 'Document type deleted' });
});

const getIdGeneration = asyncHandler(async (req, res) => {
  const data = await service.getIdGeneration();
  res.json({ status: 'success', data });
});

const updateIdGeneration = asyncHandler(async (req, res) => {
  const data = await service.updateIdGeneration(req.body);
  res.json({ status: 'success', data });
});

module.exports = {
  getOverview,
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getSalaryTemplate,
  upsertSalaryTemplate,
  getDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  getIdGeneration,
  updateIdGeneration
};
