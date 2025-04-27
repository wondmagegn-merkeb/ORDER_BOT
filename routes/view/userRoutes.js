const express = require('express');
const router = express.Router();
const userController = require('../../controllers/view/userController');

router.get('/', userController.listUsers);
router.get('/edit/:id', userController.showEditForm);

module.exports = router;
