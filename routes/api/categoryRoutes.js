const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/api/categoryController');

// Form POST Routes
router.post('/add', categoryController.addCategory);
router.post('/edit/:id', categoryController.updateCategory);
router.post('/delete/:id', categoryController.deleteCategory);

module.exports = router;
