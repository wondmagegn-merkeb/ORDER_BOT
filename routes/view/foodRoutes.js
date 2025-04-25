const express = require('express');
const router = express.Router();
const foodViewController = require('../../controllers/view/foodController');

router.get('/', foodViewController.renderFoodList);
router.get('/add', foodViewController.renderCreateForm); // Show form
router.get('/edit/:id', foodViewController.renderUpdateForm); // Show form
module.exports = router;
