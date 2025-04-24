const express = require('express');
const router = express.Router();
const userController = require('../../controllers/view/userController');

// Route to list all categories in the view
router.get('/', userController.listUsers);

// Route to show the form to edit an existing category
router.post('/edit/:id', userController.showEditForm);

module.exports = router;
