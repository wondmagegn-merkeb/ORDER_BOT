
const express = require('express');
const router = express.Router();
const adminViewController = require('../../controllers/view/adminViewController');

router.get('/', adminViewController.listAdmins);
router.get('/add', adminViewController.showAddForm);
router.get('/edit/:id', adminViewController.showEditForm);
router.get('/profile', adminViewController.showProfileForm);

module.exports = router;
