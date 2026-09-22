const express = require('express');
const router = express.Router();
const controller = require('./employee.controller');
const upload = require('./employee.upload');

router.get('/form-options', controller.getFormOptions);

router.get('/', controller.listEmployees);
router.post('/', controller.createEmployee);

router.get('/:id', controller.getEmployee);
router.put('/:id', controller.updateEmployee);
router.put('/:id/separation', controller.separateEmployee);

router.get('/:id/documents', controller.listDocuments);
router.post('/:id/documents', upload.single('file'), controller.addDocument);
router.delete('/documents/:docId', controller.deleteDocument);

router.post('/:id/emergency-contacts', controller.addEmergencyContact);
router.put('/emergency-contacts/:contactId', controller.updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', controller.deleteEmergencyContact);

module.exports = router;
