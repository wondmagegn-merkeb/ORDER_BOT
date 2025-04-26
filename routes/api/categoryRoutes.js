const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/api/categoryController'); // Adjust path if necessary

router.post('/', categoryController.createCategory);
router.post('/:id', categoryController.updateCategory);
router.post('/delete/:id', categoryController.deleteCategory);

module.exports = router;
