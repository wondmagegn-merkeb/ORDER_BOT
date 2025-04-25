
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/api/adminController');

router.get('/', adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.post('/:id', adminController.updateAdmin);

module.exports = router;
