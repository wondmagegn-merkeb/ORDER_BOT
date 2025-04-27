const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/view/categoryController');

router.get('/', categoryController.listCategories);
router.get('/add', categoryController.showAddForm);
router.get('/edit/:id', categoryController.showEditForm);

module.exports = router;
