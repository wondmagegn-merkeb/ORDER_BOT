const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/view/categoryController');

// Route to list all categories in the view
router.get('/', categoryController.listCategories);

// Route to show the form to add a new category
router.get('/add', categoryController.showAddForm);

// Route to show the form to edit an existing category
router.get('/edit/:id', categoryController.showEditForm);

module.exports = router;
