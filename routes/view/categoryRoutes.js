const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/view/categoryController');

// View Routes
router.get('/', categoryController.getAllCategories);
router.get('/add', categoryController.showAddForm);           // Optional form
router.get('/edit/:id', categoryController.showEditForm);     // Edit form

module.exports = router;
