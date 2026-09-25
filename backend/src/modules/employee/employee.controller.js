const path = require('path');
const fs = require('fs');
const service = require('./employee.service');
const asyncHandler = require('../../utils/asyncHandler');

const getFormOptions = asyncHandler(async (req, res) => {
  const data = await service.getFormOptions();
  res.json({ status: 'success', data });
});

const listEmployees = asyncHandler(async (req, res) => {
  const { data, total, page, limit } = await service.listEmployees(req.query);
  res.json({ status: 'success', data, total, page, limit });
});

const getEmployee = asyncHandler(async (req, res) => {
  const data = await service.getEmployeeById(req.params.id);
  res.json({ status: 'success', data });
});

const createEmployee = asyncHandler(async (req, res) => {
  const data = await service.createEmployee(req.body);
  res.status(201).json({ status: 'success', data });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const data = await service.updateEmployee(req.params.id, req.body);
  res.json({ status: 'success', data });
});

const separateEmployee = asyncHandler(async (req, res) => {
  const data = await service.separateEmployee(req.params.id, req.body);
  res.json({ status: 'success', data });
});

const addEmergencyContact = asyncHandler(async (req, res) => {
  const data = await service.addEmergencyContact(req.params.id, req.body);
  res.status(201).json({ status: 'success', data });
});

const updateEmergencyContact = asyncHandler(async (req, res) => {
  await service.updateEmergencyContact(req.params.contactId, req.body);
  res.json({ status: 'success', message: 'Emergency contact updated' });
});

const deleteEmergencyContact = asyncHandler(async (req, res) => {
  await service.deleteEmergencyContact(req.params.contactId);
  res.json({ status: 'success', message: 'Emergency contact deleted' });
});

const listDocuments = asyncHandler(async (req, res) => {
  const data = await service.listDocuments(req.params.id);
  res.json({ status: 'success', data });
});

const addDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'A file is required' });
  }
  const filePath = `/uploads/employee-documents/${req.file.filename}`;
  const data = await service.addDocument(req.params.id, {
    document_type_id: req.body.document_type_id,
    file_path: filePath
  });
  res.status(201).json({ status: 'success', data });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const filePath = await service.deleteDocument(req.params.docId);
  if (filePath) {
    const absolutePath = path.join(__dirname, '..', '..', '..', filePath);
    fs.unlink(absolutePath, () => {});
  }
  res.json({ status: 'success', message: 'Document deleted' });
});

module.exports = {
  getFormOptions,
  listEmployees,
  getEmployee,
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
