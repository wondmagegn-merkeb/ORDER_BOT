
const express = require('express');
const router = express.Router();
const adminViewController = require('../../controllers/view/adminViewController');

router.get('/', adminViewController.listAdmins);
router.get('/add', adminViewController.showAddForm);
router.get('/edit/:id', adminViewController.showEditForm);

module.exports = router;
