const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/api/categoryController'); // Adjust path if necessary

// API endpoint to get all categories
router.get('/', categoryController.getAllCategories);

// API endpoint to get a category by ID
router.get('/:id', categoryController.getCategoryById);

// API endpoint to create a new category
router.post('/', categoryController.createCategory);

// API endpoint to update an existing category
router.post('/:id', categoryController.updateCategory);

// API endpoint to delete a category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
